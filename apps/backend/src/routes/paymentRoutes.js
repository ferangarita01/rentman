const express = require('express');
const { createPaymentIntent, createCheckoutSession, onboardUser, transferFunds } = require('../controllers/paymentController');

const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');

router.post('/api/create-payment-intent', authMiddleware, createPaymentIntent);
router.post('/api/create-checkout-session', authMiddleware, createCheckoutSession);
router.post('/api/stripe/onboard', authMiddleware, onboardUser);
router.post('/api/stripe/transfer', authMiddleware, transferFunds);

module.exports = router;
