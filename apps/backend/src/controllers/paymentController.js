const { getStripe } = require('../config/stripe');
const { getSupabase } = require('../config/supabase');

const createPaymentIntent = async (req, res) => {
    try {
        const stripe = getStripe();
        const { amount, currency = 'usd' } = req.body;
        const userId = req.user.id; // From Auth Middleware

        if (!amount) return res.status(400).send({ error: 'Amount required' });

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100,
            currency: currency,
            automatic_payment_methods: { enabled: true },
            metadata: { service: 'rentman_credits', userId: userId }
        });

        res.send({ clientSecret: paymentIntent.client_secret });
    } catch (e) {
        console.error('Stripe Error:', e.message);
        res.status(400).send({ error: e.message });
    }
};

const createCheckoutSession = async (req, res) => {
    try {
        const stripe = getStripe();
        const { amount, returnUrl } = req.body;
        const userId = req.user.id; // From Auth Middleware

        if (!amount) return res.status(400).send({ error: 'Amount required' });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Rentman Credits',
                        description: 'Add funds to your Rentman wallet',
                    },
                    unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${returnUrl || process.env.APP_URL + '/wallet'}?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${returnUrl || process.env.APP_URL + '/wallet'}?canceled=true`,
            payment_intent_data: {
                metadata: { service: 'rentman_credits', userId: userId }
            },
            metadata: { service: 'rentman_credits', userId: userId }
        });

        res.json({ url: session.url });
    } catch (e) {
        console.error('Stripe Checkout Error:', e.message);
        res.status(500).send({ error: e.message });
    }
};

const onboardUser = async (req, res) => {
    try {
        const stripe = getStripe();
        const supabase = getSupabase();
        const { email, firstName, lastName } = req.body;
        // userId comes from token, email MUST match token email for security (or just trust token)
        const userId = req.user.id;
        const userEmail = req.user.email || email; // Prefer token email

        if (!userEmail) {
            return res.status(400).json({ error: 'Email required' });
        }

        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('stripe_connect_account_id')
            .eq('id', userId)
            .single();

        let accountId = existingProfile?.stripe_connect_account_id;

        if (accountId) {
            const accountLink = await stripe.accountLinks.create({
                account: accountId,
                refresh_url: `${process.env.APP_URL}/progress?refresh=true`,
                return_url: `${process.env.APP_URL}/progress?success=true`,
                type: 'account_onboarding',
            });
            return res.json({ url: accountLink.url, accountId: accountId, resumed: true });
        }

        const accountParams = {
            type: 'express',
            country: 'US',
            email: userEmail,
            capabilities: { transfers: { requested: true } },
            business_type: 'individual',
            metadata: { rentman_user_id: userId }
        };

        if (firstName || lastName) {
            accountParams.individual = { first_name: firstName, last_name: lastName };
        }

        const account = await stripe.accounts.create(accountParams);

        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${process.env.APP_URL}/progress?refresh=true`,
            return_url: `${process.env.APP_URL}/progress?success=true`,
            type: 'account_onboarding',
        });

        res.json({ url: accountLink.url, accountId: account.id });
    } catch (e) {
        console.error('Stripe Onboard Failed:', e.message);
        res.status(500).send({ error: e.message });
    }
};

const transferFunds = async (req, res) => {
    try {
        const stripe = getStripe();
        const supabase = getSupabase();
        const { amount, destinationAccountId, deductFee = true, taskId } = req.body || {};

        // Security Check: Ideally we should verify if req.user.id is allowed to initiate this transfer
        // For 'Withdrawal' (self-transfer), destinationAccountId should belong to req.user.id
        // For 'Payout' (task completion), this is typically triggered by System or Client approval via Escrow Release
        // This endpoint seems to be a generic transfer utility. 
        // IMPORTANT: If this is client-facing for withdrawals, we must ensure user owns the destination account.

        if (!amount || !destinationAccountId) {
            return res.status(400).json({ error: 'Missing amount or destination' });
        }

        // Verify ownership of destination account for withdrawals
        if (!taskId) { // Assuming no taskId means manual withdrawal
            const { data: profile } = await supabase
                .from('profiles')
                .select('stripe_connect_account_id')
                .eq('id', req.user.id)
                .single();

            if (profile?.stripe_connect_account_id !== destinationAccountId) {
                return res.status(403).json({ error: 'Unauthorized transfer destination' });
            }
        }

        const COMMISSION_RATE = 0.10;
        const workerAmountCents = Math.round(amount * 100);
        const platformFeeCents = deductFee ? Math.round(workerAmountCents * COMMISSION_RATE) : 0;
        const clientPaysCents = workerAmountCents + platformFeeCents;

        const transfer = await stripe.transfers.create({
            amount: workerAmountCents,
            currency: 'usd',
            destination: destinationAccountId,
            metadata: {
                reason: 'task_payout',
                taskId: taskId || 'unknown',
                clientPays: clientPaysCents,
                workerReceives: workerAmountCents,
                platformFee: platformFeeCents,
                type: 'direct_transfer',
                initiatorId: req.user.id
            }
        });

        if (taskId && taskId !== 'unknown') {
            const messageContent = `💰 PAGO COMPLETADO\n\n✅ Worker recibe: $${(workerAmountCents / 100).toFixed(2)}\n📊 Desglose:\n   • Presupuesto de Tarea: $${(workerAmountCents / 100).toFixed(2)}\n   • Comisión Plataforma (10%): $${(platformFeeCents / 100).toFixed(2)}\n   • Total Pagado por Cliente: $${(clientPaysCents / 100).toFixed(2)}`;

            await supabase.from('messages').insert({
                task_id: taskId,
                sender_id: 'system',
                sender_type: 'system',
                content: messageContent,
                message_type: 'system',
                metadata: {
                    type: 'payment_transfer',
                    transfer_id: transfer.id,
                    amounts: { clientPays: clientPaysCents, workerReceives: workerAmountCents, platformFee: platformFeeCents }
                }
            });
        }

        res.json({
            transferId: transfer.id,
            status: 'success',
            amounts: {
                clientPays: clientPaysCents / 100,
                workerReceives: workerAmountCents / 100,
                platformFee: platformFeeCents / 100
            }
        });

    } catch (e) {
        console.error('Stripe Transfer Failed:', e.message);
        res.status(500).json({ error: e.message, type: e.type, code: e.code });
    }
};

module.exports = { createPaymentIntent, createCheckoutSession, onboardUser, transferFunds };
