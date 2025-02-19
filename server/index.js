require('dotenv').config();
const express = require('express');
const cors = require('cors');
const agentRoutes = require('./routes/agentRoutes');
const tweetRoutes = require('./routes/tweetRoutes');
const agentChatRoutes = require('./routes/agentChatRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', agentRoutes);
app.use('/api', tweetRoutes);
app.use('/api', agentChatRoutes);
// Start the server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});