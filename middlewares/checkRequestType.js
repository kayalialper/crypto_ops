const dotenv = require('dotenv');
dotenv.config();

const checkRequestType = (req, res, next) => {
    const requestKey = req.body.requestKey || req.query.requestKey;

    if (requestKey === process.env.REQBODY_DEVELOPER) {
        req.isDeveloper = true;
    } else if (requestKey === process.env.REQBODY_USER) {
        req.isDeveloper = false;
    } else {
        return res.status(403).json({ error: 'Geçersiz istek anahtarı' });
    }

    next();
};

module.exports = checkRequestType;