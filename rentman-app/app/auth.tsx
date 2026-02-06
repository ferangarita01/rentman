import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Google OAuth Configuration
  // Replace with your actual client IDs from Google Cloud Console
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '346436028870-2gfi8b85fe33dlfj1uj6hqtb3rmb6n2h.apps.googleusercontent.com',
    webClientId: '346436028870-l2gof5ah1mjk5u182hmb80o30oin17du.apps.googleusercontent.com',
    expoClientId: '346436028870-l2gof5ah1mjk5u182hmb80o30oin17du.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.idToken) {
        handleGoogleSignIn(authentication.idToken);
      }
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) throw error;

      if (data.user) {
        // Success! Navigate to app
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Authentication Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Email/Password Sign In (Alternative/Backup)
  const handleEmailSignIn = async () => {
    // Placeholder for email/password auth
    Alert.alert('Coming Soon', 'Email authentication will be available soon.');
  };

  return (
    <View className="flex-1 bg-[#050505]">
      <StatusBar style="light" />

      {/* Terminal Header */}
      <View className="pt-16 px-6 mb-12">
        <Text className="text-[#00ff88] font-mono text-xs tracking-widest mb-2">
          RENTMAN_AUTH_v1.0
        </Text>
        <Text className="text-white text-4xl font-bold mb-2">
          ACCESS REQUIRED
        </Text>
        <Text className="text-gray-500 font-mono text-sm">
          Authenticate to join the network
        </Text>
      </View>

      {/* Grid Background Pattern */}
      <View className="absolute inset-0 opacity-5" />

      {/* Auth Methods */}
      <View className="flex-1 px-6 justify-center">
        {/* Google Sign In */}
        <TouchableOpacity
          onPress={() => promptAsync()}
          disabled={!request || loading}
          className="bg-[#00ff88] py-4 px-6 rounded-lg flex-row items-center justify-center mb-4 active:scale-95"
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="google" size={24} color="black" />
          <Text className="text-black font-mono font-bold text-base ml-3">
            {loading ? 'AUTHENTICATING...' : 'SIGN IN WITH GOOGLE'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-[#00ff88]/20" />
          <Text className="text-[#00ff88]/40 font-mono text-xs mx-4">OR</Text>
          <View className="flex-1 h-px bg-[#00ff88]/20" />
        </View>

        {/* Email Sign In (Coming Soon) */}
        <TouchableOpacity
          onPress={handleEmailSignIn}
          className="border border-[#00ff88] bg-[#00ff88]/5 py-4 px-6 rounded-lg flex-row items-center justify-center active:scale-95"
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="email" size={24} color="#00ff88" />
          <Text className="text-[#00ff88] font-mono font-bold text-base ml-3">
            SIGN IN WITH EMAIL
          </Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text className="text-gray-600 font-mono text-xs text-center mt-8">
          By continuing, you agree to our{'\n'}
          <Text className="text-[#00ff88]">Terms of Service</Text> and{' '}
          <Text className="text-[#00ff88]">Privacy Policy</Text>
        </Text>
      </View>

      {/* Terminal Footer */}
      <View className="px-6 pb-8">
        <View className="border border-[#00ff88]/20 rounded p-4">
          <View className="flex-row items-center gap-2 mb-2">
            <View className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />
            <Text className="text-[#00ff88] font-mono text-xs uppercase">
              System Status
            </Text>
          </View>
          <Text className="text-gray-500 font-mono text-xs">
            Auth servers: ONLINE{'\n'}
            Network: SECURE{'\n'}
            Protocol: OAuth 2.0
          </Text>
        </View>
      </View>
    </View>
  );
}
