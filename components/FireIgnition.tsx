"use client";

import { useEffect, useState } from "react";
import { playFireSound } from "@/utils/sound"; // 🆕 Import Suara

export default function FireIgnition() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const triggerFire = () => {
      setIsVisible(true);
      playFireSound(); // 🆕 Mainkan suara saat api muncul

      setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    };

    window.addEventListener("fire-ignition", triggerFire);
    return () => window.removeEventListener("fire-ignition", triggerFire);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden flex items-end justify-center">
      {/* Glow Latar Belakang */}
      <div className="absolute inset-0 bg-gradient-to-t from-orange-500/60 via-red-600/20 to-transparent animate-fire-rise" />
      
      {/* Api Utama */}
      <div className="relative animate-fire-rise flex flex-col items-center pb-24">
        <div className="text-[12rem] filter drop-shadow-[0_0_80px_rgba(239,68,68,1)] drop-shadow-[0_0_40px_rgba(249,115,22,0.8)] animate-fire-flicker">
          🔥
        </div>
        <div className="text-3xl font-bold text-white drop-shadow-lg mt-4 bg-slate-900/90 px-8 py-3 rounded-full border-2 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.6)]">
          Streak Hari Ini Dimulai!
        </div>
      </div>
    </div>
  );
}