'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { supabase, getThreads, Thread } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';

export default function InboxPage() {
    const router = useRouter();
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, loading: authLoading } = useAuth();

    // Hide navigation bar on this page
    useEffect(() => {
        const nav = document.querySelector('nav');
        if (nav) {
            nav.style.display = 'none';
        }
        return () => {
            const nav = document.querySelector('nav');
            if (nav) {
                nav.style.display = '';
            }
        };
    }, []);

    // Load threads when user is available
    useEffect(() => {
        if (user) {
            loadThreadsData(user.id);
        } else if (!authLoading && !user) {
            setError('Please log in to view messages');
            setLoading(false);
        }
    }, [user, authLoading]);

    // Set up real-time subscription for new messages
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('inbox-messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                () => {
                    // Reload threads when new message arrives
                    loadThreadsData(user.id);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    async function loadThreadsData(uid: string) {
        setLoading(true);
        setError(null);
        
        const { data, error: threadsError } = await getThreads(uid);

        // Always show AI assistant thread
        const aiThread: Thread = {
            id: 'ai-assistant',
            task_id: 'ai',
            task_title: 'RENTMAN_OS',
            task_type: 'ai',
            last_message: 'System online. Ready for tasking.',
            last_message_at: new Date().toISOString(),
            unread_count: 0,
            sender_type: 'system',
            task_status: 'online'
        };

        if (threadsError) {
            console.error('Error loading threads:', threadsError);
            console.error('Error details:', JSON.stringify(threadsError, null, 2));
            
            // Check if it's a table not found error
            const errorMessage = (threadsError as any).message || String(threadsError);
            if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
                setError('Database setup incomplete. Messages table not created yet.');
            } else {
                setError(`Failed to load threads: ${errorMessage}`);
            }
            
            // Still show AI thread even if there's an error
            setThreads([aiThread]);
        } else {
            setThreads([aiThread, ...(data || [])]);
        }

        setLoading(false);
    }

    function getTimeAgo(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Now';
        if (diffMins < 60) return `${diffMins}m`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d`;
    }

    function getThreadSubtitle(thread: Thread): string {
        if (thread.task_type === 'ai') return '';
        return `${thread.task_type} • ${thread.task_status}`;
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#050505] font-sans">
            {/* Header */}
            <header className="px-4 py-4 pt-6 border-b border-[#333] sticky top-0 bg-[#050505]/95 backdrop-blur z-10">
                <div className="flex justify-between items-center mb-1">
                    <h1 className="text-2xl font-bold text-white font-mono tracking-wider">RentMan_OS</h1>
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
            <main className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ff88]"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                ) : threads.length === 0 ? (
                    <div className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 text-sm">No messages yet</p>
                    </div>
                ) : (
                    threads.map((thread) => (
                        <button
                            key={thread.id}
                            onClick={() => {
                                if (thread.task_type === 'ai') router.push('/assistant');
                                else router.push(`/contract/chat?id=${thread.task_id}`);
                            }}
                            className="w-full text-left p-4 rounded-xl border border-[#333] bg-[#111] hover:bg-[#161616] hover:border-[#444] transition-all group active:scale-[0.98]"
                        >
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${thread.task_type === 'ai'
                                    ? 'bg-[#00ff88]/10 border-[#00ff88]/30 shadow-[0_0_15px_rgba(0,255,136,0.1)]'
                                    : 'bg-[#222] border-[#444]'
                                    }`}>
                                    {thread.task_type === 'ai' ? (
                                        <Sparkles className="w-6 h-6 text-[#00ff88]" />
                                    ) : (
                                        <span className="font-mono font-bold text-gray-300">
                                            #{thread.task_id.substring(0, 4).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-bold text-sm truncate ${thread.task_type === 'ai' ? 'text-white' : 'text-gray-200'
                                            }`}>
                                            {thread.task_title}
                                        </h3>
                                        <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap ml-2">
                                            {getTimeAgo(thread.last_message_at)}
                                        </span>
                                    </div>

                                    {getThreadSubtitle(thread) && (
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${thread.unread_count > 0 ? 'bg-[#00ff88]' : 'bg-gray-600'
                                                }`}></span>
                                            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wide truncate">
                                                {getThreadSubtitle(thread)}
                                            </p>
                                        </div>
                                    )}

                                    <p className={`text-xs mt-2 truncate font-mono ${thread.unread_count > 0 ? 'text-white' : 'text-gray-500'
                                        }`}>
                                        {thread.task_type === 'ai' && <span className="text-[#00ff88] mr-1">{'>'}</span>}
                                        {thread.last_message}
                                    </p>

                                    {thread.unread_count > 0 && (
                                        <div className="mt-2">
                                            <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-[#00ff88] text-black">
                                                {thread.unread_count}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Arrow */}
                                <div className="self-center pl-2 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                                    <ArrowRight className="w-4 h-4 text-[#00ff88]" />
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </main>
        </div>
    );
}
