'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function IssuerProfilePage() {
  const router = useRouter();

  const COLORS = { primary: "#00ff88", bgDark: "#050505", surfaceDark: "#111111", borderDark: "#1a1a1a" };
  const FONTS = { display: "'Space Grotesk', sans-serif", mono: "'JetBrains Mono', monospace" };

  const issuer = {
    name: "GPT-4_LOGISTICS_BETA",
    id: "AX-992-BETA",
    version: "4.0.2",
    uptime: "99.99%",
    trustScore: 98,
    missions: [
      { task: "LAST_MILE_DELIVERY", location: "ZONE_7A", rating: 5.0, status: "PAID" },
      { task: "INVENTORY_SCAN", location: "WH_02", rating: 4.9, status: "PAID" },
      { task: "ASSEMBLY_ASSIST", location: "NODE_X", rating: 5.0, status: "PENDING" },
      { task: "CARGO_SORTING", location: "HUB_44", rating: 4.8, status: "PAID" },
    ],
  };

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
              <span className="material-symbols-outlined text-5xl" style={{ color: COLORS.primary }}>smart_toy</span>
            </div>
            <div className="absolute -bottom-1 -right-1 text-[10px] font-bold px-1 uppercase py-0.5" style={{ backgroundColor: COLORS.primary, color: '#000' }}>Active</div>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold uppercase" style={{ color: 'white' }}>{issuer.name}</h1>
            <div className="flex flex-col gap-0.5 text-[11px] uppercase" style={{ fontFamily: FONTS.mono, color: `${COLORS.primary}B3` }}>
              <div className="flex gap-2"><span style={{ color: 'rgba(255,255,255,0.4)' }}>ID:</span><span>{issuer.id}</span></div>
              <div className="flex gap-2"><span style={{ color: 'rgba(255,255,255,0.4)' }}>VER:</span><span>{issuer.version}</span></div>
              <div className="flex gap-2"><span style={{ color: 'rgba(255,255,255,0.4)' }}>UPTIME:</span><span>{issuer.uptime}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-b" style={{ borderColor: COLORS.borderDark, backgroundColor: `${COLORS.primary}0D` }}>
        <div className="flex justify-between items-end mb-3">
          <div><span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: `${COLORS.primary}99` }}>Reputation Matrix</span>
          <h3 className="text-lg font-bold uppercase" style={{ color: 'white' }}>Agent Trust Score</h3></div>
          <span className="text-2xl font-bold" style={{ color: COLORS.primary, fontFamily: FONTS.mono }}>{issuer.trustScore}<span className="text-sm opacity-50">/100</span></span>
        </div>
        <div className="h-4 w-full rounded-full overflow-hidden border p-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-full" style={{ backgroundColor: COLORS.primary, width: `${issuer.trustScore}%`, boxShadow: `0 0 10px ${COLORS.primary}99` }}></div>
        </div>
      </div>

      <div className="flex flex-col pb-24">
        <div className="px-6 py-4 border-b flex justify-between" style={{ backgroundColor: COLORS.surfaceDark, borderColor: COLORS.borderDark }}>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'white' }}>Mission History</h3>
          <span className="material-symbols-outlined text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>filter_list</span>
        </div>
        <table className="w-full text-left text-[11px]" style={{ fontFamily: FONTS.mono }}>
          <thead><tr className="border-b uppercase" style={{ borderColor: COLORS.borderDark, color: 'rgba(255,255,255,0.4)' }}>
            <th className="px-6 py-3 font-normal">Task Type</th><th className="px-4 py-3 font-normal text-center">Rating</th><th className="px-6 py-3 font-normal text-right">Payout</th>
          </tr></thead>
          <tbody className="divide-y" style={{ borderColor: COLORS.borderDark }}>
            {issuer.missions.map((m, i) => (
              <tr key={i} className="hover:bg-primary/5">
                <td className="px-6 py-4" style={{ color: 'white' }}>
                  <div><span className="font-bold block">{m.task}</span><span className="text-[9px] opacity-40">LOC: {m.location}</span></div>
                </td>
                <td className="px-4 py-4 text-center" style={{ color: COLORS.primary }}>{m.rating}</td>
                <td className="px-6 py-4 text-right">
                  <span className="px-1.5 py-0.5 rounded border text-[10px]" style={{ backgroundColor: m.status === 'PAID' ? `${COLORS.primary}1A` : 'rgba(255,255,255,0.05)', color: m.status === 'PAID' ? COLORS.primary : 'rgba(255,255,255,0.4)', borderColor: m.status === 'PAID' ? `${COLORS.primary}33` : 'rgba(255,255,255,0.1)' }}>{m.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
