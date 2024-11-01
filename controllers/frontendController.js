const axios = require('axios');
const walletModel = require('../models/walletModel');
const qrGenerator = require('../utils/qrGenerator');

exports.createWalletWithAddress = async (req, res) => {
    const { userId, name, network } = req.body;

    try {
        const walletResponse = await axios.post('/api/createwallet', {
            userId, name, network
        });

        const walletData = walletResponse.data;
        const qrCodeBase64 = qrGenerator.generateQRBase64(walletData.address);

        res.status(200).json({
            address: walletData.address,
            network: walletData.network,
            qrCode: qrCodeBase64,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Wallet oluşturulurken bir hata oluştu',
            details: error.message
        });
    }
};