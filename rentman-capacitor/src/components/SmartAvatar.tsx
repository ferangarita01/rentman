'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from 'lucide-react';
import Image from 'next/image';

interface SmartAvatarProps {
    seed: string;
    level: number;
    className?: string;
    showEffects?: boolean;
}

export default function SmartAvatar({ seed, level, className = "w-20 h-20", showEffects = true }: SmartAvatarProps) {
    // 1. Determine Evolution Stage
    const getStageConfig = (lvl: number) => {
        // I. Seed (Novice) - Level 1-9
        if (lvl < 10) {
            return {
                style: 'avataaars',
                params: '&clothing=hoodie&accessories=none&top=shortHair&hairColor=brown&skinColor=pale',
                aura: 'border-2 border-gray-200 dark:border-gray-700',
                glow: ''
            };
        }
        // II. Spark (Apprentice) - Level 10-24
        if (lvl < 25) {
            return {
                style: 'avataaars',
                params: '&clothing=blazerShirt&accessories=prescription02&top=shortHairTheCaesarSidePart&start=true',
                aura: 'border-[3px] border-blue-400 dark:border-blue-500',
                glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]'
            };
        }
        // III. Flame (Expert) - Level 25-49
        if (lvl < 50) {
            return {
                style: 'avataaars',
                params: '&clothing=blazerSweater&accessories=sunglasses&top=shortHairDreads01&clotheColor=black',
                aura: 'border-[3px] border-orange-500',
                glow: 'shadow-[0_0_20px_rgba(249,115,22,0.5)]'
            };
        }
        // IV. Fire (Legend) - Level 50+
        return {
            style: 'avataaars',
            params: '&clothing=graphicShirt&accessories=wayfarers&top=shortHairFrizzle&clotheColor=pastelRed&skinColor=tanned',
            aura: 'border-4 border-amber-400',
            glow: 'shadow-[0_0_30px_rgba(251,191,36,0.8)] animate-pulse'
        };
    };

    const config = getStageConfig(level);
    // Uses 7.x which is very stable. 9.x might have breaking changes or be blocked.
    const uri = `https://api.dicebear.com/7.x/${config.style}/svg?seed=${seed}&backgroundColor=transparent${config.params}`;

    const [imgError, setImgError] = React.useState(false);

    // Breathing animation variant
    const breathingAnim = {
        scale: [1, 1.03, 1],
        transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut" as const
        }
    };

    return (
        <motion.div
            className={`relative ${className} group cursor-pointer`}
            animate={breathingAnim}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
        >
            {/* Aura / Glow Effect */}
            {showEffects && (
                <div className={`
                    absolute inset-0 rounded-full transition-all duration-500
                    ${config.aura} ${config.glow}
                `}></div>
            )}

            {/* The Avatar Image */}
            <div className="relative w-full h-full rounded-full overflow-hidden bg-white/10 backdrop-blur-sm flex items-center justify-center">
                {!imgError ? (
                    <img
                        src={uri}
                        alt={`Avatar Lvl ${level}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            console.error('Avatar load error:', e);
                            setImgError(true);
                            // toast.error("Avatar Failed", { id: 'avatar-err' }); // Optional debug
                        }}
                    />
                ) : (
                    <div className="text-gray-400 text-xs text-center p-1">
                        <span className="text-2xl">👤</span>
                    </div>
                )}
            </div>

            {/* Level Badge (Optional overlay) */}
            {showEffects && level >= 50 && (
                <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg border border-white z-10">
                    KING
                </div>
            )}

            {/* Sparkles for high levels */}
            {showEffects && level >= 25 && (
                <SparklesIcon className="absolute -bottom-2 -left-2 w-5 h-5 text-yellow-400 animate-bounce z-10" />
            )}
        </motion.div>
    );
}
