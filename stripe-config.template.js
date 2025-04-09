// Rename this file to stripe-config.js and add your actual API keys
const STRIPE_CONFIG = {
    PUBLISHABLE_KEY: 'YOUR_STRIPE_PUBLISHABLE_KEY_HERE',
    SECRET_KEY: 'YOUR_STRIPE_SECRET_KEY_HERE',
    WEBHOOK_SECRET: 'YOUR_STRIPE_WEBHOOK_SECRET_HERE'
};

// If using ES modules
export default STRIPE_CONFIG;

// If using CommonJS
// module.exports = STRIPE_CONFIG; 