"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getVisualStatus, getMemoryState } from "@/utils/memoryEngine";

type Kanji = {
  id: number;
  character: string;
  hiragana: string;
  romaji: string | null;
  meaning: string;
};

type CategoryInfo = {
  id: number;
  slug: string;
  title: string;
  kanjiIds: number[];
};

export default function DaftarKanjiPage() {
  const [kanjiList, setKanjiList] = useState<Kanji[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("semua");
  const [selectedStatus, setSelectedStatus] = useState<string>("semua");
  const [loading, setLoading] = useState(true);
  const [memoryData, setMemoryData] = useState<Record<string, any>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/categories/semua/kanji").then((res) => res.json()),
      fetch("/api/categories").then((res) => res.json()),
    ]).then(([kanjiData, catData]) => {
      setKanjiList(kanjiData);
      setCategories(catData);
      setLoading(false);
    });

    setMemoryData(getMemoryState());
  }, []);

  const getStatus = (id: number) => {
    const status = getVisualStatus(id, "kanji");
    switch (status) {
      case "new": return { key: "new", label: "Baru", color: "bg-slate-100 text-slate-500 border-slate-200" };
      case "learning": return { key: "learning", label: "Sedang Dipelajari", color: "bg-blue-100 text-blue-600 border-blue-200" };
      case "review": return { key: "review", label: "Perlu Diulang", color: "bg-rose-100 text-rose-600 border-rose-200" };
      case "mastered": return { key: "mastered", label: "Dikuasai", color: "bg-emerald-100 text-emerald-600 border-emerald-200" };
      default: return { key: "new", label: "Baru", color: "bg-slate-100 text-slate-500 border-slate-200" };
    }
  };

  const filtered = kanjiList.filter((k) => {
    const matchSearch =
      k.character.includes(search) ||
      k.hiragana.includes(search) ||
      k.meaning.toLowerCase().includes(search.toLowerCase()) ||
      (k.romaji && k.romaji.toLowerCase().includes(search.toLowerCase()));

    let matchCategory = true;
    if (selectedCat !== "semua") {
      const cat = categories.find((c) => c.slug === selectedCat);
      matchCategory = cat ? cat.kanjiIds.includes(k.id) : false;
    }

    const status = getStatus(k.id).key;
    const matchStatus = selectedStatus === "semua" || status === selectedStatus;

    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <Link href="/belajar/kanji" className="text-blue-600 hover:text-blue-800 text-sm font-semibold mb-2 inline-block">
              ← Kembali ke Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-blue-900">📚 Daftar Semua Kanji</h1>
            <p className="text-blue-500 text-sm mt-1">
              Menampilkan {filtered.length} dari total {kanjiList.length} kanji
            </p>
          </div>
          
          <div className="w-full lg:w-auto flex flex-col sm:flex-row flex-wrap gap-3">
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="px-4 py-2 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white font-medium text-sm"
            >
              <option value="semua">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>{cat.title}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white font-medium text-sm"
            >
              <option value="semua">Semua Status</option>
              <option value="new">Baru</option>
              <option value="learning">Sedang Dipelajari</option>
              <option value="review">Perlu Diulang</option>
              <option value="mastered">Dikuasai</option>
            </select>

            <input
              type="text"
              placeholder="Cari kanji..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-48 px-4 py-2 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white text-sm"
            />
          </div>
        </header>

        <div className="bg-white border-2 border-blue-100 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-blue-500 animate-pulse">Memuat data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-50 text-blue-800 text-sm">
                    <th className="p-4 border-b border-blue-100 w-16">No</th>
                    <th className="p-4 border-b border-blue-100">Kanji</th>
                    <th className="p-4 border-b border-blue-100">Hiragana</th>
                    <th className="p-4 border-b border-blue-100">Arti</th>
                    <th className="p-4 border-b border-blue-100 text-center w-40">Status Memori</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((k, index) => {
                      const status = getStatus(k.id);
                      return (
                        <tr key={k.id} className="hover:bg-blue-50/50 transition border-b border-blue-50 last:border-0">
                          <td className="p-4 text-sm text-slate-400">{index + 1}</td>
                          <td className="p-4 text-2xl font-bold text-blue-900">{k.character}</td>
                          <td className="p-4 text-blue-700">{k.hiragana}</td>
                          <td className="p-4 text-slate-700">{k.meaning}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Tidak ada kanji yang cocok dengan filter/pencarian kamu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}