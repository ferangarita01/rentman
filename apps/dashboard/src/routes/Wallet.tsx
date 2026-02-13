import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, ArrowUpRight, ArrowDownLeft, Plus, History } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import { supabase } from '../lib/supabase';

interface Transaction {
    id: string;
    type: 'earning' | 'withdrawal' | 'bonus' | 'penalty' | 'refund' | 'deposit';
    amount: number;
    description: string | null;
    created_at: string;
    status: string;
}

interface WalletPageProps {
    embedded?: boolean;
}

const WalletPage: React.FC<WalletPageProps> = ({ embedded = false }) => {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const walletFormRef = React.useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (walletFormRef.current) {
            if (!walletAddress) {
                walletFormRef.current.setAttribute('toolname', 'connect_wallet');
                walletFormRef.current.setAttribute('tooldescription', 'Connect Phantom Solana Wallet to the dashboard.');
            } else {
                walletFormRef.current.setAttribute('toolname', 'disconnect_wallet');
                walletFormRef.current.setAttribute('tooldescription', 'Disconnect the currently connected wallet.');
            }
            walletFormRef.current.setAttribute('toolautosubmit', 'true');
        }
    }, [walletAddress]);

    // Real Data State
    const [credits, setCredits] = useState<number>(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setUserId(session.user.id);

        // 1. Get Deposits from Stripe Sync Engine (via secure function)
        const { data: deposits, error } = await supabase.rpc('get_my_deposits');

        if (error) {
            console.error('Error fetching deposits:', error);
            setLoading(false);
            return;
        }

        // 2. Calculate total balance from deposits (Stripe Sync Engine is source of truth)
        if (deposits && deposits.length > 0) {
            const totalCredits = deposits.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
            setCredits(totalCredits);

            // Map Stripe deposits to Transaction format
            const mappedTxs: Transaction[] = deposits.map((d: any) => ({
                id: d.id,
                type: 'deposit' as const,
                amount: Number(d.amount),
                description: d.description,
                created_at: d.created_at,
                status: d.status
            }));
            setTransactions(mappedTxs);
        } else {
            setCredits(0);
            setTransactions([]);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();

        // Realtime Subscription
        const channel = supabase
            .channel('wallet_changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'transactions' },
                () => {
                    console.log('🔔 New transaction! Updating wallet...');
                    fetchData(); // Refresh data on new transaction
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const connectPhantom = async () => {
        if (typeof window !== 'undefined' && (window as any).solana) {
            try {
                const { publicKey } = await (window as any).solana.connect();
                setWalletAddress(publicKey.toString());
            } catch (err) {
                console.error(err);
            }
        } else {
            window.open('https://phantom.app/', '_blank');
        }
    };

    const disconnectWallet = () => {
        setWalletAddress(null);
        if (typeof window !== 'undefined' && (window as any).solana) {
            (window as any).solana.disconnect();
        }
    };

    // Helper to format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'earning': return '💰';
            case 'deposit': return <ArrowDownLeft size={18} />;
            case 'withdrawal': return <ArrowUpRight size={18} />;
            default: return '📄';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'earning': return 'bg-[#00ff88]/10 text-[#00ff88]';
            case 'deposit': return 'bg-blue-500/10 text-blue-500';
            case 'withdrawal': return 'bg-red-500/10 text-red-500';
            default: return 'bg-slate-500/10 text-slate-500';
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-[#050505] text-white p-8 flex items-center justify-center font-mono">Loading Wallet...</div>;
    }

    return (
        <div className={embedded ? "w-full text-white" : "min-h-screen bg-[#050505] text-white p-8"}>
            <div className={embedded ? "" : "max-w-6xl mx-auto"}>
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold font-mono tracking-wider">WALLET</h1>
                        <p className="text-slate-500 text-sm font-mono mt-1 uppercase tracking-widest">Manage Your Funds</p>
                    </div>
                    {!embedded && (
                        <a
                            href="/dashboard"
                            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white text-sm font-mono hover:bg-white/5 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                            </svg>
                            Dashboard
                        </a>
                    )}
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {/* Balance Card */}
                    <div className="md:col-span-2 bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/10 rounded-2xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ff88]/5 rounded-full blur-3xl" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="text-slate-400 text-sm font-mono tracking-widest uppercase">Available Balance</span>
                                    <div className="mt-2 flex items-baseline gap-2">
                                        <span className="text-5xl font-bold text-white tracking-tight">${credits.toFixed(2)}</span>
                                        <span className="text-[#00ff88] text-lg font-mono">USD</span>
                                        <button
                                            onClick={fetchData}
                                            className="ml-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                            title="Refresh Balance"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="h-12 w-12 bg-[#00ff88]/10 rounded-full flex items-center justify-center border border-[#00ff88]/30">
                                    <Wallet className="text-[#00ff88]" size={24} />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsPaymentModalOpen(true)}
                                    className="flex-1 bg-[#00ff88] text-black py-3 rounded-lg font-mono font-bold text-sm tracking-wider hover:bg-[#33ff99] transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} /> Add Funds
                                </button>
                                <button
                                    onClick={() => alert(walletAddress ? 'Withdraw feature coming soon!' : 'Please connect wallet first')}
                                    disabled={!walletAddress}
                                    className="flex-1 bg-[#1a1a1a] border border-white/20 text-white py-3 rounded-lg font-mono font-bold text-sm tracking-wider hover:bg-white/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ArrowUpRight size={18} /> Withdraw
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Crypto Connection Card */}
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Crypto Wallet</h3>

                        <form
                            ref={walletFormRef}
                            onSubmit={(e) => {
                                e.preventDefault();
                                !walletAddress ? connectPhantom() : disconnectWallet();
                            }}
                        >
                            {!walletAddress ? (
                                <button
                                    type="submit"
                                    className="w-full bg-[#00ff88]/10 hover:bg-[#00ff88]/20 border border-[#00ff88] text-[#00ff88] py-4 px-4 rounded-lg font-mono flex items-center justify-center gap-2 transition-all"
                                >
                                    <Wallet size={20} />
                                    <span className="font-bold text-sm">Connect Phantom</span>
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <div className="bg-black border border-white/10 rounded-lg p-3">
                                        <p className="text-[10px] text-slate-500 font-mono mb-1">CONNECTED</p>
                                        <p className="text-white text-xs font-mono break-all">
                                            {walletAddress.substring(0, 8)}...{walletAddress.substring(walletAddress.length - 8)}
                                        </p>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full py-2 text-sm text-red-500 hover:text-red-400 font-mono"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            )}
                        </form>

                        <div className="mt-6 pt-6 border-t border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse"></div>
                                <span className="text-[10px] text-[#00ff88] font-mono uppercase tracking-widest">Supported Networks</span>
                            </div>
                            <p className="text-xs text-slate-500 font-mono">Solana (SOL)</p>
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <History className="text-[#00ff88]" size={20} />
                            <h3 className="text-sm font-mono text-white uppercase tracking-widest">Transaction History</h3>
                        </div>
                        <button className="text-xs text-[#00ff88] hover:text-[#00ff88]/80 font-mono">View All</button>
                    </div>

                    <div className="space-y-2">
                        {transactions.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 font-mono text-sm">
                                No transactions found.
                            </div>
                        ) : (
                            transactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between p-4 bg-[#111] border border-white/5 rounded-lg hover:border-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(tx.type)}`}>
                                            {getTypeIcon(tx.type)}
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-mono">{tx.description || tx.type.toUpperCase()}</p>
                                            <p className="text-slate-500 text-xs font-mono">{formatDate(tx.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-bold font-mono ${(tx.type === 'deposit' || tx.type === 'earning' || tx.type === 'bonus') ? 'text-[#00ff88]' : 'text-red-500'
                                            }`}>
                                            {(tx.type === 'deposit' || tx.type === 'earning' || tx.type === 'bonus') ? '+' : ''}
                                            {Number(tx.amount).toFixed(2)} USD
                                        </p>
                                        <p className="text-[10px] text-slate-600 font-mono uppercase">{tx.status}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {userId && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    userId={userId}
                    onSuccess={() => {
                        setIsPaymentModalOpen(false);
                        // fetchData() called automatically by realtime subscription
                        alert('Payment successful! Credits adding shortly...');
                    }}
                />
            )}
        </div>
    );
};

export default WalletPage;
