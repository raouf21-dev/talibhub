const express = require('express');
const router = express.Router();
const counterController = require('../controllers/counterController');

router.get('/', counterController.getCounter);
router.post('/', counterController.saveCounter);

module.exports = router;
