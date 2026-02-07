'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: false, // NUCLEAR FIX: Start false. Never block.
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(false); // NUCLEAR FIX: Start false.
    const router = useRouter();

    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            try {
                console.log('🔍 AuthContext: Checking session...');
                const { data: { session }, error } = await supabase.auth.getSession();

                if (mounted) {
                    if (session) {
                        setSession(session);
                        setUser(session.user);
                        console.log('✅ AuthContext: Session restored - User:', session.user.email);
                    } else {
                        console.log('⚠️ AuthContext: No session found');
                    }
                }
            } catch (error) {
                console.error('❌ AuthContext: Session check error:', error);
            }
        };

        const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔔 AuthContext: Auth state changed -', event, session?.user?.email || 'no user');
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
                
                if (event === 'SIGNED_IN') {
                    console.log('✅ AuthContext: User signed in -', session?.user?.email);
                } else if (event === 'SIGNED_OUT') {
                    console.log('👋 AuthContext: User signed out');
                } else if (event === 'TOKEN_REFRESHED') {
                    console.log('🔄 AuthContext: Token refreshed');
                }
            }
        });

        checkSession();

        return () => {
            mounted = false;
            listener.subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push('/auth');
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
