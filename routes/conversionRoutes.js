const express = require('express');
const router = express.Router();
const conversionController = require('../controllers/conversionController');

router.get('/convert/:from/:to', conversionController.convertCurrency);

module.exports = router;