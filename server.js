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

// Inject Stripe key and serve static files
app.use('/', (req, res, next) => {
  if (req.path === '/') {
    res.send(`
      <script>window.stripePublishableKey = '${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}';</script>
      ${require('fs').readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8')}
    `);
  } else {
    next();
  }
});

app.use(express.static('public'));

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