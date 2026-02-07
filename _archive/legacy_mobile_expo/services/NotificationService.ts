import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission denied');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'rentman-app-2026',
    });
    const token = tokenData.data;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('humans')
        .update({ push_token: token })
        .eq('id', user.id);
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00ff88',
      });

      await Notifications.setNotificationChannelAsync('missions', {
        name: 'Mission Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00ff88',
        sound: 'default',
      });
    }

    console.log('Push notification token:', token);
    return token;
  } catch (error) {
    console.error('Failed to register for push notifications:', error);
    return null;
  }
}

export function subscribeToNotifications(
  onNotification: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(onNotification);
}

export function subscribeToNotificationResponse(
  onResponse: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(onResponse);
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  triggerSeconds: number = 0
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      color: '#00ff88',
    },
    trigger: triggerSeconds > 0 ? { seconds: triggerSeconds } : null,
  });

  return id;
}

export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export const NotificationTemplates = {
  newMission: (title: string, budget: number) => ({
    title: '🎯 NEW MISSION AVAILABLE',
    body: `${title} - Earn $${budget.toFixed(2)}`,
  }),

  missionAccepted: (title: string) => ({
    title: '⚡ MISSION ACCEPTED',
    body: `You accepted: ${title}`,
  }),

  missionCompleted: (earnings: number) => ({
    title: '✅ MISSION COMPLETE',
    body: `+$${earnings.toFixed(2)} credited to your account`,
  }),

  missionReminder: (title: string) => ({
    title: '⏰ MISSION REMINDER',
    body: `Don't forget to complete: ${title}`,
  }),

  paymentReceived: (amount: number) => ({
    title: '💰 PAYMENT RECEIVED',
    body: `$${amount.toFixed(2)} has been added to your wallet`,
  }),
};
