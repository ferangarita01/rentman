/**
 * Secure Configuration Module
 * Uses Conf for persistent storage in user's home directory
 * Priority: ENV > Conf > Default
 */

const Conf = require('conf');
const path = require('path');
const os = require('os');

// Initialize Conf with secure defaults
const config = new Conf({
  projectName: 'rentman',
  cwd: path.join(os.homedir(), '.config'),
  encryptionKey: process.env.RENTMAN_CONFIG_KEY, // Optional encryption
});

/**
 * Get agent identity from secure storage
 * Priority: Environment Variables > Conf Storage
 */
function getIdentity() {
  // Check environment variables first (most secure for CI/CD)
  if (process.env.RENTMAN_AGENT_ID && process.env.RENTMAN_SECRET_KEY) {
    return {
      agent_id: process.env.RENTMAN_AGENT_ID,
      public_agent_id: process.env.RENTMAN_PUBLIC_AGENT_ID,
      secret_key: process.env.RENTMAN_SECRET_KEY,
      public_key: process.env.RENTMAN_PUBLIC_KEY,
      source: 'environment'
    };
  }

  // Fallback to Conf storage
  const agent_id = config.get('agent_id');
  const secret_key = config.get('secret_key');

  if (!agent_id || !secret_key) {
    return null;
  }

  return {
    agent_id,
    public_agent_id: config.get('public_agent_id'),
    secret_key,
    public_key: config.get('public_key'),
    source: 'config'
  };
}

/**
 * Save agent identity to secure storage
 */
function saveIdentity(identity) {
  config.set('agent_id', identity.agent_id);
  config.set('public_agent_id', identity.public_agent_id);
  config.set('secret_key', identity.secret_key);
  config.set('public_key', identity.public_key);
  
  if (identity.owner_id) {
    config.set('owner_id', identity.owner_id);
  }
}

/**
 * Clear identity (logout)
 */
function clearIdentity() {
  config.delete('agent_id');
  config.delete('public_agent_id');
  config.delete('secret_key');
  config.delete('public_key');
  config.delete('owner_id');
}

/**
 * Get configuration path
 */
function getConfigPath() {
  return config.path;
}

/**
 * Get API configuration
 */
function getApiConfig() {
  return {
    gatewayUrl: process.env.AGENT_GATEWAY_URL || 'https://agent-gateway.rentman.app/v1',
    supabaseUrl: process.env.SUPABASE_URL || 'https://uoekolfgbbmvhzsfkjef.supabase.co',
    supabaseKey: process.env.SUPABASE_ANON_KEY,
    logLevel: process.env.LOG_LEVEL || 'info',
  };
}

/**
 * Get API key (if using API key auth instead of NACL)
 */
function getApiKey() {
  return process.env.RENTMAN_API_KEY || config.get('api_key');
}

/**
 * Save API key
 */
function saveApiKey(apiKey) {
  config.set('api_key', apiKey);
}

module.exports = {
  getIdentity,
  saveIdentity,
  clearIdentity,
  getConfigPath,
  getApiConfig,
  getApiKey,
  saveApiKey,
  config, // Expose for custom settings
};
