require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html with injected environment variables
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  fs.readFile(indexPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading index.html:', err);
      return res.status(500).send('Error loading page');
    }
    
    // Inject the Stripe publishable key
    const html = data.replace(
      '<script>',
      `<script>const stripePublishableKey = '${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}';`
    );
    
    res.send(html);
  });
});

// Handle successful payment and redirect
app.post('/payment-success', async (req, res) => {
  try {
    const { paymentIntent, affiliateData } = req.body;
    
    // Generate ambassador ID
    const ambassadorId = 'amb_' + Math.random().toString(36).substr(2, 9);
    
    // Here you can:
    // 1. Store the payment and affiliate data in your database
    // 2. Send the data to Zapier
    // 3. Trigger any other necessary actions
    
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
    const { affiliateData } = req.body;
    
    // Get the price from Stripe
    const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount, // Use the amount from the price object
      currency: price.currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        ...affiliateData,
        source_url: affiliateData.source_url || 'direct',
        price_id: process.env.STRIPE_PRICE_ID
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
  // First try to serve the actual file
  const filePath = path.join(__dirname, 'public', req.path);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    // If file doesn't exist, serve index.html for client-side routing
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 