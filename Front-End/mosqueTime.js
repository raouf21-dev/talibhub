import { api } from './dynamicLoader.js';

export class MosqueTimeManager {
    constructor() {
        this.currentMosques = [];
        this.sortOrder = 'asc';
        this.selectedCity = '';
        
        document.addEventListener('languageChanged', (event) => {
            console.log('Language changed to:', event.detail.language);
            this.updateDateDisplay();
            this.populateMosqueSelect(this.currentMosques); // Mettre à jour le select
            if (!document.getElementById('mosquetime-mosque-select').value) {
                this.updateSingleMosqueTimes(); // Mettre à jour la card par défaut
            }
        });
    }

    async initialize() {
        console.log('Initializing mosqueTime module');
        this.initializeDatePicker();
        this.updateDateDisplay();
        await this.checkAndUpdateData();
        this.setupEventListeners();
        await this.loadCities();
        await this.loadLastSelectedCity();
    }

    initializeDatePicker() {
        const datePicker = document.getElementById('mosquetime-date-picker');
        if (datePicker) {
            const today = new Date().toISOString().split('T')[0];
            datePicker.value = today;
        }
    }

    async checkAndUpdateData() {
        try {
            const date = new Date().toISOString().split('T')[0];
            const dataExists = await api.get(`/mosque-times/exists/${date}`);
            
            if (!dataExists.exists) {
                await this.triggerScrapingForAllCities();
            }
        } catch (error) {
            console.error('Erreur lors de la vérification des données:', error);
        }
    }

    async triggerScrapingForAllCities() {
        try {
            const data = await api.post('/mosque-times/scrape-all');
            console.log('Scraping completed:', data.message);
        } catch (error) {
            console.error('Erreur lors du scraping:', error);
            this.displayError('Une erreur est survenue lors du scraping.');
        }
    }

    async loadCities() {
        try {
            const cities = await api.get('/mosque-times/cities/search?query=');
            this.populateCitySelect(cities);
        } catch (error) {
            console.error('Erreur lors du chargement des villes:', error);
            this.displayError('Impossible de charger les villes.');
        }
    }

    populateCitySelect(cities) {
        const select = document.getElementById('mosquetime-location-select');
        if (!select) return;
        
        select.innerHTML = '<option value="">Sélectionnez une ville</option>';
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            select.appendChild(option);
        });
    }

    async loadLastSelectedCity() {
        try {
            const lastCity = localStorage.getItem('lastSelectedCity');
            if (lastCity) {
                await this.handleCitySelection(lastCity);
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la dernière ville:', error);
        }
    }

    updateDateDisplay() {
        const datePicker = document.getElementById('mosquetime-date-picker');
        const cityDateElement = document.getElementById('mosquetime-city-date');
        const citySelect = document.getElementById('mosquetime-location-select');
        
        if (!datePicker || !cityDateElement || !citySelect) return;

        const currentLang = localStorage.getItem('userLang') || 'fr';
        const locale = currentLang === 'en' ? 'en-US' : 'fr-FR';

        const selectedCityName = citySelect.options[citySelect.selectedIndex]?.textContent || 
            (locale === 'en-US' ? 'Your City' : 'Votre Ville');
        
        const selectedDate = new Date(datePicker.value || new Date());
        
        const dateString = selectedDate.toLocaleDateString(locale, { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        cityDateElement.textContent = `${selectedCityName}, ${dateString}`;
    }

    populateMosqueSelect(mosques) {
        const select = document.getElementById('mosquetime-mosque-select');
        if (!select) return;
        
        const currentLang = localStorage.getItem('userLang') || 'fr';
        const defaultText = currentLang === 'en' ? 'Select a mosque' : 'Sélectionnez une mosquée';
        
        select.innerHTML = `<option value="">${defaultText}</option>`;
        mosques.forEach(mosque => {
            const option = document.createElement('option');
            option.value = mosque.id;
            option.textContent = mosque.name;
            select.appendChild(option);
        });
    }

    updateAllMosques() {
        const container = document.getElementById('mosquetime-all-mosques-list');
        if (!container) return;

        container.innerHTML = '';
        
        this.currentMosques.forEach(mosque => {
            const prayerTimes = mosque.prayerTimes || {};
            const card = document.createElement('div');
            card.className = 'mosquetime-mosque-card';
            
            // Prières principales
            const mainPrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
            let mainPrayerTimesHTML = mainPrayers.map(prayer => `
                <div class="prayer-item">
                    <div class="prayer-label">${prayer.charAt(0).toUpperCase() + prayer.slice(1)}</div>
                    <div class="jamaa-time">${prayerTimes[prayer] || '--:--'}</div>
                </div>
            `).join('');

            // Prières additionnelles
            const additionalPrayers = ['jumuah1', 'jumuah2', 'jumuah3', 'jumuah4', 'tarawih'];
            let additionalPrayerTimesHTML = additionalPrayers.map(prayer => `
                <div class="prayer-item">
                    <div class="prayer-label">${prayer.charAt(0).toUpperCase() + prayer.slice(1)}</div>
                    <div class="jamaa-time">${prayerTimes[prayer] || '--:--'}</div>
                </div>
            `).join('');

            card.innerHTML = `
                <div class="mosque-header">
                    <div class="mosque-image"></div>
                    <h3 class="mosque-name">${mosque.name}</h3>
                </div>
                <div class="prayer-times-grid">
                    ${mainPrayerTimesHTML}
                </div>
                <div class="additional-times-grid">
                    ${additionalPrayerTimesHTML}
                </div>
            `;
            
            container.appendChild(card);
        });
    }

    async updateSingleMosqueTimes() {
        const select = document.getElementById('mosquetime-mosque-select');
        const container = document.getElementById('mosquetime-single-mosque');
        if (!select || !container) return;
    
        let mosqueCard = container.querySelector('.mosquetime-mosque-card');
        if (!mosqueCard) {
            mosqueCard = document.createElement('div');
            mosqueCard.className = 'mosquetime-mosque-card';
            container.appendChild(mosqueCard);
        }
    
        const currentLang = localStorage.getItem('userLang') || 'fr';
        const defaultText = currentLang === 'en' ? 'Select a mosque' : 'Sélectionnez une mosquée';
    
        // Si aucune mosquée n'est sélectionnée, afficher le template par défaut
        if (!select.value) {
            mosqueCard.innerHTML = `
                <div class="mosque-header">
                    <div class="mosque-image"></div>
                    <div class="mosque-info">
                        <h3 class="mosque-name">${defaultText}</h3>
                    </div>
                </div>
                <div class="prayer-times-grid">
                    ${['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(prayer => `
                        <div class="prayer-item">
                            <div class="prayer-label">${prayer}</div>
                            <div class="jamaa-time">--:--</div>
                        </div>
                    `).join('')}
                </div>
                <div class="additional-times-grid">
                    ${['Jumuah1', 'Jumuah2', 'Jumuah3', 'Jumuah4', 'Tarawih'].map(prayer => `
                        <div class="prayer-item">
                            <div class="prayer-label">${prayer}</div>
                            <div class="jamaa-time">--:--</div>
                        </div>
                    `).join('')}
                </div>
            `;
            return;
        }
    
    
        const date = document.getElementById('mosquetime-date-picker')?.value 
            || new Date().toISOString().split('T')[0];
    
        try {
            const times = await api.get(`/mosque-times/${select.value}/${date}`);
            const mosqueName = select.options[select.selectedIndex]?.text || '';
            
            const mainPrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
            const additionalPrayers = ['jumuah1', 'jumuah2', 'jumuah3', 'jumuah4', 'tarawih'];
    
            let mainPrayerTimesHTML = mainPrayers.map(prayer => `
                <div class="prayer-item">
                    <div class="prayer-label">${prayer.charAt(0).toUpperCase() + prayer.slice(1)}</div>
                    <div class="jamaa-time">${times[prayer] || '--:--'}</div>
                </div>
            `).join('');
    
            let additionalPrayerTimesHTML = additionalPrayers.map(prayer => `
                <div class="prayer-item">
                    <div class="prayer-label">${prayer.charAt(0).toUpperCase() + prayer.slice(1)}</div>
                    <div class="jamaa-time">${times[prayer] || '--:--'}</div>
                </div>
            `).join('');
    
            mosqueCard.innerHTML = `
                <div class="mosque-header">
                    <div class="mosque-image"></div>
                    <div class="mosque-info">
                        <h3 class="mosque-name">${mosqueName}</h3>
                    </div>
                </div>
                <div class="prayer-times-grid">
                    ${mainPrayerTimesHTML}
                </div>
                <div class="additional-times-grid">
                    ${additionalPrayerTimesHTML}
                </div>
            `;
    
        } catch (error) {
            console.error('Erreur lors de la récupération des horaires:', error);
            this.displayError('Aucun horaire disponible pour cette date.');
            const mosqueName = select.options[select.selectedIndex]?.text || '';
            mosqueCard.innerHTML = `
                <div class="mosque-header">
                    <div class="mosque-image"></div>
                    <div class="mosque-info">
                        <h3 class="mosque-name">${mosqueName}</h3>
                    </div>
                </div>
                <div class="prayer-times-grid"></div>
                <div class="additional-times-grid"></div>
            `;
        }
    }

    async handleCitySelection(city) {
        try {
            if (!city) return;

            const date = document.getElementById('mosquetime-date-picker')?.value 
                || new Date().toISOString().split('T')[0];

            // Sauvegarder la ville
            await api.post('/mosque-times/user/selected-city', { city });

            this.selectedCity = city;
            
            // Mettre à jour le select
            const citySelect = document.getElementById('mosquetime-location-select');
            if (citySelect && citySelect.value !== city) {
                citySelect.value = city;
            }
                
            // Récupérer les mosquées
            const mosques = await api.get(`/mosque-times/cities/${encodeURIComponent(city)}/mosques`);
                
            if (mosques.length === 0) {
                throw new Error('Aucune mosquée trouvée dans cette ville.');
            }
                
            // Récupérer les horaires
            const prayerTimesData = await api.get(
                `/mosque-times/cities/${encodeURIComponent(city)}/date/${date}/prayer-times`
            );
                
            if (!prayerTimesData || !prayerTimesData.prayerTimes) {
                throw new Error('Format de données invalide pour les horaires de prière');
            }

            // Mise à jour des mosquées
            this.currentMosques = mosques.map(mosque => ({
                ...mosque,
                prayerTimes: prayerTimesData.prayerTimes.find(pt => pt.mosque_id === mosque.id) || null
            }));
                
            this.populateMosqueSelect(this.currentMosques);
                
            if (this.currentMosques.length > 0) {
                const mosqueSelect = document.getElementById('mosquetime-mosque-select');
                if (mosqueSelect) {
                    mosqueSelect.value = this.currentMosques[0].id;
                    await this.updateSingleMosqueTimes();
                }
            }
                
            this.updateAllMosques();
            this.updateDateDisplay();

            localStorage.setItem('lastSelectedCity', city);
                
        } catch (error) {
            console.error('Erreur lors de la sélection de la ville:', error);
            this.displayError(error.message);
        }
    }

    handleSort(order) {
        this.sortOrder = order;
        if (order === 'asc' || order === 'desc') {
            this.currentMosques.sort((a, b) => {
                return order === 'asc' 
                    ? a.name.localeCompare(b.name) 
                    : b.name.localeCompare(a.name);
            });
        } else if (order === 'nearest') {
            this.currentMosques.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        }
        this.updateAllMosques();
    }

    switchTab(tabName) {
        document.querySelectorAll('.mosquetime-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        const singleMosqueTab = document.getElementById('mosquetime-single-mosque');
        const allMosquesTab = document.getElementById('mosquetime-all-mosques');
        
        if (tabName === 'single') {
            singleMosqueTab.style.display = 'block';
            allMosquesTab.style.display = 'none';
        } else {
            singleMosqueTab.style.display = 'none';
            allMosquesTab.style.display = 'block';
        }
    
        if (this.selectedCity) {
            this.handleCitySelection(this.selectedCity);
        }
    }

    setupEventListeners() {
        const citySelect = document.getElementById('mosquetime-location-select');
        if (citySelect) {
            citySelect.addEventListener('change', async (e) => {
                const selectedCity = e.target.value;
                if (selectedCity) {
                    await this.handleCitySelection(selectedCity);
                }
            });
        }

        const datePicker = document.getElementById('mosquetime-date-picker');
        if (datePicker) {
            datePicker.addEventListener('change', async () => {
                this.updateDateDisplay();
                await this.handleCitySelection(this.selectedCity);
            });
        }

        const mosqueSelect = document.getElementById('mosquetime-mosque-select');
    if (mosqueSelect) {
        mosqueSelect.addEventListener('change', async (e) => {
            await this.updateSingleMosqueTimes();
        });
    }

        document.querySelectorAll('.mosquetime-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        const sortButtons = {
            asc: document.getElementById('mosquetime-sort-asc'),
            desc: document.getElementById('mosquetime-sort-desc'),
            nearest: document.getElementById('mosquetime-sort-nearest')
        };

        Object.entries(sortButtons).forEach(([order, button]) => {
            if (button) {
                button.addEventListener('click', () => this.handleSort(order));
            }
        });

        // Gestionnaire d'événements pour le bouton de localisation
        const locationButton = document.getElementById('mosquetime-use-location');
        if (locationButton) {
            locationButton.addEventListener('click', () => this.handleLocationRequest());
        }

        // Gestionnaire d'événements pour le bouton de recherche
        const searchButton = document.getElementById('mosquetime-search');
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                const selectedCity = document.getElementById('mosquetime-location-select')?.value;
                if (selectedCity) {
                    this.handleCitySelection(selectedCity);
                }
            });
        }
        
    }

    reattachMosqueSelectListener() {
        const mosqueSelect = document.getElementById('mosquetime-mosque-select');
        if (mosqueSelect) {
            mosqueSelect.removeEventListener('change', this.updateSingleMosqueTimes);
            mosqueSelect.addEventListener('change', async () => {
                await this.updateSingleMosqueTimes();
            });
        }
    }

    async handleLocationRequest() {
        try {
            if (!navigator.geolocation) {
                throw new Error('La géolocalisation n\'est pas supportée par votre navigateur.');
            }

            this.displayError('Recherche de votre position...');
            
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const { latitude, longitude } = position.coords;
            
            const nearestCity = await api.get(
                `/mosque-times/cities/nearest?lat=${latitude}&lng=${longitude}`
            );

            if (nearestCity) {
                await this.handleCitySelection(nearestCity);
            } else {
                throw new Error('Aucune ville trouvée près de votre position.');
            }
            
        } catch (error) {
            console.error('Erreur de géolocalisation:', error);
            this.displayError(error.message);
        }
    }

    displayError(message) {
        const errorElement = document.getElementById('mosquetime-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }
}

const mosqueTimeManager = new MosqueTimeManager();
export const initializeMosqueTime = () => mosqueTimeManager.initialize();