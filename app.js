// app.js
const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const walletRoutes = require('./routes/walletRoutes');
const authMiddleware = require('./middlewares/authMiddleware');

dotenv.config();
const app = express();
app.use(express.json());
app.use(morgan('dev'));

// API anahtarı doğrulama middleware'i
app.use(authMiddleware);

// Rotalar
app.use('/api', walletRoutes);

const PORT = process.env.PORT || 4563;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});