import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { RentmanAssistantProvider } from "@/contexts/RentmanAssistantContext";
import BottomNav from "@/components/BottomNav";
import PushNotificationManager from "@/components/PushNotificationManager";
import { GoogleTagManager, GoogleAnalytics } from '@next/third-parties/google';
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rentman - Plataforma de Alquiler",
  description: "Tu asistente inteligente para gestión de propiedades",
};

export const viewport: Viewport = {
  themeColor: "#00ff88",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">

      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-black text-white`}>
        <GoogleTagManager gtmId="GTM-WDCLWK4P" />
        <GoogleAnalytics gaId="G-ND9PT413XV" />

        <AuthProvider>
          <RentmanAssistantProvider>
            {children}
            <BottomNav />
            <PushNotificationManager />
          </RentmanAssistantProvider>
        </AuthProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
