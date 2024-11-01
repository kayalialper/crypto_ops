
const axios = require('axios');
const walletModel = require('../models/walletModel');
const qrGenerator = require('../utils/qrGenerator');

exports.createWallet = async (req, res) => {
    try {
        const { userId, name, network, create_address, address_name } = req.body;

        const walletResponse = await axios.get(`https://api-eu1.tatum.io/v3/${network}/wallet`, {
            headers: {
                'x-api-key': process.env.TATUM_API_KEY
            }
        });

        const { mnemonic, xpub } = walletResponse.data;

        walletModel.createWallet(userId, name, network, xpub, mnemonic, async (err, walletId) => {
            if (err) throw err;

            if (create_address) {
                const addressResponse = await axios.get(`https://api.tatum.io/v3/tron/address/${xpub}/0`, {
                    headers: {
                        accept: 'application/json',
                        'x-api-key': process.env.TATUM_API_KEY
                    }
                });

                const address = addressResponse.data.address;
                const qrCodeBase64 = qrGenerator.generateQRBase64(address);

                walletModel.createAddress(walletId, address_name, address, qrCodeBase64, (err, addressId) => {
                    if (err) throw err;

                    res.status(201).json(req.isDeveloper ? {
                        walletId,
                        addressId,
                        mnemonic,
                        xpub,
                        address,
                        qrCode: qrCodeBase64
                    } : { walletId, addressId, address, qrCode: qrCodeBase64 });
                });
            } else {
                res.status(201).json(req.isDeveloper ? {
                    walletId,
                    mnemonic,
                    xpub
                } : { walletId });
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

        walletModel.getWalletById(wallet_id, async (err, wallet) => {
            if (err || !wallet) {
                return res.status(404).json({ error: 'Wallet bulunamadı' });
            }

            if (wallet.user_id != user_id) {
                return res.status(403).json({ error: 'Yetkisiz işlem' });
            }

            const xpub = wallet.xpub;

            const addressResponse = await axios.get(`https://api.tatum.io/v3/tron/address/${xpub}/${index}`, {
                headers: {
                    accept: 'application/json',
                    'x-api-key': process.env.TATUM_API_KEY
                }
            });

            const address = addressResponse.data.address;
            const qrCodeBase64 = qrGenerator.generateQRBase64(address);

            walletModel.createAddress(wallet_id, name, address, qrCodeBase64, (err, addressId) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({ error: 'Cüzdan adresi kullanımda, farklı index numarası belirtin' });
                    }
                    return res.status(500).json({ error: 'Adres kaydedilemedi' });
                }

                res.status(201).json(req.isDeveloper ? {
                    wallet_id,
                    addressId,
                    index,
                    name,
                    address,
                    qrCode: qrCodeBase64
                } : { wallet_id, addressId, name, address, qrCode: qrCodeBase64 });
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPrivateKey = async (req, res) => {
    try {
        const { wallet_id, user_id, index, address_id } = req.body;

        walletModel.getWalletById(wallet_id, async (err, wallet) => {
            if (err || !wallet) {
                return res.status(404).json({ error: 'Wallet bulunamadı' });
            }

            if (wallet.user_id !== user_id) {
                return res.status(403).json({ error: 'Yetkisiz işlem' });
            }

            walletModel.getAddressById(address_id, async (err, address) => {
                if (err || !address) {
                    return res.status(404).json({ error: 'Adres bulunamadı' });
                }

                if (address.private_key && address.mn_index !== null) {
                    return res.status(400).json({ error: 'Adres zaten bir private key ve index değerine sahip' });
                }

                const mnemonic = wallet.mnemonic;

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

                res.status(200).json(req.isDeveloper ? {
                    privateKey: privateKey,
                    mn_index: index
                } : { success: true });
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

        res.status(200).json({ privateKey: privateKey, mn_index: index });
    });
};

exports.sendTRX = async (req, res) => {
    try {
        const { fromAddress, toAddress, amount, privateKey } = req.body;

        // Tatum API ayarları
        const options = {
            method: 'POST',
            url: 'https://api.tatum.io/v3/tron/transaction',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'x-api-key': process.env.TATUM_API_KEY
            },
            data: {
                fromPrivateKey: privateKey,
                to: toAddress,
                amount: amount.toString() // Miktarı string olarak gönderiyoruz
            }
        };

        // Tatum API üzerinden TRX gönderim işlemi
        const response = await axios.request(options);
        const transactionId = response.data.txId;

        // İşlem başarılıysa veritabanına kaydetme ve status = 1 (başarılı) olarak ayarlama
        db.query(
            'INSERT INTO transactions (from_address, to_address, amount, tx_id, status) VALUES (?, ?, ?, ?, 1)',
            [fromAddress, toAddress, amount, transactionId],
            (err, result) => {
                if (err) {
                    console.error('İşlem veritabanına kaydedilemedi:', err);
                }
            }
        );

        // Başarılı yanıt döndür
        res.status(200).json({
            message: 'TRX transfer işlemi başarılı.',
            transactionId: transactionId
        });

    } catch (error) {
        // İşlem başarısızsa veritabanına kaydetme ve status = 2 (başarısız) olarak ayarlama
        db.query(
            'INSERT INTO transactions (from_address, to_address, amount, status) VALUES (?, ?, ?, 2)',
            [fromAddress, toAddress, amount],
            (err, result) => {
                if (err) {
                    console.error('Başarısız işlem veritabanına kaydedilemedi:', err);
                }
            }
        );

        res.status(500).json({ error: 'TRX gönderimi sırasında bir hata oluştu.', details: error.message });
    }
};

exports.checkTransactionStatus = async (req, res) => {
    try {
        const { txId } = req.params;

        const options = {
            method: 'GET',
            url: `https://api.tatum.io/v3/tron/transaction/${txId}`,
            headers: {
                accept: 'application/json',
                'x-api-key': process.env.TATUM_API_KEY
            }
        };

        const response = await axios.request(options);

        res.status(200).json({
            message: 'İşlem durumu başarıyla sorgulandı.',
            transactionDetails: response.data
        });

        if (response.data.confirmed) {
            db.query(
                'UPDATE transactions SET status = 1 WHERE tx_id = ?',
                [txId],
                (err, result) => {
                    if (err) {
                        console.error('İşlem durumu güncellenemedi:', err);
                    }
                }
            );
        }
    } catch (error) {
        res.status(500).json({ error: 'İşlem durumu sorgulama sırasında bir hata oluştu.', details: error.message });
    }
};

exports.freezeBalance = async (req, res) => {
    try {
        const { fromAddress, privateKey, amount, resource } = req.body;

        const options = {
            method: 'POST',
            url: 'https://api.tatum.io/v3/tron/freeze',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'x-api-key': process.env.TATUM_API_KEY
            },
            data: {
                fromPrivateKey: privateKey,
                resource: resource,
                amount: amount.toString()
            }
        };

        const response = await axios.request(options);

        // Dondurma işlemi başarılı olduğunda ilgili kolonu güncelle
        const columnToUpdate = resource.toLowerCase(); // 'bandwidth' veya 'energy'
        db.query(
            `UPDATE addresses SET ${columnToUpdate} = ${columnToUpdate} + ? WHERE address = ?`,
            [amount, fromAddress],
            (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Dondurma işlemi sırasında veritabanı güncellemesi başarısız oldu.' });
                }
                res.status(200).json({
                    message: 'TRX dondurma işlemi başarılı.',
                    details: response.data
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'TRX dondurma işlemi sırasında bir hata oluştu.', details: error.message });
    }
};

exports.unfreezeBalance = async (req, res) => {
    try {
        const { fromAddress, privateKey, resource } = req.body;

        const options = {
            method: 'POST',
            url: 'https://api.tatum.io/v3/tron/unfreeze',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'x-api-key': process.env.TATUM_API_KEY
            },
            data: {
                fromPrivateKey: privateKey,
                resource: resource
            }
        };

        const response = await axios.request(options);

        // Çözme işlemi başarılı olduğunda ilgili kolonu sıfırla
        const columnToUpdate = resource.toLowerCase(); // 'bandwidth' veya 'energy'
        db.query(
            `UPDATE addresses SET ${columnToUpdate} = 0 WHERE address = ?`,
            [fromAddress],
            (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Çözme işlemi sırasında veritabanı güncellemesi başarısız oldu.' });
                }
                res.status(200).json({
                    message: 'Dondurulmuş TRX çözme işlemi başarılı.',
                    details: response.data
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Dondurulmuş TRX çözme işlemi sırasında bir hata oluştu.', details: error.message });
    }
};