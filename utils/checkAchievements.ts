// utils/checkAchievements.ts
import { ACHIEVEMENTS_KANJI } from "@/data/achievements-kanji";
import { ACHIEVEMENTS_KOTOBA } from "@/data/achievements";
import { playAchievementSound } from "./sound";

function triggerAchievement(id: string, type: "kanji" | "kotoba") {
  const shownKey = `achievement_shown_permanent_${id}`;
  if (localStorage.getItem(shownKey)) {
    return; 
  }
  localStorage.setItem(shownKey, "true");

  const lastShown = localStorage.getItem(`last_achievement_time`);
  const now = Date.now();
  if (lastShown && now - parseInt(lastShown) < 60 * 60 * 1000) {
    return;
  }
  localStorage.setItem(`last_achievement_time`, now.toString());
  
  playAchievementSound();
  const event = new CustomEvent("show-achievement", { detail: { id, type } });
  window.dispatchEvent(event);
}

export function checkKanjiAchievements() {
  if (typeof window === "undefined") return;

  const masteredRaw = localStorage.getItem("masteredKanji");
  if (!masteredRaw) return;

  const mastered = JSON.parse(masteredRaw);
  if (!Array.isArray(mastered) || mastered.length === 0) return;

  const stats = JSON.parse(localStorage.getItem("kanjiAchievements") || "{}");
  const unlocked = stats.unlocked || [];
  let newUnlocked = false;

  ACHIEVEMENTS_KANJI.filter(a => a.type === "progress").forEach(ach => {
    if (ach.targetCount && !unlocked.includes(ach.id) && mastered.length >= ach.targetCount) {
      unlocked.push(ach.id);
      newUnlocked = true;
      triggerAchievement(ach.id, "kanji");
    }
  });

  if (newUnlocked) {
    localStorage.setItem("kanjiAchievements", JSON.stringify({ ...stats, unlocked }));
  }
}

export async function checkKotobaAchievements() {
  if (typeof window === "undefined") return;

  const uniqueAnswered = JSON.parse(localStorage.getItem("uniqueKotobaAnswered") || "[]");
  if (uniqueAnswered.length === 0) return;

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