// app/kanji/flashcard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateMemory, isDueForReview } from "@/utils/memoryEngine";
import { checkKanjiAchievements } from "@/utils/checkAchievements";
import { triggerToast } from "@/utils/toast";
import { triggerFireAnimationIfNewDay } from "@/utils/streakEngine"; // 🆕 Import

type Kanji = {
  id: number;
  character: string;
  hiragana: string;
  romaji: string | null;
  meaning: string;
};

type Option = {
  id: number;
  text: string;
  isCorrect: boolean;
};

export default function SmartFlashcardKanjiPage() {
  const router = useRouter();
  const [kanjiList, setKanjiList] = useState<Kanji[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [practiceMode, setPracticeMode] = useState(false);
  
  const [options, setOptions] = useState<Option[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    // 🆕 Panggil fungsi api DI SINI (saat halaman pertama kali dimuat)
    
  }, []);

  useEffect(() => {
    fetch("/api/categories/semua/kanji")
      .then((res) => res.json())
      .then((data: Kanji[]) => {
        const dueKanji = data.filter((k) => isDueForReview(k.id, "kanji"));
        
        if (dueKanji.length > 0) {
          setKanjiList(dueKanji.slice(0, 15));
        } else {
          setKanjiList([]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const startPracticeMode = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories/semua/kanji");
      if (!res.ok) throw new Error("Gagal ambil data");
      
      const data: Kanji[] = await res.json();
      
      const randomKanji = data.sort(() => 0.5 - Math.random()).slice(0, 10);
      
      setKanjiList(randomKanji);
      setPracticeMode(true);
      setCurrentIndex(0);
      setLoading(false);
    } catch (err) {
      console.error("Gagal memuat latihan bebas:", err);
      triggerToast("Gagal memuat data latihan.", "error");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (kanjiList.length === 0) return;
    const current = kanjiList[currentIndex];
    
    const wrongOptions = kanjiList
      .filter(k => k.id !== current.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(k => ({ id: k.id, text: k.meaning, isCorrect: false }));

    const correctOption = { id: current.id, text: current.meaning, isCorrect: true };
    const allOptions = [...wrongOptions, correctOption].sort(() => 0.5 - Math.random());
    
    setOptions(allOptions);
    setSelectedOption(null);
    setIsAnswered(false);
  }, [currentIndex, kanjiList]);

  const handleSelectOption = (optionId: number, correct: boolean) => {
    if (isAnswered) return;
    setSelectedOption(optionId);
    setIsAnswered(true);
    setIsCorrect(correct);
  };

  const handleRate = (rating: "forgot" | "hard" | "good" | "easy") => {
    const current = kanjiList[currentIndex];
    
    updateMemory(current.id, "kanji", rating);
    
    try {
      const saved = JSON.parse(localStorage.getItem("masteredKanji") || "[]");
      if (!saved.includes(current.id)) {
        saved.push(current.id);
        localStorage.setItem("masteredKanji", JSON.stringify(saved));
      }
    } catch (e) {}

    checkKanjiAchievements();

    if (currentIndex + 1 >= kanjiList.length) {
      setShowSuccessModal(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 text-blue-400 flex items-center justify-center">Menyiapkan sesi hafalan...</div>;
  }

  if (kanjiList.length === 0 && !practiceMode) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold mb-2">Tidak ada jadwal ulang hari ini!</h1>
        <p className="text-slate-400 mb-8 max-w-md">Kamu sudah menyelesaikan semua target SRS hari ini. Ingin tetap latihan?</p>
        
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button 
            onClick={startPracticeMode}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transition active:scale-95"
          >
            🎮 Latihan Bebas (10 Soal)
          </button>
          <Link href="/belajar/kanji" className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-xl transition">
            ← Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const current = kanjiList[currentIndex];
  const progress = ((currentIndex + 1) / kanjiList.length) * 100;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col relative overflow-hidden">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col z-10">
        
        <div className="flex justify-between items-center mb-6">
          <Link href="/belajar/kanji" className="text-blue-400 hover:text-blue-300 font-semibold">
            ← Keluar
          </Link>
          <span className="text-sm font-bold text-slate-400">
            Kartu {currentIndex + 1} dari {kanjiList.length}
            {practiceMode && " (Latihan Bebas)"}
          </span>
        </div>

        <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-8">
          <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700 flex flex-col items-center text-center">
            
            <div className="text-8xl font-bold text-white mb-2">{current.character}</div>
            <div className="text-xl text-blue-400 font-semibold mb-6">{current.hiragana}</div>

            {!isAnswered && (
              <div className="w-full grid grid-cols-1 gap-3 mt-4">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id, opt.isCorrect)}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white py-4 rounded-xl font-semibold transition"
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            )}

            {isAnswered && (
              <div className="w-full mt-4 animate-in fade-in duration-300">
                <div className={`text-2xl font-bold mb-2 ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
                  {isCorrect ? "✅ Jawaban Benar!" : "❌ Jawaban Salah!"}
                </div>
                <p className="text-slate-400 mb-6">
                  Jawaban yang benar adalah: <strong className="text-white">{current.meaning}</strong>
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

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-slate-800 border-2 border-blue-500/50 rounded-3xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-300">
            <div className="text-7xl mb-4 animate-bounce">🏆</div>
            <h2 className="text-3xl font-bold text-white mb-2">Sesi Selesai!</h2>
            <button
              onClick={() => router.push("/belajar/kanji")}
              className="w-full mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg transition"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}