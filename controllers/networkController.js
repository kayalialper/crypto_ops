const axios = require('axios');
const db = require('../config/db');

exports.getCurrentBlock = async (req, res) => {
    try {
        const options = {
            method: 'GET',
            url: 'https://api.tatum.io/v3/tron/info',
            headers: {
                accept: 'application/json',
                'x-api-key': process.env.TATUM_API_KEY
            }
        };

        const response = await axios.request(options);
        const { hash, blockNumber } = response.data;

        if (!hash || !blockNumber) {
            return res.status(500).json({ error: 'Ağ sağlıksız' });
        }

        db.query(
            'INSERT INTO tron_network_status (block_hash, block_number) VALUES (?, ?)',
            [hash, blockNumber],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ error: 'Blok bilgisi kaydedilemedi' });
                }

                res.status(200).json({
                    message: 'Güncel blok bilgisi kaydedildi',
                    data: req.isDeveloper ? response.data : { blockNumber }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTronAccountByAddress = async (req, res) => {
    const { address } = req.params;

    try {
        const options = {
            method: 'GET',
            url: `https://api.tatum.io/v3/tron/account/${address}`,
            headers: {
                accept: 'application/json',
                'x-api-key': process.env.TATUM_API_KEY
            }
        };

        const response = await axios.request(options);

        res.status(200).json(req.isDeveloper ? response.data : { balance: response.data.balance });
    } catch (error) {
        if (error.response && error.response.status === 403) {
            res.status(404).json({ error: 'Tron hesabı bulunamadı veya etkin değil' });
        } else {
            res.status(500).json({ error: 'Tron hesabı bilgisi alınamadı', details: error.message });
        }
    }
};