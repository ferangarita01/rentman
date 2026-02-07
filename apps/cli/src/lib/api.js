const fetch = require('node-fetch');
const { getApiKey } = require('./config');

// Cloud Run API (Production)
const API_BASE = 'https://rentman-api-346436028870.us-central1.run.app/v1/market';

async function apiRequest(endpoint, options = {}) {
  const apiKey = getApiKey();

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey || '',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'API request failed');
  }

  return data;
}

module.exports = { apiRequest };
