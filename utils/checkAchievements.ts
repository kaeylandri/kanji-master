import { ACHIEVEMENTS_KANJI } from "@/data/achievements-kanji";
import { ACHIEVEMENTS_KOTOBA } from "@/data/achievements";
import { playAchievementSound } from "./sound";

// Fungsi bantuan untuk memicu pop-up
function triggerAchievement(id: string, type: "kanji" | "kotoba") {
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

  // Kita butuh data Kotoba untuk mengecek kategori
  try {
    const res = await fetch("/api/kotoba/semua");
    const kotobaList = await res.json();

    // Cek Achievement Kategori (Aisatsu Masutā, Kazoku no Kizuna, dll)
    const categoryAchievements = ACHIEVEMENTS_KOTOBA.filter(a => a.type === "category");

    categoryAchievements.forEach(ach => {
      // Hitung berapa kotoba di kategori ini yang sudah dijawab benar
      const kotobaInCat = kotobaList.filter((k: any) => k.category === ach.categoryTarget);
      const masteredInCat = kotobaInCat.filter((k: any) => uniqueAnswered.includes(k.id)).length;

      // Jika memenuhi target dan belum pernah diklaim
      if (masteredInCat >= (ach.targetCount || 0) && !unlocked.includes(ach.id)) {
        unlocked.push(ach.id);
        newUnlocked = true;
        triggerAchievement(ach.id, "kotoba");
      }
    });

    // Simpan jika ada yang baru
    if (newUnlocked) {
      localStorage.setItem("kotobaExamStats", JSON.stringify({ ...stats, unlocked }));
    }
  } catch (e) {
    console.error("Gagal mengecek achievement kotoba", e);
  }
}