// components/AchievementTab.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { ACHIEVEMENTS_KANJI } from "@/data/achievements-kanji";
import { ACHIEVEMENTS_KOTOBA } from "@/data/achievements";
import { triggerToast } from "@/utils/toast";

// Hadiah default berdasarkan tipe achievement
const REWARDS = {
  progress: { exp: 500, coins: 200, hint: 1, freeze: 0, reveal: 0 },
  category: { exp: 300, coins: 150, hint: 0, freeze: 0, reveal: 1 },
  mode: { exp: 250, coins: 100, hint: 0, freeze: 1, reveal: 0 },
  general: { exp: 200, coins: 80, hint: 0, freeze: 1, reveal: 0 },
  // Hadiah Raksasa untuk "The End?"
  the_end: { exp: 50000, coins: 20000, freeze: 10, hint: 5, reveal: 5 },
};

export default function AchievementTab() {
  const [claimed, setClaimed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<"kanji" | "kotoba">("kanji");

  // 🆕 PENGAMAN: Pastikan parsing JSON aman dan memberikan fallback array/object kosong
  const safeParse = (key: string, fallback: any) => {
    if (typeof window === "undefined") return fallback;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      return fallback;
    }
  };

  // Data user (dari localStorage dengan pengaman)
  const masteredKanji = safeParse("masteredKanji", []);
  const masteredKotoba = safeParse("masteredKotoba", []);
  
  const kanjiStats = safeParse("kanjiAchievements", {});
  const kotobaStats = safeParse("kotobaExamStats", {});
  
  // 🆕 PENGAMAN: Pastikan unlocked selalu array sebelum di-spread
  const unlockedModes = [
    ...(Array.isArray(kanjiStats.unlocked) ? kanjiStats.unlocked : []), 
    ...(Array.isArray(kotobaStats.unlocked) ? kotobaStats.unlocked : [])
  ];

  useEffect(() => {
    const fetchClaimed = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.from('achievement_rewards').select('achievement_id').eq('user_id', user.id);
      if (data) setClaimed(data.map(d => d.achievement_id));
      setLoading(false);
    };
    fetchClaimed();
  }, []);

  // 🆕 handleClaim dengan Optimistic UI (Tanpa Delay)
  const handleClaim = async (achId: string, type: string, isTheEnd: boolean = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const reward = isTheEnd ? REWARDS.the_end : REWARDS[type as keyof typeof REWARDS] || REWARDS.general;

    // 1. Ubah tampilan jadi "Diklaim" seketika (Optimistic UI)
    setClaimed((prev) => [...prev, achId]);

    // 2. Susun pesan Toast
    let toastMsg = `Hadiah diklaim! +${reward.exp} XP, +${reward.coins} 🌸`;
    if (reward.hint > 0) toastMsg += `, +${reward.hint} 💡`;
    if (reward.freeze > 0) toastMsg += `, +${reward.freeze} ❄️`;
    if (reward.reveal > 0) toastMsg += `, +${reward.reveal} 🪄`;
    
    triggerToast(isTheEnd ? `🌌 THE END TERCAPAI! ${toastMsg}` : toastMsg, "success");

    // 3. Proses API di belakang layar
    try {
      const res = await fetch("/api/rewards/claim-achievement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          achievementId: achId,
          rewardExp: reward.exp,
          rewardCoins: reward.coins,
          rewardHint: reward.hint,
          rewardFreeze: reward.freeze,
          rewardReveal: reward.reveal,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Jika gagal, kembalikan tombol ke semula dan tampilkan error
        setClaimed((prev) => prev.filter(id => id !== achId));
        triggerToast(data.error || "Gagal klaim", "error");
        return;
      }

      // Sinkronisasi ulang event agar Header (EXP/Koin) terupdate
      window.dispatchEvent(new Event("missionUpdated"));
      window.dispatchEvent(new Event("inventoryUpdated"));

    } catch (err) {
      console.error(err);
      // Jika jaringan error, kembalikan tombol
      setClaimed((prev) => prev.filter(id => id !== achId));
      triggerToast("Terjadi kesalahan jaringan.", "error");
    }
  };

  // Fungsi cek progress
  const checkProgress = (ach: any) => {
    if (ach.type === "progress" && ach.id !== "the_end") {
      return Math.min((masteredKanji.length / ach.targetCount) * 100, 100);
    }
    if (ach.type === "category") {
      return unlockedModes.includes(ach.id) ? 100 : 0;
    }
    if (ach.type === "mode" || ach.type === "general") {
      return unlockedModes.includes(ach.id) ? 100 : 0;
    }
    if (ach.id === "the_end") {
      const isAllKanji = masteredKanji.length >= 486;
      const isAllKotoba = masteredKotoba.length >= 500;
      const isAllShiken = unlockedModes.includes("mode_ujian_3");
      return (isAllKanji && isAllKotoba && isAllShiken) ? 100 : 0;
    }
    return 0;
  };

  const achievementsToShow = activeCategory === "kanji" ? ACHIEVEMENTS_KANJI : ACHIEVEMENTS_KOTOBA;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Tab Kanji / Kotoba */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveCategory("kanji")} className={`flex-1 py-3 rounded-xl font-bold transition ${activeCategory === "kanji" ? "bg-blue-100 text-blue-700 border border-blue-200 shadow-sm" : "bg-white text-slate-500 border border-slate-200"}`}>
          📚 Pencapaian Kanji
        </button>
        <button onClick={() => setActiveCategory("kotoba")} className={`flex-1 py-3 rounded-xl font-bold transition ${activeCategory === "kotoba" ? "bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm" : "bg-white text-slate-500 border border-slate-200"}`}>
          📖 Pencapaian Kotoba
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 animate-pulse text-slate-500 font-bold">Memuat data...</div>
      ) : (
        <div className="space-y-4">
          {achievementsToShow.map((ach) => {
            // 🆕 PENGAMAN: Pastikan ach dan ach.id ada sebelum diproses
            if (!ach || !ach.id) return null;

            const progress = checkProgress(ach);
            const isUnlocked = progress === 100;
            const isClaimed = claimed.includes(ach.id);
            const isTheEnd = ach.id === "the_end";
            
            // Ambil data hadiah berdasarkan tipe
            const reward = isTheEnd ? REWARDS.the_end : REWARDS[ach.type as keyof typeof REWARDS] || REWARDS.general;

            return (
              <div key={ach.id} className={`bg-white rounded-2xl p-4 border-2 transition-all shadow-sm ${isUnlocked ? "border-emerald-300" : "border-slate-200"}`}>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  
                  {/* Ikon Kiri */}
                  <div className={`shrink-0 w-14 h-14 flex items-center justify-center text-2xl rounded-xl border ${isUnlocked ? `${ach.color} border-white/20 shadow-inner` : "bg-slate-100 border-slate-200 text-slate-300"}`}>
                    {isUnlocked ? ach.icon : "🔒"}
                  </div>

                  {/* Konten Tengah */}
                  <div className="flex-1 w-full min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-bold text-lg truncate pr-2 ${isUnlocked ? "text-slate-800" : "text-slate-500"}`}>{ach.name}</h3>
                      <span className={`text-sm font-bold shrink-0 ${isUnlocked ? "text-emerald-500" : "text-slate-400"}`}>{Math.round(progress)}%</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">{ach.desc}</p>
                    
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div className={`h-full transition-all duration-500 ${isUnlocked ? "bg-yellow-400" : "bg-slate-300"}`} style={{ width: `${progress}%` }} />
                    </div>

                    {isUnlocked && (
                      <button 
                        onClick={() => handleClaim(ach.id, ach.type, isTheEnd)}
                        disabled={isClaimed}
                        className={`w-full mt-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
                          isClaimed 
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                            : isTheEnd
                            ? "bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] animate-pulse"
                            : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                        }`}
                      >
                        {isClaimed ? "✅ Hadiah Diklaim" : isTheEnd ? "🌌 Klaim Hadiah The End" : "🎁 Klaim Hadiah"}
                      </button>
                    )}
                  </div>

                  {/* Kotak Hadiah Lengkap */}
                  <div className={`shrink-0 border rounded-xl px-3 py-2 text-center shadow-sm w-full sm:w-auto flex flex-col gap-1 ${isTheEnd && isUnlocked ? "bg-yellow-50 border-yellow-300" : "bg-slate-50 border-slate-200"}`}>
                    <div className="text-sm font-black text-yellow-600">+{reward.exp.toLocaleString()} XP</div>
                    <div className="text-xs font-bold text-pink-500">+{reward.coins.toLocaleString()} 🌸</div>
                    {reward.freeze > 0 && <div className="text-xs font-bold text-cyan-500">+{reward.freeze} ❄️</div>}
                    {reward.hint > 0 && <div className="text-xs font-bold text-amber-500">+{reward.hint} 💡</div>}
                    {reward.reveal > 0 && <div className="text-xs font-bold text-purple-500">+{reward.reveal} 🪄</div>}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}