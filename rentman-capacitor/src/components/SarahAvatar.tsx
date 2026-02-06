'use client';

import { useMemo } from 'react';

/**
 * Sarah Avatar States
 * Tamagotchi de la Productividad - Sarah reacts to user performance
 */
export type SarahState =
    | 'neutral'      // Default calm state
    | 'celebrating'  // Just completed a habit
    | 'fire'         // High streak (7+ days)
    | 'suspicious'   // Detected excuse in conversation
    | 'disappointed' // Streak broken
    | 'sleeping';    // Late night / inactive

interface SarahAvatarProps {
    state?: SarahState;


    
    streak?: number;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-4xl',
    xl: 'w-28 h-28 text-5xl',
};

/**
 * SarahAvatar - Reactive avatar that shows Sarah's mood
 * Future: Replace emoji with Lottie/Rive animations
 */
export default function SarahAvatar({
    state = 'neutral',
    streak = 0,
    size = 'md',
    className = ''
}: SarahAvatarProps) {

    // Determine actual state based on streak
    const effectiveState = useMemo(() => {
        if (streak >= 7 && state === 'neutral') return 'fire';
        return state;
    }, [state, streak]);

    // Visual configuration per state
    const config = useMemo(() => {
        switch (effectiveState) {
            case 'celebrating':
                return {
                    emoji: '🎉',
                    bg: 'bg-gradient-to-br from-yellow-300 to-orange-500 shadow-inner',
                    glow: 'shadow-lg shadow-orange-400/50 ring-4 ring-orange-400/20',
                    animation: 'animate-bounce',
                    overlay: null,
                };
            case 'fire':
                return {
                    emoji: '🔥',
                    bg: 'bg-gradient-to-br from-orange-500 to-red-600',
                    glow: 'shadow-xl shadow-red-500/60',
                    animation: 'animate-pulse',
                    overlay: '🔥', // Fire aura
                };
            case 'suspicious':
                return {
                    emoji: '🤨',
                    bg: 'bg-gradient-to-br from-gray-400 to-gray-600',
                    glow: 'shadow-md shadow-gray-400/30',
                    animation: '',
                    overlay: null,
                };
            case 'disappointed':
                return {
                    emoji: '😔',
                    bg: 'bg-gradient-to-br from-gray-300 to-gray-500 grayscale opacity-80',
                    glow: 'shadow-inner shadow-black/20',
                    animation: '',
                    overlay: '💔',
                };
            case 'sleeping':
                return {
                    emoji: '😴',
                    bg: 'bg-gradient-to-br from-indigo-400 to-purple-600',
                    glow: 'shadow-md shadow-purple-400/30',
                    animation: '',
                    overlay: '💤',
                };
            default: // neutral
                return {
                    emoji: '👩‍💼',
                    bg: 'bg-gradient-to-br from-orange-400 to-pink-500 shadow-inner',
                    glow: 'shadow-lg shadow-orange-500/30 ring-4 ring-orange-500/10',
                    animation: '',
                    overlay: null,
                };
        }
    }, [effectiveState]);

    return (
        <div className={`relative inline-block ${className}`}>
            {/* Main Avatar */}
            <div
                className={`
          ${sizeClasses[size]}
          ${config.bg}
          ${config.glow}
          ${config.animation}
          rounded-full flex items-center justify-center
          transition-all duration-300
        `}
            >
                <span role="img" aria-label={`Sarah ${effectiveState}`}>
                    {config.emoji}
                </span>
            </div>

            {/* Overlay Effect (Fire, Hearts, etc.) */}
            {config.overlay && (
                <span
                    className="absolute -top-1 -right-1 text-lg animate-bounce"
                    aria-hidden="true"
                >
                    {config.overlay}
                </span>
            )}

            {/* Streak Badge */}
            {streak > 0 && (
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full px-1.5 py-0.5 text-xs font-bold shadow-md border-2 border-orange-400">
                    <span className="text-orange-500">{streak}</span>
                    <span className="text-orange-400">🔥</span>
                </div>
            )}
        </div>
    );
}

export { SarahAvatar };
