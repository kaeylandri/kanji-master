"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

type ToastProps = {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
};

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === "success" ? "bg-emerald-500" : type === "error" ? "bg-rose-500" : "bg-blue-500";
  const icon = type === "success" ? "🎉" : type === "error" ? "⚠️" : "ℹ️";

  return (
    <div 
      className={`fixed top-10 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-4 scale-95"
      }`}
    >
      <div className={`${bgColor} text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-4 min-w-[320px]`}>
        <span className="text-3xl bg-white/20 p-2 rounded-xl">{icon}</span>
        <div className="flex-1">
          <p className="font-bold text-lg leading-tight">{message}</p>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white transition">
          ✕
        </button>
      </div>
    </div>
  );
}