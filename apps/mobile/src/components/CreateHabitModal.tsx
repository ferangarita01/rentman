'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { XCircleIcon } from 'lucide-react';
import { celebrate } from '@/lib/confetti';

export default function CreateHabitModal({
    onClose,
    onCreated,
    darkMode,
    initialGoalId
}: {
    onClose: () => void;
    onCreated: () => void;
    darkMode: boolean;
    initialGoalId?: string;
}) {
    const { user } = useAuth();
    const [mode, setMode] = useState<'quick' | 'custom'>('quick');
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        name: '',
        emoji: '🎯',
        category: 'general',
        full_version: '',
        tiny_version: '',
        anchor_habit: '',
        celebration: '',
        trigger_time: '08:00',
        goal_id: initialGoalId || null
    });
    const [saving, setSaving] = useState(false);

    const emojis = ['🎯', '📚', '🏋️', '🧘', '💰', '✍️', '🎨', '🏃', '💪', '🧠', '❤️', '😴', '🍎', '💧'];
    const categories = [
        { id: 'health', name: 'Salud', emoji: '💪' },
        { id: 'productivity', name: 'Productividad', emoji: '⚡' },
        { id: 'learning', name: 'Aprendizaje', emoji: '📚' },
        { id: 'finance', name: 'Finanzas', emoji: '💰' },
        { id: 'social', name: 'Social', emoji: '❤️' },
        { id: 'general', name: 'General', emoji: '🎯' },
    ];

    const handleCreate = async () => {
        setSaving(true);
        try {
            if (!user) {
                toast.error('Please log in first');
                return;
            }

            const { error } = await supabase.from('habits').insert({
                user_id: user.id,
                name: form.name,
                emoji: form.emoji,
                category: form.category,
                full_version: form.full_version || form.name,
                tiny_version: form.tiny_version,
                anchor_habit: form.anchor_habit,
                celebration: form.celebration,
                trigger_time: form.trigger_time,
                goal_id: form.goal_id
            });

            if (error) throw error;

            toast.success('¡Hábito creado! Tu saga empieza hoy 🚀');
            onCreated();
            onClose();
        } catch (error) {
            console.error('Error creating habit:', error);
            toast.error('Error creating habit');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            onClick={onClose}
        >
            <div
                className="glass-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 px-6 py-4 border-b flex items-center justify-between z-10" style={{
                    backgroundColor: darkMode ? 'rgba(45, 45, 45, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    borderColor: 'var(--card-border)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div>
                        <h2 className="text-xl font-bold" style={{ color: 'var(--sarah-text-primary)' }}>✨ Create Habit</h2>
                        <p className="text-sm" style={{ color: 'var(--sarah-text-secondary)' }}>
                            {mode === 'custom' ? `Step ${step}/3` : 'Quick mode'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2" style={{ color: 'var(--sarah-text-muted)' }}>
                        <XCircleIcon className="w-8 h-8" />
                    </button>
                </div>

                {/* Step Indicators (only for custom mode) */}
                {mode === 'custom' && (
                    <div className="px-6 py-4">
                        <div className="flex justify-center gap-2 mb-2">
                            {[1, 2, 3].map(s => (
                                <div
                                    key={s}
                                    className={`h-2 w-12 rounded-full transition-all ${s === step
                                        ? 'bg-[var(--sarah-primary)] w-16'
                                        : s < step
                                            ? 'bg-green-500'
                                            : 'bg-gray-300 dark:bg-gray-700'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="p-6 space-y-6">
                    {/* Mode Selector (only on first interaction) */}
                    {step === 1 && !form.name && (
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button
                                onClick={() => setMode('quick')}
                                className={`p-4 rounded-xl border-2 transition ${mode === 'quick'
                                    ? 'border-[var(--sarah-primary)] bg-[var(--sarah-surface-hover)]'
                                    : 'border-card hover:border-gray-500'
                                    }`}
                            >
                                <div className="text-3xl mb-2">⚡</div>
                                <div className={`font-bold text-[var(--sarah-text-primary)]`}>Quick</div>
                                <div className="text-xs text-secondary-global">AI creates it</div>
                            </button>

                            <button
                                onClick={() => setMode('custom')}
                                className={`p-4 rounded-xl border-2 transition ${mode === 'custom'
                                    ? 'border-[var(--sarah-primary)] bg-[var(--sarah-surface-hover)]'
                                    : 'border-card hover:border-gray-500'
                                    }`}
                            >
                                <div className="text-3xl mb-2">🎨</div>
                                <div className={`font-bold text-[var(--sarah-text-primary)]`}>Custom</div>
                                <div className="text-xs text-secondary-global">Step by step</div>
                            </button>
                        </div>
                    )}

                    {/* QUICK MODE */}
                    {mode === 'quick' && step === 1 && (
                        <div className="space-y-4">
                            <div className={`${darkMode ? 'bg-[var(--sarah-primary)]/10 border-[var(--sarah-primary)]/30' : 'bg-orange-50 border-orange-200'} border-2 rounded-xl p-4`}>
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl">💡</div>
                                    <div className="flex-1">
                                        <div className={`font-bold mb-1 text-[var(--sarah-text-primary)]`}>
                                            AI-Powered Creation
                                        </div>
                                        <div className={`text-sm text-[var(--sarah-text-secondary)]`}>
                                            Just tell me what habit you want. I'll auto-fill the tiny version, anchor, and celebration.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--sarah-text-secondary)' }}>
                                    What habit do you want to build?
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g., Read 30 minutes daily"
                                    className="soft-ui w-full px-4 py-4 rounded-xl text-lg"
                                    style={{
                                        backgroundColor: 'var(--sarah-surface)',
                                        color: 'var(--sarah-text-primary)',
                                        border: '2px solid transparent'
                                    }}
                                />
                            </div>

                            <button
                                onClick={async () => {
                                    if (!form.name.trim()) {
                                        toast.error('Please enter a habit name');
                                        return;
                                    }

                                    setSaving(true);

                                    // TODO: Call Gemini API to auto-fill
                                    // For now, use simple defaults
                                    const tinyVersion = `2-min version of ${form.name}`;
                                    const anchor = 'after breakfast';
                                    const celebration = 'Say: I did it!';

                                    setForm({
                                        ...form,
                                        tiny_version: tinyVersion,
                                        anchor_habit: anchor,
                                        celebration: celebration
                                    });

                                    // Auto-create
                                    try {
                                        if (!user) {
                                            toast.error('Please log in first');
                                            setSaving(false);
                                            return;
                                        }

                                        const { error } = await supabase.from('habits').insert({
                                            user_id: user.id,
                                            name: form.name,
                                            emoji: '⚡',
                                            category: 'general',
                                            full_version: form.name,
                                            tiny_version: tinyVersion,
                                            anchor_habit: anchor,
                                            celebration: celebration,
                                            trigger_time: '08:00',
                                            goal_id: form.goal_id
                                        });

                                        if (error) throw error;

                                        celebrate(1, darkMode ? 'dark' : 'light');
                                        toast.success('Habit created! Your streak starts today 🚀');
                                        onCreated();
                                        onClose();
                                    } catch (error) {
                                        console.error(error);
                                        toast.error('Failed to create habit');
                                    }

                                    setSaving(false);
                                }}
                                disabled={!form.name.trim() || saving}
                                className="neubrutalist w-full py-4 rounded-xl text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ background: 'var(--sarah-gradient-cta)' }}
                            >
                                {saving ? (
                                    <span className="shimmer-text">Creating...</span>
                                ) : (
                                    '✨ Create with AI (2 sec)'
                                )}
                            </button>

                            <button
                                onClick={() => setMode('custom')}
                                className="w-full py-3 rounded-xl border-2 font-medium transition"
                                style={{
                                    borderColor: 'var(--card-border)',
                                    color: 'var(--sarah-text-secondary)'
                                }}
                            >
                                Custom setup instead
                            </button>
                        </div>
                    )}

                    {/* CUSTOM MODE */}
                    {mode === 'custom' && step === 1 && (
                        <>
                            {/* Name */}
                            <div>
                                <label className={`block text-sm font-bold text-[var(--sarah-text-secondary)] mb-2`}>
                                    What habit do you want to create?
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g.: Read every day"
                                    className={`w-full px-4 py-4 rounded-xl border-2 focus:ring-2 focus:ring-[var(--sarah-primary)] focus:border-transparent text-lg ${darkMode
                                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                        : 'bg-white border-gray-200 text-primary-global'
                                        }`}
                                />
                            </div>

                            {/* Emoji */}
                            <div>
                                <label className={`block text-sm font-bold text-[var(--sarah-text-secondary)] mb-2`}>
                                    Choose an emoji
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {emojis.map((e) => (
                                        <button
                                            key={e}
                                            onClick={() => setForm({ ...form, emoji: e })}
                                            className={`w-14 h-14 text-2xl rounded-xl transition ${form.emoji === e
                                                ? 'bg-[var(--sarah-surface-hover)] ring-2 ring-[var(--sarah-primary)] scale-110'
                                                : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                                                }`}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <label className={`block text-sm font-bold text-[var(--sarah-text-secondary)] mb-2`}>
                                    Category
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setForm({ ...form, category: cat.id })}
                                            className={`p-3 rounded-xl text-center transition ${form.category === cat.id
                                                ? 'bg-[var(--sarah-surface-hover)] ring-2 ring-[var(--sarah-primary)]'
                                                : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                                                }`}
                                        >
                                            <div className="text-2xl">{cat.emoji}</div>
                                            <div className={`text-xs mt-1 font-medium ${darkMode ? 'text-muted-global' : 'text-secondary-global'}`}>{cat.name}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!form.name}
                                className="w-full btn-sarah text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next →
                            </button>
                        </>
                    )}

                    {mode === 'custom' && step === 2 && (
                        <>
                            {/* Tiny Version (BJ Fogg) */}
                            <div className={`${darkMode ? 'bg-[var(--sarah-primary)]/20' : 'bg-[var(--sarah-surface-hover)]'} rounded-2xl p-4`}>
                                <h3 className="font-bold text-[var(--sarah-primary)] mb-2">💡 Tiny Version (2 min max)</h3>
                                <p className={`text-sm ${darkMode ? 'text-muted-global' : 'text-secondary-global'} mb-3`}>
                                    For difficult days. The key is not breaking the streak.
                                </p>
                                <input
                                    type="text"
                                    value={form.tiny_version}
                                    onChange={(e) => setForm({ ...form, tiny_version: e.target.value })}
                                    placeholder="e.g.: Read 1 page"
                                    className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-[var(--sarah-primary)] ${darkMode
                                        ? 'bg-gray-800 border-gray-700 text-white'
                                        : 'bg-white border-orange-200'
                                        }`}
                                />
                            </div>

                            {/* Anchor */}
                            <div>
                                <label className={`block text-sm font-bold text-[var(--sarah-text-secondary)] mb-2`}>
                                    ⚓ After... (your anchor)
                                </label>
                                <input
                                    type="text"
                                    value={form.anchor_habit}
                                    onChange={(e) => setForm({ ...form, anchor_habit: e.target.value })}
                                    placeholder="e.g.: drinking my morning coffee"
                                    className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-[var(--sarah-primary)] ${darkMode
                                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                        : 'bg-white border-gray-200'
                                        }`}
                                />
                            </div>

                            {/* Celebration */}
                            <div>
                                <label className={`block text-sm font-bold text-[var(--sarah-text-secondary)] mb-2`}>
                                    🎉 How will you celebrate?
                                </label>
                                <input
                                    type="text"
                                    value={form.celebration}
                                    onChange={(e) => setForm({ ...form, celebration: e.target.value })}
                                    placeholder="e.g.: I say 'I am a reader!'"
                                    className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-[var(--sarah-primary)] ${darkMode
                                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                        : 'bg-white border-gray-200'
                                        }`}
                                />
                            </div>

                            {/* Time */}
                            <div>
                                <label className={`block text-sm font-bold text-[var(--sarah-text-secondary)] mb-2`}>
                                    ⏰ Reminder time
                                </label>
                                <input
                                    type="time"
                                    value={form.trigger_time}
                                    onChange={(e) => setForm({ ...form, trigger_time: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-[var(--sarah-primary)] ${darkMode
                                        ? 'bg-gray-800 border-gray-700 text-white'
                                        : 'bg-white border-gray-200'
                                        }`}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className={`flex-1 border-2 py-4 rounded-xl font-bold ${darkMode
                                        ? 'border-gray-600 text-muted-global hover:bg-gray-700'
                                        : 'border-gray-200 hover:bg-gray-50 text-secondary-global'
                                        }`}
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!form.tiny_version || saving}
                                    className="flex-1 btn-sarah py-4 disabled:opacity-50"
                                >
                                    {saving ? '⏳ Creating...' : '🚀 Create habit'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
