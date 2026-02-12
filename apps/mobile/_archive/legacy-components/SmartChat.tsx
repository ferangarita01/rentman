'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Send, Sparkles, MapPin, Camera, Mic,
    Paperclip, X, ChevronLeft, MoreVertical
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    type?: 'text' | 'image' | 'audio' | 'location';
    metadata?: any;
    timestamp: Date;
}

interface SmartChatProps {
    title: string;
    subtitle?: string;
    type: 'ai' | 'contract';
    initialMessages?: Message[];
    onSendMessage: (content: string, type: 'text' | 'image' | 'audio' | 'location') => Promise<void>;
    isLoading?: boolean;
}

export default function SmartChat({
    title,
    subtitle,
    type,
    initialMessages = [],
    onSendMessage,
    isLoading = false
}: SmartChatProps) {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [inputValue, setInputValue] = useState('');
    const [showDeck, setShowDeck] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() && !showDeck) return;

        await onSendMessage(inputValue, 'text');
        setInputValue('');
    };

    const handleDeckAction = async (action: 'image' | 'audio' | 'location') => {
        setShowDeck(false);
        // In a real app, this would open camera/recorder/location
        // For prototype, we simulate sending a proof
        let content = '';
        if (action === 'location') content = '📍 Shared Location: 40.7128° N, 74.0060° W';
        if (action === 'image') content = '📸 [Photo Evidence Uploaded]';
        if (action === 'audio') content = '🎤 [Voice Note 0:15]';

        await onSendMessage(content, action);
    };

    return (
        <div className="flex flex-col h-full bg-[#050505] relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#333] bg-[#050505]/95 backdrop-blur z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${type === 'ai' ? 'bg-[#00ff88]/10 border-[#00ff88]/20' : 'bg-[#333] border-[#444]'}`}>
                            {type === 'ai' ? (
                                <Sparkles className="w-5 h-5 text-[#00ff88]" />
                            ) : (
                                <span className="font-mono font-bold text-white">#{title.substring(0, 2)}</span>
                            )}
                        </div>
                        <div>
                            <h2 className="font-bold text-white font-mono tracking-wide text-sm">{title}</h2>
                            <p className="text-[10px] text-[#00ff88] font-mono uppercase tracking-wider">
                                {isLoading ? 'PROCESSING...' : subtitle || 'ONLINE'}
                            </p>
                        </div>
                    </div>
                </div>
                <button className="text-gray-400">
                    <MoreVertical className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 border relative group ${msg.role === 'user'
                                ? 'bg-[#00ff88] text-black border-[#00ff88] rounded-br-none'
                                : 'bg-[#1a1a1a] text-gray-200 border-[#333] rounded-bl-none'
                                }`}
                        >
                            {/* Message Content */}
                            <p className="text-sm whitespace-pre-wrap font-sans">
                                {msg.content}
                            </p>

                            {/* Timestamp */}
                            <p className={`text-[10px] mt-1 font-mono opacity-60 ${msg.role === 'user' ? 'text-black' : 'text-gray-500'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl px-4 py-3 rounded-bl-none">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* "The Deck" - Input Area */}
            <div className="p-4 bg-[#050505] border-t border-[#333]">
                {/* Expanded Deck Menu */}
                {showDeck && (
                    <div className="grid grid-cols-3 gap-2 mb-4 animate-in slide-in-from-bottom-5 fade-in duration-200">
                        <button
                            onClick={() => handleDeckAction('image')}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#1a1a1a] border border-[#333] hover:border-[#00ff88] hover:bg-[#00ff88]/10 transition-colors group"
                        >
                            <Camera className="w-6 h-6 text-white group-hover:text-[#00ff88]" />
                            <span className="text-[10px] font-mono text-gray-400 group-hover:text-[#00ff88] uppercase">Camera</span>
                        </button>
                        <button
                            onClick={() => handleDeckAction('location')}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#1a1a1a] border border-[#333] hover:border-[#00ff88] hover:bg-[#00ff88]/10 transition-colors group"
                        >
                            <MapPin className="w-6 h-6 text-white group-hover:text-[#00ff88]" />
                            <span className="text-[10px] font-mono text-gray-400 group-hover:text-[#00ff88] uppercase">GPS Fix</span>
                        </button>
                        <button
                            onClick={() => handleDeckAction('audio')}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#1a1a1a] border border-[#333] hover:border-[#00ff88] hover:bg-[#00ff88]/10 transition-colors group"
                        >
                            <Mic className="w-6 h-6 text-white group-hover:text-[#00ff88]" />
                            <span className="text-[10px] font-mono text-gray-400 group-hover:text-[#00ff88] uppercase">Voice</span>
                        </button>
                    </div>
                )}

                {/* Input Field */}
                <div className="flex gap-2 items-end">
                    <button
                        onClick={() => setShowDeck(!showDeck)}
                        className={`p-3 rounded-xl border transition-all ${showDeck
                            ? 'bg-[#00ff88] text-black border-[#00ff88]'
                            : 'bg-[#1a1a1a] text-gray-400 border-[#333] hover:text-white'
                            }`}
                    >
                        {showDeck ? <X className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
                    </button>

                    <div className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-xl flex items-center px-4 focus-within:border-[#00ff88] transition-colors">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={showDeck ? "Select proof type..." : "Type message..."}
                            className="w-full bg-transparent text-white py-3 text-sm font-mono focus:outline-none placeholder-gray-600"
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() && !showDeck}
                        className="p-3 rounded-xl bg-[#00ff88] text-black disabled:opacity-50 disabled:bg-[#1a1a1a] disabled:text-gray-500 transition-colors font-bold"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
