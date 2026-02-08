'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTaskById, acceptTask, Task, supabase } from '@/lib/supabase-client';
import {
    ChevronLeft,
    Radio,
    Bot,
    Terminal,
    ShieldCheck,
    Fingerprint,
    MapPin,
    Unlock,
    CheckCircle,
    Loader2
} from 'lucide-react';

function ContractDetailsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const contractId = searchParams.get('id');

    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        if (contractId) {
            checkUser();
            loadTask();
        }
    }, [contractId]);

    async function checkUser() {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
    }

    async function loadTask() {
        if (!contractId) return;
        const { data, error } = await getTaskById(contractId);
        if (error) {
            console.error('❌ Error loading contract:', error);
        } else {
            setTask(data);
        }
        setLoading(false);
    }

    async function handleAcceptContract() {
        if (!userId) {
            alert('You must be logged in to accept contracts');
            return;
        }
        if (!task) return;

        setAccepting(true);
        const { data, error } = await acceptTask(task.id, userId);

        if (error) {
            alert('Error accepting contract: ' + error.message);
        } else {
            alert('Contract accepted successfully! 🎉');
            router.push('/');
        }
        setAccepting(false);
    }

    // Reuse page styles
    const styles = {
        scanline: {
            background: 'linear-gradient(to bottom, transparent 50%, rgba(0, 255, 136, 0.05) 50%)',
            backgroundSize: '100% 4px',
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#00ff88] animate-spin mx-auto mb-4" />
                    <p className="text-white font-mono tracking-widest">LOADING DATA...</p>
                </div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <p className="text-white font-mono mb-6">CONTRACT NOT FOUND</p>
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-[#00ff88] text-black font-mono font-bold uppercase rounded hover:bg-[#00cc6d] transition-colors">
                        Return to Base
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-[430px] mx-auto bg-[#050505] text-white font-sans selection:bg-[#00ff88]/30">
            {/* Global Scanline Effect */}
            <div className="fixed inset-0 pointer-events-none z-0" style={styles.scanline}></div>

            {/* Top App Bar */}
            <header className="flex items-center bg-[#050505]/80 backdrop-blur-md sticky top-0 z-10 p-4 border-b border-[#333333] space-x-4">
                <button
                    onClick={() => router.back()}
                    className="text-white hover:text-[#00ff88] transition-colors flex items-center justify-center">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex-1">
                    <p className="text-[10px] text-[#00ff88] font-mono uppercase tracking-[0.2em]">Deployment Auth</p>
                    <h2 className="text-white text-lg font-mono font-bold leading-tight tracking-tight uppercase">
                        CONTRACT_ID: #{task.id.slice(0, 4)}
                    </h2>
                </div>
                <Radio className="w-5 h-5 text-[#00ff88]/50 animate-pulse" />
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 space-y-6 pb-32 z-1 relative">
                {/* Hero Badge */}
                <div className="border border-[#00ff88]/20 bg-[#00ff88]/5 p-4 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <Bot className="w-5 h-5 text-[#00ff88]" />
                        <span className="text-xs font-mono text-[#00ff88]/80 tracking-widest uppercase">Mission Objective</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2 uppercase">{task.title}</h1>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        {task.description}
                    </p>
                </div>

                {/* Technical Specs Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#333333] pb-2">
                        <Terminal className="w-4 h-4 text-[#00ff88]" />
                        <h3 className="text-[#00ff88] text-sm font-mono font-bold tracking-widest uppercase">TECHNICAL SPECS</h3>
                    </div>
                    <div className="bg-[#1a1a1a]/40 border border-[#333333] rounded-lg overflow-hidden">
                        <div className="grid divide-y divide-[#333333]">
                            {task.required_skills && task.required_skills.length > 0 ? (
                                task.required_skills.map((skill, index) => (
                                    <div key={index} className="flex items-center gap-3 p-4">
                                        <div className="h-4 w-4 rounded-sm border border-[#00ff88]/50 flex items-center justify-center">
                                            <div className="w-2 h-2 bg-[#00ff88]"></div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-mono text-gray-500 uppercase">Constraint 0{index + 1}</span>
                                            <p className="text-white font-mono text-sm uppercase">{skill}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-gray-500 font-mono text-sm">NO CONSTRAINTS SPECIFIED</div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Issuer Signature */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#333333] pb-2">
                        <ShieldCheck className="w-4 h-4 text-[#00ff88]" />
                        <h3 className="text-[#00ff88] text-sm font-mono font-bold tracking-widest uppercase">ISSUER SIGNATURE</h3>
                    </div>
                    <div className="flex items-center gap-4 bg-[#1a1a1a]/60 p-4 border border-[#333333] rounded-lg relative overflow-hidden">
                        <div className="text-[#00ff88] flex items-center justify-center rounded border border-[#00ff88]/30 bg-[#00ff88]/10 shrink-0 size-12 shadow-[0_0_10px_rgba(0,255,136,0.15)]">
                            <Fingerprint className="w-8 h-8" />
                        </div>
                        <div className="flex flex-col justify-center flex-1">
                            <p className="text-white font-mono text-sm tracking-tight">Hash: 0x{task.id.slice(0, 4)}...{task.id.slice(-4)}</p>
                            <p className="text-gray-500 text-xs font-mono mt-1">Verified AI Issuer: RENTMAN_CORE_v2</p>
                        </div>
                        <div className="absolute right-0 top-0 h-full w-1 bg-[#00ff88]"></div>
                    </div>
                </section>

                {/* Map Placeholder */}
                <div className="w-full h-32 rounded-lg border border-[#333333] bg-[#1a1a1a] overflow-hidden relative group">
                    {/* Simplified map pattern background */}
                    <div className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: 'radial-gradient(#00ff88 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent"></div>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#00ff88]" />
                        <span className="text-[10px] font-mono text-[#00ff88] uppercase">
                            {task.location_address || 'Sector 7-G / Unknown District'}
                        </span>
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded border border-[#00ff88]/20">
                        <span className="text-[8px] font-mono text-white/70 uppercase">Distance: 1.2km</span>
                    </div>
                </div>
            </main>

            {/* Fixed Action Button */}
            <footer className="p-4 pt-0 bg-[#050505]/95 backdrop-blur-md sticky bottom-0 z-20 border-t border-[#333333]/50">
                <div className="pt-4">
                    <button
                        onClick={handleAcceptContract}
                        disabled={accepting || task.status !== 'open'}
                        className="w-full bg-[#00ff88] py-4 rounded-lg flex items-center justify-center gap-3 active:scale-95 transition-transform hover:shadow-[0_0_15px_rgba(0,255,136,0.4)] disabled:opacity-50 disabled:grayscale disabled:shadow-none"
                    >
                        {accepting ? (
                            <Loader2 className="w-5 h-5 text-black animate-spin" />
                        ) : task.status === 'open' ? (
                            <Unlock className="w-5 h-5 text-black font-bold" />
                        ) : (
                            <CheckCircle className="w-5 h-5 text-black font-bold" />
                        )}
                        <span className="text-black font-sans font-bold text-lg tracking-widest uppercase">
                            {accepting ? 'PROCESSING...' : task.status === 'open' ? 'ACCEPT CONTRACT' : 'ALREADY ASSIGNED'}
                        </span>
                    </button>
                    <div className="mt-4 flex justify-between items-center px-2">
                        <div className="flex flex-col">
                            <p className="text-[10px] text-gray-500 font-mono uppercase">Payout</p>
                            <p className="text-white font-mono font-bold text-sm">
                                {task.budget_amount} {task.budget_currency}
                            </p>
                        </div>
                        <div className="flex flex-col items-end">
                            <p className="text-[10px] text-gray-500 font-mono uppercase">ETA to Start</p>
                            <p className="text-white font-mono font-bold text-sm">IMMEDIATE</p>
                        </div>
                    </div>
                    {/* iOS Safe Area Padding if needed, though usually handled by safe-area-inset */}
                    <div className="h-4"></div>
                </div>
            </footer>
        </div>
    );
}

export default function ContractPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00ff88] border-t-transparent"></div>
            </div>
        }>
            <ContractDetailsContent />
        </Suspense>
    );
}
