
'use client';

import { useEffect, useState } from 'react';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function PushNotificationManager() {
    const { user } = useAuth();
    const [fcmToken, setFcmToken] = useState<string | null>(null);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        console.log('📲 Initializing Push Notifications...');

        const setupListeners = async () => {
            await PushNotifications.removeAllListeners();

            await PushNotifications.addListener('registration', (token: Token) => {
                console.log('✅ Push Registration success, token:', token.value);
                setFcmToken(token.value);
            });

            await PushNotifications.addListener('registrationError', (error: unknown) => {
                console.error('❌ Push Registration Error:', error);
            });

            await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
                console.log('🔔 Push Received:', notification);
                // You can add local notification logic here if needed
            });

            await PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
                console.log('👉 Push Action Performed:', notification);
                // Handle deep linking or navigation here based on notification.data
            });

            // Request permission
            const perm = await PushNotifications.requestPermissions();
            if (perm.receive === 'granted') {
                await PushNotifications.register();
            } else {
                console.log('⚠️ Push permission denied');
            }
        };

        setupListeners();

        // Cleanup not strictly necessary for global listeners in SPA but good practice if checking listeners methods
        // Capacitor listeners return a promise that resolves to a defined plugin listener handle
        return () => {
            PushNotifications.removeAllListeners();
        };
    }, []);

    // Sync token to Supabase when User + Token are available
    useEffect(() => {
        const syncToken = async () => {
            if (user && fcmToken) {
                console.log('🔄 Syncing push token to Supabase for user:', user.email);

                const { error } = await supabase.from('user_push_tokens').upsert({
                    user_id: user.id,
                    token: fcmToken,
                    device_type: Capacitor.getPlatform(), // 'ios' or 'android'
                    last_updated: new Date().toISOString()
                }, { onConflict: 'token' });

                if (error) {
                    console.error('❌ Error saving push token to DB:', error);
                } else {
                    console.log('✅ Push token saved to DB');
                }
            }
        };

        syncToken();
    }, [user, fcmToken]);

    return null;
}
