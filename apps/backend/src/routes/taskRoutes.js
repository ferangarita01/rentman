const express = require('express');
const { uploadProof, reviewProof } = require('../controllers/taskController');

const router = express.Router();

router.post('/api/proofs/upload', uploadProof);
router.post('/api/proofs/review', reviewProof);

module.exports = router;
