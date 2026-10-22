// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import ToastContainer from "@/components/ToastContainer";
import AchievementModal from "@/components/AchievementModal";
import StreakRewardModal from "@/components/StreakRewardModal";
import FireIgnition from "@/components/FireIgnition";
import AuthGuard from "@/components/AuthGuard"; // 🆕 Import AuthGuard

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kanji Master",
  description: "Belajar Kanji & Kotoba",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        
        {/* 🆕 Bungkus konten dengan AuthGuard */}
        <AuthGuard>
          {children}
        </AuthGuard>

        <AchievementModal />
        <StreakRewardModal />
        <FireIgnition />
        <ToastContainer />
      </body>
    </html>
  );
}