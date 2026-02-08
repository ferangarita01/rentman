'use client';

import React, { useState } from 'react';
import WalletConnect from '@/components/WalletConnect';
import { ArrowUpRight, ArrowDownLeft, History, Wallet, CreditCard, DollarSign, Building } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Browser } from '@capacitor/browser';
import toast from 'react-hot-toast';

export default function ProgressPage() {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);

    // Mock Data
    const rentmanCredits = 1250.00; // $1250.00
    const solBalance = 4.2; // ~ $600

    const transactions = [
        { id: 1, type: 'EARNED', amount: 50, task: 'Delivery #8291', date: '2 min ago', status: 'CONFIRMED' },
        { id: 2, type: 'WITHDRAW', amount: -600, task: 'To Phantom', date: '1 day ago', status: 'COMPLETED' },
        { id: 3, type: 'EARNED', amount: 150, task: 'Drone Surveillance', date: '2 days ago', status: 'CONFIRMED' },
    ];

    const handleLinkBank = async () => {
        const loadingToast = toast.loading('Taking you to Stripe...');
        try {
            // TODO: Use real Env Var for Cloud Run URL
            const BACKEND_URL = 'https://rentman-backend-346436028870.us-east1.run.app';
            // Fallback to local if needed: 'http://10.0.2.2:8080'

            const res = await fetch(`${BACKEND_URL}/api/stripe/onboard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'agt_007',
                    email: 'agent007@rentman.io',
                    firstName: 'James', // Prefill for speed
                    lastName: 'Bond'
                })
            });

            if (!res.ok) throw new Error('Backend error');

            const data = await res.json();
            if (data.url) {
                await Browser.open({ url: data.url });
                toast.dismiss(loadingToast);
            } else {
                throw new Error('No URL returned');
            }
        } catch (e: any) {
            toast.dismiss(loadingToast);
            toast.error('Connect failed: ' + e.message);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white pb-24 font-sans">
            {/* Header */}
            <div className="p-6 pt-12 border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-wider">FINANCE</h1>
                        <p className="text-gray-400 text-xs font-mono mt-1">OPERATIVE ID: AGT-007</p>
                    </div>
                    <div className="h-10 w-10 bg-[#00ff88]/10 rounded-full flex items-center justify-center border border-[#00ff88]/30">
                        <DollarSign className="text-[#00ff88]" size={20} />
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">

                {/* Balance Card */}
                <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff88]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <span className="text-gray-400 text-sm font-mono tracking-widest">TOTAL BALANCE</span>
                    <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white tracking-tight">${rentmanCredits.toFixed(2)}</span>
                        <span className="text-[#00ff88] text-sm">USD</span>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={handleLinkBank}
                            className="flex-1 bg-white text-black py-3 rounded-lg font-bold text-xs tracking-wider hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <Building size={16} /> LINK BANK
                        </button>
                        <button
                            onClick={() => {
                                if (!walletAddress) {
                                    alert('Please connect your Phantom wallet first!');
                                    return;
                                }
                                if (rentmanCredits < 10) {
                                    alert('Minimum withdrawal is $10 USD');
                                    return;
                                }
                                alert(`Withdraw to Crypto\n\nConverting ${rentmanCredits.toFixed(2)} USD to SOL\nDestination: ${walletAddress.substring(0, 8)}...${walletAddress.substring(walletAddress.length - 4)}\n\nFeature coming soon!`);
                            }}
                            className="flex-1 bg-[#0a0a0a] border border-white/20 text-white py-3 rounded-lg font-bold text-xs tracking-wider hover:bg-white/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!walletAddress}
                        >
                            <ArrowUpRight size={16} /> WITHDRAW
                        </button>
                    </div>
                </div>

                {/* Crypto Connection */}
                <div>
                    <h3 className="text-xs font-mono text-gray-500 mb-3 tracking-widest uppercase">Crypto Link</h3>
                    <WalletConnect
                        onConnect={(addr) => setWalletAddress(addr)}
                        onDisconnect={() => setWalletAddress(null)}
                    />
                    {walletAddress && (
                        <div className="mt-2 text-right">
                            <span className="text-xs text-gray-400 mr-2">Est. SOL Balance:</span>
                            <span className="text-[#00ff88] font-mono">{solBalance} SOL</span>
                        </div>
                    )}
                </div>

                {/* Transaction History */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-mono text-gray-500 tracking-widest uppercase">Recent Activity</h3>
                        <button className="text-xs text-[#00ff88] hover:text-[#00ff88]/80">View All</button>
                    </div>

                    <div className="space-y-3">
                        {transactions.map(tx => (
                            <div key={tx.id} className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl flex justify-between items-center hover:border-[#00ff88]/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tx.type === 'EARNED' ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-red-500/10 text-red-500'}`}>
                                        {tx.type === 'EARNED' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-white">{tx.task}</p>
                                        <p className="text-xs text-gray-500">{tx.date} • {tx.status}</p>
                                    </div>
                                </div>
                                <div className={`font-mono font-bold ${tx.type === 'EARNED' ? 'text-[#00ff88]' : 'text-white'}`}>
                                    {tx.type === 'EARNED' ? '+' : ''}{tx.amount}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            <BottomNav />
        </div>
    );
}
