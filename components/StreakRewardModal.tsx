"use client";

import { useEffect, useState } from "react";
import { MILESTONES, claimMilestoneReward } from "@/utils/streakEngine";
import { playAchievementSound } from "@/utils/sound";

export default function StreakRewardModal() {
  const [milestone, setMilestone] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleShow = (e: Event) => {
      const data = (e as CustomEvent).detail;
      setMilestone(data);
      setIsVisible(true);
      playAchievementSound();
    };
    window.addEventListener("show-streak-reward", handleShow);
    return () => window.removeEventListener("show-streak-reward", handleShow);
  }, []);

  if (!milestone) return null;

  const handleClaim = () => {
    const success = claimMilestoneReward(milestone.days);
    if (success) {
      setIsVisible(false);
      setTimeout(() => setMilestone(null), 300);
    }
  };

  return (
    <div className={`fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto" />
      
      <div className={`relative bg-slate-900 border-2 border-orange-500 rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-[0_0_50px_rgba(249,115,22,0.5)] pointer-events-auto transition-transform duration-500 ${isVisible ? "scale-100 translate-y-0" : "scale-75 translate-y-10"}`}>
        
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-8xl animate-bounce">🔥</div>
        
        <h2 className="text-2xl font-bold text-orange-400 mt-8 mb-2 uppercase tracking-widest">Milestone Streak!</h2>
        
        <div className="text-5xl font-black text-white mb-1">{milestone.days} HARI</div>
        <div className="text-sm text-orange-200 mb-6">{milestone.label}</div>

        <div className="bg-slate-800 rounded-2xl p-4 mb-6 border border-slate-700">
          <div className="flex justify-center gap-6">
            <div>
              <div className="text-xs text-slate-400">EXP</div>
              <div className="text-xl font-bold text-yellow-400">+{milestone.exp}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Koin</div>
              <div className="text-xl font-bold text-pink-400">+{milestone.coins} 🌸</div>
            </div>
          </div>
        </div>

        <button
          onClick={handleClaim}
          className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold py-4 rounded-xl shadow-lg transition active:scale-95"
        >
          🎁 Klaim Hadiah
        </button>
      </div>
    </div>
  );
}