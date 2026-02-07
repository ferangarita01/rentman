'use client';

import React, { useState } from 'react';
import { X, CreditCard, Wallet } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCardForm from './StripeCardForm';
import { connectWallet } from '../lib/solana';

// Initialize Stripe with Public Key (Env Var)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [walletAddr, setWalletAddr] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCryptoPayment = async () => {
    setLoading(true);
    try {
      const address = await connectWallet();
      if (address) {
        setWalletAddr(address);
        // Simulate transaction
        setTimeout(() => {
          setLoading(false);
          alert(`Connected: ${address}\n\nTransfer request sent! (Mocked)`);
          onSuccess?.();
        }, 1000);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
      alert('Failed to connect wallet');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white font-mono uppercase tracking-wide">Add Credits</h2>
          <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-widest">Deposit Funds to Your Account</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Payment Method Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex-1 py-3 px-4 rounded-lg border transition-all font-mono text-sm ${paymentMethod === 'card'
                  ? 'bg-[#00ff88] text-black border-[#00ff88]'
                  : 'bg-[#1a1a1a] text-gray-400 border-white/10 hover:border-white/20'
                }`}
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              Card
            </button>
            <button
              onClick={() => setPaymentMethod('crypto')}
              className={`flex-1 py-3 px-4 rounded-lg border transition-all font-mono text-sm ${paymentMethod === 'crypto'
                  ? 'bg-[#00ff88] text-black border-[#00ff88]'
                  : 'bg-[#1a1a1a] text-gray-400 border-white/10 hover:border-white/20'
                }`}
            >
              <Wallet className="w-4 h-4 inline mr-2" />
              Crypto
            </button>
          </div>

          {/* Amount Selection */}
          <div className="mb-6">
            <label className="block text-xs font-mono text-slate-500 uppercase mb-2">Amount (USD)</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[50, 100, 250].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`py-3 rounded-lg border transition-all font-mono text-sm ${amount === val
                      ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]'
                      : 'bg-[#1a1a1a] text-gray-400 border-white/10 hover:border-white/20'
                    }`}
                >
                  ${val}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min="10"
              max="10000"
              className="w-full bg-black border border-white/10 text-white py-3 px-4 rounded-lg focus:border-[#00ff88] focus:outline-none font-mono"
              placeholder="Custom amount"
            />
          </div>

          {/* Card Payment Form (Stripe) */}
          {paymentMethod === 'card' && (
            <Elements stripe={stripePromise}>
              <StripeCardForm
                amount={amount}
                onSuccess={() => {
                  alert('Payment Successful! (Mocked)');
                  onSuccess?.();
                }}
                onError={(msg) => alert('Error: ' + msg)}
              />
            </Elements>
          )}

          {/* Crypto Payment Info */}
          {paymentMethod === 'crypto' && (
            <div className="space-y-4">
              <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
                <p className="text-xs text-slate-400 font-mono mb-2">PAYMENT METHOD</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#00ff88]/10 rounded-full flex items-center justify-center border border-[#00ff88]/30">
                    <Wallet className="w-5 h-5 text-[#00ff88]" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-mono font-bold">Phantom Wallet</p>
                    <p className="text-xs text-slate-500 font-mono">Pay with SOL</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-mono">
                  Connect your wallet to deposit SOL directly.
                </p>
              </div>

              <button
                onClick={handleCryptoPayment}
                disabled={loading}
                className="w-full py-4 bg-[#00ff88] text-black font-mono text-sm font-bold uppercase rounded-lg hover:bg-[#33ff99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Connecting...' : 'Connect Phantom & Pay'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
