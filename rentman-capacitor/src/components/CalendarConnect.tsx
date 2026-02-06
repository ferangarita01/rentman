'use client';

import { useState, useEffect } from 'react';
import { CalendarDaysIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface CalendarConnectProps {
    onConnectionChange?: (connected: boolean) => void;
}

/**
 * CalendarConnect - Google Calendar OAuth Connection Component
 * Allows users to connect their calendar for Smart Nudging
 */
export default function CalendarConnect({ onConnectionChange }: CalendarConnectProps) {
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check connection status on mount
    useEffect(() => {
        checkCalendarStatus();
    }, []);

    const checkCalendarStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // Check if user has google_refresh_token
            const { data: userData, error: dbError } = await supabase
                .from('agently_users')
                .select('google_refresh_token, google_calendar_connected')
                .eq('id', user.id)
                .single();

            if (dbError) {
                // User might not exist in agently_users yet
                setIsConnected(false);
            } else {
                setIsConnected(!!userData?.google_refresh_token);
            }
        } catch (e) {
            console.error('Error checking calendar status:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'unknown';

            // Get the OAuth URL from the backend
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://sarah-backend-346436028870.us-central1.run.app'}/api/auth/google/url?userId=${userId}`);
            const data = await response.json();

            if (data.authUrl) {
                // Open OAuth popup
                const popup = window.open(
                    data.authUrl,
                    'Google Calendar Login',
                    'width=500,height=600,menubar=no,toolbar=no,location=no,status=no'
                );

                // Listen for callback
                const checkPopup = setInterval(() => {
                    try {
                        if (popup?.closed) {
                            clearInterval(checkPopup);
                            // Recheck connection status
                            setTimeout(() => {
                                checkCalendarStatus();
                            }, 1000);
                        }
                    } catch (e) {
                        // Cross-origin error, popup still open
                    }
                }, 500);
            } else {
                setError('Could not get OAuth URL');
            }
        } catch (e) {
            console.error('Error connecting calendar:', e);
            setError('Failed to connect. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Call backend to disconnect
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://sarah-backend-346436028870.us-central1.run.app'}/api/auth/google/disconnect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });

            setIsConnected(false);
            onConnectionChange?.(false);
        } catch (e) {
            console.error('Error disconnecting:', e);
            setError('Failed to disconnect');
        } finally {
            setLoading(false);
        }
    };

    // Notify parent of connection changes
    useEffect(() => {
        onConnectionChange?.(isConnected);
    }, [isConnected, onConnectionChange]);

    if (loading) {
        return (
            <div className="flex items-center gap-3 p-4 bg-[var(--sarah-surface)] rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className={`
      p-4 rounded-xl border transition-all duration-300
      ${isConnected
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                : 'bg-[var(--sarah-surface)] border-gray-200 dark:border-gray-700 hover:border-[var(--sarah-primary)]'
            }
    `}>
            <div className="flex items-center gap-4">
                {/* Icon */}
                <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          ${isConnected
                        ? 'bg-green-100 dark:bg-green-900/40'
                        : 'bg-orange-100 dark:bg-orange-900/30'
                    }
        `}>
                    <CalendarDaysIcon className={`w-6 h-6 ${isConnected ? 'text-green-600' : 'text-orange-500'}`} />
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className="font-semibold text-[var(--sarah-text-primary)]">
                        Google Calendar
                    </h3>
                    <p className="text-sm text-[var(--sarah-text-secondary)]">
                        {isConnected
                            ? 'Connected - Sarah can see your free time'
                            : 'Connect for smarter habit reminders'
                        }
                    </p>
                </div>

                {/* Action Button */}
                {isConnected ? (
                    <button
                        onClick={handleDisconnect}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <XCircleIcon className="w-4 h-4" />
                        Disconnect
                    </button>
                ) : (
                    <button
                        onClick={handleConnect}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                        <CalendarDaysIcon className="w-4 h-4" />
                        Connect
                    </button>
                )}
            </div>

            {/* Status Detail */}
            {isConnected && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Sarah will check your calendar before suggesting habits</span>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-3 text-sm text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Privacy Note */}
            {!isConnected && (
                <p className="mt-3 text-xs text-[var(--sarah-text-muted)]">
                    🔒 Sarah only sees if you're free or busy, never meeting details
                </p>
            )}
        </div>
    );
}
