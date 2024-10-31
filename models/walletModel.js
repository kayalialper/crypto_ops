const db = require('../config/db');

exports.createWallet = (userId, name, network, xpub, mnemonic, callback) => {
    db.query(
        'INSERT INTO wallets (user_id, name, network, xpub, mnemonic) VALUES (?, ?, ?, ?, ?)',
        [userId, name, network, xpub, mnemonic],
        (err, results) => {
            if (err) return callback(err);
            callback(null, results.insertId);
        }
    );
};

exports.getWalletById = (walletId, callback) => {
    db.query(
        'SELECT * FROM wallets WHERE id = ?',
        [walletId],
        (err, results) => {
            if (err) return callback(err);
            callback(null, results[0]);
        }
    );
};

exports.createAddress = (walletId, name, address, qrCode, callback) => {
    db.query(
        'INSERT INTO addresses (wallet_id, name, address, qr_code) VALUES (?, ?, ?, ?)',
        [walletId, name, address, qrCode],
        (err, results) => {
            if (err) return callback(err);
            callback(null, results.insertId);
        }
    );
};


exports.getAddressById = (addressId, callback) => {
    db.query(
        'SELECT * FROM addresses WHERE id = ?',
        [addressId],
        (err, results) => {
            if (err) return callback(err);
            callback(null, results[0]);
        }
    );
};

exports.updateAddressWithPrivateKey = (addressId, privateKey, index, callback) => {
    db.query(
        'UPDATE addresses SET private_key = ?, mn_index = ? WHERE id = ?',
        [privateKey, index, addressId],
        (err, results) => {
            if (err) return callback(err);
            callback(null, results);
        }
    );
};