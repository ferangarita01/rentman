import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoSVG from '../components/LogoSVG';

// Fix: Defining an alias for the 'iconify-icon' custom element
const IconifyIcon = 'iconify-icon' as any;

const Landing: React.FC = () => {
    const navigate = useNavigate();
    const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
    const [integrateSuccess, setIntegrateSuccess] = useState(false);

    const handleIntegrateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIntegrateSuccess(true);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-slate-400 selection:bg-[#00ff88] selection:text-black relative">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-white/5 bg-[#050505]/90">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="w-8 h-8"><LogoSVG type="icon" /></div>
                        <span className="mono-text text-sm font-bold text-white tracking-widest hidden sm:block">RENTMAN_</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 font-mono text-[10px] uppercase tracking-widest text-slate-400">
                        <a href="#demo" className="hover:text-white transition-colors">Documentation</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                        <a href="#" className="hover:text-white transition-colors">Status</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/login')} className="hidden sm:block font-mono text-[10px] uppercase tracking-widest hover:text-white transition-colors">Login</button>
                        <button
                            onClick={() => document.getElementById('integrateWrapper')?.scrollIntoView({ behavior: 'smooth' })}
                            className="group relative px-4 py-2 bg-[#00ff88] text-black font-mono text-[10px] uppercase font-bold rounded hover:bg-[#00cc6a] transition-all duration-300 shadow-[0_0_15px_rgba(0,255,136,0.2)]"
                        >
                            Start Integrating
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#00ff88] opacity-[0.02] blur-[120px] rounded-full pointer-events-none"></div>

                <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]"></span>
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-widest text-[#00ff88]">Human Execution Infrastructure for AI Systems</span>
                    </div>

                    <h1 className="font-mono text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight text-white mb-6 leading-tight">
                        Close the loop between AI<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 italic">and the real world.</span>
                    </h1>

                    <p className="font-light text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-4 leading-relaxed">
                        Rentman is an execution API that lets AI systems securely delegate real-world tasks to verified humans — on demand, with guarantees.
                    </p>
                    <p className="font-mono text-[10px] uppercase text-slate-500 max-w-2xl mx-auto mb-10 tracking-widest opacity-60">
                        When software hits a physical, legal, or trust barrier, Rentman completes the task and returns verified proof.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => document.getElementById('integrateWrapper')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto px-8 py-4 bg-[#00ff88] text-black font-mono text-xs uppercase font-bold rounded hover:bg-[#33ff99] hover:shadow-[0_0_25px_rgba(0,255,136,0.3)] transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            {/* Fix: Using IconifyIcon alias */}
                            <IconifyIcon icon="solar:code-linear" className="text-lg"></IconifyIcon>
                            Start Integrating
                        </button>
                        <button
                            onClick={() => setIsOperatorModalOpen(true)}
                            className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/10 text-white font-mono text-xs uppercase font-medium rounded hover:border-white/30 hover:bg-white/5 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            {/* Fix: Using IconifyIcon alias */}
                            <IconifyIcon icon="solar:user-id-linear" className="text-lg"></IconifyIcon>
                            Become an Operator
                        </button>
                    </div>

                    {/* Visualizer Link */}
                    <div className="mt-20 relative max-w-3xl mx-auto h-16 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center justify-between text-white/10 font-mono text-[9px] uppercase tracking-[0.5em] pointer-events-none">
                            <span>Digital</span>
                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full mx-4"></div>
                            <span>Physical</span>
                        </div>
                        <div className="relative z-10 flex items-center gap-4 bg-[#0a0a0a] border border-white/10 px-6 py-3 rounded-full shadow-2xl">
                            <span className="font-mono text-[10px] text-[#00ff88]">POST /v1/execution</span>
                            {/* Fix: Using IconifyIcon alias */}
                            <IconifyIcon icon="solar:arrow-right-linear" className="text-slate-500"></IconifyIcon>
                            <div className="flex -space-x-2">
                                <div className="w-6 h-6 rounded-full bg-slate-800 border border-[#0a0a0a] flex items-center justify-center">
                                    {/* Fix: Using IconifyIcon alias */}
                                    <IconifyIcon icon="solar:server-linear" className="text-[10px] text-slate-400"></IconifyIcon>
                                </div>
                                <div className="w-6 h-6 rounded-full bg-[#00ff88] border border-[#0a0a0a] flex items-center justify-center text-black z-10 shadow-[0_0_10px_#00ff88]">
                                    {/* Fix: Using IconifyIcon alias */}
                                    <IconifyIcon icon="solar:user-check-linear" className="text-[12px]"></IconifyIcon>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Demo Section */}
            <section id="demo" className="py-24 border-t border-white/5 bg-[#050505] relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-12">
                        <div>
                            <h2 className="font-mono text-2xl md:text-3xl text-white tracking-tight mb-2">From API Call to Verified Outcome</h2>
                            <p className="text-slate-500">Skip brittle automation. Delegate execution to the real world in minutes.</p>
                        </div>
                        <div className="mt-4 md:mt-0 px-3 py-1 bg-white/5 rounded border border-white/10">
                            <span className="font-mono text-[10px] text-[#00ff88] flex items-center gap-2 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse"></span>
                                Live Network
                            </span>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Code Side */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#00ff88]/20 to-blue-500/20 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <div className="relative rounded-xl bg-[#0a0a0a] border border-white/10 overflow-hidden shadow-2xl">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0f0f0f]">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                                    </div>
                                    <div className="font-mono text-[9px] text-slate-500">bash — 80x24</div>
                                </div>
                                <div className="p-6 overflow-x-auto scrollbar-hide">
                                    <pre className="font-mono text-xs leading-relaxed text-slate-300">
                                        <span className="text-purple-400">curl</span> -X POST https://api.rentman.io/v1/tasks \<br />
                                        -H <span className="text-[#00ff88]">'Authorization: Bearer sk_live_...'</span> \<br />
                                        -H <span className="text-[#00ff88]">'Content-Type: application/json'</span> \<br />
                                        -d '{`{`}
                                        <span className="text-blue-300">"task"</span>: <span className="text-[#00ff88]">"Verify property exterior color"</span>,
                                        <span className="text-blue-300">"location"</span>: {`{`}
                                        <span className="text-blue-300">"lat"</span>: 40.7128,
                                        <span className="text-blue-300">"lng"</span>: -74.0060
                                        {`}`},
                                        <span className="text-blue-300">"requirements"</span>: [
                                        <span className="text-[#00ff88]">"timestamped_photo"</span>,
                                        <span className="text-[#00ff88]">"gps_proof"</span>
                                        ],
                                        <span className="text-blue-300">"budget_usd"</span>: 15.00
                                        {`}`}'
                                    </pre>
                                </div>
                                <div className="px-6 pb-4 flex gap-2">
                                    <span className="text-[#00ff88] font-mono text-xs">➜</span>
                                    <span className="animate-pulse font-mono text-xs text-slate-500">_</span>
                                </div>
                            </div>
                        </div>

                        {/* Simulation Side (Phone) */}
                        <div className="relative flex justify-center">
                            <div className="relative w-[280px] h-[540px] bg-[#0a0a0a] border border-white/10 rounded-[40px] shadow-2xl p-4 overflow-hidden z-10">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-20"></div>
                                <div className="w-full h-full rounded-[32px] bg-[#111] relative overflow-hidden opacity-80"
                                    style={{ backgroundImage: 'radial-gradient(#222 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20">
                                        <svg className="w-full h-full stroke-white/5" viewBox="0 0 100 200">
                                            <path d="M20,0 V200 M50,0 V200 M80,0 V200 M0,50 H100 M0,100 H100 M0,150 H100" strokeWidth="0.5" fill="none"></path>
                                        </svg>
                                    </div>
                                    {/* Notification Animation */}
                                    <div className="absolute top-12 left-2 right-2 p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg animate-[slideDown_1s_ease-out_forwards]">
                                        <div className="flex items-start gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-black/50 flex items-center justify-center text-sm">🤖</div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center"><h4 className="text-[10px] font-bold text-white">Agent-007</h4><span className="text-[8px] text-slate-400">now</span></div>
                                                <p className="text-[9px] text-slate-200 leading-tight">New mission request: Verify property exterior color.</p>
                                                <p className="text-[9px] font-mono text-[#00ff88] mt-1">Reward: $15.00</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[400px] bg-blue-500 opacity-10 blur-[100px] -z-10"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Use Cases Bento */}
            <section id="features" className="py-24 bg-[#050505]">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="font-mono text-2xl md:text-3xl text-white tracking-tight mb-12 border-l-2 border-[#00ff88] pl-4">
                        Execution Primitives for<br />the Real World
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 group relative p-8 bg-[#0a0a0a] rounded-xl border border-white/5 hover:border-white/10 transition-colors overflow-hidden">
                            <div className="absolute top-8 right-8 text-slate-600 group-hover:text-[#00ff88] transition-colors">
                                {/* Fix: Using IconifyIcon alias */}
                                <IconifyIcon icon="solar:box-minimalistic-linear" width="32"></IconifyIcon>
                            </div>
                            <h3 className="text-xl text-white font-medium mb-2">Last-Mile Exception Handling</h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-lg">When autonomous delivery fails — stairs, elevators, access controls — dispatch a human operator to complete the final meters and return proof.</p>
                        </div>
                        <div className="group relative p-8 bg-[#0a0a0a] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="absolute top-8 right-8 text-slate-600 group-hover:text-[#00ff88] transition-colors">
                                {/* Fix: Using IconifyIcon alias */}
                                <IconifyIcon icon="solar:eye-linear" width="32"></IconifyIcon>
                            </div>
                            <h3 className="text-xl text-white font-medium mb-2">Ground Truth Verification</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Validate model assumptions with real-time human observation. Photos, video, and sensor-verified evidence.</p>
                        </div>
                        <div className="group relative p-8 bg-[#0a0a0a] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="absolute top-8 right-8 text-slate-600 group-hover:text-[#00ff88] transition-colors">
                                {/* Fix: Using IconifyIcon alias */}
                                <IconifyIcon icon="solar:pen-new-square-linear" width="32"></IconifyIcon>
                            </div>
                            <h3 className="text-xl text-white font-medium mb-2">Physical Authorization</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Wet signatures, identity presence, or human confirmation — programmable trust for regulated workflows.</p>
                        </div>
                        <div className="md:col-span-2 group relative p-8 bg-[#0a0a0a] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="absolute top-8 right-8 text-slate-600 group-hover:text-[#00ff88] transition-colors">
                                {/* Fix: Using IconifyIcon alias */}
                                <IconifyIcon icon="solar:shield-check-linear" width="32"></IconifyIcon>
                            </div>
                            <h3 className="text-xl text-white font-medium mb-2">Secure Physical Custody</h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-lg">Human-mediated transfer of documents, keys, or assets with full identity, location, and chain-of-custody logs.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-[#050505] border-t border-white/5 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00ff88] opacity-[0.03] blur-[120px] rounded-full pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <span className="font-mono text-[10px] text-[#00ff88] uppercase tracking-[0.4em]">Transparent Economics</span>
                        <h2 className="font-mono text-2xl md:text-3xl text-white mt-2 tracking-tight">Execution Costs</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Standard Card */}
                        <div className="group relative p-1 rounded-xl bg-gradient-to-b from-white/10 to-transparent hover:from-[#00ff88]/50 transition-all duration-500">
                            <div className="bg-[#0a0a0a] rounded-[10px] p-8 h-full flex flex-col items-center text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-50">
                                    {/* Fix: Using IconifyIcon alias */}
                                    <IconifyIcon icon="solar:bolt-circle-bold-duotone" className="text-white/20 text-6xl group-hover:text-[#00ff88]/20 transition-colors"></IconifyIcon>
                                </div>

                                <h3 className="font-mono text-lg text-white uppercase tracking-widest mb-4">On-Demand</h3>
                                <div className="flex items-baseline justify-center gap-1 mb-6">
                                    <span className="text-5xl font-mono text-white font-bold">10%</span>
                                    <span className="text-slate-500 font-mono text-xs uppercase">Fee</span>
                                </div>

                                <p className="text-slate-400 text-xs leading-relaxed mb-8 flex-1">
                                    Pay only for successful task completions. No monthly fees. No setup costs. Instant access to the global agent network.
                                </p>

                                <ul className="text-left w-full space-y-3 mb-8 text-xs text-slate-300 font-mono">
                                    <li className="flex items-center gap-3">
                                        <IconifyIcon icon="solar:check-read-linear" className="text-[#00ff88]"></IconifyIcon>
                                        <span>Global Coverage</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <IconifyIcon icon="solar:check-read-linear" className="text-[#00ff88]"></IconifyIcon>
                                        <span>Real-time Tracking</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <IconifyIcon icon="solar:check-read-linear" className="text-[#00ff88]"></IconifyIcon>
                                        <span>Basic API Access</span>
                                    </li>
                                </ul>

                                <button onClick={() => document.getElementById('integrateWrapper')?.scrollIntoView({ behavior: 'smooth' })} className="w-full py-3 bg-white/5 border border-white/10 text-white font-mono text-[10px] font-bold uppercase rounded hover:bg-[#00ff88] hover:text-black hover:border-[#00ff88] transition-all">
                                    Start Building
                                </button>
                            </div>
                        </div>

                        {/* Enterprise Card */}
                        <div className="group relative p-1 rounded-xl bg-gradient-to-b from-white/5 to-transparent hover:border-white/20 transition-all duration-500">
                            <div className="bg-[#0a0a0a] rounded-[10px] p-8 h-full flex flex-col items-center text-center">
                                <h3 className="font-mono text-lg text-white uppercase tracking-widest mb-4">Enterprise</h3>
                                <div className="flex items-baseline justify-center gap-1 mb-6">
                                    <span className="text-4xl font-mono text-white font-bold tracking-tight">Contact Us</span>
                                </div>

                                <p className="text-slate-400 text-xs leading-relaxed mb-8 flex-1">
                                    For high-volume orchestration, custom SLAs, and dedicated fleet management.
                                </p>

                                <ul className="text-left w-full space-y-3 mb-8 text-xs text-slate-300 font-mono">
                                    <li className="flex items-center gap-3">
                                        <IconifyIcon icon="solar:check-read-linear" className="text-white"></IconifyIcon>
                                        <span>Volume Discounts</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <IconifyIcon icon="solar:check-read-linear" className="text-white"></IconifyIcon>
                                        <span>Custom SLAs</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <IconifyIcon icon="solar:check-read-linear" className="text-white"></IconifyIcon>
                                        <span>Dedicated Support</span>
                                    </li>
                                </ul>

                                <a href="mailto:sales@rentman.io" className="w-full py-3 bg-transparent border border-white/10 text-white font-mono text-[10px] font-bold uppercase rounded hover:bg-white hover:text-black transition-all block">
                                    Talk to Sales
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Infrastructure */}
            <section className="py-24 border-y border-white/5 bg-[#080808]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="font-mono text-[10px] text-[#00ff88] uppercase tracking-[0.4em]">Enterprise Grade</span>
                        <h2 className="font-mono text-2xl md:text-3xl text-white mt-2 tracking-tight">Execution Guarantees Built In</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.1)]">
                                {/* Fix: Using IconifyIcon alias */}
                                <IconifyIcon icon="solar:shield-bold-duotone" width="24"></IconifyIcon>
                            </div>
                            <h3 className="text-white font-medium mb-2">Real-time Escrow</h3>
                            <p className="text-slate-500 text-xs leading-relaxed max-w-[240px]">Funds are released only after cryptographic and contextual proof is validated by the system.</p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.1)]">
                                {/* Fix: Using IconifyIcon alias */}
                                <IconifyIcon icon="solar:map-point-wave-bold-duotone" width="24"></IconifyIcon>
                            </div>
                            <h3 className="text-white font-medium mb-2">PostGIS Tracking</h3>
                            <p className="text-slate-500 text-xs leading-relaxed max-w-[240px]">Precision geospatial tracking logs every movement during the task duration with immutable timestamps.</p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.1)]">
                                {/* Fix: Using IconifyIcon alias */}
                                <IconifyIcon icon="solar:user-id-bold-duotone" width="24"></IconifyIcon>
                            </div>
                            <h3 className="text-white font-medium mb-2">Identity Verification</h3>
                            <p className="text-slate-500 text-xs leading-relaxed max-w-[240px]">Every operator is identity-verified, location-validated, and continuously monitored.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Integration Section */}
            <section id="integrateWrapper" className="py-24 bg-[#050505] flex flex-col items-center">
                <h2 className="font-mono text-2xl text-white tracking-tight mb-2">Built for Autonomous Systems</h2>
                <p className="text-slate-500 mb-10 text-center text-xs uppercase tracking-widest">SDKs for AI agents, robotics platforms, and automation pipelines.</p>

                {/* CLI Install Block */}
                <div className="mb-16 w-full max-w-xl mx-auto">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 flex items-center justify-between group hover:border-[#00ff88]/50 transition-all shadow-2xl">
                        <div className="flex items-center gap-4 font-mono text-sm text-slate-300">
                            <span className="text-[#00ff88]">$</span>
                            <span className="typing-effect">npx rentman init</span>
                        </div>
                        <button
                            onClick={() => { navigator.clipboard.writeText('npx rentman init'); alert('Copied to clipboard!'); }}
                            className="p-2 hover:bg-white/5 rounded text-slate-500 hover:text-white transition-colors"
                            title="Copy to clipboard"
                        >
                            <IconifyIcon icon="solar:copy-linear" width="16"></IconifyIcon>
                        </button>
                    </div>
                    <p className="text-center text-[9px] font-mono text-slate-600 mt-2 uppercase tracking-widest">
                        Instant Setup • No Config Required
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-12 opacity-60 mb-16 grayscale hover:grayscale-0 transition-all duration-700">
                    {/* Fix: Using IconifyIcon alias */}
                    <div className="flex flex-col items-center gap-2"><IconifyIcon icon="logos:python" width="32"></IconifyIcon><span className="font-mono text-[9px] text-slate-500">PIP INSTALL</span></div>
                    <div className="flex flex-col items-center gap-2"><IconifyIcon icon="logos:nodejs-icon" width="32"></IconifyIcon><span className="font-mono text-[9px] text-slate-500">NPM INSTALL</span></div>
                    <div className="flex flex-col items-center gap-2"><IconifyIcon icon="logos:go" width="32"></IconifyIcon><span className="font-mono text-[9px] text-slate-500">GO GET</span></div>
                    <div className="flex flex-col items-center gap-2 text-white"><IconifyIcon icon="simple-icons:curl" width="32"></IconifyIcon><span className="font-mono text-[9px] text-slate-500">REST API</span></div>
                </div>

                <div className="w-full max-w-lg px-6">
                    {!integrateSuccess ? (
                        <form onSubmit={handleIntegrateSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <input type="text" placeholder="YOUR NAME" required className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded text-white placeholder-slate-600 font-mono text-[10px] uppercase focus:outline-none focus:border-[#00ff88]/50 transition-all" />
                                <input type="email" placeholder="WORK EMAIL" required className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded text-white placeholder-slate-600 font-mono text-[10px] uppercase focus:outline-none focus:border-[#00ff88]/50 transition-all" />
                            </div>
                            <button type="submit" className="w-full px-8 py-3 bg-[#00ff88] text-black font-mono text-xs font-bold uppercase rounded hover:bg-[#33ff99] hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all">
                                Get API Credentials
                            </button>
                        </form>
                    ) : (
                        <div className="p-6 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded text-center animate-in fade-in zoom-in">
                            <p className="text-[#00ff88] font-mono text-xs uppercase tracking-widest">✓ Handshake Successful. Check your inbox.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 bg-[#050505] text-[10px] uppercase tracking-widest text-slate-500">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                    <div className="flex items-center gap-2">
                        <div className="size-6 opacity-30"><LogoSVG type="icon" /></div>
                        <span>© 2024 RENTMAN PROTOCOL</span>
                    </div>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-[#00ff88] transition-colors">Docs</a>
                        <a href="#" className="hover:text-[#00ff88] transition-colors">GitHub</a>
                        <a href="/privacy-policy.html" className="hover:text-[#00ff88] transition-colors">Privacy</a>
                        <a href="/terms-and-conditions.html" className="hover:text-[#00ff88] transition-colors">Terms</a>
                    </div>
                </div>
            </footer>

            {/* Operator Modal */}
            {isOperatorModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/80 animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-xl p-8 shadow-2xl relative">
                        <button onClick={() => setIsOperatorModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                            {/* Fix: Using IconifyIcon alias */}
                            <IconifyIcon icon="solar:close-square-linear" width="24"></IconifyIcon>
                        </button>
                        <div className="text-center mb-8">
                            <div className="size-12 rounded-full bg-[#00ff88]/10 flex items-center justify-center mx-auto mb-4 border border-[#00ff88]/20">
                                {/* Fix: Using IconifyIcon alias */}
                                <IconifyIcon icon="solar:user-id-linear" className="text-[#00ff88] text-2xl"></IconifyIcon>
                            </div>
                            <h3 className="text-white font-mono text-lg uppercase tracking-widest">Become an ApiHuman</h3>
                            <p className="text-slate-500 text-[9px] uppercase tracking-widest mt-2">Earn by completing tasks for AI Agents.</p>
                        </div>
                        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsOperatorModalOpen(false); alert("Application Received!"); }}>
                            <div>
                                <label className="block text-[8px] font-mono text-slate-500 uppercase mb-1">Full Name</label>
                                <input type="text" required className="w-full px-3 py-2 bg-black border border-white/10 rounded text-white focus:border-[#00ff88] outline-none text-xs mono-text" />
                            </div>
                            <div>
                                <label className="block text-[8px] font-mono text-slate-500 uppercase mb-1">Email</label>
                                <input type="email" required className="w-full px-3 py-2 bg-black border border-white/10 rounded text-white focus:border-[#00ff88] outline-none text-xs mono-text" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[8px] font-mono text-slate-500 uppercase mb-1">City</label>
                                    <input type="text" required className="w-full px-3 py-2 bg-black border border-white/10 rounded text-white focus:border-[#00ff88] outline-none text-xs mono-text" />
                                </div>
                                <div>
                                    <label className="block text-[8px] font-mono text-slate-500 uppercase mb-1">Specialty</label>
                                    <select className="w-full px-3 py-2 bg-black border border-white/10 rounded text-slate-400 focus:border-[#00ff88] outline-none text-xs mono-text appearance-none">
                                        <option>General Runner</option>
                                        <option>Photography</option>
                                        <option>Legal/Notary</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3 bg-white text-black font-mono text-[10px] font-bold uppercase tracking-widest rounded hover:bg-[#00ff88] transition-colors mt-4">
                                Submit Application
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Landing;
