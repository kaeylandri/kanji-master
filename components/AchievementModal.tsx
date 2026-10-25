// components/AchievementModal.tsx
"use client";

import { useEffect, useState } from "react";
import { ACHIEVEMENTS_KOTOBA } from "@/data/achievements";
import { ACHIEVEMENTS_KANJI } from "@/data/achievements-kanji";

type AchievementData = {
  id: string;
  type: "kanji" | "kotoba";
};

export default function AchievementModal() {
  const [achievement, setAchievement] = useState<AchievementData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleShowAchievement = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail as AchievementData;
      
      setAchievement(data);
      setIsVisible(true);

      // Sembunyikan otomatis setelah 5 detik
      const timeoutId = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setAchievement(null), 300);
      }, 5000);

      return () => clearTimeout(timeoutId);
    };

    window.addEventListener("show-achievement", handleShowAchievement);
    return () => window.removeEventListener("show-achievement", handleShowAchievement);
  }, []);

  if (!achievement) return null;

  // Cari data achievement yang sesuai
  const data = achievement.type === "kanji"
    ? ACHIEVEMENTS_KANJI.find(a => a.id === achievement.id)
    : ACHIEVEMENTS_KOTOBA.find(a => a.id === achievement.id);

  if (!data) return null;

  return (
    <div className={`fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={() => setIsVisible(false)} />
      
      <div className={`relative bg-slate-900 border-2 border-yellow-500 rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-[0_0_50px_rgba(234,179,8,0.4)] pointer-events-auto transition-transform duration-500 ${isVisible ? "scale-100 translate-y-0" : "scale-75 translate-y-10"}`}>
        
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-8xl animate-bounce">🏆</div>
        
        <h2 className="text-2xl font-bold text-yellow-400 mt-8 mb-2 uppercase tracking-widest">Achievement Unlocked!</h2>
        
        <div className={`w-24 h-24 mx-auto my-4 flex items-center justify-center text-5xl rounded-full border-4 border-white/20 shadow-inner ${data.color}`}>
          {data.icon}
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">{data.name}</h3>
        <p className="text-sm text-slate-400">{data.desc}</p>

        <button
          onClick={() => setIsVisible(false)}
          className="mt-6 w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition"
        >
          Keren!
        </button>
      </div>
    </div>
  );
}