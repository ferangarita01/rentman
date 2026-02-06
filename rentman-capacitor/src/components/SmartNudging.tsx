'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '@/hooks/useNotifications';
import toast from 'react-hot-toast';

interface NudgingData {
  message: string;
  type: 'habit_reminder' | 'wellness_insight' | 'streak_protection';
  habitId?: string;
  habitName?: string;
  triggerTime?: string;
}

export default function SmartNudging() {
  const { user } = useAuth();
  const { schedule, requestPermission } = useNotifications();
  const [nudging, setNudging] = useState<NudgingData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    analyzeAndNudge();
  }, [user?.id]);

  async function analyzeAndNudge() {
    try {
      const now = new Date();
      const hour = now.getHours();
      const today = new Date().toISOString().split('T')[0];

      // 1. Check for incomplete habits with trigger_time passed
      const { data: habits } = await supabase
        .from('habits')
        .select(`
          id, name, trigger_time, current_streak,
          habit_logs!left (id, completed_at)
        `)
        .eq('user_id', user!.id)
        .not('trigger_time', 'is', null);

      if (habits) {
        for (const habit of habits) {
          const triggerHour = parseInt(habit.trigger_time?.split(':')[0] || '0');
          const completedToday = habit.habit_logs?.some((log: any) =>
            log.completed_at?.startsWith(today)
          );

          // Nudge if trigger_time passed and not completed
          if (hour > triggerHour && !completedToday && hour < 21) {
            setNudging({
              message: `He notado que sueles completar "${habit.name}" antes de las ${triggerHour}:00. ¿Necesitas un recordatorio para mañana?`,
              type: 'habit_reminder',
              habitId: habit.id,
              habitName: habit.name,
              triggerTime: habit.trigger_time
            });
            return;
          }

          // Streak protection
          if (habit.current_streak >= 7 && !completedToday && hour >= 20) {
            setNudging({
              message: `¡Cuidado! Llevas ${habit.current_streak} días seguidos con "${habit.name}". No dejes que se rompa hoy.`,
              type: 'streak_protection',
              habitId: habit.id,
              habitName: habit.name
            });
            return;
          }
        }
      }

      // 2. Check wellness patterns
      const { data: wellness } = await supabase
        .from('daily_wellness')
        .select('sleep_hours, energy_level, mood_overall, date')
        .eq('user_id', user!.id)
        .gte('date', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(3);

      if (wellness && wellness.length >= 2) {
        const avgSleep = wellness.reduce((sum, w) => sum + (w.sleep_hours || 0), 0) / wellness.length;
        const avgEnergy = wellness.reduce((sum, w) => sum + (w.energy_level || 0), 0) / wellness.length;

        if (avgSleep < 6 && avgEnergy < 4) {
          setNudging({
            message: `Has dormido un promedio de ${avgSleep.toFixed(1)}h en los últimos ${wellness.length} días. Esto está afectando tu energía. ¿Quieres ajustar tus hábitos nocturnos?`,
            type: 'wellness_insight'
          });
          return;
        }
      }

      // No nudging needed
      setNudging(null);

    } catch (error) {
      console.error('Error analyzing nudging:', error);
    }
  }

  if (!nudging || dismissed) {
    return null;
  }

  async function handleAccept() {
    if (nudging?.type === 'habit_reminder' && nudging.habitId && nudging.triggerTime) {
      const granted = await requestPermission();
      if (granted) {
        const [hours, minutes] = nudging.triggerTime.split(':').map(Number);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(hours, minutes || 0, 0, 0);

        await schedule(
          `Recordatorio: ${nudging.habitName}`,
          `¡Es hora de tu hábito "${nudging.habitName}"!`,
          Math.floor(Math.random() * 100000), // Simple ID generation
          tomorrow
        );
        toast.success('¡Recordatorio programado para mañana!');
      } else {
        toast.error('Necesito permisos para notificarte.');
      }
    } else {
      toast.success('¡Entendido!');
    }
    setDismissed(true);
  }

  function handleDismiss() {
    setDismissed(true);
  }

  return (
    <div className="px-5 mt-10 pb-10">
      <div className="flex items-center gap-2 mb-5">
        <SparklesIcon className="text-white w-5 h-5" />
        <h2 className="text-lg font-semibold tracking-tight text-white">Smart Nudging</h2>
      </div>

      <div className="flex gap-4 items-end">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-b from-orange-200 to-pink-200 p-1 flex-shrink-0 mb-10 ring-2 ring-white/10">
          <div className="w-full h-full flex items-center justify-center text-xl">
            👩‍💼
          </div>
        </div>

        {/* Bubble */}
        <div className="bg-[#161618] border border-white/5 p-5 rounded-[2rem] rounded-bl-none max-w-[85%] relative">
          <p className="text-base font-medium text-gray-300 leading-relaxed mb-4">
            {nudging.message}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold text-white transition-colors border border-white/10"
            >
              Sí, por favor
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-transparent hover:bg-white/5 rounded-xl text-sm font-semibold text-gray-500 transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
