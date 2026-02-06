'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  CheckIcon,
  BarChart2Icon,
  MessageSquareIcon,
  SettingsIcon
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const navItems = [
    {
      href: '/',
      label: t('nav.today'),
      icon: CheckIcon
    },
    {
      href: '/progress',
      label: t('nav.progress'),
      icon: BarChart2Icon
    },
    {
      href: '/sarah',
      label: t('nav.sarah'),
      icon: MessageSquareIcon
    },
    {
      href: '/settings',
      label: t('nav.settings'),
      icon: SettingsIcon
    }
  ];

  // Hide on auth page, landing page, or when no user
  if (pathname === '/auth' || pathname === '/landing.html' || !user) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 w-full max-w-[440px] backdrop-blur-xl border-t pb-6 pt-2 z-50 left-1/2 -translate-x-1/2 transition-colors duration-300 ${isDark
        ? 'bg-[#050505]/90 border-white/5'
        : 'bg-white/90 border-gray-200'
      }`}>
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1.5 p-2 ${!isActive ? 'group' : ''}`}
            >
              {isActive ? (
                // Active State (Orange Box with Check if Today, else just styled)
                <div className="w-12 h-8 rounded-2xl flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-orange-500 rounded-full opacity-0"></div>
                  <div className={`w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center ${isDark ? 'text-[#050505]' : 'text-white'
                    }`}>
                    <Icon className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>
              ) : (
                // Inactive State
                <div className="w-12 h-8 flex items-center justify-center">
                  <Icon className={`w-7 h-7 transition-colors ${isDark
                      ? 'text-gray-500 group-hover:text-gray-300'
                      : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                </div>
              )}

              <span className={`text-xs font-medium transition-colors ${isActive
                  ? 'text-orange-500 font-semibold'
                  : isDark
                    ? 'text-gray-500 group-hover:text-gray-300'
                    : 'text-gray-400 group-hover:text-gray-600'
                }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

