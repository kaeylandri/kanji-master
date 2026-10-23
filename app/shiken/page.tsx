// app/shiken/page.tsx
"use client";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";

export default function ShikenPage() {
  const modes = [
    { id: 10, title: "Ujian Cepat", desc: "10 Soal Pilihan Ganda", icon: "⚡", color: "from-blue-400 to-blue-600" },
    { id: 15, title: "Ujian Santai", desc: "15 Soal Pilihan Ganda", icon: "☕", color: "from-emerald-400 to-emerald-600" },
    { id: 20, title: "Ujian Standar", desc: "20 Soal Pilihan Ganda", icon: "📝", color: "from-purple-400 to-purple-600" },
    { id: 25, title: "Ujian Menengah", desc: "25 Soal Pilihan Ganda", icon: "🎯", color: "from-amber-400 to-amber-600" },
    { id: 40, title: "Ujian Berat", desc: "40 Soal Pilihan Ganda", icon: "🔥", color: "from-rose-400 to-rose-600" },
    { id: 50, title: "Simulasi JFT", desc: "50 Soal • Waktu 70 Menit", icon: "⏱️", color: "from-indigo-500 to-indigo-700" },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">試験</div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Shiken (Ujian)</h1>
          <p className="text-slate-500">Pilih mode ujian yang ingin kamu kerjakan untuk mengukur kemampuanmu.</p>
        </div>

        {/* Grid Mode Ujian */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {modes.map((mode) => (
            <Link
              key={mode.id}
              href={`/shiken/mulai?soal=${mode.id}`}
              className={`bg-gradient-to-br ${mode.color} p-6 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group text-white`}
            >
              <div>
                <div className="text-3xl mb-2 bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  {mode.icon}
                </div>
                <h2 className="text-xl font-bold">{mode.title}</h2>
                <p className="text-white/80 text-sm mt-1">{mode.desc}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition">
                →
              </div>
            </Link>
          ))}
        </div>

      </div>
    </AppLayout>
  );
}