// utils/streakEngine.ts

export type ClaimedReward = {
  milestoneDays: number;
  claimedAt: string;
};

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // Format: YYYY-MM-DD
  claimedRewards: ClaimedReward[];
};

export const MILESTONES = [
  { days: 3, exp: 30, coins: 10, label: "Pemula Konsisten" },
  { days: 7, exp: 75, coins: 25, label: "Pejuang Hafalan" },
  { days: 14, exp: 150, coins: 50, label: "Disiplin Belajar" },
  { days: 30, exp: 350, coins: 120, label: "Master Konsistensi" },
  { days: 60, exp: 700, coins: 250, label: "Legenda Kanji" },
  { days: 100, exp: 1500, coins: 500, label: "Grandmaster Streak" },
];

const STREAK_KEY = "kanjiMaster.streak.v1";

// 🆕 Format tanggal menggunakan WIB (Asia/Jakarta)
function getJakartaDate(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function shiftDate(dateKey: string, amount: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function getStreakData(): StreakData {
  if (typeof window === "undefined") {
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: null, claimedRewards: [] };
  }
  const saved = localStorage.getItem(STREAK_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return { currentStreak: 0, longestStreak: 0, lastActiveDate: null, claimedRewards: [] };
}

function saveStreakData(data: StreakData) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("streakUpdated"));
}

// 🆕 Fungsi Utama: Hanya picu api jika ini aktivitas pertama hari ini
export function triggerFireAnimationIfNewDay() {
  if (typeof window === "undefined") return;

  const data = getStreakData();
  const today = getJakartaDate();
  
  // 🆕 PENGAMAN UTAMA: Jika tanggal terakhir aktif sama dengan hari ini, BATALKAN.
  // Ini mencegah api menyala lebih dari sekali sehari.
  if (data.lastActiveDate === today) {
    return;
  }

  // Hitung streak baru
  // Jika lastActiveDate adalah kemarin, tambah streak. Jika tidak (bolong), reset ke 1.
  const isConsecutive = data.lastActiveDate === shiftDate(today, -1);
  const newStreak = isConsecutive ? data.currentStreak + 1 : 1;

  const newData: StreakData = {
    ...data,
    currentStreak: newStreak,
    longestStreak: Math.max(data.longestStreak, newStreak),
    lastActiveDate: today,
  };

  saveStreakData(newData);

  // Picu animasi api
  const event = new CustomEvent("fire-ignition");
  window.dispatchEvent(event);

  // Picu pengecekan milestone
  const milestone = MILESTONES.find((m) => m.days === newStreak);
  if (milestone && !newData.claimedRewards.some(r => r.milestoneDays === newStreak)) {
    window.dispatchEvent(new CustomEvent("show-streak-reward", { detail: milestone }));
  }
}

// Fungsi untuk mengklaim hadiah
export function claimMilestoneReward(days: number) {
  const data = getStreakData();
  
  if (data.claimedRewards.some((r) => r.milestoneDays === days)) return false;

  const milestone = MILESTONES.find((m) => m.days === days);
  if (!milestone) return false;

  data.claimedRewards.push({
    milestoneDays: days,
    claimedAt: new Date().toISOString(),
  });

  saveStreakData(data);

  import("./missionEngine").then(({ addReward }) => {
    if (typeof addReward === "function") {
      addReward(milestone.exp, milestone.coins);
    }
  });

  return true;
}