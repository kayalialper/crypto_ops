const db = require('../config/db');

const checkUserExists = (req, res, next) => {
    const { userId } = req.body;

    db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Veritabanı hatası' });
        }

        if (results.length === 0) {
            return res.status(403).json({ error: 'Yetkisiz işlem: Kullanıcı bulunamadı' });
        }

        next();
    });
};

module.exports = checkUserExists;