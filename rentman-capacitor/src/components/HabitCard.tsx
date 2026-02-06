'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, FlameIcon } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { celebrate, microCelebrate } from '@/lib/confetti';
import { useTheme } from '@/contexts/ThemeContext';
import toast from 'react-hot-toast';

interface HabitCardProps {
    habit: any; // Using explicit type from page.tsx is better, but 'any' allows flexibility for now
    onComplete: (id: string, name: string, habit: any) => void;
    darkMode: boolean;
}

export default function HabitCard({ habit, onComplete, darkMode }: HabitCardProps) {
    const [isPressed, setIsPressed] = useState(false);
    const [longPressTriggered, setLongPressTriggered] = useState(false);
    const pressTimer = useRef<NodeJS.Timeout | null>(null);
    const [showQuickView, setShowQuickView] = useState(false);

    // Color Logic (Moved from page.tsx)
    const getCategoryStyle = (category: string) => {
        // ... (Keep existing style logic if needed, or rely on pass-through)
        return {};
    };

    // --- Long Press Logic ---
    const startPress = () => {
        setIsPressed(true);
        setLongPressTriggered(false);
        pressTimer.current = setTimeout(() => {
            setLongPressTriggered(true);
            haptic('success'); // Feedback that long press activated
            setShowQuickView(true);
        }, 600); // 600ms threshold
    };

    const cancelPress = () => {
        setIsPressed(false);
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };

    const handleClick = () => {
        if (longPressTriggered) return; // Don't click if long press happened
        if (!habit.completed_today) {
            onComplete(habit.id, habit.name, habit);
        }
    };

    // --- Render Helpers ---
    const hasTag = habit.goal_title || habit.objective_title;
    const tagLabel = habit.goal_title || habit.objective_title;
    const tagType = habit.goal_title ? 'Goal' : 'Objective';

    return (
        <>
            <motion.div
                onMouseDown={startPress}
                onMouseUp={cancelPress}
                onMouseLeave={cancelPress}
                onTouchStart={startPress}
                onTouchEnd={cancelPress}
                onClick={handleClick}
                whileTap={{ scale: 0.95 }}
                className={`
                    group border rounded-[2rem] p-5 flex items-center justify-between transition-colors duration-200 select-none cursor-pointer
                    ${habit.completed_today
                        ? darkMode
                            ? 'bg-[#121214]/50 border-emerald-500/20 opacity-70'
                            : 'bg-green-50 border-emerald-500/30 opacity-80'
                        : habit.type === 'quit'
                            ? darkMode
                                ? 'bg-[#121214] border-red-500/20 hover:border-red-500/40'
                                : 'bg-red-50/50 border-red-500/20 hover:border-red-500/40'
                            : darkMode
                                ? 'bg-[#121214] border-white/5 active:bg-[#1a1a1c]'
                                : 'bg-white border-gray-200 active:bg-gray-50'
                    }
                `}
            >
                <div className="flex items-center gap-4">
                    {/* Icon / Emoji */}
                    <div className={`
                        w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform duration-300
                        ${habit.completed_today ? 'scale-110 rotate-3' : ''}
                        ${habit.completed_today
                            ? darkMode
                                ? 'bg-emerald-500/20 text-emerald-500'
                                : 'bg-emerald-100 text-emerald-600'
                            : habit.type === 'quit'
                                ? darkMode
                                    ? 'bg-red-500/10 text-red-500'
                                    : 'bg-red-100 text-red-600'
                                : darkMode
                                    ? 'bg-[#1e1e24] text-white'
                                    : 'bg-gray-100 text-gray-900'}
                    `}>
                        {habit.completed_today
                            ? (habit.type === 'quit' ? "🛡️" : <CheckIcon className="w-7 h-7" />)
                            : habit.emoji}
                    </div>

                    {/* Text Content */}
                    <div className="flex flex-col gap-0.5">
                        <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {habit.category?.toLowerCase() !== 'general' && (
                                <span className={habit.type === 'quit' ? 'text-red-400' : ''}>
                                    {habit.type === 'quit' ? 'AVOID' : habit.category}
                                </span>
                            )}
                            {/* TAG BADGE */}
                            {hasTag && (
                                <span className={`
                                    px-1.5 py-0.5 rounded-md text-[9px] border 
                                    ${tagType === 'Goal'
                                        ? 'border-purple-500/30 text-purple-500 bg-purple-500/10'
                                        : 'border-blue-500/30 text-blue-500 bg-blue-500/10'}
                                `}>
                                    {tagType === 'Goal' ? '🎯' : '🔹'} {tagLabel.slice(0, 15)}{tagLabel.length > 15 ? '...' : ''}
                                </span>
                            )}
                        </div>

                        <h3 className={`text-lg font-semibold ${habit.completed_today ? 'text-emerald-500 line-through' : darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {habit.name}
                        </h3>
                        <p className={`text-sm font-medium truncate max-w-[150px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {habit.tiny_version}
                        </p>
                    </div>
                </div>

                {/* Streak Counter */}
                <div className="flex flex-col items-center gap-0.5 pr-1">
                    <FlameIcon className={`w-6 h-6 ${habit.current_streak > 0 ? 'text-orange-500' : darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                    <span className={`text-lg font-semibold ${habit.current_streak > 0 ? darkMode ? 'text-white' : 'text-gray-900' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {habit.current_streak}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Days</span>
                </div>
            </motion.div>

            {/* Quick View Modal (Long Press) */}
            {showQuickView && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowQuickView(false)}>
                    <div className={`w-[85%] max-w-sm p-6 rounded-3xl ${darkMode ? 'bg-[#1a1a1c] border border-white/10' : 'bg-white'} shadow-2xl scale-100 animate-in zoom-in-95 duration-200`}>
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="text-6xl">{habit.emoji}</div>
                            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{habit.name}</h2>

                            <div className="w-full bg-gray-200 dark:bg-gray-800 h-px my-2"></div>

                            <div className="grid grid-cols-2 gap-4 w-full text-sm">
                                <div>
                                    <p className="text-gray-500">Best Streak</p>
                                    <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-black'}`}>{habit.best_streak} 🔥</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Total Done</p>
                                    <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-black'}`}>{habit.total_completions} ✅</p>
                                </div>
                            </div>

                            {hasTag && (
                                <div className={`mt-2 px-3 py-2 rounded-xl w-full ${tagType === 'Goal' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                    <p className="text-xs uppercase tracking-wider opacity-70 mb-1">Linked to {tagType}</p>
                                    <p className="font-semibold">{tagLabel}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
