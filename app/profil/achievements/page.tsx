// app/profil/achievements/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ACHIEVEMENTS_KOTOBA } from "@/data/achievements";
import { supabase } from "@/utils/supabase";

function AchievementsContent() {
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("userId");

  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [uniqueKotobaAnswered, setUniqueKotobaAnswered] = useState<number[]>([]);
  const [kotobaList, setKotobaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Ambil data dari API
      const res = await fetch("/api/kotoba/semua");
      const data = await res.json();
      setKotobaList(data);

      if (targetUserId) {
        // === MODE LIHAT PROFIL ORANG LAIN (DARI DATABASE) ===
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', targetUserId);

        if (progressData) {
          // Ambil semua kotoba yang pernah dijawab (mastered atau tidak)
          const answeredIds = progressData
            .filter(p => p.item_type === 'kotoba')
            .map(p => p.item_id);
          
          setUniqueKotobaAnswered(answeredIds);
        }
      } else {
        // === MODE LIHAT PROFIL SENDIRI (DARI LOCALSTORAGE) ===
        try {
          const examStats = JSON.parse(localStorage.getItem("kotobaExamStats") || "{}");
          if (examStats.unlocked) setUnlockedAchievements(examStats.unlocked);

          const uniqueAnswered = JSON.parse(localStorage.getItem("uniqueKotobaAnswered") || "[]");
          setUniqueKotobaAnswered(uniqueAnswered);
        } catch (e) {}
      }
      setLoading(false);
    };

    fetchData();
  }, [targetUserId]);

  const getProgress = (ach: any) => {
    if (ach.type === "category") {
      const kotobaInCat = kotobaList.filter(k => k.category === ach.categoryTarget);
      const masteredInCat = kotobaInCat.filter(k => uniqueKotobaAnswered.includes(k.id)).length;
      const percent = ach.targetCount ? (masteredInCat / ach.targetCount) * 100 : 0;
      return { current: masteredInCat, target: ach.targetCount, percent: Math.min(percent, 100) };
    } else {
      const isUnlocked = unlockedAchievements.includes(ach.id);
      return { current: isUnlocked ? 1 : 0, target: 1, percent: isUnlocked ? 100 : 0 };
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center animate-pulse">Memuat data...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-10">
          <Link href={targetUserId ? `/user/${targetUserId}` : "/profil"} className="text-blue-400 hover:text-blue-300 text-sm font-semibold mb-4 inline-block">
            ← Kembali ke Profil
          </Link>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            🏅 Semua Pencapaian Kotoba
          </h1>
          <p className="text-slate-400">Kumpulkan seluruh gelar dengan menyelesaikan Ujian Kotoba.</p>
        </header>

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-emerald-400">Kategori Kotoba (20)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ACHIEVEMENTS_KOTOBA.filter(a => a.type === "category").map((ach) => {
                const { current, target, percent } = getProgress(ach);
                const isUnlocked = percent === 100;
                return (
                  <div key={ach.id} className={`rounded-2xl p-5 flex items-start gap-4 border-2 ${isUnlocked ? "bg-slate-800 border-slate-600 shadow-lg" : "bg-slate-900/80 border-slate-800"}`}>
                    <div className={`shrink-0 w-14 h-14 flex items-center justify-center text-3xl rounded-xl border ${isUnlocked ? `${ach.color} border-white/20 shadow-inner` : "bg-slate-800 border-slate-700 text-slate-600"}`}>
                      {isUnlocked ? ach.icon : "🔒"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`font-bold text-base leading-tight ${isUnlocked ? "text-white" : "text-slate-500"}`}>{ach.name}</h3>
                        <span className={`text-sm font-bold ml-2 ${isUnlocked ? "text-emerald-400" : "text-slate-500"}`}>{Math.round(percent)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex mb-1 mt-2">
                        <div className={`h-full ${isUnlocked ? "bg-yellow-400" : "bg-slate-600"}`} style={{ width: `${percent}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-500">{current} dari {target} kotoba</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Memuat...</div>}><AchievementsContent /></Suspense>;
}