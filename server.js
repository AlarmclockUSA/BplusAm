import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(path.join(__dirname, '.')));

// Configuration endpoint - only returns Stripe publishable key
app.get('/api/config', (req, res) => {
    try {
        res.json({
            stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY
        });
    } catch (error) {
        console.error('Error in /api/config:', error);
        res.status(500).json({ error: 'Failed to load configuration' });
    }
});

// Payment creation endpoint
app.post('/api/create-payment', async (req, res) => {
    try {
        const { payment_method_id, formData } = req.body;

        // Create a payment intent with metadata
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 1000, // $10.00 in cents
            currency: 'usd',
            payment_method: payment_method_id,
            confirm: true,
            metadata: {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                street1: formData.street1,
                street2: formData.street2 || '',
                city: formData.city,
                province: formData.province,
                postalCode: formData.postalCode,
                country: formData.country,
                source: 'Ambassador Program Signup'
            },
            description: 'Ambassador Program Annual Fee',
            statement_descriptor: 'AMBASSADOR FEE',
            return_url: `${req.protocol}://${req.get('host')}/success.html`
        });

        if (paymentIntent.status === 'succeeded') {
            res.json({ success: true });
        } else if (paymentIntent.status === 'requires_action') {
            res.json({
                requires_action: true,
                client_secret: paymentIntent.client_secret
            });
        } else {
            res.status(400).json({ error: 'Payment failed' });
        }
    } catch (error) {
        console.error('Error in /api/create-payment:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 