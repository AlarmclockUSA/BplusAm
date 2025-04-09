import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import Stripe from 'stripe';

// Initialize dotenv
dotenv.config();

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Enable CORS for all routes
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// Create payment endpoint
app.post('/api/create-payment', async (req, res) => {
    try {
        const { payment_method_id, price_id, formData } = req.body;

        if (!payment_method_id || !price_id || !formData) {
            return res.status(400).json({
                success: false,
                error: 'Missing required payment information'
            });
        }

        console.log('Creating payment with metadata:', {
            source: "Ambassador Only Funnel",
            ...formData
        });

        // Create a payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 1000, // $10.00 in cents
            currency: 'usd',
            payment_method: payment_method_id,
            confirm: true,
            return_url: `${req.headers.origin}/success.html`,
            description: "Ambassador Registration Fee",
            statement_descriptor: "BRILLIANT PLUS",
            metadata: {
                source: "Ambassador Only Funnel",
                ...formData
            }
        });

        if (paymentIntent.status === 'succeeded') {
            return res.json({
                success: true,
                client_secret: paymentIntent.client_secret
            });
        } else if (paymentIntent.status === 'requires_action') {
            return res.json({
                success: false,
                payment_intent_client_secret: paymentIntent.client_secret
            });
        } else {
            return res.status(400).json({
                success: false,
                error: 'Payment failed'
            });
        }
    } catch (error) {
        console.error('Payment processing error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'An error occurred while processing the payment'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 