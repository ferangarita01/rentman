import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LevelProgress from '../../components/LevelProgress';
import { useAuth } from '../../lib/supabase';
import { router } from 'expo-router';

export default function GrowthScreen() {
  const { user } = useAuth();

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Debes iniciar sesión</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1E1E1E', '#2A2A2A']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Mi Crecimiento</Text>
        <Text style={styles.headerSubtitle}>Sistema de niveles inclusivo</Text>
      </LinearGradient>

      {/* Level Progress Card */}
      <View style={styles.content}>
        <LevelProgress userId={user.id} />

        {/* How it Works */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>🎯 ¿Cómo Funciona?</Text>
          <Text style={styles.infoText}>
            Rentman usa un sistema de niveles para asegurar que todos tengan oportunidad de crecer:
          </Text>
          
          <View style={styles.levelsList}>
            <LevelCard
              icon="🌱"
              level="BEGINNER"
              tasks="0 tareas"
              description="Acceso a tareas EASY para comenzar"
              color="#3B82F6"
            />
            <LevelCard
              icon="⚡"
              level="EASY"
              tasks="1-9 tareas"
              description="Acceso a tareas EASY y MEDIUM"
              color="#10B981"
            />
            <LevelCard
              icon="🔥"
              level="MEDIUM"
              tasks="10-24 tareas"
              description="Acceso a tareas MEDIUM y HARD"
              color="#F59E0B"
            />
            <LevelCard
              icon="💎"
              level="HARD"
              tasks="25-49 tareas"
              description="Acceso a tareas HARD y EXPERT"
              color="#EF4444"
            />
            <LevelCard
              icon="👑"
              level="EXPERT"
              tasks="50+ tareas"
              description="Acceso a todas las tareas + bonus mentoría"
              color="#8B5CF6"
            />
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>✨ Beneficios del Sistema</Text>
          
          <BenefitItem
            icon="🎲"
            title="Sistema de Rotación"
            description="No siempre ganan los mismos. Top #1 (50%), #2 (30%), #3 (20%)"
          />
          <BenefitItem
            icon="💰"
            title="Bonus por Mentoría"
            description="Expertos ganan $5 USD por ayudar a principiantes"
          />
          <BenefitItem
            icon="⭐"
            title="Reputación Bidireccional"
            description="Tú calificas a los agentes, ellos te califican a ti"
          />
          <BenefitItem
            icon="📈"
            title="Progresión Clara"
            description="Siempre sabes cuánto falta para el siguiente nivel"
          />
        </View>

        {/* CTA */}
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={() => router.push('/(tabs)')}
        >
          <LinearGradient
            colors={['#10B981', '#047857']}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>Ver Tareas Disponibles</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

interface LevelCardProps {
  icon: string;
  level: string;
  tasks: string;
  description: string;
  color: string;
}

function LevelCard({ icon, level, tasks, description, color }: LevelCardProps) {
  return (
    <View style={[styles.levelCard, { borderLeftColor: color }]}>
      <View style={styles.levelCardHeader}>
        <Text style={styles.levelIcon}>{icon}</Text>
        <View style={styles.levelCardInfo}>
          <Text style={styles.levelCardTitle}>{level}</Text>
          <Text style={styles.levelCardTasks}>{tasks}</Text>
        </View>
      </View>
      <Text style={styles.levelCardDescription}>{description}</Text>
    </View>
  );
}

interface BenefitItemProps {
  icon: string;
  title: string;
  description: string;
}

function BenefitItem({ icon, title, description }: BenefitItemProps) {
  return (
    <View style={styles.benefitItem}>
      <Text style={styles.benefitIcon}>{icon}</Text>
      <View style={styles.benefitContent}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  content: {
    padding: 16,
  },
  errorText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  infoSection: {
    marginTop: 24,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    marginBottom: 16,
  },
  levelsList: {
    gap: 12,
  },
  levelCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  levelCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  levelCardInfo: {
    flex: 1,
  },
  levelCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  levelCardTasks: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  levelCardDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  ctaButton: {
    marginTop: 24,
    marginBottom: 40,
  },
  ctaGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
