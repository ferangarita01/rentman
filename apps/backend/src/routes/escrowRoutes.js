const express = require('express');
const { lockFunds, releaseFunds, initiateDispute, getEscrowStatus } = require('../controllers/escrowController');

const router = express.Router();

router.post('/api/escrow/lock', lockFunds);
router.post('/api/escrow/release', releaseFunds);
router.post('/api/escrow/dispute', initiateDispute);
router.get('/api/escrow/status/:taskId', getEscrowStatus);

module.exports = router;
