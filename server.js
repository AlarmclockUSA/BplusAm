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
  try {
    console.log('Fetching Stripe publishable key');
    
    // Check for environment variable
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found in environment');
      // Fallback for production if env variable not available
      const fallbackKey = 'pk_live_XR5M7XE6egOwx6NnAsCgTzgz00w9tprsh';
      console.log('Using fallback publishable key for production');
      return res.json({ key: fallbackKey });
    }
    
    console.log('Stripe publishable key found in environment');
    res.json({ key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY });
  } catch (error) {
    console.error('Error serving Stripe key:', error);
    res.status(500).json({ error: error.message });
  }
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
    
    // Fallback values for production
    const fallbackPriceId = 'price_1RBgAMEWsQ0IpmHOfLYH1MPt';
    
    // Use Stripe with secret key from env only
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not found in environment');
      return res.status(500).json({ 
        error: 'Stripe secret key missing. Please configure environment variables.' 
      });
    }
    
    console.log(`Retrieving price from Stripe with ID: ${process.env.STRIPE_PRICE_ID || fallbackPriceId}`);
    const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID || fallbackPriceId);
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