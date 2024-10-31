// controllers/walletController.js
const axios = require('axios');
const walletModel = require('../models/walletModel');
const qrGenerator = require('../utils/qrGenerator');

exports.createWallet = async (req, res) => {
    try {
        const { userId, name, network, create_address, address_name } = req.body;

        // Tatum API ile wallet oluşturma (mnemonic ve xpub alınması)
        const walletResponse = await axios.get(`https://api-eu1.tatum.io/v3/${network}/wallet`, {
            headers: {
                'x-api-key': process.env.TATUM_API_KEY
            }
        });

        const { mnemonic, xpub } = walletResponse.data;

        // Yeni wallet'ı veritabanına kaydet
        walletModel.createWallet(userId, name, network, xpub, mnemonic, async (err, walletId) => {
            if (err) throw err;

            // Eğer create_address true ise, ilk adresi oluştur
            if (create_address) {
                const addressResponse = await axios.get(`https://api.tatum.io/v3/tron/address/${xpub}/0`, {
                    headers: {
                        accept: 'application/json',
                        'x-api-key': process.env.TATUM_API_KEY
                    }
                });

                const address = addressResponse.data.address;
                const qrCodeBase64 = qrGenerator.generateQRBase64(address);

                // Yeni adresi veritabanına kaydet
                walletModel.createAddress(walletId, address_name, address, qrCodeBase64, (err, addressId) => {
                    if (err) throw err;

                    res.status(201).json({
                        walletId,
                        addressId,
                        mnemonic,
                        xpub,
                        address,
                        qrCode: qrCodeBase64
                    });
                });
            } else {
                res.status(201).json({
                    walletId,
                    mnemonic,
                    xpub
                });
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createAddressOnWallet = async (req, res) => {
    try {
        const { wallet_id } = req.params;
        const { user_id, name, index, network } = req.body;

        // Wallet'ı veritabanında kontrol et
        walletModel.getWalletById(wallet_id, async (err, wallet) => {
            if (err || !wallet) {
                return res.status(404).json({ error: 'Wallet bulunamadı' });
            }

            // Debug: Kontrol amaçlı user_id ve wallet.user_id değerlerini loglayın
            console.log("Request user_id:", user_id);
            console.log("Wallet user_id:", wallet.user_id);

            // Kullanıcı ID'si kontrolü
            if (wallet.user_id != user_id) { // Tip uyumsuzluğuna karşı "!=" kullanıyoruz
                return res.status(403).json({ error: 'Yetkisiz işlem' });
            }

            const xpub = wallet.xpub;

            // Yeni adres oluşturma isteği
            const addressResponse = await axios.get(`https://api.tatum.io/v3/tron/address/${xpub}/${index}`, {
                headers: {
                    accept: 'application/json',
                    'x-api-key': process.env.TATUM_API_KEY
                }
            });

            const address = addressResponse.data.address;
            const qrCodeBase64 = qrGenerator.generateQRBase64(address);

            // Yeni adresi veritabanına kaydet
            walletModel.createAddress(wallet_id, name, address, qrCodeBase64, (err, addressId) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({ error: 'Cüzdan adresi kullanımda, farklı index numarası belirtin' });
                    }
                    return res.status(500).json({ error: 'Adres kaydedilemedi' });
                }

                res.status(201).json({
                    wallet_id,
                    addressId,
                    index,
                    name,
                    address,
                    qrCode: qrCodeBase64
                });
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPrivateKey = async (req, res) => {
    try {
        const { wallet_id, user_id, index, address_id } = req.body;

        // Wallet'ı veritabanında kontrol et
        walletModel.getWalletById(wallet_id, async (err, wallet) => {
            if (err || !wallet) {
                return res.status(404).json({ error: 'Wallet bulunamadı' });
            }

            // Kullanıcı ID'si kontrolü
            if (wallet.user_id !== user_id) {
                return res.status(403).json({ error: 'Yetkisiz işlem' });
            }

            // Address kaydını kontrol et
            walletModel.getAddressById(address_id, async (err, address) => {
                if (err || !address) {
                    return res.status(404).json({ error: 'Adres bulunamadı' });
                }

                // Sadece private_key ve mn_index alanları boşsa güncelleme yap
                if (address.private_key && address.mn_index !== null) {
                    return res.status(400).json({ error: 'Adres zaten bir private key ve index değerine sahip' });
                }

                const mnemonic = wallet.mnemonic;

                // Tatum API'ye private key isteği gönderme
                const options = {
                    method: 'POST',
                    url: 'https://api.tatum.io/v3/tron/wallet/priv',
                    headers: {
                        accept: 'application/json',
                        'content-type': 'application/json',
                        'x-api-key': process.env.TATUM_API_KEY
                    },
                    data: {
                        index: index,
                        mnemonic: mnemonic
                    }
                };

                const response = await axios.request(options);
                const privateKey = response.data.key;

                // Private key'i veritabanında güncelle
                this.updateAddressPrivateKey(address_id, privateKey, index, res);
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateAddressPrivateKey = (address_id, privateKey, index, res) => {
    walletModel.updateAddressWithPrivateKey(address_id, privateKey, index, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Private key kaydedilemedi' });
        }

        // Private key başarılı bir şekilde kaydedildiğinde yanıt döndürme
        res.status(200).json({ privateKey: privateKey, mn_index: index });
    });
};