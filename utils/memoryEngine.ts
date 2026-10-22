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

const STORAGE_KEY = "kanjiMaster.memorization.v1";

// Mendapatkan semua data memori
export function getMemoryState(): Record<string, MemoryRecord> {
  if (typeof window === "undefined") return {};
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
}

// Simpan data memori
function saveMemoryState(state: Record<string, MemoryRecord>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Fungsi Utama: Memperbarui status berdasarkan penilaian user
export function updateMemory(id: number, type: "kotoba" | "kanji", rating: Rating) {
  const state = getMemoryState();
  const key = `${type}_${id}`;
  const now = new Date();
  
  // 1. Ambil rekaman sebelumnya atau buat baru
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

  // 2. Terapkan Aturan (Sesuai Spesifikasi)
  if (rating === "forgot") {
    // Lupa Total
    record.incorrectCount += 1;
    record.status = "review";
    record.intervalDays = 0;
    record.nextReviewAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 Menit
  } else {
    // Ingat (Hard, Good, Easy)
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

    // Cek apakah sudah memenuhi kriteria Dikuasai
    record.status =
      record.successfulReviewSessions >= 3 && rating !== "hard"
        ? "mastered"
        : "learning";

    record.nextReviewAt = new Date(
      now.getTime() + record.intervalDays * 24 * 60 * 60 * 1000
    ).toISOString();
  }

  // 3. Simpan
  state[key] = record;
  saveMemoryState(state);
  return record;
}

// Cek apakah sudah jatuh tempo
export function isDueForReview(id: number, type: "kotoba" | "kanji") {
  const state = getMemoryState();
  const key = `${type}_${id}`;
  
  if (!state[key]) return true; // Jika belum ada, anggap Baru (perlu dipelajari)
  
  const nextReview = new Date(state[key].nextReviewAt || 0);
  const now = new Date();
  
  return now >= nextReview;
}

// 🆕 Fungsi untuk mendapatkan status visual (sudah jatuh tempo atau belum)
export function getVisualStatus(id: number, type: "kotoba" | "kanji") {
  const state = getMemoryState();
  const key = `${type}_${id}`;
  const record = state[key];

  if (!record) return "new";
  
  // Jika statusnya "mastered" tapi sudah jatuh tempo, ubah visualnya jadi "review"
  if (record.status === "mastered" && isDueForReview(id, type)) {
    return "review";
  }
  
  // Jika statusnya "learning" dan jatuh tempo
  if (record.status === "learning" && isDueForReview(id, type)) {
    return "review";
  }

  return record.status;
}