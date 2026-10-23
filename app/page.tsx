// app/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";

export default function LandingPage() {
  const [profile, setProfile] = useState({ name: "Pengguna Baru", avatar: "" });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("userProfile") || "null");
      if (saved) setProfile(saved);
    } catch (e) {}
  }, []);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Tombol Profil (Kanan Atas) */}
        <div className="flex justify-end mb-8">
          <Link
            href="/profil"
            className="flex items-center gap-3 bg-white pl-2 pr-5 py-2 rounded-full shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow-md text-slate-700 font-bold transition group"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
              {profile.avatar ? (
                <img src={profile.avatar} alt="PP" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
              )}
            </div>
            <span>{profile.name}</span>
          </Link>
        </div>

        {/* Header */}
        <header className="text-center mb-12">
          <div className="text-6xl mb-4">🎌</div>
          <h1 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">
            Kanji Master
          </h1>
          <p className="text-slate-500 text-lg">
            Pilih mode belajar yang ingin kamu tekuni hari ini.
          </p>
        </header>

        {/* Tombol Misi, Shop, dan Shiken */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link 
            href="/missions" 
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-300 transition group flex items-center gap-4"
          >
            <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition">🎯</div>
            <div>
              <div className="font-bold text-slate-800 text-lg">Papan Misi</div>
              <div className="text-sm text-slate-500">Selesaikan misi untuk EXP & Koin.</div>
            </div>
          </Link>

          <Link 
            href="/shop" 
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-pink-300 transition group flex items-center gap-4"
          >
            <div className="w-14 h-14 bg-pink-50 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition">🌸</div>
            <div>
              <div className="font-bold text-slate-800 text-lg">Sakura Shop</div>
              <div className="text-sm text-slate-500">Tukar koin dengan kosmetik.</div>
            </div>
          </Link>

          {/* Tombol Shiken (Ujian) */}
          <Link 
            href="/shiken" 
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition group flex items-center gap-4"
          >
            <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition">📝</div>
            <div>
              <div className="font-bold text-slate-800 text-lg">Shiken (Ujian)</div>
              <div className="text-sm text-slate-500">Uji kemampuanmu di sini.</div>
            </div>
          </Link>
        </div>

        {/* Menu Belajar Utama */}
        <div className="grid sm:grid-cols-2 gap-6">
          <Link
            href="/belajar/kanji"
            className="group bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 active:scale-95 flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform shadow-inner">
              📚
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Belajar Kanji</h2>
            <p className="text-sm text-slate-500 mb-6">
              Latihan flashcard, ujian soal, dan mode survival.
            </p>
            <div className="mt-auto text-blue-600 font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
              Mulai Belajar →
            </div>
          </Link>

          <Link
            href="/belajar/kotoba"
            className="group bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 active:scale-95 flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform shadow-inner">
              📖
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Belajar Kotoba</h2>
            <p className="text-sm text-slate-500 mb-6">
              Perluas kosakata dengan metode spaced repetition.
            </p>
            <div className="mt-auto text-emerald-600 font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
              Mulai Belajar →
            </div>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}