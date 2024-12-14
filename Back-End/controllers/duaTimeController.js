const axios = require('axios');

class DuaTimeController {
    async getPrayerTimesByCity(req, res) {
        try {
            const { city } = req.params;
            const { method, fajrAngle, ishaAngle } = req.query;
    
            console.log('Received request for city:', city, 'with method:', method);
    
            let url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=&method=${method}`;
            
            if (method === "24" && fajrAngle && ishaAngle) {
                url += `&fajrAngle=${fajrAngle}&ishaAngle=${ishaAngle}`;
            }
    
            const response = await axios.get(url);
            
            if (!response.data || !response.data.data || !response.data.data.timings) {
                throw new Error('Invalid response format from prayer times API');
            }
    
            const { Fajr, Maghrib } = response.data.data.timings;
    
            res.json({
                success: true,
                timings: {
                    Fajr,
                    Maghrib
                }
            });
        } catch (error) {
            console.error('Error fetching prayer times by city:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching prayer times',
                error: error.message 
            });
        }
    }

    async getPrayerTimesByCoordinates(req, res) {
        try {
            const { latitude, longitude, method, fajrAngle, ishaAngle } = req.query;

            let url = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=${method}`;
            
            if (method === "24" && fajrAngle && ishaAngle) {
                url += `&fajrAngle=${fajrAngle}&ishaAngle=${ishaAngle}`;
            }

            const response = await axios.get(url);
            const { Fajr, Maghrib } = response.data.data.timings;

            res.json({
                timings: {
                    Fajr: Fajr,
                    Maghrib: Maghrib
                }
            });
        } catch (error) {
            console.error('Error fetching prayer times by coordinates:', error);
            res.status(500).json({ message: 'Error fetching prayer times', error: error.message });
        }
    }

    async getPrayerCalculationMethods(req, res) {
        try {
            const methods = {
                0: "Shafi",
                1: "Hanafi",
                2: "ISNA",
                3: "MWL",
                4: "Makkah",
                5: "Egypt",
                6: "Karachi",
                7: "Kuwait",
                8: "Qatar",
                9: "Singapore",
                10: "France",
                11: "Turkey",
                12: "Russia",
                13: "Moonsighting Committee",
                14: "Dubai",
                15: "Qatar",
                16: "Kuwait",
                17: "Moonsighting Committee Worldwide",
                18: "Singapore",
                19: "Turkey",
                20: "Iran",
                24: "Custom"
            };
            
            res.json({ methods });
        } catch (error) {
            console.error('Error fetching calculation methods:', error);
            res.status(500).json({ message: 'Error fetching calculation methods', error: error.message });
        }
    }

    async calculateLastThird(req, res) {
        try {
            const { fajr, maghrib } = req.body;

            // Validation des entrées
            if (!fajr || !maghrib) {
                return res.status(400).json({ message: 'Fajr and Maghrib times are required' });
            }

            const [fajrHour, fajrMinute] = fajr.split(':').map(Number);
            const [maghribHour, maghribMinute] = maghrib.split(':').map(Number);

            const fajrDate = new Date();
            fajrDate.setHours(fajrHour, fajrMinute, 0);

            const maghribDate = new Date();
            maghribDate.setHours(maghribHour, maghribMinute, 0);

            const nightDuration = (fajrDate - maghribDate + 24 * 60 * 60 * 1000) % (24 * 60 * 60 * 1000);
            const thirdOfNight = nightDuration / 3;
            const lastThirdStart = new Date(maghribDate.getTime() + 2 * thirdOfNight);

            res.json({
                lastThirdStart: lastThirdStart.toTimeString().slice(0, 5),
                fajr,
                maghrib
            });
        } catch (error) {
            console.error('Error calculating last third:', error);
            res.status(500).json({ message: 'Error calculating last third of night', error: error.message });
        }
    }
}

// Créer une instance du contrôleur
const controller = new DuaTimeController();

// Exporter les méthodes liées aux routes
module.exports = {
    getPrayerTimesByCity: controller.getPrayerTimesByCity.bind(controller),
    getPrayerTimesByCoordinates: controller.getPrayerTimesByCoordinates.bind(controller),
    getPrayerCalculationMethods: controller.getPrayerCalculationMethods.bind(controller),
    calculateLastThird: controller.calculateLastThird.bind(controller)
};