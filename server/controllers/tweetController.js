const apiClient = require('../utils/apiclient');

// Search tweets
exports.searchTweets = async (req, res) => {
  const { query, from, to } = req.query;

  if (!query || !from || !to) {
    return res.status(400).json({ error: 'Missing required parameters: query, from, to' });
  }

  try {
    const data = await apiClient('/v1/hackathon/search/:searchQuery', { from, to }, query);
    res.json(data);
  } catch (error) {
    console.error('Error searching tweets:', error.message);
    res.status(500).json({ error: 'Failed to search tweets' });
  }
};