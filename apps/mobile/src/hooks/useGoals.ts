'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Objective {
    id: string;
    title: string;
    target_date: string;
    target_metric_value: number | null;
    current_metric_value: number;
    status: string;
}

export interface Goal {
    id: string;
    title: string;
    description: string | null;
    status: string;
    objectives: Objective[];
    progress: number; // 0-100 calculated
}

export interface GoalsData {
    goals: Goal[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useGoals(): GoalsData {
    const { user } = useAuth();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGoals = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('goals')
                .select(`
                    id,
                    title,
                    description,
                    status,
                    objectives (
                        id,
                        title,
                        target_date,
                        target_metric_value,
                        current_metric_value,
                        status
                    )
                `)
                .eq('user_id', user.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            // Calculate progress for each goal
            const goalsWithProgress = (data || []).map(goal => {
                const objectives = goal.objectives || [];
                if (objectives.length === 0) {
                    return { ...goal, progress: 0 };
                }

                // Calculate based on completed objectives
                const completedCount = objectives.filter(
                    (obj: Objective) => obj.status === 'completed'
                ).length;
                const progress = Math.round((completedCount / objectives.length) * 100);

                return { ...goal, progress };
            });

            setGoals(goalsWithProgress);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching goals:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, [user]);

    return { goals, loading, error, refetch: fetchGoals };
}
