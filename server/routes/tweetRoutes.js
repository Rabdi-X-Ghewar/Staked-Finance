const express = require('express');
const tweetController = require('../controllers/tweetController');

const router = express.Router();

router.get('/tweets/search', tweetController.searchTweets);

module.exports = router;