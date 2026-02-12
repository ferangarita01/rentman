'use client';

import React, { Suspense, useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTasks, Task, getProfile, Profile, supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import CreateContractModal from '@/components/CreateContractModal';
import {
    Search,
    Zap,
    Bot,
    Star,
    Shield,
    Loader2,
    Package,
    Wrench,
    CheckCircle
} from 'lucide-react';

function MarketPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'reward' | 'urgency' | 'type' | 'own'>('reward');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [rentmanCredits, setRentmanCredits] = useState(0);

    const loadData = React.useCallback(async () => {
        setLoading(true);

        if (user) {
            const { data: profileData } = await getProfile(user.id);
            setProfile(profileData);

            // Fetch Transactions to get accurate balance
            const { data: allTransactions } = await supabase
                .from('transactions')
                .select('amount, status')
                .eq('user_id', user.id);

            if (allTransactions) {
                const completed = allTransactions.filter((t: { amount: number; status: string }) => t.status === 'completed');
                const total = completed.reduce((sum: number, t: { amount: number; status: string }) => sum + Number(t.amount), 0);
                setRentmanCredits(Math.max(0, total));
            }
        }

        // Fetch ALL open tasks
        const { data, error } = await getTasks('open');
        if (error) {
            console.error('❌ Error loading global tasks:', error);
        } else {
            setTasks(data || []);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Check for create query param
    useEffect(() => {
        const createParam = searchParams.get('create');
        if (createParam === 'true') {
            setShowCreateModal(true);
            // Cleanup URL without refresh
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('create');
            window.history.replaceState({}, '', newUrl.toString());
        }
    }, [searchParams]);

    // Listen for custom event from BottomNav (when already on market page)
    useEffect(() => {
        const handleOpenModal = () => {
            setShowCreateModal(true);
        };
        window.addEventListener('openCreateModal', handleOpenModal);
        return () => {
            window.removeEventListener('openCreateModal', handleOpenModal);
        };
    }, []);

    // Generate threat level based on priority
    function getThreatLevel(priority: number): { level: string; icons: number; color: string } {
        if (priority >= 8) return { level: 'HIGH', icons: 5, color: '#ff4444' };
        if (priority >= 5) return { level: 'MED', icons: 3, color: '#ffaa00' };
        return { level: 'LOW', icons: 2, color: '#00ff88' };
    }

    // Get icon based on task type
    function getTaskIcon(taskType: string) {
        switch (taskType?.toLowerCase()) {
            case 'delivery': return <Package className="w-6 h-6 text-blue-400" />;
            case 'repair': return <Wrench className="w-6 h-6 text-orange-400" />;
            case 'verification': return <CheckCircle className="w-6 h-6 text-green-400" />;
            default: return <Shield className="w-6 h-6 text-gray-600" />;
        }
    }

    // Calculate XP gain based on budget and priority
    function calculateXP(budget: number, priority: number): number {
        return Math.floor((budget / 10) + (priority * 10));
    }

    // Calculate rep boost based on priority
    function calculateRepBoost(priority: number): string {
        return (priority * 0.2).toFixed(1);
    }

    // Generate issuer name from task ID (simulated - in production would come from relations)
    function generateIssuerName(taskId: string): string {
        const prefixes = ['AEGIS', 'NEXUS', 'CIPHER', 'VORTEX', 'QUANTUM'];
        const suffixes = ['SYSTEMS', 'CORP', 'TECH', 'DYNAMICS', 'LABS'];
        const hash = taskId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return `${prefixes[hash % prefixes.length]}_${suffixes[(hash * 2) % suffixes.length]}`;
    }

    // Filter and sort tasks
    const filteredTasks = useMemo(() => {
        let result = [...tasks];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(task =>
                task.title?.toLowerCase().includes(query) ||
                task.description?.toLowerCase().includes(query) ||
                task.task_type?.toLowerCase().includes(query)
            );
        }

        // Apply sort
        switch (filter) {
            case 'reward':
                result.sort((a, b) => b.budget_amount - a.budget_amount);
                break;
            case 'urgency':
                result.sort((a, b) => b.priority - a.priority);
                break;
            case 'type':
                result.sort((a, b) => (a.task_type || '').localeCompare(b.task_type || ''));
                break;
            case 'own':
                if (user) {
                    result = result.filter(task => task.agent_id === user.id);
                }
                break;
        }

        return result;
    }, [tasks, searchQuery, filter, user]);

    const filters = [
        { id: 'reward', label: 'REWARD' },
        { id: 'urgency', label: 'URGENCY' },
        { id: 'type', label: 'TYPE' },
        { id: 'own', label: 'OWN' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#00ff88] animate-spin mx-auto mb-4" />
                    <p className="text-white font-mono tracking-widest">SYNCING GLOBAL CONTRACTS...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-[430px] mx-auto bg-[#050505] text-white font-sans">
            {/* Scanline overlay */}
            <div className="fixed inset-0 pointer-events-none z-0"
                style={{
                    background: 'linear-gradient(to bottom, transparent 50%, rgba(0, 255, 136, 0.03) 50%)',
                    backgroundSize: '100% 4px'
                }}></div>

            {/* Header */}
            <header className="sticky top-0 z-10 bg-[#050505]/90 backdrop-blur-md border-b border-[#1a1a1a] p-4">
                {/* Operator Info */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#00ff88]/20 border border-[#00ff88]/50 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-[#00ff88]" />
                        </div>
                        <div>
                            <p className="text-[10px] font-mono text-gray-500">
                                OPERATOR: {user?.email?.split('@')[0]?.toUpperCase() || 'ANONYMOUS'}
                            </p>
                            <p className="text-xs font-mono text-[#00ff88]">
                                LVL {profile?.level || 1} • REP: {profile?.reputation?.toFixed(1) || '0.0'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-mono text-gray-500">CREDITS</p>
                        <p className="text-sm font-mono text-white">
                            ${rentmanCredits.toFixed(2)} USD
                        </p>
                    </div>
                </div>

                {/* Filter Chips */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {filters.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id as typeof filter)}
                            className={`px-3 py-1.5 rounded border text-[10px] font-mono uppercase whitespace-nowrap transition-all ${filter === f.id
                                ? 'bg-[#00ff88]/20 border-[#00ff88] text-[#00ff88]'
                                : 'bg-transparent border-[#333] text-gray-500 hover:border-gray-400'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="mt-3 flex items-center gap-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-3 py-2">
                    <span className="text-[#00ff88] text-lg">&gt;</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="SEARCH_CONTRACTS_"
                        className="bg-transparent text-white font-mono text-sm flex-1 outline-none placeholder-gray-600"
                    />
                    <Search className="w-4 h-4 text-gray-500" />
                </div>

                {/* Results count */}
                <p className="mt-2 text-[10px] font-mono text-gray-600">
                    {filteredTasks.length} CONTRACT{filteredTasks.length !== 1 ? 'S' : ''} FOUND
                </p>
            </header>

            {/* Contract List */}
            <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 z-1 relative">
                {filteredTasks.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-500 font-mono">NO_CONTRACTS_AVAILABLE</p>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="mt-4 text-[#00ff88] font-mono text-sm underline"
                            >
                                CLEAR_SEARCH
                            </button>
                        )}
                    </div>
                ) : (
                    filteredTasks.map((task) => {
                        const threat = getThreatLevel(task.priority);
                        const xpGain = calculateXP(task.budget_amount, task.priority);
                        const repBoost = calculateRepBoost(task.priority);
                        const issuerName = generateIssuerName(task.id);

                        return (
                            <div
                                key={task.id}
                                onClick={() => router.push(`/contract?id=${task.id}`)}
                                className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-hidden cursor-pointer hover:border-[#00ff88]/30 transition-all group"
                            >
                                {/* Card Header */}
                                <div className="p-4 border-b border-[#1a1a1a]">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-mono text-gray-500">
                                                CONTRACT_ID: 0x{task.id.slice(0, 4).toUpperCase()}_{task.task_type?.toUpperCase() || 'TASK'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {/* Threat Icons */}
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Zap
                                                            key={i}
                                                            className={`w-3 h-3 ${i < threat.icons ? '' : 'opacity-20'}`}
                                                            style={{ color: i < threat.icons ? threat.color : '#333' }}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-mono" style={{ color: threat.color }}>
                                                    THREAT_LVL: {threat.level}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-mono text-gray-600 mt-1">
                                                XP_GAIN: +{xpGain} REP_BOOST: +{repBoost}
                                            </p>
                                        </div>
                                        {/* Payout */}
                                        <div className="text-right">
                                            <p className="text-[10px] font-mono text-gray-500 uppercase">Payout</p>
                                            <p className="text-xl font-bold text-[#00ff88] font-mono">
                                                {task.budget_amount.toLocaleString()}
                                            </p>
                                            <p className="text-[10px] font-mono text-gray-400">{task.budget_currency}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-4">
                                    {/* Issuer */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center text-xs font-bold text-black">
                                            {issuerName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-mono text-white uppercase">ISSUER: {issuerName}</p>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3 h-3 text-[#00ff88]" />
                                                <span className="text-[10px] font-mono text-gray-500">
                                                    RELIABILITY: {(80 + (task.priority * 2)).toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="bg-[#050505] border border-[#1a1a1a] rounded p-3 flex gap-3">
                                        <div className="w-12 h-12 bg-[#1a1a1a] rounded flex-shrink-0 flex items-center justify-center">
                                            {getTaskIcon(task.task_type)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-mono text-white mb-1 uppercase">{task.title}</p>
                                            <p className="text-[10px] text-gray-400 italic leading-relaxed line-clamp-2">
                                                &quot;{task.description || 'No description provided.'}&quot;
                                            </p>
                                        </div>
                                    </div>

                                    {/* Level Required */}
                                    {task.priority >= 5 && (
                                        <div className="mt-3 flex items-center justify-center gap-2 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded py-2">
                                            <Zap className="w-4 h-4 text-[#00ff88]" />
                                            <span className="text-xs font-mono text-[#00ff88]">
                                                LEVEL REQUIRED: {task.priority}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </main>

            {/* Create Contract Modal */}
            {showCreateModal && (
                <CreateContractModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        loadData(); // Reload tasks
                    }}
                />
            )}
        </div>
    );
}

export default function MarketPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#00ff88] animate-spin mx-auto mb-4" />
                    <p className="text-white font-mono tracking-widest">LOADING MARKET...</p>
                </div>
            </div>
        }>
            <MarketPageContent />
        </Suspense>
    );
}
