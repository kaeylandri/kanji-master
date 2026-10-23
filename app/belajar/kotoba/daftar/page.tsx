// app/daftar-kanji/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KANJI_DATA } from "@/data/kanji"; // 🆕 Import langsung dari data kanji

export default function DaftarKanjiPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");
  const [selectedStatus, setSelectedStatus] = useState("Semua Status");
  const [masteredIds, setMasteredIds] = useState<number[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("masteredKanji") || "[]");
      setMasteredIds(saved);
    } catch (e) {}
  }, []);

  // Dapatkan daftar kategori unik
  const categories = ["Semua Kategori", ...Array.from(new Set(KANJI_DATA.map(k => k.categoryTitle)))];

  // Filter data
  const filteredKanji = KANJI_DATA.filter((k) => {
    const matchSearch = k.character.includes(search) || k.meaning.toLowerCase().includes(search.toLowerCase()) || k.hiragana.includes(search);
    const matchCategory = selectedCategory === "Semua Kategori" || k.categoryTitle === selectedCategory;
    const isMastered = masteredIds.includes(k.id);
    
    let matchStatus = true;
    if (selectedStatus === "Sudah Dihafal") matchStatus = isMastered;
    if (selectedStatus === "Belum Dihafal") matchStatus = !isMastered;

    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/belajar/kanji" className="text-blue-600 font-semibold mb-6 inline-block hover:underline">
          ← Kembali ke Dashboard
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              📚 Daftar Semua Kanji
            </h1>
            <p className="text-slate-500">
              Menampilkan <span className="font-bold text-blue-600">{filteredKanji.length}</span> dari total <span className="font-bold">{KANJI_DATA.length}</span> kanji
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-3">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Sudah Dihafal">Sudah Dihafal</option>
            <option value="Belum Dihafal">Belum Dihafal</option>
          </select>

          <input 
            type="text"
            placeholder="Cari kanji / arti / hiragana..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500"
          />
        </div>

        {/* Tabel Kanji */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="p-4 font-semibold w-16">No</th>
                <th className="p-4 font-semibold w-24 text-center">Kanji</th>
                <th className="p-4 font-semibold">Hiragana</th>
                <th className="p-4 font-semibold">Arti</th>
                <th className="p-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredKanji.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Tidak ada kanji yang cocok dengan filter/pencarian kamu.
                  </td>
                </tr>
              ) : (
                filteredKanji.map((kanji, index) => {
                  const isMastered = masteredIds.includes(kanji.id);
                  return (
                    <tr key={kanji.id} className="hover:bg-blue-50/50 transition">
                      <td className="p-4 text-slate-500">{index + 1}</td>
                      <td className="p-4 text-center text-2xl font-bold text-slate-800">{kanji.character}</td>
                      <td className="p-4 text-slate-700">{kanji.hiragana}</td>
                      <td className="p-4 text-slate-600">{kanji.meaning}</td>
                      <td className="p-4 text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${isMastered ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                          {isMastered ? "Dihafal" : "Belum"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}