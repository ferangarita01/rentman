const express = require('express');
const bodyParser = require('body-parser');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Admin Client for Backend Operations
const supabase = createClient(
    process.env.SUPABASE_URL || 'https://uoekolfgbbmvhzsfkjef.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY // MUST be set in Cloud Run Env Vars
);

app.use(bodyParser.json());

// Health Check
app.get('/', (req, res) => {
    res.status(200).send('Rentman Backend is Active 🧠');
});

// Database Webhook Endpoint
app.post('/webhooks/tasks', async (req, res) => {
    const apiKey = req.query.secret;

    // 1. Security Check (Webhook Secret)
    if (apiKey !== WEBHOOK_SECRET) {
        console.error('⛔ Operations blocked: Invalid Webhook Secret');
        return res.status(401).send('Unauthorized');
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

    // Construct Prompt
    const prompt = `
    You are the "Rentman Brain". Analyze this task for safety, clarity, and viability.
    
    Task Title: ${record.title}
    Description: ${record.description}
    Budget: $${record.budget_amount}
    Type: ${record.task_type}
    
    Output strictly in JSON format:
    {
        "viable": boolean,
        "safety_score": number (0-100),
        "complexity": "low" | "medium" | "high",
        "reasoning": "short explanation",
        "tags": ["tag1", "tag2"]
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.candidates[0].content.parts[0].text;

        // Extract JSON from markdown code block if present
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const aiAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Failed to parse AI response" };

        console.log('🧠 AI Analysis Result:', aiAnalysis);

        if (aiAnalysis.viable && aiAnalysis.safety_score > 70) {
            await updateTaskStatus(record.id, 'matching', { ai_analysis: aiAnalysis });
            console.log('✅ Task Approved for Matching');
        } else {
            await updateTaskStatus(record.id, 'flagged', { ai_analysis: aiAnalysis });
            console.log('⚠️ Task Flagged for Review');
        }

    } catch (err) {
        console.error('💥 AI Analysis Failed:', err);
        // Fallback: Approve if AI fails (for MVP) or flag
        await updateTaskStatus(record.id, 'manual_review', { ai_error: err.message });
    }
}

async function updateTaskStatus(taskId, status, metadataUpdate = {}) {
    await supabase.from('tasks').update({
        status: status,
        metadata: metadataUpdate // Merges top-level keys in JSONB
    }).eq('id', taskId);
}

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.error(`DEBUG: PROJECT_ID = ${process.env.PROJECT_ID}`);
});
