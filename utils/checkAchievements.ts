// utils/checkAchievements.ts
import { ACHIEVEMENTS_KANJI } from "@/data/achievements-kanji";
import { ACHIEVEMENTS_KOTOBA } from "@/data/achievements";
import { playAchievementSound } from "./sound";

// 🆕 Fungsi bantuan untuk memicu pop-up dengan pengaman
function triggerAchievement(id: string, type: "kanji" | "kotoba") {
  // 🆕 PENGAMAN 1: Cek apakah modal sudah ditampilkan di sesi ini
  const sessionKey = `achievement_shown_${id}`;
  if (sessionStorage.getItem(sessionKey)) {
    console.log(`Achievement ${id} sudah ditampilkan di sesi ini, skip.`);
    return;
  }

  // 🆕 PENGAMAN 2: Tandai sudah ditampilkan
  sessionStorage.setItem(sessionKey, "true");
  
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

  // Cek Achievement Progres (25, 100, 200, dll)
  ACHIEVEMENTS_KANJI.filter(a => a.type === "progress").forEach(ach => {
    if (!unlocked.includes(ach.id) && mastered.length >= (ach.targetCount || 0)) {
      unlocked.push(ach.id);
      newUnlocked = true;
      triggerAchievement(ach.id, "kanji");
    }
  });

  // Simpan jika ada yang baru
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