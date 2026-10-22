import { MissionDefinition } from "./types";

export const MISSIONS: MissionDefinition[] = [
  // ===== DAILY =====
  { id: "daily_kanji_5", period: "daily", title: "Langkah Pertama", description: "Jawab 5 Kanji dengan benar.", target: 5, rewardExp: 20, rewardCoins: 5, eventType: "kanji_correct" },
  { id: "daily_kotoba_5", period: "daily", title: "Penjelajah Kata", description: "Hafalkan 5 Kotoba baru.", target: 5, rewardExp: 25, rewardCoins: 5, eventType: "kotoba_correct" },
  { id: "daily_practice", period: "daily", title: "Ingatan Tajam", description: "Selesaikan 1 sesi latihan tanpa intip jawaban.", target: 1, rewardExp: 35, rewardCoins: 10, eventType: "session_perfect" },

  // ===== WEEKLY =====
  { id: "weekly_practice_5", period: "weekly", title: "The Scholar", description: "Selesaikan 5 sesi latihan Kanji.", target: 5, rewardExp: 100, rewardCoins: 30, eventType: "session_complete" },
  { id: "weekly_kanji_25", period: "weekly", title: "Memory Keeper", description: "Kuasai 25 Kanji baru.", target: 25, rewardExp: 150, rewardCoins: 40, eventType: "kanji_correct" },
  { id: "weekly_exam_2", period: "weekly", title: "Exam Challenger", description: "Selesaikan 2 ujian dengan nilai minimal 80.", target: 2, rewardExp: 150, rewardCoins: 40, eventType: "exam_high_score" },
];