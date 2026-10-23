// app/leaderboard/rewards/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import AppLayout from "@/components/AppLayout";
import { triggerToast } from "@/utils/toast";
import { getMissionsState } from "@/utils/missionEngine";
import { useRouter } from "next/navigation";

// Fungsi untuk mendapatkan identitas minggu (misal: 2026-W42)
function getWeekIdentifier() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNumber}`;
}

const REWARDS = [
  // Top 3 (Hadiah Besar)
  { rank: 1, exp: 5000, coins: 2000, freeze: 10, title: "👑 Sang Juara", color: "from-yellow-400 to-amber-500" },
  { rank: 2, exp: 3000, coins: 1500, freeze: 8, title: "🥈 Sang Penantang", color: "from-slate-300 to-slate-400" },
  { rank: 3, exp: 2000, coins: 1000, freeze: 5, title: "🥉 Sang Pejuang", color: "from-amber-600 to-amber-700" },
  // Top 4-15 (Hadiah Menengah)
  { rank: "4-15", exp: 1000, coins: 500, freeze: 3, title: "🌟 Pelajar Berbakat", color: "from-blue-400 to-indigo-500" },
];

export default function LeaderboardRewardsPage() {
  const router = useRouter();
  const [myRank, setMyRank] = useState<number | null>(null);
  const [canClaim, setCanClaim] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claimedThisWeek, setClaimedThisWeek] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekId = getWeekIdentifier();

      // 1. Cek apakah sudah klaim minggu ini
      const { data: claimData } = await supabase
        .from('leaderboard_rewards')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_identifier', weekId)
        .maybeSingle();

      if (claimData) {
        setClaimedThisWeek(true);
        setLoading(false);
        return;
      }

      // 2. Dapatkan peringkat user saat ini
      const { data: allPlayers } = await supabase
        .from('profiles')
        .select('id, total_exp')
        .order('total_exp', { ascending: false });

      if (allPlayers) {
        const rank = allPlayers.findIndex(p => p.id === user.id) + 1;
        setMyRank(rank);
        setCanClaim(rank > 0 && rank <= 15);
      }
      setLoading(false);
    };
    checkStatus();
  }, []);

  const handleClaim = async () => {
    if (!myRank || !canClaim) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Tentukan hadiah berdasarkan rank
    let reward = REWARDS.find(r => r.rank === myRank);
    if (!reward && myRank >= 4 && myRank <= 15) {
      reward = REWARDS[3]; // Hadiah 4-15
    }
    if (!reward) return;

    // 1. Simpan ke database (tandai sudah klaim)
    const { error } = await supabase.from('leaderboard_rewards').insert({
      user_id: user.id,
      week_identifier: getWeekIdentifier(),
      rank_claimed: myRank
    });

    if (error) return triggerToast("Gagal klaim hadiah: " + error.message, "error");

    // 2. Tambahkan hadiah ke localStorage
    const ms = getMissionsState();
    if (ms) {
      ms.exp += reward.exp;
      ms.coins += reward.coins;
      localStorage.setItem("kanjiMaster.missions.v1", JSON.stringify(ms));
      window.dispatchEvent(new Event("missionUpdated"));
    }
    // Freeze disimpan di inventory
    const inv = JSON.parse(localStorage.getItem("kanjiMaster.inventory.v1") || '{"freeze":0,"hint":0,"reveal":0}');
    inv.freeze += reward.freeze;
    localStorage.setItem("kanjiMaster.inventory.v1", JSON.stringify(inv));
    window.dispatchEvent(new Event("inventoryUpdated"));

    triggerToast(`Hadiah Peringkat #${myRank} berhasil diklaim! 🎉`, "success");
    setClaimedThisWeek(true);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="mb-6 text-slate-500 font-bold hover:text-blue-600">
          ← Kembali ke Leaderboard
        </button>

        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🎁</div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Hadiah Peringkat Mingguan</h1>
          <p className="text-slate-500">Selesaikan minggu ini di posisi teratas untuk mendapatkan hadiah eksklusif!</p>
        </div>

        {loading ? (
          <div className="text-center py-10 animate-pulse text-slate-500">Memeriksa peringkatmu...</div>
        ) : (
          <>
            {/* Status User */}
            <div className={`p-6 rounded-3xl mb-8 border-2 text-center ${canClaim ? "bg-emerald-50 border-emerald-300" : "bg-slate-50 border-slate-200"}`}>
              <h2 className="text-lg text-slate-600 font-semibold mb-1">Peringkatmu Saat Ini</h2>
              <div className="text-5xl font-black text-slate-800 mb-2">#{myRank || "-"}</div>
              {claimedThisWeek ? (
                <div className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-bold">✅ Hadiah Minggu Ini Sudah Diklaim</div>
              ) : canClaim ? (
                <button onClick={handleClaim} className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg animate-bounce">
                  🎁 Klaim Hadiah Kamu Sekarang!
                </button>
              ) : (
                <p className="text-slate-500 text-sm">Peringkatmu belum masuk 15 besar. Terus belajar untuk masuk!</p>
              )}
            </div>

            {/* Daftar Hadiah */}
            <h2 className="text-xl font-bold text-slate-800 mb-4">Daftar Hadiah</h2>
            <div className="space-y-4">
              {REWARDS.map((rw, idx) => (
                <div key={idx} className={`bg-gradient-to-r ${rw.color} p-1 rounded-3xl shadow-md`}>
                  <div className="bg-white rounded-[22px] p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-black text-slate-800 min-w-[60px]">
                        {rw.rank === "4-15" ? "#4-15" : `#${rw.rank}`}
                      </div>
                      <div>
                        <div className="font-bold text-lg text-slate-800">{rw.title}</div>
                        <div className="text-sm text-slate-500 flex gap-3 mt-1">
                          <span>⚡ {rw.exp} XP</span>
                          <span>🌸 {rw.coins}</span>
                          <span>❄️ {rw.freeze}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}