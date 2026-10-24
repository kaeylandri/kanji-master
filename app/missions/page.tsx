// app/missions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { MISSIONS } from "@/data/missions/config";
import { getMissionsState, getPeriodKey, claimReward } from "@/utils/missionEngine";
import { triggerToast } from "@/utils/toast";
import AppLayout from "@/components/AppLayout";
import AchievementTab from "@/components/AchievementTab";

export default function MissionsPage() {
  const [state, setState] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "achievements">("daily");
  const [isMounted, setIsMounted] = useState(false); // 🆕 Kunci SSR

  const loadData = () => {
    const newState = getMissionsState();
    if (newState) {
      newState.progress = newState.progress || {};
    }
    setState(newState);
  };

  useEffect(() => {
    setIsMounted(true); 
    loadData();
    window.addEventListener("missionUpdated", loadData);
    return () => window.removeEventListener("missionUpdated", loadData);
  }, []);

  const handleClaim = async (id: string) => {
    const success = await claimReward(id);
    if (success) {
      triggerToast("Hadiah berhasil diklaim!", "success");
      loadData();
    } else {
      triggerToast("Gagal mengklaim hadiah atau sudah diklaim.", "error");
    }
  };

  // 🆕 JANGAN RENDER APAPUN JIKA BELUM MOUNTED ATAU STATE KOSONG
  if (!isMounted || !state) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20 text-slate-500 font-bold animate-pulse">
          Memuat misi...
        </div>
      </AppLayout>
    );
  }

  const safeMissions = Array.isArray(MISSIONS) ? MISSIONS : [];
  const filteredMissions = safeMissions.filter((m) => m && m.period === activeTab);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-8 text-center">
          <div className="text-5xl mb-3">🎯</div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Papan Misi</h1>
          <p className="text-slate-500">Selesaikan misi harian, mingguan, dan raih semua pencapaian!</p>
        </div>

        <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <button onClick={() => setActiveTab("daily")} className={`flex-1 min-w-[100px] py-3 rounded-xl font-bold text-sm transition ${activeTab === "daily" ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-100" : "text-slate-500 hover:bg-slate-50"}`}>☀️ Harian</button>
          <button onClick={() => setActiveTab("weekly")} className={`flex-1 min-w-[100px] py-3 rounded-xl font-bold text-sm transition ${activeTab === "weekly" ? "bg-purple-50 text-purple-600 shadow-sm border border-purple-100" : "text-slate-500 hover:bg-slate-50"}`}>⚔️ Mingguan</button>
          <button onClick={() => setActiveTab("achievements")} className={`flex-1 min-w-[100px] py-3 rounded-xl font-bold text-sm transition ${activeTab === "achievements" ? "bg-amber-50 text-amber-600 shadow-sm border border-amber-100" : "text-slate-500 hover:bg-slate-50"}`}>🏅 Pencapaian</button>
        </div>

        {(activeTab === "daily" || activeTab === "weekly") && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredMissions.map((mission) => {
              if (!mission || !mission.id) return null;

              const periodKey = getPeriodKey(mission.period);
              
              // 🆕 PENGAMAN SUPER KETAT (Mencegah error daily_kanji_5)
              const progressData = state?.progress || {};
              const missionProg = progressData?.[mission.id] || {};
              const prog = missionProg?.[periodKey] || { 
                progress: 0, 
                isCompleted: false, 
                isClaimed: false 
              };
              
              const percent = mission.target > 0 ? (prog.progress / mission.target) * 100 : 0;

              return (
                <div key={mission.id} className={`bg-white rounded-2xl p-5 border-2 transition-all shadow-sm ${prog.isClaimed ? "border-slate-200 opacity-60" : prog.isCompleted ? "border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "border-slate-200"}`}>
                  
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-800">{mission.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">{mission.description}</p>
                    </div>
                    <div className="shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center shadow-sm min-w-[80px]">
                      <div className="text-sm font-black text-yellow-600">+{mission.rewardExp} XP</div>
                      <div className="text-xs font-bold text-pink-500 mt-1">+{mission.rewardCoins} 🌸</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-slate-600">{prog.progress} / {mission.target}</span>
                      <span className="text-slate-400">{Math.round(percent)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div className={`h-full transition-all duration-500 ${prog.isCompleted ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>

                  {prog.isCompleted && (
                    <button onClick={() => handleClaim(mission.id)} disabled={prog.isClaimed} className="w-full mt-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl transition shadow-md active:scale-95">
                      {prog.isClaimed ? "✅ Hadiah Diklaim" : "🎁 Klaim Hadiah"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "achievements" && (
          <AchievementTab />
        )}
      </div>
    </AppLayout>
  );
}