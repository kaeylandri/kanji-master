// app/leaderboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import AppLayout from "@/components/AppLayout"; // Cukup AppLayout saja

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"exp" | "coins" | "streak">("exp");
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    // Cek siapa yang sedang login
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

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        
        {/* Header Judul */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Papan Peringkat Global</h1>
          <p className="text-slate-500">Bersaing dengan pelajar asli dari seluruh dunia!</p>
        </div>

        {/* Tab Navigasi */}
        <div className="flex gap-1.5 sm:gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm relative z-10">
          <button
            onClick={() => setActiveTab("exp")}
            className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition ${
              activeTab === "exp"
                ? "bg-yellow-50 text-yellow-600 border border-yellow-200"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            ⚡ EXP
          </button>
          <button
            onClick={() => setActiveTab("coins")}
            className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition ${
              activeTab === "coins"
                ? "bg-pink-50 text-pink-600 border border-pink-200"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            🌸 Koin
          </button>
          <button
            onClick={() => setActiveTab("streak")}
            className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition ${
              activeTab === "streak"
                ? "bg-orange-50 text-orange-600 border border-orange-200"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            🔥 Streak
          </button>
        </div>

        {/* List Leaderboard */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 animate-pulse font-bold text-xl">
            Menghubungi server... 🌸
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative z-10">
            {players.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                Belum ada data user di database.
              </div>
            ) : (
              players.map((player, index) => {
                const rank = index + 1;
                const isMe = player.id === myId;
                const score = activeTab === "exp" ? player.total_exp : activeTab === "coins" ? player.sakura_coins : player.current_streak;

                return (
                  <div
                    key={player.id}
                    className={`flex items-center p-3 sm:p-4 border-b border-slate-100 last:border-0 ${
                      isMe ? "bg-blue-50 border-l-4 border-l-blue-500" : "hover:bg-slate-50"
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-6 sm:w-8 font-bold text-center text-sm sm:text-base ${rank <= 3 ? "text-xl" : "text-slate-400"}`}>
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                    </div>

                    {/* Avatar */}
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm sm:text-xl ml-2 sm:ml-4 overflow-hidden shrink-0">
                      {player.avatar_url ? (
                        <img src={player.avatar_url} alt="PP" className="w-full h-full object-cover" />
                      ) : (
                        "👤"
                      )}
                    </div>

                    {/* Nama */}
                    <div className="flex-1 ml-3 sm:ml-4 font-bold text-slate-700 text-sm sm:text-base truncate">
                      {player.username} {isMe && <span className="text-[10px] sm:text-xs text-blue-500 bg-blue-100 px-1.5 sm:px-2 py-0.5 rounded-full ml-1 sm:ml-2">Kamu</span>}
                    </div>

                    {/* Skor */}
                    <div className="font-black text-slate-800 text-sm sm:text-lg tabular-nums">
                      {score.toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        <p className="text-center text-slate-400 text-xs sm:text-sm mt-6 pb-8">
          *Data diambil langsung dari database pusat secara real-time.
        </p>

      </div>
    </AppLayout>
  );
}