'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutGrid,
  Wallet,
  Terminal,
  MessageSquare,
  User
} from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Hide on auth page, landing page, or when no user
  if (pathname === '/auth' || pathname === '/landing.html' || !user) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      {/* Floating Dock Container */}
      <div className="max-w-md mx-auto bg-[#050505] rounded-2xl border border-white/5 shadow-2xl shadow-black/50 relative">

        {/* Glow Effect behind the bar */}
        <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-[#00ff55]/10 to-transparent blur-xl -z-10"></div>

        <div className="flex items-center justify-between px-2 h-[72px]">

          {/* FEED */}
          <Link href="/" className="flex flex-col items-center justify-center gap-1 w-16 group">
            <LayoutGrid
              className={`w-6 h-6 transition-all duration-300 ${isActive('/') ? 'text-[#00ff55] stroke-[2.5] drop-shadow-[0_0_8px_rgba(0,255,85,0.5)]' : 'text-gray-500 group-hover:text-gray-300'}`}
            />
            <span className={`text-[9px] font-bold tracking-widest ${isActive('/') ? 'text-[#00ff55]' : 'text-gray-600'}`}>
              FEED
            </span>
          </Link>

          {/* WALLET */}
          <Link href="/progress" className="flex flex-col items-center justify-center gap-1 w-16 group">
            <Wallet
              className={`w-6 h-6 transition-all duration-300 ${isActive('/progress') ? 'text-[#00ff55] stroke-[2.5] drop-shadow-[0_0_8px_rgba(0,255,85,0.5)]' : 'text-gray-500 group-hover:text-gray-300'}`}
            />
            <span className={`text-[9px] font-bold tracking-widest ${isActive('/progress') ? 'text-[#00ff55]' : 'text-gray-600'}`}>
              WALLET
            </span>
          </Link>

          {/* MARKET (Central FAB) */}
          <div className="relative -top-6">
            <button
              onClick={() => console.log('OPEN MARKET')} // Placeholder for Market Action
              className="w-16 h-16 bg-[#00ff55] rounded-[20px] flex items-center justify-center shadow-[0_0_20px_rgba(0,255,85,0.4)] hover:shadow-[0_0_30px_rgba(0,255,85,0.6)] hover:bg-[#33ff77] transition-all duration-300 active:scale-95 group"
            >
              <Terminal className="w-8 h-8 text-black stroke-[2.5] group-hover:rotate-12 transition-transform" />
            </button>
          </div>

          {/* INBOX */}
          <Link href="/assistant" className="flex flex-col items-center justify-center gap-1 w-16 group">
            <MessageSquare
              className={`w-6 h-6 transition-all duration-300 ${isActive('/assistant') ? 'text-[#00ff55] stroke-[2.5] drop-shadow-[0_0_8px_rgba(0,255,85,0.5)]' : 'text-gray-500 group-hover:text-gray-300'}`}
            />
            <span className={`text-[9px] font-bold tracking-widest ${isActive('/assistant') ? 'text-[#00ff55]' : 'text-gray-600'}`}>
              INBOX
            </span>
          </Link>

          {/* PROFILE */}
          <Link href="/profile" className="flex flex-col items-center justify-center gap-1 w-16 group">
            <User
              className={`w-6 h-6 transition-all duration-300 ${isActive('/profile') || isActive('/settings') ? 'text-[#00ff55] stroke-[2.5] drop-shadow-[0_0_8px_rgba(0,255,85,0.5)]' : 'text-gray-500 group-hover:text-gray-300'}`}
            />
            <span className={`text-[9px] font-bold tracking-widest ${isActive('/profile') || isActive('/settings') ? 'text-[#00ff55]' : 'text-gray-600'}`}>
              PROFILE
            </span>
          </Link>

        </div>
      </div>
    </div>
  );
}
