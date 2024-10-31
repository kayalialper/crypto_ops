// middlewares/authMiddleware.js
const dotenv = require('dotenv');

dotenv.config();

const authMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({ error: 'API anahtarı eksik' });
    }

    if (apiKey !== process.env.TATUM_API_KEY) {
        return res.status(403).json({ error: 'Geçersiz API anahtarı' });
    }

    next();
};

module.exports = authMiddleware;