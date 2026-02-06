import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoSVG from '../components/LogoSVG';
import { NavItem, StatCard, AgentCard } from '../components/DashboardUI';
import { supabase } from '../lib/supabase';

type View = 'overview' | 'wallet' | 'agents' | 'missions';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [currentView, setCurrentView] = useState<View>('overview');
    const [credits, setCredits] = useState(1250.50);
    // Mock data for initial render, will replace with Realtime Supabase data later
    const [agents, setAgents] = useState([
        { id: 'RM-001', name: 'Alpha_Bot', status: 'ONLINE', tasks: 124 },
        { id: 'RM-042', name: 'Scout_IA', status: 'ON_MISSION', tasks: 89 },
        { id: 'RM-099', name: 'Heavy_Loader', status: 'OFFLINE', tasks: 12 }
    ]);
    const [dashLogs, setDashLogs] = useState<string[]>([]);

    useEffect(() => {
        let mounted = true;

        async function loadDashboardData() {
            // 1. Check Session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            // 2. Fetch Profile (Credits)
            const { data: profile } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', session.user.id)
                .single();

            if (mounted && profile) {
                setCredits(Number(profile.credits) || 0);
            }

            // 3. Fetch Agents (Real)
            const { data: agentsData } = await supabase
                .from('agents')
                .select('id, name, type, status, total_tasks_posted')
                .limit(10);

            if (mounted && agentsData) {
                const formattedAgents = agentsData.map(a => ({
                    id: a.id.substring(0, 8).toUpperCase(), // Short ID for UI
                    name: a.name,
                    status: (a.metadata?.status || 'OFFLINE').toUpperCase(), // Assuming metadata holds realtime status or fallback
                    tasks: a.total_tasks_posted || 0
                }));
                if (formattedAgents.length > 0) setAgents(formattedAgents);
            }
        }

        loadDashboardData();

        // Cyberpunk logs generator (Keep for atmosphere)
        const messages = ["CREDIT_CHECK: OK", "AGENT_SYNC: 3 ACTIVE", "PHYSICAL_NODE: TOKYO", "ENCRYPTION: ARMORED"];
        const interval = setInterval(() => {
            setDashLogs(prev => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ${messages[Math.floor(Math.random() * messages.length)]}`]);
        }, 3000);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-[#050505] text-slate-300 mono-text flex overflow-hidden">
            <nav className="w-64 border-r border-[#00ff88]/10 bg-[#080808] flex flex-col p-6 z-20">
                <div className="mb-12 flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 group-hover:drop-shadow-[0_0_8px_#00ff88] transition-all"><LogoSVG type="icon" /></div>
                    <span className="text-[#00ff88] font-bold tracking-tighter">RENTMAN_</span>
                </div>
                <div className="flex-1 space-y-2">
                    <NavItem icon="dashboard" label="Overview" active={currentView === 'overview'} onClick={() => setCurrentView('overview')} />
                    <NavItem icon="account_balance_wallet" label="Wallet" active={currentView === 'wallet'} onClick={() => setCurrentView('wallet')} />
                    <NavItem icon="smart_toy" label="Agents" active={currentView === 'agents'} onClick={() => setCurrentView('agents')} />
                    <NavItem icon="assignment" label="Missions" active={currentView === 'missions'} onClick={() => setCurrentView('missions')} />
                </div>
                <div className="mt-auto pt-6 border-t border-[#00ff88]/10">
                    <button onClick={handleLogout} className="w-full py-2 border border-red-500/20 text-red-500/60 text-[10px] uppercase hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-xs">logout</span> EXIT_SYSTEM
                    </button>
                </div>
            </nav>

            <main className="flex-1 relative flex flex-col overflow-hidden">
                <header className="h-16 border-b border-[#00ff88]/10 bg-[#050505]/50 backdrop-blur-md flex items-center justify-between px-8 z-10">
                    <div className="flex items-center gap-6">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">CENTER: ALPHA-01</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Status: STABLE</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="text-[9px] text-slate-500 uppercase tracking-widest">CREDITS</div>
                            <div className="text-[#00ff88] font-bold">${credits.toLocaleString()}</div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/30 flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm text-[#00ff88]">person</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {currentView === 'overview' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StatCard label="Tasks_Executed" value="1,248" delta="+12%" />
                                <StatCard label="Avg_Latency" value="42ms" delta="-5ms" />
                                <StatCard label="Human_Nodes" value="8,401" delta="ACTIVE" />
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#00ff88]/10 p-6 rounded-lg">
                                <h3 className="text-white text-xs mb-4 uppercase tracking-widest border-l-2 border-[#00ff88] pl-3">Operational_Feed</h3>
                                <div className="space-y-2">
                                    {dashLogs.map((log, i) => (
                                        <div key={i} className="text-[11px] text-[#00ff88]/60 pb-2 border-b border-white/5">{log}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    {currentView === 'wallet' && (
                        <div className="space-y-8">
                            <div className="bg-[#0a0a0a] border border-[#00ff88]/30 p-10 rounded-2xl flex flex-col md:flex-row justify-between items-center">
                                <div>
                                    <h2 className="text-slate-500 text-xs uppercase tracking-widest mb-2">Available_Balance</h2>
                                    <div className="text-6xl font-extrabold text-[#00ff88] tracking-tighter">${credits.toLocaleString()}</div>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setCredits(c => c + 100)} className="bg-[#00ff88] text-black px-6 py-3 font-bold text-sm uppercase">Recharge_$100</button>
                                </div>
                            </div>
                        </div>
                    )}
                    {currentView === 'agents' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {agents.map(agent => (
                                <AgentCard key={agent.id} agent={agent} />
                            ))}
                        </div>
                    )}
                    {currentView === 'missions' && (
                        <div className="h-full flex items-center justify-center text-center opacity-40">
                            <div>
                                <span className="material-symbols-outlined text-6xl mb-4">satellite_alt</span>
                                <p className="mono-text uppercase tracking-widest text-xs">Awaiting_Remote_Task_Insertion</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00ff8822; border-radius: 10px; }
      `}} />
        </div>
    );
};

export default Dashboard;
