// mosqueTime.js

let currentMosques = [];
let sortOrder = 'asc';
let selectedCity = ''; // Variable pour stocker la ville sélectionnée

export async function initializeMosqueTime() {
    console.log('Initializing mosqueTime module');
  
    // Initialiser le date picker à la date du jour
    const datePicker = document.getElementById('mosquetime-date-picker');
    if (datePicker) {
      const today = new Date().toISOString().split('T')[0];
      datePicker.value = today;
    }
  
    // Mettre à jour l'affichage de la date
    updateDateDisplay();
  
    // Vérifier si les données existent pour la date actuelle
    await checkAndUpdateData();
  
    setupEventListeners();
    await loadCities(); // Charger les villes après la vérification des données
}

async function checkAndUpdateData() {
  try {
    const token = localStorage.getItem('token');
    const date = new Date().toISOString().split('T')[0];

    // Vérifier si les données existent pour la date actuelle
    const response = await fetch(`/api/mosque-times/exists/${date}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const dataExists = await response.json();
      if (!dataExists.exists) {
        // Les données n'existent pas, déclencher le scraping
        await triggerScrapingForAllCities();
      } else {
        console.log('Les données pour la date actuelle existent déjà.');
      }
    } else {
      console.error('Erreur lors de la vérification des données existantes.');
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des données :', error);
  }
}

async function triggerScrapingForAllCities() {
  try {
    displayLoading(true); // Afficher un indicateur de chargement
    const token = localStorage.getItem('token');
    console.log('Déclenchement du scraping pour toutes les villes avec le token:', token);
    const response = await fetch(`/api/mosque-times/scrape-all`, {
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
    const response = await fetch(`/api/mosque-times/cities/search?query=`, {
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
    const response = await fetch(`/api/mosque-times/cities/${encodeURIComponent(city)}/mosques`, {
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
    const response = await fetch(`/api/mosque-times/${select.value}/${date}`, {
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
      if (prayer !== 'id' && prayer !== 'mosque_id' && prayer !== 'date') {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = prayer.charAt(0).toUpperCase() + prayer.slice(1);
        row.insertCell(1).textContent = time ? time : 'Non disponible';
      }
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des horaires de prière:', error);
    displayError('Aucun horaire de prière disponible pour cette date. Veuillez sélectionner une autre date.');
    // Vider le tableau des horaires
    tbody.innerHTML = '';
  }
}

function updateAllMosques() {
  console.log('updateAllMosques called');
  const container = document.getElementById('mosquetime-all-mosques-list');
  container.innerHTML = '';
  
  // Définir les prières principales
  const mainPrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  
  currentMosques.forEach(mosque => {
      console.log(`Updating mosque: ${mosque.name}`);
      const card = document.createElement('div');
      card.className = 'mosquetime-mosque-card';
      let prayerTimesHtml = '';

      if (mosque.prayerTimes) {
          // Ajouter les prières principales
          mainPrayers.forEach(prayer => {
              let time = 'Non disponible';
              if (mosque.prayerTimes[prayer]) {
                  // Si l'heure est une chaîne de caractères
                  time = mosque.prayerTimes[prayer].substring(0, 5); // Extraire HH:MM
              }
              prayerTimesHtml += `
                  <tr>
                      <td>${prayer.charAt(0).toUpperCase() + prayer.slice(1)}</td>
                      <td>${time}</td>
                  </tr>
              `;
          });

          // Ajouter les prières supplémentaires si disponibles
          const additionalPrayers = ['jumuah1', 'jumuah2', 'jumuah3', 'tarawih'];
          additionalPrayers.forEach(prayer => {
              if (mosque.prayerTimes[prayer]) {
                  let time = mosque.prayerTimes[prayer].substring(0, 5);
                  prayerTimesHtml += `
                      <tr>
                          <td>${prayer.charAt(0).toUpperCase() + prayer.slice(1)}</td>
                          <td>${time}</td>
                      </tr>
                  `;
              }
          });
      } else {
          // Si les horaires de prière ne sont pas disponibles
          prayerTimesHtml = '<tr><td colspan="2">Horaires non disponibles</td></tr>';
      }

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

  // l'écouteur pour le changement de sélection de la ville
  const citySelect = document.getElementById('mosquetime-location-select');
  if (citySelect) {
    citySelect.addEventListener('change', async (e) => {
      const selectedCity = e.target.value;
      if (selectedCity) {
        console.log('Ville sélectionnée:', selectedCity);
        await handleCitySelection(selectedCity);
      }
    });
  }

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
  const date = document.getElementById('mosquetime-date-picker').value || new Date().toISOString().split('T')[0];
  
  try {
    displayLoading(true); // Afficher un indicateur de chargement
    const token = localStorage.getItem('token');
    
    // Récupérer les mosquées de la ville
    const mosquesResponse = await fetch(`/api/mosque-times/cities/${encodeURIComponent(city)}/mosques`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!mosquesResponse.ok) {
      throw new Error(`Erreur lors de la récupération des mosquées: ${mosquesResponse.status} ${mosquesResponse.statusText}`);
    }
    
    const mosques = await mosquesResponse.json();
    
    if (mosques.length === 0) {
      throw new Error('Aucune mosquée trouvée dans cette ville.');
    }
    
    // Appeler le nouvel endpoint pour récupérer les horaires de prière
    const prayerTimesResponse = await fetch(`/api/mosque-times/cities/${encodeURIComponent(city)}/date/${date}/prayer-times`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Prayer Times Fetch Response Status:', prayerTimesResponse.status);
    
    if (!prayerTimesResponse.ok) {
      if (prayerTimesResponse.status === 404) {
        throw new Error('Aucune mosquée trouvée dans cette ville.');
      }
      throw new Error(`Erreur lors de la récupération des horaires de prière: ${prayerTimesResponse.status} ${prayerTimesResponse.statusText}`);
    }
    
    const prayerTimesData = await prayerTimesResponse.json();
    console.log('Prayer Times Data:', prayerTimesData.prayerTimes);
    
    // Associer les horaires de prière aux mosquées
    const updatedMosques = mosques.map(mosque => {
      const prayerTime = prayerTimesData.prayerTimes.find(pt => pt.mosque_id === mosque.id) || null;
      return {
        ...mosque,
        prayerTimes: prayerTime
      };
    });
    
    currentMosques = updatedMosques;
    
    // Mettre à jour les sélecteurs et affichages
    populateMosqueSelectByCity(currentMosques);
    if (currentMosques.length > 0) {
      document.getElementById('mosquetime-mosque-select').value = currentMosques[0].id;
      await updateSingleMosqueTimes();
    }
    
    updateAllMosques();
    
  } catch (error) {
    console.error('Erreur lors de la sélection de la ville:', error);
    displayError('Impossible de récupérer les horaires de prière. Veuillez réessayer plus tard.');
  } finally {
    displayLoading(false); // Cacher l'indicateur de chargement
  }
}

async function fetchPrayerTimesForAllMosques() {
  console.log('fetchPrayerTimesForAllMosques called');
  const date = document.getElementById('mosquetime-date-picker').value || new Date().toISOString().split('T')[0];
  const token = localStorage.getItem('token');
  for (let mosque of currentMosques) {
    try {
      console.log(`Fetching prayer times for mosque ID ${mosque.id} on date ${date}`);
      const response = await fetch(`/api/mosque-times/${mosque.id}/${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`Response status for mosque ID ${mosque.id}:`, response.status);
      if (response.ok) {
        const times = await response.json();
        console.log(`Prayer times for mosque ID ${mosque.id}:`, times);
        mosque.prayerTimes = times;
      } else {
        const errorText = await response.text();
        console.warn(`Pas d'horaires de prière pour la mosquée ID ${mosque.id}:`, errorText);
        mosque.prayerTimes = null;
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération des horaires pour la mosquée ID ${mosque.id}:`, error);
      mosque.prayerTimes = null;
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
    const expectedId = tabName === 'single' ? 'mosquetime-single-mosque' : 'mosquetime-all-mosques';
    content.style.display = content.id === expectedId ? 'block' : 'none';
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
  const selectedCityName = citySelect.options[citySelect.selectedIndex]?.textContent || 'Votre Ville';
  const selectedDate = new Date(datePicker.value || new Date());
  const dateString = selectedDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  cityDateElement.textContent = `${selectedCityName}, ${dateString}`;
}

// Appelez cette fonction lors du changement de date
const datePicker = document.getElementById('mosquetime-date-picker');
if (datePicker) {
  datePicker.addEventListener('change', async (event) => {
    updateDateDisplay();
    await updateSingleMosqueTimes();
  });
}
