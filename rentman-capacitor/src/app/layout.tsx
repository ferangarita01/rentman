import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { RentmanAssistantProvider } from "@/contexts/RentmanAssistantContext";
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
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased bg-black text-white`}>
        <RentmanAssistantProvider>
          {children}
        </RentmanAssistantProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
