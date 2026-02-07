'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, LogOut, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface WalletConnectProps {
    onConnect: (address: string) => void;
    onDisconnect: () => void;
}

export default function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
    const [provider, setProvider] = useState<any>(null);
    const [connected, setConnected] = useState(false);
    const [pubKey, setPubKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if ('solana' in window) {
            const solana = (window as any).solana;
            if (solana?.isPhantom) {
                setProvider(solana);
                // Auto-connect if trusted
                solana.connect({ onlyIfTrusted: true })
                    .then(({ publicKey }: { publicKey: any }) => {
                        handleConnected(publicKey.toString());
                    })
                    .catch(() => {
                        // Not connected yet
                    });
            }
        }
    }, []);

    const handleConnected = (key: string) => {
        setPubKey(key);
        setConnected(true);
        onConnect(key);
        toast.success('Wallet Connected!');
    };

    const connectWallet = async () => {
        if (provider) {
            try {
                const { publicKey } = await provider.connect();
                handleConnected(publicKey.toString());
            } catch (err) {
                console.error(err);
                toast.error('Connection failed');
            }
        } else {
            window.open('https://phantom.app/', '_blank');
        }
    };

    const disconnectWallet = async () => {
        if (provider) {
            try {
                await provider.disconnect();
                setPubKey(null);
                setConnected(false);
                onDisconnect();
                toast.success('Disconnected');
            } catch (err) {
                console.error(err);
            }
        }
    };

    const copyAddress = () => {
        if (pubKey) {
            navigator.clipboard.writeText(pubKey);
            setCopied(true);
            toast.success('Address Copied');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="w-full">
            {!connected ? (
                <button
                    onClick={connectWallet}
                    className="w-full relative group overflow-hidden bg-[#00ff88]/10 hover:bg-[#00ff88]/20 border border-[#00ff88] text-[#00ff88] py-4 px-6 rounded-xl font-mono flex items-center justify-center gap-3 transition-all"
                >
                    <div className="absolute inset-0 bg-[#00ff88]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <Wallet size={20} />
                    <span className="relative z-10 font-bold tracking-wider">CONNECT PHANTOM</span>
                </button>
            ) : (
                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-400 text-xs font-mono">CONNECTED WALLET</span>
                        <div className="flex gap-2">
                            <button onClick={copyAddress} className="text-gray-400 hover:text-white transition-colors">
                                {copied ? <Check size={16} className="text-[#00ff88]" /> : <Copy size={16} />}
                            </button>
                            <button onClick={disconnectWallet} className="text-red-500 hover:text-red-400 transition-colors">
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="font-mono text-white break-all text-sm bg-black/50 p-3 rounded-lg border border-white/5">
                        {pubKey}
                    </div>

                    <div className="flex gap-2 mt-4">
                        <div className="h-2 w-2 rounded-full bg-[#00ff88] animate-pulse my-auto" />
                        <span className="text-[#00ff88] text-xs">Solana Network Active</span>
                    </div>
                </div>
            )}
        </div>
    );
}
