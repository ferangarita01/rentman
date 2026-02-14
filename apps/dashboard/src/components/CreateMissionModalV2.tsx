
import React, { useState, useRef, useEffect } from 'react';
import {
    X, Terminal, Truck, Fingerprint, Sparkles, Wrench,
    ShieldCheck, Layers, Shield, Package, MapPin,
    Rocket, Info, CreditCard, Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Fix: Defining an alias for the 'iconify-icon' custom element if needed, though mostly using Lucide here.
const IconifyIcon = 'iconify-icon' as any;

interface CreateMissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId: string;
}

const CreateMissionModalV2: React.FC<CreateMissionModalProps> = ({ isOpen, onClose, onSuccess, userId }) => {
    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState(2450); // Default from mock
    const [selectedType, setSelectedType] = useState('General');
    const [skills, setSkills] = useState(['CRYPTO_EXP', 'SYS_AUTH']);
    const [newSkill, setNewSkill] = useState('');
    const [location, setLocation] = useState('Global Market, Sector 7-G');
    const [loading, setLoading] = useState(false);

    // Proof Protocol State
    const [proofs, setProofs] = useState({
        gpsLock: true,
        imageCapture: true,
        audioLog: false,
        textProof: true
    });

    // WebMCP: Form Reference for Agent Discovery
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (isOpen && formRef.current) {
            formRef.current.setAttribute('toolname', 'create_mission_v2');
            formRef.current.setAttribute('tooldescription', 'Create complex mission with specialized parameters.');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAddSkill = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newSkill.trim()) {
            e.preventDefault();
            if (!skills.includes(newSkill.trim())) {
                setSkills([...skills, newSkill.trim()]);
            }
            setNewSkill('');
        }
    };

    const removeSkill = (skillToRemove: string) => {
        setSkills(skills.filter(s => s !== skillToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Compile metadata/description
            const fullDescription = `${description}\n\n[SYSTEM REQUIREMENTS]\nType: ${selectedType}\nSkills: ${skills.join(', ')}\nLocation: ${location}\n\n[PROOF PROTOCOLS]\nGPS: ${proofs.gpsLock}\nImage: ${proofs.imageCapture}\nAudio: ${proofs.audioLog}\nText: ${proofs.textProof}`;

            // Insert Task to Supabase
            const { error } = await supabase
                .from('tasks')
                .insert({
                    title,
                    description: fullDescription,
                    budget_amount: budget,
                    user_id: userId,
                    status: 'open',
                    type: selectedType.toLowerCase()
                });

            if (error) throw error;

            onSuccess();
            onClose();
            // Reset form
            setTitle('');
            setDescription('');
            setBudget(2450);

        } catch (err: any) {
            console.error('Error creating mission:', err);
            alert(`Failed to create mission: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const toggleProof = (key: keyof typeof proofs) => {
        setProofs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in duration-300 overflow-y-auto">
            <div className="w-full max-w-6xl max-h-[90vh] glass-panel border border-[#1a2e25] shadow-2xl flex flex-col overflow-hidden bg-[#050505] text-white font-sans relative">

                {/* Background Grid/Scanline */}
                <div className="absolute inset-0 pointer-events-none opacity-10" style={{
                    backgroundImage: 'linear-gradient(to bottom, transparent 50%, rgba(0, 255, 136, 0.02) 50%)',
                    backgroundSize: '100% 4px'
                }}></div>

                {/* Header */}
                <header className="flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-4 border-b border-[#1a2e25] bg-[#0f1412]/50 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-2 border border-[#00ff88]/20 bg-[#00ff88]/10">
                            <Terminal className="text-[#00ff88] w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-mono font-bold text-xl tracking-tight text-white uppercase">INITIALIZE_CONTRACT_V2.0</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#00ff88]">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]"></span>
                                    </span>
                                    ENCRYPTED_UPLINK
                                </span>
                                <span className="text-[10px] font-mono text-white/40">|</span>
                                <span className="text-[10px] font-mono text-white/60 uppercase">SERVER_STATUS: <span className="text-[#00ff88]">OPTIMAL</span></span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <div className="flex flex-col items-end mr-4 hidden lg:flex">
                            <span className="text-[9px] font-mono text-white/40 uppercase">System Time</span>
                            <span className="text-xs font-mono text-white font-bold">{new Date().toISOString().split('.')[0].replace('T', ' ')} UTC</span>
                        </div>
                        <button onClick={onClose} className="size-8 flex items-center justify-center border border-[#00ff88]/20 hover:bg-white/5 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Form Content */}
                <form ref={formRef} onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-12 relative z-10 custom-scrollbar">

                    {/* 01 // TASK_TYPE_SELECTION */}
                    <section>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="h-[1px] w-4 bg-[#00ff88]"></span>
                            <h2 className="font-mono text-sm font-bold text-[#00ff88] tracking-widest uppercase">01 // TASK_TYPE_SELECTION</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { id: '01', icon: Truck, label: 'Delivery' },
                                { id: '02', icon: Fingerprint, label: 'Digital' },
                                { id: '03', icon: Sparkles, label: 'Cleaning' },
                                { id: '04', icon: Wrench, label: 'Maintenance' },
                                { id: '05', icon: ShieldCheck, label: 'Verification' },
                                { id: '06', icon: Layers, label: 'General' },
                                { id: '07', icon: Shield, label: 'Security' },
                                { id: '08', icon: Package, label: 'Logistics' },
                            ].map((type) => (
                                <button
                                    key={type.label}
                                    type="button"
                                    onClick={() => setSelectedType(type.label)}
                                    className={`group flex flex-col items-center justify-center p-6 border transition-all aspect-square relative overflow-hidden ${selectedType === type.label
                                        ? 'border-[#00ff88] bg-[#00ff88]/10'
                                        : 'border-[#00ff88]/20 bg-white/5 hover:bg-[#00ff88]/10 hover:border-[#00ff88]'
                                        }`}
                                >
                                    <div className={`absolute top-1 right-1 text-[8px] font-mono ${selectedType === type.label ? 'text-[#00ff88]' : 'text-white/20'}`}>{type.id}</div>
                                    <type.icon className={`w-8 h-8 mb-3 transition-colors ${selectedType === type.label ? 'text-[#00ff88]' : 'text-white/60 group-hover:text-[#00ff88]'}`} />
                                    <span className="font-mono text-xs font-bold tracking-tighter uppercase">{type.label}</span>
                                    {selectedType === type.label && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#00ff88]"></div>}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* 02 // CORE_PARAMETERS & 03 // OPERATIONAL_LOCUS */}
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="h-[1px] w-4 bg-[#00ff88]"></span>
                                <h2 className="font-mono text-sm font-bold text-[#00ff88] tracking-widest uppercase">02 // CORE_PARAMETERS</h2>
                            </div>

                            {/* Title */}
                            <div className="group flex flex-col border border-[#00ff88]/20 focus-within:border-[#00ff88] focus-within:shadow-[0_0_10px_rgba(0,255,136,0.1)] bg-white/5 p-4 transition-all">
                                <label className="font-mono text-[10px] text-white/40 uppercase mb-2">Contract_Title</label>
                                <input
                                    className="bg-transparent border-none p-0 text-white font-mono focus:ring-0 placeholder:text-white/20 text-lg outline-none w-full"
                                    placeholder="INPUT_ID_TITLE_HERE..."
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="group flex flex-col border border-[#00ff88]/20 focus-within:border-[#00ff88] focus-within:shadow-[0_0_10px_rgba(0,255,136,0.1)] bg-white/5 p-4 transition-all h-32">
                                <label className="font-mono text-[10px] text-white/40 uppercase mb-2">Operational_Directives</label>
                                <textarea
                                    className="bg-transparent border-none p-0 text-white font-mono focus:ring-0 placeholder:text-white/20 text-sm flex-1 resize-none outline-none w-full custom-scrollbar"
                                    placeholder="DEFINE_MISSION_SCOPE_AND_PARAMETERS..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                ></textarea>
                            </div>

                            {/* Skills */}
                            <div className="group flex flex-col border border-[#00ff88]/20 focus-within:border-[#00ff88] focus-within:shadow-[0_0_10px_rgba(0,255,136,0.1)] bg-white/5 p-4 transition-all">
                                <label className="font-mono text-[10px] text-white/40 uppercase mb-2">Skill_Requisition</label>
                                <div className="flex flex-wrap gap-2">
                                    {skills.map(skill => (
                                        <span key={skill} className="px-2 py-1 bg-[#00ff88]/20 text-[#00ff88] text-[10px] font-mono flex items-center gap-1 border border-[#00ff88]/30">
                                            {skill}
                                            <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => removeSkill(skill)} />
                                        </span>
                                    ))}
                                    <input
                                        className="bg-transparent border-none p-0 text-white font-mono focus:ring-0 placeholder:text-white/20 text-[10px] w-20 outline-none"
                                        placeholder="ADD_TAG..."
                                        type="text"
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value.toUpperCase())}
                                        onKeyDown={handleAddSkill}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="h-[1px] w-4 bg-[#00ff88]"></span>
                                <h2 className="font-mono text-sm font-bold text-[#00ff88] tracking-widest uppercase">03 // OPERATIONAL_LOCUS</h2>
                            </div>
                            <div className="relative border border-[#00ff88]/20 aspect-video bg-[#0f1412] overflow-hidden group">
                                {/* Placeholder Map */}
                                <div className="absolute inset-0 bg-cover bg-center grayscale contrast-125 opacity-30" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1577083288073-40892c0860a4?q=80&w=600&auto=format&fit=crop")' }}></div>

                                {/* HUD Overlays */}
                                <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
                                    <div className="flex justify-between items-start">
                                        <div className="px-2 py-1 bg-[#050505]/80 border border-[#00ff88]/20">
                                            <span className="font-mono text-[10px] text-[#00ff88]">LOC_PING: ACTIVE</span>
                                        </div>
                                        <div className="text-[8px] font-mono text-white/40 text-right leading-tight">
                                            SCANNING... 88%<br />V_REL_01.2
                                        </div>
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <div className="w-16 h-16 border border-[#00ff88]/40 rounded-full animate-pulse flex items-center justify-center">
                                            <div className="w-2 h-2 bg-[#00ff88] rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="font-mono text-[9px] text-white/60">
                                            LAT: 35.6895<br />LONG: 139.6917
                                        </div>
                                        <button type="button" className="pointer-events-auto px-3 py-1 bg-[#00ff88] text-[#050505] font-mono text-[10px] font-bold hover:bg-[#33ff99] transition-colors">RE_CALIBRATE</button>
                                    </div>
                                </div>
                            </div>
                            <div className="border border-[#00ff88]/20 bg-white/5 p-3 flex items-center gap-3">
                                <MapPin className="text-white/40 w-4 h-4" />
                                <input
                                    className="bg-transparent border-none p-0 text-white/80 font-mono focus:ring-0 text-xs w-full outline-none"
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>
                        </div>
                    </section>

                    {/* 04 // PROOF_PROTOCOL */}
                    <section>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="h-[1px] w-4 bg-[#00ff88]"></span>
                            <h2 className="font-mono text-sm font-bold text-[#00ff88] tracking-widest uppercase">04 // PROOF_PROTOCOL</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Toggle Cards */}
                            {[
                                { id: 'gpsLock', label: 'GPS_LOCK', sub: 'AES-256 Encryption', desc: 'Requires continuous GPS validation within 10m radius of locus.' },
                                { id: 'imageCapture', label: 'IMAGE_CAPTURE', sub: 'EXIF_STAMP_REQD', desc: 'Visual verification mandatory. Metadata spoof protection enabled.' },
                                { id: 'audioLog', label: 'AUDIO_LOG', sub: 'Inactive', desc: 'Real-time voice capture of mission completion protocols.' },
                                { id: 'textProof', label: 'TEXT_PROOF', sub: 'JSON_OUTPUT', desc: 'Detailed written debriefing submitted through encrypted pipe.' }
                            ].map((item) => (
                                <div key={item.id} className="border border-[#00ff88]/20 bg-[#0f1412] p-4 flex flex-col gap-4 relative group hover:bg-white/5 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-xs font-bold text-white uppercase">{item.label}</span>
                                            <span className="font-mono text-[9px] text-[#00ff88]/60">{item.sub}</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={proofs[item.id as keyof typeof proofs]}
                                                onChange={() => toggleProof(item.id as keyof typeof proofs)}
                                            />
                                            <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/40 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00ff88]/40 peer-checked:after:bg-[#00ff88]"></div>
                                        </label>
                                    </div>
                                    <p className="text-[10px] text-white/40 font-mono">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 05 // FINANCIAL_DISBURSEMENT */}
                    <section className="bg-[#00ff88]/5 border border-[#00ff88]/20 p-8 relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 size-40 bg-[#00ff88]/10 blur-[60px] pointer-events-none"></div>
                        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-8 relative z-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="h-[1px] w-4 bg-[#00ff88]"></span>
                                    <h2 className="font-mono text-sm font-bold text-[#00ff88] tracking-widest uppercase">05 // FINANCIAL_DISBURSEMENT</h2>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                                        <Info className="w-3 h-3" />
                                        FUNDS_ALLOCATED_TO_ESCROW_SMART_CONTRACT
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                                        <CreditCard className="w-3 h-3" />
                                        NETWORK_FEE: 0.0025 ETH (INCLUDED)
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <label className="font-mono text-[10px] text-white/40 uppercase block mb-1">Total_Payout_Amount</label>
                                <div className="flex items-center justify-end gap-3">
                                    <input
                                        type="number"
                                        value={budget}
                                        onChange={(e) => setBudget(Number(e.target.value))}
                                        className="font-mono text-5xl font-black text-[#00ff88] drop-shadow-[0_0_15px_rgba(0,255,136,0.4)] bg-transparent border-none outline-none text-right w-64 focus:ring-0"
                                    />
                                    <span className="font-mono text-xl font-bold text-[#00ff88]/60 tracking-widest">CRED</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Footer Action */}
                    <footer className="p-6 border-t border-[#1a2e25] bg-[#0f1412]/80 backdrop-blur-xl">
                        <button
                            type="submit"
                            disabled={loading || !title || !description}
                            className="w-full group relative overflow-hidden bg-[#00ff88] py-5 rounded transition-all hover:scale-[1.005] active:scale-[0.995] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {/* Scanning line effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                            <div className="flex items-center justify-center gap-4 relative z-10">
                                {loading ? (
                                    <IconifyIcon icon="svg-spinners:ring-resize" width="24" className="text-[#050505]" />
                                ) : (
                                    <Rocket className="text-[#050505] w-6 h-6" />
                                )}
                                <span className="font-display font-black text-lg text-[#050505] tracking-[0.2em] uppercase">
                                    {loading ? 'INITIALIZING_CONTRACT...' : 'DEPLOY_CONTRACT_TO_NETWORK'}
                                </span>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-[#050505]/20"></div>
                        </button>

                        <div className="mt-4 flex justify-center items-center gap-8">
                            <div className="flex items-center gap-2 text-[8px] font-mono text-white/30">
                                <span className="size-1 bg-white/20 rounded-full"></span>
                                NODES_SYNCED: 12,402
                            </div>
                            <div className="flex items-center gap-2 text-[8px] font-mono text-white/30">
                                <span className="size-1 bg-[#00ff88] rounded-full animate-pulse"></span>
                                LATENCY: 14MS
                            </div>
                            <div className="flex items-center gap-2 text-[8px] font-mono text-white/30">
                                <span className="size-1 bg-white/20 rounded-full"></span>
                                GAS_PRICE: 12 GWEI
                            </div>
                        </div>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default CreateMissionModalV2;
