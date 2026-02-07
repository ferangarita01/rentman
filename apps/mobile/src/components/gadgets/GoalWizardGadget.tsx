'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Target, Calendar, Activity, CheckCircle2, ArrowRight, XCircleIcon } from 'lucide-react';
import { celebrate } from '@/lib/confetti';

/**
 * Compact Goal Wizard Gadget
 * Embedded in Sarah's chat flow instead of modal overlay
 */
export default function GoalWizardGadget({
    onClose,
    onCreated,
    darkMode = true
}: {
    onClose: () => void;
    onCreated: () => void;
    darkMode?: boolean;
}) {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        goalTitle: '',
        goalDescription: '',
        objectiveTitle: '',
        targetDate: '',
        habitName: '',
        frequency: 'daily',
        triggerCue: '',
        tinyVersion: '',
        reward: '',
        triggerTime: '08:00',
        category: 'general'
    });

    const steps = [
        { id: 1, title: 'Identity', icon: <Target className="w-4 h-4" /> },
        { id: 2, title: 'Strategy', icon: <Calendar className="w-4 h-4" /> },
        { id: 3, title: 'System', icon: <Activity className="w-4 h-4" /> },
    ];

    const handleSubmit = async () => {
        console.log('🎯 [GoalWizard] Starting submission...');
        console.log('🎯 [GoalWizard] Form data:', form);

        setSaving(true);
        try {
            if (!user) {
                console.error('❌ [GoalWizard] No user found');
                toast.error('Session required');
                return;
            }

            console.log('🎯 [GoalWizard] User ID:', user.id);

            // 1. Create Goal
            console.log('📝 [GoalWizard] Creating goal...');
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

            if (goalError) {
                console.error('❌ [GoalWizard] Goal creation failed:', goalError);
                throw goalError;
            }
            console.log('✅ [GoalWizard] Goal created:', goalData.id);

            // 2. Create Objective
            console.log('📝 [GoalWizard] Creating objective...');
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

            if (objError) {
                console.error('❌ [GoalWizard] Objective creation failed:', objError);
                throw objError;
            }
            console.log('✅ [GoalWizard] Objective created:', objData.id);

            // 3. Create Habit
            console.log('📝 [GoalWizard] Creating habit...');
            const { error: habitError } = await supabase
                .from('habits')
                .insert({
                    user_id: user.id,
                    objective_id: objData.id,
                    name: form.habitName,
                    tiny_version: form.tinyVersion,
                    anchor_habit: form.triggerCue,
                    celebration: form.reward,
                    frequency: form.frequency,
                    trigger_time: form.triggerTime,
                    emoji: '🚀',
                    category: form.category
                });

            if (habitError) {
                console.error('❌ [GoalWizard] Habit creation failed:', habitError);
                throw habitError;
            }
            console.log('✅ [GoalWizard] Habit created successfully!');

            celebrate(1, darkMode ? 'dark' : 'light');
            toast.success('System created! 🧠');
            console.log('🎉 [GoalWizard] Complete! Calling callbacks...');
            onCreated();
            onClose();

        } catch (error: any) {
            console.error('❌ [GoalWizard] Fatal error:', error);
            console.error('❌ [GoalWizard] Error details:', JSON.stringify(error, null, 2));
            toast.error(`Error: ${error.message}`);
        } finally {
            setSaving(false);
            console.log('🎯 [GoalWizard] Submission finished (saving = false)');
        }
    };

    return (
        <div className={`
            rounded-2xl border p-4 space-y-4 animate-in slide-in-from-bottom-4 duration-300
            ${darkMode ? 'bg-[#0f0f11] border-white/10' : 'bg-white border-gray-200 shadow-xl'}
        `}>
            {/* Compact Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {steps.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-1.5">
                            <div className={`
                                w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                ${s.id === step
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white scale-110'
                                    : s.id < step
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-800 text-gray-500'}
                            `}>
                                {s.id < step ? <CheckCircle2 className="w-3 h-3" /> : s.id}
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`w-3 h-0.5 ${s.id < step ? 'bg-green-500/50' : 'bg-gray-800'}`} />
                            )}
                        </div>
                    ))}
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition">
                    <XCircleIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Step Content */}
            <div className="space-y-3">
                {/* STEP 1: IDENTITY */}
                {step === 1 && (
                    <div className="space-y-3">
                        <div className="text-center mb-2">
                            <div className="w-12 h-12 mx-auto bg-purple-500/10 rounded-xl flex items-center justify-center mb-2 text-purple-400">
                                <Target className="w-6 h-6" />
                            </div>
                            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Who do you want to be?</h3>
                        </div>
                        <input
                            autoFocus
                            type="text"
                            placeholder="e.g., A writer, An athlete..."
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 
                                ${darkMode
                                    ? 'bg-zinc-900 border-white/10 text-white placeholder-gray-600'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                            value={form.goalTitle}
                            onChange={e => setForm({ ...form, goalTitle: e.target.value })}
                        />
                        <textarea
                            placeholder="Why is this important?"
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[60px]
                                ${darkMode
                                    ? 'bg-zinc-900 border-white/10 text-white placeholder-gray-600'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                            value={form.goalDescription}
                            onChange={e => setForm({ ...form, goalDescription: e.target.value })}
                        />
                    </div>
                )}

                {/* STEP 2: STRATEGY */}
                {step === 2 && (
                    <div className="space-y-3">
                        <div className="text-center mb-2">
                            <div className="w-12 h-12 mx-auto bg-blue-500/10 rounded-xl flex items-center justify-center mb-2 text-blue-400">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>What's the target?</h3>
                        </div>
                        <input
                            autoFocus
                            type="text"
                            placeholder="e.g., Write 1 chapter, Run 5k"
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50
                                ${darkMode
                                    ? 'bg-zinc-900 border-white/10 text-white placeholder-gray-600'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                            value={form.objectiveTitle}
                            onChange={e => setForm({ ...form, objectiveTitle: e.target.value })}
                        />
                        <input
                            type="date"
                            className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50
                                ${darkMode
                                    ? 'bg-zinc-900 border-white/10 text-white'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                            value={form.targetDate}
                            onChange={e => setForm({ ...form, targetDate: e.target.value })}
                        />
                    </div>
                )}

                {/* STEP 3: SYSTEM */}
                {step === 3 && (
                    <div className="space-y-3">
                        <div className="text-center mb-2">
                            <div className="w-12 h-12 mx-auto bg-orange-500/10 rounded-xl flex items-center justify-center mb-2 text-orange-400">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Daily action?</h3>
                        </div>
                        <input
                            autoFocus
                            type="text"
                            placeholder="e.g., Write 200 words"
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50
                                ${darkMode
                                    ? 'bg-zinc-900 border-white/10 text-white placeholder-gray-600'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                            value={form.habitName}
                            onChange={e => setForm({ ...form, habitName: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                placeholder="After I... (trigger)"
                                className={`border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50
                                    ${darkMode
                                        ? 'bg-zinc-900 border-white/10 text-white'
                                        : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                value={form.triggerCue}
                                onChange={e => setForm({ ...form, triggerCue: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Tiny version (2 min)"
                                className={`border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50
                                    ${darkMode
                                        ? 'bg-zinc-900 border-white/10 text-white'
                                        : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                value={form.tinyVersion}
                                onChange={e => setForm({ ...form, tinyVersion: e.target.value })}
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="Reward (e.g., Coffee)"
                            className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50
                                ${darkMode
                                    ? 'bg-zinc-900 border-white/10 text-white'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                            value={form.reward}
                            onChange={e => setForm({ ...form, reward: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                value={form.frequency}
                                onChange={e => setForm({ ...form, frequency: e.target.value })}
                                className={`border rounded-lg px-3 py-2 text-xs focus:outline-none
                                    ${darkMode
                                        ? 'bg-zinc-900 border-white/10 text-white'
                                        : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                            >
                                <option value="daily">Daily</option>
                                <option value="weekdays">Weekdays</option>
                                <option value="weekly">Weekly</option>
                            </select>
                            <input
                                type="time"
                                value={form.triggerTime}
                                onChange={e => setForm({ ...form, triggerTime: e.target.value })}
                                className={`border rounded-lg px-3 py-2 text-xs focus:outline-none
                                    ${darkMode
                                        ? 'bg-zinc-900 border-white/10 text-white'
                                        : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex gap-2 pt-2">
                {step > 1 && (
                    <button
                        onClick={() => setStep(step - 1)}
                        className={`px-4 py-2 rounded-lg font-semibold border transition text-sm
                            ${darkMode
                                ? 'bg-zinc-900 text-gray-400 hover:text-white border-white/10'
                                : 'bg-gray-100 text-gray-600 hover:text-gray-900 border-gray-200'}`}
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
                        (step === 3 && (!form.habitName || !form.tinyVersion)) ||
                        saving
                    }
                    className={`
                        flex-1 py-2 rounded-lg font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all
                        ${step === 3
                            ? 'bg-gradient-to-r from-orange-500 to-pink-600 hover:scale-[1.02]'
                            : 'bg-white/10 hover:bg-white/20'}
                        disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                >
                    {saving ? 'Saving...' : step === 3 ? 'Create 🚀' : 'Next'}
                    {!saving && step < 3 && <ArrowRight className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}
