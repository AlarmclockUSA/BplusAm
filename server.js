require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from public directory with absolute path
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for root route
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  console.log(`Serving index.html from: ${indexPath}`);
  res.sendFile(indexPath);
});

// Serve success.html
app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

// Serve Stripe publishable key
app.get('/stripe-key', (req, res) => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return res.status(500).json({ error: 'Stripe publishable key not found' });
  }
  res.json({ key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY });
});

// Handle successful payment and redirect
app.post('/payment-success', async (req, res) => {
  try {
    const { paymentIntent, affiliateData } = req.body;
    const ambassadorId = 'amb_' + Math.random().toString(36).substr(2, 9);
    res.json({ 
      success: true,
      redirectUrl: `/success.html?id=${ambassadorId}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create payment intent
app.post('/create-payment-intent', async (req, res) => {
  try {
    console.log('Creating payment intent');
    const { affiliateData } = req.body;
    
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Missing Stripe secret key');
      return res.status(500).json({ error: 'Stripe secret key is missing' });
    }
    
    console.log('Retrieving price from Stripe');
    const price = await stripe.prices.retrieve('price_1RBgAMEWsQ0IpmHOfLYH1MPt');
    console.log(`Price retrieved: ${price.unit_amount} ${price.currency}`);
    
    console.log('Creating payment intent with Stripe');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: price.currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        source: 'Ambassador Only Funnel',
        source_url: affiliateData?.source_url || 'direct'
      }
    });
    
    console.log(`Payment intent created with ID: ${paymentIntent.id}`);
    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 