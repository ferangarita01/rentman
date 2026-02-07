'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Capacitor } from '@capacitor/core';

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                console.log('🔄 Auth callback started...');
                
                // Supabase automatically handles the hash fragment
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error('❌ Auth callback error:', error);
                    router.push('/auth?error=callback_failed');
                    return;
                }

                if (session) {
                    console.log('✅ Session established:', session.user.email);
                    
                    // Check if user profile exists in Rentman
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id, email')
                        .eq('id', session.user.id)
                        .single();

                    console.log('📝 Profile check:', profile ? 'Found' : 'Not found');

                    // Redirect to home - use window.location for Capacitor compatibility
                    console.log('🏠 Redirecting to home...');
                    if (Capacitor.isNativePlatform()) {
                        window.location.href = '/';
                    } else {
                        router.push('/');
                    }
                } else {
                    console.warn('⚠️ No session after callback');
                    router.push('/auth');
                }
            } catch (err) {
                console.error('💥 Unexpected error in auth callback:', err);
                router.push('/auth?error=unknown');
            }
        };

        handleCallback();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-foreground">Completing sign in...</p>
            </div>
        </div>
    );
}
