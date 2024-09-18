// mosqueTime.js

let currentMosques = [];
let sortOrder = 'asc';

async function init() {
    await fetchMosques();
    populateMosqueSelect();
    updateSingleMosqueTimes();
    updateAllMosques();
    setupEventListeners();
}

async function fetchMosques() {
    try {
        const response = await fetch('http://localhost:3000/mosque-times/all');
        if (!response.ok) {
            throw new Error('Failed to fetch mosques');
        }
        let mosques = await response.json();
        
        // Fetch the latest prayer times for each mosque
        for (let mosque of mosques) {
            const todayDate = new Date().toISOString().split('T')[0];
            const timesResponse = await fetch(`http://localhost:3000/mosque-times/${mosque.id}/${todayDate}`);
            if (timesResponse.ok) {
                mosque.prayerTimes = await timesResponse.json();
            }
        }
        
        currentMosques = mosques;
    } catch (error) {
        console.error('Error fetching mosques:', error);
        displayError('Unable to fetch mosque data. Please try again later.');
    }
}

function populateMosqueSelect() {
    const select = document.getElementById('mosquetime-mosque-select');
    select.innerHTML = '';
    currentMosques.forEach(mosque => {
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
        const response = await fetch(`http://localhost:3000/mosque-times/${select.value}/${date}`);
        if (!response.ok) {
            throw new Error('Failed to fetch prayer times');
        }
        const times = await response.json();
        
        tbody.innerHTML = '';
        for (const [prayer, time] of Object.entries(times)) {
            if (prayer !== 'id' && prayer !== 'mosque_id' && prayer !== 'date' && time) {
                const row = tbody.insertRow();
                row.insertCell(0).textContent = prayer.charAt(0).toUpperCase() + prayer.slice(1);
                row.insertCell(1).textContent = time;
            }
        }
    } catch (error) {
        console.error('Error fetching prayer times:', error);
        displayError('Unable to fetch prayer times. Please try again later.');
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
    document.getElementById('mosquetime-use-location').addEventListener('click', handleUseCurrentLocation);
    document.getElementById('mosquetime-search').addEventListener('click', handleLocationSearch);
    document.getElementById('mosquetime-date-picker').addEventListener('change', handleDateChange);
    document.getElementById('mosquetime-mosque-select').addEventListener('change', updateSingleMosqueTimes);
    document.getElementById('mosquetime-sort-asc').addEventListener('click', () => handleSort('asc'));
    document.getElementById('mosquetime-sort-desc').addEventListener('click', () => handleSort('desc'));
    document.getElementById('mosquetime-sort-nearest').addEventListener('click', () => handleSort('nearest'));
    document.getElementById('mosquetime-share').addEventListener('click', handleShare);
    document.getElementById('mosquetime-reminders').addEventListener('click', handleSetReminders);

    const tabs = document.querySelectorAll('.mosquetime-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
}

function handleUseCurrentLocation() {
    console.log('Using current location');
    // Implement geolocation logic here
}

async function handleLocationSearch() {
    const location = document.getElementById('mosquetime-location-input').value;
    console.log('Searching for:', location);
    // Implement location search logic here, then fetch new mosque data
    await fetchMosques();
    updateAllMosques();
}

async function handleDateChange(event) {
    const date = new Date(event.target.value);
    document.getElementById('mosquetime-city-date').textContent = `Prayer Times for ${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    await updateSingleMosqueTimes();
    await fetchMosques(); // Refresh all mosque data
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
    document.getElementById('mosquetime-single-mosque').style.display = tabName === 'single' ? 'block' : 'none';
    document.getElementById('mosquetime-all-mosques').style.display = tabName === 'all' ? 'block' : 'none';
}

function handleShare() {
    console.log('Sharing prayer times');
    // Implement share functionality here
}

function handleSetReminders() {
    console.log('Setting reminders');
    // Implement reminder setting functionality here
}

function displayError(message) {
    const errorElement = document.getElementById('mosquetime-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);