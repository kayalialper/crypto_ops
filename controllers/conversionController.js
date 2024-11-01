const axios = require('axios');

exports.convertCurrency = async (req, res) => {
    const { from, to } = req.params;

    try {
        const response = await axios.get(`https://api.coingate.com/v2/rates/merchant/${from}/${to}`);
        const rate = response.data;

        res.status(200).json({
            from,
            to,
            rate
        });
    } catch (error) {
        res.status(500).json({
            error: 'Conversion rate could not be fetched',
            details: error.message
        });
    }
};