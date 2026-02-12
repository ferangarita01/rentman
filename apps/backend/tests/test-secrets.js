/**
 * Test Script for Google Secret Manager Integration
 * Run this to verify secrets are properly loaded
 */

const { getSecret } = require('./secrets');

async function testSecrets() {
  console.log('🔐 Testing Google Secret Manager Integration...\n');

  const secretsToTest = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'WEBHOOK_SECRET'
  ];

  for (const secretName of secretsToTest) {
    try {
      const value = await getSecret(secretName);
      if (value && value.length > 0) {
        console.log(`✅ ${secretName}: ${value.substring(0, 20)}...`);
      } else {
        console.log(`❌ ${secretName}: Empty or not found`);
      }
    } catch (error) {
      console.log(`❌ ${secretName}: ${error.message}`);
    }
  }

  console.log('\n✅ Secret Manager test complete!');
}

testSecrets().catch(console.error);
