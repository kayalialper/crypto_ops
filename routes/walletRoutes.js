// routes/walletRoutes.js
const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const checkUserExists = require('../middlewares/checkUserExists'); // Middleware'i import et

router.post('/createwallet', checkUserExists, walletController.createWallet); // Yeni wallet oluşturma
router.post('/createAddressOnWallet/:wallet_id', walletController.createAddressOnWallet); // Mevcut wallet'a yeni adres ekleme
router.post('/getPrivateKey', walletController.getPrivateKey); // Belirli bir adresin private key'ini alma

module.exports = router;