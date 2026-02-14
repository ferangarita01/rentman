const { getStripe } = require('../config/stripe');
const { getSupabase } = require('../config/supabase');
const { generateDisputeSummary } = require('../services/aiService');
const { sendNotification } = require('../services/notificationService');

const lockFunds = async (req, res) => {
    try {
        const stripe = getStripe();
        const supabase = getSupabase();
        const { taskId, humanId } = req.body;
        const requesterId = req.user.id; // From Auth Middleware

        if (!taskId || !humanId) return res.status(400).json({ error: 'taskId and humanId required' });

        const { data: task, error: taskError } = await supabase.from('tasks').select('*').eq('id', taskId).single();
        if (taskError || !task) return res.status(404).json({ error: 'Task not found' });

        // Security Check: Only the task requester can lock funds
        if (task.requester_id !== requesterId) {
            return res.status(403).json({ error: 'Unauthorized: Only the requester can lock funds' });
        }

        if (task.status !== 'OPEN') return res.status(400).json({ error: 'Task is not available' });

        const COMMISSION_RATE = 0.10;
        const workerAmountCents = Math.round(task.budget_amount * 100);
        const platformFeeCents = Math.round(workerAmountCents * COMMISSION_RATE);
        const clientPaysCents = workerAmountCents + platformFeeCents;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: clientPaysCents,
            currency: task.budget_currency?.toLowerCase() || 'usd',
            capture_method: 'manual',
            metadata: { service: 'rentman_escrow', taskId, humanId, requesterId: requesterId }
        });

        const { data: escrow, error: escrowError } = await supabase.from('escrow_transactions').insert({
            task_id: taskId,
            requester_id: requesterId,
            human_id: humanId,
            gross_amount: clientPaysCents,
            platform_fee_amount: platformFeeCents,
            net_amount: workerAmountCents,
            status: 'held',
            stripe_payment_intent_id: paymentIntent.id
        }).select().single();

        if (escrowError) return res.status(500).json({ error: 'Failed to create escrow' });

        await supabase.from('tasks').update({
            assigned_human_id: humanId, status: 'ASSIGNED', payment_status: 'escrowed', updated_at: new Date().toISOString()
        }).eq('id', taskId);

        // NOTIFICATION: Notify Worker that funds are secured
        await sendNotification(
            humanId,
            'Fondos en Garantía 🔒',
            `El cliente ha depositado los fondos para la tarea "${task.title}". Puedes comenzar.`,
            { taskId: taskId, type: 'funds_locked' }
        );

        res.json({
            success: true, escrowId: escrow.id, message: 'Funds locked',
            clientSecret: paymentIntent.client_secret,
            amounts: { workerReceives: workerAmountCents / 100, platformFee: platformFeeCents / 100, clientPays: clientPaysCents / 100 }
        });

    } catch (error) {
        console.error('❌ Escrow lock error:', error);
        res.status(500).json({ error: error.message });
    }
};

const releaseFunds = async (req, res) => {
    try {
        const stripe = getStripe();
        const supabase = getSupabase();
        const { taskId } = req.body;
        const approverId = req.user.id; // From Auth Middleware

        if (!taskId) return res.status(400).json({ error: 'taskId required' });

        const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();
        if (!task) return res.status(404).json({ error: 'Task not found' });

        // Security Check
        if (task.requester_id !== approverId) return res.status(403).json({ error: 'Only requester can approve' });

        const { data: proofs } = await supabase.from('task_proofs').select('*').eq('task_id', taskId);
        if (!proofs || proofs.length === 0) return res.status(400).json({ error: 'No proofs submitted' });
        if (proofs.some(p => p.status === 'pending')) return res.status(400).json({ error: 'Proofs pending review' });
        if (proofs.some(p => p.status === 'rejected')) return res.status(400).json({ error: 'Proofs rejected' });

        const { data: escrow } = await supabase.from('escrow_transactions').select('*').eq('task_id', taskId).single();
        if (!escrow || escrow.status !== 'held') return res.status(400).json({ error: 'Invalid escrow status' });

        const { data: humanProfile } = await supabase.from('profiles').select('stripe_connect_account_id, stripe_connect_status').eq('id', escrow.human_id).single();
        if (!humanProfile?.stripe_connect_account_id) return res.status(400).json({ error: 'Human needs Stripe Connect' });

        await stripe.paymentIntents.capture(escrow.stripe_payment_intent_id);

        const workerPayout = escrow.net_amount;
        const transfer = await stripe.transfers.create({
            amount: workerPayout,
            currency: 'usd',
            destination: humanProfile.stripe_connect_account_id,
            metadata: { taskId, escrowId: escrow.id, type: 'escrow_release' }
        });

        await supabase.from('escrow_transactions').update({
            status: 'released', stripe_transfer_id: transfer.id, released_at: new Date().toISOString(), platform_fee: escrow.platform_fee_amount, worker_payout: workerPayout
        }).eq('id', escrow.id);

        await supabase.from('tasks').update({ status: 'COMPLETED', payment_status: 'released', completed_at: new Date().toISOString() }).eq('id', taskId);

        // NOTIFICATION: Notify Worker of Payment
        await sendNotification(
            escrow.human_id,
            'Pago Liberado 💰',
            `Se han liberado $${(workerPayout / 100).toFixed(2)} a tu cuenta por la tarea "${task.title}".`,
            { taskId: taskId, type: 'payment_released' }
        );

        res.json({ success: true, message: 'Payment released', transferId: transfer.id });

    } catch (error) {
        console.error('❌ Escrow release error:', error);
        res.status(500).json({ error: error.message });
    }
};

const initiateDispute = async (req, res) => {
    try {
        const supabase = getSupabase();
        const { taskId, reason } = req.body;
        const initiatorId = req.user.id; // From Auth Middleware

        if (!taskId || !reason) return res.status(400).json({ error: 'Missing fields' });

        const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();
        if (!task) return res.status(404).json({ error: 'Task not found' });

        // Security Check
        if (task.requester_id !== initiatorId && task.assigned_human_id !== initiatorId) return res.status(403).json({ error: 'Not participant' });

        const { data: escrow } = await supabase.from('escrow_transactions').update({
            status: 'disputed', dispute_reason: reason, disputed_at: new Date().toISOString()
        }).eq('task_id', taskId).select().single();

        await supabase.from('tasks').update({ payment_status: 'disputed', disputed_at: new Date().toISOString() }).eq('id', taskId);

        const { data: proofs } = await supabase.from('task_proofs').select('*').eq('task_id', taskId);
        const disputeSummary = await generateDisputeSummary(taskId, task, reason, proofs);

        // NOTIFICATION: Notify Counterparty
        const counterpartyId = initiatorId === task.requester_id ? task.assigned_human_id : task.requester_id;
        if (counterpartyId) {
            await sendNotification(
                counterpartyId,
                'Disputa Iniciada ⚠️',
                `Se ha abierto una disputa en la tarea "${task.title}". Razón: ${reason}`,
                { taskId: taskId, type: 'dispute_opened' }
            );
        }

        res.json({ success: true, message: 'Dispute initiated', escrowId: escrow.id, aiSummary: disputeSummary });

    } catch (error) {
        console.error('❌ Dispute error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getEscrowStatus = async (req, res) => {
    try {
        const supabase = getSupabase();
        const { taskId } = req.params;

        const { data: escrow, error } = await supabase.from('escrow_transactions').select('*').eq('task_id', taskId).single();
        if (error || !escrow) return res.status(404).json({ error: 'Escrow not found' });

        res.json({
            status: escrow.status,
            grossAmount: escrow.gross_amount / 100,
            netAmount: escrow.net_amount / 100,
            platformFee: escrow.platform_fee_amount / 100,
            disputeFee: escrow.dispute_fee_amount / 100,
            heldAt: escrow.held_at,
            releasedAt: escrow.released_at
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { lockFunds, releaseFunds, initiateDispute, getEscrowStatus };
