const express = require('express');
const { lockFunds, releaseFunds, initiateDispute, getEscrowStatus } = require('../controllers/escrowController');

const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');

router.post('/api/escrow/lock', authMiddleware, lockFunds);
router.post('/api/escrow/release', authMiddleware, releaseFunds);
router.post('/api/escrow/dispute', authMiddleware, initiateDispute);
router.get('/api/escrow/status/:taskId', authMiddleware, getEscrowStatus);

module.exports = router;
