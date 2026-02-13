'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('sarah-theme') as Theme | null;
            if (stored) return stored;
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        }
        return 'light';
    });

    useEffect(() => {
        // Apply theme to document (CLIENT-SIDE ONLY)
        if (typeof window === 'undefined') return;

        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('sarah-theme', theme);
    }, [theme]);

    // Listen for theme_change events from Sarah
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleThemeChange = (e: Event) => {
            const customEvent = e as CustomEvent;
            const newTheme = customEvent.detail;
            console.log('🎨 Sarah theme change:', newTheme);

            if (newTheme === 'dark' || newTheme === 'light') {
                setTheme(newTheme);
            } else if (newTheme === 'system') {
                // Use system preference
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    setTheme('dark');
                } else {
                    setTheme('light');
                }
            }
        };

        window.addEventListener('theme_change', handleThemeChange);
        return () => {
            window.removeEventListener('theme_change', handleThemeChange);
        };
    }, []);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
