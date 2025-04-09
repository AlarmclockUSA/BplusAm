require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path = require('path');

const app = express();
const port = process.env.PORT || 3003;

// Set up EJS
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'public'));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Serve index.html with environment variables
app.get('/', (req, res) => {
  res.render('index.html', {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  });
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
    const { affiliateData } = req.body;
    const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 