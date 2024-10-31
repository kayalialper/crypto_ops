// middlewares/logRequest.js
const db = require('../config/db');

const logRequest = (req, res, next) => {
    if (req.originalUrl === '/favicon.ico') {
        return next();
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const requestUrl = req.originalUrl;
    const requestMethod = req.method;
    const deviceInfo = req.headers['user-agent'];
    const headers = JSON.stringify(req.headers);
    const requestBody = JSON.stringify(req.body);

    const originalSend = res.send;
    res.send = function (body) {
        const responseBody = JSON.stringify(body);

        db.query(
            'INSERT INTO logs (ip_address, request_url, request_method, device_info, headers, request_body, response_body) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [ipAddress, requestUrl, requestMethod, deviceInfo, headers, requestBody, responseBody],
            (err, result) => {
                if (err) {
                    console.error('Log kaydedilemedi:', err);
                }
            }
        );

        originalSend.call(this, body);
    };

    next();
};

module.exports = logRequest;