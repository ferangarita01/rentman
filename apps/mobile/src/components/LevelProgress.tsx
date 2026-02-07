'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

interface LevelProgressProps {
  userId: string;
}

interface ProgressData {
  current_level: string;
  tasks_completed: number;
  tasks_needed_for_next: number;
  next_level: string;
  reputation_current: number;
  reputation_needed: number;
  progress_percentage: number;
}

const LEVEL_COLORS = {
  BEGINNER: 'from-[#00ff88]/10 to-[#00ff88]/5 border-[#00ff88]/20',
  EASY: 'from-[#00ff88]/20 to-[#00ff88]/10 border-[#00ff88]/30',
  MEDIUM: 'from-[#00ff88]/30 to-[#00ff88]/20 border-[#00ff88]/40',
  HARD: 'from-[#00ff88]/40 to-[#00ff88]/30 border-[#00ff88]/50',
  EXPERT: 'from-[#00ff88]/50 to-[#00ff88]/40 border-[#00ff88]/60'
};

const LEVEL_ICONS = {
  BEGINNER: '🌱',
  EASY: '⚡',
  MEDIUM: '🔥',
  HARD: '💎',
  EXPERT: '👑'
};

export default function LevelProgress({ userId }: LevelProgressProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [userId]);

  const loadProgress = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_level_progress', { p_human_id: userId });

      if (error) throw error;
      if (data && data.length > 0) {
        setProgress(data[0]);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !progress) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 p-6 shadow-lg">
        <p className="text-white text-center">Loading progress...</p>
      </div>
    );
  }

  const levelGradient = LEVEL_COLORS[progress.current_level as keyof typeof LEVEL_COLORS] || LEVEL_COLORS.BEGINNER;
  const levelIcon = LEVEL_ICONS[progress.current_level as keyof typeof LEVEL_ICONS] || '🌱';

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${levelGradient} p-6 shadow-[0_0_20px_rgba(0,255,136,0.1)] my-4 border active:scale-98 transition-transform`}>
      {/* Header */}
      <div className="flex items-center mb-6">
        <span className="text-5xl mr-3">{levelIcon}</span>
        <h2 className="text-3xl font-bold text-white uppercase tracking-wider">
          {progress.current_level}
        </h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#050505]/50 rounded-xl p-3 text-center border border-[#00ff88]/20">
          <p className="text-2xl font-bold text-[#00ff88] mb-1 font-mono">
            ⭐ {(progress?.reputation_current || 0).toFixed(1)}
          </p>
          <p className="text-xs text-gray-400 font-mono tracking-widest uppercase">Reputation</p>
        </div>
        <div className="bg-[#050505]/50 rounded-xl p-3 text-center border border-[#00ff88]/20">
          <p className="text-2xl font-bold text-[#00ff88] mb-1 font-mono">
            📦 {progress?.tasks_completed || 0}
          </p>
          <p className="text-xs text-gray-400 font-mono tracking-widest uppercase">Completed</p>
        </div>
      </div>

      {/* Progress Bar */}
      {progress?.next_level !== 'MAX_LEVEL' && (
        <>
          <div className="mb-4">
            <div className="h-3 bg-[#050505]/50 rounded-full overflow-hidden mb-2 border border-[#00ff88]/20">
              <div
                className="h-full bg-[#00ff88] rounded-full transition-all duration-500 shadow-[0_0_10px_#00ff88]"
                style={{ width: `${progress?.progress_percentage || 0}%` }}
              />
            </div>
            <p className="text-[#00ff88] text-sm text-right font-bold font-mono">
              {progress?.progress_percentage || 0}%
            </p>
          </div>

          {/* Next Level Info */}
          <div className="bg-[#050505]/50 rounded-xl p-4 mb-4 border border-[#00ff88]/20">
            <p className="text-lg font-bold text-white mb-2 font-mono uppercase">
              Next Level: {LEVEL_ICONS[progress?.next_level as keyof typeof LEVEL_ICONS]} {progress?.next_level}
            </p>
            <p className="text-sm text-gray-400 font-mono">
              {(progress?.tasks_needed_for_next || 0) > 0
                ? `${progress?.tasks_needed_for_next} more tasks`
                : '✅ Tasks Completed'}
            </p>
            {(progress?.reputation_current || 0) < (progress?.reputation_needed || 0) && (
              <p className="text-sm text-gray-400 mt-1 font-mono">
                Need {progress?.reputation_needed}⭐ (have {(progress?.reputation_current || 0).toFixed(1)}⭐)
              </p>
            )}
          </div>
        </>
      )}

      {progress.next_level === 'MAX_LEVEL' && (
        <div className="text-center py-6">
          <p className="text-2xl font-bold text-white mb-2">
            🎉 Max Level Reached!
          </p>
          <p className="text-white/90">You are a Rentman Expert</p>
        </div>
      )}

      {/* Motivational Message */}
      <div className="bg-[#050505]/50 rounded-xl p-3 border-l-4 border-[#00ff88]">
        <p className="text-gray-300 text-sm italic font-mono">
          {getMotivationalMessage(progress.current_level, progress.tasks_completed)}
        </p>
      </div>
    </div>
  );
}

function getMotivationalMessage(level: string, tasksCompleted: number): string {
  if (tasksCompleted === 0) {
    return '🎉 Welcome! Complete your first task to begin.';
  }
  if (tasksCompleted < 5) {
    return '💪 Great start! Every task brings you closer to the next level.';
  }
  if (tasksCompleted < 10) {
    return '⭐ You are on the right track. Your reputation is growing.';
  }
  if (tasksCompleted < 25) {
    return '🚀 You are an active part of the community!';
  }
  if (tasksCompleted < 50) {
    return '🔥 Impressive progress! Almost at EXPERT.';
  }
  return '👑 Thank you for being a Rentman pillar.';
}
