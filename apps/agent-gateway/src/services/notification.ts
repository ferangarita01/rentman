
import { supabase } from './supabase.js';
import { messaging } from './firebase.js';
import logger from '../utils/logger.js';

export interface NotificationPayload {
    userId: string;
    type: 'hire_offer' | 'system' | 'payment' | 'agent_activity';
    title: string;
    message: string;
    data?: Record<string, string | number | boolean>;
}

export class NotificationService {
    /**
     * Send a notification to a user
     * 1. Save to Supabase DB (Persistence/History)
     * 2. Send Push Notification via FCM (Delivery)
     */
    static async send(payload: NotificationPayload): Promise<void> {
        const { userId, type, title, message, data } = payload;

        try {
            // 1. Persistence: Save to Supabase 'notifications' table
            const { error: dbError } = await supabase
                .from('notifications')
                .insert({
                    user_id: userId,
                    type,
                    title,
                    message,
                    data: data || {},
                    is_read: false
                });

            if (dbError) {
                logger.error({ error: dbError, userId }, '❌ Failed to save notification to DB');
                // We continue to try sending push even if DB fails, or should we stop?
                // Ideally both should work, but DB is primary for history.
                // Let's log and proceed to try push, as alert is important.
            } else {
                logger.info({ userId, type }, '✅ Notification saved to DB');
            }

            // 2. Delivery: Send Push Notification via FCM
            // First, get the user's push token(s)
            const { data: tokens, error: tokenError } = await supabase
                .from('user_push_tokens')
                .select('token')
                .eq('user_id', userId);

            if (tokenError) {
                logger.error({ error: tokenError, userId }, '❌ Failed to fetch user push tokens');
                return;
            }

            if (!tokens || tokens.length === 0) {
                logger.warn({ userId }, '⚠️ No push tokens found for user, skipping FCM');
                return;
            }

            // Send to all tokens (user might have multiple devices)
            const pushPromises = tokens.map(async (t) => {
                try {
                    await messaging.send({
                        token: t.token,
                        notification: {
                            title,
                            body: message,
                        },
                        data: {
                            type,
                            ...(data ? Object.fromEntries(
                                Object.entries(data).map(([k, v]) => [k, String(v)]) // FCM data must be strings
                            ) : {}),
                        },
                        android: {
                            priority: 'high',
                            notification: {
                                clickAction: 'FLUTTER_NOTIFICATION_CLICK', // or standard defined in app
                            }
                        },
                        apns: {
                            payload: {
                                aps: {
                                    sound: 'default',
                                }
                            }
                        }
                    });
                    return true;
                } catch (fcmError) {
                    logger.error({ error: fcmError, token: t.token }, '❌ Failed to send FCM message');
                    // If token is invalid (unregistered), ideally we should remove it from DB
                    // implementation enhancement for later.
                    return false;
                }
            });

            const results = await Promise.all(pushPromises);
            const successCount = results.filter(r => r).length;

            logger.info({ userId, successCount, total: tokens.length }, '🚀 Push notifications sent');

        } catch (error) {
            logger.error({ error, payload }, '❌ Critical error in NotificationService');
        }
    }
}
