// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import ToastContainer from "@/components/ToastContainer";
import AchievementModal from "@/components/AchievementModal";
import StreakRewardModal from "@/components/StreakRewardModal";
import FireIgnition from "@/components/FireIgnition";
import AuthGuard from "@/components/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kanji Master | Belajar Kanji & Kotoba Online",
  description: "Platform belajar bahasa Jepang interaktif. Kuasai 486 Kanji dan 500 Kotoba dengan metode cerdas untuk persiapan ujian JFT. Gratis dan menyenangkan!",
  keywords: ["belajar kanji", "belajar kotoba", "JFT", "bahasa Jepang", "kanji master", "belajar jepang online"],
  authors: [{ name: "Kanji Master Team" }],
  openGraph: {
    title: "Kanji Master | Belajar Kanji & Kotoba Online",
    description: "Platform belajar bahasa Jepang interaktif. Kuasai 486 Kanji dan 500 Kotoba untuk persiapan JFT.",
    url: "https://kanjimaster-phi.vercel.app",
    siteName: "Kanji Master",
    locale: "id_ID",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthGuard>
          {children}
        </AuthGuard> {/* ✅ Diperbaiki: AuthGuard yang menutup */}
        
        <AchievementModal />
        <StreakRewardModal />
        <FireIgnition />
        <ToastContainer />
      </body>
    </html>
  );
}