const Stripe = require('stripe');
const { getSecret } = require('./secrets');

let stripeInstance = null;

async function initializeStripe() {
    if (stripeInstance) return stripeInstance;

    const STRIPE_SECRET_KEY = await getSecret('STRIPE_SECRET_KEY');

    if (!STRIPE_SECRET_KEY) {
        throw new Error('Missing STRIPE_SECRET_KEY');
    }

    stripeInstance = Stripe(STRIPE_SECRET_KEY);
    console.log('✅ Stripe initialized');
    return stripeInstance;
}

function getStripe() {
    if (!stripeInstance) {
        throw new Error('Stripe not initialized. Call initializeStripe() first.');
    }
    return stripeInstance;
}

module.exports = { initializeStripe, getStripe };
