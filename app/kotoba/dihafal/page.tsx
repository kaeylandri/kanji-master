"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Kotoba = { id: number; word: string; reading: string; meaning: string; };

export default function KotobaDihafalPage() {
  const [masteredList, setMasteredList] = useState<Kotoba[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedIds = JSON.parse(localStorage.getItem("masteredKotoba") || "[]");
    if (savedIds.length === 0) { setLoading(false); return; }

    fetch("/api/kotoba/semua")
      .then((res) => res.json())
      .then((data: Kotoba[]) => {
        setMasteredList(data.filter((k) => savedIds.includes(k.id)));
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <Link href="/belajar/kotoba" className="text-emerald-600 text-sm font-semibold mb-2 inline-block">
            ← Kembali ke Dashboard Kotoba
          </Link>
          <h1 className="text-3xl font-bold text-emerald-900">🧠 Kotoba yang Dihafal</h1>
          <p className="text-emerald-500 text-sm mt-1">
            Kamu sudah menghafal <strong className="text-emerald-700">{masteredList.length}</strong> kotoba.
          </p>
        </header>

        {loading ? (
          <div className="text-center text-emerald-500 animate-pulse py-10">Memuat...</div>
        ) : masteredList.length === 0 ? (
          <div className="bg-white border-2 border-emerald-100 rounded-2xl p-10 text-center shadow-sm">
            <div className="text-6xl mb-4 opacity-50">📭</div>
            <h2 className="text-xl font-bold text-emerald-900 mb-2">Belum Ada Kotoba yang Dihafal</h2>
            <p className="text-emerald-500 mb-6">Ayo mulai latihan untuk mengumpulkannya di sini!</p>
            <Link href="/belajar/kotoba" className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition">
              Mulai Latihan
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {masteredList.map((k) => (
              <div key={k.id} className="bg-white border-2 border-emerald-100 hover:border-emerald-400 rounded-2xl p-4 shadow-sm text-center">
                <div className="text-2xl font-bold text-emerald-900 mb-2">{k.word}</div>
                <div className="text-sm font-semibold text-emerald-700">{k.reading}</div>
                <div className="text-xs text-slate-600 mt-2">{k.meaning}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}