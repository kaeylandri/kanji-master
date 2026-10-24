// utils/missionEngine.ts
import { MissionDefinition, MissionProgress, MissionPeriod } from "@/data/missions/types";
import { MISSIONS } from "@/data/missions/config";
import { getCurrentMultiplier } from "./luckyEngine";
import { supabase } from "./supabase";

// Mendapatkan kunci periode (Harian / Mingguan)
export function getPeriodKey(period: MissionPeriod) {
  const now = new Date();
  const offset = 7 * 60; 
  const localDate = new Date(now.getTime() + (offset + now.getTimezoneOffset()) * 60000);

  if (period === "daily") {
    return localDate.toISOString().split("T")[0]; 
  }
  if (period === "weekly") {
    const day = localDate.getDay();
    const diff = localDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(localDate.setDate(diff));
    return `week-${monday.toISOString().split("T")[0]}`;
  }
  return "month"; 
}

// Mendapatkan status misi dari localStorage (DENGAN PENGAMAN)
export function getMissionsState() {
  if (typeof window === "undefined") return null;
  
  try {
    let state = JSON.parse(localStorage.getItem("kanjiMaster.missions.v1") || "null");
    if (!state || typeof state !== "object") {
      state = { exp: 0, coins: 0, progress: {} };
    }
    // 🆕 Pastikan progress selalu objek
    if (!state.progress || typeof state.progress !== "object") {
      state.progress = {};
    }
    return state;
  } catch (e) {
    return { exp: 0, coins: 0, progress: {} };
  }
}

// Fungsi untuk menambahkan hadiah
export function addReward(baseExp: number, baseCoins: number) {
  const multiplier = getCurrentMultiplier();
  
  const finalExp = baseExp * multiplier;
  const finalCoins = baseCoins * multiplier;

  const state = getMissionsState();
  if (state) {
    state.exp = (state.exp || 0) + finalExp;
    state.coins = (state.coins || 0) + finalCoins;
    localStorage.setItem("kanjiMaster.missions.v1", JSON.stringify(state));
    window.dispatchEvent(new Event("missionUpdated"));
  }
}

// Menambah progres misi (DENGAN PENGAMAN)
export function addMissionProgress(eventType: string, amount: number = 1) {
  const state = getMissionsState();
  if (!state) return;
  let hasChanges = false;

  MISSIONS.forEach((mission) => {
    if (mission.eventType !== eventType) return;
    const periodKey = getPeriodKey(mission.period);
    
    // 🆕 Pastikan progress[mission.id] dan progress[mission.id][periodKey] ada
    if (!state.progress[mission.id]) state.progress[mission.id] = {};
    if (!state.progress[mission.id][periodKey]) {
      state.progress[mission.id][periodKey] = { progress: 0, isCompleted: false, isClaimed: false };
    }

    const currentProg = state.progress[mission.id][periodKey];
    if (currentProg.isCompleted) return;

    currentProg.progress += amount;
    if (currentProg.progress >= mission.target) {
      currentProg.progress = mission.target;
      currentProg.isCompleted = true;
    }
    hasChanges = true;
  });

  if (hasChanges) {
    localStorage.setItem("kanjiMaster.missions.v1", JSON.stringify(state));
    window.dispatchEvent(new Event("missionUpdated"));
  }
}

// Mengklaim hadiah misi (Async - Validasi di Server)
export async function claimReward(missionId: string) {
  const state = getMissionsState();
  if (!state) return false;

  const mission = MISSIONS.find(m => m.id === missionId);
  if (!mission) return false;

  const periodKey = getPeriodKey(mission.period);
  const currentProg = state.progress?.[missionId]?.[periodKey];

  // Validasi awal di client
  if (!currentProg || !currentProg.isCompleted || currentProg.isClaimed) {
    return false;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  try {
    const res = await fetch("/api/rewards/claim-mission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        missionId: mission.id,
        periodKey: periodKey,
        rewardExp: mission.rewardExp,
        rewardCoins: mission.rewardCoins,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Server error:", data.error);
      return false;
    }

    // Tandai sudah diklaim
    currentProg.isClaimed = true;
    localStorage.setItem("kanjiMaster.missions.v1", JSON.stringify(state));
    window.dispatchEvent(new Event("missionUpdated"));
    
    return true;
  } catch (err) {
    console.error("Fetch error:", err);
    return false;
  }
}