import { LocalNotifications } from '@capacitor/local-notifications';

export const NotificationService = {
    async requestPermissions() {
        try {
            const result = await LocalNotifications.requestPermissions();
            return result.display === 'granted';
        } catch (error) {
            console.error('Error requesting notification permissions:', error);
            return false;
        }
    },

    async checkPermissions() {
        try {
            const result = await LocalNotifications.checkPermissions();
            return result.display === 'granted';
        } catch (error) {
            console.error('Error checking notification permissions:', error);
            return false;
        }
    },

    async createChannel() {
        try {
            // Register Action Types (Interactive Buttons)
            await LocalNotifications.registerActionTypes({
                types: [
                    {
                        id: 'HABIT_ACTIONS',
                        actions: [
                            {
                                id: 'COMPLETE',
                                title: '✅ Completar',
                                foreground: false // Run in background if possible
                            },
                            {
                                id: 'SNOOZE',
                                title: '💤 15 min',
                                foreground: false
                            }
                        ]
                    }
                ]
            });

            await LocalNotifications.createChannel({
                id: 'sarah_alerts',
                name: 'Sarah Alerts',
                description: 'Notifications from your Habit Coach',
                importance: 5, // 5 = High (Heads up, Sound, Vibration)
                visibility: 1, // Public
                vibration: true,
                sound: undefined // Default system sound
            });
            return true;
        } catch (error) {
            console.error('Error creating notification channel:', error);
            return false;
        }
    },

    async scheduleNotification(title: string, body: string, id: number, schedule?: Date, recurrence?: 'day' | 'week') {
        try {
            const hasPermission = await this.checkPermissions();
            if (!hasPermission) {
                const granted = await this.requestPermissions();
                if (!granted) return false;
            }

            // Ensure channel exists (Android)
            await this.createChannel();

            // Construct schedule object based on recurrence
            let scheduleObj: any = { at: schedule ? schedule : new Date(Date.now() + 5000) };

            if (recurrence === 'day') {
                scheduleObj = { ...scheduleObj, every: 'day', allowWhileIdle: true };
            } else if (recurrence === 'week') {
                scheduleObj = { ...scheduleObj, every: 'week', allowWhileIdle: true };
            }

            await LocalNotifications.schedule({
                notifications: [
                    {
                        title,
                        body,
                        id,
                        schedule: scheduleObj,
                        sound: undefined,
                        attachments: undefined,
                        actionTypeId: 'HABIT_ACTIONS', // ✅ Enable buttons
                        extra: null,
                        channelId: 'sarah_alerts' // Assign to High Priority Channel
                    }
                ]
            });
            return true;
        } catch (error) {
            console.error('Error scheduling notification:', error);
            return false;
        }
    },

    async cancelNotification(id: number) {
        try {
            await LocalNotifications.cancel({ notifications: [{ id }] });
            return true;
        } catch (error) {
            console.error('Error cancelling notification:', error);
            return false;
        }
    }
};
