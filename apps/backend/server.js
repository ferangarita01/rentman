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

// --- STRIPE ENDPOINTS ---

// 1. Create Payment Intent (For Dashboard "Buy Credits")
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'usd' } = req.body;

        if (!amount) return res.status(400).send({ error: 'Amount required' });

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency: currency,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                service: 'rentman_credits'
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
