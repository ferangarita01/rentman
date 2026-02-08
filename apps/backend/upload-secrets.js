/**
 * Upload Secrets to Google Cloud Secret Manager
 * This script reads from .env and creates/updates secrets in GCP
 */

require('dotenv').config({ path: '.env.temp' });
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const client = new SecretManagerServiceClient();
const PROJECT_ID = 'agent-gen-1';

const SECRETS_TO_UPLOAD = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'WEBHOOK_SECRET'
];

async function createOrUpdateSecret(secretName, secretValue) {
  const parent = `projects/${PROJECT_ID}`;
  const secretPath = `${parent}/secrets/${secretName}`;

  try {
    // Check if secret exists
    await client.getSecret({ name: secretPath });
    console.log(`📝 Updating existing secret: ${secretName}`);
    
    // Add new version
    await client.addSecretVersion({
      parent: secretPath,
      payload: {
        data: Buffer.from(secretValue, 'utf8'),
      },
    });
    
    console.log(`✅ ${secretName} updated successfully`);
  } catch (error) {
    if (error.code === 5) { // NOT_FOUND
      console.log(`🆕 Creating new secret: ${secretName}`);
      
      // Create the secret
      await client.createSecret({
        parent,
        secretId: secretName,
        secret: {
          replication: {
            automatic: {},
          },
        },
      });
      
      // Add the initial version
      await client.addSecretVersion({
        parent: secretPath,
        payload: {
          data: Buffer.from(secretValue, 'utf8'),
        },
      });
      
      console.log(`✅ ${secretName} created successfully`);
    } else {
      throw error;
    }
  }
}

async function uploadAllSecrets() {
  console.log('🔐 Uploading secrets to Google Secret Manager...\n');
  console.log(`Project: ${PROJECT_ID}\n`);

  for (const secretName of SECRETS_TO_UPLOAD) {
    const value = process.env[secretName];
    
    if (!value) {
      console.warn(`⚠️  ${secretName} not found in .env, skipping...`);
      continue;
    }
    
    try {
      await createOrUpdateSecret(secretName, value);
    } catch (error) {
      console.error(`❌ Failed to upload ${secretName}:`, error.message);
    }
  }

  console.log('\n✅ Secret upload complete!');
  console.log('\n🔒 Next steps:');
  console.log('   1. Run: node test-secrets.js');
  console.log('   2. Delete .env file (secrets are now in Secret Manager)');
  console.log('   3. Update deploy.ps1 to not require .env');
}

uploadAllSecrets().catch(console.error);
