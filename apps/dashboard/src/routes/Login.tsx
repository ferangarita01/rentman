import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoSVG from '../components/LogoSVG';
import { supabase } from '../lib/supabase';

// Fix: Defining an alias for the 'iconify-icon' custom element
const IconifyIcon = 'iconify-icon' as any;

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);

    // WebMCP: Use ref to inject non-standard attributes without React warnings
    const loginFormRef = useRef<HTMLFormElement>(null);
    const resetFormRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (loginFormRef.current) {
            loginFormRef.current.setAttribute('toolname', 'agent_login');
            loginFormRef.current.setAttribute('tooldescription', 'Log in to the Rentman Dashboard');
            loginFormRef.current.setAttribute('toolautosubmit', 'true');
        }
        if (resetFormRef.current) {
            resetFormRef.current.setAttribute('toolname', 'reset_password');
            resetFormRef.current.setAttribute('tooldescription', 'Request a password reset link');
            resetFormRef.current.setAttribute('toolautosubmit', 'true');
        }
    }, [showForgotPassword]); // Re-run when view changes

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setLoading(false);
            navigate('/dashboard');
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setResetSuccess(true);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00ff88] opacity-[0.03] blur-[150px] rounded-full pointer-events-none"></div>

            <div className="w-full max-w-sm p-8 relative z-10">
                <div className="text-center mb-10">
                    <div className="w-12 h-12 mx-auto mb-6 text-white cursor-pointer" onClick={() => navigate('/')}>
                        <LogoSVG type="icon" />
                    </div>
                    <h2 className="font-mono text-2xl text-white tracking-tight uppercase">
                        {showForgotPassword ? 'Reset Access Key' : 'Access Console'}
                    </h2>
                    <p className="font-mono text-[10px] text-slate-500 mt-2 uppercase tracking-widest">
                        {showForgotPassword ? 'Enter your ID to receive reset instructions' : 'Restricted Area. Authorized Personnel Only.'}
                    </p>
                </div>

                {!showForgotPassword ? (
                    <>
                        <form ref={loginFormRef} onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block font-mono text-[9px] text-[#00ff88] uppercase tracking-widest">Operator / Client ID</label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-white/10 text-white text-sm font-mono px-4 py-3 pl-10 rounded focus:border-[#00ff88] focus:shadow-[0_0_15px_rgba(0,255,136,0.1)] outline-none transition-all"
                                        placeholder="ID_NUMBER"
                                        required
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#00ff88] transition-colors">
                                        <IconifyIcon icon="solar:user-circle-linear" width="18"></IconifyIcon>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block font-mono text-[9px] text-[#00ff88] uppercase tracking-widest">Access Key</label>
                                <div className="relative group">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-white/10 text-white text-sm font-mono px-4 py-3 pl-10 rounded focus:border-[#00ff88] focus:shadow-[0_0_15px_rgba(0,255,136,0.1)] outline-none transition-all"
                                        placeholder="••••••••••••"
                                        required
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#00ff88] transition-colors">
                                        <IconifyIcon icon="solar:key-linear" width="18"></IconifyIcon>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-xs font-mono text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#00ff88] text-black font-mono text-xs font-bold uppercase py-4 rounded hover:bg-[#33ff99] hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <IconifyIcon icon="svg-spinners:ring-resize" width="18"></IconifyIcon>
                                        Authenticating...
                                    </>
                                ) : (
                                    'Initialize Session'
                                )}
                            </button>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-white/10"></div>
                                <span className="flex-shrink-0 mx-4 text-xs text-slate-500 font-mono uppercase">Or</span>
                                <div className="flex-grow border-t border-white/10"></div>
                            </div>

                            <button
                                type="button"
                                onClick={async () => {
                                    setLoading(true);
                                    const { error } = await supabase.auth.signInWithOAuth({
                                        provider: 'google',
                                        options: {
                                            redirectTo: `${window.location.origin}/dashboard`
                                        }
                                    });
                                    if (error) {
                                        setError(error.message);
                                        setLoading(false);
                                    }
                                }}
                                disabled={loading}
                                className="w-full bg-white/5 border border-white/10 text-white font-mono text-xs font-bold uppercase py-4 rounded hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            >
                                <IconifyIcon icon="logos:google-icon" width="18"></IconifyIcon>
                                Access with Google
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => {
                                    setShowForgotPassword(true);
                                    setError(null);
                                }}
                                className="font-mono text-[9px] text-slate-600 uppercase hover:text-[#00ff88] transition-colors"
                            >
                                Lost Access Key?
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {!resetSuccess ? (
                            <form ref={resetFormRef} onSubmit={handlePasswordReset} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block font-mono text-[9px] text-[#00ff88] uppercase tracking-widest">Your ID (Email)</label>
                                    <div className="relative group">
                                        <input
                                            type="email"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            className="w-full bg-[#0a0a0a] border border-white/10 text-white text-sm font-mono px-4 py-3 pl-10 rounded focus:border-[#00ff88] focus:shadow-[0_0_15px_rgba(0,255,136,0.1)] outline-none transition-all"
                                            placeholder="operator@example.com"
                                            required
                                        />
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#00ff88] transition-colors">
                                            <IconifyIcon icon="solar:letter-linear" width="18"></IconifyIcon>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-xs font-mono text-center">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#00ff88] text-black font-mono text-xs font-bold uppercase py-4 rounded hover:bg-[#33ff99] hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <IconifyIcon icon="svg-spinners:ring-resize" width="18"></IconifyIcon>
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="p-6 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded text-center space-y-3">
                                <IconifyIcon icon="solar:check-circle-bold" className="text-[#00ff88] text-4xl mx-auto"></IconifyIcon>
                                <h3 className="text-white font-mono text-sm uppercase">Reset Link Sent</h3>
                                <p className="text-slate-400 text-xs font-mono leading-relaxed">
                                    Check your email for password reset instructions. The link will expire in 1 hour.
                                </p>
                            </div>
                        )}

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => {
                                    setShowForgotPassword(false);
                                    setResetSuccess(false);
                                    setResetEmail('');
                                    setError(null);
                                }}
                                className="font-mono text-[9px] text-slate-600 uppercase hover:text-[#00ff88] transition-colors"
                            >
                                Back to Login
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;
