const express = require('express');
const { healthCheck, rootCheck, debugDbCheck } = require('../controllers/monitorController');

const router = express.Router();

router.get('/', rootCheck);
router.get('/health', healthCheck);
router.get('/api/debug/db-check', debugDbCheck);

module.exports = router;
