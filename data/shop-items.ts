export type ShopItem = {
  id: string;
  name: string;
  description: string;
  category: "frame" | "theme" | "title" | "consumable"; // 🆕 Tambah consumable
  price: number;
  preview: string;
  cssClass: string;
  maxPurchase?: number; // 🆕 Batas maksimal pembelian
  effectValue?: number; // 🆕 Nilai efek (misal: +3 intip, 170 detik)
};

export const SHOP_ITEMS: ShopItem[] = [
  // === FRAMES ===
  { id: "frame_azure", name: "Azure Frame", description: "Bingkai Profil Biru", category: "frame", price: 100, preview: "🛡️", cssClass: "bg-blue-900 border-blue-500 text-blue-200" },
  { id: "frame_emerald", name: "Emerald Frame", description: "Bingkai Profil Hijau", category: "frame", price: 150, preview: "🍃", cssClass: "bg-emerald-900 border-emerald-500 text-emerald-200" },
  
  // === THEMES ===
  { id: "theme_moonlight", name: "Moonlight Theme", description: "Latar belakang profil ungu gelap", category: "theme", price: 300, preview: "🌙", cssClass: "bg-indigo-950 border-indigo-700 text-indigo-200" },

  // === TITLES ===
  { id: "title_scholar", name: "Scholar Title", description: "Gelar 'The Scholar' di profil", category: "title", price: 250, preview: "👑", cssClass: "bg-amber-900 border-amber-600 text-amber-200" },

  // === 🆕 CONSUMABLES (Item Sekali Pakai) ===
  { id: "item_freeze", name: "Freeze Streak", description: "Lindungi apimu dari padam saat bolos 1 hari.", category: "consumable", price: 200, preview: "❄️", cssClass: "bg-cyan-100 border-cyan-300 text-cyan-800", maxPurchase: 5, effectValue: 1 },
  { id: "item_hint", name: "Intip Jawaban", description: "Tambah jatah intip jawaban di latihan.", category: "consumable", price: 150, preview: "💡", cssClass: "bg-yellow-100 border-yellow-300 text-yellow-800", maxPurchase: 3, effectValue: 1 },
  { id: "item_reveal", name: "Full Reveal (2:50)", description: "Buka semua jawaban otomatis selama 2 menit 50 detik.", category: "consumable", price: 500, preview: "🪄", cssClass: "bg-purple-100 border-purple-300 text-purple-800", effectValue: 170 },
];