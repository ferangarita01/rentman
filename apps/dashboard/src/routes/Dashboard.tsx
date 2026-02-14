import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import WalletPage from './Wallet';
import CreateMissionModalV2 from '../components/CreateMissionModalV2';
import TaskActionModal from '../components/TaskActionModal';
import CyberpunkGlobe from '../components/CyberpunkGlobe';

type View = 'overview' | 'wallet' | 'agents' | 'missions';

// Real Data Interfaces
interface Task {
    id: string;
    title: string;
    description: string;
    status: string;
    budget_amount: number;
    created_at: string;
    proof_notes?: string;
    agent_id?: string;
    user_id?: string;
    lat?: number;
    lng?: number;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [currentView, setCurrentView] = useState<View>('overview');
    const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);

    // State
    const [credits, setCredits] = useState(0);
    const [activeAgentsCount, setActiveAgentsCount] = useState(0);
    const [missions, setMissions] = useState<Task[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const globeRef = useRef<HTMLDivElement>(null);

    // Globe Interaction
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (globeRef.current) {
                const xAxis = (window.innerWidth / 2 - e.pageX) / 50;
                const yAxis = (window.innerHeight / 2 - e.pageY) / 50;
                globeRef.current.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        let mounted = true;

        async function loadDashboardData() {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }
            setUserId(session.user.id);

            // Fetch Credits
            const { data: deposits } = await supabase.rpc('get_my_deposits');
            if (mounted && deposits && deposits.length > 0) {
                const totalCredits = deposits.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
                setCredits(totalCredits);
            }

            // Fetch Missions
            const { data: tasksData } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (mounted && tasksData) {
                setMissions(tasksData);
                // Guesstimate active agents based on tasks with agent_id
                const agents = new Set(tasksData.filter((t: any) => t.agent_id).map((t: any) => t.agent_id));
                setActiveAgentsCount(agents.size > 0 ? agents.size : 14204);
            }

            if (mounted) setLoading(false);
        }

        loadDashboardData();

        // Realtime Subscription
        const channel = supabase
            .channel('dashboard-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload: any) => {
                const newRecord = payload.new;
                if (payload.eventType === 'INSERT') {
                    setMissions((prev) => [newRecord, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                    setMissions((prev) => prev.map((task) => task.id === newRecord.id ? { ...task, ...newRecord } : task));
                }
            })
            .subscribe();

        return () => {
            mounted = false;
            supabase.removeChannel(channel);
        };
    }, [navigate]);

    const handleNodeClick = (task: Task) => {
        setSelectedTask(task);
        setIsActionModalOpen(true);
    };

    return (
        <div className="bg-cyber-black text-white font-sans min-h-screen overflow-hidden selection:bg-cyber-green selection:text-black">
            {/* Main Layout Wrapper */}
            <div className="flex h-screen w-full relative grid-bg">

                {/* BEGIN: Left Sidebar - Global Stats & Feed */}
                <aside className="w-80 h-full glass-panel border-r border-cyber-border z-20 flex flex-col transition-all duration-300">
                    <div className="p-6 border-b border-cyber-border">
                        <div className="flex items-center gap-3 mb-6 cursor-pointer" onClick={() => setCurrentView('overview')}>
                            <div className="w-8 h-8 bg-cyber-green flex items-center justify-center rounded-sm shadow-[0_0_10px_rgba(0,255,136,0.3)]">
                                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                            </div>
                            <h1 className="font-mono text-xl font-bold tracking-tighter">RENTMAN_OS <span className="text-cyber-green text-sm">V4.2</span></h1>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Total Active Nodes</p>
                                <p className="text-2xl font-mono text-cyber-green">14,204.00 K</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Live Contracts Count</p>
                                <p className="text-2xl font-mono text-white">{missions.length}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Available Credits</p>
                                <p className="text-xl font-mono text-white">${credits.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        <h2 className="text-[11px] font-mono text-zinc-500 uppercase px-2 mb-2">Real-time Feed</h2>
                        {/* Feed Item 1 (Static Mock) */}
                        <div className="p-3 border border-cyber-border bg-cyber-dark hover:border-cyber-green/50 transition-colors cursor-pointer group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-mono text-cyber-green">[CONNECTED]</span>
                                <span className="text-[10px] font-mono text-zinc-500">2s ago</span>
                            </div>
                            <p className="text-xs font-mono group-hover:text-cyber-green transition-colors">Node_0492 established secure handshake at Sector 7.</p>
                        </div>
                        {/* Feed Item 2 (Static Mock) */}
                        <div className="p-3 border border-cyber-border bg-cyber-dark hover:border-cyber-green/50 transition-colors cursor-pointer group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-mono text-yellow-500">[ALERT]</span>
                                <span className="text-[10px] font-mono text-zinc-500">14s ago</span>
                            </div>
                            <p className="text-xs font-mono group-hover:text-cyber-green transition-colors">Unauthorized drone activity detected near Paris Data Center.</p>
                        </div>
                        {/* Recent Missions Feed */}
                        {missions.slice(0, 3).map(m => (
                            <div key={m.id} className="p-3 border border-cyber-border bg-cyber-dark hover:border-cyber-green/50 transition-colors cursor-pointer group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-mono text-cyber-green">[NEW_CONTRACT]</span>
                                    <span className="text-[10px] font-mono text-zinc-500">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-xs font-mono group-hover:text-cyber-green transition-colors">{m.title}</p>
                            </div>
                        ))}
                    </div>
                </aside>
                {/* END: Left Sidebar */}

                {/* MAIN CONTENT AREA */}
                {currentView === 'overview' ? (
                    <>
                        {/* BEGIN: Main Centerpiece - Holographic Globe */}
                        <main className="flex-1 relative flex items-center justify-center overflow-hidden">
                            {/* HUD Overlays */}
                            <div className="absolute top-8 left-8 z-10 font-mono">
                                <div className="bg-cyber-green/10 border border-cyber-green px-4 py-2 text-cyber-green text-xs uppercase tracking-tighter backdrop-blur-sm">
                                    Connection: Secure_Link
                                </div>
                            </div>
                            <div className="absolute top-8 right-8 z-10 font-mono text-right">
                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Global Load</div>
                                <div className="text-xl text-cyber-green">74.2%</div>
                            </div>

                            {/* Holographic Globe Visualization Area */}
                            <div className="relative w-full h-full flex items-center justify-center" id="globe-container">
                                <CyberpunkGlobe missions={missions} onNodeClick={handleNodeClick} />

                                {/* Scanning Line Overlay */}
                                <div className="absolute left-0 right-0 bg-gradient-to-b from-transparent via-cyber-green/10 to-transparent h-1 w-full scan-line pointer-events-none z-10"></div>
                                <div className="absolute inset-0 rounded-full border border-cyber-green/5 pointer-events-none z-20"></div>
                            </div>

                            {/* Globe Controls */}
                            <div className="absolute bottom-12 flex gap-4 z-30">
                                <button className="bg-cyber-green text-black font-mono text-xs px-6 py-3 font-bold uppercase hover:bg-white transition-colors shadow-[0_0_20px_rgba(0,255,136,0.3)]" onClick={() => setIsMissionModalOpen(true)}>
                                    Deploy Node
                                </button>
                                <button className="border border-cyber-green text-cyber-green font-mono text-xs px-6 py-3 font-bold uppercase hover:bg-cyber-green/10 transition-colors">
                                    Scan Perimeter
                                </button>
                            </div>
                        </main>
                        {/* END: Main Centerpiece */}
                    </>
                ) : (
                    <main className="flex-1 relative flex flex-col overflow-hidden bg-cyber-black/90 p-8">
                        {/* Header for Sub-views */}
                        <header className="flex justify-between items-center mb-8 border-b border-cyber-border pb-4">
                            <h2 className="text-2xl font-mono text-cyber-green uppercase tracking-tighter">{currentView}</h2>
                            <button onClick={() => setCurrentView('overview')} className="text-zinc-500 hover:text-white font-mono text-xs uppercase">[ BACK_TO_GRID ]</button>
                        </header>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {currentView === 'wallet' && <WalletPage embedded={true} />}
                            {currentView === 'missions' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {missions.map(task => (
                                        <div key={task.id} onClick={() => { setSelectedTask(task); setIsActionModalOpen(true); }} className="border border-cyber-border p-5 space-y-4 hover:border-cyber-green transition-all bg-black/40 cursor-pointer">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-mono text-sm font-bold uppercase tracking-tight text-white">{task.title}</h3>
                                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${task.status === 'completed' ? 'bg-cyber-green/20 text-cyber-green' : 'bg-zinc-800 text-zinc-400'}`}>{task.status}</span>
                                            </div>
                                            <p className="text-xs text-zinc-500 line-clamp-2">{task.description}</p>
                                            <div className="text-right">
                                                <p className="text-xl font-mono text-cyber-green">${Number(task.budget_amount).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </main>
                )}

                {/* BEGIN: Right Sidebar - Active Contracts (Only show on Overview? Or always? Design implies always) */}
                {/* To not clutter small screens or other views, let's keep it visible on Overview, or maybe collapse it? 
                    The mock shows it as a permanent fixture. Let's keep it for Overview. 
                */}
                {currentView === 'overview' && (
                    <aside className="hidden lg:flex w-[400px] h-full glass-panel border-l border-cyber-border z-20 flex-col">
                        <div className="p-6 border-b border-cyber-border flex justify-between items-center bg-cyber-green/5">
                            <h2 className="font-mono text-sm font-bold tracking-widest text-cyber-green uppercase">Contract_Listing</h2>
                            <div className="flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse"></div>
                                <div className="w-2 h-2 rounded-full bg-cyber-green/30"></div>
                                <div className="w-2 h-2 rounded-full bg-cyber-green/30"></div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {/* Map real missions here */}
                            {missions.slice(0, 5).map(task => (
                                <article key={task.id} className="border border-cyber-border p-5 space-y-4 hover:border-cyber-green transition-all bg-black/40 cursor-pointer group"
                                    onClick={() => { setSelectedTask(task); setIsActionModalOpen(true); }}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-mono text-cyber-green">[VERIFIED_ISSUER]</p>
                                            <h3 className="font-mono text-sm font-bold uppercase tracking-tight mt-1 line-clamp-1 group-hover:text-cyber-green transition-colors">{task.title}</h3>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase">Contract_ID</span>
                                            <p className="text-[10px] font-mono">{task.id.substring(0, 8)}</p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* Navigation Footer for Sidebar */}
                        <nav className="h-20 border-t border-cyber-border flex items-center justify-around bg-cyber-dark z-30">
                            <button
                                onClick={() => setCurrentView('missions')}
                                className={`flex flex-col items-center gap-1 group ${currentView === 'missions' ? 'opacity-100' : 'opacity-40 hover:opacity-100'} transition-opacity`}
                            >
                                <svg className="w-5 h-5 text-cyber-green" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
                                <span className="text-[9px] font-mono uppercase text-cyber-green tracking-widest">Market</span>
                            </button>
                            <button
                                onClick={() => setCurrentView('wallet')}
                                className={`flex flex-col items-center gap-1 group ${currentView === 'wallet' ? 'opacity-100' : 'opacity-40 hover:opacity-100'} transition-opacity`}
                            >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                                <span className="text-[9px] font-mono uppercase text-white tracking-widest">Vault</span>
                            </button>
                            <button
                                onClick={() => supabase.auth.signOut().then(() => navigate('/'))}
                                className="flex flex-col items-center gap-1 group opacity-40 hover:opacity-100 transition-opacity"
                            >
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                <span className="text-[9px] font-mono uppercase text-red-500 tracking-widest">Jack Out</span>
                            </button>
                        </nav>
                    </aside>
                )}
                {/* END: Right Sidebar */}
            </div>

            {/* Modals */}
            {
                userId && (
                    <CreateMissionModalV2
                        isOpen={isMissionModalOpen}
                        onClose={() => setIsMissionModalOpen(false)}
                        onSuccess={() => { }}
                        userId={userId}
                    />
                )
            }
            {
                isActionModalOpen && selectedTask && userId && (
                    <TaskActionModal
                        isOpen={isActionModalOpen}
                        onClose={() => setIsActionModalOpen(false)}
                        task={selectedTask}
                        isEmployer={true}
                        onUpdate={() => { }}
                    />
                )
            }
        </div >
    );
};

export default Dashboard;
