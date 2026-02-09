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

// 1. Create Payment Intent (For Dashboard "Buy Credits")
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
