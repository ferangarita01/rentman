import React, { useState } from 'react';
import {
    ShieldCheck, Activity, Wifi, Cpu, Lock, Info as InfoIcon,
    CheckCircle, Share2, Zap, ChevronsRight, X, User, Database, Globe,
    Settings, Radio, Terminal
} from 'lucide-react';

interface Task {
    id: string;
    title: string;
    description: string;
    status: string;
    budget_amount: number;
    created_at: string;
    agent_id?: string;
    user_id?: string;
}

interface ContractAcceptanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
    onAccept: () => void;
    isProcessing: boolean;
}

const ContractAcceptanceModal: React.FC<ContractAcceptanceModalProps> = ({ isOpen, onClose, task, onAccept, isProcessing }) => {
    if (!isOpen || !task) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in duration-300">
            {/* Main Dossier Modal Container */}
            <div className="relative w-full max-w-6xl aspect-[16/10] md:aspect-auto md:h-[90vh] flex flex-col border border-white/10 rounded-lg bg-[#050505] overflow-hidden shadow-2xl glow-border">

                {/* Close Button (Added for usability) */}
                <button onClick={onClose} className="absolute top-4 right-4 z-50 text-white/40 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>

                {/* Background Effects */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: `
                        radial-gradient(circle at 50% 50%, rgba(0, 255, 136, 0.05) 0%, transparent 80%),
                        linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
                        linear-gradient(90deg, rgba(255, 0, 0, 0.02), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.02))
                    `,
                    backgroundSize: '100% 100%, 100% 4px, 100% 100%'
                }}></div>
                <div className="absolute top-0 left-0 w-full h-0.5 bg-[#00ff88]/10"></div> {/* Scanline simulation */}

                {/* Header Section */}
                <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#00ff88]/5 relative z-10">
                    <div className="flex items-center gap-4">
                        <ShieldCheck className="text-[#00ff88] w-8 h-8" />
                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold tracking-widest text-[#00ff88] font-mono">PROTOCOL_AUTH_V4.2</h1>
                            <span className="text-[10px] text-white/40 font-mono uppercase tracking-tighter">SECURE_HANDSHAKE_ESTABLISHED</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-8 mr-8"> {/* mr-8 for close button */}
                        <div className="text-right hidden md:block">
                            <p className="text-[10px] text-white/40 uppercase font-mono">Contract ID</p>
                            <p className="text-sm font-mono font-bold text-white">#{task.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <div className="h-8 w-px bg-white/10 hidden md:block"></div>
                        <div className="flex items-center gap-3">
                            <div className="size-2 rounded-full bg-[#00ff88] animate-pulse shadow-[0_0_8px_#00ff88]"></div>
                            <span className="text-xs font-bold tracking-widest text-white/80 font-mono">TERMINAL_ACTIVE</span>
                        </div>
                    </div>
                </header>

                {/* Main Body Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden relative z-10">

                    {/* Left Panel: Technical Specs */}
                    <aside className="hidden md:flex col-span-3 border-r border-white/10 p-6 flex-col gap-6 bg-white/[0.02]">
                        <div className="space-y-1">
                            <h3 className="text-[10px] font-bold text-[#00ff88] tracking-[0.2em] uppercase font-mono">System_Diagnostics</h3>
                            <div className="h-px w-full bg-gradient-to-r from-[#00ff88]/50 to-transparent"></div>
                        </div>
                        <div className="space-y-4">
                            {/* Spec Item */}
                            <div className="p-3 border border-white/5 rounded bg-white/[0.03] flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-mono text-white/60">LATENCY</span>
                                    <span className="text-[10px] font-bold text-[#00ff88] border border-[#00ff88]/30 px-1 rounded font-mono">OK</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-xl font-mono font-light text-white">12ms</span>
                                    <Activity className="text-[#00ff88] w-4 h-4" />
                                </div>
                            </div>
                            {/* Spec Item */}
                            <div className="p-3 border border-white/5 rounded bg-white/[0.03] flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-mono text-white/60">SIGNAL</span>
                                    <span className="text-[10px] font-bold text-[#00ff88] border border-[#00ff88]/30 px-1 rounded font-mono">OK</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-xl font-mono font-light uppercase tracking-tight text-white">Stable</span>
                                    <Wifi className="text-[#00ff88] w-4 h-4" />
                                </div>
                            </div>
                            {/* Spec Item */}
                            <div className="p-3 border border-white/5 rounded bg-white/[0.03] flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-mono text-white/60">NEURAL_LINK</span>
                                    <span className="text-[10px] font-bold text-[#00ff88] border border-[#00ff88]/30 px-1 rounded font-mono">OK</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-xl font-mono font-light uppercase tracking-tight text-white">Active</span>
                                    <Cpu className="text-[#00ff88] w-4 h-4" />
                                </div>
                            </div>
                            {/* Spec Item */}
                            <div className="p-3 border border-white/5 rounded bg-white/[0.03] flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-mono text-white/60">ENCRYPTION</span>
                                    <span className="text-[10px] font-bold text-[#00ff88] border border-[#00ff88]/30 px-1 rounded font-mono">OK</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-xl font-mono font-light uppercase tracking-tight text-white">AES-256</span>
                                    <Lock className="text-[#00ff88] w-4 h-4" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-auto">
                            <div className="p-4 border border-dashed border-white/20 rounded-lg">
                                <p className="text-[10px] font-mono text-white/40 leading-relaxed italic">
                                    All subsystems reporting nominal operation. Authorization ready for broadcast on local mesh.
                                </p>
                            </div>
                        </div>
                    </aside>

                    {/* Middle Section: Mission Briefing */}
                    <main className="col-span-12 md:col-span-6 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6 relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ff88]/20 to-transparent"></div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tighter uppercase text-white font-mono">{task.title}</h2>
                            <p className="text-[#00ff88]/80 font-mono text-xs tracking-widest uppercase">STABLE_ENCRYPTION_LAYER_V8.4</p>
                        </div>
                        <div className="flex-1 font-mono text-sm leading-relaxed text-white/80 space-y-6">
                            <div className="p-4 border-l-2 border-[#00ff88]/40 bg-white/[0.02]">
                                <p>
                                    <span className="text-[#00ff88] font-bold">[LOG_INIT]</span> {task.description}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="aspect-video bg-cover bg-center rounded border border-white/10 grayscale hover:grayscale-0 transition-all duration-500" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1518335520976-13d8d388914d?q=80&w=600&auto=format&fit=crop")' }}></div>
                                <div className="aspect-video bg-cover bg-center rounded border border-white/10" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop")' }}></div>
                            </div>
                            <p>
                                <span className="text-[#00ff88] font-bold">OBJECTIVE:</span> Establish a decentralized node network for real-time asset tracking and liability enforcement. By initiating this protocol, the operator accepts full responsibility for automated ledger reconciliations.
                            </p>
                            <ul className="space-y-2 text-xs">
                                <li className="flex gap-3 items-start">
                                    <span className="text-[#00ff88]">01.</span>
                                    <span>Deployment of persistent monitoring drones (Class IV)</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <span className="text-[#00ff88]">02.</span>
                                    <span>Integration with municipal smart-grid for energy auditing</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <span className="text-[#00ff88]">03.</span>
                                    <span>Biometric signature verification for all resident access points</span>
                                </li>
                            </ul>
                            <div className="flex items-center gap-2 p-2 bg-[#00ff88]/10 border border-[#00ff88]/20 text-[10px] tracking-tighter text-[#00ff88]">
                                <InfoIcon className="w-4 h-4" />
                                WARNING: DEPLOYMENT IS IRREVERSIBLE ONCE BROADCAST TO MAINNET.
                            </div>
                        </div>
                    </main>

                    {/* Right Panel: Issuer Dossier */}
                    <aside className="hidden md:flex col-span-3 border-l border-white/10 p-6 flex-col gap-8 bg-white/[0.01]">
                        <div className="space-y-1">
                            <h3 className="text-[10px] font-bold text-[#00ff88] tracking-[0.2em] uppercase font-mono">Issuer_Dossier</h3>
                            <div className="h-px w-full bg-gradient-to-r from-[#00ff88]/50 to-transparent"></div>
                        </div>
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="relative">
                                {/* Hexagonal border/frame for avatar */}
                                <div className="size-32 rounded-full border-2 border-[#00ff88]/30 p-1 flex items-center justify-center relative overflow-hidden">
                                    <div className="size-full rounded-full bg-cover bg-center grayscale contrast-125" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1531297461136-82lwDe83e916?q=80&w=300&auto=format&fit=crop")' }}></div>
                                    <div className="absolute inset-0 bg-[#00ff88]/10 mix-blend-overlay"></div>
                                </div>
                                {/* Status Badge */}
                                <div className="absolute bottom-1 right-1 size-6 bg-[#00ff88] rounded-full flex items-center justify-center border-4 border-[#050505]">
                                    <CheckCircle className="text-black w-[14px] h-[14px]" />
                                </div>
                            </div>
                            <div className="text-center">
                                <h4 className="text-lg font-bold tracking-tight text-white font-mono">AGENT_SENTINEL_7</h4>
                                <p className="text-[10px] font-mono text-white/40">AI_OPERATIONS_DIRECTORATE</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            {/* Trust Score */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-mono text-white/60">TRUST_LEVEL</span>
                                    <span className="text-sm font-mono text-[#00ff88]">98.4%</span>
                                </div>
                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#00ff88] w-[98.4%] shadow-[0_0_8px_#00ff88]"></div>
                                </div>
                            </div>
                            {/* Hash */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-mono text-white/60">AUTH_HASH</span>
                                <div className="p-3 bg-black border border-white/5 rounded font-mono text-[9px] break-all text-white/40 leading-tight">
                                    0x7a2d8e4f1b9c0d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8
                                </div>
                            </div>
                            {/* Verified Badge list */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="aspect-square rounded bg-white/[0.03] border border-white/5 flex items-center justify-center" title="Network Verified">
                                    <Share2 className="text-[#00ff88]/60 w-5 h-5" />
                                </div>
                                <div className="aspect-square rounded bg-white/[0.03] border border-white/5 flex items-center justify-center" title="Encrypted Agent">
                                    <Lock className="text-[#00ff88]/60 w-5 h-5" />
                                </div>
                                <div className="aspect-square rounded bg-white/[0.03] border border-white/5 flex items-center justify-center" title="High Latency Priority">
                                    <Zap className="text-[#00ff88]/60 w-5 h-5" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-auto space-y-2">
                            <p className="text-[9px] font-mono text-white/30 text-center">TIMESTAMP: {new Date().toISOString().replace('T', '_').split('.')[0]}_UTC</p>
                        </div>
                    </aside>
                </div>

                {/* Footer Action */}
                <footer className="p-8 border-t border-white/10 bg-black/40 flex items-center justify-center relative z-20">
                    {/* HUD decorative corners */}
                    <div className="absolute bottom-2 left-2 size-4 border-b-2 border-l-2 border-white/10"></div>
                    <div className="absolute bottom-2 right-2 size-4 border-b-2 border-r-2 border-white/10"></div>

                    <button
                        onClick={onAccept}
                        disabled={isProcessing}
                        className="group relative w-full max-w-2xl h-16 bg-[#00ff88] text-black font-black text-lg tracking-[0.2em] rounded-sm transition-all hover:scale-[1.01] hover:shadow-[0_0_40px_rgba(0,255,136,0.6)] active:scale-95 flex items-center justify-center gap-4 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {/* Glint effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                        {isProcessing ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></span>
                                ESTABLISHING_UPLINK...
                            </span>
                        ) : (
                            <>
                                <ChevronsRight className="font-bold w-6 h-6" />
                                INITIATE_ACCEPTANCE_PROTOCOL
                                <ChevronsRight className="font-bold w-6 h-6" />
                            </>
                        )}
                    </button>

                    {/* Budget Display Overlay or Next to Button? 
                        The original design didn't explicitly show budget in footer, but for us meaningful context is good.
                        I'll stick to the button being the main focus.
                    */}
                </footer>

                {/* HUD Decorative Overlays */}
                <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none z-10">
                    <span className="text-[8px] font-mono uppercase tracking-widest text-[#00ff88]">SECURE_DIVE_0012 // RECV</span>
                </div>
                <div className="absolute bottom-0 left-0 p-2 opacity-20 pointer-events-none z-10">
                    <span className="text-[8px] font-mono uppercase tracking-widest text-[#00ff88]">TERMINAL_REF: dossier_auth_{task.id.slice(0, 4)}</span>
                </div>
            </div>
        </div>
    );
};

export default ContractAcceptanceModal;
