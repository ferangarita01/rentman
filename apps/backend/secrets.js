/**
 * Google Cloud Secret Manager Integration
 * Production-ready secret loading with fallback to environment variables
 */

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const client = new SecretManagerServiceClient();
const PROJECT_ID = 'agent-gen-1';

// Cache for loaded secrets (avoid repeated API calls)
const secretCache = new Map();

/**
 * Loads a secret from Google Secret Manager
 * Falls back to process.env if Secret Manager is unavailable (local dev)
 * 
 * @param {string} secretName - Name of the secret (e.g., 'SUPABASE_URL')
 * @returns {Promise<string>} The secret value
 */
async function getSecret(secretName) {
  // Return cached value if available
  if (secretCache.has(secretName)) {
    return secretCache.get(secretName);
  }

  try {
    // Try loading from Secret Manager first
    const name = `projects/${PROJECT_ID}/secrets/${secretName}/versions/latest`;
    const [version] = await client.accessSecretVersion({ name });
    const secret = version.payload.data.toString('utf8');
    
    // Cache the secret
    secretCache.set(secretName, secret);
    console.log(`✅ Loaded ${secretName} from Secret Manager`);
    
    return secret;
  } catch (error) {
    // Fallback to environment variable (for local development)
    const envValue = process.env[secretName];
    
    if (!envValue) {
      throw new Error(
        `Secret ${secretName} not found in Secret Manager or environment variables. ` +
        `Please run 'node upload-secrets.ps1' or set ${secretName} in .env`
      );
    }
    
    console.warn(`⚠️  ${secretName} loaded from .env (fallback mode)`);
    secretCache.set(secretName, envValue);
    return envValue;
  }
}

/**
 * Preload all required secrets at startup
 * This ensures faster runtime and early error detection
 */
async function initializeSecrets() {
  const requiredSecrets = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'WEBHOOK_SECRET'
  ];

  console.log('🔐 Initializing secrets...');
  
  for (const secretName of requiredSecrets) {
    try {
      await getSecret(secretName);
    } catch (error) {
      console.error(`❌ Failed to load ${secretName}:`, error.message);
      throw error;
    }
  }
  
  console.log('✅ All secrets initialized successfully\n');
}

module.exports = {
  getSecret,
  initializeSecrets
};
