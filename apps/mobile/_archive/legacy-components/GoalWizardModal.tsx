'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { XCircleIcon, ArrowRight, CheckCircle2, Target, Calendar, Activity } from 'lucide-react';
import { celebrate } from '@/lib/confetti';

export default function GoalWizardModal({
    onClose,
    onCreated,
    darkMode
}: {
    onClose: () => void;
    onCreated: () => void;
    darkMode: boolean;
}) {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);

    // Form State (Flattened for Wizard)
    const [form, setForm] = useState({
        // 1. Goal (Vision)
        goalTitle: '',
        goalDescription: '',

        // 2. Objective (Strategy)
        objectiveTitle: '',
        targetDate: '',
        targetMetric: '',

        // 3. Habit (System)
        habitName: '',
        type: 'build', // 'build' | 'quit'
        frequency: 'daily',
        triggerCue: '',
        tinyVersion: '',
        reward: ''
    });

    const steps = [
        { id: 1, title: 'Identity', icon: <Target className="w-5 h-5" /> },
        { id: 2, title: 'Strategy', icon: <Calendar className="w-5 h-5" /> },
        { id: 3, title: 'System', icon: <Activity className="w-5 h-5" /> },
    ];

    const handleSubmit = async () => {
        setSaving(true);
        try {
            if (!user) {
                toast.error('Session required');
                return;
            }

            // 1. Create Goal
            const { data: goalData, error: goalError } = await supabase
                .from('goals')
                .insert({
                    user_id: user.id,
                    title: form.goalTitle,
                    description: form.goalDescription,
                    status: 'active'
                })
                .select()
                .single();

            if (goalError) throw goalError;

            // 2. Create Objective
            const { data: objData, error: objError } = await supabase
                .from('objectives')
                .insert({
                    goal_id: goalData.id,
                    user_id: user.id,
                    title: form.objectiveTitle,
                    target_date: form.targetDate,
                    status: 'in_progress'
                })
                .select()
                .single();

            if (objError) throw objError;

            // 3. Create Habit (Linked to Objective)
            const { error: habitError } = await supabase
                .from('habits')
                .insert({
                    user_id: user.id,
                    objective_id: objData.id, // THE LINK
                    name: form.habitName,
                    type: form.type, // NEW FIELD
                    tiny_version: form.tinyVersion,
                    anchor_habit: form.triggerCue,
                    celebration: form.reward,
                    frequency: form.frequency,
                    trigger_time: '08:00', // Default for now
                    emoji: '🚀',
                    category: 'general'
                });

            if (habitError) throw habitError;

            celebrate(1, darkMode ? 'dark' : 'light');
            toast.success('System created successfully! 🧠');
            onCreated();
            onClose();

        } catch (error: any) {
            console.error('Wizard Error:', error);
            toast.error(`Error: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-[#0f0f11] border border-white/10 rounded-[2rem] w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl shadow-purple-900/20"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-[#0f0f11]/90 backdrop-blur-xl border-b border-white/5 px-6 py-5 flex items-center justify-between z-10">
                    <div>
                        {/* Title Removed as requested */}
                        <div className="flex items-center gap-2 mt-1">
                            {steps.map((s, i) => (
                                <div key={s.id} className="flex items-center gap-2">
                                    <div className={`
                                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                        ${s.id === step
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white scale-110 shadow-lg shadow-purple-500/30'
                                            : s.id < step
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-800 text-gray-500'}
                                    `}>
                                        {s.id < step ? <CheckCircle2 className="w-3 h-3" /> : s.id}
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className={`w-4 h-0.5 rounded-full ${s.id < step ? 'bg-green-500/50' : 'bg-gray-800'}`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition">
                        <XCircleIcon className="w-8 h-8" />
                    </button>
                </div>

                <div className="p-6 space-y-6">

                    {/* STEP 1: VISION (GOAL) */}
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="mb-6 text-center">
                                <div className="w-16 h-16 mx-auto bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4 text-purple-400">
                                    <Target className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Step 1: Identity</h3>
                                <p className="text-gray-400">Who do you want to become?</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-400 mb-1.5 block">I want to be...</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="e.g., A writer, An athlete, Bilingual"
                                        className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl px-4 py-4 text-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                        value={form.goalTitle}
                                        onChange={e => setForm({ ...form, goalTitle: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-400 mb-1.5 block">Why is this important?</label>
                                    <textarea
                                        placeholder="e.g., To access better job opportunities..."
                                        className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[80px]"
                                        value={form.goalDescription}
                                        onChange={e => setForm({ ...form, goalDescription: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: STRATEGY (OBJECTIVE) */}
                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="mb-6 text-center">
                                <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 text-blue-400">
                                    <Calendar className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Step 2: Strategy</h3>
                                <p className="text-gray-400">How will we measure short-term success?</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-400 mb-1.5 block">SMART Objective</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="e.g., Write 1 chapter, Run 5k"
                                        className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl px-4 py-4 text-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        value={form.objectiveTitle}
                                        onChange={e => setForm({ ...form, objectiveTitle: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-400 mb-1.5 block">Target Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl px-4 py-4 text-white p-calendar-dark focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        value={form.targetDate}
                                        onChange={e => setForm({ ...form, targetDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: SYSTEM (HABIT) */}
                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="mb-6 text-center">
                                <div className="w-16 h-16 mx-auto bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4 text-orange-400">
                                    <Activity className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Step 3: The System</h3>
                                <p className="text-gray-400">What will you do daily?</p>
                            </div>

                            <div className="space-y-4">
                                {/* Type Selector */}
                                <div className="flex bg-[#1a1a1c] p-1 rounded-xl mb-4 border border-white/10">
                                    <button
                                        onClick={() => setForm({ ...form, type: 'build' })}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${form.type === 'build' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        Build Habit 🏗️
                                    </button>
                                    <button
                                        onClick={() => setForm({ ...form, type: 'quit' })}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${form.type === 'quit' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        Break Habit 🛑
                                    </button>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-400 mb-1.5 block">
                                        {form.type === 'build' ? 'Daily Action' : 'Bad Habit to Avoid'}
                                    </label>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="e.g., Write 200 words"
                                        className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl px-4 py-4 text-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                        value={form.habitName}
                                        onChange={e => setForm({ ...form, habitName: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-400 mb-1.5 block">
                                            {form.type === 'build' ? 'Anchor (Trigger)' : 'Trigger / Cue'}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={form.type === 'build' ? "After I..." : "When I feel/see..."}
                                            className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                            value={form.triggerCue}
                                            onChange={e => setForm({ ...form, triggerCue: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-400 mb-1.5 block">Tiny Version</label>
                                        <input
                                            type="text"
                                            placeholder="2-min version"
                                            className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                            value={form.tinyVersion}
                                            onChange={e => setForm({ ...form, tinyVersion: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-400 mb-1.5 block">Reward</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Coffee, 5 min social media..."
                                        className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                        value={form.reward}
                                        onChange={e => setForm({ ...form, reward: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-3 pt-4">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-6 py-4 rounded-xl font-bold bg-[#1a1a1c] text-gray-400 hover:text-white border border-white/10 transition"
                            >
                                Back
                            </button>
                        )}

                        <button
                            onClick={() => {
                                if (step < 3) setStep(step + 1);
                                else handleSubmit();
                            }}
                            disabled={
                                (step === 1 && !form.goalTitle) ||
                                (step === 2 && !form.objectiveTitle) ||
                                (step === 3 && !form.habitName) ||
                                saving
                            }
                            className={`
                                flex-1 py-4 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-2 transition-all
                                ${step === 3
                                    ? 'bg-gradient-to-r from-orange-500 to-pink-600 hover:scale-[1.02] shadow-xl shadow-orange-500/20'
                                    : 'bg-white/10 hover:bg-white/20'}
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                        >
                            {saving ? 'Saving...' : step === 3 ? 'Finalize System 🚀' : 'Next'}
                            {!saving && step < 3 && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
