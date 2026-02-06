'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Bot, Mail, Lock, Sparkles } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { App as CapacitorApp } from '@capacitor/app';

export default function AuthPage() {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // ⚡ PROFESSIONAL FIX: Handle deep link OAuth callback
    useEffect(() => {
        let listenerHandle: any;

        const setupDeepLinkListener = async () => {
            listenerHandle = await CapacitorApp.addListener('appUrlOpen', async (data) => {
                console.log('🔗 Deep link received:', data.url);

                // Extract hash from URL (Supabase returns #access_token=...)
                const url = new URL(data.url);
                const hash = url.hash;

                if (hash && hash.includes('access_token')) {
                    console.log('✅ OAuth token found in deep link');

                    // Parse tokens from hash fragment
                    const hashParams = new URLSearchParams(hash.substring(1));
                    const accessToken = hashParams.get('access_token');
                    const refreshToken = hashParams.get('refresh_token');

                    if (accessToken && refreshToken) {
                        // Set session with extracted tokens
                        const { data: { session }, error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });

                        if (session) {
                            console.log('✅ Session established from deep link');
                            // Close the browser first
                            await Browser.close();
                            router.push('/');
                        } else {
                            console.error('❌ Failed to establish session:', error);
                            toast.error('Failed to complete sign in');
                            await Browser.close();
                        }
                    } else {
                        console.error('❌ Missing tokens in hash');
                        toast.error('Failed to complete sign in');
                        await Browser.close();
                    }
                }
            });
        };

        setupDeepLinkListener();

        return () => {
            if (listenerHandle) {
                listenerHandle.remove();
            }
        };
    }, [router]);

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const isCapacitor = typeof (window as any).Capacitor !== 'undefined';

            if (isCapacitor) {
                // ⚡ PROFESSIONAL: Use native browser (not WebView)
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: 'com.sarah.habitcoach://auth/callback',
                        scopes: 'https://www.googleapis.com/auth/calendar',
                        queryParams: {
                            access_type: 'offline',
                            prompt: 'consent',
                        },
                        skipBrowserRedirect: true, // Don't auto-redirect in WebView
                    },
                });

                if (error) throw error;
                if (!data.url) throw new Error('No OAuth URL returned');

                // Open in NATIVE browser (not WebView)
                await Browser.open({
                    url: data.url,
                    windowName: '_self',
                    presentationStyle: 'popover',
                });
            } else {
                // Web browser flow
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: `${window.location.origin}/auth/callback`,
                        scopes: 'https://www.googleapis.com/auth/calendar',
                        queryParams: {
                            access_type: 'offline',
                            prompt: 'consent',
                        },
                    },
                });
                if (error) throw error;
            }
        } catch (error: any) {
            console.error('Google Auth Error:', error);
            toast.error(error.message || 'Failed to sign in with Google');
            setLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success('Account created! Check your email to confirm.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success('Welcome back!');
                router.push('/');
            }
        } catch (error) {
            let message = 'An unexpected error occurred';
            if (error instanceof Error) {
                message = error.message;
            }
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 selection:bg-purple-500 selection:text-white bg-gray-100 dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">

            <div className="w-full max-w-[380px] flex flex-col items-center">

                {/* Header Section */}
                <div className="flex flex-col items-center mb-8">
                    {/* Personalized Avatar */}
                    <div className="relative group cursor-default">
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>

                        {/* Icon Container */}
                        <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-purple-600 via-purple-500 to-fuchsia-400 border-4 border-white dark:border-white shadow-2xl transition-transform duration-300 group-hover:scale-105 flex items-center justify-center">
                            {/* Vector Icon */}
                            <Bot className="w-14 h-14 text-white drop-shadow-md" />

                            {/* Status Indicator (Online) */}
                            <div className="absolute bottom-1 right-1 w-7 h-7 bg-[#22c55e] border-[3px] border-white dark:border-black rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
                            </div>
                        </div>
                    </div>

                    {/* Titles */}
                    <div className="text-center mt-6 space-y-1">
                        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Sarah Coach</h1>
                        <p className="text-gray-500 dark:text-gray-300 text-base font-medium">Your brutally honest friend.</p>
                    </div>
                </div>

                {/* Main Card with Offset Shadow */}
                <div className="w-full relative">
                    {/* Offset Background (Shadow) */}
                    <div className="absolute inset-0 bg-black dark:bg-white rounded-[1.5rem] translate-x-2 translate-y-2 transition-colors duration-300"></div>

                    {/* Main Content Card */}
                    <div className="relative bg-white dark:bg-[#0a0a0a] border-2 border-black dark:border-white rounded-[1.5rem] p-6 flex flex-col gap-6 transition-colors duration-300">

                        {/* Toggle Switch */}
                        <div className="flex p-1 border border-black dark:border-white rounded-xl bg-gray-100 dark:bg-black transition-colors">
                            <button
                                onClick={() => setMode('signin')}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95 ${mode === 'signin'
                                    ? 'bg-[#a855f7] text-white shadow-lg shadow-purple-900/20'
                                    : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                Login
                            </button>
                            <button
                                onClick={() => setMode('signup')}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95 ${mode === 'signup'
                                    ? 'bg-[#a855f7] text-white shadow-lg shadow-purple-900/20'
                                    : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                Register
                            </button>
                        </div>

                        {/* Google Login Button */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="flex items-center gap-4 w-full">
                            <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
                            <span className="text-xs text-gray-400 font-medium">OR EMAIL</span>
                            <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
                        </div>

                        {/* Form */}
                        <form className="flex flex-col gap-5" onSubmit={handleAuth}>
                            {/* Email Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-900 dark:text-white ml-1 flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-gray-400" /> Email
                                </label>
                                <input
                                    type="email"
                                    placeholder="you@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-transparent border border-black dark:border-white rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                />
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-900 dark:text-white ml-1 flex items-center gap-2">
                                    <Lock className="w-3.5 h-3.5 text-gray-400" /> Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-transparent border border-black dark:border-white rounded-xl px-4 py-3 text-gray-900 dark:text-white tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                />
                            </div>

                            {/* Action Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-4 w-full bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>{mode === 'signin' ? 'Start Adventure' : 'Join the Challenge'}</span>
                                        <Sparkles className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer Quote */}
                        {mode === 'signin' && (
                            <div className="text-center px-2">
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                                    "Don't try to fool me with another new account." <span className="text-gray-700 dark:text-gray-500">— Sarah</span>
                                </p>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div >
    );
}

