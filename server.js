require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path = require('path');

const app = express();
const port = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

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
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // Amount in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        ...affiliateData,
        source_url: affiliateData.source_url || 'direct'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve the payment page for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 