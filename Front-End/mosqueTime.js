// mosqueTime.js
export class MosqueTimeManager {
    constructor() {
        this.currentMosques = [];
        this.sortOrder = 'asc';
        this.selectedCity = '';
        
        // Ajouter l'écouteur d'événement pour le changement de langue
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
          const response = await this.fetchWithAuth(`/api/mosque-times/exists/${date}`);
          
          if (response.ok) {
              const dataExists = await response.json();
              if (!dataExists.exists) {
                  await this.triggerScrapingForAllCities();
              } else {
                  console.log('Les données pour la date actuelle existent déjà.');
              }
          }
      } catch (error) {
          console.error('Erreur lors de la vérification des données:', error);
      }
  }

  async fetchWithAuth(url, options = {}) {
      const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth_token='))
          ?.split('=')[1];

      return fetch(url, {
          ...options,
          headers: {
              ...options.headers,
              'Authorization': `Bearer ${token}`
          }
      });
  }

  async triggerScrapingForAllCities() {
      try {
          this.displayLoading(true);
          const response = await this.fetchWithAuth('/api/mosque-times/scrape-all', {
              method: 'POST'
          });
          
          if (!response.ok) {
              throw new Error(`Erreur lors du scraping: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('Scraping completed:', data.message);
      } catch (error) {
          console.error('Erreur lors du scraping:', error);
          this.displayError('Une erreur est survenue lors du scraping.');
      } finally {
          this.displayLoading(false);
      }
  }

  displayLoading(isLoading) {
      const loadingElement = document.getElementById('mosquetime-loading');
      if (loadingElement) {
          loadingElement.style.display = isLoading ? 'block' : 'none';
      }
  }

  async loadCities() {
      try {
          const response = await this.fetchWithAuth('/api/mosque-times/cities/search?query=');
          
          if (!response.ok) {
              throw new Error(`Erreur: ${response.status}`);
          }
          
          const cities = await response.json();
          this.populateCitySelect(cities);
      } catch (error) {
          console.error('Erreur lors du chargement des villes:', error);
          this.displayError('Impossible de charger les villes.');
      }
  }

  populateCitySelect(cities) {
      const select = document.getElementById('mosquetime-location-select');
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
        const response = await this.fetchWithAuth('/api/mosque-times/user/selected-city');
        if (response.ok) {
            const { city } = await response.json();
            if (city) {
                const citySelect = document.getElementById('mosquetime-location-select');
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
      this.displayLoading(true);
      const date = document.getElementById('mosquetime-date-picker').value 
          || new Date().toISOString().split('T')[0];

      // Sauvegarder la ville via l'API
      const saveResponse = await this.fetchWithAuth('/api/mosque-times/user/selected-city', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ city })
      });

      if (!saveResponse.ok) {
          console.warn('Erreur lors de la sauvegarde de la ville préférée');
      }

      this.selectedCity = city;
      
      // Mettre à jour le select avec la ville sélectionnée
      const citySelect = document.getElementById('mosquetime-location-select');
      if (citySelect && citySelect.value !== city) {
          citySelect.value = city;
      }
          
      // Récupérer les mosquées de la ville
      const mosquesResponse = await this.fetchWithAuth(
          `/api/mosque-times/cities/${encodeURIComponent(city)}/mosques`
      );
          
      if (!mosquesResponse.ok) {
          throw new Error(`Erreur lors de la récupération des mosquées: ${mosquesResponse.status}`);
      }
          
      const mosques = await mosquesResponse.json();
          
      if (mosques.length === 0) {
          throw new Error('Aucune mosquée trouvée dans cette ville.');
      }
          
      // Récupérer les horaires de prière
      const prayerTimesResponse = await this.fetchWithAuth(
          `/api/mosque-times/cities/${encodeURIComponent(city)}/date/${date}/prayer-times`
      );
          
      if (!prayerTimesResponse.ok) {
          throw new Error(`Erreur lors de la récupération des horaires: ${prayerTimesResponse.status}`);
      }
          
      const prayerTimesData = await prayerTimesResponse.json();
          
      if (!prayerTimesData || !prayerTimesData.prayerTimes) {
          throw new Error('Format de données invalide pour les horaires de prière');
      }

      // Mise à jour des mosquées avec leurs horaires
      this.currentMosques = mosques.map(mosque => ({
          ...mosque,
          prayerTimes: prayerTimesData.prayerTimes.find(pt => pt.mosque_id === mosque.id) || null
      }));
          
      // Mettre à jour la liste déroulante des mosquées
      this.populateMosqueSelectByCity(this.currentMosques);
          
      if (this.currentMosques.length > 0) {
          const mosqueSelect = document.getElementById('mosquetime-mosque-select');
          mosqueSelect.value = this.currentMosques[0].id;
          await this.updateSingleMosqueTimes();
      }
          
      this.updateAllMosques();
      this.updateDateDisplay();

      // Sauvegarder également dans localStorage comme fallback
      localStorage.setItem('lastSelectedCity', city);
          
  } catch (error) {
      console.error('Erreur détaillée lors de la sélection de la ville:', error);
      console.error('Stack trace:', error.stack);
      this.displayError(error.message);
      
      // En cas d'erreur, sauvegarder quand même dans localStorage
      if (city) {
          localStorage.setItem('lastSelectedCity', city);
      }
  } finally {
      this.displayLoading(false);
  }
}

  async updateSingleMosqueTimes() {
      const select = document.getElementById('mosquetime-mosque-select');
      const tbody = document.getElementById('mosquetime-single-mosque-times');
      const date = document.getElementById('mosquetime-date-picker').value 
          || new Date().toISOString().split('T')[0];

      try {
          const response = await this.fetchWithAuth(`/api/mosque-times/${select.value}/${date}`);
          
          if (!response.ok) {
              throw new Error('Échec de la récupération des horaires de prière');
          }
          
          const times = await response.json();
          
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
      // Event listeners pour la sélection de ville
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

      // Event listener pour le date picker
      const datePicker = document.getElementById('mosquetime-date-picker');
      if (datePicker) {
          datePicker.addEventListener('change', async () => {
              this.updateDateDisplay();
              await this.updateSingleMosqueTimes();
          });
      }

      // Event listener pour la sélection de mosquée
      const mosqueSelect = document.getElementById('mosquetime-mosque-select');
      if (mosqueSelect) {
          mosqueSelect.addEventListener('change', () => this.updateSingleMosqueTimes());
      }

      // Event listeners pour le tri
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

      // Event listeners pour les onglets
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

    // Obtenir la langue actuelle depuis l'événement languageChanged
    const currentLang = localStorage.getItem('userLang'); // Ceci est mis à jour par votre système de langue
    console.log('Current language from localStorage:', currentLang);

    // Forcer la locale en fonction de la langue
    const locale = currentLang === 'en' ? 'en-US' : 'fr-FR';
    console.log('Using locale:', locale);

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

// Initialisation
const mosqueTimeManager = new MosqueTimeManager();
export const initializeMosqueTime = () => mosqueTimeManager.initialize();