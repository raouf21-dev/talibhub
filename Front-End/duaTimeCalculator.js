import { api } from './dynamicLoader.js';

export class DuaTimeCalculator {
    constructor() {
        this.method = "3"; // Méthode par défaut
    }

    async initialize() {
        console.log('Initializing duaTime calculator');
        this.setupEventListeners();
    }

    setupEventListeners() {
        const duaTimeSection = document.getElementById('duaTimeCalculator');
        if (duaTimeSection) {
            duaTimeSection.addEventListener('click', (event) => {
                const target = event.target.closest('[data-action]');
                if (target) {
                    const action = target.getAttribute('data-action');
                    switch(action) {
                        case 'get-dua-location':
                            this.getDuaLocation();
                            break;
                        case 'use-dua-city':
                            this.useDuaCity();
                            break;
                        case 'calculate-dua-manually':
                            this.calculateDuaManually();
                            break;
                        default:
                            console.warn('Action inconnue :', action);
                    }
                }
            });
        }

        // Écouteur pour le changement de méthode
        const methodSelect = document.getElementById('duaMethodSelect');
        if (methodSelect) {
            methodSelect.addEventListener('change', () => this.toggleDuaCustomMethodInput());
        }
    }

    async getDuaLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async position => {
                    try {
                        const { latitude, longitude } = position.coords;
                        await this.fetchPrayerTimesByCoordinates(latitude, longitude);
                    } catch (error) {
                        console.error('Error getting prayer times:', error);
                        this.showDuaError({ code: 'UNKNOWN_ERROR' });
                    }
                },
                error => this.showDuaError(error)
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    }

    async useDuaCity() {
        const city = document.getElementById('duaCityInput').value;
        let method = document.getElementById('duaMethodSelect').value;
        let customParams = new URLSearchParams();
        customParams.append('method', method);
    
        if (method === "24") {
            const fajrAngle = document.getElementById('duaFajrAngleInput').value;
            const ishaAngle = document.getElementById('duaIshaAngleInput').value;
            if (fajrAngle && ishaAngle) {
                customParams.append('fajrAngle', fajrAngle);
                customParams.append('ishaAngle', ishaAngle);
            } else {
                alert("Please enter Fajr and Isha angles for the custom method.");
                return;
            }
        }
    
        if (city) {
            try {
                const response = await api.get(
                    `/dua-time/prayer-times/city/${encodeURIComponent(city)}?${customParams}`
                );
                
                const { Fajr, Maghrib } = response.timings;
                document.getElementById('duaManualFajrInput').value = Fajr.slice(0, 5);
                document.getElementById('duaManualMaghribInput').value = Maghrib.slice(0, 5);
                this.calculateDuaLastThird(Fajr, Maghrib, 'auto');
            } catch (error) {
                console.error('Error fetching prayer times:', error);
                alert('City not found or no data available.');
            }
        } else {
            alert('Please enter a city name.');
        }
    }
    
    async fetchPrayerTimesByCoordinates(latitude, longitude) {
        try {
            let method = document.getElementById('duaMethodSelect').value;
            let params = new URLSearchParams({
                latitude,
                longitude,
                method
            });
    
            if (method === "24") {
                const fajrAngle = document.getElementById('duaFajrAngleInput').value;
                const ishaAngle = document.getElementById('duaIshaAngleInput').value;
                if (fajrAngle && ishaAngle) {
                    params.append('fajrAngle', fajrAngle);
                    params.append('ishaAngle', ishaAngle);
                } else {
                    alert("Please enter Fajr and Isha angles for the custom method.");
                    return;
                }
            }
    
            const response = await api.get(
                `/dua-time/prayer-times/coordinates?${params}`
            );
            
            const { Fajr, Maghrib } = response.timings;
            document.getElementById('duaManualFajrInput').value = Fajr.slice(0, 5);
            document.getElementById('duaManualMaghribInput').value = Maghrib.slice(0, 5);
            this.calculateDuaLastThird(Fajr, Maghrib, 'auto');
        } catch (error) {
            console.error('Error fetching prayer times:', error);
        }
    }

    getMethodParameters() {
        const methodSelect = document.getElementById('duaMethodSelect');
        let methodId = methodSelect?.value || "3";
        let customParams = {};

        if (methodId === "24") {
            const fajrAngle = document.getElementById('duaFajrAngleInput').value;
            const ishaAngle = document.getElementById('duaIshaAngleInput').value;
            if (!fajrAngle || !ishaAngle) {
                throw new Error("Please enter Fajr and Isha angles for the custom method.");
            }
            customParams = { fajrAngle, ishaAngle };
        }

        return { methodId, customParams };
    }

    updateInputs(Fajr, Maghrib) {
        document.getElementById('duaManualFajrInput').value = Fajr.slice(0, 5);
        document.getElementById('duaManualMaghribInput').value = Maghrib.slice(0, 5);
    }

    calculateDuaManually() {
        const fajr = document.getElementById('duaManualFajrInput').value + ":00";
        const maghrib = document.getElementById('duaManualMaghribInput').value + ":00";
        this.calculateDuaLastThird(fajr, maghrib, 'manual');
    }

    calculateDuaLastThird(Fajr, Maghrib, type) {
        const [fajrHour, fajrMinute] = Fajr.split(':').map(Number);
        const [maghribHour, maghribMinute] = Maghrib.split(':').map(Number);

        const fajrDate = new Date();
        fajrDate.setHours(fajrHour, fajrMinute, 0);

        const maghribDate = new Date();
        maghribDate.setHours(maghribHour, maghribMinute, 0);

        const nightDuration = (fajrDate - maghribDate + 24 * 60 * 60 * 1000) % (24 * 60 * 60 * 1000);
        const thirdOfNight = nightDuration / 3;
        const lastThirdStart = new Date(maghribDate.getTime() + 2 * thirdOfNight);

        this.updateTimeDisplay(type, Fajr, Maghrib, lastThirdStart);
    }

    updateTimeDisplay(type, Fajr, Maghrib, lastThirdStart) {
        const prefix = type === 'auto' ? 'duaAuto' : 'duaManual';
        document.getElementById(`${prefix}FajrTime`).innerHTML = `Fajr: ${Fajr}`;
        document.getElementById(`${prefix}MaghribTime`).innerHTML = `Maghrib: ${Maghrib}`;
        document.getElementById(`${prefix}LastThird`).innerHTML = 
            `Last third of the night starts at: <strong>${lastThirdStart.toTimeString().slice(0, 5)}</strong>`;
    }

    toggleDuaCustomMethodInput() {
        const method = document.getElementById('duaMethodSelect').value;
        const customMethodDiv = document.getElementById('duaCustomMethod');
        if (customMethodDiv) {
            customMethodDiv.style.display = method === "24" ? "block" : "none";
        }
    }

    showDuaError(error) {
        let message = 'An unknown error occurred.';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = 'User denied the request for Geolocation.';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location information is unavailable.';
                break;
            case error.TIMEOUT:
                message = 'The request to get user location timed out.';
                break;
        }
        alert(message);
    }
}

const duaTimeCalculator = new DuaTimeCalculator();
export const initializeDuaTimeCalculator = () => duaTimeCalculator.initialize();