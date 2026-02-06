'use client';

import { TargetIcon, CheckCircle2Icon, ClockIcon } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { useRouter } from 'next/navigation';

import { useState } from 'react';
import GoalDetailModal from './GoalDetailModal';

export default function GoalsDashboard() {
    const { goals, loading, refetch } = useGoals();
    const router = useRouter();
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

    if (loading) {
        return (
            <div className="bg-card-bg rounded-[2rem] p-6 animate-pulse">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
        );
    }

    if (goals.length === 0) {
        return (
            <div className="bg-card-bg rounded-[2rem] p-6 text-center">
                <TargetIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <h3 className="font-bold text-lg mb-1">No Goals Yet</h3>
                <p className="text-sm opacity-60 mb-4">
                    Talk to Sarah to create your first goal!
                </p>
                <button
                    onClick={() => router.push('/sarah')}
                    className="px-4 py-2 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors"
                >
                    🎤 Ask Sarah
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
                        <TargetIcon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-lg">Your Goals</h3>
                </div>

                {goals.map((goal) => (
                    <div
                        key={goal.id}
                        className="bg-card-bg rounded-[1.5rem] p-5 cursor-pointer hover:scale-[1.02] transition-all group"
                        onClick={() => setSelectedGoalId(goal.id)}
                    >
                        {/* Goal Header */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <h4 className="font-bold text-base group-hover:text-purple-400 transition-colors">
                                    {goal.title}
                                </h4>
                                {goal.description && (
                                    <p className="text-xs opacity-60 mt-1 line-clamp-1">
                                        {goal.description}
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-purple-500">
                                    {goal.progress}%
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                                style={{ width: `${goal.progress}%` }}
                            />
                        </div>

                        {/* Objectives Preview */}
                        <div className="flex items-center gap-2 text-xs opacity-60">
                            <CheckCircle2Icon className="w-3 h-3" />
                            <span>
                                {goal.objectives.filter(o => o.status === 'completed').length}/{goal.objectives.length} objectives
                            </span>
                            {goal.objectives.length > 0 && goal.objectives[0].target_date && (
                                <>
                                    <span className="mx-1">•</span>
                                    <ClockIcon className="w-3 h-3" />
                                    <span>
                                        Target: {new Date(goal.objectives[0].target_date).toLocaleDateString()}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {selectedGoalId && (
                <GoalDetailModal
                    goalId={selectedGoalId}
                    onClose={() => setSelectedGoalId(null)}
                    onUpdate={refetch}
                />
            )}
        </>
    );
}
