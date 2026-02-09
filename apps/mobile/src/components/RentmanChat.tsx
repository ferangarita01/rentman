'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRentmanAssistant } from '@/contexts/RentmanAssistantContext';
import { Send, Sparkles, Trash2, Paperclip, ArrowLeft, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RentmanChatProps {
  showBackButton?: boolean;
  title?: string;
}

export default function RentmanChat({ showBackButton = true, title = "RENTMAN_OS" }: RentmanChatProps) {
  const { messages, isLoading, sendMessage, clearMessages } = useRentmanAssistant();
  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Auto-scroll to last message
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] relative overflow-hidden">
      {/* Scanline Effect */}
      <div
        className="fixed inset-0 z-50 pointer-events-none opacity-20"
        style={{
          background: `linear-gradient(
            to bottom,
            rgba(18, 16, 16, 0) 50%,
            rgba(0, 0, 0, 0.25) 50%
          ),
          linear-gradient(
            90deg,
            rgba(255, 0, 0, 0.06),
            rgba(0, 255, 0, 0.02),
            rgba(0, 0, 255, 0.06)
          )`,
          backgroundSize: '100% 2px, 3px 100%'
        }}
      />

      {/* Corner Decorations */}
      <div className="fixed top-2 left-2 w-4 h-4 border-t border-l border-[#00ff88]/30 z-50 pointer-events-none" />
      <div className="fixed top-2 right-2 w-4 h-4 border-t border-r border-[#00ff88]/30 z-50 pointer-events-none" />
      <div className="fixed bottom-2 left-2 w-4 h-4 border-b border-l border-[#00ff88]/30 z-50 pointer-events-none" />
      <div className="fixed bottom-2 right-2 w-4 h-4 border-b border-r border-[#00ff88]/30 z-50 pointer-events-none" />

      {/* Header */}
      <header className="backdrop-blur-xl border-b border-white/10 bg-black/70 px-4 py-4 flex items-center justify-between z-40 pt-12">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/60" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00ff88]/10 flex items-center justify-center border border-[#00ff88]/30">
              <Sparkles className="w-5 h-5 text-[#00ff88]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />
                <h1 className="font-mono text-sm font-bold tracking-widest text-[#00ff88]">
                  COMM_LINK: {title}
                </h1>
              </div>
              <p className="font-mono text-[10px] text-white/40 uppercase tracking-wider">
                {isLoading ? 'TRANSMITTING...' : 'UPLINK_STABLE'}
              </p>
            </div>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded hover:bg-white/5 transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-white/60" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 bg-[#0f0f0f] border border-white/10 rounded shadow-xl z-50">
              <button
                onClick={() => {
                  clearMessages();
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 px-4 py-3 text-sm font-mono text-red-400 hover:bg-white/5 w-full"
              >
                <Trash2 className="w-4 h-4" />
                CLEAR_LOG
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-28">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 rounded-full bg-[#00ff88]/5 flex items-center justify-center mb-6 border border-[#00ff88]/20">
              <Sparkles className="w-10 h-10 text-[#00ff88]/50" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-mono uppercase tracking-[0.3em]">
              {title}
            </h3>
            <p className="text-white/30 max-w-md font-mono text-xs uppercase tracking-wider mb-8">
              Encrypted communication channel active
            </p>

            {/* Initial Suggestions */}
            <div className="space-y-2 w-full max-w-md">
              <p className="text-[9px] text-[#00ff88]/60 mb-3 font-mono uppercase tracking-[0.2em] text-left">
                AVAILABLE_COMMANDS:
              </p>
              {[
                'Show active contracts',
                'Find missions nearby',
                'Check my earnings',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInput(suggestion)}
                  className="w-full text-left px-4 py-3 bg-white/5 border border-white/10 hover:border-[#00ff88]/50 text-sm text-white/60 transition-all font-mono hover:text-[#00ff88] active:scale-[0.99] flex items-center"
                >
                  <span className="text-[#00ff88] mr-3 font-bold">&gt;</span>
                  <span className="uppercase tracking-wider text-xs">{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex flex-col gap-1 max-w-[85%] ${message.role === 'user' ? 'self-end items-end' : ''}`}
            >
              {/* Message Header */}
              <div className={`flex items-center gap-2 mb-1 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <span className={`text-[10px] font-mono ${message.role === 'user' ? 'text-[#00ff88]/60' : 'text-white/40'}`}>
                  {message.role === 'user' ? 'SOURCE: HUMAN_OPERATOR' : 'DECRYPTION_LEVEL: MAX'}
                </span>
                <span className="text-[10px] font-mono text-white/30">
                  {formatTime(message.timestamp)}
                </span>
              </div>

              {/* Message Body */}
              <div
                className={`p-3 font-mono text-sm leading-relaxed ${message.role === 'user'
                    ? 'bg-[#00ff88]/5 border border-[#00ff88]/20 border-r-2 border-r-[#00ff88] text-white'
                    : 'bg-white/5 border border-white/10 text-white/70'
                  }`}
                style={message.role === 'user' ? { boxShadow: '0 0 10px rgba(0, 255, 136, 0.2)' } : {}}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex flex-col gap-1 max-w-[85%]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-white/40">PROCESSING_REQUEST</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-3">
              <div className="flex gap-1 items-center">
                <span className="font-mono text-xs text-[#00ff88]">ANALYZING</span>
                <div className="flex gap-1 ml-2">
                  <div className="w-1.5 h-1.5 bg-[#00ff88] animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#00ff88] animate-pulse" style={{ animationDelay: '200ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#00ff88] animate-pulse" style={{ animationDelay: '400ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Footer / Input */}
      <footer className="backdrop-blur-xl border-t border-white/10 fixed bottom-0 w-full z-40 bg-black/80 px-4 pt-4 pb-8">
        <form onSubmit={handleSubmit} className="max-w-md mx-auto flex items-center gap-3">
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center rounded bg-white/5 border border-white/10 text-white/40 hover:text-white/60 hover:bg-white/10 transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="flex-1 relative flex items-center bg-black border border-white/10 px-3 py-2.5 rounded focus-within:border-[#00ff88]/40">
            <span className="text-[#00ff88] font-mono text-sm mr-2">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type message..."
              disabled={isLoading}
              className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-sm font-mono text-white w-full placeholder:text-white/20"
            />
            {/* Blinking Cursor */}
            <div className="w-2 h-4 bg-[#00ff88] ml-1 animate-pulse" />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 flex items-center justify-center rounded bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ boxShadow: '0 0 10px rgba(0, 255, 136, 0.2)' }}
          >
            <Send className="w-5 h-5" style={{ textShadow: '0 0 8px #00ff88' }} />
          </button>
        </form>
      </footer>

      {/* CSS for cursor blink */}
      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
