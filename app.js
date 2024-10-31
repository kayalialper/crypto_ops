// app.js
const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const walletRoutes = require('./routes/walletRoutes');
const networkRoutes = require('./routes/networkRoutes');
const authMiddleware = require('./middlewares/authMiddleware');
const logRequest = require('./middlewares/logRequest'); // Log middleware'ini import et

dotenv.config();
const app = express();
app.use(express.json());
app.use(morgan('dev'));

app.use(logRequest);
app.use(authMiddleware);

app.use('/api', walletRoutes);
app.use('/api', networkRoutes);

const PORT = process.env.PORT || 4563;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});