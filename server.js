const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced CORS configuration for Framer
const corsOptions = {
    origin: [
        'https://framer.com',
        'https://www.framer.com',
        'https://*.framer.app',
        'https://*.framercanvas.com',
        'https://project-*.framercanvas.com',
        'http://localhost:3000'
    ],
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-KEYALI-API', 'Accept'],
    credentials: false, // Changed to false since we're not sending credentials
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Also add a preflight handler
app.options('*', cors(corsOptions));
app.use(express.json());

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Route to fetch multiple items from Aliphia API
app.get('/api/products', async (req, res) => {
    try {
        const response = await axios.get('https://aliphia.com/v1/api_public/items', {
            params: {
                'X-KEYALI-API': process.env.ALIBIA_API_KEY,
                'limit': req.query.limit || 10
            },
            auth: {
                username: process.env.ALIBIA_USERNAME,
                password: process.env.ALIBIA_PASSWORD,
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.0; WOW64; rv:24.0) Gecko/20100101 Firefox/24.0',
            },
        });

        // Add CORS headers specifically for Framer
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, X-KEYALI-API');

        res.status(200).json({
            success: true,
            data: response.data.response.items,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching products:', error.response ? error.response.data : error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products',
            details: error.response ? error.response.data : error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Existing route to fetch item by ID with enhanced error handling
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

        res.status(200).json({
            success: true,
            data: response.data.response.item,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching item:', error.response ? error.response.data : error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch item',
            details: error.response ? error.response.data : error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});