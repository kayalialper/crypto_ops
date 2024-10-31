// middlewares/checkUserExists.js
const db = require('../config/db');

const checkUserExists = (req, res, next) => {
    const { userId } = req.body;

    // userId'nin users tablosunda olup olmadığını kontrol et
    db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Veritabanı hatası' });
        }

        if (results.length === 0) {
            // userId bulunamadıysa yetkisiz işlem hatası döndür
            return res.status(403).json({ error: 'Yetkisiz işlem: Kullanıcı bulunamadı' });
        }

        // userId mevcutsa bir sonraki işleme geç
        next();
    });
};

module.exports = checkUserExists;