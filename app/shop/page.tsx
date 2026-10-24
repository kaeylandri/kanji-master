// app/shop/page.tsx
"use client";

import { useEffect, useState } from "react";
import { SHOP_ITEMS } from "@/data/shop-items";
import { getMissionsState } from "@/utils/missionEngine";
import { triggerToast } from "@/utils/toast";
import { getInventory } from "@/utils/luckyEngine";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/utils/supabase";

export default function SakuraShopPage() {
  const [coins, setCoins] = useState(0);
  const [equipped, setEquipped] = useState<Record<string, string>>({});
  const [ownedCosmetics, setOwnedCosmetics] = useState<string[]>([]);
  const [consumableInv, setConsumableInv] = useState<any>({});
  const [isBuying, setIsBuying] = useState<string | null>(null); // 🆕 State untuk mencegah double click

  const loadData = () => {
    const ms = getMissionsState();
    if (ms) setCoins(ms.coins);

    try {
      const eq = JSON.parse(localStorage.getItem("shopEquipped") || "{}");
      setEquipped(eq);

      const owned = JSON.parse(localStorage.getItem("shopInventory") || "[]");
      setOwnedCosmetics(owned);

      setConsumableInv(getInventory());
    } catch (e) {}
  };

  useEffect(() => {
    loadData();
    window.addEventListener("inventoryUpdated", loadData);
    window.addEventListener("missionUpdated", loadData); // 🆕 Pantau perubahan koin
    return () => {
      window.removeEventListener("inventoryUpdated", loadData);
      window.removeEventListener("missionUpdated", loadData);
    };
  }, []);

  const handleBuy = async (item: any) => {
    if (isBuying) return; // Cegah klik ganda

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return triggerToast("Login dulu!", "error");

    if (coins < item.price) {
      return triggerToast("Koin Sakura tidak cukup! 🌸", "error");
    }

    const itemKey = item.id.replace("item_", "");
    const isConsumable = item.category === "consumable";

    // 🆕 SIMPAN STATE LAMA (Untuk rollback jika API gagal)
    const oldCoins = coins;
    const oldConsumableInv = { ...consumableInv };
    const oldOwnedCosmetics = [...ownedCosmetics];

    // 🆕 OPTIMISTIC UI: Langsung kurangi koin dan tambah item seketika
    setCoins(oldCoins - item.price);
    setIsBuying(item.id);

    // Update localStorage untuk koin
    const ms = getMissionsState();
    if (ms) {
      ms.coins = oldCoins - item.price;
      localStorage.setItem("kanjiMaster.missions.v1", JSON.stringify(ms));
    }

    if (isConsumable) {
      // Update Inventory Consumable
      const newInv = { ...oldConsumableInv };
      newInv[itemKey] = (newInv[itemKey] || 0) + 1;
      setConsumableInv(newInv);
      localStorage.setItem("kanjiMaster.inventory.v1", JSON.stringify(newInv));
    } else {
      // Update Cosmetics
      const newOwned = [...oldOwnedCosmetics, item.id];
      setOwnedCosmetics(newOwned);
      localStorage.setItem("shopInventory", JSON.stringify(newOwned));
    }

    // Dispatch event agar Header & Halaman lain terupdate
    window.dispatchEvent(new Event("missionUpdated"));
    window.dispatchEvent(new Event("inventoryUpdated"));

    triggerToast(`Berhasil membeli ${item.name}!`, "success");

    // 🆕 PROSES API DI BELAKANG LAYAR
    try {
      const res = await fetch("/api/shop/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          itemId: item.id,
          price: item.price,
          itemType: item.category,
          itemKey: itemKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal membeli");
      }

      // Sinkronisasi ulang dari database jika perlu (opsional)
      // loadData(); 

    } catch (err: any) {
      console.error("Purchase Error:", err);
      triggerToast(err.message || "Kesalahan jaringan.", "error");
      
      // 🆕 ROLLBACK: Kembalikan semua state jika gagal
      setCoins(oldCoins);
      setConsumableInv(oldConsumableInv);
      setOwnedCosmetics(oldOwnedCosmetics);
      
      const rollbackMs = getMissionsState();
      if (rollbackMs) {
        rollbackMs.coins = oldCoins;
        localStorage.setItem("kanjiMaster.missions.v1", JSON.stringify(rollbackMs));
      }
      
      localStorage.setItem("kanjiMaster.inventory.v1", JSON.stringify(oldConsumableInv));
      localStorage.setItem("shopInventory", JSON.stringify(oldOwnedCosmetics));

      window.dispatchEvent(new Event("missionUpdated"));
      window.dispatchEvent(new Event("inventoryUpdated"));
    } finally {
      setIsBuying(null);
    }
  };

  const handleEquip = (item: any) => {
    const newEq = { ...equipped, [item.category]: item.id };
    setEquipped(newEq);
    localStorage.setItem("shopEquipped", JSON.stringify(newEq));
    triggerToast(`${item.name} berhasil dipasang!`, "success");
  };

  const handleUnequip = (category: string) => {
    const newEq = { ...equipped };
    delete newEq[category];
    setEquipped(newEq);
    localStorage.setItem("shopEquipped", JSON.stringify(newEq));
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        
        {/* Header Toko & Koin */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center sm:justify-start gap-3">
              🌸 Sakura Shop
            </h1>
            <p className="text-slate-500">Tukarkan Koin Sakura-mu dengan kosmetik atau item spesial.</p>
          </div>
          <div className="bg-white border-2 border-pink-200 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-sm w-full sm:w-auto justify-center">
            <span className="text-3xl">🌸</span>
            <div>
              <div className="text-xs text-slate-400 uppercase font-bold">Koin Sakura</div>
              <div className="text-2xl font-bold text-pink-500">{coins}</div>
            </div>
          </div>
        </div>

        {/* Grid Item Toko */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {SHOP_ITEMS.map((item) => {
            const isConsumable = item.category === "consumable";
            const itemKey = item.id.replace("item_", "");
            const ownedCount = consumableInv[itemKey] || 0;
            const isMaxed = isConsumable && item.maxPurchase && ownedCount >= item.maxPurchase;
            
            const isOwned = !isConsumable && ownedCosmetics.includes(item.id);
            const isEquipped = !isConsumable && equipped[item.category] === item.id;
            const isItemBuying = isBuying === item.id;

            return (
              <div key={item.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
                <div className={`h-32 flex items-center justify-center text-6xl border-b border-slate-100 ${item.cssClass}`}>
                  {item.preview}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg text-slate-800">{item.name}</h3>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full capitalize">{isConsumable ? "Item" : item.category}</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">{item.description}</p>
                  
                  <div className="mt-auto">
                    {isConsumable ? (
                      <div className="space-y-2">
                        <div className="text-xs text-slate-500 text-center font-bold">
                          Dimiliki: {ownedCount} / {item.maxPurchase || "∞"}
                        </div>
                        <button
                          onClick={() => handleBuy(item)}
                          disabled={isMaxed || coins < item.price || isItemBuying}
                          className={`w-full font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 ${
                            isMaxed 
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                              : coins < item.price
                              ? "bg-blue-400/50 text-white cursor-not-allowed opacity-70"
                              : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md active:scale-95"
                          }`}
                        >
                          {isMaxed ? "Maksimal" : isItemBuying ? "Memproses..." : <>Beli <span className="text-white font-extrabold">{item.price} 🌸</span></>}
                        </button>
                      </div>
                    ) : (
                      <>
                        {!isOwned ? (
                          <button
                            onClick={() => handleBuy(item)}
                            disabled={coins < item.price || isItemBuying}
                            className={`w-full font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 active:scale-95 ${
                              coins < item.price
                                ? "bg-blue-400/50 text-white cursor-not-allowed opacity-70"
                                : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md"
                            }`}
                          >
                            {isItemBuying ? "Memproses..." : <>Beli <span className="text-white font-extrabold">{item.price} 🌸</span></>}
                          </button>
                        ) : isEquipped ? (
                          <button
                            onClick={() => handleUnequip(item.category)}
                            className="w-full bg-rose-50 text-rose-500 border border-rose-200 hover:bg-rose-100 font-bold py-3 rounded-xl transition active:scale-95"
                          >
                            Lepas
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEquip(item)}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition active:scale-95"
                          >
                            Pasang
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}