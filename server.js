const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Simplified CORS for Framer
app.use(cors({
    origin: '*',
    methods: ['GET'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.post('/api/checkout', async (req, res) => {
    const { items, customerInfo } = req.body;
  
    try {
      // Process the order (you can save it to a database, send an email, etc.)
      console.log('Order placed:', { items, customerInfo });
  
      res.json({ success: true, message: 'Order placed successfully!' });
    } catch (error) {
      console.error('Error placing order:', error.message);
      res.status(500).json({ success: false, message: 'Failed to place the order' });
    }
  });
  

// Test endpoint
app.get('/test', (req, res) => {
    res.json({
        success: true,
        message: "API is working",
        data: {
            test_product: {
                name: "Test Product",
                price: 99.99,
                image: "https://via.placeholder.com/150"
            }
        }
    });
});

// Simple products endpoint
app.get('/api/products', async (req, res) => {
    try {
        const response = await axios.get('https://aliphia.com/v1/api_public/items', {
            params: {
                'X-KEYALI-API': process.env.ALIBIA_API_KEY,
                'limit': 10
            },
            auth: {
                username: process.env.ALIBIA_USERNAME,
                password: process.env.ALIBIA_PASSWORD,
            }
        });

        const products = response.data.response.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image_url || "https://via.placeholder.com/150",
            description: item.description
        }));

        res.json({
            success: true,
            data: { products }
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.json({
            success: false,
            data: {
                products: [
                    {
                        id: "test1",
                        name: "Fallback Product",
                        price: 99.99,
                        image: "https://via.placeholder.com/150",
                        description: "Test product when API fails"
                    }
                ]
            }
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});