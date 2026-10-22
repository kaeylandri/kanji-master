// app/missions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { MISSIONS } from "@/data/missions/config";
import { getMissionsState, getPeriodKey, claimReward } from "@/utils/missionEngine";
import { triggerToast } from "@/utils/toast";
import AppLayout from "@/components/AppLayout"; // Cukup AppLayout saja

export default function MissionsPage() {
  const [state, setState] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"daily" | "weekly">("daily");

  const loadData = () => {
    setState(getMissionsState());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("missionUpdated", loadData);
    return () => window.removeEventListener("missionUpdated", loadData);
  }, []);

  if (!state) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20 text-slate-500 font-bold animate-pulse">
          Memuat misi...
        </div>
      </AppLayout>
    );
  }

  const handleClaim = (id: string) => {
    const success = claimReward(id);
    if (success) {
      triggerToast("Hadiah berhasil diklaim!", "success");
      loadData();
    } else {
      triggerToast("Gagal mengklaim hadiah.", "error");
    }
  };

  const filteredMissions = MISSIONS.filter((m) => m.period === activeTab);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        
        {/* Judul Halaman */}
        <div className="mb-8 text-center">
          <div className="text-5xl mb-3">🎯</div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Papan Misi
          </h1>
          <p className="text-slate-500">Selesaikan misi harian dan mingguan untuk mendapatkan hadiah!</p>
        </div>

        {/* Tab Navigasi */}
        <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab("daily")}
            className={`flex-1 py-3 rounded-xl font-bold text-sm sm:text-base transition ${
              activeTab === "daily"
                ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-100"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            ☀️ Misi Harian
          </button>
          <button
            onClick={() => setActiveTab("weekly")}
            className={`flex-1 py-3 rounded-xl font-bold text-sm sm:text-base transition ${
              activeTab === "weekly"
                ? "bg-purple-50 text-purple-600 shadow-sm border border-purple-100"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            ⚔️ Misi Mingguan
          </button>
        </div>

        {/* Daftar Misi */}
        <div className="space-y-4">
          {filteredMissions.map((mission) => {
            const periodKey = getPeriodKey(mission.period);
            const prog = state.progress[mission.id]?.[periodKey] || {
              progress: 0,
              isCompleted: false,
              isClaimed: false,
            };
            const percent = (prog.progress / mission.target) * 100;

            return (
              <div
                key={mission.id}
                className={`bg-white rounded-2xl p-5 border-2 transition-all shadow-sm ${
                  prog.isClaimed
                    ? "border-slate-200 opacity-60"
                    : prog.isCompleted
                    ? "border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    : "border-slate-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-3 sm:gap-0">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{mission.title}</h3>
                    <p className="text-sm text-slate-500">{mission.description}</p>
                  </div>
                  <div className="text-right shrink-0 sm:ml-4 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 w-full sm:w-auto flex sm:block justify-between">
                    <div className="text-sm font-bold text-yellow-600">+{mission.rewardExp} XP</div>
                    <div className="text-xs text-pink-500 font-semibold sm:mt-1">+{mission.rewardCoins} 🌸</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-600">{prog.progress} / {mission.target}</span>
                    <span className="text-slate-400">{Math.round(percent)}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full ${
                        prog.isCompleted ? "bg-emerald-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {prog.isCompleted && (
                  <button
                    onClick={() => handleClaim(mission.id)}
                    disabled={prog.isClaimed}
                    className="w-full mt-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl transition shadow-md active:scale-95"
                  >
                    {prog.isClaimed ? "✅ Hadiah Diklaim" : "🎁 Klaim Hadiah"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </AppLayout>
  );
}