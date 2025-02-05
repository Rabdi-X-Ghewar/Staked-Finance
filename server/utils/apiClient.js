const axios = require('axios');
const cors = require('cors'); // Import the cors middleware

const API_BASE_URL = 'https://api.cookie.fun';

const apiClient = async (endpoint, params = {}, searchQuery = null) => {
  try {
    // Replace :searchQuery placeholder if present
    const url = searchQuery
      ? `${API_BASE_URL}${endpoint.replace(':searchQuery', encodeURIComponent(searchQuery))}`
      : `${API_BASE_URL}${endpoint}`;

    const response = await axios.get(url, {
      headers: { 'x-api-key': process.env.COOKIE_DAO_API_KEY },
      params,
    });

    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = apiClient;