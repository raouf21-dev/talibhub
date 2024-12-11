import { api } from './dynamicLoader.js';

export class MosqueTimeManager {
    constructor() {
        this.currentMosques = [];
        this.sortOrder = 'asc';
        this.selectedCity = '';
        
        document.addEventListener('languageChanged', (event) => {
            console.log('Language changed to:', event.detail.language);
            this.updateDateDisplay();
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
            } else {
                console.log('Les données pour la date actuelle existent déjà.');
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
            const response = await api.get('/mosque-times/user/selected-city');
            const { city } = response;
            if (city) {
                const citySelect = document.getElementById('mosquetime-location-select');
                if (citySelect) {
                    citySelect.value = city;
                    this.selectedCity = city;
                    await this.handleCitySelection(city);
                    this.updateDateDisplay();
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la dernière ville sélectionnée:', error);
        }
    }

    populateMosqueSelectByCity(mosques) {
        const select = document.getElementById('mosquetime-mosque-select');
        if (!select) {
            console.error('Élément mosquetime-mosque-select non trouvé');
            return;
        }

        select.innerHTML = '';
        mosques.forEach(mosque => {
            const option = document.createElement('option');
            option.value = mosque.id;
            option.textContent = mosque.name;
            select.appendChild(option);
        });
    }

    async handleCitySelection(city) {
        try {
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
                
            this.populateMosqueSelectByCity(this.currentMosques);
                
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
            
            if (city) {
                localStorage.setItem('lastSelectedCity', city);
            }
        }
    }

    async updateSingleMosqueTimes() {
        const select = document.getElementById('mosquetime-mosque-select');
        const tbody = document.getElementById('mosquetime-single-mosque-times');
        if (!select || !tbody) return;

        const date = document.getElementById('mosquetime-date-picker')?.value 
            || new Date().toISOString().split('T')[0];

        try {
            const times = await api.get(`/mosque-times/${select.value}/${date}`);
            
            tbody.innerHTML = '';
            for (const [prayer, time] of Object.entries(times)) {
                if (prayer !== 'id' && prayer !== 'mosque_id' && prayer !== 'date') {
                    const row = tbody.insertRow();
                    row.insertCell(0).textContent = prayer.charAt(0).toUpperCase() + prayer.slice(1);
                    row.insertCell(1).textContent = time ? time : 'Non disponible';
                }
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des horaires:', error);
            this.displayError('Aucun horaire disponible pour cette date.');
            tbody.innerHTML = '';
        }
    }

    updateAllMosques() {
        const container = document.getElementById('mosquetime-all-mosques-list');
        if (!container) return;

        container.innerHTML = '';
        
        const mainPrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const additionalPrayers = ['jumuah1', 'jumuah2', 'jumuah3', 'tarawih'];
        
        this.currentMosques.forEach(mosque => {
            const card = document.createElement('div');
            card.className = 'mosquetime-mosque-card';
            let prayerTimesHtml = '';

            const prayerTimes = mosque.prayerTimes || {};
            
            mainPrayers.forEach(prayer => {
                const time = prayerTimes[prayer] ? prayerTimes[prayer].substring(0, 5) : 'Non disponible';
                prayerTimesHtml += `
                    <tr>
                        <td>${prayer.charAt(0).toUpperCase() + prayer.slice(1)}</td>
                        <td>${time}</td>
                    </tr>
                `;
            });

            additionalPrayers.forEach(prayer => {
                if (prayerTimes[prayer]) {
                    const time = prayerTimes[prayer].substring(0, 5);
                    prayerTimesHtml += `
                        <tr>
                            <td>${prayer.charAt(0).toUpperCase() + prayer.slice(1)}</td>
                            <td>${time}</td>
                        </tr>
                    `;
                }
            });

            card.innerHTML = `
                <h3>${mosque.name}</h3>
                <p>${mosque.address || ''}</p>
                <table class="mosquetime-table">
                    <thead>
                        <tr>
                            <th>Prière</th>
                            <th>Horaire de Congrégation</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${prayerTimesHtml}
                    </tbody>
                </table>
            `;
            container.appendChild(card);
        });
    }

    setupEventListeners() {
        const citySelect = document.getElementById('mosquetime-location-select');
        if (citySelect) {
            citySelect.addEventListener('change', async (e) => {
                const selectedCity = e.target.value;
                if (selectedCity) {
                    this.selectedCity = selectedCity;
                    await this.handleCitySelection(selectedCity);
                }
            });
        }

        const datePicker = document.getElementById('mosquetime-date-picker');
        if (datePicker) {
            datePicker.addEventListener('change', async () => {
                this.updateDateDisplay();
                await this.updateSingleMosqueTimes();
            });
        }

        const mosqueSelect = document.getElementById('mosquetime-mosque-select');
        if (mosqueSelect) {
            mosqueSelect.addEventListener('change', () => this.updateSingleMosqueTimes());
        }

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

        const tabs = document.querySelectorAll('.mosquetime-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
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
        
        document.querySelectorAll('.mosquetime-tab-content').forEach(content => {
            const expectedId = tabName === 'single' ? 'mosquetime-single-mosque' : 'mosquetime-all-mosques';
            content.style.display = content.id === expectedId ? 'block' : 'none';
        });

        if (this.selectedCity) {
            this.handleCitySelection(this.selectedCity);
        }
    }

    updateDateDisplay() {
        const datePicker = document.getElementById('mosquetime-date-picker');
        const cityDateElement = document.getElementById('mosquetime-city-date');
        const citySelect = document.getElementById('mosquetime-location-select');
        if (!datePicker || !cityDateElement || !citySelect) return;

        const currentLang = localStorage.getItem('userLang');
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

    displayError(message) {
        const errorElement = document.getElementById('mosquetime-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }
}

const mosqueTimeManager = new MosqueTimeManager();
export const initializeMosqueTime = () => mosqueTimeManager.initialize();