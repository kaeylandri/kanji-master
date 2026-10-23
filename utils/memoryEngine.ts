// utils/memoryEngine.ts
import { supabase } from "./supabase";

export type MemoryStatus = "new" | "learning" | "review" | "mastered";

export type MemoryRecord = {
  status: MemoryStatus;
  correctCount: number;
  incorrectCount: number;
  successfulReviewSessions: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  intervalDays: number;
};

type Rating = "forgot" | "hard" | "good" | "easy";

// Mendapatkan status memori dari localStorage (sebagai cache)
export function getMemoryState(): Record<string, MemoryRecord> {
  if (typeof window === "undefined") return {};
  return JSON.parse(localStorage.getItem("kanjiMaster.memorization.v1") || "{}");
}

// Simpan cache memori ke localStorage
function saveMemoryState(state: Record<string, MemoryRecord>) {
  localStorage.setItem("kanjiMaster.memorization.v1", JSON.stringify(state));
}

// 🆕 Fungsi Utama: Memperbarui status berdasarkan penilaian user (Server + Cache)
export async function updateMemory(id: number, type: "kotoba" | "kanji", rating: Rating) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const key = `${type}_${id}`;
  const now = new Date();
  
  // 1. Ambil rekaman sebelumnya dari cache (atau dari database jika perlu)
  const state = getMemoryState();
  let record: MemoryRecord = state[key] || {
    status: "new",
    correctCount: 0,
    incorrectCount: 0,
    successfulReviewSessions: 0,
    lastReviewedAt: null,
    nextReviewAt: null,
    intervalDays: 0,
  };

  record.lastReviewedAt = now.toISOString();

  // 2. Terapkan Aturan Spaced Repetition
  if (rating === "forgot") {
    record.incorrectCount += 1;
    record.status = "review";
    record.intervalDays = 0;
    record.nextReviewAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 Menit
  } else {
    record.correctCount += 1;
    record.successfulReviewSessions += 1;

    if (rating === "hard") {
      record.status = "learning";
      record.intervalDays = 1; // Besok
    } else if (rating === "good") {
      record.intervalDays = record.successfulReviewSessions >= 3 ? 7 : 3;
    } else { // easy
      record.intervalDays = record.successfulReviewSessions >= 3 ? 14 : 4;
    }

    record.status = record.successfulReviewSessions >= 3 && rating !== "hard" ? "mastered" : "learning";
    record.nextReviewAt = new Date(now.getTime() + record.intervalDays * 24 * 60 * 60 * 1000).toISOString();
  }

  // 3. Simpan ke Cache (Local)
  state[key] = record;
  saveMemoryState(state);

  // 4. 🆕 Simpan ke Database (Supabase)
  try {
    await supabase.from('user_progress').upsert({
      user_id: user.id,
      item_type: type,
      item_id: id,
      is_mastered: record.status === "mastered",
      ease_factor: record.intervalDays > 0 ? record.intervalDays : 2.5,
      interval_days: record.intervalDays,
      next_review_at: record.nextReviewAt,
      review_count: record.successfulReviewSessions,
      updated_at: now.toISOString(),
    }, {
      onConflict: 'user_id,item_type,item_id'
    });
  } catch (err) {
    console.error("Gagal simpan progress ke DB:", err);
  }

  return record;
}

// 🆕 Cek apakah item perlu direview (dibaca dari localStorage untuk performa cepat)
export function isDueForReview(id: number, type: "kotoba" | "kanji") {
  const state = getMemoryState();
  const key = `${type}_${id}`;
  
  if (!state[key]) return true; // Jika belum ada, anggap Baru (perlu dipelajari)
  
  const nextReview = new Date(state[key].nextReviewAt || 0);
  const now = new Date();
  
  return now >= nextReview;
}

// Status visual
export function getVisualStatus(id: number, type: "kotoba" | "kanji") {
  const state = getMemoryState();
  const key = `${type}_${id}`;
  const record = state[key];

  if (!record) return "new";
  
  if (record.status === "mastered" && isDueForReview(id, type)) return "review";
  if (record.status === "learning" && isDueForReview(id, type)) return "review";

  return record.status;
}