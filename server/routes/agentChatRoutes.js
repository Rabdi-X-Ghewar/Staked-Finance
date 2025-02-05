const express = require('express');
const agentChatController = require('../controllers/agentChatController');

const router = express.Router();

router.post('/chat', agentChatController.handleChat);
router.post('/chat/agent/:username', agentChatController.handleAgentChat);

module.exports = router;