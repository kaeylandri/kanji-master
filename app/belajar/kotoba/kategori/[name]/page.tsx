"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function KotobaKategoriPage() {
  const params = useParams();
  const categoryName = decodeURIComponent(params.name as string);
  const [kotobaCount, setKotobaCount] = useState(0);
  const [preview, setPreview] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/kotoba/${encodeURIComponent(categoryName)}`).then((res) => res.json()).then((data) => {
      if (Array.isArray(data)) { setKotobaCount(data.length); setPreview(data.slice(0, 6)); }
    });
  }, [categoryName]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 p-6">
      <div className="max-w-3xl mx-auto py-10">
        <header className="mb-8">
          <Link href="/belajar/kotoba" className="inline-flex items-center gap-2 text-emerald-700 font-semibold mb-6">← Dashboard Kotoba</Link>
          <div className="text-center">
            <div className="text-5xl mb-3">📖</div>
            <h1 className="text-3xl font-bold text-emerald-900 mb-2">{categoryName}</h1>
            <p className="text-emerald-600">Kategori Kosakata</p>
          </div>
        </header>
        <div className="bg-white rounded-2xl border-2 border-emerald-100 p-6 mb-8 text-center">
          <div className="text-3xl font-bold text-emerald-900">{kotobaCount}</div>
          <div className="text-sm text-emerald-500">Total Kotoba</div>
        </div>
        <div className="bg-white rounded-2xl border-2 border-emerald-100 p-6 mb-8">
          <h2 className="text-sm font-bold text-emerald-700 mb-4">👀 Preview Kotoba</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {preview.map((k) => <div key={k.id} className="aspect-square bg-emerald-50 rounded-xl flex items-center justify-center text-sm font-bold text-emerald-900 p-1 text-center break-all">{k.word}</div>)}
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-sm font-bold text-emerald-700 mb-3">🎮 Pilih Mode Latihan</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link href={`/kotoba/latihan/${encodeURIComponent(categoryName)}`} className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-2xl p-5 shadow-lg"><div className="text-3xl mb-2">📖</div><div className="font-bold text-lg">Mode Normal</div><div className="text-xs text-emerald-100">Semua kotoba urut dari awal.</div><div className="mt-3 text-sm font-semibold">Mulai →</div></Link>
            <Link href={`/kotoba/latihan/${encodeURIComponent(categoryName)}?acak=1`} className="bg-gradient-to-br from-rose-500 to-rose-700 text-white rounded-2xl p-5 shadow-lg"><div className="text-3xl mb-2">🔀</div><div className="font-bold text-lg">Mode Acak</div><div className="text-xs text-rose-100">Kotoba diacak.</div><div className="mt-3 text-sm font-semibold">Mulai →</div></Link>
          </div>
        </div>
      </div>
    </div>
  );
}