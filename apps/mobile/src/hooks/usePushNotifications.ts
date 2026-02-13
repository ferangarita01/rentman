import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { registerPushToken } from '@/lib/supabase-client';
import toast from 'react-hot-toast';

export function usePushNotifications() {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        // Only run on native platforms
        if (Capacitor.getPlatform() === 'web') {
            console.log('Push notifications skipped on web');
            return;
        }

        const initPush = async () => {
            try {
                // 1. Request Permission
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive !== 'granted') {
                    console.log('Push notification permission denied');
                    return;
                }

                // 2. Register listeners
                await PushNotifications.addListener('registration', async (token) => {
                    console.log('Push registration success, token: ' + token.value);
                    // Send to backend/supabase
                    await registerPushToken(user.id, token.value, 'android');
                });

                await PushNotifications.addListener('registrationError', (error) => {
                    console.error('Push registration error: ', error);
                });

                await PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    console.log('Push received: ', notification);
                    toast(notification.title || 'Nueva Notificación', {
                        icon: '🔔',
                        duration: 4000
                    });
                });

                await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                    console.log('Push action performed: ', notification);
                    // Navigate to specific screen if needed
                    // const data = notification.notification.data;
                    // if (data.taskId) router.push(`/task/${data.taskId}`);
                });

                // 3. Register with FCM
                await PushNotifications.register();

            } catch (e) {
                console.error('Error initializing push notifications:', e);
            }
        };

        initPush();

        // Cleanup
        return () => {
            if (Capacitor.getPlatform() !== 'web') {
                PushNotifications.removeAllListeners();
            }
        };

    }, [user]);
}
