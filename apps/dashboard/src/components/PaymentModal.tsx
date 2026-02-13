'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, CreditCard, Wallet } from 'lucide-react';
import { connectWallet } from '../lib/solana';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string; // Add userId prop
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess, userId }) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');
  const [amount, setAmount] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [walletAddr, setWalletAddr] = useState<string | null>(null);

  // WebMCP: Form Reference
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (formRef.current) {
      formRef.current.setAttribute('toolname', 'deposit_funds');
      formRef.current.setAttribute('tooldescription', 'Deposit funds into the account via Card (Stripe) or Crypto (Solana)');
      formRef.current.setAttribute('toolautosubmit', 'true');
    }
  }, [isOpen]);

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

  const handleCardPayment = async () => {
    setLoading(true);
    try {
      const BACKEND_URL = import.meta.env.VITE_AGENT_GATEWAY_URL || 'https://rentman-backend-346436028870.us-east1.run.app';
      const res = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          userId,
          returnUrl: window.location.origin + '/wallet'
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to init checkout');
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      alert('Payment Error');
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'card') {
      handleCardPayment();
    } else {
      handleCryptoPayment();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white font-mono uppercase tracking-wide">Add Credits</h2>
          <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-widest">Deposit Funds to Your Account</p>
        </div>

        {/* Content as Form for WebMCP */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-6">
          {/* Agent Context: Hidden Input to declarative state */}
          <input type="hidden" name="payment_method" value={paymentMethod} />

          {/* Payment Method Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
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
              type="button"
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
              name="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min="10"
              max="10000"
              className="w-full bg-black border border-white/10 text-white py-3 px-4 rounded-lg focus:border-[#00ff88] focus:outline-none font-mono"
              placeholder="Custom amount"
            />
          </div>

          {/* Card Payment Form (Stripe Checkout) */}
          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-[#6772e5]/20 rounded flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#6772e5] text-lg">lock</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-mono font-bold">Stripe Secure Checkout</p>
                    <p className="text-xs text-slate-500 font-mono">Redirects to Stripe.com</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#6772e5] text-white font-mono text-sm font-bold uppercase rounded-lg hover:bg-[#5469d4] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Redirecting...' : `Pay $${amount} via Stripe`}
              </button>
            </div>
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
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#00ff88] text-black font-mono text-sm font-bold uppercase rounded-lg hover:bg-[#33ff99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Connecting...' : 'Connect Phantom & Pay'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
