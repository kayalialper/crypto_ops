const dotenv = require('dotenv');

dotenv.config();
const authMiddleware = (req, res, next) => {
    // Sadece localhost'tan gelen isteklerde doğrulamayı atla
    const isInternalRequest = req.hostname === 'localhost' || req.hostname === '127.0.0.1';

    if (!isInternalRequest) {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({ error: 'API anahtarı eksik' });
        }

        if (apiKey !== process.env.TATUM_API_KEY) {
            return res.status(403).json({ error: 'Geçersiz API anahtarı' });
        }
    }
    next();
};

module.exports = authMiddleware;