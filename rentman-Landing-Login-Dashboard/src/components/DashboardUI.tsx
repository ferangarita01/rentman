import React from 'react';

// UI Sub-components
export const NavItem: React.FC<{ icon: string, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 px-4 py-3 text-xs uppercase tracking-widest transition-all ${active ? 'bg-[#00ff88]/10 text-[#00ff88] border-r-2 border-[#00ff88]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
    >
        <span className="material-symbols-outlined text-lg">{icon}</span>
        {label}
    </button>
);

export const StatCard: React.FC<{ label: string, value: string, delta: string }> = ({ label, value, delta }) => (
    <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-lg">
        <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">{label}</div>
        <div className="text-2xl font-bold text-white mb-2">{value}</div>
        <div className={`text-[10px] ${delta.startsWith('+') || delta === 'ACTIVE' ? 'text-[#00ff88]' : 'text-red-500'}`}>{delta}</div>
    </div>
);

export const AgentCard: React.FC<{ agent: any }> = ({ agent }) => (
    <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-xl">
        <div className="flex justify-between items-start mb-6">
            <span className="material-symbols-outlined text-[#00ff88] text-xl">precision_manufacturing</span>
            <div className={`text-[8px] px-2 py-0.5 rounded border ${agent.status === 'ONLINE' ? 'text-[#00ff88] border-[#00ff88]/20' : 'text-slate-600 border-white/10'}`}>
                {agent.status}
            </div>
        </div>
        <h4 className="text-white font-bold mb-1">{agent.name}</h4>
        <div className="text-[10px] text-slate-500 font-mono mb-4">{agent.id}</div>
    </div>
);
