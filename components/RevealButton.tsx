"use client";

import { useEffect, useState } from "react";
import { getInventory, useItem } from "@/utils/luckyEngine";
import { triggerToast } from "@/utils/toast";

export default function RevealButton({ onRevealActive }: { onRevealActive: (isActive: boolean) => void }) {
  const [inventory, setInventory] = useState<any>({});
  const [revealActive, setRevealActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Load inventory
  useEffect(() => {
    const loadInv = () => setInventory(getInventory());
    loadInv();
    window.addEventListener("inventoryUpdated", loadInv);
    return () => window.removeEventListener("inventoryUpdated", loadInv);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!revealActive) return;
    if (timeLeft <= 0) {
      setRevealActive(false);
      onRevealActive(false);
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [revealActive, timeLeft, onRevealActive]);

  const handleUseReveal = () => {
    if (useItem("reveal")) {
      setRevealActive(true);
      setTimeLeft(170); // 170 detik = 2:50
      onRevealActive(true);
      triggerToast("🪄 Full Reveal Aktif selama 2:50!", "success");
    } else {
      triggerToast("Kamu tidak punya item Full Reveal!", "error");
    }
  };

  if (revealActive) {
    return (
      <div className="w-full bg-purple-100 text-purple-700 font-bold py-2 rounded-xl text-center animate-pulse border border-purple-200 mb-4">
        🪄 Full Reveal Aktif: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
      </div>
    );
  }

  if (inventory.reveal > 0) {
    return (
      <button
        onClick={handleUseReveal}
        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl shadow-md transition active:scale-95 mb-4"
      >
        🪄 Gunakan Full Reveal (Tersisa: {inventory.reveal})
      </button>
    );
  }

  return null;
}