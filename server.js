require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3001;

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:3001', 'https://go.brilliantplus.app', '*'],
  credentials: true
}));

app.use(bodyParser.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Check for public directory and index.html
const publicDir = path.join(__dirname, 'public');
const indexPath = path.join(publicDir, 'index.html');

// Validate paths exist before starting server
console.log(`Public directory path: ${publicDir}`);
console.log(`Index file path: ${indexPath}`);

if (!fs.existsSync(publicDir)) {
  console.error(`ERROR: Public directory not found at ${publicDir}`);
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('Created public directory');
}

if (!fs.existsSync(indexPath)) {
  console.error(`ERROR: Index.html not found at ${indexPath}`);
}

// Serve static files from public directory with absolute path
app.use(express.static(publicDir));

// Serve index.html for root route
app.get('/', (req, res) => {
  if (fs.existsSync(indexPath)) {
    console.log(`Serving index.html from: ${indexPath}`);
    res.sendFile(indexPath);
  } else {
    console.error(`CRITICAL ERROR: Could not find ${indexPath}`);
    res.status(500).send('Server configuration error. Please contact support.');
  }
});

// Serve success.html
app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

// Process form submission with payment
app.post('/submit-form', async (req, res) => {
  try {
    console.log('Processing form submission with payment');
    const { firstName, lastName, email, paymentMethod } = req.body;
    
    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method is required' });
    }
    
    // Create a customer
    const customer = await stripe.customers.create({
      name: `${firstName} ${lastName}`,
      email: email,
      payment_method: paymentMethod
    });
    console.log(`Created customer: ${customer.id}`);
    
    // Fixed amount for ambassador program
    const amount = 1000; // $10.00
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      customer: customer.id,
      payment_method: paymentMethod,
      confirm: true,
      description: 'Brilliant Plus Ambassador Program - Annual Fee',
      metadata: {
        customer_name: `${firstName} ${lastName}`,
        customer_email: email,
        source: 'Ambassador Only Funnel'
      }
    });
    
    console.log(`Payment processed: ${paymentIntent.id}`);
    
    // Generate ambassador ID
    const ambassadorId = 'amb_' + Math.random().toString(36).substr(2, 9);
    
    // Return success response
    res.json({
      success: true,
      ambassadorId: ambassadorId,
      redirectUrl: `/success.html?id=${ambassadorId}`
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    const errorMessage = error.message || 'An error occurred while processing payment';
    res.status(500).json({ error: errorMessage });
  }
});

// Create payment intent
app.post('/create-payment-intent', async (req, res) => {
  try {
    console.log('Creating payment intent');
    const { affiliateData } = req.body;
    
    // Correct price ID without the 'z' at the end
    const priceId = 'price_1RBgAMEWsQ0IpmHOfLYH1MPt';
    console.log(`Retrieving price from Stripe with ID: ${priceId}`);
    
    // Retrieve the price
    const price = await stripe.prices.retrieve(priceId);
    console.log(`Price retrieved: ${price.unit_amount} ${price.currency}`);
    
    // Create the payment intent with the price
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