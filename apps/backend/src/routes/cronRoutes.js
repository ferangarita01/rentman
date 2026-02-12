const express = require('express');
const { autoApprove } = require('../controllers/cronController');

const router = express.Router();

router.post('/api/cron/auto-approve', autoApprove);

module.exports = router;
