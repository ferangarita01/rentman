'use client';

import { useState } from 'react';
import { CalendarIcon, XIcon, CheckCircleIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { WeeklyActivity } from '@/hooks/useProgressStats';

interface DayDetail {
    date: string;
    habits: {
        id: string;
        name: string;
        emoji: string | null;
        completed_at: string;
    }[];
}

interface InteractiveWeeklyGraphProps {
    weeklyActivity: WeeklyActivity[];
    loading: boolean;
}

export default function InteractiveWeeklyGraph({ weeklyActivity, loading }: InteractiveWeeklyGraphProps) {
    const { user } = useAuth();
    const [selectedDay, setSelectedDay] = useState<DayDetail | null>(null);
    const [loadingDay, setLoadingDay] = useState(false);

    const handleDayClick = async (day: WeeklyActivity) => {
        if (!user || day.count === 0) return;

        setLoadingDay(true);
        try {
            // Fix: Use proper UTC bounds derived from Local Time
            // 1. Create Local Midnight Date object
            // "2026-01-13" + "T00:00:00" -> implicitly local in most browsers/environments used here
            const localStart = new Date(`${day.date}T00:00:00`);
            const localEnd = new Date(`${day.date}T23:59:59.999`);

            // 2. Convert to UTC ISO strings for Supabase comparison
            const startUtc = localStart.toISOString();
            const endUtc = localEnd.toISOString();



            const { data: logs, error } = await supabase
                .from('habit_logs')
                .select(`
                    id,
                    completed_at,
                    habit:habits(id, name, emoji)
                `)
                .eq('user_id', user.id)
                .gte('completed_at', startUtc)
                .lte('completed_at', endUtc)
                .order('completed_at', { ascending: true });

            if (error) throw error;

            const habits = (logs || []).map(log => ({
                id: log.id,
                name: (log.habit as any)?.name || 'Unknown Habit',
                emoji: (log.habit as any)?.emoji || null,
                completed_at: log.completed_at
            }));

            setSelectedDay({
                date: day.date,
                habits
            });
        } catch (err) {
            console.error('Error fetching day details:', err);
        } finally {
            setLoadingDay(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00');
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <div className="bg-card-bg rounded-[2rem] p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                    <CalendarIcon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-lg">Weekly Overview</h3>
                <span className="text-xs opacity-50 ml-auto">Tap to see details</span>
            </div>

            <div className="flex justify-between items-end gap-2 h-32">
                {loading ? (
                    <div className="w-full h-full flex items-center justify-center opacity-50">
                        <div className="animate-pulse">Loading...</div>
                    </div>
                ) : weeklyActivity.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-50">
                        <CalendarIcon className="w-8 h-8" />
                        <p className="text-xs text-center">No activity this week</p>
                    </div>
                ) : (
                    weeklyActivity.map((day, i) => (
                        <div
                            key={i}
                            className="flex flex-col items-center gap-2 flex-1 h-full justify-end group cursor-pointer" // Added h-full and justify-end
                            onClick={() => handleDayClick(day)}
                        >
                            {/* Count badge on hover */}
                            {day.count > 0 && (
                                <div className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 mb-1">
                                    {day.count}
                                </div>
                            )}

                            <div className="relative w-full flex-1 flex items-end justify-center">
                                {/* Count Label - Always visible per user request */}
                                <div className={`
                                    absolute -top-5 text-[10px] font-bold transition-opacity duration-300
                                    ${day.count > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}
                                    ${day.isToday ? 'text-pink-500' : 'text-foreground/60'}
                                `}>
                                    {day.count}
                                </div>
                                <div
                                    style={{ height: `${day.intensity}%` }}
                                    className={`
                                        w-full max-w-[14px] rounded-full transition-all duration-300
                                        ${day.isToday
                                            ? 'bg-gradient-to-t from-pink-500 to-orange-400 shadow-lg shadow-pink-500/30'
                                            : day.count > 0
                                                ? 'bg-gradient-to-t from-blue-500 to-blue-400 group-hover:from-blue-600 group-hover:to-blue-500 group-hover:scale-110'
                                                : 'bg-gray-200 dark:bg-gray-800'}
                                    `}
                                />
                            </div>
                            <span className={`text-[10px] font-bold ${day.isToday ? 'text-pink-500' : 'opacity-40'}`}>
                                {day.day}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* Day Detail Modal */}
            {selectedDay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedDay(null)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-[2rem] p-6 m-6 max-w-md w-full max-h-[70vh] overflow-y-auto shadow-2xl animate-in zoom-in-95"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">{formatDate(selectedDay.date)}</h3>
                            <button
                                onClick={() => setSelectedDay(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm opacity-60 mb-4">
                            {selectedDay.habits.length} habit{selectedDay.habits.length !== 1 ? 's' : ''} completed
                        </p>

                        <div className="space-y-3">
                            {selectedDay.habits.map((habit, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-xl">
                                        {habit.emoji || '✅'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{habit.name}</div>
                                        <div className="text-xs opacity-50">{formatTime(habit.completed_at)}</div>
                                    </div>
                                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {loadingDay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            )}
        </div>
    );
}
