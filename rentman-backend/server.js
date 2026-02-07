const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

app.use(bodyParser.json());

// Health Check (for Cloud Run)
app.get('/', (req, res) => {
    res.status(200).send('Rentman Backend is Active 🧠');
});

// Database Webhook Endpoint
app.post('/webhooks/tasks', (req, res) => {
    const signature = req.headers['x-supabase-signature']; // If using authorized webhooks
    const apiKey = req.query.secret; // Simple secret query param for MVP

    // Security Check
    if (apiKey !== WEBHOOK_SECRET) {
        console.error('⛔ Operations blocked: Invalid Webhook Secret');
        return res.status(401).send('Unauthorized');
    }

    const { type, table, record, old_record } = req.body;

    console.log(`📨 Webhook Received: ${type} on ${table}`);

    if (table === 'tasks' && type === 'INSERT') {
        console.log(`✨ New Task Created: ${record.id} by Agent ${record.agent_id}`);
        // TODO: Phase 2 - Trigger Vertex AI Analysis
        // console.log('🤖 Triggering AI Analysis...');
    }

    res.status(200).send('Processed');
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
