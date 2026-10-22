"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMemoryState } from "@/utils/memoryEngine";

type Kotoba = {
  id: number;
  category: string;
  word: string;
  reading: string;
  meaning: string;
};

export default function DaftarKotobaPage() {
  const [kotobaList, setKotobaList] = useState<Kotoba[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("semua");
  const [selectedStatus, setSelectedStatus] = useState<string>("semua");
  const [loading, setLoading] = useState(true);

  // State untuk menyimpan data ingatan
  const [memoryData, setMemoryData] = useState<Record<string, any>>({});
  const [masteredIds, setMasteredIds] = useState<number[]>([]); // 🆕 Sinkronisasi dengan halaman Dihafal

  useEffect(() => {
    fetch("/api/kotoba/semua")
      .then((res) => res.json())
      .then((data) => {
        setKotobaList(data);
        setLoading(false);
      });

    const mem = getMemoryState();
    setMemoryData(mem);

    // 🆕 Baca data hafalan dari localStorage
    const savedMastered = JSON.parse(localStorage.getItem("masteredKotoba") || "[]");
    setMasteredIds(savedMastered);
  }, []);

  const categories = Array.from(new Set(kotobaList.map((k) => k.category)));

  // 🆕 Fungsi Status yang sudah diperbaiki
  const getStatus = (id: number) => {
    const key = `kotoba_${id}`;
    const mem = memoryData[key];
    const isMastered = masteredIds.includes(id);

    // Jika belum pernah masuk sistem memori DAN belum pernah dihafal
    if (!mem && !isMastered) {
      return { key: "baru", label: "Baru", color: "bg-slate-100 text-slate-500 border-slate-200" };
    }

    // Jika sudah dihafal tapi belum pernah masuk Smart Flashcard, anggap "Sedang Dipelajari"
    if (!mem && isMastered) {
      return { key: "sedang_dipelajari", label: "Sedang Dipelajari", color: "bg-blue-100 text-blue-600 border-blue-200" };
    }

    // Logika Spaced Repetition (jika ada di sistem memori)
    const now = new Date();
    const nextReview = new Date(mem.nextReview);
    const diffDays = Math.ceil((nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (now >= nextReview) {
      return { key: "perlu_diulang", label: "Perlu Diulang", color: "bg-rose-100 text-rose-600 border-rose-200" };
    }

    if (diffDays >= 7) {
      return { key: "dikuasai", label: "Dikuasai", color: "bg-emerald-100 text-emerald-600 border-emerald-200" };
    }

    return { key: "sedang_dipelajari", label: "Sedang Dipelajari", color: "bg-blue-100 text-blue-600 border-blue-200" };
  };

  const filtered = kotobaList.filter((k) => {
    const matchSearch =
      k.word.includes(search) ||
      k.reading.toLowerCase().includes(search.toLowerCase()) ||
      k.meaning.toLowerCase().includes(search.toLowerCase());

    const matchCategory = selectedCat === "semua" || k.category === selectedCat;

    const status = getStatus(k.id);
    const matchStatus = selectedStatus === "semua" || status.key === selectedStatus;

    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <Link href="/belajar/kotoba" className="text-emerald-600 hover:text-emerald-800 text-sm font-semibold mb-2 inline-block">
              ← Kembali ke Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-emerald-900">📖 Daftar Semua Kotoba</h1>
            <p className="text-emerald-600 text-sm mt-1">
              Menampilkan {filtered.length} dari total {kotobaList.length} kotoba
            </p>
          </div>
          
          <div className="w-full lg:w-auto flex flex-col sm:flex-row flex-wrap gap-3">
            {/* Dropdown Kategori */}
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="px-4 py-2 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white font-medium text-sm"
            >
              <option value="semua">Semua Kategori</option>
              {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            {/* Dropdown Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white font-medium text-sm"
            >
              <option value="semua">Semua Status</option>
              <option value="baru">Baru</option>
              <option value="sedang_dipelajari">Sedang Dipelajari</option>
              <option value="perlu_diulang">Perlu Diulang</option>
              <option value="dikuasai">Dikuasai</option>
            </select>

            {/* Input Pencarian */}
            <input
              type="text"
              placeholder="Cari kotoba..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-48 px-4 py-2 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white text-sm"
            />
          </div>
        </header>

        <div className="bg-white border-2 border-emerald-100 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-emerald-500 animate-pulse">Memuat...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-50 text-emerald-800 text-sm">
                    <th className="p-4 border-b border-emerald-100 w-16">No</th>
                    <th className="p-4 border-b border-emerald-100">Kotoba</th>
                    <th className="p-4 border-b border-emerald-100">Cara Baca</th>
                    <th className="p-4 border-b border-emerald-100">Arti</th>
                    <th className="p-4 border-b border-emerald-100 text-center w-40">Status Memori</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((k, index) => {
                      const status = getStatus(k.id);
                      return (
                        <tr key={k.id} className="hover:bg-emerald-50/50 transition border-b border-emerald-50 last:border-0">
                          <td className="p-4 text-sm text-slate-400">{index + 1}</td>
                          <td className="p-4 text-xl font-bold text-emerald-900">{k.word}</td>
                          <td className="p-4 text-emerald-700">{k.reading}</td>
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
                        Tidak ada kotoba yang cocok dengan filter/pencarian kamu.
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