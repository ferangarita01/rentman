'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  const COLORS = { primary: "#00ff88", bgDark: "#050505", cyberBorder: "#1a2e25" };
  const FONTS = { display: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace" };

  const profile = {
    name: "Operative-772",
    level: 42,
    status: "Optimal",
    balance: "$450.00",
    payoutTime: "04:12:45",
    reputation: 99.8,
    uptime: 100.0,
    transactions: [
      { date: "24.05.24 14:02", entity: "UNIT-BX92", amount: "+$42.50", type: "credit" },
      { date: "24.05.24 09:15", entity: "LOGOS-7", amount: "+$120.00", type: "credit" },
      { date: "23.05.24 22:45", entity: "SWARM-04", amount: "+$15.75", type: "credit" },
      { date: "23.05.24 18:30", entity: "CORE-MGMT", amount: "-$5.00", type: "debit" },
      { date: "23.05.24 12:01", entity: "ROBO-DEL", amount: "+$88.20", type: "credit" },
    ],
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden"
      style={{ backgroundColor: COLORS.bgDark, fontFamily: FONTS.display, backgroundImage: 'radial-gradient(circle at 2px 2px, #00ff8811 1px, transparent 0)', backgroundSize: '24px 24px' }}>
      
      <div className="flex items-center backdrop-blur-md p-4 pb-2 justify-between sticky top-0 z-50 border-b" style={{ backgroundColor: 'rgba(5,5,5,0.8)', borderColor: COLORS.cyberBorder }}>
        <div className="flex items-center justify-center border rounded" style={{ color: COLORS.primary, borderColor: `${COLORS.primary}4D`, width: '40px', height: '40px' }}>
          <span className="material-symbols-outlined">home_work</span>
        </div>
        <h2 className="text-lg font-bold tracking-wider flex-1 text-center uppercase" style={{ color: 'white', fontFamily: FONTS.display }}>Rentman</h2>
        <button className="flex items-center justify-center rounded border" style={{ width: '40px', height: '40px', borderColor: COLORS.cyberBorder, color: COLORS.primary }}>
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>

      <div className="flex p-6"><div className="flex w-full flex-col gap-6 items-center">
        <div className="relative">
          <div className="aspect-square rounded-none border-2 p-1 w-32 h-32 flex items-center justify-center" style={{ borderColor: `${COLORS.primary}80`, backgroundColor: '#1a1a1a' }}>
            <span className="material-symbols-outlined text-6xl" style={{ color: COLORS.primary }}>person</span>
          </div>
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 text-[10px] font-bold uppercase" style={{ backgroundColor: COLORS.primary, color: '#000', fontFamily: FONTS.mono }}>Lvl {profile.level}</div>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <p className="text-xl font-bold uppercase" style={{ color: 'white', fontFamily: FONTS.mono }}>{profile.name}</p>
          <div className="flex items-center gap-2">
            <span className="rounded-full animate-pulse" style={{ width: '8px', height: '8px', backgroundColor: COLORS.primary }}></span>
            <p className="text-xs tracking-widest uppercase" style={{ color: `${COLORS.primary}B3`, fontFamily: FONTS.mono }}>System Status: {profile.status}</p>
          </div>
        </div>
      </div></div>

      <div className="mx-4 mb-6 p-6 border relative overflow-hidden" style={{ borderColor: `${COLORS.primary}33`, backgroundColor: `${COLORS.primary}0D` }}>
        <p className="text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: `${COLORS.primary}99`, fontFamily: FONTS.mono }}>Total Net Liquidity</p>
        <h1 className="text-[42px] font-bold" style={{ color: COLORS.primary, fontFamily: FONTS.mono }}>{profile.balance}</h1>
        <div className="mt-4 flex justify-between border-t pt-4" style={{ borderColor: `${COLORS.primary}1A` }}>
          <div><span className="text-[10px] uppercase block" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: FONTS.mono }}>Payout Cycle</span>
          <span className="text-xs" style={{ fontFamily: FONTS.mono }}>{profile.payoutTime} REMAINING</span></div>
          <button className="text-xs font-bold px-4 py-2 uppercase" style={{ backgroundColor: COLORS.primary, color: '#000', fontFamily: FONTS.mono }}>Withdraw</button>
        </div>
      </div>

      <div className="px-4 pb-24">
        <table className="w-full text-left text-[11px] border" style={{ fontFamily: FONTS.mono, borderColor: COLORS.cyberBorder }}>
          <thead style={{ backgroundColor: 'rgba(26,46,37,0.5)' }}><tr className="uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <th className="p-3 font-normal">Timestamp</th><th className="p-3 font-normal">Entity_ID</th><th className="p-3 font-normal text-right">Value</th>
          </tr></thead>
          <tbody>{profile.transactions.map((tx, i) => (
            <tr key={i} className="border-t hover:bg-primary/5" style={{ borderColor: COLORS.cyberBorder }}>
              <td className="p-3" style={{ color: 'rgba(255,255,255,0.6)' }}>{tx.date}</td>
              <td className="p-3" style={{ color: COLORS.primary }}>{tx.entity}</td>
              <td className="p-3 text-right" style={{ color: tx.type === 'credit' ? 'white' : '#ef4444' }}>{tx.amount}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <div className="fixed bottom-0 left-0 right-0 flex justify-around backdrop-blur-lg border-t p-4 pb-8 max-w-[430px] mx-auto" style={{ backgroundColor: 'rgba(5,5,5,0.9)', borderColor: COLORS.cyberBorder }}>
        <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <span className="material-symbols-outlined text-[24px]">work</span><span className="text-[9px] uppercase" style={{ fontFamily: FONTS.mono }}>Tasks</span>
        </button>
        <button className="flex flex-col items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <span className="material-symbols-outlined text-[24px]">explore</span><span className="text-[9px] uppercase" style={{ fontFamily: FONTS.mono }}>Explore</span>
        </button>
        <button className="flex flex-col items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <span className="material-symbols-outlined text-[24px]">add_circle</span><span className="text-[9px] uppercase" style={{ fontFamily: FONTS.mono }}>Create</span>
        </button>
        <div className="flex flex-col items-center gap-1" style={{ color: COLORS.primary }}>
          <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span><span className="text-[9px] uppercase" style={{ fontFamily: FONTS.mono }}>Wallet</span>
        </div>
        <button className="flex flex-col items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <span className="material-symbols-outlined text-[24px]">person</span><span className="text-[9px] uppercase" style={{ fontFamily: FONTS.mono }}>Profile</span>
        </button>
      </div>
    </div>
  );
}
