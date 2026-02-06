'use client';

import { useMemo } from 'react';

/**
 * Friendly Flames - Gamification Avatar
 * Evolves based on XP and Health (Wellness)
 */

type FlameStage = 'spark' | 'flame' | 'mystic_fire' | 'solar_spirit';
type FlameMood = 'radiant' | 'neutral' | 'dim';

interface WellnessCompanionProps {
    stage?: FlameStage;
    health?: number; // 0-100
    level?: number;
    className?: string;
}

export default function WellnessCompanion({
    stage = 'spark',
    health = 100,
    level = 1,
    className = ''
}: WellnessCompanionProps) {

    // Determine mood based on health
    const mood: FlameMood = useMemo(() => {
        if (health >= 80) return 'radiant';
        if (health < 40) return 'dim';
        return 'neutral';
    }, [health]);

    // Visual config based on Stage & Mood
    const config = useMemo(() => {
        const base = {
            spark: {
                emoji: '✨',
                color: 'text-yellow-400',
                shadow: 'shadow-yellow-400/50',
                title: 'Chispa Tímida',
                size: 'text-4xl'
            },
            flame: {
                emoji: '🔥',
                color: 'text-orange-500',
                shadow: 'shadow-orange-500/50',
                title: 'Llama Curiosa',
                size: 'text-6xl'
            },
            mystic_fire: {
                emoji: '💠', // Or a blue flame custom SVG ideally
                color: 'text-blue-500',
                shadow: 'shadow-blue-500/60',
                title: 'Fuego Místico',
                size: 'text-7xl'
            },
            solar_spirit: {
                emoji: '🌞',
                color: 'text-purple-500', // Cosmic/Multicolor
                shadow: 'shadow-purple-500/60',
                title: 'Espíritu Solar',
                size: 'text-8xl'
            }
        }[stage];

        // Mood modifiers
        if (mood === 'dim') {
            base.color = 'text-gray-400';
            base.shadow = 'shadow-gray-400/20';
        }

        return base;
    }, [stage, mood]);

    return (
        <div className={`flex flex-col items-center justify-center p-4 transition-all duration-500 ${className}`}>

            {/* Level Badge */}
            <div className="mb-2 px-2 py-0.5 bg-black/20 rounded-full text-xs font-bold backdrop-blur-sm">
                Lvl {level}
            </div>

            {/* Avatar Container */}
            <div className={`
                relative 
                transition-all duration-500 
                ${config.size} 
                ${mood === 'radiant' ? 'scale-110 drop-shadow-[0_0_15px_rgba(255,165,0,0.8)]' : ''}
                ${mood === 'dim' ? 'opacity-80 scale-90 grayscale' : ''}
            `}>
                {/* Main Emoji/Asset */}
                <div className={`animate-bounce ${config.color} filter drop-shadow-lg`}>
                    {config.emoji}
                </div>

                {/* Mood Face Overlay Removed for cleaner elemental look */}
            </div>

            {/* Name/Title */}
            <div className="mt-2 text-sm font-medium opacity-90">
                {config.title}
            </div>

            {/* Health Bar (Mini) */}
            <div className="mt-1 w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 ${health > 50 ? 'bg-green-400' :
                        health > 20 ? 'bg-yellow-400' : 'bg-red-500'
                        }`}
                    style={{ width: `${health}%` }}
                />
            </div>
        </div>
    );
}
