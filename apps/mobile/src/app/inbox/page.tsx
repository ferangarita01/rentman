'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

export default function InboxPage() {
    const router = useRouter();

    // Mock data for prototype - in real app, fetch from Supabase
    const threads = [
        {
            id: 'ai',
            type: 'ai',
            name: 'RENTMAN_OS',
            lastMessage: 'System online. Ready for tasking.',
            time: 'Now',
            unread: 0,
            status: 'online'
        },
        {
            id: 'contract-8291',
            type: 'contract',
            name: 'Contract #8291',
            subtitle: 'Delivery • Downtown',
            lastMessage: 'Please confirm drop-off location.',
            time: '10m',
            unread: 1,
            status: 'waiting'
        },
        {
            id: 'contract-7732',
            type: 'contract',
            name: 'Contract #7732',
            subtitle: 'Verification • North End',
            lastMessage: 'Photos received. Verifying...',
            time: '2h',
            unread: 0,
            status: 'closed'
        }
    ];

    return (
        <div className="flex flex-col min-h-screen bg-[#050505] font-sans">
            {/* Header */}
            <header className="px-4 py-4 pt-6 border-b border-[#333] sticky top-0 bg-[#050505]/95 backdrop-blur z-10">
                <div className="flex justify-between items-center mb-1">
                    <h1 className="text-2xl font-bold text-white font-mono tracking-wider">COMLINK</h1>
                    <div className="flex gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse"></span>
                        <span className="text-[10px] text-[#00ff88] font-mono tracking-widest">SECURE</span>
                    </div>
                </div>
                <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">
                    Unified Message Stream
                </p>
            </header>

            {/* Thread List */}
            <main className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
                {threads.map((thread) => (
                    <button
                        key={thread.id}
                        onClick={() => {
                            if (thread.type === 'ai') router.push('/assistant');
                            else router.push(`/contract/chat?id=${thread.id}`);
                        }}
                        className="w-full text-left p-4 rounded-xl border border-[#333] bg-[#111] hover:bg-[#161616] hover:border-[#444] transition-all group active:scale-[0.98]"
                    >
                        <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${thread.type === 'ai'
                                    ? 'bg-[#00ff88]/10 border-[#00ff88]/30 shadow-[0_0_15px_rgba(0,255,136,0.1)]'
                                    : 'bg-[#222] border-[#444]'
                                }`}
                            >
                                {thread.type === 'ai' ? (
                                    <Sparkles className="w-6 h-6 text-[#00ff88]" />
                                ) : (
                                    <span className="font-mono font-bold text-gray-300">#{thread.name.split('#')[1].substring(0, 2)}</span>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className={`font-bold text-sm truncate ${thread.type === 'ai' ? 'text-white' : 'text-gray-200'}`}>
                                        {thread.name}
                                    </h3>
                                    <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap ml-2">
                                        {thread.time}
                                    </span>
                                </div>

                                {thread.subtitle && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${thread.unread > 0 ? 'bg-[#00ff88]' : 'bg-gray-600'}`}></span>
                                        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wide truncate">
                                            {thread.subtitle}
                                        </p>
                                    </div>
                                )}

                                <p className={`text-xs mt-2 truncate font-mono ${thread.unread > 0 ? 'text-white' : 'text-gray-500'}`}>
                                    {thread.type === 'ai' && <span className="text-[#00ff88] mr-1">{'>'}</span>}
                                    {thread.lastMessage}
                                </p>
                            </div>

                            {/* Arrow */}
                            <div className="self-center pl-2 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                                <ArrowRight className="w-4 h-4 text-[#00ff88]" />
                            </div>
                        </div>
                    </button>
                ))}
            </main>

            <BottomNav />
        </div>
    );
}
