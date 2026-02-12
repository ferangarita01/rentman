require('dotenv').config();
const app = require('./src/app');
const { initializeSecrets } = require('./src/config/secrets');
const { initializeSupabase } = require('./src/config/supabase');
const { initializeStripe } = require('./src/config/stripe');
const { initializeVertex } = require('./src/config/vertex');

const PORT = process.env.PORT || 8080;

async function startServer() {
    try {
        console.log('🔄 Initializing Rentman Backend...');

        // 1. Load Secrets
        await initializeSecrets();

        // 2. Initialize Services
        await Promise.all([
            initializeSupabase(),
            initializeStripe(),
            initializeVertex()
        ]);

        // 3. Start Server
        app.listen(PORT, () => {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🚀 Rentman Backend Server');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`📡 Listening on port ${PORT}`);
            console.log(`🔐 Secrets: Google Cloud Secret Manager`);
            console.log(`🌐 Project: ${process.env.GCP_PROJECT_ID || 'agent-gen-1'}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
