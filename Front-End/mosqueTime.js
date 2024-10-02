// mosqueTime.js

let currentMosques = [];
let sortOrder = 'asc';
let selectedCity = ''; // Variable pour stocker la ville sélectionnée

export async function init() {
    console.log('Initializing mosqueTime module');

    // Initialiser le date picker à la date du jour
    const datePicker = document.getElementById('mosquetime-date-picker');
    if (datePicker) {
        const today = new Date().toISOString().split('T')[0];
        datePicker.value = today;
    }

    // Mettre à jour l'affichage de la date
    updateDateDisplay();

    setupEventListeners();
    await loadCities(); // Charger les villes après le scraping
}

async function triggerScraping() {
    try {
        displayLoading(true); // Afficher un indicateur de chargement
        const token = localStorage.getItem('token');
        console.log('Triggering scraping with token:', token);
        const response = await fetch('http://localhost:3000/mosque-times/scrape', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Scraping response status:', response.status);
        if (!response.ok) {
            throw new Error(`Erreur lors du scraping: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Scraping completed:', data.message);
    } catch (error) {
        console.error('Erreur lors du déclenchement du scraping:', error);
        displayError('Une erreur est survenue lors du scraping. Veuillez réessayer plus tard.');
    } finally {
        displayLoading(false); // Cacher l'indicateur de chargement
    }
}

function displayLoading(isLoading) {
    const loadingElement = document.getElementById('mosquetime-loading');
    if (loadingElement) {
        loadingElement.style.display = isLoading ? 'block' : 'none';
    }
}


async function loadCities() {
    try {
        const token = localStorage.getItem('token'); // Utiliser 'token' comme clé
        console.log('Token:', token); // Vérifier le token
        const response = await fetch(`http://localhost:3000/mosque-times/cities/search?query=`, {
            headers: {
                'Authorization': `Bearer ${token}` // Inclure le token
            }
        });
        console.log('Response status:', response.status); // Vérifier le statut de la réponse
        if (!response.ok) {
            throw new Error(`Erreur: ${response.status} ${response.statusText}`);
        }
        const cities = await response.json();
        console.log('Cities received:', cities); // Vérifier les villes reçues
        populateCitySelect(cities);
    } catch (error) {
        console.error('Erreur lors du chargement des villes:', error);
        displayError('Impossible de charger les villes. Veuillez réessayer plus tard.');
    }
}

function populateCitySelect(cities) {
    console.log('Populating city select with:', cities); // Vérifier les villes à peupler
    const select = document.getElementById('mosquetime-location-select');
    select.innerHTML = '<option value="">Sélectionnez une ville</option>'; // Option par défaut
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        select.appendChild(option);
    });
}

async function fetchMosquesByCity(city) {
    try {
        const token = localStorage.getItem('token'); // Utiliser 'token' comme clé
        console.log('Fetching mosques for city:', city, 'with token:', token);
        const response = await fetch(`http://localhost:3000/mosque-times/cities/${encodeURIComponent(city)}/mosques`, {
            headers: {
                'Authorization': `Bearer ${token}` // Inclure le token
            }
        });
        console.log('Mosques Fetch Response Status:', response.status);
        if (!response.ok) {
            throw new Error(`Erreur: ${response.status} ${response.statusText}`);
        }
        const mosques = await response.json();
        console.log('Mosques received:', mosques);
        return mosques;
    } catch (error) {
        console.error('Erreur lors de la récupération des mosquées:', error);
        displayError('Impossible de récupérer les mosquées pour la ville sélectionnée. Veuillez réessayer plus tard.');
        return [];
    }
}

function populateMosqueSelectByCity(mosques) {
    const select = document.getElementById('mosquetime-mosque-select');
    select.innerHTML = '';
    mosques.forEach(mosque => {
        const option = document.createElement('option');
        option.value = mosque.id;
        option.textContent = mosque.name;
        select.appendChild(option);
    });
}

async function updateSingleMosqueTimes() {
    const select = document.getElementById('mosquetime-mosque-select');
    const tbody = document.getElementById('mosquetime-single-mosque-times');
    const date = document.getElementById('mosquetime-date-picker').value || new Date().toISOString().split('T')[0];

    try {
        const token = localStorage.getItem('token');
        console.log('Fetching prayer times for mosqueId:', select.value, 'with token:', token);
        const response = await fetch(`http://localhost:3000/mosque-times/${select.value}/${date}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Prayer Times Response Status:', response.status);
        if (!response.ok) {
            throw new Error('Échec de la récupération des horaires de prière');
        }
        const times = await response.json();
        console.log('Prayer Times:', times);

        tbody.innerHTML = '';
        for (const [prayer, time] of Object.entries(times)) {
            if (prayer !== 'id' && prayer !== 'mosque_id' && prayer !== 'date' && time) {
                const row = tbody.insertRow();
                row.insertCell(0).textContent = prayer.charAt(0).toUpperCase() + prayer.slice(1);
                row.insertCell(1).textContent = time;
            }
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des horaires de prière:', error);
        displayError('Aucun horaire de prière disponible pour cette date. Veuillez sélectionner une autre date.');
    }
}


function updateAllMosques() {
    const container = document.getElementById('mosquetime-all-mosques-list');
    container.innerHTML = '';
    currentMosques.forEach(mosque => {
        const card = document.createElement('div');
        card.className = 'mosquetime-mosque-card';
        let prayerTimesHtml = '';
        if (mosque.prayerTimes) {
            prayerTimesHtml = Object.entries(mosque.prayerTimes)
                .filter(([key, value]) => key !== 'id' && key !== 'mosque_id' && key !== 'date')
                .map(([prayer, time]) => `
                    <tr>
                        <td>${prayer.charAt(0).toUpperCase() + prayer.slice(1)}</td>
                        <td>${time}</td>
                    </tr>
                `).join('');
        }
        card.innerHTML = `
            <h3>${mosque.name} <span>${mosque.distance ? mosque.distance.toFixed(1) + ' km away' : ''}</span></h3>
            <table class="mosquetime-table">
                <thead>
                    <tr>
                        <th>Prayer</th>
                        <th>Congregational Time</th>
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

function setupEventListeners() {
    // Écouteur pour utiliser la localisation actuelle
    const useLocationBtn = document.getElementById('mosquetime-use-location');
    if (useLocationBtn) {
        useLocationBtn.addEventListener('click', handleUseCurrentLocation);
    }

    // Écouteur pour le bouton de recherche
    const searchBtn = document.getElementById('mosquetime-search');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleLocationSearch);
    }

    // Écouteur pour la sélection d'une ville
    const citySelect = document.getElementById('mosquetime-location-select');
    citySelect.addEventListener('change', async (e) => {
        const selectedCity = e.target.value;
        if (selectedCity) {
            console.log('Ville sélectionnée:', selectedCity);
            await handleCitySelection(selectedCity);
        }
    });

    // Écouteur pour la sélection d'une mosquée
    const mosqueSelect = document.getElementById('mosquetime-mosque-select');
    if (mosqueSelect) {
        mosqueSelect.addEventListener('change', updateSingleMosqueTimes);
    }

    // Écouteurs pour le tri
    const sortAscBtn = document.getElementById('mosquetime-sort-asc');
    if (sortAscBtn) {
        sortAscBtn.addEventListener('click', () => handleSort('asc'));
    }

    const sortDescBtn = document.getElementById('mosquetime-sort-desc');
    if (sortDescBtn) {
        sortDescBtn.addEventListener('click', () => handleSort('desc'));
    }

    const sortNearestBtn = document.getElementById('mosquetime-sort-nearest');
    if (sortNearestBtn) {
        sortNearestBtn.addEventListener('click', () => handleSort('nearest'));
    }

    // Écouteurs pour le partage et les rappels
    const shareBtn = document.getElementById('mosquetime-share');
    if (shareBtn) {
        shareBtn.addEventListener('click', handleShare);
    }

    const remindersBtn = document.getElementById('mosquetime-reminders');
    if (remindersBtn) {
        remindersBtn.addEventListener('click', handleSetReminders);
    }

    // Écouteurs pour les onglets
    const tabs = document.querySelectorAll('.mosquetime-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Écouteur pour le changement de date
    const datePicker = document.getElementById('mosquetime-date-picker');
    if (datePicker) {
        datePicker.addEventListener('change', async (event) => {
            updateDateDisplay();
            await updateSingleMosqueTimes();
        });
    }
}

async function handleCitySelection(city) {
    const activeTab = document.querySelector('.mosquetime-tab.active').dataset.tab;
  
    // Déclencher le scraping pour la ville sélectionnée
    try {
      displayLoading(true); // Afficher un indicateur de chargement
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/mosque-times/scrape/${encodeURIComponent(city)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Erreur lors du scraping: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Scraping terminé:', data.message);
    } catch (error) {
      console.error('Erreur lors du déclenchement du scraping:', error);
      displayError('Une erreur est survenue lors du scraping. Veuillez réessayer plus tard.');
    } finally {
      displayLoading(false); // Cacher l'indicateur de chargement
    }
  
    // Récupérer les mosquées et mettre à jour l'affichage
    if (activeTab === 'single') {
      try {
        const mosques = await fetchMosquesByCity(city);
        populateMosqueSelectByCity(mosques);
        if (mosques.length > 0) {
          document.getElementById('mosquetime-mosque-select').value = mosques[0].id;
          await updateSingleMosqueTimes();
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des mosquées par ville:', error);
        displayError('Impossible de récupérer les mosquées pour la ville sélectionnée. Veuillez réessayer plus tard.');
      }
    } else if (activeTab === 'all') {
      try {
        const mosques = await fetchMosquesByCity(city);
        currentMosques = mosques;
        updateAllMosques();
      } catch (error) {
        console.error('Erreur lors de la récupération des mosquées par ville:', error);
        displayError('Impossible de récupérer les mosquées pour la ville sélectionnée. Veuillez réessayer plus tard.');
      }
    }
  }
  

async function handleUseCurrentLocation() {
    console.log('Utilisation de la localisation actuelle');
    // Implémenter la logique de géolocalisation ici
}

async function handleLocationSearch() {
    const select = document.getElementById('mosquetime-location-select');
    const city = select.value;
    if (city) {
        selectedCity = city;
        await handleCitySelection(city);
    } else {
        displayError('Veuillez sélectionner une ville.');
    }
}

async function handleDateChange(event) {
    const date = new Date(event.target.value);
    document.getElementById('mosquetime-city-date').textContent = `Prayer Times for ${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    await updateSingleMosqueTimes();
    await fetchMosques(); // Rafraîchir toutes les données des mosquées si nécessaire
    updateAllMosques();
}

function handleSort(order) {
    sortOrder = order;
    if (order === 'asc') {
        currentMosques.sort((a, b) => a.name.localeCompare(b.name));
    } else if (order === 'desc') {
        currentMosques.sort((a, b) => b.name.localeCompare(a.name));
    } else if (order === 'nearest') {
        currentMosques.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }
    updateAllMosques();
}

function switchTab(tabName) {
    document.querySelectorAll('.mosquetime-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    document.querySelectorAll('.mosquetime-tab-content').forEach(content => {
        content.style.display = content.id === `mosquetime-${tabName}-mosque` ? 'block' : 'none';
    });

    // Mettre à jour les mosquées affichées en fonction de la ville sélectionnée
    if (selectedCity) {
        handleCitySelection(selectedCity);
    }
}

function handleShare() {
    console.log('Sharing prayer times');
    // Implémenter la fonctionnalité de partage ici
}

function handleSetReminders() {
    console.log('Setting reminders');
    // Implémenter la fonctionnalité de rappels ici
}

function displayError(message) {
    const errorElement = document.getElementById('mosquetime-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function updateDateDisplay() {
    const datePicker = document.getElementById('mosquetime-date-picker');
    const cityDateElement = document.getElementById('mosquetime-city-date');
    const citySelect = document.getElementById('mosquetime-location-select');
    const selectedCity = citySelect.options[citySelect.selectedIndex]?.textContent || 'Votre Ville';
    const selectedDate = new Date(datePicker.value || new Date());
    const dateString = selectedDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    cityDateElement.textContent = `${selectedCity}, ${dateString}`;
}


// Appelez cette fonction lors du changement de date
const datePicker = document.getElementById('mosquetime-date-picker');
if (datePicker) {
    datePicker.addEventListener('change', async (event) => {
        updateDateDisplay();
        await updateSingleMosqueTimes();
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);
