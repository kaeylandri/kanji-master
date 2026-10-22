"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Category = {
  id: number;
  slug: string;
  title: string;
  groupName: string | null;
  priority: string | null;
  kanji: Array<{
    id: number;
    character: string;
    hiragana: string;
    romaji: string | null;
    meaning: string;
  }>;
};

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [masteredInCat, setMasteredInCat] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    
    // Fetch detail kategori + kanjinya
    fetch(`/api/categories/${slug}/kanji`)
      .then((res) => res.json())
      .then((kanjiData) => {
        // Kita juga butuh info judul kategori, maka kita bisa buat API baru
        // atau menggunakan trick: karena kita hanya butuh judul, kita bisa fetch dari API categories
        fetch("/api/categories")
          .then((r) => r.json())
          .then((cats) => {
            const catInfo = cats.find((c: any) => c.slug === slug);
            if (catInfo) {
              setCategory({
                id: catInfo.id,
                slug: catInfo.slug,
                title: catInfo.title,
                groupName: "Daftar kanji dari soal JFT", // Hardcode atau sesuaikan
                priority: catInfo.priority,
                kanji: kanjiData,
              });

              // Hitung progress hafalan
              try {
                const mastered = JSON.parse(localStorage.getItem("masteredKanji") || "[]");
                const count = kanjiData.filter((k: any) => mastered.includes(k.id)).length;
                setMasteredInCat(count);
              } catch (e) {}
            }
            setLoading(false);
          });
      });
  }, [slug]);

  if (loading || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-blue-600 text-xl animate-pulse">🌸 Memuat kategori...</div>
      </div>
    );
  }

  const total = category.kanji.length;
  const previewKanji = category.kanji.slice(0, 6);
  const percent = total > 0 ? (masteredInCat / total) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
      <div className="absolute top-10 left-10 text-6xl opacity-10 select-none">🌸</div>
      <div className="absolute top-40 right-16 text-6xl opacity-10 select-none">⛩️</div>
      <div className="absolute bottom-20 left-20 text-6xl opacity-10 select-none">🗾</div>
      <div className="absolute bottom-32 right-24 text-6xl opacity-10 select-none">🎌</div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        <header className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-900 font-semibold transition mb-6">
            <span>←</span> <span>Dashboard</span>
          </Link>

          <div className="text-center">
            <div className="text-5xl mb-3">🎴</div>
            <h1 className="text-3xl font-bold text-blue-900 mb-2">{category.title}</h1>
            <p className="text-blue-600">{category.groupName}</p>
            {category.priority === "tinggi" && (
              <span className="inline-block mt-3 text-xs bg-rose-100 text-rose-600 px-3 py-1 rounded-full border border-rose-200 font-semibold">
                🔥 Prioritas Tinggi
              </span>
            )}
          </div>
        </header>

        {/* 🆕 Progress Bar Kategori Ini */}
        <div className="bg-white rounded-2xl border-2 border-blue-100 shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold text-blue-900">📈 Progress Hafalan Kamu</h2>
            <span className="text-sm font-semibold text-blue-600">{masteredInCat} / {total} Kanji</span>
          </div>
          <div className="h-3 w-full bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white rounded-2xl border-2 border-blue-100 shadow-sm p-4 text-center">
            <div className="text-2xl mb-1">📚</div>
            <div className="text-2xl font-bold text-blue-900">{total}</div>
            <div className="text-xs text-blue-500">Total Kanji</div>
          </div>
          <div className="bg-white rounded-2xl border-2 border-blue-100 shadow-sm p-4 text-center">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-2xl font-bold text-blue-900">2</div>
            <div className="text-xs text-blue-500">Mode Latihan</div>
          </div>
          <div className="bg-white rounded-2xl border-2 border-blue-100 shadow-sm p-4 text-center">
            <div className="text-2xl mb-1">⏱️</div>
            <div className="text-2xl font-bold text-blue-900">~{Math.ceil(total * 0.5)}</div>
            <div className="text-xs text-blue-500">Menit</div>
          </div>
        </div>

        {/* Preview Kanji */}
        <div className="bg-white rounded-2xl border-2 border-blue-100 shadow-sm p-6 mb-8">
          <h2 className="text-sm font-bold text-blue-700 mb-4 flex items-center gap-2">👀 Preview Kanji</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {previewKanji.map((k) => (
              <div
                key={k.id}
                className="aspect-square bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 flex items-center justify-center text-3xl font-bold text-blue-900 transition cursor-default"
                title={`${k.hiragana}${k.romaji ? ` (${k.romaji})` : ""} — ${k.meaning}`}
              >
                {k.character}
              </div>
            ))}
          </div>
          {total > 6 && (
            <p className="text-xs text-blue-500 text-center mt-3">
              +{total - 6} kanji lainnya akan muncul saat latihan
            </p>
          )}
        </div>

        {/* Pilihan Mode Latihan */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2">🎮 Pilih Mode Latihan</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href={`/category/${slug}/latihan`}
              className="group bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-2xl p-5 shadow-lg transition active:scale-95"
            >
              <div className="text-3xl mb-2">📖</div>
              <div className="font-bold text-lg mb-1">Mode Normal</div>
              <div className="text-xs text-blue-100">Semua kanji urut dari awal.</div>
              <div className="mt-3 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                Mulai →
              </div>
            </Link>

            <Link
              href={`/category/${slug}/latihan?acak=1`}
              className="group bg-gradient-to-br from-rose-500 to-rose-700 hover:from-rose-600 hover:to-rose-800 text-white rounded-2xl p-5 shadow-lg transition active:scale-95"
            >
              <div className="text-3xl mb-2">🔀</div>
              <div className="font-bold text-lg mb-1">Mode Acak</div>
              <div className="text-xs text-rose-100">Kanji diacak supaya tidak hafal urutan.</div>
              <div className="mt-3 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                Mulai →
              </div>
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-blue-400 mt-4">
          Tips: Ketik hiragana ATAU romaji — kartu akan berbalik 🎴
        </p>

        <footer className="text-center mt-8 text-sm text-blue-400">
          🌸 がんばって！ — Semangat! 🌸
        </footer>
      </div>
    </div>
  );
}