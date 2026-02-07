'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getTaskById, acceptTask, Task } from '@/lib/supabase-client';
import { supabase } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

export default function ContractDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
    loadTask();
  }, [contractId]);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Current user:', user?.id);
    setUserId(user?.id || null);
  }

  async function loadTask() {
    console.log('📄 Loading contract:', contractId);
    const { data, error } = await getTaskById(contractId);
    
    if (error) {
      console.error('❌ Error loading contract:', error);
    } else {
      console.log('✅ Contract loaded:', data);
      setTask(data);
    }
    setLoading(false);
  }

  async function handleAcceptContract() {
    if (!userId) {
      alert('You must be logged in to accept contracts');
      return;
    }

    if (!task) return;

    setAccepting(true);
    console.log('🎯 Accepting contract:', task.id, 'by user:', userId);

    const { data, error } = await acceptTask(task.id, userId);

    if (error) {
      console.error('❌ Error accepting contract:', error);
      alert('Error accepting contract: ' + error.message);
    } else {
      console.log('✅ Contract accepted:', data);
      alert('Contract accepted successfully! 🎉');
      router.push('/'); // Volver al home
    }

    setAccepting(false);
  }

  const COLORS = { primary: "#00ff88", bgDark: "#050505", cyberGray: "#1a1a1a", borderGray: "#333333" };
  const FONTS = { display: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace" };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.bgDark }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4" 
               style={{ borderColor: COLORS.primary }}></div>
          <p className="text-white" style={{ fontFamily: FONTS.mono }}>LOADING CONTRACT...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.bgDark }}>
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-red-500">error</span>
          <p className="text-white mt-4" style={{ fontFamily: FONTS.mono }}>CONTRACT NOT FOUND</p>
          <button 
            onClick={() => router.back()} 
            className="mt-4 px-6 py-3 rounded font-bold uppercase tracking-widest"
            style={{ backgroundColor: COLORS.primary, color: '#000', fontFamily: FONTS.mono }}>
            GO BACK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-[430px] mx-auto"
      style={{ backgroundColor: COLORS.bgDark, fontFamily: FONTS.display }}>

      {/* Header */}
      <header className="flex items-center backdrop-blur-md sticky top-0 z-10 p-4 border-b space-x-4" 
              style={{ backgroundColor: 'rgba(5,5,5,0.8)', borderColor: COLORS.borderGray }}>
        <button onClick={() => router.back()} className="text-white">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <div className="flex-1">
          <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: COLORS.primary, fontFamily: FONTS.mono }}>
            CONTRACT DETAILS
          </p>
          <h2 className="text-lg font-bold uppercase" style={{ color: 'white', fontFamily: FONTS.mono }}>
            ID: #{task.id.substring(0, 8)}
          </h2>
        </div>
        <span className="material-symbols-outlined" style={{ color: `${COLORS.primary}80` }}>sensors</span>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-6 pb-48">
        {/* Title & Description */}
        <div className="p-4 rounded-lg" style={{ border: `1px solid ${COLORS.primary}33`, backgroundColor: `${COLORS.primary}0D` }}>
          <h1 className="text-2xl font-bold text-white mb-2">{task.title}</h1>
          <p className="text-sm leading-relaxed" style={{ color: '#9ca3af' }}>
            {task.description}
          </p>
          {task.required_skills && task.required_skills.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {task.required_skills.map((skill, i) => (
                <span key={i} className="px-2 py-1 text-xs rounded uppercase" 
                      style={{ backgroundColor: `${COLORS.primary}20`, color: COLORS.primary, fontFamily: FONTS.mono }}>
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Task Type Card */}
        <button onClick={() => router.push('/issuer')} 
                className="flex items-center gap-4 p-4 border rounded-lg w-full text-left hover:bg-white/5" 
                style={{ backgroundColor: `${COLORS.cyberGray}99`, borderColor: COLORS.borderGray }}>
          <div className="flex items-center justify-center rounded border shrink-0" 
               style={{ color: COLORS.primary, borderColor: `${COLORS.primary}4D`, backgroundColor: `${COLORS.primary}1A`, width: '48px', height: '48px' }}>
            <span className="material-symbols-outlined text-3xl">
              {task.task_type === 'delivery' ? 'local_shipping' : 'verified'}
            </span>
          </div>
          <div className="flex flex-col flex-1">
            <p className="text-sm uppercase" style={{ color: 'white', fontFamily: FONTS.mono }}>
              Type: {task.task_type}
            </p>
            <p className="text-xs mt-1 uppercase" style={{ color: '#6b7280', fontFamily: FONTS.mono }}>
              Status: {task.status}
            </p>
          </div>
          <span className="material-symbols-outlined" style={{ color: COLORS.primary }}>arrow_forward_ios</span>
        </button>

        {/* Map Preview */}
        <div className="w-full h-32 rounded-lg border overflow-hidden relative" 
             style={{ borderColor: COLORS.borderGray, backgroundColor: COLORS.cyberGray }}>
          <div className="w-full h-full flex items-center justify-center opacity-40">
            <span className="material-symbols-outlined text-6xl" style={{ color: COLORS.primary }}>map</span>
          </div>
          {task.location_address && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/80 px-2 py-1 rounded">
              <span className="material-symbols-outlined text-xs" style={{ color: COLORS.primary }}>location_on</span>
              <span className="text-[10px] uppercase" style={{ fontFamily: FONTS.mono, color: COLORS.primary }}>
                {task.location_address}
              </span>
            </div>
          )}
        </div>

        {/* Payment Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border" style={{ borderColor: COLORS.borderGray, backgroundColor: COLORS.cyberGray }}>
            <p className="text-[10px] uppercase mb-1" style={{ color: '#6b7280', fontFamily: FONTS.mono }}>Payout</p>
            <p className="text-2xl font-bold" style={{ color: COLORS.primary, fontFamily: FONTS.mono }}>
              ${task.budget_amount}
            </p>
            <p className="text-xs" style={{ color: '#6b7280', fontFamily: FONTS.mono }}>{task.budget_currency}</p>
          </div>
          <div className="p-4 rounded-lg border" style={{ borderColor: COLORS.borderGray, backgroundColor: COLORS.cyberGray }}>
            <p className="text-[10px] uppercase mb-1" style={{ color: '#6b7280', fontFamily: FONTS.mono }}>Payment</p>
            <p className="text-sm font-bold uppercase" style={{ color: 'white', fontFamily: FONTS.mono }}>
              {task.payment_type}
            </p>
            <p className="text-xs" style={{ color: '#6b7280', fontFamily: FONTS.mono }}>{task.payment_status}</p>
          </div>
        </div>
      </main>

      {/* Fixed Footer with Accept Button */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 pt-0 backdrop-blur-md max-w-[430px] mx-auto" 
              style={{ backgroundColor: 'rgba(5,5,5,0.95)' }}>
        <button 
          onClick={handleAcceptContract}
          disabled={accepting || task.status !== 'open'}
          className="w-full py-4 rounded-lg flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            backgroundColor: task.status === 'open' ? COLORS.primary : '#666', 
            boxShadow: task.status === 'open' ? `0 0 20px ${COLORS.primary}66` : 'none' 
          }}>
          {accepting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
              <span className="font-bold text-lg tracking-widest uppercase" 
                    style={{ color: COLORS.bgDark, fontFamily: FONTS.display }}>
                PROCESSING...
              </span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined font-bold" style={{ color: COLORS.bgDark }}>check_circle</span>
              <span className="font-bold text-lg tracking-widest uppercase" 
                    style={{ color: COLORS.bgDark, fontFamily: FONTS.display }}>
                {task.status === 'open' ? 'ACCEPT CONTRACT' : 'ALREADY ASSIGNED'}
              </span>
            </>
          )}
        </button>

        <div className="mt-4 flex justify-between items-center px-2">
          <div className="flex flex-col">
            <p className="text-[10px] uppercase" style={{ color: '#6b7280', fontFamily: FONTS.mono }}>Priority</p>
            <p className="font-bold text-sm" style={{ color: 'white', fontFamily: FONTS.mono }}>
              Level {task.priority}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-[10px] uppercase" style={{ color: '#6b7280', fontFamily: FONTS.mono }}>Created</p>
            <p className="font-bold text-sm uppercase" style={{ color: 'white', fontFamily: FONTS.mono }}>
              {new Date(task.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="h-6"></div>
      </footer>
    </div>
  );
}
