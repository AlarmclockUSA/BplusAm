# Brilliant Plus Ambassador Portal

A web application for managing Brilliant Plus ambassadors, handling registrations, and processing payments.

## Setup

1. Clone the repository:
```bash
git clone [repository-url]
cd [repository-name]
```

2. Install dependencies:
```bash
npm install
```

3. Configure API keys:
   - Copy `maps-config.template.js` to `maps-config.js`
   - Copy `stripe-config.template.js` to `stripe-config.js`
   - Add your actual API keys to these files

4. Start the development server:
```bash
node server.js
```

## Environment Variables

The following environment variables need to be set:

- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret
- `GOOGLE_MAPS_API_KEY`: Your Google Maps API key

## Security Notes

- Never commit API keys or sensitive information to the repository
- Always use environment variables for sensitive data in production
- Keep the `maps-config.js` and `stripe-config.js` files in your `.gitignore`

## Development

- The application uses vanilla JavaScript for the frontend
- Stripe Elements for payment processing
- Google Maps API for address autocomplete

## Production Deployment

Before deploying to production:

1. Ensure all API keys are properly set in your production environment
2. Set up proper SSL certificates for secure communication
3. Configure your web server to serve static files efficiently
4. Set up proper error logging and monitoring

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

[Your License Here] 