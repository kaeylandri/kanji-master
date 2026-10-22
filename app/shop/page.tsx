// app/shop/page.tsx
"use client";

import { useEffect, useState } from "react";
import { SHOP_ITEMS } from "@/data/shop-items";
import { getMissionsState } from "@/utils/missionEngine";
import { triggerToast } from "@/utils/toast";
import { getInventory } from "@/utils/luckyEngine";
import AppLayout from "@/components/AppLayout"; // Cukup AppLayout saja

export default function SakuraShopPage() {
  const [coins, setCoins] = useState(0);
  const [equipped, setEquipped] = useState<Record<string, string>>({});
  const [ownedCosmetics, setOwnedCosmetics] = useState<string[]>([]);
  const [consumableInv, setConsumableInv] = useState<any>({});

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
    return () => window.removeEventListener("inventoryUpdated", loadData);
  }, []);

  const handleBuy = (item: any) => {
    if (coins < item.price) {
      triggerToast("Koin Sakura kamu tidak cukup!", "error");
      return;
    }

    // Cek Max Purchase untuk Konsumabel
    if (item.category === "consumable") {
      const itemKey = item.id.replace("item_", "");
      const currentCount = consumableInv[itemKey] || 0;
      if (item.maxPurchase && currentCount >= item.maxPurchase) {
        triggerToast(`Maksimal pembelian ${item.name} adalah ${item.maxPurchase}!`, "error");
        return;
      }
    }

    // Kurangi koin
    const ms = getMissionsState();
    if (ms) {
      ms.coins -= item.price;
      localStorage.setItem("kanjiMaster.missions.v1", JSON.stringify(ms));
      setCoins(ms.coins);
    }

    // Proses Item
    if (item.category === "consumable") {
      const itemKey = item.id.replace("item_", "");
      const newInv = { ...consumableInv, [itemKey]: (consumableInv[itemKey] || 0) + 1 };
      localStorage.setItem("kanjiMaster.inventory.v1", JSON.stringify(newInv));
      setConsumableInv(newInv);
      triggerToast(`Berhasil membeli ${item.name}!`, "success");
      window.dispatchEvent(new Event("missionUpdated"));
    } else {
      const newOwned = [...ownedCosmetics, item.id];
      localStorage.setItem("shopInventory", JSON.stringify(newOwned));
      setOwnedCosmetics(newOwned);
      triggerToast(`Berhasil membeli ${item.name}!`, "success");
      window.dispatchEvent(new Event("missionUpdated"));
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
                          disabled={isMaxed || coins < item.price}
                          className={`w-full font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 ${
                            isMaxed 
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                              : coins < item.price
                              ? "bg-blue-400/50 text-white cursor-not-allowed opacity-70"
                              : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md active:scale-95"
                          }`}
                        >
                          {isMaxed ? "Maksimal" : <>Beli <span className="text-white font-extrabold">{item.price} 🌸</span></>}
                        </button>
                      </div>
                    ) : (
                      <>
                        {!isOwned ? (
                          <button
                            onClick={() => handleBuy(item)}
                            disabled={coins < item.price}
                            className={`w-full font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 active:scale-95 ${
                              coins < item.price
                                ? "bg-blue-400/50 text-white cursor-not-allowed opacity-70"
                                : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md"
                            }`}
                          >
                            Beli <span className="text-white font-extrabold">{item.price} 🌸</span>
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