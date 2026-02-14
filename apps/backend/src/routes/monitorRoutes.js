const express = require('express');
const { healthCheck, rootCheck, debugDbCheck } = require('../controllers/monitorController');

const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');

router.get('/', rootCheck);
router.get('/health', healthCheck);
router.get('/api/debug/db-check', authMiddleware, debugDbCheck);

module.exports = router;
