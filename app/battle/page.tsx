// app/battle/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function BattleHomePage() {
  const [stats, setStats] = useState({ wins: 0, losses: 0, draws: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setStats({ wins: 0, losses: 0, draws: 0 });
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Tombol Kembali */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 transition-all">
            <span>⬅️</span> Kembali ke Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 tracking-tight">
            ⚔️ Sakura Battle
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Tantang temanmu atau pemain lain dalam kuis Kanji & Kotoba 1 vs 1. Kumpulkan skor tertinggi dalam 2 menit!
          </p>
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-center">
            <span className="block text-3xl font-bold text-emerald-500">{stats.wins}</span>
            <span className="text-sm font-semibold text-slate-500">Menang</span>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-center">
            <span className="block text-3xl font-bold text-slate-400">{stats.draws}</span>
            <span className="text-sm font-semibold text-slate-500">Seri</span>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-center">
            <span className="block text-3xl font-bold text-red-500">{stats.losses}</span>
            <span className="text-sm font-semibold text-slate-500">Kalah</span>
          </div>
        </div>

        {/* Pilihan Mode */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/battle/lobby" className="group bg-white rounded-3xl p-8 shadow-sm border-2 border-slate-200 hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-4xl">📚</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Kanji Battle</h3>
            <p className="text-sm text-slate-500">Uji hafalan Kanji kamu melawan lawan secara langsung.</p>
          </Link>

          <Link href="/battle/lobby" className="group bg-white rounded-3xl p-8 shadow-sm border-2 border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-4xl">📖</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Kotoba Battle</h3>
            <p className="text-sm text-slate-500">Adu kecepatan mengingat kosakata (Kotoba) bahasa Jepang.</p>
          </Link>

          <Link href="/battle/lobby" className="group bg-white rounded-3xl p-8 shadow-sm border-2 border-slate-200 hover:border-purple-500 hover:shadow-md transition-all flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-4xl">🎲</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Random Battle</h3>
            <p className="text-sm text-slate-500">Campuran Kanji dan Kotoba. Siapkan mentalmu!</p>
          </Link>
        </div>

        {/* Tombol Tantang Teman */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-3xl p-8 text-center text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Mau Bertanding dengan Teman?</h2>
          <p className="mb-6 opacity-90">Pilih temanmu dan kirim undangan pertandingan secara langsung.</p>
          <Link 
            href="/battle/lobby" 
            className="inline-block bg-white text-pink-600 font-bold py-3 px-8 rounded-xl shadow-sm hover:scale-105 transition-transform"
          >
            Cari Teman & Bertanding
          </Link>
        </div>

      </div>
    </div>
  );
}