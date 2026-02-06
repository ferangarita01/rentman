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
    loading: true,
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const setData = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        };

        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            // ✅ Token Persistence Logic
            if (session?.provider_refresh_token && session?.user?.id) {
                console.log('🔄 [Auth] Found provider refresh token, ensuring persistence...');
                try {
                    const { error } = await supabase
                        .from('agently_users')
                        .upsert({
                            id: session.user.id,
                            email: session.user.email,
                            google_refresh_token: session.provider_refresh_token,
                            updated_at: new Date().toISOString()
                        });

                    if (error) console.error('❌ Failed to persist refresh token:', error);
                    else console.log('✅ Google Refresh Token persisted to agently_users');
                } catch (err) {
                    console.error('Error persisting token:', err);
                }
            }

            if (!session) {
                // specific logic can go here if needed
            }
        });

        setData();

        return () => {
            listener.subscription.unsubscribe();
        };
    }, [router]);

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
