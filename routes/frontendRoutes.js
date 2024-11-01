const express = require('express');
const router = express.Router();
const frontendController = require('../controllers/frontendController');

router.post('/createWallet', frontendController.createWalletWithAddress);

module.exports = router;