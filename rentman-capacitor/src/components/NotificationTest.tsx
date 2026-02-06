'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import toast from 'react-hot-toast';

export default function NotificationTest() {
    const { permissionGranted, requestPermission, schedule } = useNotifications();
    const [scheduledId, setScheduledId] = useState<number | null>(null);

    async function handleRequestPermission() {
        const granted = await requestPermission();
        if (granted) {
            toast.success('Permisos concedidos');
        } else {
            toast.error('Permisos denegados');
        }
    }

    async function handleSchedule() {
        if (!permissionGranted) {
            const granted = await requestPermission();
            if (!granted) return;
        }

        const id = Math.floor(Math.random() * 1000);
        const success = await schedule(
            'Prueba de Notificación',
            '¡Funciona! Esto es una prueba local.',
            id,
            new Date(Date.now() + 5000) // 5 seconds from now
        );

        if (success) {
            setScheduledId(id);
            toast.success('Notificación programada en 5 segundos');
        } else {
            toast.error('Error al programar');
        }
    }

    return (
        <div className="p-4 border rounded-lg bg-white/5 border-white/10 mt-8 mb-8">
            <h3 className="text-lg font-bold text-white mb-2">Test de Notificaciones</h3>
            <div className="flex gap-2">
                <button
                    onClick={handleRequestPermission}
                    className="px-4 py-2 bg-blue-500 rounded text-white text-sm"
                >
                    {permissionGranted ? 'Permiso OK' : 'Pedir Permisos'}
                </button>
                <button
                    onClick={handleSchedule}
                    className="px-4 py-2 bg-green-500 rounded text-white text-sm"
                >
                    Programar en 5s
                </button>
            </div>
            {scheduledId && (
                <p className="text-xs text-gray-400 mt-2">ID programado: {scheduledId}</p>
            )}
        </div>
    );
}
