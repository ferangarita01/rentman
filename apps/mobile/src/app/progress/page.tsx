'use client';

import React, { useState, useEffect } from 'react';
import WalletConnect from '@/components/WalletConnect';
import { ArrowUpRight, ArrowDownLeft, DollarSign, Building, Plus, RefreshCw } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Browser } from '@capacitor/browser';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import toast from 'react-hot-toast';
import { supabase, getProfile, Profile } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/lib/config';

interface Deposit {
    id: string;
    user_id: string;
    amount: number;
    currency: string;
    status: string;
    type: string;
    description: string;
    created_at: string;
    processed_at?: string; // Added to match transactions table
    metadata?: any;
}

export default function ProgressPage() {
    const { user } = useAuth();
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);

    // Real Data from Stripe Sync Engine
    const [rentmanCredits, setRentmanCredits] = useState(0);
    const [transactions, setTransactions] = useState<Deposit[]>([]);
    const solBalance = 4.2; // Placeholder for crypto

    // Withdraw Modal State
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);

    // Fetch deposits & profile
    const fetchData = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            // 1. Get Profile (Check for Stripe Account)
            const { data: profileData } = await getProfile(user.id);
            if (profileData) setProfile(profileData);

            // 2. Get All Transactions from the real transactions table
            const { data: allTransactions, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching transactions:', error);
                toast.error('Failed to load wallet data');
            } else if (allTransactions && allTransactions.length > 0) {
                // Only count completed transactions for balance
                const completedTxns = allTransactions.filter((t: Deposit) => t.status === 'completed');
                const total = completedTxns.reduce((sum: number, t: Deposit) => sum + Number(t.amount), 0);
                setRentmanCredits(Math.max(0, total));
                setTransactions(allTransactions);
            } else {
                setRentmanCredits(0);
                setTransactions([]);
            }

            // 3. Also check escrow_transactions for held funds
            const { data: escrowData } = await supabase
                .from('escrow_transactions')
                .select('amount, status')
                .eq('requester_id', user.id)
                .in('status', ['held', 'authorized']);

            if (escrowData && escrowData.length > 0) {
                const heldFunds = escrowData.reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0);
                // If there are held funds, we could display them separately
                console.log('[WALLET] Held in escrow:', heldFunds);
            }
        } catch (e) {
            console.error('Wallet fetch error:', e);
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    // Deep link listener for Stripe Connect redirect
    useEffect(() => {
        let listenerHandle: any;

        const setupListener = async () => {
            const handleDeepLink = (event: URLOpenListenerEvent) => {
                console.log('[STRIPE_REDIRECT] Deep link received:', event.url);
                try {
                    const url = new URL(event.url);
                    if (url.hostname === 'rentman.space' && url.pathname.includes('/progress')) {
                        // Handle Stripe Connect success
                        if (url.searchParams.get('success') === 'true') {
                            toast.success('Bank Account Linked Successfully!');
                            fetchData(); // Refresh profile to get stripe_account_id
                            Browser.close(); // Close browser if still open
                        }
                        // Handle refresh (user closed onboarding)
                        if (url.searchParams.get('refresh') === 'true') {
                            toast.error('Onboarding incomplete. Please try again.');
                            Browser.close();
                        }
                    }
                } catch (err) {
                    console.error('[STRIPE_REDIRECT] Error parsing URL:', err);
                }
            };

            listenerHandle = await App.addListener('appUrlOpen', handleDeepLink);
        };

        setupListener();

        return () => {
            if (listenerHandle) {
                listenerHandle.remove();
            }
        };
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // Add Funds via Stripe Checkout
    const handleAddFunds = async () => {
        if (!user) {
            toast.error('Please log in first');
            return;
        }

        const loadingToast = toast.loading('Opening Stripe Checkout...');
        try {
            const BACKEND_URL = config.apiUrl;

            const res = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    amount: 100, // Default $100
                    successUrl: 'https://rentman.space/progress?success=true',
                    cancelUrl: 'https://rentman.space/progress?canceled=true'
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

        const loadingToast = toast.loading('Connecting to Stripe...');
        try {
            const BACKEND_URL = config.apiUrl;

            const res = await fetch(`${BACKEND_URL}/api/stripe/onboard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.email,
                })
            });

            if (!res.ok) throw new Error('Backend error');

            const data = await res.json(); // { url, accountId }

            if (data.accountId) {
                // Persist Stripe Account ID
                await supabase.from('profiles').update({ stripe_account_id: data.accountId }).eq('id', user.id);
                // Update local state
                if (profile) setProfile({ ...profile, stripe_account_id: data.accountId });
            }

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

    // Open Withdraw Modal
    const openWithdrawModal = () => {
        if (!user || !profile?.stripe_account_id) return;
        if (rentmanCredits < 10) {
            toast.error('Minimum withdrawal is $10 USD');
            return;
        }
        setWithdrawAmount('');
        setShowWithdrawModal(true);
    };

    // Withdraw to Bank with selected amount
    const handleWithdrawStripe = async () => {
        if (!user || !profile?.stripe_account_id) return;

        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount < 10) {
            toast.error('Minimum withdrawal is $10 USD');
            return;
        }
        if (amount > rentmanCredits) {
            toast.error('Insufficient balance');
            return;
        }

        setWithdrawing(true);
        const loadingToast = toast.loading('Processing Payout...');
        try {
            const BACKEND_URL = config.apiUrl;

            const res = await fetch(`${BACKEND_URL}/api/stripe/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amount,
                    destinationAccountId: profile.stripe_account_id
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Transfer failed');
            }

            const result = await res.json();

            // Save withdrawal transaction to Supabase (negative amount)
            const { error: insertError } = await supabase.from('transactions').insert({
                user_id: user.id,
                amount: -amount, // Negative for withdrawal
                currency: 'USD',
                status: 'processing', // Will be updated by webhook eventually
                type: 'withdrawal',
                description: `Bank Withdrawal (Transfer: ${result.transferId?.slice(-8) || 'pending'})`,
                processed_at: new Date().toISOString(),
                metadata: {
                    stripe_transfer_id: result.transferId,
                    destination: profile.stripe_account_id
                }
            });

            if (insertError) {
                console.error('Failed to record withdrawal:', insertError);
            }

            toast.dismiss(loadingToast);
            toast.success(`Withdrawal of $${amount.toFixed(2)} initiated!`);
            setShowWithdrawModal(false);
            setWithdrawAmount('');
            fetchData(); // Update balance

        } catch (e: any) {
            toast.dismiss(loadingToast);
            toast.error('Withdraw failed: ' + e.message);
        } finally {
            setWithdrawing(false);
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
                        <span className="text-4xl font-bold text-white tracking-tight">{rentmanCredits === 0 ? '0.00' : ''}</span>
                        <span className="text-[#00ff88] text-sm">USD</span>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={handleAddFunds}
                            className="flex-1 bg-[#00ff88] text-black py-3 rounded-lg font-bold text-xs tracking-wider hover:bg-[#00cc6d] transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> ADD FUNDS
                        </button>

                        {/* Dynamic Withdraw Button */}
                        {profile?.stripe_account_id ? (
                            <button
                                onClick={openWithdrawModal}
                                className="flex-1 bg-[#0a0a0a] border border-white/20 text-white py-3 rounded-lg font-bold text-xs tracking-wider hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                            >
                                <Building size={16} /> WITHDRAW
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    if (!walletAddress) {
                                        toast.error('Connect Wallet first');
                                        return;
                                    }
                                    alert(`Withdraw to Crypto feature is coming soon.`);
                                }}
                                className="flex-1 bg-[#0a0a0a] border border-white/20 text-white py-3 rounded-lg font-bold text-xs tracking-wider hover:bg-white/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                disabled={!walletAddress}
                            >
                                <ArrowUpRight size={16} /> WITHDRAW (CRYPTO)
                            </button>
                        )}
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

                {/* Bank Link Status */}
                <div>
                    <h3 className="text-xs font-mono text-gray-500 mb-3 tracking-widest uppercase">Bank Account</h3>

                    {profile?.stripe_account_id ? (
                        <div className="w-full bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] py-4 rounded-xl flex items-center justify-center gap-2">
                            <Building size={18} /> BANK LINKED
                        </div>
                    ) : (
                        <button
                            onClick={handleLinkBank}
                            className="w-full bg-[#0a0a0a] border border-white/10 text-white py-4 rounded-xl font-bold text-xs tracking-wider hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                        >
                            <Building size={18} /> LINK BANK ACCOUNT (STRIPE)
                        </button>
                    )}
                </div>

                {/* Transaction History */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-mono text-gray-500 tracking-widest uppercase">Transaction History</h3>
                        <span className="text-xs text-[#00ff88]">{transactions.length} total</span>
                    </div>

                    <div className="space-y-3">
                        {transactions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-sm">No transactions yet</p>
                                <p className="text-xs mt-1">Tap &quot;Add Funds&quot; to get started</p>
                            </div>
                        ) : (
                            transactions.map(tx => {
                                const isWithdraw = tx.type === 'withdrawal' || Number(tx.amount) < 0;
                                return (
                                    <div key={tx.id} className={`bg-[#0a0a0a] border p-4 rounded-xl flex justify-between items-center transition-colors ${isWithdraw ? 'border-orange-500/20 hover:border-orange-500/40' : 'border-white/5 hover:border-[#00ff88]/30'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isWithdraw ? 'bg-orange-500/10 text-orange-400' : 'bg-[#00ff88]/10 text-[#00ff88]'}`}>
                                                {isWithdraw ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-white">{tx.description}</p>
                                                <p className="text-xs text-gray-500">{formatDate(tx.processed_at || tx.created_at)} • {tx.status}</p>
                                            </div>
                                        </div>
                                        <div className={`font-mono font-bold ${isWithdraw ? 'text-orange-400' : 'text-[#00ff88]'}`}>
                                            {isWithdraw ? '-' : '+'}${Math.abs(Number(tx.amount)).toFixed(2)}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm p-6">
                        <h2 className="text-xl font-bold text-white mb-2">Withdraw Funds</h2>
                        <p className="text-gray-400 text-sm mb-6">Available: <span className="text-[#00ff88]">${rentmanCredits.toFixed(2)}</span></p>

                        {/* Amount Input */}
                        <div className="relative mb-4">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">$</span>
                            <input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-black border border-white/20 rounded-xl py-4 pl-10 pr-4 text-2xl font-mono text-white focus:border-[#00ff88] focus:outline-none transition-colors"
                                min="10"
                                max={rentmanCredits}
                            />
                        </div>

                        {/* Quick Amount Buttons */}
                        <div className="grid grid-cols-4 gap-2 mb-6">
                            {[25, 50, 100, rentmanCredits].map((amt, i) => (
                                <button
                                    key={amt}
                                    onClick={() => setWithdrawAmount(amt.toString())}
                                    className="bg-white/5 border border-white/10 py-2 rounded-lg text-sm font-mono text-white hover:bg-[#00ff88]/10 hover:border-[#00ff88]/30 transition-colors"
                                >
                                    {i === 3 ? 'MAX' : `$${amt}`}
                                </button>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowWithdrawModal(false)}
                                className="flex-1 bg-white/5 border border-white/20 py-3 rounded-xl font-bold text-white text-sm"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleWithdrawStripe}
                                disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) < 10}
                                className="flex-1 bg-[#00ff88] py-3 rounded-xl font-bold text-black text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {withdrawing ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                                ) : (
                                    <><ArrowUpRight size={16} /> WITHDRAW</>
                                )}
                            </button>
                        </div>

                        {/* Info */}
                        <p className="text-xs text-gray-500 text-center mt-4">Funds typically arrive in 1-3 business days</p>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
