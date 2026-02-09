const express = require('express');
const bodyParser = require('body-parser');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const { getSecret, initializeSecrets } = require('./secrets');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Production-Ready Server Initialization with Secret Manager
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let stripe;
let supabase;
let WEBHOOK_SECRET;

async function initializeServer() {
    console.log('🚀 Initializing Rentman Backend...\n');

    try {
        // Preload all secrets (faster runtime)
        await initializeSecrets();

        // Retrieve secrets
        const STRIPE_SECRET_KEY = await getSecret('STRIPE_SECRET_KEY');
        WEBHOOK_SECRET = await getSecret('WEBHOOK_SECRET');
        const SUPABASE_SERVICE_ROLE_KEY = await getSecret('SUPABASE_SERVICE_ROLE_KEY');
        const SUPABASE_URL = await getSecret('SUPABASE_URL');

        // Initialize services
        stripe = require('stripe')(STRIPE_SECRET_KEY);
        supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        console.log('✅ Backend initialized successfully\n');
    } catch (error) {
        console.error('❌ FATAL: Failed to initialize backend');
        console.error(error);
        process.exit(1);
    }
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;

// Health Check
app.get('/', (req, res) => {
    res.status(200).send('Rentman Backend is Active 🧠');
});

// Health Endpoint for Load Balancer
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        services: {
            stripe: !!stripe,
            supabase: !!supabase
        }
    });
});

// 1. Create Payment Intent (For Dashboard "Buy Credits" - Inline)
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amount, userId, currency = 'usd' } = req.body;

        if (!amount) return res.status(400).send({ error: 'Amount required' });
        if (!userId) return res.status(400).send({ error: 'User ID required' });

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency: currency,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                service: 'rentman_credits',
                userId: userId // Critical for webhook attribution
            }
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (e) {
        console.error('Stripe Error:', e.message);
        res.status(400).send({ error: e.message });
    }
});

// 1.5 Create Checkout Session (Hosted Page - Recommended)
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { amount, userId, returnUrl } = req.body;

        if (!amount) return res.status(400).send({ error: 'Amount required' });
        if (!userId) return res.status(400).send({ error: 'User ID required' });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Rentman Credits',
                            description: 'Add funds to your Rentman wallet',
                        },
                        unit_amount: Math.round(amount * 100), // Amount in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${returnUrl || 'https://rentman.app/wallet'}?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${returnUrl || 'https://rentman.app/wallet'}?canceled=true`,
            // Essential: Pass metadata to the underlying PaymentIntent so our webhook catches it
            payment_intent_data: {
                metadata: {
                    service: 'rentman_credits',
                    userId: userId
                }
            },
            metadata: {
                service: 'rentman_credits',
                userId: userId
            }
        });

        res.json({ url: session.url });
    } catch (e) {
        console.error('Stripe Checkout Error:', e.message);
        res.status(500).send({ error: e.message });
    }
});

// 2. Stripe Connect Onboarding (For Agents/Workers)
app.post('/api/stripe/onboard', async (req, res) => {
    try {
        const { userId, email, firstName, lastName } = req.body; // metadata from our DB

        // A. Create Express Account
        const accountParams = {
            type: 'express',
            country: 'US',
            email: email,
            capabilities: {
                transfers: { requested: true }, // Only transfers needed for payouts
            },
            business_type: 'individual', // Skip business selection
            metadata: {
                rentman_user_id: userId
            }
        };

        // Option A+: Prefill Data if available
        if (firstName || lastName) {
            accountParams.individual = {
                first_name: firstName,
                last_name: lastName
            };
        }

        const account = await stripe.accounts.create(accountParams);

        // B. Create Account Link (for the UI)
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: 'https://rentman.app/wallet?refresh=true', // TODO: Update with real URL
            return_url: 'https://rentman.app/wallet?success=true',
            type: 'account_onboarding',
        });

        res.json({ url: accountLink.url, accountId: account.id });

    } catch (e) {
        console.error('Connect Error:', e.message);
        res.status(500).send({ error: e.message });
    }
});

// 3. Payout/Transfer (Pay the Agent)
app.post('/api/stripe/transfer', async (req, res) => {
    try {
        const { amount, destinationAccountId } = req.body;

        if (!amount || !destinationAccountId) {
            return res.status(400).send({ error: 'Missing amount or destination' });
        }

        // Create a Transfer to the connected account
        const transfer = await stripe.transfers.create({
            amount: amount * 100, // cents
            currency: 'usd',
            destination: destinationAccountId,
            metadata: {
                reason: 'task_payout'
            }
        });

        console.log(`✅ Transfer successful: ${transfer.id} ($${amount} to ${destinationAccountId})`);
        res.json({ transferId: transfer.id, status: 'success' });

    } catch (e) {
        // Enhanced error logging for debugging payout issues
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('💥 STRIPE TRANSFER FAILED');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error(`Error Type: ${e.type || 'Unknown'}`);
        console.error(`Error Code: ${e.code || 'N/A'}`);
        console.error(`Error Message: ${e.message}`);
        console.error(`Destination Account: ${destinationAccountId}`);
        console.error(`Amount: $${amount} USD`);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        res.status(500).send({
            error: e.message,
            type: e.type,
            code: e.code
        });
    }
});


// 4. Stripe Webhook (Handle Async Payments)
app.post('/api/webhooks/stripe', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['stripe-signature'];

    // We need a specific secret for the Stripe CLI or Production Webhook
    // For now, we'll try to use the one from secrets, or generic env
    // In production, this MUST be the webhook secret, not the API key
    let STRIPE_WEBHOOK_SECRET = await getSecret('STRIPE_WEBHOOK_SECRET').catch(() => process.env.STRIPE_WEBHOOK_SECRET);

    // Fallback: Check for 'WEBHOOK_SECRET' (Cloud Run common name)
    if (!STRIPE_WEBHOOK_SECRET) {
        STRIPE_WEBHOOK_SECRET = await getSecret('WEBHOOK_SECRET').catch(() => process.env.WEBHOOK_SECRET);
    }

    if (!STRIPE_WEBHOOK_SECRET) {
        console.error('❌ Missing STRIPE_WEBHOOK_SECRET');
        return res.status(500).send('Webhook Secret Config Error');
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`⚠️  Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        console.log(`💰 PaymentIntent was successful! ${paymentIntent.id}`);

        const { userId, service } = paymentIntent.metadata;

        if (service === 'rentman_credits' && userId) {
            try {
                // Insert 'deposit' transaction
                const { error } = await supabase.from('transactions').insert({
                    user_id: userId,
                    type: 'deposit',
                    amount: paymentIntent.amount / 100, // Cents to Dollars
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
});

// Database Webhook Endpoint
app.post('/webhooks/tasks', async (req, res) => {
    // 1. Security Check (Header-based Authentication)
    const webhookSecret = req.headers['x-webhook-secret'];

    if (!webhookSecret || webhookSecret !== WEBHOOK_SECRET) {
        console.error('⛔ Webhook blocked: Invalid or missing x-webhook-secret header');
        console.error(`   Received: ${webhookSecret ? '[REDACTED]' : 'undefined'}`);
        console.error(`   Expected: Header 'x-webhook-secret' with correct value`);
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid webhook authentication'
        });
    }

    const { type, table, record } = req.body;

    // Only process new Tasks
    if (table !== 'tasks' || type !== 'INSERT') {
        return res.status(200).send('Ignored');
    }

    console.log(`✨ New Task Created: ${record.id}`);
    console.error('DEBUG: Starting processing sequence...');

    try {
        console.error('DEBUG: Step 1: Fetching Agent...');
        // 2. Fetch Agent's Public Key
        const { data: agent, error: agentError } = await supabase
            .from('agents')
            .select('public_key')
            .eq('id', record.agent_id)
            .single();

        if (agentError || !agent) {
            console.error(`❌ Agent not found: ${record.agent_id}`);
            await updateTaskStatus(record.id, 'rejected', { error: 'Agent not registered' });
            return res.status(200).send('Agent Not Found');
        }
        console.log('Step 1: Agent found.');

        // 3. Verify Signature
        console.log('Step 2: Verifying Signature...');
        const signature = record.signature;
        const payload = record.metadata; // The original JSON payload

        if (!signature || !payload) {
            console.error('❌ Missing signature or payload');
            await updateTaskStatus(record.id, 'rejected', { error: 'Missing signature' });
            return res.status(200).send('Invalid');
        }

        // Reconstruct message exactly as signed in CLI (Deterministic)
        // Format: title:agent_id:timestamp:nonce
        const message = `${record.title}:${record.agent_id}:${payload.timestamp}:${payload.nonce}`;
        const signatureBytes = naclUtil.decodeBase64(signature);
        const messageBytes = naclUtil.decodeUTF8(message);
        const publicKeyBytes = naclUtil.decodeBase64(agent.public_key);

        const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

        if (!verified) {
            console.error('⛔ Signature Verification FAILED');
            await updateTaskStatus(record.id, 'rejected', { error: 'Invalid Signature' });
            return res.status(200).send('Verification Failed');
        }

        console.log('✅ Signature Verified. Agent is authentic.');

        // 4. Update Status (Proceed to Phase 3: AI Analysis)
        console.log('Step 3: Updating Status to VERIFYING...');
        await updateTaskStatus(record.id, 'verifying', { verified: true });
        console.log('Step 3: Status Updated.');

        // 5. Trigger Phase 3 (Vertex AI)
        console.log('Step 4: Triggering AI Analysis...');
        // Fire and forget (don't await to keep webhook fast)
        analyzeWithAI(record).catch(err => console.error('Async AI Error:', err));

    } catch (err) {
        console.error('💥 Error processing task:', err);
        return res.status(500).send('Internal Error');
    }

    res.status(200).send('Processed');
});

// Vertex AI Setup
const { VertexAI } = require('@google-cloud/vertexai');

// Initialize Vertex with your Cloud Run project
const vertex_ai = new VertexAI({ project: process.env.PROJECT_ID || 'agent-gen-1', location: 'us-central1' });
const model = vertex_ai.preview.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
        'maxOutputTokens': 2048,
        'temperature': 0.4,
        'topP': 1
    },
});

async function analyzeWithAI(record) {
    console.log(`🤖 AI Analyzing Task: ${record.title}`);

    // Construct Prompt (Fine-tuned for consistent JSON output)
    const prompt = `You are the "Rentman Brain", an AI safety and viability analyzer for task marketplace.

Analyze this task and respond ONLY with valid JSON (no markdown, no code blocks):

Task Title: ${record.title}
Description: ${record.description}
Budget: $${record.budget_amount}
Type: ${record.task_type}

Required JSON format:
{
  "viable": true,
  "safety_score": 85,
  "complexity": "medium",
  "reasoning": "Clear task with reasonable budget",
  "tags": ["delivery", "urban"]
}

Rules:
- viable: true if task is legal, safe, and achievable
- safety_score: 0-100 (reject if <70)
- complexity: "low" | "medium" | "high"
- reasoning: max 100 characters
- tags: 2-4 relevant keywords

Respond with JSON only:`;

    // AI Timeout Protection
    const AI_TIMEOUT_MS = 30000; // 30 seconds
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI analysis timeout after 30s')), AI_TIMEOUT_MS);
    });

    try {
        // Race between AI call and timeout
        const result = await Promise.race([
            model.generateContent(prompt),
            timeoutPromise
        ]);

        const response = result.response;
        const text = response.candidates[0].content.parts[0].text;

        // Enhanced JSON extraction (handles markdown code blocks)
        let aiAnalysis;
        try {
            // First try: Direct parse
            aiAnalysis = JSON.parse(text);
        } catch (e) {
            // Second try: Extract from code block
            const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiAnalysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            } else {
                throw new Error('Failed to extract JSON from AI response');
            }
        }

        console.log('🧠 AI Analysis Result:', JSON.stringify(aiAnalysis, null, 2));

        // Validate AI response structure
        if (typeof aiAnalysis.viable !== 'boolean' || typeof aiAnalysis.safety_score !== 'number') {
            throw new Error('Invalid AI response structure');
        }

        if (aiAnalysis.viable && aiAnalysis.safety_score > 70) {
            await updateTaskStatus(record.id, 'matching', { ai_analysis: aiAnalysis });
            console.log('✅ Task Approved for Matching');
        } else {
            await updateTaskStatus(record.id, 'flagged', { ai_analysis: aiAnalysis });
            console.log('⚠️ Task Flagged for Review');
        }

    } catch (err) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('💥 AI ANALYSIS FAILED');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error(`Task ID: ${record.id}`);
        console.error(`Task Title: ${record.title}`);
        console.error(`Error: ${err.message}`);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Retry mechanism (1 attempt)
        console.log('🔄 Retrying AI analysis (1/1)...');
        try {
            const retryResult = await Promise.race([
                model.generateContent(prompt),
                timeoutPromise
            ]);

            const retryText = retryResult.response.candidates[0].content.parts[0].text;
            const retryAnalysis = JSON.parse(retryText.match(/\{[\s\S]*\}/)[0]);

            console.log('✅ Retry successful');

            if (retryAnalysis.viable && retryAnalysis.safety_score > 70) {
                await updateTaskStatus(record.id, 'matching', { ai_analysis: retryAnalysis, retry: true });
            } else {
                await updateTaskStatus(record.id, 'flagged', { ai_analysis: retryAnalysis, retry: true });
            }

        } catch (retryErr) {
            console.error('❌ Retry failed. Escalating to manual review.');
            // Fallback: Manual review
            await updateTaskStatus(record.id, 'manual_review', {
                ai_error: err.message,
                retry_error: retryErr.message,
                requires_human_review: true
            });
        }
    }
}

async function updateTaskStatus(taskId, status, metadataUpdate = {}) {
    await supabase.from('tasks').update({
        status: status,
        metadata: metadataUpdate // Merges top-level keys in JSONB
    }).eq('id', taskId);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Rentman OS Chat API Routes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Initialize chat model (using stable Gemini 2.5 model)
const chatModel = vertex_ai.preview.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.8,
    },
});

const suggestionsModel = vertex_ai.preview.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.5,
    },
});

function generateSystemPrompt(context) {
    const basePrompt = `Eres RENTMAN_OS, un asistente AI especializado en coordinar tareas físicas para operadores humanos.

Tu función es ayudar a los operadores a:
- Gestionar contratos activos y entregas
- Recibir y verificar pruebas de trabajo (fotos, audio, GPS)
- Confirmar ubicaciones y coordinar logística
- Responder preguntas sobre procedimientos
- Validar que las tareas se completen correctamente

Características de tu personalidad:
- Conciso y directo (estilo militar/operacional)
- Usa terminología técnica (e.g., "Visual Proof", "GPS Fix", "Contract #")
- Confirma recepción de proofs inmediatamente
- Proactivo en pedir evidencia cuando falta

Siempre responde en español con tono operacional y profesional.`;

    let enrichedPrompt = basePrompt;

    if (context?.userName) {
        enrichedPrompt += `\n\nOperador actual: ${context.userName}`;
    }

    if (context?.currentContract) {
        enrichedPrompt += `\n\nContrato Activo:
- ID: ${context.currentContract.id}
- Tipo: ${context.currentContract.type}
- Ubicación: ${context.currentContract.location || 'N/A'}
- Estado: ${context.currentContract.status || 'active'}`;
    }

    if (context?.recentProofs && context.recentProofs.length > 0) {
        enrichedPrompt += `\n\nPruebas Recientes Recibidas:`;
        context.recentProofs.forEach((proof, idx) => {
            enrichedPrompt += `\n${idx + 1}. ${proof.type.toUpperCase()} - ${new Date(proof.timestamp).toLocaleTimeString()}`;
            if (proof.contractId) {
                enrichedPrompt += ` (Contract #${proof.contractId})`;
            }
        });
    }

    return enrichedPrompt;
}

// POST /api/chat - Main chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        // Debug logging
        console.log('📨 Request headers:', JSON.stringify(req.headers));
        console.log('📦 Request body:', JSON.stringify(req.body));
        console.log('📏 Content-Length:', req.headers['content-length']);
        console.log('📝 Content-Type:', req.headers['content-type']);

        const { message, context, history } = req.body || {};

        if (!message) {
            console.log('❌ No message in body');
            return res.status(400).json({ error: 'Message is required', receivedBody: req.body });
        }

        console.log('💬 Chat request:', { message: message.substring(0, 50) + '...' });

        const systemPrompt = generateSystemPrompt(context);
        const conversationParts = [{ text: systemPrompt }];

        if (history && history.length > 0) {
            history.forEach((msg) => {
                conversationParts.push({
                    text: `${msg.role === 'user' ? 'Usuario' : 'Rentman'}: ${msg.content}`,
                });
            });
        }

        conversationParts.push({ text: `Usuario: ${message}` });

        const result = await chatModel.generateContent({
            contents: [{ role: 'user', parts: conversationParts }],
        });

        const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';

        console.log('✅ Chat response generated');

        res.json({
            response: responseText,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('❌ Error in chat API:', error);
        res.status(500).json({
            error: 'Failed to generate response',
            details: error.message,
        });
    }
});

// POST /api/suggestions - Generate contextual suggestions
app.post('/api/suggestions', async (req, res) => {
    try {
        const { context } = req.body;

        const prompt = `Como asistente de alquileres, genera 3 sugerencias cortas y útiles para el usuario.
${context?.userName ? `Usuario: ${context.userName}` : ''}
${context?.currentRental ? `Alquiler actual: ${JSON.stringify(context.currentRental)}` : ''}

Responde SOLO con las 3 sugerencias en formato de lista, una por línea, sin números ni viñetas.`;

        const result = await suggestionsModel.generateContent(prompt);
        const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';

        const suggestions = text
            .split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .slice(0, 3);

        console.log('💡 Generated suggestions:', suggestions.length);

        res.json({ suggestions });
    } catch (error) {
        console.error('❌ Error generating suggestions:', error);
        res.status(500).json({ suggestions: [] });
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ESCROW & PAYMENTS API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// POST /api/escrow/lock - Block funds when human accepts task
app.post('/api/escrow/lock', async (req, res) => {
    try {
        const { taskId, humanId } = req.body;

        if (!taskId || !humanId) {
            return res.status(400).json({ error: 'taskId and humanId required' });
        }

        console.log(`🔒 Locking funds for task ${taskId}, human ${humanId}`);

        // 1. Get task details
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();

        if (taskError || !task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        if (task.status !== 'OPEN') {
            return res.status(400).json({ error: 'Task is not available' });
        }

        // 2. Create Stripe PaymentIntent with manual capture
        const grossAmountCents = Math.round(task.budget_amount * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: grossAmountCents,
            currency: task.budget_currency?.toLowerCase() || 'usd',
            capture_method: 'manual',
            metadata: {
                service: 'rentman_escrow',
                taskId: taskId,
                humanId: humanId,
                requesterId: task.requester_id
            }
        });

        // 3. Insert escrow transaction
        const { data: escrow, error: escrowError } = await supabase
            .from('escrow_transactions')
            .insert({
                task_id: taskId,
                requester_id: task.requester_id,
                human_id: humanId,
                gross_amount: grossAmountCents,
                status: 'held',
                stripe_payment_intent_id: paymentIntent.id
            })
            .select()
            .single();

        if (escrowError) {
            console.error('❌ Escrow creation error:', escrowError);
            return res.status(500).json({ error: 'Failed to create escrow' });
        }

        // 4. Update task
        await supabase
            .from('tasks')
            .update({
                assigned_human_id: humanId,
                status: 'ASSIGNED',
                payment_status: 'escrowed',
                updated_at: new Date().toISOString()
            })
            .eq('id', taskId);

        console.log('✅ Funds locked successfully:', escrow.id);

        res.json({
            success: true,
            escrowId: escrow.id,
            message: 'Funds locked',
            clientSecret: paymentIntent.client_secret
        });

    } catch (error) {
        console.error('❌ Escrow lock error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/escrow/release - Release funds to human after approval
app.post('/api/escrow/release', async (req, res) => {
    try {
        const { taskId, approverId } = req.body;

        if (!taskId || !approverId) {
            return res.status(400).json({ error: 'taskId and approverId required' });
        }

        console.log(`💰 Releasing funds for task ${taskId}`);

        // 1. Get task and verify approver is requester
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();

        if (taskError || !task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        if (task.requester_id !== approverId) {
            return res.status(403).json({ error: 'Only requester can approve' });
        }

        // 2. Verify all proofs are approved
        const { data: proofs } = await supabase
            .from('task_proofs')
            .select('*')
            .eq('task_id', taskId);

        if (!proofs || proofs.length === 0) {
            return res.status(400).json({ error: 'No proofs submitted' });
        }

        const pendingProofs = proofs.filter(p => p.status === 'pending');
        if (pendingProofs.length > 0) {
            return res.status(400).json({ error: 'Some proofs still pending review' });
        }

        const rejectedProofs = proofs.filter(p => p.status === 'rejected');
        if (rejectedProofs.length > 0) {
            return res.status(400).json({ error: 'Cannot release with rejected proofs' });
        }

        // 3. Get escrow transaction
        const { data: escrow, error: escrowError } = await supabase
            .from('escrow_transactions')
            .select('*')
            .eq('task_id', taskId)
            .single();

        if (escrowError || !escrow) {
            return res.status(404).json({ error: 'Escrow not found' });
        }

        if (escrow.status !== 'held') {
            return res.status(400).json({ error: `Escrow already ${escrow.status}` });
        }

        // 4. Get human's Stripe Connect account
        const { data: humanProfile } = await supabase
            .from('profiles')
            .select('stripe_connect_account_id, stripe_connect_status')
            .eq('id', escrow.human_id)
            .single();

        if (!humanProfile?.stripe_connect_account_id || humanProfile.stripe_connect_status !== 'connected') {
            return res.status(400).json({ error: 'Human must connect Stripe account first' });
        }

        // 5. Capture payment
        await stripe.paymentIntents.capture(escrow.stripe_payment_intent_id);

        // 6. Transfer to human (net amount after fees)
        const transfer = await stripe.transfers.create({
            amount: escrow.net_amount,
            currency: task.budget_currency?.toLowerCase() || 'usd',
            destination: humanProfile.stripe_connect_account_id,
            metadata: {
                taskId: taskId,
                escrowId: escrow.id
            }
        });

        // 7. Update escrow status
        await supabase
            .from('escrow_transactions')
            .update({
                status: 'released',
                stripe_transfer_id: transfer.id,
                released_at: new Date().toISOString()
            })
            .eq('id', escrow.id);

        // 8. Update task
        await supabase
            .from('tasks')
            .update({
                status: 'COMPLETED',
                payment_status: 'released',
                completed_at: new Date().toISOString()
            })
            .eq('id', taskId);

        console.log('✅ Payment released:', transfer.id);

        res.json({
            success: true,
            message: 'Payment released to human',
            transferId: transfer.id,
            amount: escrow.net_amount / 100
        });

    } catch (error) {
        console.error('❌ Escrow release error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/escrow/dispute - Initiate dispute
app.post('/api/escrow/dispute', async (req, res) => {
    try {
        const { taskId, initiatorId, reason } = req.body;

        if (!taskId || !initiatorId || !reason) {
            return res.status(400).json({ error: 'taskId, initiatorId, and reason required' });
        }

        console.log(`⚠️ Dispute initiated for task ${taskId}`);

        // 1. Get task
        const { data: task } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Verify initiator is involved in task
        if (task.requester_id !== initiatorId && task.assigned_human_id !== initiatorId) {
            return res.status(403).json({ error: 'Only task participants can dispute' });
        }

        // 2. Update escrow
        const { data: escrow } = await supabase
            .from('escrow_transactions')
            .update({
                status: 'disputed',
                dispute_reason: reason,
                disputed_at: new Date().toISOString()
            })
            .eq('task_id', taskId)
            .select()
            .single();

        // 3. Update task
        await supabase
            .from('tasks')
            .update({
                payment_status: 'disputed',
                disputed_at: new Date().toISOString()
            })
            .eq('id', taskId);

        // 4. Generate AI dispute summary
        const disputeSummary = await generateDisputeSummary(taskId, task, reason);

        console.log('📝 Dispute created with AI summary');

        res.json({
            success: true,
            message: 'Dispute initiated',
            escrowId: escrow.id,
            aiSummary: disputeSummary
        });

    } catch (error) {
        console.error('❌ Dispute error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/proofs/upload - Human uploads proof of work
app.post('/api/proofs/upload', async (req, res) => {
    try {
        const { taskId, humanId, proofType, title, description, fileUrl, locationData } = req.body;

        if (!taskId || !humanId || !proofType || !title) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log(`📸 Proof upload for task ${taskId}`);

        // 1. Verify task assignment
        const { data: task } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        if (task.assigned_human_id !== humanId) {
            return res.status(403).json({ error: 'Not assigned to this task' });
        }

        // 2. AI validation for photo/video proofs
        let aiValidation = null;
        if ((proofType === 'photo' || proofType === 'video') && fileUrl) {
            aiValidation = await validateProofWithAI(fileUrl, task);
        }

        // 3. Insert proof
        const { data: proof, error: proofError } = await supabase
            .from('task_proofs')
            .insert({
                task_id: taskId,
                human_id: humanId,
                proof_type: proofType,
                title: title,
                description: description,
                file_url: fileUrl,
                location_data: locationData,
                ai_validation: aiValidation,
                status: 'pending'
            })
            .select()
            .single();

        if (proofError) {
            console.error('❌ Proof insert error:', proofError);
            return res.status(500).json({ error: 'Failed to save proof' });
        }

        // 4. Notify requester (could use Supabase Realtime or push notification)
        console.log('📬 Notifying requester of new proof');

        res.json({
            success: true,
            proofId: proof.id,
            aiValidation: aiValidation,
            message: 'Proof uploaded successfully'
        });

    } catch (error) {
        console.error('❌ Proof upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/proofs/review - Requester approves/rejects proof
app.post('/api/proofs/review', async (req, res) => {
    try {
        const { proofId, action, reviewerId, rejectionReason } = req.body;

        if (!proofId || !action || !reviewerId) {
            return res.status(400).json({ error: 'proofId, action, and reviewerId required' });
        }

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'action must be approve or reject' });
        }

        console.log(`✅ Reviewing proof ${proofId}: ${action}`);

        // 1. Get proof and task
        const { data: proof } = await supabase
            .from('task_proofs')
            .select('*, tasks(*)')
            .eq('id', proofId)
            .single();

        if (!proof) {
            return res.status(404).json({ error: 'Proof not found' });
        }

        // 2. Verify reviewer is requester
        if (proof.tasks.requester_id !== reviewerId) {
            return res.status(403).json({ error: 'Only requester can review' });
        }

        // 3. Update proof
        const updateData = {
            status: action === 'approve' ? 'approved' : 'rejected',
            reviewed_by: reviewerId,
            reviewed_at: new Date().toISOString()
        };

        if (action === 'reject' && rejectionReason) {
            updateData.rejection_reason = rejectionReason;
        }

        await supabase
            .from('task_proofs')
            .update(updateData)
            .eq('id', proofId);

        // 4. If all proofs approved, can trigger auto-release
        if (action === 'approve') {
            const { data: allProofs } = await supabase
                .from('task_proofs')
                .select('status')
                .eq('task_id', proof.task_id);

            const allApproved = allProofs.every(p => p.status === 'approved');

            console.log(`📊 All proofs approved: ${allApproved}`);
        }

        res.json({
            success: true,
            message: `Proof ${action}d`,
            proofId: proofId
        });

    } catch (error) {
        console.error('❌ Proof review error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/escrow/status/:taskId - Get escrow status for a task
app.get('/api/escrow/status/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;

        const { data: escrow, error } = await supabase
            .from('escrow_transactions')
            .select('*')
            .eq('task_id', taskId)
            .single();

        if (error || !escrow) {
            return res.status(404).json({ error: 'Escrow not found' });
        }

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
        console.error('❌ Escrow status error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/cron/auto-approve - Cron endpoint for auto-approving proofs
app.post('/api/cron/auto-approve', async (req, res) => {
    try {
        console.log('⏰ Cron triggered: auto-approve');

        const { autoApproveExpiredProofs } = require('./cron-auto-approve');
        await autoApproveExpiredProofs(supabase);

        res.json({ success: true, message: 'Auto-approve completed' });
    } catch (error) {
        console.error('❌ Cron error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper Functions for Escrow
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function validateProofWithAI(fileUrl, taskContext) {
    try {
        const prompt = `Analiza esta prueba de trabajo y valídala contra los requisitos de la tarea.

Tarea: ${taskContext.title}
Descripción: ${taskContext.description}
Tipo: ${taskContext.task_type}

Responde SOLO con JSON válido:
{
    "valid": true,
    "confidence": 85,
    "issues": [],
    "summary": "Proof matches task requirements"
}

Reglas:
- valid: true si la prueba demuestra trabajo completado
- confidence: 0-100
- issues: array de problemas detectados
- summary: resumen breve`;

        const result = await model.generateContent(prompt);
        const text = result.response.candidates[0].content.parts[0].text;

        let validation;
        try {
            validation = JSON.parse(text);
        } catch (e) {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                validation = JSON.parse(jsonMatch[0]);
            } else {
                validation = { valid: true, confidence: 50, issues: [], summary: 'Manual review required' };
            }
        }

        return validation;
    } catch (error) {
        console.error('❌ AI validation error:', error);
        return { valid: true, confidence: 0, issues: ['AI validation failed'], summary: 'Manual review required' };
    }
}

async function generateDisputeSummary(taskId, task, disputeReason) {
    try {
        // Get all proofs and messages related to task
        const { data: proofs } = await supabase
            .from('task_proofs')
            .select('*')
            .eq('task_id', taskId);

        const prompt = `Genera un resumen objetivo de esta disputa para el equipo de soporte.

Tarea: ${task.title}
Budget: $${task.budget_amount}
Razón de disputa: ${disputeReason}

Pruebas enviadas: ${proofs?.length || 0}
${proofs?.map(p => `- ${p.proof_type}: ${p.status}`).join('\n')}

Genera un resumen ejecutivo en JSON:
{
    "severity": "high|medium|low",
    "recommended_action": "release|refund|mediation",
    "key_points": ["punto1", "punto2"],
    "evidence_quality": "strong|moderate|weak"
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.candidates[0].content.parts[0].text;

        try {
            return JSON.parse(text);
        } catch (e) {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : { severity: 'medium', recommended_action: 'mediation' };
        }
    } catch (error) {
        console.error('❌ Dispute summary error:', error);
        return { severity: 'medium', recommended_action: 'mediation', error: error.message };
    }
}

// Start server after loading secrets
initializeServer().then(() => {
    app.listen(PORT, () => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🚀 Rentman Backend Server');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📡 Listening on port ${PORT}`);
        console.log(`🔐 Secrets: Google Cloud Secret Manager`);
        console.log(`🌐 Project: ${process.env.GCP_PROJECT_ID || 'agent-gen-1'}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
}).catch(err => {
    console.error('❌ Failed to initialize server:', err);
    process.exit(1);
});
