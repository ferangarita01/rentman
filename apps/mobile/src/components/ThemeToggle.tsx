'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

/**
 * ThemeToggle - Dark/Light mode switcher
 * Designed for Gen Z with smooth animations
 */
export default function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`
        relative w-14 h-7 rounded-full p-1
        transition-all duration-300 ease-in-out
        ${isDark
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/30'
                    : 'bg-gradient-to-r from-orange-400 to-yellow-400 shadow-lg shadow-orange-300/30'
                }
      `}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {/* Slider */}
            <span
                className={`
          absolute top-0.5 w-6 h-6 rounded-full
          bg-white shadow-md
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          ${isDark ? 'left-7' : 'left-0.5'}
        `}
            >
                {isDark ? (
                    <MoonIcon className="w-4 h-4 text-purple-600" />
                ) : (
                    <SunIcon className="w-4 h-4 text-orange-500" />
                )}
            </span>
        </button>
    );
}
