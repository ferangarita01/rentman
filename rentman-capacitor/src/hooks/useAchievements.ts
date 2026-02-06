'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    unlockedAt: string | null;
    progress: number; // 0-100
    requirement: number;
    current: number;
    category: 'streak' | 'completion' | 'time' | 'wellness' | 'goal';
    color: string;
    bg: string;
}

// Achievement definitions with unlock logic
const ACHIEVEMENT_DEFINITIONS = [
    { id: 'beginner', name: 'Beginner', desc: 'Complete your first habit', icon: '🌟', category: 'completion', requirement: 1, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'consistent', name: 'Consistent', desc: 'Complete 10 habits', icon: '📈', category: 'completion', requirement: 10, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'dedicated', name: 'Dedicated', desc: 'Complete 50 habits', icon: '💪', category: 'completion', requirement: 50, color: 'text-green-500', bg: 'bg-green-500/10' },
    { id: 'master', name: 'Habit Master', desc: 'Complete 100 habits', icon: '🏆', category: 'completion', requirement: 100, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { id: 'weekly_warrior', name: 'Weekly Warrior', desc: '7 day streak', icon: '🔥', category: 'streak', requirement: 7, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'monthly_master', name: 'Monthly Master', desc: '30 day streak', icon: '🌙', category: 'streak', requirement: 30, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'centurion', name: 'Centurion', desc: '100 day streak', icon: '💯', category: 'streak', requirement: 100, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'early_bird', name: 'Early Bird', desc: 'Complete a habit before 7 AM', icon: '🌅', category: 'time', requirement: 1, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'night_owl', name: 'Night Owl', desc: 'Complete a habit after 10 PM', icon: '🦉', category: 'time', requirement: 1, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { id: 'goal_setter', name: 'Goal Setter', desc: 'Create your first goal', icon: '🎯', category: 'goal', requirement: 1, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { id: 'wellness_warrior', name: 'Wellness Warrior', desc: 'Log wellness for 7 days', icon: '💚', category: 'wellness', requirement: 7, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

export function useAchievements() {
    const { user } = useAuth();
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [newUnlock, setNewUnlock] = useState<Achievement | null>(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchAchievementData = async () => {
            try {
                // Fetch all data needed for achievements
                const [logsResult, goalsResult, wellnessResult] = await Promise.all([
                    supabase
                        .from('habit_logs')
                        .select('completed_at')
                        .eq('user_id', user.id),
                    supabase
                        .from('goals')
                        .select('id')
                        .eq('user_id', user.id),
                    supabase
                        .from('daily_wellness')
                        .select('date')
                        .eq('user_id', user.id)
                ]);

                const logs = logsResult.data || [];
                const goals = goalsResult.data || [];
                const wellness = wellnessResult.data || [];

                // Calculate metrics
                const totalCompleted = logs.length;

                // Calculate streak
                const uniqueDates = [...new Set(logs.map(l =>
                    new Date(l.completed_at).toISOString().split('T')[0]
                ))].sort((a, b) => b.localeCompare(a));

                let streak = 0;
                const today = new Date().toISOString().split('T')[0];
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

                if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
                    streak = 1;
                    let checkDate = uniqueDates.includes(today) ? today : yesterday;
                    let prevDate = new Date(checkDate);
                    while (true) {
                        prevDate.setDate(prevDate.getDate() - 1);
                        if (uniqueDates.includes(prevDate.toISOString().split('T')[0])) {
                            streak++;
                        } else break;
                    }
                }

                // Check time-based achievements
                const earlyBird = logs.some(l => {
                    const hour = new Date(l.completed_at).getHours();
                    return hour < 7;
                });
                const nightOwl = logs.some(l => {
                    const hour = new Date(l.completed_at).getHours();
                    return hour >= 22;
                });

                // Build achievements array
                const achievementsList: Achievement[] = ACHIEVEMENT_DEFINITIONS.map(def => {
                    let current = 0;

                    switch (def.category) {
                        case 'completion':
                            current = totalCompleted;
                            break;
                        case 'streak':
                            current = streak;
                            break;
                        case 'time':
                            if (def.id === 'early_bird') current = earlyBird ? 1 : 0;
                            if (def.id === 'night_owl') current = nightOwl ? 1 : 0;
                            break;
                        case 'goal':
                            current = goals.length;
                            break;
                        case 'wellness':
                            current = wellness.length;
                            break;
                    }

                    const unlocked = current >= def.requirement;
                    const progress = Math.min(100, Math.round((current / def.requirement) * 100));

                    return {
                        id: def.id,
                        name: def.name,
                        description: def.desc,
                        icon: def.icon,
                        unlocked,
                        unlockedAt: unlocked ? new Date().toISOString() : null,
                        progress,
                        requirement: def.requirement,
                        current,
                        category: def.category as any,
                        color: def.color,
                        bg: def.bg
                    };
                });

                // Sort: unlocked first, then by progress
                achievementsList.sort((a, b) => {
                    if (a.unlocked && !b.unlocked) return -1;
                    if (!a.unlocked && b.unlocked) return 1;
                    return b.progress - a.progress;
                });

                setAchievements(achievementsList);
            } catch (err) {
                console.error('Error fetching achievements:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAchievementData();
    }, [user]);

    return { achievements, loading, newUnlock, clearNewUnlock: () => setNewUnlock(null) };
}
