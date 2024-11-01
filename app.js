// app.js
const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const walletRoutes = require('./routes/walletRoutes');
const networkRoutes = require('./routes/networkRoutes');
const conversionRoutes = require('./routes/conversionRoutes');
const authMiddleware = require('./middlewares/authMiddleware');
const logRequest = require('./middlewares/logRequest');

dotenv.config();
const app = express();
app.use(express.json());
app.use(morgan('dev'));

app.use(logRequest);

app.use('/api', conversionRoutes);

app.use('/api', authMiddleware, walletRoutes);
app.use('/api', authMiddleware, networkRoutes);


const PORT = process.env.PORT || 4563;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});