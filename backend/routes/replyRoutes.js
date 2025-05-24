// routes/replyRoutes.js

const express = require('express');
const router = express.Router();
const { suggestReply } = require('../controllers/replyController');

/**
 * @route   POST /api/reply/suggest
 * @desc    Generate a smart reply using OpenAI and context from agenda
 * @access  Public
 */
router.post('/suggest', suggestReply);

module.exports = router;
