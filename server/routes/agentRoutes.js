const express = require('express');
const agentController = require('../controllers/agentController');

const router = express.Router();

router.get('/agent/twitter/:username', agentController.getAgentByTwitterUsername);
router.get('/agent/contract/:address', agentController.getAgentByContractAddress);
router.get('/agents/paged', agentController.getAgentsPaged);

module.exports = router;