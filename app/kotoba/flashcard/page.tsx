// app/kotoba/flashcard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateMemory, isDueForReview } from "@/utils/memoryEngine";
import { checkKotobaAchievements } from "@/utils/checkAchievements";
import { getInventory, useItem } from "@/utils/luckyEngine";
import { triggerToast } from "@/utils/toast";

type Kotoba = {
  id: number;
  category: string;
  word: string;
  reading: string;
  meaning: string;
};

type Option = {
  id: number;
  text: string;
  isCorrect: boolean;
};

export default function SmartFlashcardKotobaPage() {
  const router = useRouter();
  const [kotobaList, setKotobaList] = useState<Kotoba[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // State untuk Kuis Pilihan Ganda
  const [options, setOptions] = useState<Option[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // State untuk Item & Full Reveal
  const [inventory, setInventory] = useState<any>({});
  const [revealActive, setRevealActive] = useState(false);
  const [revealTimeLeft, setRevealTimeLeft] = useState(0);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/api/kotoba/semua");
        const data: Kotoba[] = await res.json();
        
        // 🆕 Filter menggunakan Promise.all karena isDueForReview sekarang sync tapi berbasis cache
        // (Kita pakai versi sinkron karena data SR sudah ada di localStorage)
        const dueKotoba = data.filter((k) => isDueForReview(k.id, "kotoba"));
        
        const sessionData = dueKotoba.length > 0 
          ? dueKotoba.slice(0, 15) 
          : data.sort(() => 0.5 - Math.random()).slice(0, 10);
        
        setKotobaList(sessionData);
        setLoading(false);
      } catch (err) {
        console.error("Gagal memuat kotoba:", err);
        setLoading(false);
      }
    };
    
    loadData();

    setInventory(getInventory());
    window.addEventListener("inventoryUpdated", () => setInventory(getInventory()));
  }, []);

  // Timer Full Reveal
  useEffect(() => {
    if (!revealActive) return;
    if (revealTimeLeft <= 0) {
      setRevealActive(false);
      return;
    }
    const timer = setInterval(() => setRevealTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [revealActive, revealTimeLeft]);

  const handleUseReveal = () => {
    if (useItem("reveal")) {
      setRevealActive(true);
      setRevealTimeLeft(170);
      setInventory(getInventory());
      triggerToast("🪄 Full Reveal Aktif selama 2:50!", "success");
    } else {
      triggerToast("Kamu tidak punya item Full Reveal!", "error");
    }
  };

  // Buat 4 Opsi Jawaban
  useEffect(() => {
    if (kotobaList.length === 0) return;
    const current = kotobaList[currentIndex];
    
    const wrongOptions = kotobaList
      .filter(k => k.id !== current.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(k => ({ id: k.id, text: k.meaning, isCorrect: false }));

    const correctOption = { id: current.id, text: current.meaning, isCorrect: true };
    const allOptions = [...wrongOptions, correctOption].sort(() => 0.5 - Math.random());
    
    setOptions(allOptions);
    setIsAnswered(false);
  }, [currentIndex, kotobaList]);

  const handleSelectOption = (correct: boolean) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setIsCorrect(correct);
  };

  // 🆕 handleRate menjadi async
  const handleRate = async (rating: "forgot" | "hard" | "good" | "easy") => {
    const current = kotobaList[currentIndex];
    
    // Simpan ke database & cache
    await updateMemory(current.id, "kotoba", rating);
    
    try {
      const saved = JSON.parse(localStorage.getItem("uniqueKotobaAnswered") || "[]");
      if (!saved.includes(current.id)) {
        saved.push(current.id);
        localStorage.setItem("uniqueKotobaAnswered", JSON.stringify(saved));
      }
    } catch (e) {}

    checkKotobaAchievements();

    if (currentIndex + 1 >= kotobaList.length) {
      setShowSuccessModal(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 text-emerald-400 flex items-center justify-center">Menyiapkan sesi hafalan...</div>;
  }

  if (kotobaList.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold mb-4">Tidak ada jadwal ulang hari ini! 🎉</h1>
        <p className="text-slate-400 mb-6">Kamu sudah menyelesaikan semua target.</p>
        <Link href="/belajar/kotoba" className="bg-emerald-600 px-6 py-3 rounded-xl font-bold">Kembali</Link>
      </div>
    );
  }

  const current = kotobaList[currentIndex];
  const progress = ((currentIndex + 1) / kotobaList.length) * 100;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col relative overflow-hidden">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col z-10">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/belajar/kotoba" className="text-emerald-400 hover:text-emerald-300 font-semibold">
            ← Keluar
          </Link>
          <span className="text-sm font-bold text-slate-400">
            Kartu {currentIndex + 1} dari {kotobaList.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        {/* Tombol Full Reveal */}
        <div className="mb-4">
          {!revealActive && inventory.reveal > 0 && (
            <button 
              onClick={handleUseReveal} 
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
            >
              🪄 Gunakan Full Reveal (Tersisa: {inventory.reveal})
            </button>
          )}

          {revealActive && (
            <div className="w-full bg-purple-900/50 border border-purple-500/50 text-purple-300 font-bold py-3 rounded-xl text-center animate-pulse">
              🪄 Full Reveal Aktif: {Math.floor(revealTimeLeft / 60)}:{(revealTimeLeft % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>

        {/* Flashcard */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700 flex flex-col items-center text-center">
            
            <div className="text-5xl font-bold text-white mb-2">{current.word}</div>
            
            {revealActive && (
              <div className="text-lg text-purple-300 font-semibold mb-4 animate-in fade-in slide-in-from-top-2">
                Arti: {current.meaning}
              </div>
            )}

            {!revealActive && (
              <div className="text-xl text-emerald-400 font-semibold mb-6">{current.reading}</div>
            )}

            {/* Kuis Pilihan Ganda */}
            {!isAnswered && (
              <div className="w-full grid grid-cols-1 gap-3 mt-4">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.isCorrect)}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white py-4 rounded-xl font-semibold transition"
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            )}

            {/* Hasil Kuis & Tombol Penilaian */}
            {isAnswered && (
              <div className="w-full mt-4 animate-in fade-in duration-300">
                <div className={`text-2xl font-bold mb-2 ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
                  {isCorrect ? "✅ Jawaban Benar!" : "❌ Jawaban Salah!"}
                </div>
                <p className="text-slate-400 mb-6">
                  Arti yang benar: <strong className="text-white">{current.meaning}</strong>
                </p>

                <p className="text-sm text-slate-500 mb-3">Seberapa mudah kamu mengingatnya?</p>
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button onClick={() => handleRate("forgot")} className="bg-rose-500/20 text-rose-400 border border-rose-500/50 py-3 rounded-xl font-bold transition">😵 Lupa</button>
                  <button onClick={() => handleRate("hard")} className="bg-amber-500/20 text-amber-400 border border-amber-500/50 py-3 rounded-xl font-bold transition">😓 Sulit</button>
                  <button onClick={() => handleRate("good")} className="bg-blue-500/20 text-blue-400 border border-blue-500/50 py-3 rounded-xl font-bold transition">🙂 Ingat</button>
                  <button onClick={() => handleRate("easy")} className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 py-3 rounded-xl font-bold transition">😎 Mudah</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Selesai */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-slate-800 border-2 border-emerald-500/50 rounded-3xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-300">
            <div className="text-7xl mb-4 animate-bounce">🏆</div>
            <h2 className="text-3xl font-bold text-white mb-2">Sesi Selesai!</h2>
            <p className="text-slate-400 mb-8">
              Luar biasa! Kamu sudah menyelesaikan semua kartu di sesi ini.
            </p>
            <button
              onClick={() => router.push("/belajar/kotoba")}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-4 rounded-xl shadow-lg transition active:scale-95"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}