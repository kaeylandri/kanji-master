// utils/checkAchievements.ts
import { ACHIEVEMENTS_KANJI } from "@/data/achievements-kanji";
import { ACHIEVEMENTS_KOTOBA } from "@/data/achievements";
import { playAchievementSound } from "./sound";

// 🆕 Fungsi bantuan dengan pengaman BERLAPIS
function triggerAchievement(id: string, type: "kanji" | "kotoba") {
  // PENGAMAN 1: Cek apakah sudah ada di localStorage (permanen)
  const shownKey = `achievement_shown_permanent_${id}`;
  if (localStorage.getItem(shownKey)) {
    return; 
  }
  localStorage.setItem(shownKey, "true");

  // PENGAMAN 2: Cek cooldown 1 jam (mencegah spam saat testing)
  const lastShown = localStorage.getItem(`last_achievement_time`);
  const now = Date.now();
  if (lastShown && now - parseInt(lastShown) < 60 * 60 * 1000) {
    console.log("Achievement cooldown aktif, skip.");
    return;
  }
  localStorage.setItem(`last_achievement_time`, now.toString());
  
  playAchievementSound();
  const event = new CustomEvent("show-achievement", { detail: { id, type } });
  window.dispatchEvent(event);
}

// ==========================================
// 1. CEK ACHIEVEMENT KANJI
// ==========================================
export function checkKanjiAchievements() {
  if (typeof window === "undefined") return;

  const mastered = JSON.parse(localStorage.getItem("masteredKanji") || "[]");
  const stats = JSON.parse(localStorage.getItem("kanjiAchievements") || "{}");
  const unlocked = stats.unlocked || [];
  let newUnlocked = false;

  ACHIEVEMENTS_KANJI.filter(a => a.type === "progress").forEach(ach => {
    // 🆕 PENGAMAN: Cek apakah sudah ada di array unlocked
    if (!unlocked.includes(ach.id) && mastered.length >= (ach.targetCount || 0)) {
      unlocked.push(ach.id);
      newUnlocked = true;
      triggerAchievement(ach.id, "kanji");
    }
  });

  if (newUnlocked) {
    localStorage.setItem("kanjiAchievements", JSON.stringify({ ...stats, unlocked }));
  }
}

// ==========================================
// 2. CEK ACHIEVEMENT KOTOBA
// ==========================================
export async function checkKotobaAchievements() {
  if (typeof window === "undefined") return;

  const uniqueAnswered = JSON.parse(localStorage.getItem("uniqueKotobaAnswered") || "[]");
  const stats = JSON.parse(localStorage.getItem("kotobaExamStats") || "{}");
  const unlocked = stats.unlocked || [];
  let newUnlocked = false;

  try {
    const res = await fetch("/api/kotoba/semua");
    const kotobaList = await res.json();

    const categoryAchievements = ACHIEVEMENTS_KOTOBA.filter(a => a.type === "category");

    categoryAchievements.forEach(ach => {
      const kotobaInCat = kotobaList.filter((k: any) => k.category === ach.categoryTarget);
      const masteredInCat = kotobaInCat.filter((k: any) => uniqueAnswered.includes(k.id)).length;

      if (masteredInCat >= (ach.targetCount || 0) && !unlocked.includes(ach.id)) {
        unlocked.push(ach.id);
        newUnlocked = true;
        triggerAchievement(ach.id, "kotoba");
      }
    });

    if (newUnlocked) {
      localStorage.setItem("kotobaExamStats", JSON.stringify({ ...stats, unlocked }));
    }
  } catch (e) {
    console.error("Gagal mengecek achievement kotoba", e);
  }
}