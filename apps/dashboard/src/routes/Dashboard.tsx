import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoSVG from '../components/LogoSVG';
import { NavItem, StatCard, AgentCard } from '../components/DashboardUI';
import { supabase } from '../lib/supabase';
import WalletPage from './Wallet';

type View = 'overview' | 'wallet' | 'agents' | 'missions';

// Real Data Interfaces
interface Task {
    id: string;
    title: string;
    description: string;
    status: string;
    budget_amount: number;
    created_at: string;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [currentView, setCurrentView] = useState<View>('overview');
    const [credits, setCredits] = useState(0);
    const [agents, setAgents] = useState<any[]>([]);
    const [missions, setMissions] = useState<Task[]>([]);

    // Loading state
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function loadDashboardData() {
            setLoading(true);
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
                    status: (a.status || 'OFFLINE').toUpperCase(),
                    tasks: a.total_tasks_posted || 0
                }));
                if (formattedAgents.length > 0) setAgents(formattedAgents);
            }

            // 4. Fetch Missions (Real)
            const { data: tasksData } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (mounted && tasksData) {
                setMissions(tasksData);
            }

            if (mounted) setLoading(false);
        }

        loadDashboardData();

        // Realtime Subscription
        const channel = supabase
            .channel('dashboard-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks'
                },
                (payload: any) => {
                    const newRecord = payload.new;
                    if (payload.eventType === 'INSERT') {
                        setMissions((prev) => [newRecord, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setMissions((prev) => prev.map((task) =>
                            task.id === newRecord.id ? { ...task, ...newRecord } : task
                        ));
                    }
                }
            )
            .subscribe();

        return () => {
            mounted = false;
            supabase.removeChannel(channel);
        };
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    // Calculate Completed Missions
    const completedMissions = missions.filter(m => m.status === 'completed').length;

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
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Status: REALTIME</span>
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
                                <StatCard label="Live_Missions" value={missions.length.toString()} delta="ACTIVE" />
                                <StatCard label="Completed_Missions" value={completedMissions.toString()} delta="TOTAL" />
                                <StatCard label="Active_Agents" value={agents.length.toString()} delta="ONLINE" />
                            </div>

                            <div className="bg-[#0a0a0a] border border-[#00ff88]/10 p-6 rounded-lg">
                                <h3 className="text-white text-xs mb-4 uppercase tracking-widest border-l-2 border-[#00ff88] pl-3">Live_Mission_Feed</h3>
                                {loading ? (
                                    <div className="text-[10px] text-slate-500 animate-pulse">CONNECTING_TO_SATELLITE...</div>
                                ) : (
                                    <div className="space-y-0">
                                        {missions.length === 0 ? (
                                            <div className="text-[10px] text-slate-500">NO_ACTIVE_MISSIONS_DETECTED</div>
                                        ) : (
                                            missions.slice(0, 5).map((task) => (
                                                <div key={task.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 transition-colors">
                                                    <div>
                                                        <div className="text-[11px] text-[#00ff88] font-mono mb-1">{task.title}</div>
                                                        <div className="text-[9px] text-slate-500 uppercase">{task.status} • {new Date(task.created_at).toLocaleTimeString()}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-white font-mono text-xs">${Number(task.budget_amount).toFixed(2)}</div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {currentView === 'wallet' && (
                        <div className="h-full">
                            <WalletPage embedded={true} />
                        </div>
                    )}
                    {currentView === 'agents' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {agents.length === 0 ? (
                                <div className="col-span-3 text-center text-slate-500 text-xs p-10">NO AGENTS ONLINE</div>
                            ) : (
                                agents.map(agent => (
                                    <AgentCard key={agent.id} agent={agent} />
                                ))
                            )}
                        </div>
                    )}
                    {currentView === 'missions' && (
                        <div className="h-full">
                            <h2 className="text-white text-xs uppercase tracking-widest mb-6 sticky top-0 bg-[#050505] py-2 z-10">Global_Mission_Log</h2>
                            <div className="grid grid-cols-1 gap-4">
                                {missions.map((task) => (
                                    <div key={task.id} className="bg-[#0a0a0a] border border-white/10 p-4 rounded hover:border-[#00ff88]/50 transition-all flex justify-between items-center">
                                        <div>
                                            <div className="text-[#00ff88] font-mono text-xs mb-1">{task.title}</div>
                                            <p className="text-slate-400 text-[10px] mb-2 max-w-xl truncate">{task.description}</p>
                                            <div className="flex gap-2">
                                                <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-slate-500 uppercase">{task.status}</span>
                                                <span className="text-[9px] text-slate-600 uppercase">{new Date(task.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-white mb-1">${Number(task.budget_amount).toFixed(2)}</div>
                                        </div>
                                    </div>
                                ))}
                                {missions.length === 0 && (
                                    <div className="text-center opacity-40 p-10">
                                        <span className="material-symbols-outlined text-4xl mb-4">satellite_alt</span>
                                        <p className="mono-text uppercase tracking-widest text-xs">No Missions Found</p>
                                    </div>
                                )}
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
