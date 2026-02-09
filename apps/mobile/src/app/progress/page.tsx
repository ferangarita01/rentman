'use client';

import React, { useState, useEffect } from 'react';
import WalletConnect from '@/components/WalletConnect';
import { ArrowUpRight, ArrowDownLeft, DollarSign, Building, Plus, RefreshCw } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Browser } from '@capacitor/browser';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';

interface Deposit {
    id: string;
    user_id: string;
    amount: number;
    currency: string;
    status: string;
    type: string;
    description: string;
    created_at: string;
}

export default function ProgressPage() {
    const { user } = useAuth();
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Real Data from Stripe Sync Engine
    const [rentmanCredits, setRentmanCredits] = useState(0);
    const [transactions, setTransactions] = useState<Deposit[]>([]);
    const solBalance = 4.2; // Placeholder for crypto

    // Fetch deposits from Stripe Sync Engine
    const fetchDeposits = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const { data: deposits, error } = await supabase.rpc('get_my_deposits');

            if (error) {
                console.error('Error fetching deposits:', error);
                toast.error('Failed to load wallet data');
            } else if (deposits && deposits.length > 0) {
                const total = deposits.reduce((sum: number, d: Deposit) => sum + Number(d.amount), 0);
                setRentmanCredits(total);
                setTransactions(deposits);
            } else {
                setRentmanCredits(0);
                setTransactions([]);
            }
        } catch (e) {
            console.error('Wallet fetch error:', e);
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchDeposits();
    }, [user]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDeposits();
    };

    // Add Funds via Stripe Checkout
    const handleAddFunds = async () => {
        if (!user) {
            toast.error('Please log in first');
            return;
        }

        const loadingToast = toast.loading('Opening Stripe Checkout...');
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://rentman-backend-346436028870.us-east1.run.app';

            const res = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    amount: 100, // Default $100
                    successUrl: 'https://rentman.space/wallet?success=true',
                    cancelUrl: 'https://rentman.space/wallet?canceled=true'
                })
            });

            if (!res.ok) throw new Error('Backend error');

            const data = await res.json();
            if (data.url) {
                await Browser.open({ url: data.url });
                toast.dismiss(loadingToast);
                toast.success('Complete payment in browser');
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (e: any) {
            toast.dismiss(loadingToast);
            toast.error('Checkout failed: ' + e.message);
        }
    };

    // Link Bank Account (Stripe Connect)
    const handleLinkBank = async () => {
        if (!user) {
            toast.error('Please log in first');
            return;
        }

        const loadingToast = toast.loading('Taking you to Stripe...');
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://rentman-backend-346436028870.us-east1.run.app';

            const res = await fetch(`${BACKEND_URL}/api/stripe/onboard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.email,
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

    // Format date helper
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00ff88] border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pb-24 font-sans">
            {/* Header */}
            <div className="p-6 pt-12 border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-wider">FINANCE</h1>
                        <p className="text-gray-400 text-xs font-mono mt-1">WALLET BALANCE</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10"
                        >
                            <RefreshCw className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} size={18} />
                        </button>
                        <div className="h-10 w-10 bg-[#00ff88]/10 rounded-full flex items-center justify-center border border-[#00ff88]/30">
                            <DollarSign className="text-[#00ff88]" size={20} />
                        </div>
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
                            onClick={handleAddFunds}
                            className="flex-1 bg-[#00ff88] text-black py-3 rounded-lg font-bold text-xs tracking-wider hover:bg-[#00cc6d] transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> ADD FUNDS
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

                {/* Bank Link */}
                <div>
                    <h3 className="text-xs font-mono text-gray-500 mb-3 tracking-widest uppercase">Bank Account</h3>
                    <button
                        onClick={handleLinkBank}
                        className="w-full bg-[#0a0a0a] border border-white/10 text-white py-4 rounded-xl font-bold text-xs tracking-wider hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                    >
                        <Building size={18} /> LINK BANK ACCOUNT (STRIPE)
                    </button>
                </div>

                {/* Transaction History */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-mono text-gray-500 tracking-widest uppercase">Recent Deposits</h3>
                        <span className="text-xs text-[#00ff88]">{transactions.length} total</span>
                    </div>

                    <div className="space-y-3">
                        {transactions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-sm">No deposits yet</p>
                                <p className="text-xs mt-1">Tap "Add Funds" to get started</p>
                            </div>
                        ) : (
                            transactions.map(tx => (
                                <div key={tx.id} className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl flex justify-between items-center hover:border-[#00ff88]/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[#00ff88]/10 text-[#00ff88]">
                                            <ArrowDownLeft size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-white">{tx.description}</p>
                                            <p className="text-xs text-gray-500">{formatDate(tx.created_at)} • {tx.status}</p>
                                        </div>
                                    </div>
                                    <div className="font-mono font-bold text-[#00ff88]">
                                        +${Number(tx.amount).toFixed(2)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            <BottomNav />
        </div>
    );
}
