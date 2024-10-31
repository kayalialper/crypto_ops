const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const checkUserExists = require('../middlewares/checkUserExists');
const validateAddressAndKey = require('../middlewares/validateAddressAndKey');

router.post('/createwallet', checkUserExists, walletController.createWallet);
router.post('/createAddressOnWallet/:wallet_id', walletController.createAddressOnWallet);

router.post('/getPrivateKey', walletController.getPrivateKey);

router.post('/trx/send', validateAddressAndKey, walletController.sendTRX); //NOT: private key'i alınan hesaba ağ ücreti yansıtılır.
router.get('/trx/transaction/:txId', walletController.checkTransactionStatus);

router.post('/trx/freeze', walletController.freezeBalance);
router.post('/trx/unfreeze', walletController.unfreezeBalance);


/* //FUTURE USE
    // router.get('/trx/balance/:address', walletController.getBalance);
    // router.get('/trx/transactions/:address', walletController.getTransactions);
*/

module.exports = router;