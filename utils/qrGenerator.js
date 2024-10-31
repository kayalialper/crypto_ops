// utils/qrGenerator.js
const QRCode = require('qr-image');

exports.generateQRBase64 = (address) => {
    const qrBuffer = QRCode.imageSync(address, { type: 'png' });
    return qrBuffer.toString('base64');
};