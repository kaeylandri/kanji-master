// app/shop/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SHOP_ITEMS } from "@/data/shop-items"; // Sesuaikan path jika beda
import { getMissionsState } from "@/utils/missionEngine";
import { getInventory, addInventoryItem } from "@/utils/luckyEngine";
import { triggerToast } from "@/utils/toast";
import { supabase } from "@/utils/supabase";
import AppLayout from "@/components/AppLayout";

export default function ShopPage() {
  const [coins, setCoins] = useState(0);
  const [inventory, setInventory] = useState<any>({});
  const [isBuying, setIsBuying] = useState<string | null>(null);

  const loadData = () => {
    const missions = getMissionsState();
    setCoins(missions?.coins || 0);
    setInventory(getInventory());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("missionUpdated", loadData);
    window.addEventListener("inventoryUpdated", loadData);
    return () => {
      window.removeEventListener("missionUpdated", loadData);
      window.removeEventListener("inventoryUpdated", loadData);
    };
  }, []);

  const handleBuy = async (item: any) => {
    if (isBuying) return; // Cegah double click
    
    // Cek saldo
    if (coins < item.price) {
      return triggerToast("Koin Sakura tidak cukup! 🌸", "error");
    }

    // 🆕 1. SIMPAN STATE LAMA (Untuk rollback jika gagal)
    const oldCoins = coins;
    const oldInventory = { ...inventory };
    const itemTypeKey = item.type === "freeze" ? "freeze" : item.type === "hint" ? "hint" : "reveal";

    // 🆕 2. OPTIMISTIC UI (Langsung ubah tampilan seketika)
    setCoins(oldCoins - item.price);
    
    // Update localStorage seketika agar UI lain ikut berubah
    const currentMissions = getMissionsState();
    if (currentMissions) {
      currentMissions.coins = oldCoins - item.price;
      localStorage.setItem("kanjiMaster.missions.v1", JSON.stringify(currentMissions));
    }

    // Update Inventory lokal
    const currentInv = getInventory();
    currentInv[itemTypeKey] = (currentInv[itemTypeKey] || 0) + 1;
    localStorage.setItem("kanjiMaster.inventory.v1", JSON.stringify(currentInv));
    setInventory(currentInv);

    // Dispatch event agar Header (saldo koin & item) langsung berubah
    window.dispatchEvent(new Event("missionUpdated"));
    window.dispatchEvent(new Event("inventoryUpdated"));

    triggerToast(`Berhasil membeli ${item.name}!`, "success");
    setIsBuying(item.id);

    // 🆕 3. PROSES API DI BELAKANG LAYAR
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User tidak ditemukan");

      const res = await fetch("/api/shop/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          itemId: item.id,
          itemType: itemTypeKey,
          price: item.price,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 🆕 JIKA GAGAL: Kembalikan state seperti semula
        throw new Error(data.error || "Gagal membeli item");
      }

      // Sinkronisasi data dari server (opsional, untuk memastikan DB & Local sama)
      // window.location.reload(); // Bisa dipakai jika data sering tidak sinkron

    } catch (err: any) {
      console.error("Purchase Error:", err);
      triggerToast(err.message || "Gagal memproses pembelian", "error");
      
      // 🆕 ROLLBACK: Kembalikan koin & inventory jika API gagal
      setCoins(oldCoins);
      setInventory(oldInventory);
      
      const rollbackMissions = getMissionsState();
      if (rollbackMissions) {
        rollbackMissions.coins = oldCoins;
        localStorage.setItem("kanjiMaster.missions.v1", JSON.stringify(rollbackMissions));
      }
      
      const rollbackInv = { ...oldInventory };
      localStorage.setItem("kanjiMaster.inventory.v1", JSON.stringify(rollbackInv));

      window.dispatchEvent(new Event("missionUpdated"));
      window.dispatchEvent(new Event("inventoryUpdated"));
    } finally {
      setIsBuying(null);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="text-5xl mb-3">🌸</div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Sakura Shop</h1>
          <p className="text-slate-500">Tukar koin sakura dengan item bermanfaat!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SHOP_ITEMS.map((item) => {
            const itemTypeKey = item.type === "freeze" ? "freeze" : item.type === "hint" ? "hint" : "reveal";
            const ownedCount = inventory[itemTypeKey] || 0;
            const maxCount = item.type === "freeze" ? 5 : item.type === "hint" ? 3 : Infinity; // Sesuaikan limit dengan kebutuhan
            const isMaxed = ownedCount >= maxCount;

            return (
              <div key={item.id} className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm">
                {/* Konten UI sama seperti sebelumnya */}
                <div className={`text-4xl mb-2`}>{item.icon}</div>
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{item.description}</p>
                <div className="text-center mb-2">
                  <span className="text-sm text-slate-500">Dimiliki: {ownedCount} / {maxCount === Infinity ? "∞" : maxCount}</span>
                </div>
                <button
                  onClick={() => handleBuy(item)}
                  disabled={isMaxed || coins < item.price || isBuying === item.id}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold py-3 rounded-xl transition shadow-md active:scale-95"
                >
                  {isMaxed ? "Maksimal" : `Beli ${item.price} 🌸`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}