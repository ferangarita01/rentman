const express = require('express');
const cors = require('cors');

const monitorRoutes = require('./routes/monitorRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const chatRoutes = require('./routes/chatRoutes');
const taskRoutes = require('./routes/taskRoutes');
const escrowRoutes = require('./routes/escrowRoutes');
const cronRoutes = require('./routes/cronRoutes');

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

module.exports = app;
