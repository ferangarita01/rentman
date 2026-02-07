import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold
} from '@expo-google-fonts/inter';
import {
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium
} from '@expo-google-fonts/jetbrains-mono';

import "../global.css";
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const { user, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === 'auth';

        if (!user && !inAuthGroup) {
            // Redirect to auth if not signed in
            router.replace('/auth');
        } else if (user && inAuthGroup) {
            // Redirect to tabs if signed in
            router.replace('/(tabs)');
        }
    }, [user, loading, segments]);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="auth" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen 
                name="mission/[id]" 
                options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom'
                }} 
            />
        </Stack>
    );
}

export default function RootLayout() {
    const [loaded, error] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        JetBrainsMono_400Regular,
        JetBrainsMono_500Medium,
    });

    useEffect(() => {
        if (error) throw error;
    }, [error]);

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    const CyberpunkTheme = {
        ...DarkTheme,
        colors: {
            ...DarkTheme.colors,
            background: '#050505',
            primary: '#00ff88',
            card: '#0a0a0a',
            text: '#cccccc',
            border: 'rgba(255, 255, 255, 0.1)',
            notification: '#00ff88',
        },
    };

    return (
        <AuthProvider>
            <ThemeProvider value={CyberpunkTheme}>
                <View style={{ flex: 1, backgroundColor: '#050505' }}>
                    <StatusBar style="light" />
                    <RootLayoutNav />
                </View>
            </ThemeProvider>
        </AuthProvider>
    );
}
