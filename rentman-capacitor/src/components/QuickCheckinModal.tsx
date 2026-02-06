'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface QuickCheckinModalProps {
    onClose: () => void;
    onSaved: () => void;
}

export default function QuickCheckinModal({ onClose, onSaved, initialSection = 'sleep' }: { onClose: () => void; onSaved: () => void; initialSection?: 'sleep' | 'stress' | 'energy' | 'water' | 'exercise' | 'nutrition' }) {
    const { isDark } = useTheme();
    const { user } = useAuth();

    const [section, setSection] = useState(initialSection);

    // Core Metrics
    const [sleepQuality, setSleepQuality] = useState(7);
    const [energy, setEnergy] = useState(7);
    const [stress, setStress] = useState(5);

    // New Metrics
    const [waterGlasses, setWaterGlasses] = useState(0);
    const [exerciseMinutes, setExerciseMinutes] = useState(0);
    const [healthyMeals, setHealthyMeals] = useState(0);
    const [junkFood, setJunkFood] = useState(0);

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!user?.id) return;

        setIsSaving(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            // Only update fields that are relevant to the current section or all if it's a full check-in
            const updates: any = {
                user_id: user.id,
                date: today,
                updated_at: new Date().toISOString()
            };

            // If it's the default "full" check-in (usually starts with sleep), save core metrics
            // If specific section, we might want to only update THAT field, but upsert requires careful handling
            // For simplicity in this PWA, we'll save current state of all controlled inputs
            // ideally we would fetch existing first, but for now we assume the user intends to set these values.

            if (section === 'sleep' || initialSection === 'sleep') updates.sleep_quality = sleepQuality;
            if (section === 'energy' || initialSection === 'energy') updates.energy_level = energy;
            if (section === 'stress' || initialSection === 'stress') updates.stress_level = stress;
            if (section === 'water' || initialSection === 'water') updates.water_glasses = waterGlasses;
            if (section === 'exercise' || initialSection === 'exercise') updates.exercise_minutes = exerciseMinutes;
            if (section === 'nutrition' || initialSection === 'nutrition') {
                updates.healthy_meals = healthyMeals;
                updates.junk_food_count = junkFood;
            }

            // Fallback: If it's a "Quick Check-in" from the big button, save core metrics at minimum
            if (!initialSection || initialSection === 'sleep') {
                updates.sleep_quality = sleepQuality;
                updates.energy_level = energy;
                updates.stress_level = stress;
            }

            const { error } = await supabase
                .from('daily_wellness')
                .upsert(updates, {
                    onConflict: 'user_id,date'
                });

            if (error) throw error;

            onSaved();
            onClose();
        } catch (err) {
            console.error('Error saving quick check-in:', err);
            alert('Failed to save check-in. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const renderSlider = (label: string, icon: string, value: number, setValue: (v: number) => void, colorClass: string) => (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
                <label className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                    <span className="text-xl">{icon}</span>
                    {label}
                </label>
                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}/10</span>
            </div>
            <input
                type="range"
                min="1"
                max="10"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}
                style={{
                    background: `linear-gradient(to right, ${colorClass} ${(value - 1) * 11.11}%, ${isDark ? '#27272a' : '#e5e7eb'} ${(value - 1) * 11.11}%)`
                }}
            />
        </div>
    );

    const renderCounter = (label: string, icon: string, value: number, setValue: (v: number) => void, unit: string = '') => (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
                <label className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                    <span className="text-xl">{icon}</span>
                    {label}
                </label>
                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value} {unit}</span>
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setValue(Math.max(0, value - 1))}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold transition-colors ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                >-</button>
                <div className="flex-1 h-2 rounded-lg bg-gray-200 dark:bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, (value / 10) * 100)}%` }} />
                </div>
                <button
                    onClick={() => setValue(value + 1)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold transition-colors ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                >+</button>
            </div>
        </div>
    );

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className={`rounded-2xl p-6 max-w-md w-full shadow-2xl border ${isDark ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white border-gray-200'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {initialSection === 'water' ? 'Water Intake' :
                            initialSection === 'exercise' ? 'Activity Log' :
                                initialSection === 'nutrition' ? 'Nutrition Log' : 'Wellness Check-in'}
                    </h3>
                    <button
                        onClick={onClose}
                        className={`text-3xl leading-none transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'
                            }`}
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-2">
                    {/* Conditional Rendering based on Section or Full Mode */}
                    {(section === 'sleep' || !initialSection) && renderSlider('Sleep Quality', '🌙', sleepQuality, setSleepQuality, '#f59e0b')}
                    {(section === 'energy' || !initialSection) && renderSlider('Energy Level', '⚡', energy, setEnergy, '#eab308')}
                    {(section === 'stress' || !initialSection) && renderSlider('Stress Level', '😰', stress, setStress, '#10b981')}

                    {/* Specific Sections */}
                    {section === 'water' && renderCounter('Water Glasses', '💧', waterGlasses, setWaterGlasses)}

                    {section === 'exercise' && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <label className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                                    <span className="text-xl">👟</span>
                                    Exercise Minutes
                                </label>
                                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{exerciseMinutes} min</span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {[0, 15, 30, 45, 60, 90].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setExerciseMinutes(m)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${exerciseMinutes === m
                                                ? 'bg-violet-500 text-white'
                                                : isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {m}m
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {section === 'nutrition' && (
                        <>
                            {renderCounter('Healthy Meals', '🥗', healthyMeals, setHealthyMeals)}
                            {renderCounter('Junk Food', '🍕', junkFood, setJunkFood)}
                        </>
                    )}
                </div>

                <div className="flex gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className={`flex-1 py-3 rounded-xl font-bold transition-colors ${isDark
                                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 rounded-xl font-bold text-white transition-opacity bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-60"
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
