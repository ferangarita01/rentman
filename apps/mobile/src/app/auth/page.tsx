'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { config } from '@/lib/config';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Browser } from '@capacitor/browser';
import { App as CapacitorApp } from '@capacitor/app';
import { trackAuthEvent, trackPageView } from '@/lib/analytics';

export default function AuthPage() {
    const [operatorId, setOperatorId] = useState('');
    const [accessKey, setAccessKey] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const router = useRouter();

    useEffect(() => {
        trackPageView('/auth', 'Authentication');

        trackPageView('/auth', 'Authentication');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let listenerHandle: any;
        const setupDeepLinkListener = async () => {
            listenerHandle = await CapacitorApp.addListener('appUrlOpen', async (data) => {
                if (process.env.NODE_ENV === 'development') {
                    console.log('DEEP_LINK_OPEN:', data.url);
                }
                const url = new URL(data.url);
                const hash = url.hash;
                if (hash && hash.includes('access_token')) {
                    const hashParams = new URLSearchParams(hash.substring(1));
                    const accessToken = hashParams.get('access_token');
                    const refreshToken = hashParams.get('refresh_token');
                    if (accessToken && refreshToken) {
                        const { data: { session } } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });
                        if (session) {
                            await Browser.close();
                            router.push('/');
                        }
                    }
                }
            });
        };
        setupDeepLinkListener();
        return () => {
            if (listenerHandle) listenerHandle.remove();
        };
    }, [router]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleGoogleLogin = async () => {
        setLoading(true);
        trackAuthEvent('login', 'google');
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const isCapacitor = typeof (window as any).Capacitor !== 'undefined';
            if (isCapacitor) {
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: 'com.rentman.app://auth/callback',
                        skipBrowserRedirect: true,
                    },
                });
                if (error) throw error;
                if (data.url) await Browser.open({ url: data.url, windowName: '_self' });
            } else {
                await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: `${window.location.origin}/auth/callback` },
                });
            }
        } catch (error) {
            const err = error as Error;
            trackAuthEvent('login_failed', 'google', { error: err.message });
            if (process.env.NODE_ENV === 'development') {
                console.error('GOOGLE_AUTH_ERROR:', err);
            }
            toast.error(err.message);
            setLoading(false);
        }
    };

    const handleInitializeSession = async () => {
        setLoading(true);
        try {
            if (mode === 'signup') {
                trackAuthEvent('signup', 'email');
                const { error } = await supabase.auth.signUp({
                    email: operatorId,
                    password: accessKey,
                    options: {
                        emailRedirectTo: 'com.rentman.app://auth/callback'
                    }
                });
                if (error) throw error;
                toast.success('Operator registered. Check comms link (email).');
            } else {
                trackAuthEvent('login', 'email');
                const { error, data } = await supabase.auth.signInWithPassword({
                    email: operatorId,
                    password: accessKey,
                });
                if (error) throw error;

                if (process.env.NODE_ENV === 'development') {
                    console.log('✅ Login successful:', data.user?.email);
                }
                toast.success('Access Granted');
                // Navigate to home screen
                router.push('/');
                setLoading(false);
            }
        } catch (error) {
            const err = error as Error;
            trackAuthEvent('login_failed', 'email', { error: err.message });
            if (process.env.NODE_ENV === 'development') {
                console.error('Auth error:', err.message);
            }
            toast.error(`Access Denied: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Constant Styles from user snippet
    const PRIMARY_COLOR = '#00ff55';
    const BG_DARK_COLOR = '#050505';
    const TERMINAL_SLATE = '#94a3b8';
    const TERMINAL_BORDER = '#1a2e21';
    const SHADOW_NEON = '0 0 15px rgba(0, 255, 85, 0.4), 0 0 5px rgba(0, 255, 85, 0.2)';

    return (
        // EXACT HTML STRUCTURE MAPPED TO JSX
        <div className="font-display bg-background-dark overflow-hidden" style={{ backgroundColor: BG_DARK_COLOR, fontFamily: '"Space Grotesk", sans-serif', color: 'white', minHeight: '100vh', position: 'relative' }}>

            {/* Scanline */}
            <div className="scanline" style={{
                width: '100%', height: '2px', background: 'rgba(0, 255, 85, 0.05)', position: 'fixed', top: 0, left: 0, zIndex: 50, pointerEvents: 'none', boxShadow: '0 0 10px rgba(0, 255, 85, 0.1)'
            }}></div>

            {/* CRT Overlay */}
            <div className="crt-overlay" style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.02), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.02))',
                backgroundSize: '100% 3px, 3px 100%', pointerEvents: 'none', zIndex: 40
            }}></div>

            <div className="relative flex h-screen w-full flex-col p-6 overflow-hidden" style={{ backgroundColor: BG_DARK_COLOR }}>

                {/* Header Status Bar */}
                <div className="flex items-start justify-between mb-12 pt-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2" style={{ color: PRIMARY_COLOR }}>
                            <span className="material-symbols-outlined text-sm">terminal</span>
                            <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase">Rentman_</h2>
                        </div>
                        <p className="text-[9px] mt-1 font-medium tracking-widest" style={{ color: TERMINAL_SLATE }}>KERNEL_HASH: 0x88AF22</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                            <div className="size-1.5 rounded-full" style={{ backgroundColor: PRIMARY_COLOR, boxShadow: '0 0 5px #00ff55', width: '6px', height: '6px' }}></div>
                            <p className="text-[10px] font-bold tracking-widest" style={{ color: PRIMARY_COLOR }}>NODE_ONLINE</p>
                        </div>
                        <p className="text-[9px] mt-1 font-medium tracking-widest" style={{ color: TERMINAL_SLATE }}>LATENCY: 12ms</p>
                    </div>
                </div>

                {/* Main Authentication Module */}
                <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                    <div className="mb-10 text-center">
                        <h1 className="text-white text-xl font-bold tracking-[0.3em] uppercase mb-2">
                            {mode === 'signin' ? 'System Authentication' : 'Operator Registration'}
                        </h1>
                        <div className="flex items-center justify-center gap-2">
                            <span className="h-[1px] w-8" style={{ backgroundColor: 'rgba(0, 255, 85, 0.3)' }}></span>
                            <p className="text-[10px] tracking-[0.4em] font-medium" style={{ color: 'rgba(0, 255, 85, 0.7)' }}>IDENTIFY_PROMPT</p>
                            <span className="h-[1px] w-8" style={{ backgroundColor: 'rgba(0, 255, 85, 0.3)' }}></span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Operator ID Input */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold tracking-[0.2em] uppercase px-1" style={{ color: TERMINAL_SLATE }}>Operator_ID</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg leading-none" style={{ color: PRIMARY_COLOR }}>&gt;</div>
                                <input
                                    className="w-full text-white pl-10 pr-4 h-14 rounded-sm transition-all focus:ring-0 outline-none"
                                    placeholder="Email or ID"
                                    type="email"
                                    value={operatorId}
                                    onChange={(e) => setOperatorId(e.target.value)}
                                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', borderColor: TERMINAL_BORDER, borderWidth: '1px' }}
                                />
                            </div>
                        </div>

                        {/* Access Key Input */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold tracking-[0.2em] uppercase px-1" style={{ color: TERMINAL_SLATE }}>Access_Key</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg leading-none" style={{ color: PRIMARY_COLOR }}>&gt;</div>
                                <input
                                    className="w-full text-white pl-10 pr-12 h-14 rounded-sm transition-all focus:ring-0 outline-none"
                                    placeholder="••••••••••••"
                                    type={showPassword ? "text" : "password"}
                                    value={accessKey}
                                    onChange={(e) => setAccessKey(e.target.value)}
                                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', borderColor: TERMINAL_BORDER, borderWidth: '1px' }}
                                />
                                <button
                                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                                    style={{ color: TERMINAL_SLATE }}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility' : 'visibility_off'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="pt-4">
                            <button
                                className="w-full font-bold text-sm tracking-[0.2em] h-14 rounded-sm active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                onClick={handleInitializeSession}
                                disabled={loading}
                                style={{ backgroundColor: PRIMARY_COLOR, color: BG_DARK_COLOR, boxShadow: SHADOW_NEON }}
                            >
                                {loading ? 'INITIALIZING...' : 'INITIALIZE SESSION'}
                                <span className="material-symbols-outlined text-sm">bolt</span>
                            </button>

                            {/* Google Sign-In Button */}
                            <button
                                className="w-full font-bold text-sm tracking-[0.2em] h-14 rounded-sm active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4 border border-white/20 hover:bg-white/5"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                style={{ color: 'white' }}
                            >
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                                ACCESS_WITH_GOOGLE
                            </button>
                        </div>

                        <div className="flex justify-between items-center px-1">
                            <button
                                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                                className="text-[10px] tracking-widest uppercase transition-colors"
                                style={{ color: TERMINAL_SLATE }}
                            >
                                {mode === 'signin' ? 'Register_Operator' : 'Return_To_Login'}
                            </button>
                            <a className="text-[10px] tracking-widest uppercase transition-colors" href="#" style={{ color: TERMINAL_SLATE }}>Recover_Access</a>
                        </div>

                        {/* DEBUG: Network Test */}
                        <button
                            onClick={async () => {
                                try {
                                    const start = Date.now();
                                    const res = await fetch(`${config.supabase.url}/auth/v1/health`);
                                    const ms = Date.now() - start;
                                    toast.success(`Ping: ${ms}ms | Status: ${res.status}`);
                                } catch (e) {
                                    const err = e as Error;
                                    toast.error(`Net Error: ${err.name} - ${err.message}`);
                                }
                            }}
                            className="w-full mt-4 text-[8px] opacity-30 hover:opacity-100"
                        >
                            [ TEST NETWORK CONNECTIVITY ]
                        </button>
                    </div>
                </div>

                {/* Boot Log Section */}
                <div className="mt-auto pb-8">
                    <div className="border-t pt-6 space-y-1.5" style={{ borderColor: 'rgba(26, 46, 33, 0.5)' }}>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold font-mono" style={{ color: PRIMARY_COLOR }}>08:22:11</span>
                            <p className="text-[10px] font-medium tracking-wide" style={{ color: TERMINAL_SLATE }}>&gt; CONNECTING_TO_GLOBAL_NODE_7...</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold font-mono" style={{ color: PRIMARY_COLOR }}>08:22:12</span>
                            <p className="text-[10px] font-medium tracking-wide" style={{ color: TERMINAL_SLATE }}>&gt; DECRYPTING_HANDSHAKE_LAYERS...</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold font-mono" style={{ color: PRIMARY_COLOR }}>08:22:14</span>
                            <p className="text-[10px] font-medium tracking-wide" style={{ color: TERMINAL_SLATE }}>&gt; ESTABLISHING_SECURE_TUNNEL... [OK]</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold font-mono" style={{ color: PRIMARY_COLOR }}>08:22:15</span>
                            <p className="text-[10px] text-white font-medium tracking-wide uppercase flex items-center">
                                &gt; Waiting for operator input
                                <span className="blinking-cursor" style={{ display: 'inline-block', width: '8px', height: '1.2em', backgroundColor: PRIMARY_COLOR, marginLeft: '4px', verticalAlign: 'middle' }}></span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Decorative Background Element */}
                <div className="absolute -bottom-24 -left-24 size-64 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: 'rgba(0, 255, 85, 0.05)', width: '256px', height: '256px' }}></div>
                <div className="absolute -top-24 -right-24 size-64 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: 'rgba(0, 255, 85, 0.05)', width: '256px', height: '256px' }}></div>
            </div>
        </div>
    );
}
