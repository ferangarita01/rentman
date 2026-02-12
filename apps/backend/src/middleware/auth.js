const { getSecret } = require('../config/secrets');

async function validateWebhookSecret(req, res, next) {
    try {
        const WEBHOOK_SECRET = await getSecret('WEBHOOK_SECRET');
        const headerSecret = req.headers['x-webhook-secret'];

        if (!headerSecret || headerSecret !== WEBHOOK_SECRET) {
            console.error('⛔ Webhook blocked: Invalid or missing x-webhook-secret header');
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid webhook authentication'
            });
        }
        next();
    } catch (error) {
        console.error('Middleware Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = { validateWebhookSecret };
