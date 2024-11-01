
const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');

const checkRequestType = require('./middlewares/checkRequestType');

const walletRoutes = require('./routes/walletRoutes');
const networkRoutes = require('./routes/networkRoutes');
const conversionRoutes = require('./routes/conversionRoutes');
const authMiddleware = require('./middlewares/authMiddleware');
const logRequest = require('./middlewares/logRequest');
const frontendRoutes = require('./routes/frontendRoutes');

dotenv.config();
const app = express();
app.use(express.json());
app.use(morgan('dev'));

app.use('/frontend', frontendRoutes);

app.use(logRequest);

app.use(express.static('public'));

// app.use('/api', checkRequestType);
app.use('/api', conversionRoutes);
app.use('/api', checkRequestType, authMiddleware, walletRoutes);
app.use('/api', checkRequestType, authMiddleware, networkRoutes);

const PORT = process.env.PORT || 4563;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});