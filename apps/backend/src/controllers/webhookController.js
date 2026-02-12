const { getSecret } = require('../config/secrets');
const { getStripe } = require('../config/stripe');
const { getSupabase } = require('../config/supabase');
const { verifyTaskSignature, updateTaskStatus } = require('../services/taskService');
const { analyzeWithAI } = require('../services/aiService');

const handleStripeWebhook = async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const stripe = getStripe();

    let STRIPE_WEBHOOK_SECRET = await getSecret('STRIPE_WEBHOOK_SECRET').catch(() => process.env.STRIPE_WEBHOOK_SECRET);
    if (!STRIPE_WEBHOOK_SECRET) {
        STRIPE_WEBHOOK_SECRET = await getSecret('WEBHOOK_SECRET').catch(() => process.env.WEBHOOK_SECRET);
    }

    if (!STRIPE_WEBHOOK_SECRET) {
        console.error('❌ Missing STRIPE_WEBHOOK_SECRET');
        return res.status(500).send('Webhook Secret Config Error');
    }

    let event;
    try {
        // Use rawBody for signature verification if available (best practice with express.json)
        const payload = req.rawBody || req.body;
        event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`⚠️  Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        console.log(`💰 PaymentIntent was successful! ${paymentIntent.id}`);
        const { userId, service } = paymentIntent.metadata;

        if (service === 'rentman_credits' && userId) {
            try {
                const supabase = getSupabase();
                const { error } = await supabase.from('transactions').insert({
                    user_id: userId,
                    type: 'deposit',
                    amount: paymentIntent.amount / 100,
                    currency: paymentIntent.currency.toUpperCase(),
                    status: 'completed',
                    description: `Wallet Deposit (Stripe: ${paymentIntent.id.substring(paymentIntent.id.length - 8)})`,
                    metadata: {
                        stripe_payment_intent: paymentIntent.id,
                        stripe_charge: paymentIntent.latest_charge
                    },
                    processed_at: new Date().toISOString()
                });

                if (error) throw error;
                console.log(`✅ Wallet credited for User ${userId}`);
            } catch (dbError) {
                console.error('❌ Failed to credit wallet:', dbError);
                return res.status(500).send('DB Error');
            }
        }
    }

    res.json({ received: true });
};

const handleTaskWebhook = async (req, res) => {
    const { type, table, record } = req.body;

    if (table !== 'tasks' || type !== 'INSERT') {
        return res.status(200).send('Ignored');
    }

    console.log(`✨ New Task Created: ${record.id}`);

    try {
        await verifyTaskSignature(record);
        console.log('✅ Signature Verified. Agent is authentic.');

        await updateTaskStatus(record.id, 'verifying', { verified: true });

        analyzeWithAI(record, updateTaskStatus).catch(err => console.error('Async AI Error:', err));

    } catch (err) {
        console.error('💥 Error processing task:', err.message);
        if (err.message.includes('Signature') || err.message.includes('Agent')) {
            await updateTaskStatus(record.id, 'rejected', { error: err.message });
        }
        return res.status(200).send('Processed with Error');
    }

    res.status(200).send('Processed');
};

module.exports = { handleStripeWebhook, handleTaskWebhook };
