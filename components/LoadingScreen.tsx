// components/LoadingScreen.tsx
"use client";

import { useEffect, useState } from "react";

export default function LoadingScreen({ 
  message = "Memuat...",
  submessage = "Mohon tunggu sebentar"
}: { 
  message?: string;
  submessage?: string;
}) {
  const [dots, setDots] = useState("");

  // 🆕 Animasi titik-titik
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center p-6">
      
      {/* 🆕 Spinner Animasi */}
      <div className="relative w-24 h-24 mb-8">
        {/* Lingkaran Luar */}
        <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
        
        {/* Lingkaran Berputar */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
        
        {/* Ikon Tengah */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl animate-bounce">🎌</span>
        </div>
      </div>

      {/* 🆕 Progress Bar */}
      <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400 rounded-full animate-loading-bar"></div>
      </div>

      {/* 🆕 Teks Loading dengan Titik Beranimasi */}
      <h2 className="text-xl font-bold text-slate-700 mb-2">
        {message}{dots}
      </h2>
      
      <p className="text-sm text-slate-500 animate-pulse">{submessage}</p>

      {/* 🆕 CSS Animasi Khusus */}
      <style jsx>{`
        @keyframes loading-bar {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 70%; transform: translateX(0%); }
          100% { width: 100%; transform: translateX(100%); }
        }
        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}