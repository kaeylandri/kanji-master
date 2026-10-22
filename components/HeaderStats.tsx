// components/HeaderStats.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getMissionsState } from "@/utils/missionEngine";
import { getStreakData } from "@/utils/streakEngine";
import { supabase } from "@/utils/supabase";
import { triggerToast } from "@/utils/toast";

export default function HeaderStats({ variant = "light", isInsideLayout = false }: { variant?: "light" | "dark", isInsideLayout?: boolean }) {
  const [stats, setStats] = useState({ streak: 0, exp: 0, coins: 0 });
  const [hasNewRequest, setHasNewRequest] = useState(false);
  
  const lastRequestCount = useRef<number>(0);
  const lastAcceptedCount = useRef<number>(0);
  const isFirstLoad = useRef<boolean>(true);

  const loadStats = () => {
    const streakData = getStreakData();
    const missionData = getMissionsState();
    setStats({
      streak: streakData?.currentStreak || 0,
      exp: missionData?.exp || 0,
      coins: missionData?.coins || 0,
    });
  };

  useEffect(() => {
    loadStats();
    window.addEventListener("streakUpdated", loadStats);
    window.addEventListener("missionUpdated", loadStats);

    const checkNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count: pendingCount } = await supabase.from('friends').select('*', { count: 'exact', head: true }).eq('friend_id', user.id).eq('status', 'pending');
      const { count: acceptedCount } = await supabase.from('friends').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'accepted');

      const currentPending = pendingCount || 0;
      const currentAccepted = acceptedCount || 0;

      if (currentPending > 0) setHasNewRequest(true); else setHasNewRequest(false);

      if (!isFirstLoad.current) {
        if (currentPending > lastRequestCount.current) triggerToast("Kamu mendapatkan permintaan pertemanan baru! 📩", "info");
        if (currentAccepted > lastAcceptedCount.current) triggerToast("Permintaan pertemananmu telah disetujui! 🎉", "success");
      }

      lastRequestCount.current = currentPending;
      lastAcceptedCount.current = currentAccepted;
      isFirstLoad.current = false;
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 5000);

    return () => {
      window.removeEventListener("streakUpdated", loadStats);
      window.removeEventListener("missionUpdated", loadStats);
      clearInterval(interval);
    };
  }, []);

  const bgClass = variant === "dark" ? "text-white" : "text-slate-800";
  const dividerClass = variant === "dark" ? "bg-slate-600" : "bg-slate-200";
  const avatarBgClass = variant === "dark" ? "bg-slate-700 border-slate-600" : "bg-slate-200 border-slate-300";

  // 🆕 Jika dipanggil dari dalam AppLayout, jangan render tag <header> lagi
  const ContainerTag = isInsideLayout ? "div" : "header";
  const containerClass = isInsideLayout 
    ? `flex items-center justify-between w-full ${bgClass}` 
    : `h-20 border-b-2 flex items-center justify-between px-8 sticky top-0 z-40 ${bgClass} ${variant === 'light' ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'}`;

  return (
    <ContainerTag className={containerClass}>
      <div className="flex-1" />

      <div className="flex items-center gap-4 lg:gap-8">
        <div className="flex items-center gap-3 lg:gap-6">
          <div className="flex items-center gap-1 lg:gap-2 text-orange-500 font-bold text-sm lg:text-xl cursor-default">
            <span className="text-lg lg:text-2xl">🔥</span>
            <span>{stats.streak}</span>
          </div>
          <div className="flex items-center gap-1 lg:gap-2 text-yellow-500 font-bold text-sm lg:text-xl cursor-default">
            <span className="text-lg lg:text-2xl">⚡</span>
            <span>{stats.exp.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 lg:gap-2 text-pink-500 font-bold text-sm lg:text-xl cursor-default">
            <span className="text-lg lg:text-2xl">🌸</span>
            <span>{stats.coins.toLocaleString()}</span>
          </div>
        </div>

        <div className={`w-px h-6 lg:h-8 ${dividerClass}`}></div>

        <Link href="/friend-requests" className="relative group">
          <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 flex items-center justify-center text-sm lg:text-xl transition-all group-hover:scale-110 ${avatarBgClass}`}>
            🔔
          </div>
          {hasNewRequest && (
            <span className="absolute top-0 right-0 flex h-2 w-2 lg:h-3 lg:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 lg:h-3 lg:w-3 bg-rose-500 border-2 border-white"></span>
            </span>
          )}
        </Link>

        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 flex items-center justify-center text-sm lg:text-xl ${avatarBgClass}`}>
            👤
          </div>
        </div>
      </div>
    </ContainerTag>
  );
}