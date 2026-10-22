// app/belajar/kanji/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout"; // 🆕 Menggunakan AppLayout

type Category = {
  id: number;
  slug: string;
  title: string;
  priority: string | null;
  count: number;
  kanjiIds: number[];
};

export default function KanjiDashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [masteredIds, setMasteredIds] = useState<number[]>([]);

  useEffect(() => {
    // Fetch daftar kategori
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data));

    // Load data hafalan dari localStorage
    try {
      const saved = JSON.parse(localStorage.getItem("masteredKanji") || "[]");
      setMasteredIds(saved);
    } catch (e) {}
  }, []);

  const totalKanji = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        
        {/* Header Judul (Tema Biru) */}
        <header className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-8 text-white shadow-lg">
          <div>
            <h1 className="text-3xl font-bold mb-2">Belajar Kanji</h1>
            <p className="text-blue-100">Kuasai 486 Kanji untuk persiapan JFT!</p>
          </div>
          <div className="text-6xl">📚</div>
        </header>

        {/* Statistik Global */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link href="/daftar-kanji" className="bg-white border-2 border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-sm flex items-center gap-4 group transition">
            <div className="text-4xl bg-blue-50 p-3 rounded-xl group-hover:scale-110 transition-transform">📖</div>
            <div>
              <div className="text-slate-500 text-sm font-bold mb-1">Total Kanji</div>
              <div className="text-3xl font-bold text-slate-800">{totalKanji || "..."}</div>
            </div>
          </Link>
          
          <Link href="/kanji/dihafal" className="bg-white border-2 border-slate-200 hover:border-emerald-400 rounded-2xl p-5 shadow-sm flex items-center gap-4 group transition">
            <div className="text-4xl bg-emerald-50 p-3 rounded-xl group-hover:scale-110 transition-transform">🧠</div>
            <div>
              <div className="text-slate-500 text-sm font-bold mb-1">Kanji Dihafal</div>
              <div className="text-3xl font-bold text-emerald-600">
                {masteredIds.length} <span className="text-sm text-slate-400">/ {totalKanji}</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Grid Mode Latihan */}
        <h2 className="text-xl font-bold text-slate-800 mb-4">🎮 Mode Latihan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {/* Smart Flashcard */}
          <Link href="/kanji/flashcard" className="bg-white border-2 border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition group flex flex-col items-center text-center">
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">⚡</div>
            <div className="font-bold text-slate-800 text-lg">Smart Flashcard</div>
            <div className="text-xs text-slate-500 mt-1">Hafalan cerdas (Spaced Repetition)</div>
          </Link>

          {/* Ujian Kanji */}
          <Link href="/ujian" className="bg-white border-2 border-slate-200 hover:border-emerald-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition group flex flex-col items-center text-center">
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📝</div>
            <div className="font-bold text-slate-800 text-lg">Ujian Kanji</div>
            <div className="text-xs text-slate-500 mt-1">50 Soal pilihan ganda</div>
          </Link>

          {/* Survival */}
          <Link href="/survival" className="bg-white border-2 border-slate-200 hover:border-purple-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition group flex flex-col items-center text-center">
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">⏱️</div>
            <div className="font-bold text-slate-800 text-lg">Mode Survival</div>
            <div className="text-xs text-slate-500 mt-1">Tantangan 2 menit</div>
          </Link>

          {/* Latihan Acak */}
          <Link href="/category/semua/latihan?acak=1" className="bg-white border-2 border-slate-200 hover:border-rose-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition group flex flex-col items-center text-center">
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🎲</div>
            <div className="font-bold text-slate-800 text-lg">Latihan Acak</div>
            <div className="text-xs text-slate-500 mt-1">Campur 50 Kanji acak</div>
          </Link>
        </div>

        {/* Daftar Kategori */}
        <h2 className="text-xl font-bold text-slate-800 mb-4">📚 Pilih Kategori</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.length === 0 ? (
            <p className="text-slate-400 text-center col-span-full animate-pulse">Memuat kategori...</p>
          ) : (
            categories.map((cat) => {
              const masteredInCat = cat.kanjiIds.filter((id) => masteredIds.includes(id)).length;
              const percent = cat.count > 0 ? (masteredInCat / cat.count) * 100 : 0;

              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="bg-white hover:bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 transition group shadow-sm hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition pr-2">
                        {cat.title}
                      </h3>
                      {cat.priority === "tinggi" && (
                        <span className="text-xs bg-rose-100 text-rose-600 px-2 py-1 rounded-full border border-rose-200 shrink-0">
                          Prioritas
                        </span>
                      )}
                    </div>
                    
                    {/* Progress Bar per Kategori */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                        <span>Progress</span>
                        <span>{masteredInCat} / {cat.count}</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">
                      {cat.count} kanji
                    </span>
                    <span className="text-blue-600 group-hover:translate-x-1 transition font-bold">
                      Mulai →
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        <footer className="text-center mt-12 text-sm text-slate-400 pb-8">
          🌸 がんばって！ — Semangat belajar! 🌸
        </footer>
      </div>
    </AppLayout>
  );
}