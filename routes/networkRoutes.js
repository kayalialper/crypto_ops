const express = require('express');
const router = express.Router();
const networkController = require('../controllers/networkController');

router.get('/tron/block', networkController.getCurrentBlock);

router.get('/tron/account/:address', networkController.getTronAccountByAddress);


module.exports = router;