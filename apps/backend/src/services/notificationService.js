const admin = require('firebase-admin');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const secrets = require('../config/secrets');

// Initialize Firebase Admin
try {
    const serviceAccountPath = path.join(__dirname, '../config/service-account.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath)
    });
    console.log('✅ Firebase Admin initialized');
} catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error);
}

// Initialize Supabase Admin for fetching tokens
const supabase = createClient(secrets.SUPABASE_URL, secrets.SUPABASE_SERVICE_KEY);

/**
 * Send a push notification to a user
 * @param {string} userId - The user ID to send the notification to
 * @param {string} title - The notification title
 * @param {string} body - The notification body
 * @param {object} data - Optional data payload
 */
async function sendNotification(userId, title, body, data = {}) {
    try {
        // 1. Get user tokens
        const { data: tokens, error } = await supabase
            .from('user_push_tokens')
            .select('token')
            .eq('user_id', userId);

        if (error) throw error;
        if (!tokens || tokens.length === 0) {
            console.log(`⚠️ No push tokens found for user ${userId}`);
            return { success: false, reason: 'no_tokens' };
        }

        // 2. Prepare payload
        const message = {
            notification: {
                title,
                body
            },
            data: {
                ...data,
                click_action: 'FCM_PLUGIN_ACTIVITY', // Required for Capacitor interaction
            },
            tokens: tokens.map(t => t.token)
        };

        // 3. Send via FCM
        const response = await admin.messaging().sendEachForMulticast(message);

        // 4. Log results and clean up invalid tokens
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx].token);
                }
            });
            console.log(`⚠️ Failed to send to ${response.failureCount} tokens`);

            // Optional: Delete invalid tokens
            if (failedTokens.length > 0) {
                await supabase.from('user_push_tokens').delete().in('token', failedTokens);
            }
        }

        console.log(`🚀 Notification sent to user ${userId}: ${response.successCount} successful`);
        return { success: true, sentCount: response.successCount };

    } catch (error) {
        console.error('Error sending notification:', error);
        return { success: false, error };
    }
}

module.exports = { sendNotification };
