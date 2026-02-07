import React, { useState } from 'react';
import { Wallet, CreditCard, ArrowUpRight, ArrowDownLeft, Plus, History } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';

const WalletPage: React.FC = () => {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);

    // Mock Data
    const credits = 1250.00;
    const transactions = [
        { id: 1, type: 'EARNED', amount: 50, description: 'Contract #8291 - Delivery', date: '2024-02-07', status: 'COMPLETED' },
        { id: 2, type: 'WITHDRAW', amount: -600, description: 'Withdrawal to Phantom', date: '2024-02-06', status: 'COMPLETED' },
        { id: 3, type: 'DEPOSIT', amount: 500, description: 'Card Deposit', date: '2024-02-05', status: 'COMPLETED' },
        { id: 4, type: 'EARNED', amount: 150, description: 'Contract #8290 - Verification', date: '2024-02-04', status: 'COMPLETED' },
    ];

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

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-mono tracking-wider">WALLET</h1>
                    <p className="text-slate-500 text-sm font-mono mt-1 uppercase tracking-widest">Manage Your Funds</p>
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
                        
                        {!walletAddress ? (
                            <button
                                onClick={connectPhantom}
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
                                    onClick={disconnectWallet}
                                    className="w-full py-2 text-sm text-red-500 hover:text-red-400 font-mono"
                                >
                                    Disconnect
                                </button>
                            </div>
                        )}

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
                        {transactions.map((tx) => (
                            <div
                                key={tx.id}
                                className="flex items-center justify-between p-4 bg-[#111] border border-white/5 rounded-lg hover:border-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        tx.type === 'EARNED' ? 'bg-[#00ff88]/10 text-[#00ff88]' :
                                        tx.type === 'DEPOSIT' ? 'bg-blue-500/10 text-blue-500' :
                                        'bg-red-500/10 text-red-500'
                                    }`}>
                                        {tx.type === 'EARNED' && '💰'}
                                        {tx.type === 'DEPOSIT' && <ArrowDownLeft size={18} />}
                                        {tx.type === 'WITHDRAW' && <ArrowUpRight size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-mono">{tx.description}</p>
                                        <p className="text-slate-500 text-xs font-mono">{tx.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-lg font-bold font-mono ${
                                        tx.amount > 0 ? 'text-[#00ff88]' : 'text-red-500'
                                    }`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} USD
                                    </p>
                                    <p className="text-[10px] text-slate-600 font-mono uppercase">{tx.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSuccess={() => {
                    setIsPaymentModalOpen(false);
                    alert('Payment successful! Credits added to your account.');
                }}
            />
        </div>
    );
};

export default WalletPage;
