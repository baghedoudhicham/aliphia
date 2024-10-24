const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage for cart data (consider using Redis or MongoDB in production)
const carts = new Map();

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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-KEYALI-API', 'Accept', 'X-Cart-ID'],
    credentials: false,
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
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

// Existing products endpoint
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

// Existing single item endpoint
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

// New Cart Endpoints

// Create new cart
app.post('/api/cart', (req, res) => {
    const cartId = Date.now().toString();
    carts.set(cartId, { items: [], created: new Date().toISOString() });
    res.status(201).json({
        success: true,
        cartId,
        message: 'Cart created successfully'
    });
});

// Add item to cart
app.post('/api/cart/:cartId/items', async (req, res) => {
    const { cartId } = req.params;
    const { itemId, quantity } = req.body;

    if (!carts.has(cartId)) {
        return res.status(404).json({
            success: false,
            error: 'Cart not found'
        });
    }

    try {
        // Fetch item details from Aliphia
        const response = await axios.get(`https://aliphia.com/v1/api_public/item/${itemId}`, {
            params: { 'X-KEYALI-API': process.env.ALIBIA_API_KEY },
            auth: {
                username: process.env.ALIBIA_USERNAME,
                password: process.env.ALIBIA_PASSWORD,
            }
        });

        const item = response.data.response.item;
        const cart = carts.get(cartId);
        
        // Add or update item in cart
        const existingItemIndex = cart.items.findIndex(i => i.id === itemId);
        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            cart.items.push({
                id: itemId,
                name: item.name,
                price: item.price,
                quantity: quantity
            });
        }

        carts.set(cartId, cart);
        res.status(200).json({
            success: true,
            cart: cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to add item to cart',
            details: error.message
        });
    }
});

// Get cart contents
app.get('/api/cart/:cartId', (req, res) => {
    const { cartId } = req.params;
    const cart = carts.get(cartId);

    if (!cart) {
        return res.status(404).json({
            success: false,
            error: 'Cart not found'
        });
    }

    res.status(200).json({
        success: true,
        cart: cart
    });
});

// Create order (Cash on Delivery)
app.post('/api/orders', async (req, res) => {
    const { cartId, shippingDetails } = req.body;

    if (!carts.has(cartId)) {
        return res.status(404).json({
            success: false,
            error: 'Cart not found'
        });
    }

    const cart = carts.get(cartId);

    try {
        // Here you would typically:
        // 1. Validate shipping details
        // 2. Create order in your database
        // 3. Send order to Aliphia's system if needed
        // 4. Clear the cart

        const order = {
            id: `ORDER-${Date.now()}`,
            items: cart.items,
            shippingDetails,
            total: cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            status: 'pending',
            paymentMethod: 'cash_on_delivery',
            created: new Date().toISOString()
        };

        // Clear the cart after successful order creation
        carts.delete(cartId);

        res.status(201).json({
            success: true,
            order: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to create order',
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});