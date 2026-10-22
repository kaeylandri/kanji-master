"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Kotoba = { id: number; word: string; reading: string; meaning: string };

export default function KotobaKategoriPage() {
  const params = useParams();
  const categoryName = decodeURIComponent(params.name as string);
  
  const [kotobaCount, setKotobaCount] = useState(0);
  const [preview, setPreview] = useState<Kotoba[]>([]);
  const [masteredCount, setMasteredCount] = useState(0);

  useEffect(() => {
    fetch(`/api/kotoba/${encodeURIComponent(categoryName)}`)
      .then((res) => res.json())
      .then((data: Kotoba[]) => {
        if (Array.isArray(data)) {
          setKotobaCount(data.length);
          setPreview(data.slice(0, 6));
          
          // 🆕 Hitung progress hafalan
          try {
            const saved = JSON.parse(localStorage.getItem("masteredKotoba") || "[]");
            const masteredInCat = data.filter((k) => saved.includes(k.id)).length;
            setMasteredCount(masteredInCat);
          } catch (e) {}
        }
      });
  }, [categoryName]);

  const percent = kotobaCount > 0 ? (masteredCount / kotobaCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 relative overflow-hidden">
      <div className="absolute top-10 left-10 text-6xl opacity-10 select-none">🍃</div>
      <div className="absolute bottom-20 right-20 text-6xl opacity-10 select-none">🏮</div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        <header className="mb-8">
          <Link href="/belajar/kotoba" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-900 font-semibold transition mb-6">
            <span>←</span> <span>Dashboard Kotoba</span>
          </Link>

          <div className="text-center">
            <div className="text-5xl mb-3">📖</div>
            <h1 className="text-3xl font-bold text-emerald-900 mb-2">{categoryName}</h1>
            <p className="text-emerald-600">Kategori Kosakata</p>
          </div>
        </header>

        {/* 🆕 Progress Bar Kategori */}
        <div className="bg-white rounded-2xl border-2 border-emerald-100 shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold text-emerald-900">📈 Progress Hafalan Kamu</h2>
            <span className="text-sm font-semibold text-emerald-600">{masteredCount} / {kotobaCount} Kotoba</span>
          </div>
          <div className="h-3 w-full bg-emerald-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-emerald-100 shadow-sm p-6 mb-8">
          <h2 className="text-sm font-bold text-emerald-700 mb-4">👀 Preview Kotoba</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {preview.map((k) => (
              <div key={k.id} className="aspect-square bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-900 p-1 text-center break-all">
                {k.word}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-bold text-emerald-700 mb-3">🎮 Pilih Mode Latihan</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href={`/kotoba/latihan/${encodeURIComponent(categoryName)}`}
              className="group bg-gradient-to-br from-emerald-500 to-teal-700 hover:from-emerald-600 hover:to-teal-800 text-white rounded-2xl p-5 shadow-lg transition active:scale-95"
            >
              <div className="text-3xl mb-2">📖</div>
              <div className="font-bold text-lg mb-1">Mode Normal</div>
              <div className="text-xs text-emerald-100">Semua kotoba urut dari awal.</div>
              <div className="mt-3 text-sm font-semibold">Mulai →</div>
            </Link>

            <Link
              href={`/kotoba/latihan/${encodeURIComponent(categoryName)}?acak=1`}
              className="group bg-gradient-to-br from-rose-500 to-rose-700 hover:from-rose-600 hover:to-rose-800 text-white rounded-2xl p-5 shadow-lg transition active:scale-95"
            >
              <div className="text-3xl mb-2">🔀</div>
              <div className="font-bold text-lg mb-1">Mode Acak</div>
              <div className="text-xs text-rose-100">Kotoba diacak + jatah intip 3x.</div>
              <div className="mt-3 text-sm font-semibold">Mulai →</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}