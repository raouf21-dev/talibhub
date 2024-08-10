

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            fetchPrayerTimes(latitude, longitude);
        }, showError);
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

function useCity() {
    const city = document.getElementById('city').value;
    let method = document.getElementById('method').value;
    let customParams = "";

    if (method === "24") { // Custom method
        const fajrAngle = document.getElementById('fajr-angle').value;
        const ishaAngle = document.getElementById('isha-angle').value;
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
                    document.getElementById('manual-fajr').value = Fajr.slice(0, 5);
                    document.getElementById('manual-maghrib').value = Maghrib.slice(0, 5);
                    calculateLastThird(Fajr, Maghrib, 'auto');
                } else {
                    alert('City not found or no data available.');
                }
            })
            .catch(error => console.error('Error fetching prayer times:', error));
    } else {
        alert('Please enter a city name.');
    }
}


function fetchPrayerTimes(latitude, longitude) {
    let method = document.getElementById('method').value;
    if (method === "24") {
        const fajrAngle = document.getElementById('fajr-angle').value;
        const ishaAngle = document.getElementById('isha-angle').value;
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
            document.getElementById('manual-fajr').value = Fajr.slice(0, 5);
            document.getElementById('manual-maghrib').value = Maghrib.slice(0, 5);
            calculateLastThird(Fajr, Maghrib, 'auto');
        })
        .catch(error => console.error('Error fetching prayer times:', error));
}

function manualCalculate() {
    const fajr = document.getElementById('manual-fajr').value + ":00";
    const maghrib = document.getElementById('manual-maghrib').value + ":00";
    calculateLastThird(fajr, maghrib, 'manual');
}

function calculateLastThird(Fajr, Maghrib, type) {
    const [fajrHour, fajrMinute] = Fajr.split(':').map(Number);
    const [maghribHour, maghribMinute] = Maghrib.split(':').map(Number);

    const fajrDate = new Date();
    fajrDate.setHours(fajrHour, fajrMinute, 0);

    const maghribDate = new Date();
    maghribDate.setHours(maghribHour, maghribMinute, 0);

    const nightDuration = (fajrDate - maghribDate + 24 * 60 * 60 * 1000) % (24 * 60 * 60 * 1000);
    const thirdOfNight = nightDuration / 3;
    const lastThirdStart = new Date(maghribDate.getTime() + 2 * thirdOfNight);

    if (type === 'auto') {
        document.getElementById('fajr-time').innerText = `Fajr: ${Fajr}`;
        document.getElementById('maghrib-time').innerText = `Maghrib: ${Maghrib}`;
        document.getElementById('last-third').innerText = `Last third of the night starts at: ${lastThirdStart.toTimeString().slice(0, 5)}`;
    } else if (type === 'manual') {
        document.getElementById('manual-fajr-time').innerText = `Fajr: ${Fajr}`;
        document.getElementById('manual-maghrib-time').innerText = `Maghrib: ${Maghrib}`;
        document.getElementById('manual-last-third').innerText = `Last third of the night starts at: ${lastThirdStart.toTimeString().slice(0, 5)}`;
    }
}

function toggleCustomMethodInput() {
    const method = document.getElementById('method').value;
    const customMethodDiv = document.getElementById('custom-method');
    if (method === "24") {
        customMethodDiv.style.display = "block";
    } else {
        customMethodDiv.style.display = "none";
    }
}

function showError(error) {
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