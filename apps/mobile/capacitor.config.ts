import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rentman.app',
  appName: 'Rentman',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: ['*.supabase.co', 'rentman.space', 'connect.stripe.com']
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      launchFadeOutDuration: 0,
      backgroundColor: "#050505",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
