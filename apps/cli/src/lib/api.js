/**
 * API Client for Agent Gateway
 * All requests go through the gateway for proper authentication and audit
 */

const fetch = require('node-fetch');
const { getApiConfig, getApiKey, getIdentity } = require('./secure-config');
const { generateNaclSignature } = require('./crypto');

/**
 * Make authenticated request to Agent Gateway
 * Supports both API Key and NACL signature authentication
 */
async function apiRequest(endpoint, options = {}) {
  const config = getApiConfig();
  const apiKey = getApiKey();
  const identity = getIdentity();

  // Build full URL
  const url = `${config.gatewayUrl}/market${endpoint}`;

  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Authentication: Prefer NACL signature, fallback to API key
  if (identity && identity.secret_key) {
    // NACL Signature Authentication (most secure)
    const method = options.method || 'GET';
    const payload = options.body || {};
    
    const signature = generateNaclSignature(
      payload,
      identity.secret_key,
      method,
      `/market${endpoint}`
    );

    headers['x-agent-id'] = identity.agent_id;
    headers['x-signature'] = `nacl:${signature}`;
  } else if (apiKey) {
    // API Key Authentication (fallback)
    headers['x-api-key'] = apiKey;
  } else {
    throw new Error('No authentication credentials found. Run: rentman init');
  }

  // Make request
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error?.message || 'API request failed');
      error.statusCode = response.status;
      error.code = data.error?.code;
      error.details = data.error?.details;
      throw error;
    }

    return data;
  } catch (error) {
    // Network or parsing errors
    if (!error.statusCode) {
      throw new Error(`Network error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Convenience methods
 */
async function getTasks(filters = {}) {
  const params = new URLSearchParams(filters);
  return apiRequest(`/tasks?${params}`);
}

async function getTask(taskId) {
  return apiRequest(`/tasks/${taskId}`);
}

async function createTask(taskData) {
  return apiRequest('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

async function searchHumans(filters = {}) {
  const params = new URLSearchParams(filters);
  return apiRequest(`/humans?${params}`);
}

async function hireHuman(taskId, humanId, offeredAmount, terms) {
  return apiRequest('/hire', {
    method: 'POST',
    body: JSON.stringify({
      task_id: taskId,
      human_id: humanId,
      offered_amount: offeredAmount,
      terms,
    }),
  });
}

module.exports = {
  apiRequest,
  getTasks,
  getTask,
  createTask,
  searchHumans,
  hireHuman,
};
