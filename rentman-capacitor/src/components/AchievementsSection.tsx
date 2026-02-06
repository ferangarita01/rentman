'use client';

import { useState } from 'react';
import { TrendingUpIcon, ChevronRightIcon, XIcon, LockIcon } from 'lucide-react';
import { useAchievements, Achievement } from '@/hooks/useAchievements';

export default function AchievementsSection() {
    const { achievements, loading } = useAchievements();
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUpIcon className="w-5 h-5 text-green-500" />
                    <h3 className="font-bold text-lg">Achievements</h3>
                </div>
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-[1.5rem] animate-pulse" />
                ))}
            </div>
        );
    }

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUpIcon className="w-5 h-5 text-green-500" />
                    <h3 className="font-bold text-lg">Achievements</h3>
                </div>
                <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                    {unlockedCount}/{achievements.length} Unlocked
                </span>
            </div>

            <div className="space-y-3">
                {achievements.map((achievement) => (
                    <div
                        key={achievement.id}
                        onClick={() => setSelectedAchievement(achievement)}
                        className={`
                            p-4 rounded-[1.5rem] flex items-center gap-4 border transition-all cursor-pointer
                            ${achievement.unlocked
                                ? 'bg-card-bg border-card hover:border-green-500/50 hover:scale-[1.02]'
                                : 'bg-transparent border-dashed border-gray-300 dark:border-card opacity-60 hover:opacity-80'}
                        `}
                    >
                        <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${achievement.unlocked ? achievement.bg : 'bg-gray-100 dark:bg-gray-800'}`}>
                            {achievement.icon}
                            {!achievement.unlocked && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                    <LockIcon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className={`font-bold ${achievement.unlocked ? '' : 'text-gray-500'}`}>
                                {achievement.name}
                            </div>
                            <div className="text-xs font-medium opacity-60">
                                {achievement.description}
                            </div>

                            {/* Progress bar for locked achievements */}
                            {!achievement.unlocked && (
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                            style={{ width: `${achievement.progress}%` }}
                                        />
                                    </div>
                                    <span className="text-xs opacity-50">
                                        {achievement.current}/{achievement.requirement}
                                    </span>
                                </div>
                            )}
                        </div>

                        {achievement.unlocked ? (
                            <div className="text-green-500">
                                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                            </div>
                        ) : (
                            <ChevronRightIcon className="w-5 h-5 opacity-30" />
                        )}
                    </div>
                ))}
            </div>

            {/* Achievement Detail Modal */}
            {selectedAchievement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedAchievement(null)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-[2rem] p-6 m-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95"
                    >
                        <div className="flex justify-end mb-2">
                            <button
                                onClick={() => setSelectedAchievement(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="text-center">
                            <div className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center text-5xl mb-4 ${selectedAchievement.unlocked ? selectedAchievement.bg : 'bg-gray-100 dark:bg-gray-800'}`}>
                                {selectedAchievement.icon}
                            </div>

                            <h3 className={`text-xl font-bold mb-1 ${selectedAchievement.unlocked ? selectedAchievement.color : 'text-gray-500'}`}>
                                {selectedAchievement.name}
                            </h3>
                            <p className="text-sm opacity-60 mb-4">
                                {selectedAchievement.description}
                            </p>

                            {selectedAchievement.unlocked ? (
                                <div className="bg-green-500/10 text-green-500 rounded-xl p-3 text-sm font-bold">
                                    ✅ Achievement Unlocked!
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                                            style={{ width: `${selectedAchievement.progress}%` }}
                                        />
                                    </div>
                                    <p className="text-sm opacity-60">
                                        <span className="font-bold text-foreground">{selectedAchievement.current}</span>
                                        {' / '}
                                        {selectedAchievement.requirement} to unlock
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
