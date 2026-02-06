import React, { useState } from 'react';
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

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00ff88] opacity-[0.03] blur-[150px] rounded-full pointer-events-none"></div>

            <div className="w-full max-w-sm p-8 relative z-10">
                <div className="text-center mb-10">
                    <div className="w-12 h-12 mx-auto mb-6 text-white cursor-pointer" onClick={() => navigate('/')}>
                        <LogoSVG type="block" />
                    </div>
                    <h2 className="font-mono text-2xl text-white tracking-tight uppercase">Access Console</h2>
                    <p className="font-mono text-[10px] text-slate-500 mt-2 uppercase tracking-widest">Restricted Area. Authorized Personnel Only.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
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
                                {/* Fix: Using IconifyIcon alias */}
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
                                {/* Fix: Using IconifyIcon alias */}
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
                </form>

                <div className="mt-8 text-center">
                    <a href="#" className="font-mono text-[9px] text-slate-600 uppercase hover:text-[#00ff88] transition-colors">Lost Access Key?</a>
                </div>
            </div>
        </div>
    );
};

export default Login;
