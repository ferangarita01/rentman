'use client';

import { useSarah } from '@/contexts/SarahContext';
import { useTheme } from '@/contexts/ThemeContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Status bar that appears when Sarah is active
 * Shows connection status and response in a compact bar at top
 */
import { usePathname } from 'next/navigation';

export default function SarahStatusBar() {
    const { isActive, setIsActive, isReady, isListening, agentResponse, isFullPageMode, disconnect } = useSarah();
    const { isDark } = useTheme();
    const pathname = usePathname();

    // Aggressively hide on Sarah pages OR if context says so
    if (isFullPageMode || !isActive || !pathname || pathname.includes('/sarah')) return null;

    return (
        <div
            className={`
                fixed top-0 left-0 right-0 z-40 px-4 py-3 pt-12
                backdrop-blur-xl border-b
                ${isDark
                    ? 'bg-black/80 border-white/10'
                    : 'bg-white/80 border-gray-200'
                }
            `}
            style={{ paddingTop: 'max(48px, env(safe-area-inset-top))' }}
        >
            <div className="flex items-center gap-3">
                {/* Avatar with pulse */}
                <div
                    className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-xl
                        ${isListening ? 'animate-pulse' : ''}
                    `}
                    style={{ background: 'var(--sarah-gradient-cta)' }}
                >
                    👩‍💼
                </div>

                {/* Status */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Sarah
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isReady
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                            {isReady ? (isListening ? 'Escuchando' : 'Conectada') : 'Conectando...'}
                        </span>
                    </div>

                    {/* Response preview */}
                    {agentResponse && (
                        <p className={`text-sm truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {agentResponse}
                        </p>
                    )}
                </div>

                {/* Waveform dots */}
                <div className="flex items-center gap-1">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-1.5 rounded-full bg-secondary transition-all ${isListening ? 'animate-bounce' : 'h-1.5'
                                }`}
                            style={{
                                height: isListening ? `${12 + Math.random() * 8}px` : '6px',
                                animationDelay: `${i * 0.15}s`
                            }}
                        />
                    ))}
                </div>

                {/* Close Button */}
                <button
                    onClick={() => {
                        setIsActive(false);
                        disconnect(); // Explicitly disconnect
                    }}
                    className={`
                        p-2 rounded-full transition-all
                        ${isDark
                            ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}
                    `}
                    aria-label="Cerrar Sarah"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
