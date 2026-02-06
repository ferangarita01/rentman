'use client';

import { useState, useEffect } from 'react';

interface ThoughtBubbleProps {
  userName: string;
  habits: Array<{
    name: string;
    current_streak: number;
    completed_today?: boolean;
    category?: string;
  }>;
  totalStreak: number;
  darkMode: boolean;
}

export default function ThoughtBubble({ userName, habits, totalStreak, darkMode }: ThoughtBubbleProps) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMessage(generateMessage());
  }, [habits, userName, totalStreak]);

  const generateMessage = () => {
    const hour = new Date().getHours();
    const firstName = userName.split(' ')[0];

    // Priority 1: Celebrate completed habits
    const completedToday = habits.filter(h => h.completed_today);
    if (completedToday.length === habits.length && habits.length > 0) {
      return `🏆 ¡${firstName}, completaste todo hoy! ¡Eres increíble!`;
    }

    // Priority 2: Encourage pending habits
    const pendingHabits = habits.filter(h => !h.completed_today);
    if (pendingHabits.length > 0) {
      const randomPending = pendingHabits[Math.floor(Math.random() * pendingHabits.length)];
      
      // Time-based messages
      if (hour < 12) {
        return `☀️ ¡${firstName}, hoy es un gran día para tu hábito de ${randomPending.name}!`;
      } else if (hour < 18) {
        return `💪 ¡${firstName}, aún tienes tiempo para ${randomPending.name}!`;
      } else {
        return `🌙 ¡${firstName}, cierra el día con ${randomPending.name}!`;
      }
    }

    // Priority 3: Streak celebration
    if (totalStreak >= 7) {
      return `🔥 ¡${firstName}, ${totalStreak} días de racha! ¡Imparable!`;
    }

    // Priority 4: Motivation for new users
    if (habits.length === 0) {
      return `✨ ¡${firstName}, empieza tu primer hábito hoy!`;
    }

    // Default
    return `💫 ¡${firstName}, cada pequeño paso cuenta!`;
  };

  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Thought Bubble */}
      <div 
        className={`
          relative px-4 py-3 rounded-2xl 
          ${darkMode 
            ? 'bg-gradient-to-r from-gray-800/90 to-gray-700/90 border border-white/10' 
            : 'bg-gradient-to-r from-white/95 to-gray-50/95 border border-gray-200/50 shadow-lg'
          }
        `}
      >
        {/* Message */}
        <p className={`text-sm font-medium leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          {message}
        </p>
        
        {/* Bubble tail (pointing to avatar) */}
        <div 
          className={`
            absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0
            border-t-[8px] border-t-transparent
            border-r-[10px] ${darkMode ? 'border-r-gray-800/90' : 'border-r-white/95'}
            border-b-[8px] border-b-transparent
          `}
        />
      </div>
    </div>
  );
}
