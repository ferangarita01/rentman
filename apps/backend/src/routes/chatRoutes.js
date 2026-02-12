const express = require('express');
const { chat, suggestions } = require('../controllers/chatController');

const router = express.Router();

router.post('/api/chat', chat);
router.post('/api/suggestions', suggestions);

module.exports = router;
