'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface WellnessData {
    sleep_hours: number;
    sleep_quality: number;
    stress_level: number;
    energy_level: number;
    mood_overall: number;
    water_glasses: number;
    meals_logged: number;
    healthy_meals: number;
    junk_food_count: number;
    caffeine_drinks: number;
    alcohol_drinks: number;
    nutrition_notes: string;
    notes: string;
}

interface WellnessCheckInProps {
    onComplete?: (data: WellnessData) => void;
    compact?: boolean;
}

const SLEEP_EMOJIS = ['😵', '😴', '😐', '🙂', '🤩'];
// No stress emojis constant needed as they are inline or logic based? Actually they were missing from original snippet or used differently. 
// Re-adding based on standard usage if needed, but the original code used logic for stress colors. 
// Let's stick to the visual logic from previous view.

export default function WellnessCheckIn({ onComplete, compact = false }: WellnessCheckInProps) {
    const { isDark } = useTheme();
    const { user } = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [hasCheckedIn, setHasCheckedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [sleepHours, setSleepHours] = useState(7);
    const [sleepQuality, setSleepQuality] = useState(3);
    const [stressLevel, setStressLevel] = useState(5);
    const [energyLevel, setEnergyLevel] = useState(5);
    const [moodOverall, setMoodOverall] = useState(5);

    // Nutrition State
    const [waterGlasses, setWaterGlasses] = useState(0);
    const [healthyMeals, setHealthyMeals] = useState(0);
    const [junkFood, setJunkFood] = useState(0);
    const [caffeine, setCaffeine] = useState(0);
    const [alcohol, setAlcohol] = useState(0);

    const [notes, setNotes] = useState('');

    // Check if user already logged today
    useEffect(() => {
        async function checkTodayWellness() {
            if (!user?.id) {
                setIsLoading(false);
                return;
            }

            try {
                const today = new Date().toISOString().split('T')[0];
                const { data, error } = await supabase
                    .from('daily_wellness')
                    .select('id, morning_checkin_done')
                    .eq('user_id', user.id)
                    .eq('date', today)
                    .single();

                if (data?.morning_checkin_done) {
                    setHasCheckedIn(true);
                }
            } catch (err) {
                // No entry yet - that's fine
            } finally {
                setIsLoading(false);
            }
        }

        checkTodayWellness();
    }, [user?.id]);

    const handleSubmit = async () => {
        if (!user?.id) return;

        setIsSaving(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            const wellnessData: WellnessData = {
                sleep_hours: sleepHours,
                sleep_quality: sleepQuality,
                stress_level: stressLevel,
                energy_level: energyLevel,
                mood_overall: moodOverall,
                water_glasses: waterGlasses,
                meals_logged: healthyMeals + junkFood, // Simple estimation
                healthy_meals: healthyMeals,
                junk_food_count: junkFood,
                caffeine_drinks: caffeine,
                alcohol_drinks: alcohol,
                nutrition_notes: '',
                notes
            };

            const { error } = await supabase
                .from('daily_wellness')
                .upsert({
                    user_id: user.id,
                    date: today,
                    ...wellnessData,
                    morning_checkin_done: true,
                    source: 'manual',
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,date'
                });

            if (error) throw error;

            setHasCheckedIn(true);
            setIsOpen(false);
            onComplete?.(wellnessData);

        } catch (err) {
            console.error('Error saving wellness:', err);
        } finally {
            setIsSaving(false);
        }
    };

    // Don't show if loading or already checked in
    if (isLoading) {
        return null;
    }

    if (hasCheckedIn && !isOpen) {
        return (
            <div
                className="p-4 rounded-2xl border flex items-center gap-3"
                style={{
                    backgroundColor: 'var(--sarah-surface)',
                    borderColor: isDark ? '#374151' : '#E5E7EB'
                }}
            >
                <span className="text-2xl">✅</span>
                <div className="flex-1">
                    <div className="font-medium text-primary-global">Morning Check-in Done</div>
                    <div className="text-sm text-secondary-global">Great job tracking your wellness!</div>
                </div>
            </div>
        );
    }

    // Compact trigger button
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 rounded-[2rem] p-5 flex items-center justify-between shadow-lg shadow-fuchsia-900/30 active:scale-[0.98] transition-transform duration-200"
            >
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center shadow-sm text-white">
                        <span className="text-2xl">🌅</span>
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-xl font-semibold text-white tracking-tight">Morning Check-in</span>
                        <span className="text-base font-medium text-white/90">How are you feeling today?</span>
                    </div>
                </div>
                <div className="text-white/80 w-6 h-6 flex items-center justify-center font-bold text-xl">→</div>
            </button>
        );
    }

    // Full check-in form
    return (
        <div
            className="rounded-2xl border overflow-hidden"
            style={{
                backgroundColor: 'var(--sarah-surface)',
                borderColor: isDark ? '#374151' : '#E5E7EB'
            }}
        >
            {/* Header */}
            <div
                className="p-4 flex items-center justify-between"
                style={{ background: 'var(--sarah-gradient-cta)' }}
            >
                <div className="flex items-center gap-3 text-white">
                    <span className="text-2xl">🌅</span>
                    <div>
                        <div className="font-bold">Morning Check-in</div>
                        <div className="text-sm opacity-90">Track your wellness pillars</div>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/80 hover:text-white text-xl"
                >
                    ✕
                </button>
            </div>

            <div className="p-5 space-y-6">
                {/* Sleep Hours */}
                <div>
                    <label className="flex items-center justify-between mb-2">
                        <span className="font-medium text-primary-global">
                            🌙 Hours of Sleep
                        </span>
                        <span className="text-lg font-bold" style={{ color: 'var(--sarah-primary)' }}>
                            {sleepHours}h
                        </span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="12"
                        step="0.5"
                        value={sleepHours}
                        onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, var(--sarah-primary) ${(sleepHours / 12) * 100}%, ${isDark ? '#374151' : '#E5E7EB'} ${(sleepHours / 12) * 100}%)`
                        }}
                    />
                    <div className="flex justify-between text-xs text-muted-global mt-1">
                        <span>0h</span>
                        <span>6h</span>
                        <span>12h</span>
                    </div>
                </div>

                {/* Sleep Quality */}
                <div>
                    <label className="block font-medium text-primary-global mb-2">
                        😴 Sleep Quality
                    </label>
                    <div className="flex justify-between gap-2">
                        {SLEEP_EMOJIS.map((emoji, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSleepQuality(idx + 1)}
                                className={`flex-1 py-3 text-2xl rounded-xl border transition-all ${sleepQuality === idx + 1 ? 'scale-110' : 'opacity-50 hover:opacity-75'
                                    }`}
                                style={{
                                    backgroundColor: sleepQuality === idx + 1
                                        ? 'var(--sarah-primary)'
                                        : isDark ? '#374151' : '#F3F4F6',
                                    borderColor: sleepQuality === idx + 1
                                        ? 'var(--sarah-primary)'
                                        : isDark ? '#4B5563' : '#E5E7EB'
                                }}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stress Level */}
                <div>
                    <label className="flex items-center justify-between mb-2">
                        <span className="font-medium text-primary-global">
                            😰 Stress Level
                        </span>
                        <span className="text-lg font-bold" style={{
                            color: stressLevel > 7 ? '#EF4444' : stressLevel > 4 ? '#F59E0B' : '#10B981'
                        }}>
                            {stressLevel}/10
                        </span>
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={stressLevel}
                        onChange={(e) => setStressLevel(parseInt(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, 
                ${stressLevel > 7 ? '#EF4444' : stressLevel > 4 ? '#F59E0B' : '#10B981'} ${(stressLevel / 10) * 100}%, 
                ${isDark ? '#374151' : '#E5E7EB'} ${(stressLevel / 10) * 100}%)`
                        }}
                    />
                    <div className="flex justify-between text-xs text-muted-global mt-1">
                        <span>😌 Zen</span>
                        <span>😰 Overwhelmed</span>
                    </div>
                </div>

                {/* Energy Level */}
                <div>
                    <label className="flex items-center justify-between mb-2">
                        <span className="font-medium text-primary-global">
                            ⚡ Energy Level
                        </span>
                        <span className="text-lg font-bold" style={{
                            color: energyLevel < 4 ? '#EF4444' : energyLevel < 7 ? '#F59E0B' : '#10B981'
                        }}>
                            {energyLevel}/10
                        </span>
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={energyLevel}
                        onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, 
                ${energyLevel < 4 ? '#EF4444' : energyLevel < 7 ? '#F59E0B' : '#10B981'} ${(energyLevel / 10) * 100}%, 
                ${isDark ? '#374151' : '#E5E7EB'} ${(energyLevel / 10) * 100}%)`
                        }}
                    />
                    <div className="flex justify-between text-xs text-muted-global mt-1">
                        <span>🪫 Exhausted</span>
                        <span>🔋 Energized</span>
                    </div>
                </div>

                {/* Mood */}
                <div>
                    <label className="flex items-center justify-between mb-2">
                        <span className="font-medium text-primary-global">
                            😊 Overall Mood
                        </span>
                        <span className="text-lg font-bold" style={{ color: 'var(--sarah-primary)' }}>
                            {moodOverall}/10
                        </span>
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={moodOverall}
                        onChange={(e) => setMoodOverall(parseInt(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, var(--sarah-primary) ${(moodOverall / 10) * 100}%, ${isDark ? '#374151' : '#E5E7EB'} ${(moodOverall / 10) * 100}%)`
                        }}
                    />
                </div>

                {/* Nutrition Section */}
                <div>
                    <label className="block font-medium text-primary-global mb-3">
                        🥗 Nutrition & Hydration
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Water */}
                        <div className="p-3 rounded-xl border flex flex-col items-center" style={{ backgroundColor: isDark ? '#1F2937' : '#EFF6FF', borderColor: isDark ? '#374151' : '#DBEAFE' }}>
                            <span className="text-2xl mb-1">💧</span>
                            <span className="text-xs text-muted-global mb-2">Water (glasses)</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold"
                                >-</button>
                                <span className="text-xl font-bold">{waterGlasses}</span>
                                <button
                                    onClick={() => setWaterGlasses(waterGlasses + 1)}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold"
                                >+</button>
                            </div>
                        </div>

                        {/* Healthy Meals */}
                        <div className="p-3 rounded-xl border flex flex-col items-center" style={{ backgroundColor: isDark ? '#1F2937' : '#ECFDF5', borderColor: isDark ? '#374151' : '#D1FAE5' }}>
                            <span className="text-2xl mb-1">🥗</span>
                            <span className="text-xs text-muted-global mb-2">Healthy Meals</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setHealthyMeals(Math.max(0, healthyMeals - 1))}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold"
                                >-</button>
                                <span className="text-xl font-bold">{healthyMeals}</span>
                                <button
                                    onClick={() => setHealthyMeals(healthyMeals + 1)}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold"
                                >+</button>
                            </div>
                        </div>

                        {/* Junk Food */}
                        <div className="p-3 rounded-xl border flex flex-col items-center" style={{ backgroundColor: isDark ? '#1F2937' : '#FFF1F2', borderColor: isDark ? '#374151' : '#FFE4E6' }}>
                            <span className="text-2xl mb-1">🍔</span>
                            <span className="text-xs text-muted-global mb-2">Junk / Snacks</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setJunkFood(Math.max(0, junkFood - 1))}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold"
                                >-</button>
                                <span className="text-xl font-bold">{junkFood}</span>
                                <button
                                    onClick={() => setJunkFood(junkFood + 1)}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold"
                                >+</button>
                            </div>
                        </div>

                        {/* Caffeine */}
                        <div className="p-3 rounded-xl border flex flex-col items-center" style={{ backgroundColor: isDark ? '#1F2937' : '#FEF3C7', borderColor: isDark ? '#374151' : '#FDE68A' }}>
                            <span className="text-2xl mb-1">☕</span>
                            <span className="text-xs text-muted-global mb-2">Caffeine</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setCaffeine(Math.max(0, caffeine - 1))}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold"
                                >-</button>
                                <span className="text-xl font-bold">{caffeine}</span>
                                <button
                                    onClick={() => setCaffeine(caffeine + 1)}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold"
                                >+</button>
                            </div>
                        </div>

                        {/* Alcohol */}
                        <div className="p-3 rounded-xl border flex flex-col items-center" style={{ backgroundColor: isDark ? '#1F2937' : '#EDE9FE', borderColor: isDark ? '#374151' : '#DDD6FE' }}>
                            <span className="text-2xl mb-1">🍷</span>
                            <span className="text-xs text-muted-global mb-2">Alcohol</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setAlcohol(Math.max(0, alcohol - 1))}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold"
                                >-</button>
                                <span className="text-xl font-bold">{alcohol}</span>
                                <button
                                    onClick={() => setAlcohol(alcohol + 1)}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold"
                                >+</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block font-medium text-primary-global mb-2">
                        📝 Anything else? (optional)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Woke up at 3am, feeling anxious about presentation..."
                        className="w-full p-3 rounded-xl border resize-none text-sm"
                        style={{
                            backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                            borderColor: isDark ? '#374151' : '#E5E7EB',
                            color: isDark ? '#F9FAFB' : '#111827'
                        }}
                        rows={2}
                    />
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-[1.02] disabled:opacity-50"
                    style={{ background: 'var(--sarah-gradient-cta)' }}
                >
                    {isSaving ? '⏳ Saving...' : '✨ Log Check-in'}
                </button>

                {/* Insights Preview */}
                {(sleepHours < 6 || stressLevel > 7 || energyLevel < 4) && (
                    <div
                        className="p-4 rounded-xl border"
                        style={{
                            backgroundColor: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                            borderColor: '#F59E0B'
                        }}
                    >
                        <div className="font-medium text-sm mb-2" style={{ color: '#F59E0B' }}>
                            ⚠️ Sarah&apos;s Early Insight
                        </div>
                        <div className="text-sm text-secondary-global">
                            {sleepHours < 6 && "Low sleep detected. Consider prioritizing rest today. "}
                            {stressLevel > 7 && "High stress! Maybe start with breathing exercises. "}
                            {energyLevel < 4 && "Low energy - hydration and movement can help. "}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
