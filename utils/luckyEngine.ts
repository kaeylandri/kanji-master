// utils/luckyEngine.ts

// ==========================================
// TIPE DATA
// ==========================================
export type LuckyData = {
  luckyDate: string;
  multiplier: number;
  nextResetDate: string;
};

export type InventoryData = {
  freeze: number;
  hint: number;
  reveal: number;
};

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  claimedRewards: { milestoneDays: number; claimedAt: string }[];
};

// ==========================================
// KONSTANTA & KEY
// ==========================================
const LUCKY_KEY = "kanjiMaster.luckyDay.v1";
const INVENTORY_KEY = "kanjiMaster.inventory.v1";
const STREAK_KEY = "kanjiMaster.streak.v1";

// ==========================================
// HELPER WAKTU (WIB)
// ==========================================
export function getJakartaDate(date: Date = new Date()): string {
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

function getFutureDate(days: number): string {
  const now = new Date();
  const offset = 7 * 60;
  const localDate = new Date(now.getTime() + (offset + now.getTimezoneOffset()) * 60000);
  localDate.setDate(localDate.getDate() + days);
  return localDate.toISOString().split("T")[0];
}

// ==========================================
// LUCKY DAY (Hari Keberuntungan)
// ==========================================
export function getLuckyDayData(): LuckyData {
  if (typeof window === "undefined") return { luckyDate: "", multiplier: 5, nextResetDate: "" };

  const saved = localStorage.getItem(LUCKY_KEY);
  const today = getJakartaDate();

  if (saved) {
    const data: LuckyData = JSON.parse(saved);
    // Jika hari ini belum melewati tanggal reset, kembalikan data yang ada
    if (today < data.nextResetDate) {
      return data;
    }
  }

  // Reset 2 minggu sekali
  const randomDaysFromNow = Math.floor(Math.random() * 13) + 1; // 1 - 14 hari
  const luckyDate = getFutureDate(randomDaysFromNow);
  const multiplier = Math.floor(Math.random() * 3) + 5; // 5, 6, atau 7
  const nextResetDate = getFutureDate(14);

  const newData: LuckyData = { luckyDate, multiplier, nextResetDate };
  localStorage.setItem(LUCKY_KEY, JSON.stringify(newData));
  return newData;
}

export function isTodayLuckyDay(): boolean {
  const data = getLuckyDayData();
  return data.luckyDate === getJakartaDate();
}

export function getCurrentMultiplier(): number {
  const data = getLuckyDayData();
  if (data.luckyDate === getJakartaDate()) {
    return data.multiplier;
  }
  return 1;
}

// ==========================================
// INVENTORY (Item Shop)
// ==========================================
export function getInventory(): InventoryData {
  if (typeof window === "undefined") return { freeze: 0, hint: 0, reveal: 0 };
  
  const saved = localStorage.getItem(INVENTORY_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return { freeze: 0, hint: 0, reveal: 0 };
}

export function useItem(itemType: keyof InventoryData): boolean {
  const inv = getInventory();
  if (inv[itemType] > 0) {
    inv[itemType] -= 1;
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
    window.dispatchEvent(new Event("inventoryUpdated"));
    return true;
  }
  return false;
}

// ==========================================
// STREAK & FREEZE LOGIC
// ==========================================
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

export function triggerFireAnimationIfNewDay() {
  if (typeof window === "undefined") return;

  const data = getStreakData();
  const today = getJakartaDate();
  
  // Jika sudah belajar hari ini, jangan panggil api
  if (data.lastActiveDate === today) return;

  const isConsecutive = data.lastActiveDate === shiftDate(today, -1);
  
  // Cek jika bolos (bukan hari ini, bukan kemarin) DAN punya item Freeze
  const isMissedDay = data.lastActiveDate !== null && !isConsecutive;
  const inv = getInventory();
  
  if (isMissedDay && inv.freeze > 0) {
    // Pakai Freeze Streak!
    useItem("freeze");
    
    // Lanjutkan streak seolah-olah tidak bolos
    const newStreak = data.currentStreak + 1;
    const newData = {
      ...data,
      currentStreak: newStreak,
      longestStreak: Math.max(data.longestStreak, newStreak),
      lastActiveDate: today,
    };
    saveStreakData(newData);
    
    // Notifikasi Toast
    window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: "❄️ Freeze Streak Aktif! Apimu tidak padam.", type: "success" } }));
    return;
  }

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
}

// ==========================================
// 🆕 CEK STREAK KEDALUWARSA (API PADAM)
// ==========================================
export function checkStreakExpiry() {
  if (typeof window === "undefined") return;

  const data = getStreakData();
  if (data.currentStreak === 0 || !data.lastActiveDate) return; // Jika streak 0, tidak perlu dicek

  const today = getJakartaDate();
  const yesterday = shiftDate(today, -1);

  // Jika lastActiveDate BUKAN hari ini dan BUKAN kemarin, berarti user bolos > 24 jam
  if (data.lastActiveDate !== today && data.lastActiveDate !== yesterday) {
    // Cek apakah punya item Freeze
    const inv = getInventory();
    
    if (inv.freeze > 0) {
      // Gunakan Freeze Streak otomatis!
      useItem("freeze");
      
      // Anggap saja user aktif hari ini (menyelamatkan streak)
      const newData = {
        ...data,
        lastActiveDate: today,
      };
      saveStreakData(newData);
      
      window.dispatchEvent(new CustomEvent("show-toast", { 
        detail: { message: "❄️ Freeze Streak Otomatis Aktif! Apimu diselamatkan.", type: "success" } 
      }));
    } else {
      // API PADAM TOTAL (RESET KE 0)
      const resetData: StreakData = {
        ...data,
        currentStreak: 0,
        lastActiveDate: null, // Reset tanggal aktif
      };
      
      saveStreakData(resetData);
      
      window.dispatchEvent(new CustomEvent("show-toast", { 
        detail: { message: "🥶 Apimu padam karena tidak dinyalakan selama 24 jam. Streak kembali ke 0.", type: "error" } 
      }));
    }
  }
}