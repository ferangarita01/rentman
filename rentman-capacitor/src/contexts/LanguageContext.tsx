'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// English Only Context
export const translations = {
    en: {
        // App
        'app.title': 'Habit Coach',

        // Navigation
        'nav.today': 'Today',
        'nav.progress': 'Progress',
        'nav.sarah': 'Sarah',
        'nav.settings': 'Settings',

        // Home
        'home.hello': 'Hello!',
        'home.spark': 'Spark',
        'home.morning_checkin': 'Morning Check-in',
        'home.checkin_subtitle': 'Track your wellness pillars',
        'home.todays_habits': "Today's Habits",
        'home.no_habits': 'No habits yet. Create one!',
        'home.smart_nudging': 'Smart Nudging',
        'home.days': 'Days',
        'home.tiny_version': 'Tiny version',
        'home.no_tiny': 'No tiny version',

        // Settings
        'settings.title': 'Settings',
        'settings.subtitle': 'Customize your experience with Sarah',
        'settings.edit': 'Edit',
        'settings.intelligence': 'Intelligence',
        'settings.preferences': 'Preferences',
        'settings.notifications': 'Notifications',
        'settings.notifications_desc': 'Habit reminders',
        'settings.dark_mode': 'Dark Mode',
        'settings.on': 'On',
        'settings.off': 'Off',
        'settings.language': 'Language',
        'settings.about_sarah': 'About Sarah',
        'settings.privacy_policy': 'Privacy Policy',
        'settings.sign_out': 'Sign Out',
        'settings.version': 'Version',
        'settings.made_with': 'Made with ⚡ & ☕',

        // Progress
        'progress.title': 'Your Journey',
        'progress.subtitle': 'Visualize your consistency',
        'progress.total_completed': 'Total Completed',
        'progress.current_streak': 'Current Streak',
        'progress.weekly_overview': 'Weekly Overview',
        'progress.recent_achievements': 'Recent Achievements',

        // Sarah
        'sarah.title': 'Chat with Sarah',
        'sarah.subtitle': 'Your AI Habit Coach',
        'sarah.listening': 'Listening...',
        'sarah.processing': 'Thinking...',
        'sarah.speak': 'Hold to Speak',

        // Auth
        'auth.welcome': 'Welcome to Sarah',
        'auth.signin': 'Sign In',
        'auth.signout': 'Sign Out',

        // Wellness Check-in
        'wellness.title': 'Morning Check-in',
        'wellness.subtitle': 'How are you feeling today?',
        'wellness.track': 'Track your wellness pillars',
        'wellness.done_title': 'Morning Check-in Done',
        'wellness.done_subtitle': 'Great job tracking your wellness!',
        'wellness.sleep_hours': '🌙 Hours of Sleep',
        'wellness.sleep_quality': '😴 Sleep Quality',
        'wellness.stress_level': '😰 Stress Level',
        'wellness.energy_level': '⚡ Energy Level',
        'wellness.mood_overall': '😊 Overall Mood',
        'wellness.nutrition': '🥗 Nutrition & Hydration',
        'wellness.water': 'Water (glasses)',
        'wellness.healthy_meals': 'Healthy Meals',
        'wellness.junk_food': 'Junk / Snacks',
        'wellness.caffeine': 'Caffeine',
        'wellness.alcohol': 'Alcohol',
        'wellness.notes': '📝 Anything else? (optional)',
        'wellness.submit': '✨ Log Check-in',
        'wellness.saving': '⏳ Saving...',
        'wellness.insight': "⚠️ Sarah's Early Insight",

        // Goal Wizard
        'wizard.step1': 'Step 1: Identity',
        'wizard.step1_desc': 'Who do you want to become?',
        'wizard.step1_label': 'I want to be...',
        'wizard.step1_placeholder': 'e.g., A writer, An athlete, Bilingual',
        'wizard.step1_why': 'Why is this important?',
        'wizard.step2': 'Step 2: Strategy',
        'wizard.step2_desc': 'How will we measure short-term success?',
        'wizard.step2_label': 'SMART Objective',
        'wizard.step2_placeholder': 'e.g., Write 1 chapter, Run 5k',
        'wizard.step2_date': 'Target Date',
        'wizard.step3': 'Step 3: The System',
        'wizard.step3_desc': 'What will you do daily?',
        'wizard.step3_label': 'Daily Action',
        'wizard.step3_placeholder': 'e.g., Write 200 words',
        'wizard.anchor': 'Anchor (Trigger)',
        'wizard.anchor_placeholder': 'After I...',
        'wizard.tiny': 'Tiny Version',
        'wizard.tiny_placeholder': '2-min version',
        'wizard.reward': 'Reward',
        'wizard.reward_placeholder': 'e.g., Coffee, 5 min social media...',
        'wizard.back': 'Back',
        'wizard.next': 'Next',
        'wizard.finalize': 'Finalize System 🚀',
        'wizard.saving': 'Saving...'
    }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    // Force English state, ignore localStorage
    const [language] = useState<Language>('en');

    // No useEffect to load stored lang

    // Create a dummy setLanguage that does nothing or warns
    const setLanguage = (lang: Language) => {
        console.warn('Language switching is disabled. Enforcing English.');
    };

    const t = (key: string): string => {
        // Always read from 'en'
        return translations['en'][key as keyof typeof translations['en']] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

