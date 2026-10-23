// app/leaderboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import AppLayout from "@/components/AppLayout";
import Link from "next/link"; // 🆕 Import Link

type TabType = "exp" | "coins" | "streak" | "achievements" | "survival" | "kanji" | "kotoba";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("exp");
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setMyId(data.user.id);
    });
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      
      let column = "total_exp";
      if (activeTab === "coins") column = "sakura_coins";
      if (activeTab === "streak") column = "current_streak";
      if (activeTab === "achievements") column = "total_achievements";
      if (activeTab === "survival") column = "survival_high_score";
      if (activeTab === "kanji") column = "mastered_kanji_count";
      if (activeTab === "kotoba") column = "mastered_kotoba_count";

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order(column, { ascending: false })
        .limit(50);

      if (!error && data) {
        setPlayers(data);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [activeTab]);

  const tabs = [
    { id: "exp", label: "EXP", icon: "⚡", color: "bg-yellow-50 text-yellow-600 border-yellow-200" },
    { id: "coins", label: "Koin", icon: "🌸", color: "bg-pink-50 text-pink-600 border-pink-200" },
    { id: "streak", label: "Streak", icon: "🔥", color: "bg-orange-50 text-orange-600 border-orange-200" },
    { id: "achievements", label: "Lencana", icon: "🏅", color: "bg-purple-50 text-purple-600 border-purple-200" },
    { id: "survival", label: "Survival", icon: "⚔️", color: "bg-red-50 text-red-600 border-red-200" },
    { id: "kanji", label: "Kanji", icon: "📚", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    { id: "kotoba", label: "Kotoba", icon: "📖", color: "bg-blue-50 text-blue-600 border-blue-200" },
  ];

  const getScore = (player: any) => {
    if (activeTab === "exp") return player.total_exp || 0;
    if (activeTab === "coins") return player.sakura_coins || 0;
    if (activeTab === "streak") return player.current_streak || 0;
    if (activeTab === "achievements") return player.total_achievements || 0;
    if (activeTab === "survival") return player.survival_high_score || 0;
    if (activeTab === "kanji") return player.mastered_kanji_count || 0;
    if (activeTab === "kotoba") return player.mastered_kotoba_count || 0;
    return 0;
  };

  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-10">
        
        {/* Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="text-6xl mb-4 animate-bounce inline-block drop-shadow-md">🏆</div>
          <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Papan Peringkat</h1>
          <p className="text-slate-500 text-lg mb-6">Jadilah yang terbaik dari ribuan pelajar lainnya!</p>
          
          {/* 🆕 Tombol Klaim Hadiah */}
          <Link href="/leaderboard/rewards" className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-3 px-8 rounded-2xl shadow-lg transition transform hover:scale-105 active:scale-95">
            🎁 Klaim Hadiah Peringkat
          </Link>
        </div>

        {/* Tab Navigasi */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-none flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
                activeTab === tab.id
                  ? `${tab.color} shadow-md scale-105 ring-2 ring-offset-2 ring-slate-200`
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <div className="text-slate-400 font-bold text-lg animate-pulse">Memuat data peringkat...</div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-700">
            
            {/* Podium Top 3 */}
            {top3.length > 0 && (
              <div className="flex justify-center items-end gap-2 sm:gap-6 mb-12 h-64 sm:h-72 px-2">
                
                {/* Rank 2 */}
                {top3[1] && (
                  <div className="flex flex-col items-center w-1/3 max-w-[140px] animate-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
                    <div className="text-2xl mb-1">🥈</div>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 border-4 border-slate-300 overflow-hidden shadow-lg z-10 -mb-6 sm:-mb-8">
                      {top3[1].avatar_url ? <img src={top3[1].avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>}
                    </div>
                    <div className="bg-gradient-to-t from-slate-200 to-slate-300 w-full rounded-t-2xl pt-8 sm:pt-10 pb-4 px-2 text-center shadow-inner relative">
                      <div className="font-bold text-slate-800 text-sm sm:text-base truncate w-full">{top3[1].username}</div>
                      <div className="text-xs sm:text-sm font-black text-slate-600 mt-1">{getScore(top3[1]).toLocaleString()}</div>
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-3xl font-black text-white/50">2</div>
                    </div>
                  </div>
                )}

                {/* Rank 1 */}
                {top3[0] && (
                  <div className="flex flex-col items-center w-1/3 max-w-[160px] animate-in slide-in-from-bottom-8 duration-700 fill-mode-both">
                    <div className="text-4xl mb-1 animate-bounce drop-shadow-md">👑</div>
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-50 border-4 border-yellow-400 overflow-hidden shadow-[0_0_20px_rgba(250,204,21,0.5)] z-10 -mb-6 sm:-mb-8">
                      {top3[0].avatar_url ? <img src={top3[0].avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>}
                    </div>
                    <div className="bg-gradient-to-t from-yellow-400 to-amber-300 w-full rounded-t-2xl pt-10 sm:pt-12 pb-4 px-2 text-center shadow-xl relative">
                      <div className="font-black text-amber-900 text-sm sm:text-lg truncate w-full">{top3[0].username}</div>
                      <div className="text-sm sm:text-base font-black text-amber-800 mt-1">{getScore(top3[0]).toLocaleString()}</div>
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-4xl font-black text-white/50">1</div>
                    </div>
                  </div>
                )}

                {/* Rank 3 */}
                {top3[2] && (
                  <div className="flex flex-col items-center w-1/3 max-w-[140px] animate-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
                    <div className="text-2xl mb-1">🥉</div>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-50 border-4 border-amber-600 overflow-hidden shadow-lg z-10 -mb-6 sm:-mb-8">
                      {top3[2].avatar_url ? <img src={top3[2].avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>}
                    </div>
                    <div className="bg-gradient-to-t from-amber-600 to-amber-500 w-full rounded-t-2xl pt-8 sm:pt-10 pb-4 px-2 text-center shadow-inner relative">
                      <div className="font-bold text-white text-sm sm:text-base truncate w-full">{top3[2].username}</div>
                      <div className="text-xs sm:text-sm font-black text-amber-100 mt-1">{getScore(top3[2]).toLocaleString()}</div>
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-3xl font-black text-white/40">3</div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* List Peringkat Lainnya */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
              {rest.length === 0 && top3.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <div className="text-5xl mb-4">👻</div>
                  <p className="text-lg font-medium">Belum ada data user di database.</p>
                </div>
              ) : (
                rest.map((player, index) => {
                  const actualRank = index + 4;
                  const isMe = player.id === myId;
                  
                  return (
                    <div 
                      key={player.id} 
                      className={`flex items-center p-4 border-b border-slate-100 last:border-0 transition-all duration-300 hover:scale-[1.01] hover:shadow-sm ${
                        isMe ? "bg-blue-50/80 border-l-4 border-l-blue-500" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="w-8 font-black text-center text-slate-400 text-lg">{actualRank}</div>
                      
                      <div className={`w-12 h-12 rounded-full border-2 ml-2 sm:ml-4 overflow-hidden shrink-0 flex items-center justify-center ${isMe ? "border-blue-300 bg-blue-100" : "border-slate-200 bg-slate-100"}`}>
                        {player.avatar_url ? <img src={player.avatar_url} className="w-full h-full object-cover" /> : <span className="text-xl">👤</span>}
                      </div>
                      
                      <div className="flex-1 ml-3 sm:ml-4 min-w-0">
                        <div className="font-bold text-slate-700 text-sm sm:text-base truncate flex items-center gap-2">
                          {player.username} 
                          {isMe && <span className="text-[10px] text-blue-600 bg-blue-200 px-2 py-0.5 rounded-full uppercase tracking-wider font-black shrink-0">Kamu</span>}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">Level {Math.floor(Math.sqrt((player.total_exp || 0) / 50)) + 1}</div>
                      </div>
                      
                      <div className={`font-black text-lg tabular-nums ${isMe ? "text-blue-600" : "text-slate-800"}`}>
                        {getScore(player).toLocaleString()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <p className="text-center text-slate-400 text-xs sm:text-sm mt-8">
              *Data diperbarui secara real-time dari database pusat.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}