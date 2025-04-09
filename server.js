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
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Enable CORS for all routes
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// Create payment endpoint
app.post('/api/create-payment', async (req, res) => {
    try {
        const { payment_method_id, formData } = req.body;

        if (!payment_method_id || !formData) {
            return res.status(400).json({
                success: false,
                error: 'Missing required payment information'
            });
        }

        console.log('Creating subscription with metadata:', {
            source: "Ambassador Only Funnel",
            ...formData
        });

        // Create a customer
        const customer = await stripe.customers.create({
            payment_method: payment_method_id,
            email: formData.email,
            name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            address: {
                line1: formData.street1,
                line2: formData.street2,
                city: formData.city,
                state: formData.province,
                postal_code: formData.postalCode,
                country: formData.country
            }
        });

        // Create the subscription with the specific price ID
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: process.env.STRIPE_PRICE_ID }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                source: "Ambassador Only Funnel",
                ...formData
            }
        });

        // Return the client secret for payment confirmation
        return res.json({
            success: true,
            status: 'requires_action',
            client_secret: subscription.latest_invoice.payment_intent.client_secret,
            subscriptionId: subscription.id
        });

    } catch (error) {
        console.error('Subscription creation error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'An error occurred while creating the subscription'
        });
    }
});

// Add endpoint to get configuration
app.get('/api/config', (req, res) => {
    try {
        const config = {
            stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
            priceId: process.env.STRIPE_PRICE_ID,
            environment: NODE_ENV
        };

        // Log the config (without sensitive data)
        console.log('Serving config:', {
            hasPublishableKey: !!config.stripePublishableKey,
            hasPriceId: !!config.priceId,
            environment: config.environment
        });

        if (!config.stripePublishableKey || !config.priceId) {
            throw new Error('Missing required Stripe configuration');
        }

        res.json(config);
    } catch (error) {
        console.error('Config endpoint error:', error);
        res.status(500).json({
            error: 'Failed to load configuration',
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${NODE_ENV} mode`);
}); 