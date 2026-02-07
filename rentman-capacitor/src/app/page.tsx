'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from './auth/page';
import { getTasks, Task } from '@/lib/supabase-client';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  console.log('🏠 HomePage: Render - loading:', loading, '| user:', user?.email || 'NONE');

  // Load tasks from Supabase
  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  async function loadTasks() {
    console.log('📊 Loading tasks from Supabase...');
    setLoadingTasks(true);
    const { data, error } = await getTasks('open');
    
    if (error) {
      console.error('❌ Error loading tasks:', error);
    } else {
      console.log('✅ Loaded tasks:', data?.length || 0);
      setTasks(data || []);
    }
    setLoadingTasks(false);
  }

  // Show loading
  if (loading) {
    console.log('⏳ HomePage: Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if no user
  if (!user) {
    console.log('🔐 HomePage: No user - Showing AuthPage');
    return <AuthPage />;
  }

  // User is logged in - show home
  console.log('✅ HomePage: User authenticated - Showing home content for', user.email);

  const COLORS = {
    primary: "#00ff88",
    bgDark: "#050505",
    cardBorder: "rgba(255,255,255,0.1)",
    cardBg: "#0a0a0a",
  };

  const FONTS = {
    display: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-background-dark overflow-x-hidden"
      style={{ backgroundColor: COLORS.bgDark, fontFamily: FONTS.display }}>

      {/* Header Section */}
      <header className="sticky top-0 z-20 backdrop-blur-md border-b p-4"
        style={{ backgroundColor: 'rgba(5, 5, 5, 0.8)', borderColor: COLORS.cardBorder }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ color: COLORS.primary }}>home_work</span>
            <h1 className="text-white text-lg font-bold tracking-wider uppercase" style={{ fontFamily: FONTS.display }}>Rentman</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-tighter" style={{ fontFamily: FONTS.mono, color: '#6b7280' }}>Status</span>
              <span className="text-[10px]" style={{ fontFamily: FONTS.mono, color: COLORS.primary }}>ONLINE</span>
            </div>
            <button className="text-white">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex border-b px-4" style={{ backgroundColor: COLORS.bgDark, borderColor: COLORS.cardBorder }}>
        <button className="flex flex-col items-center justify-center border-b-2 px-4 py-3" style={{ borderColor: COLORS.primary, color: COLORS.primary }}>
          <p className="text-xs font-bold tracking-widest" style={{ fontFamily: FONTS.mono }}>TASKS</p>
        </button>
        <button className="flex flex-col items-center justify-center border-b-2 border-transparent px-4 py-3" style={{ color: '#6b7280' }}>
          <p className="text-xs font-bold tracking-widest" style={{ fontFamily: FONTS.mono }}>NEARBY</p>
        </button>
        <button className="flex flex-col items-center justify-center border-b-2 border-transparent px-4 py-3" style={{ color: '#6b7280' }}>
          <p className="text-xs font-bold tracking-widest" style={{ fontFamily: FONTS.mono }}>ACTIVE</p>
        </button>
      </nav>

      {/* Main Feed */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        
        {loadingTasks ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-400 text-sm" style={{ fontFamily: FONTS.mono }}>Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-gray-700">work_off</span>
            <p className="text-gray-400 mt-4" style={{ fontFamily: FONTS.mono }}>No tasks available</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div 
              key={task.id}
              onClick={() => window.location.href = `/contract/${task.id}`}
              className="p-4 flex flex-col gap-4 relative overflow-hidden group cursor-pointer active:scale-98 transition-transform" 
              style={{ border: `1px solid ${COLORS.cardBorder}`, backgroundColor: COLORS.cardBg }}>
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.primary }}></span>
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: COLORS.primary, fontFamily: FONTS.mono }}>
                      [{task.status === 'open' ? 'VERIFIED_ISSUER' : task.status.toUpperCase()}]
                    </p>
                  </div>
                  <h3 className="text-white text-base font-bold leading-tight mt-1 uppercase" style={{ fontFamily: FONTS.mono }}>
                    {task.title}
                  </h3>
                </div>
                <span className="material-symbols-outlined text-gray-600 group-hover:text-primary transition-colors">
                  {task.task_type === 'delivery' ? 'local_shipping' : task.task_type === 'verification' ? 'verified' : 'work'}
                </span>
              </div>
              
              <div className="w-full h-32 bg-gray-900 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <div className="w-full h-full bg-gray-800 opacity-60 flex items-center justify-center">
                  <span className="material-symbols-outlined text-gray-600 text-6xl">
                    {task.task_type === 'delivery' ? 'package' : task.task_type === 'verification' ? 'fact_check' : 'construction'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4" style={{ borderColor: COLORS.cardBorder }}>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase" style={{ color: '#6b7280', fontFamily: FONTS.mono }}>Reward</span>
                  <span className="text-lg font-bold" style={{ color: COLORS.primary, fontFamily: FONTS.mono }}>
                    ${task.budget_amount} {task.budget_currency}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase" style={{ color: '#6b7280', fontFamily: FONTS.mono }}>Location</span>
                  <span className="text-white text-xs truncate" style={{ fontFamily: FONTS.mono }}>
                    {task.location_address || 'Remote'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span className="text-[10px] uppercase" style={{ fontFamily: FONTS.mono }}>
                    Posted {new Date(task.created_at).toLocaleDateString()}
                  </span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/contract/${task.id}`);
                  }}
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-tighter hover:bg-[#00cc6d] transition-colors"
                  style={{ backgroundColor: COLORS.primary, color: 'black', fontFamily: FONTS.mono }}>
                  VIEW_TASK
                </button>
              </div>
            </div>
          ))
        )}

      </main>

      {/* Fixed Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t pb-8 pt-2 px-6"
        style={{ backgroundColor: 'rgba(5, 5, 5, 0.95)', borderColor: COLORS.cardBorder }}>
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div className="flex flex-col items-center gap-1" style={{ color: COLORS.primary }}>
            <span className="material-symbols-outlined">work</span>
            <span className="text-[8px] uppercase font-bold tracking-widest" style={{ fontFamily: FONTS.mono }}>Tasks</span>
          </div>
          <button className="flex flex-col items-center gap-1 text-gray-600 hover:text-white transition-colors">
            <span className="material-symbols-outlined">explore</span>
            <span className="text-[8px] uppercase font-bold tracking-widest" style={{ fontFamily: FONTS.mono }}>Explore</span>
          </button>
          <div className="relative -top-6">
            <button className="p-4 rounded-full shadow-[0_0_20px_rgba(0,255,136,0.3)]" style={{ backgroundColor: COLORS.primary }}>
              <span className="material-symbols-outlined text-black font-bold">add</span>
            </button>
          </div>
          <button className="flex flex-col items-center gap-1 text-gray-600 hover:text-white transition-colors">
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span className="text-[8px] uppercase font-bold tracking-widest" style={{ fontFamily: FONTS.mono }}>Wallet</span>
          </button>
          <button 
            onClick={() => window.location.href = '/profile'}
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-white transition-colors">
            <span className="material-symbols-outlined">person</span>
            <span className="text-[8px] uppercase font-bold tracking-widest" style={{ fontFamily: FONTS.mono }}>Profile</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
