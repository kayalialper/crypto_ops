const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const checkUserExists = require('../middlewares/checkUserExists');

router.post('/createwallet', checkUserExists, walletController.createWallet);
router.post('/createAddressOnWallet/:wallet_id', walletController.createAddressOnWallet);
router.post('/getPrivateKey', walletController.getPrivateKey);

module.exports = router;