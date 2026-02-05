const fetch = require('node-fetch');
const { getApiKey } = require('./config');

const API_BASE = 'https://uoekolfgbbmvhzsfkjef.supabase.co/functions/v1';

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
