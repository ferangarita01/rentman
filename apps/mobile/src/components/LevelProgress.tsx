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
  BEGINNER: 'from-blue-600 to-blue-800',
  EASY: 'from-green-600 to-green-800',
  MEDIUM: 'from-orange-600 to-orange-800',
  HARD: 'from-red-600 to-red-800',
  EXPERT: 'from-purple-600 to-purple-800'
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
        <p className="text-white text-center">Cargando progreso...</p>
      </div>
    );
  }

  const levelGradient = LEVEL_COLORS[progress.current_level as keyof typeof LEVEL_COLORS] || LEVEL_COLORS.BEGINNER;
  const levelIcon = LEVEL_ICONS[progress.current_level as keyof typeof LEVEL_ICONS] || '🌱';

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${levelGradient} p-6 shadow-xl my-4`}>
      {/* Header */}
      <div className="flex items-center mb-6">
        <span className="text-5xl mr-3">{levelIcon}</span>
        <h2 className="text-3xl font-bold text-white uppercase tracking-wider">
          {progress.current_level}
        </h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white mb-1">
            ⭐ {progress.reputation_current.toFixed(1)}
          </p>
          <p className="text-xs text-white/80">Reputación</p>
        </div>
        <div className="bg-white/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white mb-1">
            📦 {progress.tasks_completed}
          </p>
          <p className="text-xs text-white/80">Completadas</p>
        </div>
      </div>

      {/* Progress Bar */}
      {progress.next_level !== 'MAX_LEVEL' && (
        <>
          <div className="mb-4">
            <div className="h-3 bg-white/30 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progress.progress_percentage}%` }}
              />
            </div>
            <p className="text-white text-sm text-right font-bold">
              {progress.progress_percentage}%
            </p>
          </div>

          {/* Next Level Info */}
          <div className="bg-white/15 rounded-xl p-4 mb-4">
            <p className="text-lg font-bold text-white mb-2">
              Próximo Nivel: {LEVEL_ICONS[progress.next_level as keyof typeof LEVEL_ICONS]} {progress.next_level}
            </p>
            <p className="text-sm text-white/90">
              {progress.tasks_needed_for_next > 0
                ? `${progress.tasks_needed_for_next} tareas más`
                : '✅ Tareas completas'}
            </p>
            {progress.reputation_current < progress.reputation_needed && (
              <p className="text-sm text-white/90 mt-1">
                Necesitas {progress.reputation_needed}⭐ (tienes {progress.reputation_current.toFixed(1)}⭐)
              </p>
            )}
          </div>
        </>
      )}

      {progress.next_level === 'MAX_LEVEL' && (
        <div className="text-center py-6">
          <p className="text-2xl font-bold text-white mb-2">
            🎉 ¡Nivel Máximo Alcanzado!
          </p>
          <p className="text-white/90">Eres un experto de Rentman</p>
        </div>
      )}

      {/* Motivational Message */}
      <div className="bg-white/10 rounded-xl p-3 border-l-4 border-white">
        <p className="text-white text-sm italic">
          {getMotivationalMessage(progress.current_level, progress.tasks_completed)}
        </p>
      </div>
    </div>
  );
}

function getMotivationalMessage(level: string, tasksCompleted: number): string {
  if (tasksCompleted === 0) {
    return '🎉 ¡Bienvenido! Completa tu primera tarea para comenzar.';
  }
  if (tasksCompleted < 5) {
    return '💪 ¡Excelente inicio! Cada tarea te acerca al siguiente nivel.';
  }
  if (tasksCompleted < 10) {
    return '⭐ Vas por buen camino. Tu reputación está creciendo.';
  }
  if (tasksCompleted < 25) {
    return '🚀 ¡Ya eres parte activa de la comunidad!';
  }
  if (tasksCompleted < 50) {
    return '🔥 ¡Impresionante progreso! Casi llegas a EXPERT.';
  }
  return '👑 Gracias por ser un pilar de Rentman.';
}
