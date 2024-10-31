const db = require('../config/db');

const validateAddressAndKey = (req, res, next) => {
    const { fromAddress, privateKey } = req.body;

    db.query(
        'SELECT * FROM addresses WHERE address = ? AND private_key = ?',
        [fromAddress, privateKey],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Veritabanı hatası' });
            }

            if (results.length === 0) {
                return res.status(403).json({ error: 'Yetkisiz işlem: Private key ile adres uyuşmuyor.' });
            }

            next();
        }
    );
};

module.exports = validateAddressAndKey;