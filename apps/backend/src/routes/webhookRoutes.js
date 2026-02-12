const express = require('express');
const { handleStripeWebhook, handleTaskWebhook } = require('../controllers/webhookController');
const { validateWebhookSecret } = require('../middleware/auth');

const router = express.Router();

// Stripe webhook needs raw body, usually handled by express.raw() on specific route or globally if configured right.
// However, `server.js` used bodyParser.raw({type: 'application/json'}) globally which might conflict.
// Best practice: apply raw body parser ONLY to stripe webhook route.
// But for now, app.js will handle global middleware.
// Wait, `server.js` had specific handling. I should be careful.
// Let's assume input is already parsed correctly by app.js or raw body is available.
// Stripe needs RAW body for signature verification.
// If I use `express.json()` globally, `req.body` is an object.
// I need `req.rawBody` or similar.
// In `app.js` I will configure this.

router.post('/api/webhooks/stripe', handleStripeWebhook);
router.post('/webhooks/tasks', validateWebhookSecret, handleTaskWebhook);

module.exports = router;
