import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';

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
  BEGINNER: ['#3B82F6', '#1E40AF'], // Blue
  EASY: ['#10B981', '#047857'],     // Green
  MEDIUM: ['#F59E0B', '#D97706'],   // Orange
  HARD: ['#EF4444', '#B91C1C'],     // Red
  EXPERT: ['#8B5CF6', '#6D28D9']    // Purple
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
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando progreso...</Text>
      </View>
    );
  }

  const levelColors = LEVEL_COLORS[progress.current_level as keyof typeof LEVEL_COLORS] || LEVEL_COLORS.BEGINNER;
  const levelIcon = LEVEL_ICONS[progress.current_level as keyof typeof LEVEL_ICONS] || '🌱';

  return (
    <LinearGradient
      colors={levelColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.icon}>{levelIcon}</Text>
        <Text style={styles.levelTitle}>{progress.current_level}</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>⭐ {progress.reputation_current.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Reputación</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>📦 {progress.tasks_completed}</Text>
          <Text style={styles.statLabel}>Completadas</Text>
        </View>
      </View>

      {/* Progress Bar */}
      {progress.next_level !== 'MAX_LEVEL' && (
        <>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress.progress_percentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{progress.progress_percentage}%</Text>
          </View>

          {/* Next Level Info */}
          <View style={styles.nextLevelContainer}>
            <Text style={styles.nextLevelTitle}>
              Próximo Nivel: {LEVEL_ICONS[progress.next_level as keyof typeof LEVEL_ICONS]} {progress.next_level}
            </Text>
            <Text style={styles.nextLevelRequirements}>
              {progress.tasks_needed_for_next > 0 
                ? `${progress.tasks_needed_for_next} tareas más`
                : '✅ Tareas completas'}
            </Text>
            {progress.reputation_current < progress.reputation_needed && (
              <Text style={styles.nextLevelRequirements}>
                Necesitas {progress.reputation_needed}⭐ (tienes {progress.reputation_current.toFixed(1)}⭐)
              </Text>
            )}
          </View>
        </>
      )}

      {progress.next_level === 'MAX_LEVEL' && (
        <View style={styles.maxLevelContainer}>
          <Text style={styles.maxLevelText}>🎉 ¡Nivel Máximo Alcanzado!</Text>
          <Text style={styles.maxLevelSubtext}>Eres un experto de Rentman</Text>
        </View>
      )}

      {/* Motivational Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>
          {getMotivationalMessage(progress.current_level, progress.tasks_completed)}
        </Text>
      </View>
    </LinearGradient>
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

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 48,
    marginRight: 12,
  },
  levelTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 6,
  },
  progressText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  nextLevelContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  nextLevelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  nextLevelRequirements: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  maxLevelContainer: {
    alignItems: 'center',
    padding: 20,
  },
  maxLevelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  maxLevelSubtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  messageContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFF',
  },
  messageText: {
    color: '#FFF',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
