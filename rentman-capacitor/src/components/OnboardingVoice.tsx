'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSarah } from '@/contexts/SarahContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Bot, Sparkles, Mic, Volume2 } from 'lucide-react';
import SmartAvatar from './SmartAvatar';

export default function OnboardingVoice() {
    const { isDark } = useTheme();
    const router = useRouter();
    const { user } = useAuth();

    // Use Global Context
    const {
        isActive,
        setIsActive,
        isListening,
        isSpeaking,
        agentResponse,
        disconnect,
        setIsFullPageMode,
        setMode
    } = useSarah();

    const [fadeOut, setFadeOut] = useState(false);
    const [isBooting, setIsBooting] = useState(true);
    const [showUserAvatar, setShowUserAvatar] = useState(false);

    // Initialize Onboarding Mode
    useEffect(() => {
        if (!user) return;

        console.log('✨ [Onboarding] Starting Reboot Sequence');

        // Boot Sequence Animation
        setTimeout(() => setIsBooting(false), 2000);

        setMode('onboarding');
        setIsFullPageMode(true);
        setIsActive(true);

        return () => {
            // 🛡️ CRITICAL: Reset mode if user navigates away manually (e.g. Back button)
            console.log('🛡️ [Onboarding] Cleanup: Resetting mode to normal');
            setMode('normal');
            setIsFullPageMode(false);
            // Don't turn off Sarah (setIsActive) so she remains available
        };
    }, [user, setMode, setIsActive, setIsFullPageMode]);

    // Listen for Completion Event from Backend (Sarah decides when done)
    useEffect(() => {
        const handleCompletion = () => {
            console.log('🎉 [Onboarding] Goal Set! Revealing Avatar...');
            setShowUserAvatar(true);

            // Allow user to admire avatar for a moment before redirecting
            setTimeout(() => {
                setFadeOut(true);
                setTimeout(() => {
                    disconnect();
                    setIsFullPageMode(false);
                    setMode('normal');
                    router.replace('/');
                }, 1500); // Fade out duration
            }, 4000); // Admiration duration
        };

        window.addEventListener('onboarding_complete', handleCompletion);
        return () => window.removeEventListener('onboarding_complete', handleCompletion);
    }, [router, disconnect, setIsFullPageMode, setMode]);

    if (!user) return null;

    return (
        <div className={`
            fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-all duration-1000
            ${fadeOut ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}
            bg-black text-white
        `}>
            {/* 🌌 Deep Space Background */}
            <div className="absolute inset-0 z-0">
                {/* CSS Stars/Space Effect could go here, using simple gradients for now */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black"></div>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] animate-pulse duration-[4000ms]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] animate-pulse duration-[7000ms]"></div>
            </div>

            {/* 🖥️ Boot Sequence Overlay */}
            {isBooting && (
                <div className="absolute inset-0 z-50 bg-black flex items-center justify-center font-mono text-green-500 text-xs md:text-sm p-10">
                    <div className="max-w-md w-full space-y-1">
                        <p className="typing-effect">Initializing SarahOS v2.0...</p>
                        <p className="typing-effect delay-100">Loading Neuro-Link...</p>
                        <p className="typing-effect delay-200">Connecting to Neural Engine...</p>
                        <p className="typing-effect delay-500 text-white">System Ready.</p>
                    </div>
                </div>
            )}

            {/* 🤖 Main Interface */}
            <div className={`relative z-10 flex flex-col items-center gap-12 max-w-lg w-full text-center transition-opacity duration-1000 ${isBooting ? 'opacity-0' : 'opacity-100'}`}>

                {/* 1. Sarah (The Robot) */}
                <div className="relative">
                    {/* Living Breath Glow */}
                    <div className={`
                        absolute inset-0 rounded-full blur-2xl transition-all duration-300
                        ${isSpeaking ? 'bg-cyan-500/50 scale-125' : isListening ? 'bg-purple-500/50 scale-110' : 'bg-cyan-500/20 scale-100'}
                    `}></div>

                    <div className="relative w-40 h-40">
                        {/* We use DiceBear Bottts for Sarah */}
                        <img
                            src="https://api.dicebear.com/9.x/bottts/svg?seed=Sarah&backgroundColor=transparent"
                            alt="Sarah AI"
                            className={`w-full h-full drop-shadow-2xl transition-transform duration-300 ${isSpeaking ? 'scale-105' : 'scale-100'}`}
                        />
                        {/* Status Indicator */}
                        <div className={`
                            absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md
                            ${isListening ? 'bg-purple-500/20 text-purple-200' : 'bg-cyan-500/20 text-cyan-200'}
                        `}>
                            {isListening ? <Mic className="w-3 h-3 animate-pulse" /> : <Volume2 className="w-3 h-3" />}
                            <span className="text-xs font-bold tracking-widest uppercase">
                                {isListening ? 'LISTENING' : isSpeaking ? 'SPEAKING' : 'ONLINE'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Dialogue / Viz */}
                <div className="space-y-6 px-6">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                        Hello, {user.user_metadata?.name?.split(' ')[0] || 'Human'}.
                    </h1>

                    <div className="min-h-[80px] flex items-center justify-center">
                        {agentResponse ? (
                            <p className="text-xl md:text-2xl font-light leading-relaxed text-gray-200 animate-in fade-in slide-in-from-bottom-2">
                                "{agentResponse}"
                            </p>
                        ) : (
                            <div className="flex gap-1 h-8 items-center">
                                {/* Waiting Viz */}
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-0"></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300"></span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. The Big Reveal: User Avatar */}
                {showUserAvatar && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-1000">
                        <div className="relative animate-in zoom-in-50 duration-700 slide-in-from-bottom-10">
                            <div className="absolute -inset-10 bg-amber-500/30 rounded-full blur-3xl animate-pulse"></div>
                            <Sparkles className="absolute -top-8 -right-8 w-12 h-12 text-yellow-400 animate-spin-slow" />

                            <SmartAvatar
                                seed={user.id}
                                level={1}
                                className="w-48 h-48 drop-shadow-[0_0_50px_rgba(251,191,36,0.5)]"
                            />

                            <div className="mt-8 text-center space-y-2">
                                <h2 className="text-3xl font-bold text-white">Avatar Initiated</h2>
                                <p className="text-gray-400">Level 1 • Novice</p>
                                <p className="text-sm text-amber-300 font-mono mt-4">COMPLETE HABITS TO EVOLVE</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Hint */}
            <div className="absolute bottom-8 text-gray-500 text-xs uppercase tracking-[0.2em] animate-pulse">
                Zero Tap Interface Active
            </div>
        </div>
    );
}


