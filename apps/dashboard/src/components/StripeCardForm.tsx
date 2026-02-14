import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '../lib/supabase';

interface StripeCardFormProps {
    amount: number;
    userId: string; // Add userId prop
    onSuccess: () => void;
    onError: (msg: string) => void;
}

export default function StripeCardForm({ amount, userId, onSuccess, onError }: StripeCardFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);

        // 1. Create a PaymentIntent on the backend
        try {
            const BACKEND_URL = import.meta.env.VITE_AGENT_GATEWAY_URL || 'https://rentman-backend-346436028870.us-east1.run.app';
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const { clientSecret } = await fetch(`${BACKEND_URL}/api/create-payment-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount, userId }), // Pass userId
            }).then(r => r.json());

            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement) as any,
                },
            });

            if (result.error) {
                onError(result.error.message || 'Payment failed');
            } else {
                if (result.paymentIntent.status === 'succeeded') {
                    onSuccess();
                }
            }

        } catch (err: any) {
            onError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
                <p className="text-xs text-slate-400 font-mono mb-2">CARD DETAILS</p>
                <div className="bg-black border border-white/10 p-3 rounded">
                    <CardElement options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#fff',
                                '::placeholder': {
                                    color: '#6b7280',
                                },
                            },
                            invalid: {
                                color: '#ef4444',
                            },
                        },
                    }} />
                </div>
            </div>

            <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full py-4 bg-[#00ff88] text-black font-mono text-sm font-bold uppercase rounded-lg hover:bg-[#33ff99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {processing ? 'Processing...' : `Pay $${(amount * 1.03).toFixed(2)}`}
            </button>

            <p className="text-xs text-slate-600 font-mono text-center">
                🔒 Secured by Stripe.
            </p>
        </form>
    );
}
