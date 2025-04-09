require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3003;

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
app.use('/', express.static(path.join(__dirname, 'public')));

// Serve index.html for root route with explicit check
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  console.log(`Attempting to serve index.html from: ${indexPath}`);
  
  if (fs.existsSync(indexPath)) {
    console.log(`File exists, serving index.html`);
    res.sendFile(indexPath);
  } else {
    console.error(`ERROR: Could not find ${indexPath}`);
    // Create a simple HTML response
    res.send(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Server Configuration Error</h1>
          <p>The application is having trouble finding the required files.</p>
          <p>Please contact support or try again later.</p>
          <p>Missing file: ${indexPath}</p>
        </body>
      </html>
    `);
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
    
    // Hard-coded amount approach instead of using price ID
    console.log('Using hard-coded amount for payment');
    
    // Create the payment intent with fixed amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00 in cents
      currency: 'usd',
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

// Serve Stripe publishable key - simple endpoint
app.get('/stripe-key', (req, res) => {
  res.json({ key: 'pk_live_XR5M7XE6egOwx6NnAsCgTzgz00w9tprsTh' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 