'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRentmanAssistant } from '@/contexts/RentmanAssistantContext';
import { Send, X, Sparkles, Trash2 } from 'lucide-react';

export default function RentmanChat() {
  const { messages, isLoading, sendMessage, clearMessages } = useRentmanAssistant();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    await sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#00ff88]/10 flex items-center justify-center border border-[#00ff88]/20">
            <Sparkles className="w-5 h-5 text-[#00ff88]" />
          </div>
          <div>
            <h2 className="font-semibold text-white font-mono tracking-wide">RENTMAN_AI</h2>
            <p className="text-xs text-[#00ff88]/80 font-mono uppercase">
              {isLoading ? 'PROCESSING...' : 'SYSTEM ONLINE'}
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Clear conversation"
          >
            <Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-[#00ff88]/10 flex items-center justify-center mb-4 border border-[#00ff88]/20 animate-pulse">
              <Sparkles className="w-8 h-8 text-[#00ff88]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-mono uppercase tracking-widest">
              RENTMAN_OS v1.0
            </h3>
            <p className="text-gray-400 max-w-md font-mono text-xs">
              Your intelligent assistant for rental management.
            </p>

            {/* Sugerencias iniciales */}
            <div className="mt-6 space-y-2 w-full max-w-md">
              <p className="text-[10px] text-[#00ff88] mb-2 font-mono uppercase tracking-widest text-left w-full pl-1">Suggested Commands:</p>
              {[
                'How to register a rental?',
                'Documents for contract',
                'My active rentals',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInput(suggestion)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-[#1a1a1a] border border-[#333] hover:border-[#00ff88] text-sm text-gray-300 transition-all font-mono hover:text-[#00ff88] active:scale-[0.98]"
                >
                  <span className="text-[#00ff88] mr-2">{'>'}</span>{suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 border ${message.role === 'user'
                  ? 'bg-[#00ff88] text-black border-[#00ff88] rounded-br-none'
                  : 'bg-[#1a1a1a] text-gray-200 border-[#333] rounded-bl-none'
                  }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}

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

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-[#333] bg-[#050505]">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Command..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl border border-[#333] bg-[#0a0a0a] text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] transition-all font-mono text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 rounded-xl bg-[#00ff88] text-black font-bold hover:bg-[#00cc6d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
