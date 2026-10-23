// app/belajar/kotoba/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import kotobaData from "@/data/kotoba.json"; // 🆕 Import langsung dari JSON

type Category = {
  name: string;
  count: number;
};

export default function KotobaDashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [masteredKotoba, setMasteredKotoba] = useState<number[]>([]);
  const [totalKotoba, setTotalKotoba] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Proses data dari JSON
    if (kotobaData && kotobaData.length > 0) {
      setTotalKotoba(kotobaData.length);

      // Hitung jumlah per kategori
      const catMap: Record<string, number> = {};
      kotobaData.forEach((k: any) => {
        catMap[k.category] = (catMap[k.category] || 0) + 1;
      });
      
      const catArray = Object.keys(catMap).map((name) => ({
        name,
        count: catMap[name],
      }));
      
      setCategories(catArray);
    }
    setLoading(false);

    // 2. Load data hafalan dari localStorage
    try {
      const savedMastered = JSON.parse(localStorage.getItem("masteredKotoba") || "[]");
      setMasteredKotoba(savedMastered);
    } catch (e) {}
  }, []);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        
        {/* Header Judul (Tema Hijau) */}
        <header className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-lg">
          <div>
            <h1 className="text-3xl font-bold mb-2">Belajar Kotoba</h1>
            <p className="text-emerald-100">Perluas kosakata bahasa Jepangmu!</p>
          </div>
          <div className="text-6xl">📖</div>
        </header>

        {/* Statistik Global */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link href="/kotoba/daftar" className="bg-white border-2 border-slate-200 hover:border-emerald-400 rounded-2xl p-5 shadow-sm flex items-center gap-4 group transition">
            <div className="text-4xl bg-emerald-50 p-3 rounded-xl group-hover:scale-110 transition-transform">📚</div>
            <div>
              <div className="text-slate-500 text-sm font-bold mb-1">Total Kotoba</div>
              <div className="text-3xl font-bold text-slate-800">{totalKotoba}</div>
            </div>
          </Link>
          
          <Link href="/kotoba/dihafal" className="bg-white border-2 border-slate-200 hover:border-teal-400 rounded-2xl p-5 shadow-sm flex items-center gap-4 group transition">
            <div className="text-4xl bg-teal-50 p-3 rounded-xl group-hover:scale-110 transition-transform">🧠</div>
            <div>
              <div className="text-slate-500 text-sm font-bold mb-1">Kotoba Dihafal</div>
              <div className="text-3xl font-bold text-emerald-600">
                {masteredKotoba.length} <span className="text-sm text-slate-400">/ {totalKotoba}</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Grid Mode Latihan */}
        <h2 className="text-xl font-bold text-slate-800 mb-4">🎮 Mode Latihan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Link href="/kotoba/flashcard" className="bg-white border-2 border-slate-200 hover:border-emerald-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition group flex flex-col items-center text-center">
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">⚡</div>
            <div className="font-bold text-slate-800 text-lg">Smart Flashcard</div>
            <div className="text-xs text-slate-500 mt-1">Hafalan cerdas (Spaced Repetition)</div>
          </Link>

          <Link href="/kotoba/ujian" className="bg-white border-2 border-slate-200 hover:border-indigo-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition group flex flex-col items-center text-center">
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📝</div>
            <div className="font-bold text-slate-800 text-lg">Ujian Kotoba</div>
            <div className="text-xs text-slate-500 mt-1">25 Soal pilihan ganda</div>
          </Link>

          <Link href="/kotoba/latihan/semua?acak=1" className="bg-white border-2 border-slate-200 hover:border-rose-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition group flex flex-col items-center text-center sm:col-span-2">
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🎲</div>
            <div className="font-bold text-slate-800 text-lg">Latihan Acak — 50 Kotoba</div>
            <div className="text-xs text-slate-500 mt-1">Campur semua kotoba, diacak, ambil 50 soal</div>
          </Link>
        </div>

        {/* Daftar Kategori */}
        <h2 className="text-xl font-bold text-slate-800 mb-4">📚 Pilih Kategori</h2>
        {loading ? (
          <div className="text-center text-slate-400 py-8 animate-pulse">Memuat kategori...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const kotobaInCat = kotobaData.filter((k: any) => k.category === cat.name);
              const masteredInCat = kotobaInCat.filter((k: any) => masteredKotoba.includes(k.id)).length;
              const percent = cat.count > 0 ? (masteredInCat / cat.count) * 100 : 0;

              return (
                <Link key={cat.name} href={`/kotoba/kategori/${encodeURIComponent(cat.name)}`} className="bg-white hover:bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 transition group shadow-sm hover:shadow-md flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition mb-3">{cat.name}</h3>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                        <span>Progress</span>
                        <span>{masteredInCat} / {cat.count}</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">{cat.count} kotoba</span>
                    <span className="text-emerald-600 group-hover:translate-x-1 transition font-bold">Mulai →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <footer className="text-center mt-12 text-sm text-slate-400 pb-8">
          🌸 がんばって！ — Semangat belajar! 🌸
        </footer>
      </div>
    </AppLayout>
  );
}