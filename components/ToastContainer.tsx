"use client";

import { useEffect, useState } from "react";
import { playPopupSound } from "@/utils/sound";

type ToastData = { id: number; message: string; type: "success" | "error" | "info" };

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const handleShowToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { message, type } = customEvent.detail;
      
      // Mainkan suara
      playPopupSound();

      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);

      // Hilangkan otomatis setelah 3 detik
      setTimeout(() => {
        removeToast(id);
      }, 3000);
    };

    window.addEventListener("show-toast", handleShowToast);
    return () => window.removeEventListener("show-toast", handleShowToast);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  // Ambil toast terakhir (jika ada antrean)
  const current = toasts[toasts.length - 1];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none">
      {/* Backdrop Blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-300" onClick={() => removeToast(current.id)} />
      
      {/* Modal Box */}
      <div className={`relative flex flex-col items-center gap-4 p-8 rounded-3xl shadow-2xl border-2 pointer-events-auto animate-in zoom-in-95 duration-300 ${
        current.type === "success" 
          ? "bg-slate-800 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)]" 
          : current.type === "error"
          ? "bg-slate-800 border-rose-500 shadow-[0_0_40px_rgba(239,68,68,0.3)]"
          : "bg-slate-800 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.3)]"
      }`}>
        
        {/* Icon Besar */}
        <div className={`text-6xl animate-bounce ${current.type === "success" ? "text-emerald-400" : current.type === "error" ? "text-rose-400" : "text-blue-400"}`}>
          {current.type === "success" ? "🎉" : current.type === "error" ? "⚠️" : "ℹ️"}
        </div>
        
        {/* Teks */}
        <h2 className="text-2xl font-bold text-white text-center">
          {current.message}
        </h2>
        
        {/* Tombol Tutup */}
        <button 
          onClick={() => removeToast(current.id)}
          className={`mt-2 px-8 py-3 rounded-xl font-bold text-white transition active:scale-95 ${
            current.type === "success" ? "bg-emerald-600 hover:bg-emerald-500" : current.type === "error" ? "bg-rose-600 hover:bg-rose-500" : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          Oke, Mengerti!
        </button>
      </div>
    </div>
  );
}