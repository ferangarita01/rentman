'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LevelProgress from '@/components/LevelProgress';
import { getProfile, getTransactions, Profile } from '@/lib/supabase-client';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = { primary: "#00ff88", bgDark: "#050505", cyberBorder: "#1a2e25" };
  const FONTS = { display: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace" };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    if (!user) return;
    setLoading(true);

    // Load profile
    console.log('👤 ProfilePage: Loading profile for', user.id);
    const { data: profileData, error: profileError } = await getProfile(user.id);

    if (profileError) {
      console.error('❌ ProfilePage: Error loading profile:', profileError);
    }

    if (profileData) {
      console.log('✅ ProfilePage: Loaded profile:', profileData);
      setProfile(profileData);
    } else {
      console.warn('⚠️ ProfilePage: No profile data returned');
    }

    // Load transactions
    const { data: txData } = await getTransactions(user.id);
    if (txData) setTransactions(txData);

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4" style={{ borderColor: COLORS.primary }}></div>
          <p className="text-white">LOADING PROFILE...</p>
        </div>
      </div>
    );
  }

  // Fallback if no profile data found
  if (!profile) {
    return <div className="p-8 text-white text-center">Profile not found. Please contact support.</div>;
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden"
      style={{ backgroundColor: COLORS.bgDark, fontFamily: FONTS.display, backgroundImage: 'radial-gradient(circle at 2px 2px, #00ff8811 1px, transparent 0)', backgroundSize: '24px 24px' }}>

      <div className="flex items-center backdrop-blur-md p-4 pb-2 justify-between sticky top-0 z-50 border-b" style={{ backgroundColor: 'rgba(5,5,5,0.8)', borderColor: COLORS.cyberBorder }}>
        {/* <div className="flex items-center justify-center border rounded" style={{ color: COLORS.primary, borderColor: `${COLORS.primary}4D`, width: '40px', height: '40px' }}>
          <span className="material-symbols-outlined">home_work</span>
        </div> */}
        <h2 className="text-lg font-bold tracking-wider flex-1 text-center uppercase" style={{ color: 'white', fontFamily: FONTS.display }}>Profile</h2>
        <button
          onClick={() => router.push('/settings')}
          className="flex items-center justify-center rounded border"
          style={{ width: '40px', height: '40px', borderColor: COLORS.cyberBorder, color: COLORS.primary }}>
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>

      <div className="flex p-6"><div className="flex w-full flex-col gap-6 items-center">
        <div className="relative">
          <div className="aspect-square rounded-none border-2 p-1 w-32 h-32 flex items-center justify-center" style={{ borderColor: `${COLORS.primary}80`, backgroundColor: '#1a1a1a' }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-6xl" style={{ color: COLORS.primary }}>person</span>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 text-[10px] font-bold uppercase" style={{ backgroundColor: COLORS.primary, color: '#000', fontFamily: FONTS.mono }}>
            Lvl {profile.level || 1}
          </div>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <p className="text-xl font-bold uppercase" style={{ color: 'white', fontFamily: FONTS.mono }}>
            {profile.full_name || user?.email?.split('@')[0] || "Operative"}
          </p>
          <div className="flex items-center gap-2">
            <span className="rounded-full animate-pulse" style={{ width: '8px', height: '8px', backgroundColor: COLORS.primary }}></span>
            <p className="text-xs tracking-widest uppercase" style={{ color: `${COLORS.primary}B3`, fontFamily: FONTS.mono }}>
              System Status: {profile.status || "Optimal"}
            </p>
          </div>
        </div>
      </div></div>

      {/* Growth Section - Sistema de Niveles */}
      {user && (
        <div className="px-4 mb-6">
          <LevelProgress userId={user.id} />
        </div>
      )}

      <div className="mx-4 mb-6 p-6 border relative overflow-hidden" style={{ borderColor: `${COLORS.primary}33`, backgroundColor: `${COLORS.primary}0D` }}>
        <p className="text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: `${COLORS.primary}99`, fontFamily: FONTS.mono }}>Total Net Liquidity</p>
        <h1 className="text-[42px] font-bold" style={{ color: COLORS.primary, fontFamily: FONTS.mono }}>
          ${(profile?.credits || 0).toFixed(2)}
        </h1>
        <div className="mt-4 flex justify-between border-t pt-4" style={{ borderColor: `${COLORS.primary}1A` }}>
          <div>
            <span className="text-[10px] uppercase block" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: FONTS.mono }}>Payout Cycle</span>
            <span className="text-xs" style={{ fontFamily: FONTS.mono }}>WEEKLY</span>
          </div>
          <button className="text-xs font-bold px-4 py-2 uppercase" style={{ backgroundColor: COLORS.primary, color: '#000', fontFamily: FONTS.mono }}>Withdraw</button>
        </div>
      </div>

      <div className="px-4 pb-24">
        {transactions.length > 0 ? (
          <table className="w-full text-left text-[11px] border" style={{ fontFamily: FONTS.mono, borderColor: COLORS.cyberBorder }}>
            <thead style={{ backgroundColor: 'rgba(26,46,37,0.5)' }}><tr className="uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <th className="p-3 font-normal">Timestamp</th><th className="p-3 font-normal">Entity_ID</th><th className="p-3 font-normal text-right">Value</th>
            </tr></thead>
            <tbody>{transactions.map((tx, i) => (
              <tr key={i} className="border-t hover:bg-primary/5" style={{ borderColor: COLORS.cyberBorder }}>
                <td className="p-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="p-3" style={{ color: COLORS.primary }}>RENTMAN DAO</td>
                <td className="p-3 text-right" style={{ color: tx.type === 'credit' ? 'white' : '#ef4444' }}>
                  {tx.type === 'credit' ? '+' : '-'}${tx.amount}
                </td>
              </tr>
            ))}</tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-500 text-xs font-mono">NO TRANSACTIONS RECORDED</div>
        )}
      </div>

      {/* Footer removed to use Global BottomNav */}
    </div>
  );
}
