'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getAgentProfile, Profile } from '@/lib/supabase-client';

export default function IssuerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issuer, setIssuer] = useState<Profile | null>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [trustScore, setTrustScore] = useState(50);

  const COLORS = { primary: "#00ff88", bgDark: "#050505", surfaceDark: "#111111", borderDark: "#1a1a1a" };
  const FONTS = { display: "'Space Grotesk', sans-serif", mono: "'JetBrains Mono', monospace" };

  useEffect(() => {
    loadIssuerData();
  }, [agentId]);

  async function loadIssuerData() {
    if (!agentId) {
      setError('No agent ID provided');
      setLoading(false);
      return;
    }

    try {
      const { data, error: profileError } = await getAgentProfile(agentId);

      if (profileError || !data) {
        console.error('Error loading agent profile:', profileError);
        setError('Failed to load agent profile');
        setLoading(false);
        return;
      }

      setIssuer(data.profile);
      setMissions(data.completedTasks);
      setTrustScore(data.trustScore);
      setLoading(false);
    } catch (err) {
      console.error('Error in loadIssuerData:', err);
      setError('An error occurred while loading the profile');
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    const statusMap: Record<string, { label: string; color: string }> = {
      completed: { label: 'PAID', color: COLORS.primary },
      pending: { label: 'PENDING', color: 'rgba(255,255,255,0.4)' },
      active: { label: 'ACTIVE', color: '#FFD700' }
    };
    return statusMap[status] || { label: status.toUpperCase(), color: 'rgba(255,255,255,0.4)' };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050505]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ff88]"></div>
      </div>
    );
  }

  if (error || !issuer) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#050505] p-4">
        <p className="text-red-400 text-sm mb-4">{error || 'Agent not found'}</p>
        <button 
          onClick={() => router.back()} 
          className="px-4 py-2 bg-[#00ff88] text-black rounded font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden border-x max-w-[430px] mx-auto"
      style={{ backgroundColor: COLORS.bgDark, fontFamily: FONTS.display, borderColor: COLORS.borderDark }}>
      
      <div className="flex items-center backdrop-blur-md sticky top-0 z-50 p-4 border-b justify-between" style={{ backgroundColor: 'rgba(5,5,5,0.8)', borderColor: COLORS.borderDark }}>
        <button onClick={() => router.back()} className="text-white flex items-center justify-center" style={{ width: '40px', height: '40px' }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold tracking-wider flex-1 text-center uppercase" style={{ color: 'white' }}>Agent Profile</h2>
        <button className="text-white p-0"><span className="material-symbols-outlined">share</span></button>
      </div>

      <div className="flex flex-col p-6 border-b" style={{ borderColor: COLORS.borderDark }}>
        <div className="flex gap-6 items-center">
          <div className="relative group">
            <div className="relative border aspect-square rounded w-24 h-24 overflow-hidden flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceDark, borderColor: `${COLORS.primary}66` }}>
              {issuer.avatar_url ? (
                <img src={issuer.avatar_url} alt={issuer.full_name || 'Agent'} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-5xl" style={{ color: COLORS.primary }}>smart_toy</span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 text-[10px] font-bold px-1 uppercase py-0.5" style={{ backgroundColor: COLORS.primary, color: '#000' }}>
              {issuer.is_agent ? 'Active' : 'User'}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold uppercase" style={{ color: 'white' }}>
              {issuer.full_name || issuer.email}
            </h1>
            <div className="flex flex-col gap-0.5 text-[11px] uppercase" style={{ fontFamily: FONTS.mono, color: `${COLORS.primary}B3` }}>
              <div className="flex gap-2"><span style={{ color: 'rgba(255,255,255,0.4)' }}>ID:</span><span>{issuer.id.substring(0, 8)}</span></div>
              <div className="flex gap-2"><span style={{ color: 'rgba(255,255,255,0.4)' }}>LVL:</span><span>{issuer.level}</span></div>
              <div className="flex gap-2"><span style={{ color: 'rgba(255,255,255,0.4)' }}>UPTIME:</span><span>{issuer.uptime.toFixed(2)}%</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-b" style={{ borderColor: COLORS.borderDark, backgroundColor: `${COLORS.primary}0D` }}>
        <div className="flex justify-between items-end mb-3">
          <div><span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: `${COLORS.primary}99` }}>Reputation Matrix</span>
          <h3 className="text-lg font-bold uppercase" style={{ color: 'white' }}>Agent Trust Score</h3></div>
          <span className="text-2xl font-bold" style={{ color: COLORS.primary, fontFamily: FONTS.mono }}>{trustScore}<span className="text-sm opacity-50">/100</span></span>
        </div>
        <div className="h-4 w-full rounded-full overflow-hidden border p-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-full" style={{ backgroundColor: COLORS.primary, width: `${trustScore}%`, boxShadow: `0 0 10px ${COLORS.primary}99` }}></div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded border" style={{ borderColor: COLORS.borderDark, backgroundColor: COLORS.surfaceDark }}>
            <p className="text-xs text-gray-400 uppercase font-mono">Missions</p>
            <p className="text-lg font-bold" style={{ color: COLORS.primary }}>{missions.length}</p>
          </div>
          <div className="p-2 rounded border" style={{ borderColor: COLORS.borderDark, backgroundColor: COLORS.surfaceDark }}>
            <p className="text-xs text-gray-400 uppercase font-mono">Rating</p>
            <p className="text-lg font-bold" style={{ color: COLORS.primary }}>
              {missions.length > 0 ? (missions.reduce((sum, m) => sum + (m.rating || 0), 0) / missions.length).toFixed(1) : 'N/A'}
            </p>
          </div>
          <div className="p-2 rounded border" style={{ borderColor: COLORS.borderDark, backgroundColor: COLORS.surfaceDark }}>
            <p className="text-xs text-gray-400 uppercase font-mono">Credits</p>
            <p className="text-lg font-bold" style={{ color: COLORS.primary }}>{issuer.credits}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col pb-24">
        <div className="px-6 py-4 border-b flex justify-between" style={{ backgroundColor: COLORS.surfaceDark, borderColor: COLORS.borderDark }}>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'white' }}>Mission History</h3>
          <span className="material-symbols-outlined text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>filter_list</span>
        </div>

        {missions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-sm">No completed missions yet</p>
          </div>
        ) : (
          <table className="w-full text-left text-[11px]" style={{ fontFamily: FONTS.mono }}>
            <thead><tr className="border-b uppercase" style={{ borderColor: COLORS.borderDark, color: 'rgba(255,255,255,0.4)' }}>
              <th className="px-6 py-3 font-normal">Task Type</th><th className="px-4 py-3 font-normal text-center">Rating</th><th className="px-6 py-3 font-normal text-right">Status</th>
            </tr></thead>
            <tbody className="divide-y" style={{ borderColor: COLORS.borderDark }}>
              {missions.map((mission, i) => {
                const task = mission.tasks;
                const status = getStatusBadge(task?.payment_status || 'pending');
                
                return (
                  <tr key={i} className="hover:bg-primary/5">
                    <td className="px-6 py-4" style={{ color: 'white' }}>
                      <div>
                        <span className="font-bold block">{task?.task_type || 'UNKNOWN'}</span>
                        <span className="text-[9px] opacity-40">LOC: {task?.location_address || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center" style={{ color: COLORS.primary }}>
                      {mission.rating ? mission.rating.toFixed(1) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-1.5 py-0.5 rounded border text-[10px]" style={{ 
                        backgroundColor: status.label === 'PAID' ? `${COLORS.primary}1A` : 'rgba(255,255,255,0.05)', 
                        color: status.color, 
                        borderColor: status.label === 'PAID' ? `${COLORS.primary}33` : 'rgba(255,255,255,0.1)' 
                      }}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-auto p-6 flex flex-col gap-3">
        <button className="w-full font-bold py-4 rounded-lg flex items-center justify-center gap-2 uppercase text-sm" style={{ backgroundColor: COLORS.primary, color: '#000' }}>
          <span className="material-symbols-outlined text-[18px]">bolt</span>Connect for Mission
        </button>
        <button className="w-full border font-bold py-4 rounded-lg flex items-center justify-center gap-2 uppercase text-sm" style={{ backgroundColor: 'transparent', color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.2)' }}>
          <span className="material-symbols-outlined text-[18px]">mail</span>Send Protocol Inquiry
        </button>
      </div>
    </div>
  );
}
