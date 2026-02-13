import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Fix: Defining an alias for the 'iconify-icon' custom element
const IconifyIcon = 'iconify-icon' as any;

interface CreateMissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId: string;
}

const CreateMissionModal: React.FC<CreateMissionModalProps> = ({ isOpen, onClose, onSuccess, userId }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState(50);
    const [loading, setLoading] = useState(false);

    // WebMCP: Form Reference for Agent Discovery
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (isOpen && formRef.current) {
            formRef.current.setAttribute('toolname', 'create_mission');
            formRef.current.setAttribute('tooldescription', 'Create and post a new mission/task to the marketplace. Requires title, description, and budget.');
            formRef.current.setAttribute('toolautosubmit', 'true');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Validate Credits (Optional - checking local state or reliance on backend constraint)
            // For now, we assume user knows their balance or backend rejects.

            // 2. Insert Task to Supabase
            const { error } = await supabase
                .from('tasks')
                .insert({
                    title,
                    description,
                    budget_amount: budget,
                    user_id: userId,
                    status: 'open',
                    type: 'general' // Default type
                });

            if (error) throw error;

            // 3. Success Feedback
            onSuccess();
            onClose();
            setTitle('');
            setDescription('');
            setBudget(50);

        } catch (err: any) {
            console.error('Error creating mission:', err);
            alert(`Failed to create mission: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,255,136,0.1)] relative overflow-hidden">

                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ff88]/5 rounded-full blur-[80px] pointer-events-none" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    type="button"
                    className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors z-20"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="p-8 border-b border-white/10 relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                        <span className="text-[10px] text-[#00ff88] font-mono uppercase tracking-widest">Mission Control</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white font-mono tracking-tight uppercase">Initialize New Mission</h2>
                    <p className="text-sm text-slate-500 mt-2 font-mono">Define parameters for autonomous agent execution.</p>
                </div>

                {/* WebMCP Form */}
                <form ref={formRef} onSubmit={handleSubmit} className="p-8 relative z-10">
                    <div className="space-y-6">
                        {/* Title Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest flex justify-between">
                                <span>Mission Objective</span>
                                <span className="text-[#00ff88]">{title.length}/60</span>
                            </label>
                            <input
                                name="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={60}
                                placeholder="e.g., Analyze Competitor Pricing Models"
                                className="w-full bg-[#111] border border-white/10 text-white p-4 rounded-lg focus:border-[#00ff88] focus:shadow-[0_0_20px_rgba(0,255,136,0.1)] outline-none font-mono transition-all text-sm"
                                required
                            />
                        </div>

                        {/* Description Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                                Operational Parameters / Context
                            </label>
                            <textarea
                                name="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={5}
                                placeholder="Provide detailed instructions, constraints, and expected output format..."
                                className="w-full bg-[#111] border border-white/10 text-white p-4 rounded-lg focus:border-[#00ff88] focus:shadow-[0_0_20px_rgba(0,255,136,0.1)] outline-none font-mono transition-all text-sm resize-none custom-scrollbar"
                                required
                            />
                        </div>

                        {/* Budget Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                                Mission Budget (USD)
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono">$</span>
                                    <input
                                        name="budget"
                                        type="number"
                                        value={budget}
                                        onChange={(e) => setBudget(Number(e.target.value))}
                                        min={5}
                                        max={10000}
                                        className="w-full bg-[#111] border border-white/10 text-white p-4 pl-8 rounded-lg focus:border-[#00ff88] outline-none font-mono transition-all text-xl font-bold"
                                        required
                                    />
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono max-w-[200px]">
                                    Funds will be held in escrow until mission completion verification.
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-6 flex items-center justify-end gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-4 text-xs font-mono uppercase text-slate-500 hover:text-white transition-colors"
                            >
                                Abort
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !title || !description}
                                className="bg-[#00ff88] text-black px-8 py-4 rounded-lg font-mono text-xs font-bold uppercase hover:bg-[#33ff99] hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <IconifyIcon icon="svg-spinners:ring-resize" width="18" />
                                        Initializing...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Launch Mission
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateMissionModal;
