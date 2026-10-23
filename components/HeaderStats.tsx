// components/HeaderStats.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMissionsState } from "@/utils/missionEngine";
import { getStreakData } from "@/utils/streakEngine";
import { getInventory } from "@/utils/luckyEngine";
import { supabase } from "@/utils/supabase";
import { triggerToast } from "@/utils/toast";

export default function HeaderStats({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [stats, setStats] = useState({ streak: 0, exp: 0, coins: 0 });
  const [inventory, setInventory] = useState<any>({ freeze: 0, hint: 0, reveal: 0 });
  const [hasNewRequest, setHasNewRequest] = useState(false);
  
  const [lastRequestCount, setLastRequestCount] = useState(0);
  const [lastAcceptedCount, setLastAcceptedCount] = useState(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const loadStats = () => {
    const streakData = getStreakData();
    const missionData = getMissionsState();
    const invData = getInventory();
    
    setStats({
      streak: streakData?.currentStreak || 0,
      exp: missionData?.exp || 0,
      coins: missionData?.coins || 0,
    });
    setInventory(invData);
  };

  useEffect(() => {
    loadStats();
    window.addEventListener("streakUpdated", loadStats);
    window.addEventListener("missionUpdated", loadStats);
    window.addEventListener("inventoryUpdated", loadStats);

    const checkNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count: pendingCount } = await supabase.from('friends').select('*', { count: 'exact', head: true }).eq('friend_id', user.id).eq('status', 'pending');
      const { count: acceptedCount } = await supabase.from('friends').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'accepted');

      const currentPending = pendingCount || 0;
      const currentAccepted = acceptedCount || 0;

      if (currentPending > 0) setHasNewRequest(true); else setHasNewRequest(false);

      if (!isFirstLoad) {
        if (currentPending > lastRequestCount) triggerToast("Kamu mendapatkan permintaan pertemanan baru! 📩", "info");
        if (currentAccepted > lastAcceptedCount) triggerToast("Permintaan pertemananmu telah disetujui! 🎉", "success");
      }

      setLastRequestCount(currentPending);
      setLastAcceptedCount(currentAccepted);
      setIsFirstLoad(false);
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 5000);

    return () => {
      window.removeEventListener("streakUpdated", loadStats);
      window.removeEventListener("missionUpdated", loadStats);
      window.removeEventListener("inventoryUpdated", loadStats);
      clearInterval(interval);
    };
  }, []);

  const bgClass = variant === "dark" 
    ? "bg-slate-800 border-slate-700 text-white" 
    : "bg-white border-slate-200 text-slate-800";
    
  const dividerClass = variant === "dark" ? "bg-slate-600" : "bg-slate-200";
  const avatarBgClass = variant === "dark" ? "bg-slate-700 border-slate-600" : "bg-slate-200 border-slate-300";

  return (
    <header className={`h-20 border-b-2 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40 ${bgClass}`}>
      <div className="flex-1" />

      <div className="flex items-center gap-4 sm:gap-6">
        
        {/* Statistik Utama */}
        <div className="flex items-center gap-3 sm:gap-5">
          
          {/* 🔥 Ikon Api Dinamis */}
          <div className={`flex items-center gap-1 sm:gap-2 font-bold text-sm sm:text-lg cursor-default transition-colors duration-300 ${stats.streak > 0 ? "text-orange-500" : "text-slate-400"}`} title="Streak">
            <span className={`text-lg sm:text-xl transition-all duration-300 ${stats.streak > 0 ? "animate-pulse drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]" : "grayscale opacity-50"}`}>
              🔥
            </span>
            <span>{stats.streak}</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 text-yellow-500 font-bold text-sm sm:text-lg cursor-default" title="EXP">
            <span className="text-lg sm:text-xl">⚡</span>
            <span>{stats.exp.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 text-pink-500 font-bold text-sm sm:text-lg cursor-default" title="Koin Sakura">
            <span className="text-lg sm:text-xl">🌸</span>
            <span>{stats.coins.toLocaleString()}</span>
          </div>
        </div>

        <div className={`w-px h-6 sm:h-8 ${dividerClass}`}></div>

        {/* Statistik Item */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 text-cyan-500 font-bold text-xs sm:text-sm cursor-default bg-slate-50 px-2 py-1 rounded-lg border border-slate-100" title="Freeze Streak">
            <span className="text-sm sm:text-base">❄️</span>
            <span>{inventory.freeze || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs sm:text-sm cursor-default bg-slate-50 px-2 py-1 rounded-lg border border-slate-100" title="Intip Jawaban">
            <span className="text-sm sm:text-base">💡</span>
            <span>{inventory.hint || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-purple-500 font-bold text-xs sm:text-sm cursor-default bg-slate-50 px-2 py-1 rounded-lg border border-slate-100" title="Full Reveal">
            <span className="text-sm sm:text-base">🪄</span>
            <span>{inventory.reveal || 0}</span>
          </div>
        </div>

        <div className={`w-px h-6 sm:h-8 ${dividerClass}`}></div>

        {/* Lonceng & Profil */}
        <Link href="/friend-requests" className="relative group">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center text-sm sm:text-xl transition-all group-hover:scale-110 ${avatarBgClass}`}>
            🔔
          </div>
          {hasNewRequest && (
            <span className="absolute top-0 right-0 flex h-2 w-2 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-rose-500 border-2 border-white"></span>
            </span>
          )}
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/profil" className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center text-sm sm:text-xl transition hover:scale-110 ${avatarBgClass}`}>
            👤
          </Link>
        </div>
      </div>
    </header>
  );
}