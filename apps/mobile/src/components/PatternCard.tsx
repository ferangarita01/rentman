
import React from 'react';

interface PatternCardProps {
    type: string;
    value: string;
    confidence: number;
}

export default function PatternCard({ type, value, confidence }: PatternCardProps) {
    // Visual style based on insight type
    const getStyle = () => {
        switch (type) {
            case 'pattern': return 'bg-blue-50 border-blue-200 text-blue-900';
            case 'preference': return 'bg-purple-50 border-purple-200 text-purple-900';
            case 'barrier': return 'bg-red-50 border-red-200 text-red-900';
            case 'achievement': return 'bg-yellow-50 border-yellow-200 text-yellow-900';
            default: return 'bg-gray-50 border-gray-200 text-gray-900';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'pattern': return '📊';
            case 'preference': return '⭐';
            case 'barrier': return '🚧';
            case 'achievement': return '🏆';
            default: return '🧠';
        }
    };

    return (
        <div className={`p-3 rounded-xl border ${getStyle()} relative overflow-hidden group transition-all hover:shadow-md`}>
            <div className="flex items-start gap-3">
                <div className="text-xl mt-0.5">{getIcon()}</div>
                <div className="flex-1">
                    <p className="text-sm font-medium leading-relaxed">{value}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold">{type}</span>
                        {confidence > 0.8 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/50 font-bold text-green-700">
                                Verificado
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Decorative background icon */}
            <div className="absolute -bottom-2 -right-2 text-6xl opacity-5 pointer-events-none rotate-12">
                {getIcon()}
            </div>
        </div>
    );
}
