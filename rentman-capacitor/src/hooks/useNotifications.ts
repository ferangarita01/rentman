import { useState, useEffect } from 'react';
import { NotificationService } from '@/lib/notifications';

export function useNotifications() {
    const [permissionGranted, setPermissionGranted] = useState(false);

    useEffect(() => {
        checkPermission();
    }, []);

    async function checkPermission() {
        const granted = await NotificationService.checkPermissions();
        setPermissionGranted(granted);
    }

    async function requestPermission() {
        const granted = await NotificationService.requestPermissions();
        setPermissionGranted(granted);
        return granted;
    }

    async function schedule(title: string, body: string, id: number, schedule?: Date, recurrence?: 'day' | 'week') {
        return await NotificationService.scheduleNotification(title, body, id, schedule, recurrence);
    }

    return {
        permissionGranted,
        requestPermission,
        schedule
    };
}
