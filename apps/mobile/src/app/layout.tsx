import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { RentmanAssistantProvider } from "@/contexts/RentmanAssistantContext";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-black text-white`}>
        <AuthProvider>
          <RentmanAssistantProvider>
            {children}
            <BottomNav />
          </RentmanAssistantProvider>
        </AuthProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
