'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, MessageSquare, ArrowRight } from 'lucide-react';
import { supabase, getThreads, Thread } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';

export default function InboxPage() {
    const router = useRouter();
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterMode, setFilterMode] = useState<'doing' | 'managing'>('doing');
    const [userAgentId, setUserAgentId] = useState<string | null>(null);
    const { user, loading: authLoading } = useAuth();

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
            // Fetch user's agent_id
            supabase
                .from('agents')
                .select('id')
                .eq('owner_id', user.id)
                .single()
                .then(({ data }) => {
                    if (data) {
                        setUserAgentId(data.id);
                        console.log('User agent_id:', data.id);
                    }
                });
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

    // Filter threads based on selected mode
    const displayedThreads = threads.filter(thread => {
        // Always show AI assistant
        if (thread.task_type === 'ai') return true;

        if (!user) return false;

        // DATA INTEGRITY FIX: Only show real contracts (exclude test data)
        const isTestData =
            thread.task_title.toLowerCase().includes('test') ||
            thread.task_title.toLowerCase().includes('verificar') ||
            thread.task_title.toLowerCase().includes('v1') ||
            thread.task_title.toLowerCase().includes('v2') ||
            thread.task_title.toLowerCase().includes('v3') ||
            thread.task_title.toLowerCase().includes('v4') ||
            thread.task_title.toLowerCase().includes('v5') ||
            thread.task_title.toLowerCase().includes('v6') ||
            thread.task_title.toLowerCase().includes('v7');

        if (isTestData) return false;

        // STATUS FILTER: Only show active contracts
        const activeStatuses = ['assigned', 'in_progress', 'pending_verification', 'disputed'];
        if (!activeStatuses.includes(thread.task_status)) return false;

        if (filterMode === 'doing') {
            // Show tasks where I'm the worker (assigned to me)
            return thread.assigned_human_id === user.id;
        } else if (filterMode === 'managing') {
            // Show tasks where I'm the requester (my agent created them)
            return userAgentId && thread.agent_id === userAgentId;
        }

        return false;
    });

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

                {/* Filter Tabs */}
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => setFilterMode('doing')}
                        className={`flex-1 py-2 px-3 rounded text-xs font-mono uppercase tracking-wider transition-colors ${filterMode === 'doing'
                            ? 'bg-[#00ff88] text-black font-bold'
                            : 'bg-[#1a1a1a] text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        Doing
                    </button>
                    <button
                        onClick={() => setFilterMode('managing')}
                        className={`flex-1 py-2 px-3 rounded text-xs font-mono uppercase tracking-wider transition-colors ${filterMode === 'managing'
                            ? 'bg-[#00ff88] text-black font-bold'
                            : 'bg-[#1a1a1a] text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        Managing
                    </button>
                </div>
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
                ) : displayedThreads.length === 0 ? (
                    <div className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 text-sm">
                            {filterMode === 'doing' && 'No task assignments found'}
                            {filterMode === 'managing' && 'No managed contracts found'}
                        </p>
                    </div>
                ) : (
                    displayedThreads.map((thread) => {
                        // FIX: Determine role for visual distinction
                        const isWorker = thread.assigned_human_id === user?.id;
                        const isRequester = userAgentId && thread.agent_id === userAgentId;
                        const isAI = thread.task_type === 'ai';

                        // Debug logging for specific thread tracing
                        // console.log(`Thread ${thread.id}: Worker=${isWorker} (${thread.assigned_human_id}), Requester=${isRequester} (${thread.agent_id})`);

                        // Dynamic Styles based on Role
                        // Doing (Worker) -> Flashy Green Border (High Priority)
                        // Managing (Requester) -> Subtle Blue/Gray or "Corporate" look

                        let borderClass = "border-[#333]";
                        let bgClass = "bg-[#111]";
                        let indicatorColor = "bg-gray-600";

                        if (isAI) {
                            borderClass = "border-[#00ff88]/30";
                            bgClass = "bg-[#00ff88]/5";
                            indicatorColor = "bg-[#00ff88]";
                        } else if (isRequester) {
                            // Managing: Blue/Purple tint to distinguish from standard worker tasks
                            borderClass = "border-blue-900/50 border-l-4 border-l-blue-500";
                            bgClass = "bg-[#0a0a12]";
                            indicatorColor = "bg-blue-500";
                        } else if (isWorker) {
                            // Doing: Standard "Active" Look with Green accent
                            borderClass = "border-[#333] border-l-4 border-l-[#00ff88]";
                            bgClass = "bg-[#111]";
                            indicatorColor = "bg-[#00ff88]";
                        }

                        return (
                            <button
                                key={thread.id}
                                onClick={() => {
                                    if (thread.task_type === 'ai') router.push('/assistant');
                                    else router.push(`/contract/chat?id=${thread.task_id}`);
                                }}
                                className={`w-full text-left p-4 rounded-xl border ${borderClass} ${bgClass} hover:brightness-110 transition-all group active:scale-[0.98]`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Avatar */}
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${isAI
                                        ? 'bg-[#00ff88]/10 border-[#00ff88]/30 shadow-[0_0_15px_rgba(0,255,136,0.1)]'
                                        : 'bg-[#222] border-[#444]'
                                        }`}>
                                        {isAI ? (
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
                                            <h3 className={`font-bold text-sm truncate ${isAI ? 'text-white' : 'text-gray-200'}`}>
                                                {thread.task_title}
                                            </h3>
                                            <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap ml-2">
                                                {getTimeAgo(thread.last_message_at)}
                                            </span>
                                        </div>

                                        {getThreadSubtitle(thread) && (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                {/* Status Indicator Dot */}
                                                <span className={`w-1.5 h-1.5 rounded-full ${thread.unread_count > 0 ? 'bg-[#00ff88]' : 'bg-gray-600'}`}></span>

                                                <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wide truncate">
                                                    {getThreadSubtitle(thread)}
                                                </p>

                                                {/* Role Badge */}
                                                {!isAI && (
                                                    <span className={`text-[8px] px-1 rounded ml-2 uppercase font-bold tracking-widest ${isRequester ? 'bg-blue-900 text-blue-200' :
                                                        isWorker ? 'bg-green-900 text-green-200' : 'bg-gray-800 text-gray-400'
                                                        }`}>
                                                        {isRequester ? 'MANAGING' : isWorker ? 'DOING' : 'VIEWER'}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <p className={`text-xs mt-2 truncate font-mono ${thread.unread_count > 0 ? 'text-white' : 'text-gray-500'}`}>
                                            {isAI && <span className="text-[#00ff88] mr-1">{'>'}</span>}
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
                        );
                    })
                )}
            </main>
        </div>
    );
}
