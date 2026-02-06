'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Supabase automatically handles the hash fragment
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error('Auth callback error:', error);
                    router.push('/auth?error=callback_failed');
                    return;
                }

                if (session) {
                    console.log('✅ Session established:', session.user.email);
                    
                    // Check if user profile exists, if not redirect to onboarding
                    const { data: profile } = await supabase
                        .from('sarah_user_profiles')
                        .select('onboarding_completed')
                        .eq('user_id', session.user.id)
                        .single();

                    if (!profile || !profile.onboarding_completed) {
                        router.push('/onboarding');
                    } else {
                        router.push('/');
                    }
                } else {
                    console.warn('No session after callback');
                    router.push('/auth');
                }
            } catch (err) {
                console.error('Unexpected error in auth callback:', err);
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
