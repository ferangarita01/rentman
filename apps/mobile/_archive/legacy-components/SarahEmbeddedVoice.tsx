'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { XMarkIcon } from '@heroicons/react/24/outline';
import DynamicUI, { UISurface } from './DynamicUI';
import GoalWizardGadget from './gadgets/GoalWizardGadget';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSarah } from '@/contexts/SarahContext';

/**
 * Embedded voice interface for /sarah page
 * Redesigned UI with centered waveform and message-style response cards
 */
export default function SarahEmbeddedVoice() {
    const { user } = useAuth();
    const { isDark: darkMode } = useTheme();
    const router = useRouter();

    const {
        isActive,
        setIsActive,
        isListening,
        isSpeaking,
        isReady,
        agentResponse,
        disconnect,
        setIsFullPageMode
    } = useSarah();

    const [dynamicUI, setDynamicUI] = useState<UISurface | null>(null);
    const [gadgetView, setGadgetView] = useState<'none' | 'habit_creator'>('none');
    const [showResponseCard, setShowResponseCard] = useState(true);
    const [sarahMessage, setSarahMessage] = useState<{ emoji: string; title: string; body: string; style: string } | null>(null);

    // Detect emoji from response for emotional context
    const detectEmoji = (text: string): string => {
        // Check for common emotional patterns
        if (!text) return '💬';
        const lower = text.toLowerCase();

        if (lower.includes('lamento') || lower.includes('sorry') || lower.includes('pérdida') || lower.includes('triste')) return '💔';
        if (lower.includes('felicidades') || lower.includes('congrats') || lower.includes('increíble') || lower.includes('amazing')) return '🎉';
        if (lower.includes('boom') || lower.includes('genial') || lower.includes('great')) return '🔥';
        if (lower.includes('buenos días') || lower.includes('good morning')) return '☀️';
        if (lower.includes('buenas noches') || lower.includes('good night') || lower.includes('dormir')) return '🌙';
        if (lower.includes('?') || lower.includes('qué') || lower.includes('what')) return '🤔';
        if (lower.includes('bien') || lower.includes('good') || lower.includes('nice')) return '👍';

        return '💬';
    };

    // Extract title from response (first sentence or first few words)
    const extractTitle = (text: string): string => {
        if (!text) return '';
        // Get first sentence or first ~30 characters
        const firstSentence = text.split(/[.!?]/)[0];
        if (firstSentence.length <= 40) return firstSentence + (text.includes('.') ? '.' : '');
        return firstSentence.substring(0, 35) + '...';
    };

    // FORCE ACTIVE & FULL PAGE ON MOUNT
    useEffect(() => {
        setIsActive(true);
        setIsFullPageMode(true);

        return () => {
            setIsFullPageMode(false);
        };
    }, []);

    // Show response card when new response arrives
    useEffect(() => {
        if (agentResponse) {
            setShowResponseCard(true);
        }
    }, [agentResponse]);

    // Listen for events
    useEffect(() => {
        const handleOpenHabitCreator = (e: CustomEvent) => {
            setGadgetView('habit_creator');
            setDynamicUI(null);
        };

        const handleSarahRender = (e: CustomEvent) => {
            if (e.detail?.surface) {
                setDynamicUI(e.detail.surface);
                setGadgetView('none');
            }
        };

        const handleScheduleNotification = async (e: CustomEvent) => {
            const { id, title, body, scheduleAt, recurrence } = e.detail;
            const { NotificationService } = await import('@/lib/notifications');
            const scheduleDate = new Date(scheduleAt);
            await NotificationService.scheduleNotification(title, body, id, scheduleDate, recurrence);
        };

        // Handle formatted messages from Sarah
        const handleSarahMessage = (e: CustomEvent) => {
            setSarahMessage({
                emoji: e.detail.emoji || '💬',
                title: e.detail.title || '',
                body: e.detail.body || '',
                style: e.detail.style || 'default'
            });
            setShowResponseCard(true);
        };

        window.addEventListener('open_habit_creator', handleOpenHabitCreator as any);
        window.addEventListener('sarah_render', handleSarahRender as any);
        window.addEventListener('schedule_notification', handleScheduleNotification as any);
        window.addEventListener('sarah_message', handleSarahMessage as any);

        return () => {
            window.removeEventListener('open_habit_creator', handleOpenHabitCreator as any);
            window.removeEventListener('sarah_render', handleSarahRender as any);
            window.removeEventListener('schedule_notification', handleScheduleNotification as any);
            window.removeEventListener('sarah_message', handleSarahMessage as any);
        };
    }, []);

    const handleUIAction = (action: string, data?: any) => {
        setDynamicUI(null);
    };

    const handleExplicitDisconnect = () => {
        disconnect();
        router.push('/');
    };

    if (!user) return null;

    const emoji = detectEmoji(agentResponse);
    const title = extractTitle(agentResponse);
    const bodyText = agentResponse?.replace(title.replace('...', ''), '').trim() || '';

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    {/* Avatar with green indicator */}
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                            <span className="text-2xl">👩‍💼</span>
                        </div>
                        {/* Green online indicator */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
                    </div>

                    <div className="flex flex-col">
                        <span className="text-white font-semibold text-lg">Rentman</span>
                        <span className="text-sm flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-green-400">
                                {isSpeaking ? 'Speaking...' : !isActive ? 'Disconnected' : !isReady ? 'Connecting...' : isListening ? 'Listening...' : 'Paused'}
                            </span>
                        </span>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={handleExplicitDisconnect}
                    className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Centered Audio Visualizer */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="flex items-end gap-1.5 h-16 mb-8">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-3 rounded-full transition-all duration-150 bg-gradient-to-t from-indigo-600 to-purple-400
                                ${isListening || isSpeaking ? 'animate-pulse' : 'opacity-50'}`}
                            style={{
                                height: isListening || isSpeaking
                                    ? `${Math.random() * 50 + 15}px`
                                    : '8px',
                                animationDelay: `${i * 0.1}s`,
                                animationDuration: '0.3s'
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Response Card - Message Style (prioritize sarahMessage over agentResponse) */}
            {(sarahMessage || agentResponse) && showResponseCard && gadgetView === 'none' && !dynamicUI && (
                <div className="px-4 pb-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="relative bg-gray-800/80 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                        {/* Close button */}
                        <button
                            onClick={() => {
                                setShowResponseCard(false);
                                setSarahMessage(null);
                            }}
                            className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 text-gray-500 transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>

                        {/* Emoji */}
                        <div className="text-4xl mb-3">{sarahMessage?.emoji || emoji}</div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-orange-400 mb-2">
                            {sarahMessage?.title || title}
                        </h3>

                        {/* Body Text */}
                        {(sarahMessage?.body || bodyText) && (
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {sarahMessage?.body || bodyText}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Loading State */}
            {!isReady && !agentResponse && (
                <div className="px-4 pb-6">
                    <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                        <div className="animate-pulse space-y-3">
                            <div className="h-8 w-8 bg-gray-700 rounded-lg" />
                            <div className="h-4 bg-gray-700 rounded w-3/4" />
                            <div className="h-3 bg-gray-700 rounded w-1/2" />
                        </div>
                    </div>
                </div>
            )}

            {/* Gadget View */}
            {gadgetView === 'habit_creator' && (
                <div className="px-4 pb-6">
                    <GoalWizardGadget
                        onClose={() => setGadgetView('none')}
                        onCreated={() => setGadgetView('none')}
                        darkMode={darkMode}
                    />
                </div>
            )}

            {/* Dynamic UI */}
            {dynamicUI && (
                <div className="px-4 pb-6 animate-in slide-in-from-bottom-4 duration-500">
                    <DynamicUI
                        surface={dynamicUI}
                        onClose={() => setDynamicUI(null)}
                        onAction={handleUIAction}
                    />
                </div>
            )}
        </div>
    );
}
