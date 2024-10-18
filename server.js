// server.js

const express = require('express');
const axios = require('axios');
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// Route to fetch item by ID from Aliphia API
app.get('/api/item/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const response = await axios.get(`https://aliphia.com/v1/api_public/item/${id}`, {
            params: {
                'X-KEYALI-API': process.env.ALIBIA_API_KEY,
            },
            auth: {
                username: process.env.ALIBIA_USERNAME,
                password: process.env.ALIBIA_PASSWORD,
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.0; WOW64; rv:24.0) Gecko/20100101 Firefox/24.0',
            },
        });

        res.status(200).json(response.data.response.item);
    } catch (error) {
        console.error('Error fetching item:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch item' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});