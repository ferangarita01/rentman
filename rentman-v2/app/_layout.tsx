import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function RootLayout() {
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
    <ThemeProvider value={CyberpunkTheme}>
      <View style={{ flex: 1, backgroundColor: '#050505' }}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" />
        </Stack>
      </View>
    </ThemeProvider>
  );
}
