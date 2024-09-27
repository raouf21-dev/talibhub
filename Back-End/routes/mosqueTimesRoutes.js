const authenticateToken = require('../middleware/authenticateToken');
const express = require('express');
const mosqueTimesController = require('../controllers/mosqueTimesController');
const router = express.Router();

// Routes spécifiques en premier
router.post('/scrape', authenticateToken, mosqueTimesController.manualScrape);
router.get('/all', authenticateToken, mosqueTimesController.getAllMosques);
router.get('/cities/search', authenticateToken, mosqueTimesController.searchCities);
router.get('/cities/:city/mosques', authenticateToken, mosqueTimesController.getMosquesByCity);
router.get('/search', authenticateToken, mosqueTimesController.searchMosques);
router.post('/add', authenticateToken, mosqueTimesController.addMosque);

// Routes générales en dernier
router.get('/:mosqueId/:date', authenticateToken, mosqueTimesController.getPrayerTimes);


module.exports = router;
