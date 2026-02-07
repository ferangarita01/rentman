'use client';

import { useState } from 'react';
import { FlameIcon, TrophyIcon, XIcon, CalendarDaysIcon, CheckCircleIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface StatCardProps {
    type: 'streak' | 'completed';
    value: number;
    loading: boolean;
}

interface StreakDetail {
    longestStreak: number;
    currentStreak: number;
    streakHistory: { date: string; count: number }[];
}

interface CompletionDetail {
    totalHabits: number;
    habitBreakdown: { name: string; emoji: string | null; count: number }[];
}

export default function InteractiveStatCard({ type, value, loading }: StatCardProps) {
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [streakDetail, setStreakDetail] = useState<StreakDetail | null>(null);
    const [completionDetail, setCompletionDetail] = useState<CompletionDetail | null>(null);

    const handleClick = async () => {
        if (!user) return;
        setShowModal(true);
        setModalLoading(true);

        try {
            if (type === 'streak') {
                const { data: logs } = await supabase
                    .from('habit_logs')
                    .select('completed_at')
                    .eq('user_id', user.id)
                    .order('completed_at', { ascending: false });

                if (logs) {
                    // Calculate dates
                    const countByDate = new Map<string, number>();
                    logs.forEach(log => {
                        const date = new Date(log.completed_at).toISOString().split('T')[0];
                        countByDate.set(date, (countByDate.get(date) || 0) + 1);
                    });

                    // Last 30 days
                    const last30: { date: string; count: number }[] = [];
                    for (let i = 0; i < 30; i++) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        const dateStr = d.toISOString().split('T')[0];
                        last30.push({ date: dateStr, count: countByDate.get(dateStr) || 0 });
                    }

                    setStreakDetail({
                        currentStreak: value,
                        longestStreak: value, // TODO: Calculate actual longest
                        streakHistory: last30.reverse()
                    });
                }
            } else {
                const { data: logs } = await supabase
                    .from('habit_logs')
                    .select('habit:habits(id, name, emoji)')
                    .eq('user_id', user.id);

                if (logs) {
                    const countByHabit = new Map<string, { name: string; emoji: string | null; count: number }>();
                    logs.forEach(log => {
                        const habit = log.habit as any;
                        if (habit) {
                            const existing = countByHabit.get(habit.id) || { name: habit.name, emoji: habit.emoji, count: 0 };
                            existing.count++;
                            countByHabit.set(habit.id, existing);
                        }
                    });

                    setCompletionDetail({
                        totalHabits: countByHabit.size,
                        habitBreakdown: Array.from(countByHabit.values()).sort((a, b) => b.count - a.count)
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching stat details:', err);
        } finally {
            setModalLoading(false);
        }
    };

    const isStreak = type === 'streak';

    return (
        <>
            <div
                onClick={handleClick}
                className={`relative group cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 ${isStreak ? '' : ''}`}
            >
                {isStreak && (
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-orange-500 to-red-600 rounded-[2.2rem] opacity-0 dark:opacity-70 blur-md group-hover:opacity-100 transition duration-500"></div>
                )}
                <div className={`relative h-full rounded-[2rem] p-6 flex flex-col justify-between overflow-hidden ${isStreak
                    ? 'bg-orange-50 dark:bg-card-bg'
                    : 'bg-card-bg'
                    }`}>
                    {isStreak && <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl -mr-6 -mt-6"></div>}

                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${isStreak ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-500' : 'bg-yellow-500/20 text-yellow-500'
                        }`}>
                        {isStreak ? <FlameIcon className="w-6 h-6 fill-current" /> : <TrophyIcon className="w-6 h-6" />}
                    </div>

                    <div>
                        <div className={`text-4xl font-bold ${isStreak ? 'text-orange-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-br dark:from-orange-400 dark:to-red-500' : ''}`}>
                            {loading ? <span className="animate-pulse">...</span> : value}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-wider opacity-50 mt-1">
                            {isStreak ? 'Current Streak' : 'Total Completed'}
                        </div>
                    </div>

                    {/* Tap hint */}
                    <div className="absolute bottom-2 right-3 text-xs opacity-0 group-hover:opacity-50 transition-opacity">
                        Tap for details
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowModal(false)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-[2rem] p-6 m-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-in zoom-in-95"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                {isStreak ? (
                                    <><FlameIcon className="w-6 h-6 text-orange-500" /> Streak Details</>
                                ) : (
                                    <><TrophyIcon className="w-6 h-6 text-yellow-500" /> Completion Details</>
                                )}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {modalLoading ? (
                            <div className="h-40 flex items-center justify-center">
                                <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
                            </div>
                        ) : isStreak && streakDetail ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-orange-500/10 rounded-2xl p-4 text-center">
                                        <div className="text-3xl font-bold text-orange-500">{streakDetail.currentStreak}</div>
                                        <div className="text-xs opacity-60">Current Streak</div>
                                    </div>
                                    <div className="bg-purple-500/10 rounded-2xl p-4 text-center">
                                        <div className="text-3xl font-bold text-purple-500">{streakDetail.longestStreak}</div>
                                        <div className="text-xs opacity-60">Longest Streak</div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                        <CalendarDaysIcon className="w-4 h-4" /> Last 30 Days
                                    </h4>
                                    <div className="flex gap-1 flex-wrap">
                                        {streakDetail.streakHistory.map((day, i) => (
                                            <div
                                                key={i}
                                                className={`w-5 h-5 rounded ${day.count > 0 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                                                title={`${day.date}: ${day.count} habits`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : !isStreak && completionDetail ? (
                            <div className="space-y-4">
                                <div className="bg-yellow-500/10 rounded-2xl p-4 text-center">
                                    <div className="text-3xl font-bold text-yellow-500">{value}</div>
                                    <div className="text-xs opacity-60">Total Completions across {completionDetail.totalHabits} habits</div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-sm mb-3">Breakdown by Habit</h4>
                                    <div className="space-y-2">
                                        {completionDetail.habitBreakdown.slice(0, 5).map((habit, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-xl">
                                                    {habit.emoji || '✅'}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">{habit.name}</div>
                                                </div>
                                                <div className="font-bold text-green-500">{habit.count}x</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </>
    );
}
