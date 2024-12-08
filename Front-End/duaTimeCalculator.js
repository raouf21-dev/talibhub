// duaTimeCalculator.js

function initializeDuaTimeCalculator() {
    const duaTimeSection = document.getElementById('duaTimeCalculator');
    if (duaTimeSection) {
        duaTimeSection.addEventListener('click', function(event) {
            const target = event.target.closest('[data-action]');
            if (target) {
                const action = target.getAttribute('data-action');
                switch(action) {
                    case 'get-dua-location':
                        getDuaLocation();
                        break;
                    case 'use-dua-city':
                        useDuaCity();
                        break;
                    case 'calculate-dua-manually':
                        calculateDuaManually();
                        break;
                    // Ajoutez d'autres cas pour les autres actions si nécessaire
                    default:
                        console.warn('Action inconnue :', action);
                }
            }
        });
    }
    // Autres initialisations...
}




function getDuaLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            fetchDuaPrayerTimes(latitude, longitude);
        }, showDuaError);
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

function useDuaCity() {
    const city = document.getElementById('duaCityInput').value;
    let method = document.getElementById('duaMethodSelect').value;
    let customParams = "";

    if (method === "24") { // Custom method
        const fajrAngle = document.getElementById('duaFajrAngleInput').value;
        const ishaAngle = document.getElementById('duaIshaAngleInput').value;
        if (fajrAngle && ishaAngle) {
            customParams = `&fajrAngle=${fajrAngle}&ishaAngle=${ishaAngle}`;
        } else {
            alert("Please enter Fajr and Isha angles for the custom method.");
            return;
        }
    }

    if (city) {
        fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=&method=${method}${customParams}`)
            .then(response => response.json())
            .then(data => {
                if (data.data) {
                    const { Fajr, Maghrib } = data.data.timings;
                    document.getElementById('duaManualFajrInput').value = Fajr.slice(0, 5);
                    document.getElementById('duaManualMaghribInput').value = Maghrib.slice(0, 5);
                    calculateDuaLastThird(Fajr, Maghrib, 'auto');
                } else {
                    alert('City not found or no data available.');
                }
            })
            .catch(error => console.error('Error fetching prayer times:', error));
    } else {
        alert('Please enter a city name.');
    }
}

function fetchDuaPrayerTimes(latitude, longitude) {
    let method = document.getElementById('duaMethodSelect').value;
    if (method === "24") {
        const fajrAngle = document.getElementById('duaFajrAngleInput').value;
        const ishaAngle = document.getElementById('duaIshaAngleInput').value;
        if (fajrAngle && ishaAngle) {
            method = `&fajrAngle=${fajrAngle}&ishaAngle=${ishaAngle}`;
        } else {
            alert("Please enter Fajr and Isha angles for the custom method.");
            return;
        }
    }

    fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=${method}`)
        .then(response => response.json())
        .then(data => {
            const { Fajr, Maghrib } = data.data.timings;
            document.getElementById('duaManualFajrInput').value = Fajr.slice(0, 5);
            document.getElementById('duaManualMaghribInput').value = Maghrib.slice(0, 5);
            calculateDuaLastThird(Fajr, Maghrib, 'auto');
        })
        .catch(error => console.error('Error fetching prayer times:', error));
}

function calculateDuaManually() {
    const fajr = document.getElementById('duaManualFajrInput').value + ":00";
    const maghrib = document.getElementById('duaManualMaghribInput').value + ":00";
    calculateDuaLastThird(fajr, maghrib, 'manual');
}

function calculateDuaLastThird(Fajr, Maghrib, type) {
    const [fajrHour, fajrMinute] = Fajr.split(':').map(Number);
    const [maghribHour, maghribMinute] = Maghrib.split(':').map(Number);

    const fajrDate = new Date();
    fajrDate.setHours(fajrHour, fajrMinute, 0);

    const maghribDate = new Date();
    maghribDate.setHours(maghribHour, maghribHour, 0);

    const nightDuration = (fajrDate - maghribDate + 24 * 60 * 60 * 1000) % (24 * 60 * 60 * 1000);
    const thirdOfNight = nightDuration / 3;
    const lastThirdStart = new Date(maghribDate.getTime() + 2 * thirdOfNight);

    if (type === 'auto') {
        document.getElementById('duaAutoFajrTime').innerText = `Fajr: ${Fajr}`;
        document.getElementById('duaAutoMaghribTime').innerText = `Maghrib: ${Maghrib}`;
        document.getElementById('duaAutoLastThird').innerText = `Last third of the night starts at: ${lastThirdStart.toTimeString().slice(0, 5)}`;
    } else if (type === 'manual') {
        document.getElementById('duaManualFajrTime').innerText = `Fajr: ${Fajr}`;
        document.getElementById('duaManualMaghribTime').innerText = `Maghrib: ${Maghrib}`;
        document.getElementById('duaManualLastThird').innerText = `Last third of the night starts at: ${lastThirdStart.toTimeString().slice(0, 5)}`;
    }
}

function toggleDuaCustomMethodInput() {
    const method = document.getElementById('duaMethodSelect').value;
    const customMethodDiv = document.getElementById('duaCustomMethod');
    if (customMethodDiv) {
        customMethodDiv.style.display = method === "24" ? "block" : "none";
    }
}

function showDuaError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            alert('User denied the request for Geolocation.');
            break;
        case error.POSITION_UNAVAILABLE:
            alert('Location information is unavailable.');
            break;
        case error.TIMEOUT:
            alert('The request to get user location timed out.');
            break;
        case error.UNKNOWN_ERROR:
            alert('An unknown error occurred.');
            break;
    }
}

// Exportation des fonctions nécessaires
export { toggleDuaCustomMethodInput };