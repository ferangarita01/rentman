
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

/**
 * List of secrets to fetch from Google Secret Manager
 * These match the keys in .env.example
 */
const REQUIRED_SECRETS = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'JWT_SECRET',
    'API_KEY_ENCRYPTION_SECRET',
    'API_KEY_SECRET',
    'SENTRY_DSN' // Optional but good to fetch if exists
];

/**
 * Load secrets from Google Secret Manager into process.env
 * Only fetches secrets that are NOT already defined in process.env
 */
export async function loadSecrets() {
    // Check if we should skip secret loading (e.g. in test environment or if explicitly disabled)
    if (process.env.SKIP_GCP_SECRETS === 'true' || process.env.NODE_ENV === 'test') {
        console.log('ℹ️ Skipping Google Secret Manager loading (SKIP_GCP_SECRETS or test env)');
        return;
    }

    const projectId = process.env.GCP_PROJECT_ID || 'agent-gen-1'; // Default to known project ID

    console.log(`🔐 Loading secrets from Google Secret Manager (${projectId})...`);

    try {
        const promises = REQUIRED_SECRETS.map(async (secretName) => {
            // If already set (e.g. by Docker env vars or .env file), skip
            if (process.env[secretName]) {
                return;
            }

            try {
                const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
                const [version] = await client.accessSecretVersion({ name });
                const payload = version.payload?.data?.toString();

                if (payload) {
                    process.env[secretName] = payload;
                    // console.log(`  ✅ Loaded ${secretName}`); // Uncomment for debug, keep sensitive data hidden
                } else {
                    console.warn(`  ⚠️ Empty payload for ${secretName}`);
                }
            } catch (error: unknown) {
                const err = error as { code?: number; message?: string };
                // Ignore "not found" errors for optional secrets, but warn for potentially critical ones
                if (err.code === 5) { // NOT_FOUND
                    // intended to pass through
                } else {
                    console.warn(`  ❌ Failed to load ${secretName}: ${err.message}`);
                }
            }
        });

        await Promise.all(promises);
        console.log('✅ Secrets loaded successfully');
    } catch (error) {
        console.error('❌ Fatal error loading secrets:', error);
        // We don't exit here, we let the config validation fail later if critical secrets are missing
    }
}
