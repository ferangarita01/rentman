const express = require('express');
const cors = require('cors');

const monitorRoutes = require('./routes/monitorRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const chatRoutes = require('./routes/chatRoutes');
const taskRoutes = require('./routes/taskRoutes');
const escrowRoutes = require('./routes/escrowRoutes');
const cronRoutes = require('./routes/cronRoutes');
const { sendNotification } = require('./services/notificationService');

const app = express();

// Middleware
app.use(cors());

// Parse JSON and store raw body for Stripe signature verification
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

app.use(express.static('public')); // Keep static if needed

// Routes
app.use('/', monitorRoutes); // /, /health, /api/debug/db-check
app.use(paymentRoutes);
app.use(webhookRoutes);
app.use(chatRoutes);
app.use(taskRoutes);
app.use(escrowRoutes);
app.use(cronRoutes);

// Notification Test Route
app.post('/api/notifications/test', async (req, res) => {
    const { userId, title, body, data } = req.body;
    if (!userId || !title || !body) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const result = await sendNotification(userId, title, body, data);
    res.json(result);
});

module.exports = app;
