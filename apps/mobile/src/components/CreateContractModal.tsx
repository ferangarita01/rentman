'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { createTask, supabase } from '@/lib/supabase-client';
import {
    X,
    Zap,
    Terminal,
    ChevronRight,
    Rocket,
    MapPin,
    Package,
    Monitor,
    Trash2,
    Wrench,
    CheckCircle,
    Clipboard
} from 'lucide-react';

export default function CreateContractModal({
    onClose,
    onCreated
}: {
    onClose: () => void;
    onCreated: () => void;
}) {
    const { user } = useAuth();
    const [mode, setMode] = useState<'quick' | 'custom'>('custom'); // Default to custom as requested
    const [form, setForm] = useState({
        title: '',
        description: '',
        budget_amount: '',
        task_type: 'delivery',
        pickup_address: '',
        delivery_address: '',
        required_skills: [] as string[]
    });

    // Proof Protocols state
    const [protocols, setProtocols] = useState({
        gps: false,
        image: true,
        audio: false,
        data: true
    });

    const [saving, setSaving] = useState(false);

    const taskTypes = [
        { id: 'delivery', name: 'Delivery', icon: Package },
        { id: 'digital', name: 'Digital', icon: Monitor },
        { id: 'cleaning', name: 'Cleaning', icon: Trash2 },
        { id: 'maintenance', name: 'Maint.', icon: Wrench },
        { id: 'verification', name: 'Verify', icon: CheckCircle },
        { id: 'general', name: 'General', icon: Clipboard }
    ];

    const toggleProtocol = (key: keyof typeof protocols) => {
        setProtocols(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleCreate = async () => {
        setSaving(true);
        try {
            if (!user) {
                toast.error('Session expired. Please log in.');
                return;
            }

            if (!form.title.trim()) {
                toast.error('TITLE_REQUIRED');
                return;
            }

            if (!form.description.trim()) {
                toast.error('DESCRIPTION_REQUIRED');
                return;
            }

            const budgetAmount = parseFloat(form.budget_amount);
            if (isNaN(budgetAmount) || budgetAmount <= 0) {
                toast.error('INVALID_BUDGET');
                return;
            }

            // Compile required skills including protocols
            const finalSkills = [...form.required_skills];
            if (protocols.gps) finalSkills.push('PROTOCOL:GPS_LOCK');
            if (protocols.image) finalSkills.push('PROTOCOL:IMAGE_CAPTURE');
            if (protocols.audio) finalSkills.push('PROTOCOL:AUDIO_LOG');
            if (protocols.data) finalSkills.push('PROTOCOL:DATA_STRING');

            // Prepend addresses to description if present
            let finalDescription = form.description;
            if (form.pickup_address || form.delivery_address) {
                finalDescription = `[PICKUP]: ${form.pickup_address || 'N/A'}\n[DELIVERY]: ${form.delivery_address || 'N/A'}\n\n${form.description}`;
            }

            // Create task without agent_id (will be assigned when worker accepts)
            const { data, error } = await createTask({
                title: form.title,
                description: finalDescription,
                budget_amount: budgetAmount,
                task_type: form.task_type,
                location_address: form.pickup_address || undefined,
                required_skills: finalSkills.length > 0 ? finalSkills : undefined,
                requester_id: user.id
            });

            if (error) throw error;

            toast.success('CONTRACT_DEPLOYED_SUCCESSFULLY');
            onCreated();
        } catch (error: any) {
            console.error('DEPLOY_ERROR:', error);
            const errorMessage = error?.message || error?.error_description || 'DEPLOYMENT_FAILED';
            toast.error(`Error: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center font-sans">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md h-[844px] max-h-[100dvh] flex flex-col pointer-events-none">
                {/* Visual container centered at bottom on mobile, center on desktop */}
                <div className="pointer-events-auto w-full bg-[#050505] h-full sm:h-[92%] sm:rounded-3xl border-t sm:border border-[#00FF41]/40 relative flex flex-col shadow-2xl overflow-hidden mx-auto mt-auto sm:my-auto">

                    {/* Top Handle (Mobile) */}
                    <div className="w-full flex justify-center py-3 sm:hidden">
                        <div className="w-10 h-1 bg-white/10 rounded-full"></div>
                    </div>

                    {/* Header */}
                    <div className="px-6 flex justify-between items-center mb-6 pt-4 sm:pt-6">
                        <div>
                            <h1 className="font-mono text-[#00FF41] text-sm tracking-widest uppercase">INITIALIZE_CONTRACT_V1</h1>
                            <p className="text-white/40 text-[10px] font-mono mt-1">SECURE_CHANNEL_ACTIVE</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                            <X className="text-white/60 w-5 h-5" />
                        </button>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto px-6 pb-24 scrollbar-hide">
                        {/* Mode Selectors */}
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            <button
                                onClick={() => setMode('quick')}
                                className={`glass-card rounded-xl p-4 flex flex-col items-center justify-center text-center group transition-colors border ${mode === 'quick' ? 'border-[#00FF41] shadow-[0_0_10px_rgba(0,255,65,0.2)]' : 'border-white/10 hover:border-[#00FF41]/50'}`}
                            >
                                <Zap className={`w-5 h-5 mb-2 transition-colors ${mode === 'quick' ? 'text-[#00FF41]' : 'text-white/40 group-hover:text-[#00FF41]'}`} />
                                <span className="font-mono text-[10px] text-white/60 mb-1">QUICK_AI</span>
                                <span className="text-[9px] text-white/30">Auto-generation</span>
                            </button>
                            <button
                                onClick={() => setMode('custom')}
                                className={`glass-card rounded-xl p-4 flex flex-col items-center justify-center text-center group transition-colors border ${mode === 'custom' ? 'border-[#00FF41] shadow-[0_0_10px_rgba(0,255,65,0.2)]' : 'border-white/10 hover:border-[#00FF41]/50'}`}
                            >
                                <Terminal className={`w-5 h-5 mb-2 transition-colors ${mode === 'custom' ? 'text-[#00FF41]' : 'text-white/40 group-hover:text-[#00FF41]'}`} />
                                <span className="font-mono text-[10px] text-[#00FF41] mb-1">MANUAL_SPEC</span>
                                <span className="text-[9px] text-white/40">Custom entry</span>
                            </button>
                        </div>

                        {mode === 'custom' ? (
                            <div className="space-y-6">
                                {/* Title */}
                                <div className="space-y-2">
                                    <label className="font-mono text-[10px] text-white/40 uppercase tracking-tighter flex items-center">
                                        <ChevronRight className="w-3 h-3 mr-1 text-[#00FF41]" /> Title
                                    </label>
                                    <div className="relative group">
                                        <input
                                            value={form.title}
                                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-[#00FF41] focus:shadow-[0_0_8px_rgba(0,255,65,0.2)] transition-all"
                                            placeholder="e.g. DATA_RETRIEVAL_DOWNTOWN"
                                            type="text"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="font-mono text-[10px] text-white/40 uppercase tracking-tighter flex items-center">
                                        <ChevronRight className="w-3 h-3 mr-1 text-[#00FF41]" /> Description
                                    </label>
                                    <div className="relative group">
                                        <textarea
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white text-sm font-mono placeholder:text-white/20 resize-none focus:outline-none focus:border-[#00FF41] focus:shadow-[0_0_8px_rgba(0,255,65,0.2)] transition-all"
                                            placeholder="Enter detailed task parameters..."
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                {/* Budget */}
                                <div className="space-y-2">
                                    <label className="font-mono text-[10px] text-white/40 uppercase tracking-tighter flex items-center">
                                        <ChevronRight className="w-3 h-3 mr-1 text-[#00FF41]" /> Budget (USD)
                                    </label>
                                    <div className="relative group">
                                        <input
                                            value={form.budget_amount}
                                            onChange={(e) => setForm({ ...form, budget_amount: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-[#00FF41] focus:shadow-[0_0_8px_rgba(0,255,65,0.2)] transition-all"
                                            placeholder="00.00"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[#00FF41]/60 font-mono">USDC</div>
                                    </div>
                                </div>

                                {/* Task Type Selector */}
                                <div className="space-y-2">
                                    <label className="font-mono text-[10px] text-white/40 uppercase tracking-tighter flex items-center">
                                        <ChevronRight className="w-3 h-3 mr-1 text-[#00FF41]" /> Task Type
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {taskTypes.map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => setForm({ ...form, task_type: type.id })}
                                                className={`p-3 rounded-sm border transition-all flex flex-col items-center justify-center gap-2 ${form.task_type === type.id
                                                    ? 'bg-[#00FF41]/10 border-[#00FF41] text-[#00FF41]'
                                                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                                                    }`}
                                            >
                                                <type.icon className="w-4 h-4" />
                                                <span className="text-[9px] font-mono uppercase">{type.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Address Fields */}
                                <div className="space-y-4 pt-2 border-t border-white/5">
                                    {/* Pickup Address */}
                                    <div className="space-y-2">
                                        <label className="font-mono text-[10px] text-white/40 uppercase tracking-tighter flex items-center">
                                            <MapPin className="w-3 h-3 mr-1 text-[#00FF41]" /> Pickup Address / Link
                                        </label>
                                        <div className="relative group">
                                            <input
                                                value={form.pickup_address}
                                                onChange={(e) => setForm({ ...form, pickup_address: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-[#00FF41] focus:shadow-[0_0_8px_rgba(0,255,65,0.2)] transition-all"
                                                placeholder="Address, Maps Link, or Coordinates"
                                                type="text"
                                            />
                                        </div>
                                    </div>

                                    {/* Delivery Address */}
                                    <div className="space-y-2">
                                        <label className="font-mono text-[10px] text-white/40 uppercase tracking-tighter flex items-center">
                                            <MapPin className="w-3 h-3 mr-1 text-red-500" /> Delivery Address / Link
                                        </label>
                                        <div className="relative group">
                                            <input
                                                value={form.delivery_address}
                                                onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-red-500/50 focus:shadow-[0_0_8px_rgba(255,0,0,0.2)] transition-all"
                                                placeholder="Address, Maps Link, or Coordinates"
                                                type="text"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Proof Protocols */}
                                <div className="pt-4">
                                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                                        <h3 className="font-mono text-[10px] text-[#00FF41] tracking-widest uppercase">PROOF_PROTOCOL</h3>
                                        <span className="text-[9px] text-white/20 uppercase">Encryption: AES-256</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* GPS Lock */}
                                        <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-sm">
                                            <span className="text-[10px] font-mono text-white/70">GPS_LOCK</span>
                                            <button
                                                onClick={() => toggleProtocol('gps')}
                                                className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${protocols.gps ? 'bg-[#00FF41]' : 'bg-white/10'}`}
                                            >
                                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-black transition-all duration-300 ${protocols.gps ? 'right-0.5' : 'left-0.5'}`} />
                                            </button>
                                        </div>

                                        {/* Image Capture */}
                                        <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-sm">
                                            <span className="text-[10px] font-mono text-white/70">IMAGE_CAPTURE</span>
                                            <button
                                                onClick={() => toggleProtocol('image')}
                                                className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${protocols.image ? 'bg-[#00FF41]' : 'bg-white/10'}`}
                                            >
                                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-black transition-all duration-300 ${protocols.image ? 'right-0.5' : 'left-0.5'}`} />
                                            </button>
                                        </div>

                                        {/* Audio Log */}
                                        <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-sm">
                                            <span className="text-[10px] font-mono text-white/70">AUDIO_LOG</span>
                                            <button
                                                onClick={() => toggleProtocol('audio')}
                                                className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${protocols.audio ? 'bg-[#00FF41]' : 'bg-white/10'}`}
                                            >
                                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-black transition-all duration-300 ${protocols.audio ? 'right-0.5' : 'left-0.5'}`} />
                                            </button>
                                        </div>

                                        {/* Data String */}
                                        <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-sm">
                                            <span className="text-[10px] font-mono text-white/70">DATA_STRING</span>
                                            <button
                                                onClick={() => toggleProtocol('data')}
                                                className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${protocols.data ? 'bg-[#00FF41]' : 'bg-white/10'}`}
                                            >
                                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-black transition-all duration-300 ${protocols.data ? 'right-0.5' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4 opacity-50">
                                <Zap className="w-12 h-12 text-[#00FF41]" />
                                <p className="font-mono text-sm text-[#00FF41]">AI_GENERATION_OFFLINE</p>
                                <p className="text-xs text-center text-white/40 max-w-[200px]">
                                    Neural interface not connected. Please use MANUAL_SPEC mode.
                                </p>
                                <button
                                    onClick={() => setMode('custom')}
                                    className="px-4 py-2 border border-[#00FF41]/30 rounded text-[#00FF41] text-xs font-mono hover:bg-[#00FF41]/10"
                                >
                                    SWITCH_TO_MANUAL
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer / Deploy Button */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-[#050505]/95 backdrop-blur-md border-t border-white/10 z-20">
                        <button
                            onClick={handleCreate}
                            disabled={saving}
                            className="w-full bg-[#00FF41] text-black font-mono font-bold text-sm py-4 rounded-sm shadow-[0_0_15px_rgba(0,255,65,0.3)] hover:shadow-[0_0_25px_rgba(0,255,65,0.5)] transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'DEPLOYING_CONTRACT...' : 'DEPLOY_CONTRACT_v1.0'}
                            {!saving && <Rocket className="ml-2 w-4 h-4" />}
                        </button>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#00FF41]/5 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="absolute bottom-40 -right-20 w-48 h-48 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                </div>
            </div>

            {/* Custom Styles for styling that isn't easily done with Tailwind utilities alone */}
            <style jsx global>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(10px);
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div >
    );
}
