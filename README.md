# Brilliant Plus Ambassador Program

A payment portal for the Brilliant Plus Ambassador Program, built with Express.js and Stripe.

## Features

- Secure payment processing with Stripe Elements
- Mobile-responsive design
- Affiliate tracking system
- Success page with ambassador details
- Environment variable configuration
- Form validation and error handling

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your Stripe credentials:
```
STRIPE_PUBLISHABLE_KEY=your_publishable_key
STRIPE_SECRET_KEY=your_secret_key
STRIPE_PRICE_ID=your_price_id
```

3. Start the server:
```bash
npm start
```

The application will be available at `http://localhost:3003`

## Development

For development, use:
```bash
npm run dev
```

This will start the server with nodemon for automatic reloading.

## Project Structure

- `/public` - Static files
  - `index.html` - Main payment form
  - `success.html` - Success page
  - `app.js` - Client-side JavaScript
  - `styles.css` - Main styles
  - `success-styles.css` - Success page styles
- `server.js` - Express server
- `.env` - Environment variables (not tracked in Git)

## Affiliate Tracking

The system captures affiliate information from URL parameters:
- Path parameter (e.g., /matthigham254)
- Additional query parameters
- Stored in localStorage and passed to Stripe metadata

## Security

- Environment variables for sensitive data
- HTTPS required in production
- Stripe Elements for secure card handling
- Input validation and sanitization

## License

Private and Confidential - Brilliant Plus © 2024 