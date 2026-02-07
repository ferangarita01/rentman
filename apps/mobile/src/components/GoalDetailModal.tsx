'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
    XCircleIcon,
    PlusIcon,
    Trash2Icon,
    TargetIcon,
    CheckCircle2Icon,
    LinkIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import CreateHabitModal from './CreateHabitModal';

interface GoalDetailModalProps {
    goalId: string;
    onClose: () => void;
    onUpdate: () => void;
}

interface GoalDetails {
    id: string;
    title: string;
    description: string;
    status: string;
    habits: any[];
    objectives: any[];
}

export default function GoalDetailModal({ goalId, onClose, onUpdate }: GoalDetailModalProps) {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const [details, setDetails] = useState<GoalDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateHabit, setShowCreateHabit] = useState(false);
    const [showLinkHabit, setShowLinkHabit] = useState(false);
    const [orphanHabits, setOrphanHabits] = useState<any[]>([]);

    useEffect(() => {
        fetchDetails();
    }, [goalId, user]);

    const fetchDetails = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_goal_details', {
                p_goal_id: goalId,
                p_user_id: user.id
            });

            if (error) throw error;
            if (data && data.length > 0) {
                setDetails(data[0]);
            }
        } catch (err) {
            console.error('Error fetching goal details:', err);
            toast.error('Failed to load goal details');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrphanHabits = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('habits')
                .select('*')
                .eq('user_id', user.id)
                .is('goal_id', null)
                .neq('status', 'archived');

            if (error) throw error;
            setOrphanHabits(data || []);
            setShowLinkHabit(true);
        } catch (err) {
            console.error('Error fetching habits:', err);
            toast.error('Failed to load habits');
        }
    };

    const handleUnlinkHabit = async (habitId: string) => {
        if (!user) return;
        try {
            const { error } = await supabase.rpc('unlink_habit_from_goal', {
                p_habit_id: habitId,
                p_user_id: user.id
            });
            if (error) throw error;
            toast.success('Habit removed from goal');
            fetchDetails(); // Refresh
            onUpdate(); // Notify parent
        } catch (err) {
            console.error('Error unlinking habit:', err);
            toast.error('Failed to unlink habit');
        }
    };

    const handleLinkHabit = async (habitId: string) => {
        if (!user) return;
        try {
            const { error } = await supabase.rpc('link_habit_to_goal', {
                p_habit_id: habitId,
                p_goal_id: goalId,
                p_user_id: user.id
            });
            if (error) throw error;
            toast.success('Habit linked to goal!');
            setShowLinkHabit(false);
            fetchDetails();
            onUpdate();
        } catch (err) {
            console.error('Error linking habit:', err);
            toast.error('Failed to link habit');
        }
    };

    if (loading && !details) {
        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (!details) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className={`w-full max-w-lg rounded-3xl max-h-[85vh] flex flex-col ${isDark ? 'bg-[#121212] text-white' : 'bg-white text-gray-900'
                    }`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`flex-shrink-0 p-6 border-b flex justify-between items-start ${isDark ? 'border-white/10' : 'border-gray-100'
                    }`}>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <TargetIcon className="w-5 h-5 text-purple-500" />
                            <h2 className="text-xl font-bold">{details.title}</h2>
                        </div>
                        {details.description && (
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {details.description}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1">
                        <XCircleIcon className={`w-8 h-8 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Objectives Section */}
                    <div>
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                            Key Objectives
                        </h3>
                        {details.objectives.length === 0 ? (
                            <p className="text-sm opacity-50 italic">No objectives defined yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {details.objectives.map((obj: any) => (
                                    <div key={obj.id} className={`p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'
                                        }`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium text-sm">{obj.title}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${obj.status === 'completed'
                                                ? 'bg-green-500/20 text-green-500'
                                                : 'bg-yellow-500/20 text-yellow-500'
                                                }`}>
                                                {obj.status}
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 rounded-full"
                                                style={{ width: `${obj.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Habits Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <span className="text-xl">⚡</span>
                                Related Habits
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={fetchOrphanHabits}
                                    className={`p-2 rounded-lg border transition-colors ${isDark
                                        ? 'border-white/10 hover:bg-white/5'
                                        : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                    title="Link existing habit"
                                >
                                    <LinkIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setShowCreateHabit(true)}
                                    className="p-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                                    title="Create new habit"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Link Habit Area */}
                        {showLinkHabit && (
                            <div className={`mb-4 p-4 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                                }`}>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-semibold">Link existing habit:</span>
                                    <button onClick={() => setShowLinkHabit(false)} className="text-xs opacity-50">Cancel</button>
                                </div>
                                {orphanHabits.length === 0 ? (
                                    <p className="text-sm opacity-50 italic">No free habits found.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {orphanHabits.map(habit => (
                                            <button
                                                key={habit.id}
                                                onClick={() => handleLinkHabit(habit.id)}
                                                className={`px-3 py-1.5 rounded-lg text-sm border flex items-center gap-2 ${isDark
                                                    ? 'bg-gray-800 border-gray-700 hover:border-purple-500'
                                                    : 'bg-white border-gray-200 hover:border-purple-500'
                                                    }`}
                                            >
                                                <span>{habit.emoji}</span>
                                                <span>{habit.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Habits List */}
                        {details.habits.length === 0 ? (
                            <div className={`text-center py-8 rounded-2xl border-2 border-dashed ${isDark ? 'border-gray-800 text-gray-600' : 'border-gray-100 text-gray-400'
                                }`}>
                                <p>No habits linked yet.</p>
                                <p className="text-xs mt-1">Create one or link an existing one!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {details.habits.map((habit: any) => (
                                    <div
                                        key={habit.id}
                                        className={`flex items-center justify-between p-4 rounded-xl border ${isDark
                                            ? 'bg-white/5 border-white/5'
                                            : 'bg-white border-gray-100 shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-2xl">{habit.emoji}</div>
                                            <div>
                                                <div className="font-semibold">{habit.name}</div>
                                                <div className="flex items-center gap-2 text-xs opacity-60">
                                                    <span>🔥 {habit.current_streak} streak</span>
                                                    {habit.completed_today && (
                                                        <span className="text-green-500 font-bold">• Done today</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleUnlinkHabit(habit.id)}
                                            className="p-2 opacity-30 hover:opacity-100 hover:text-red-500 transition-all"
                                            title="Remove from goal"
                                        >
                                            <Trash2Icon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showCreateHabit && (
                <CreateHabitModal
                    onClose={() => setShowCreateHabit(false)}
                    onCreated={() => {
                        fetchDetails();
                        onUpdate();
                    }}
                    darkMode={isDark}
                    initialGoalId={goalId}
                />
            )}
        </div>
    );
}
