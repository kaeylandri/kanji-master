"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Kanji = {
  id: number;
  character: string;
  hiragana: string;
  romaji: string | null;
  meaning: string;
};

export default function KanjiDihafalPage() {
  const [masteredList, setMasteredList] = useState<Kanji[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Ambil ID kanji yang dihafal dari localStorage
    const savedIds: number[] = JSON.parse(localStorage.getItem("masteredKanji") || "[]");

    if (savedIds.length === 0) {
      setLoading(false);
      return;
    }

    // 2. Ambil semua data kanji dari API, lalu filter yang sudah dihafal
    fetch("/api/categories/semua/kanji")
      .then((res) => res.json())
      .then((data: Kanji[]) => {
        const filtered = data.filter((k) => savedIds.includes(k.id));
        setMasteredList(filtered);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-semibold mb-2 inline-block">
            ← Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-blue-900">🧠 Kanji yang Dihafal</h1>
          <p className="text-blue-500 text-sm mt-1">
            Kamu sudah menghafal <strong className="text-blue-700">{masteredList.length}</strong> kanji. Terus semangat!
          </p>
        </header>

        {/* List Kanji */}
        {loading ? (
          <div className="text-center text-blue-500 animate-pulse py-10">Memuat data...</div>
        ) : masteredList.length === 0 ? (
          <div className="bg-white border-2 border-blue-100 rounded-2xl p-10 text-center shadow-sm">
            <div className="text-6xl mb-4 opacity-50">📭</div>
            <h2 className="text-xl font-bold text-blue-900 mb-2">Belum Ada Kanji yang Dihafal</h2>
            <p className="text-blue-500 mb-6">Ayo mulai latihan dan jawab kanji dengan benar untuk mengumpulkannya di sini!</p>
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition"
            >
              Mulai Latihan
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {masteredList.map((k) => (
              <div
                key={k.id}
                className="bg-white border-2 border-blue-100 hover:border-blue-400 rounded-2xl p-4 shadow-sm hover:shadow-md transition text-center group"
              >
                <div className="text-5xl font-bold text-blue-900 mb-3 group-hover:scale-110 transition-transform">
                  {k.character}
                </div>
                <div className="text-sm font-semibold text-blue-700">{k.hiragana}</div>
                <div className="text-xs text-blue-400 mt-1">{k.romaji}</div>
                <div className="text-xs text-slate-600 mt-2 line-clamp-2">{k.meaning}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}