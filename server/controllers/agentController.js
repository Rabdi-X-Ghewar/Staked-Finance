const apiClient = require('../utils/apiclient');

// Get agent by Twitter username
exports.getAgentByTwitterUsername = async (req, res) => {
  const { username } = req.params;
  const { interval = '_7Days' } = req.query;

  try {
    const data = await apiClient(`/v2/agents/twitterUsername/${username}`, { interval });
    res.json(data);
  } catch (error) {
    console.error('Error fetching agent:', error.message);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
};

// Get agent by contract address
exports.getAgentByContractAddress = async (req, res) => {
  const { address } = req.params;
  const { interval = '_7Days' } = req.query;

  try {
    const data = await apiClient(`/v2/agents/contractAddress/${address}`, { interval });
    res.json(data);
  } catch (error) {
    console.error('Error fetching agent:', error.message);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
};

// Get paginated agent list
exports.getAgentsPaged = async (req, res) => {
  const { interval = '_7Days', page = 1, pageSize = 10 } = req.query;

  try {
    const data = await apiClient('/v2/agents/agentsPaged', { interval, page, pageSize });
    res.json(data);
  } catch (error) {
    console.error('Error fetching agents:', error.message);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
};