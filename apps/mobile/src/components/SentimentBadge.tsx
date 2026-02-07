
import React from 'react';

interface SentimentBadgeProps {
    emotion: string;
    intensity: 'low' | 'medium' | 'high';
}

const EMOTION_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
    // Positives
    happy: { icon: '😄', color: 'bg-green-100 text-green-800 border-green-200', label: 'Feliz' },
    excited: { icon: '🔥', color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Motivado' },
    grateful: { icon: '🙏', color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Agradecido' },

    // Neutrals / Physical
    neutral: { icon: '😐', color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Neutral' },
    tired: { icon: '🔋', color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Cansado' },

    // Negatives
    stressed: { icon: '🤯', color: 'bg-red-100 text-red-800 border-red-200', label: 'Estresado' },
    angry: { icon: '😡', color: 'bg-red-100 text-red-800 border-red-200', label: 'Molesto' },
    sad: { icon: '😢', color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Triste' },
    anxious: { icon: '😰', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Ansioso' },
};

export default function SentimentBadge({ emotion, intensity }: SentimentBadgeProps) {
    const config = EMOTION_CONFIG[emotion.toLowerCase()] || EMOTION_CONFIG['neutral'];

    const intensityIndicator = intensity === 'high' ? '!!!' : intensity === 'medium' ? '!!' : '';

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.color} text-xs font-semibold shadow-sm`}>
            <span className="text-sm">{config.icon}</span>
            <span className="capitalize">{config.label} {intensityIndicator}</span>
        </div>
    );
}
