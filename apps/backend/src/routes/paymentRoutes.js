const express = require('express');
const { createPaymentIntent, createCheckoutSession, onboardUser, transferFunds } = require('../controllers/paymentController');

const router = express.Router();

router.post('/api/create-payment-intent', createPaymentIntent);
router.post('/api/create-checkout-session', createCheckoutSession);
router.post('/api/stripe/onboard', onboardUser);
router.post('/api/stripe/transfer', transferFunds);

module.exports = router;
