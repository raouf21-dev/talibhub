const express = require('express');
const mosqueTimesController = require('../controllers/mosqueTimesController');

const router = express.Router();

router.post('/scrape', mosqueTimesController.manualScrape);
router.get('/all', mosqueTimesController.getAllMosques);
router.get('/:mosqueId/:date', mosqueTimesController.getPrayerTimes);
router.get('/search', mosqueTimesController.searchMosques);
router.post('/add', mosqueTimesController.addMosque);

module.exports = router;