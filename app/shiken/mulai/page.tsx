// app/shiken/mulai/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import soalData from "@/data/shiken-questions.json"; // Pastikan file JSON ini ada
import { triggerFireAnimationIfNewDay } from "@/utils/streakEngine";
import { addMissionProgress } from "@/utils/missionEngine";
import { checkKanjiAchievements } from "@/utils/checkAchievements";

type Question = {
  id: number;
  question: string;
  options: string[];
  answer: number;
};

function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function ShikenContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jumlahSoal = parseInt(searchParams.get("soal") || "10", 10);
  const isSimulasiJFT = jumlahSoal === 50;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [gameState, setGameState] = useState<"playing" | "result">("playing");
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  // Timer (khusus simulasi JFT)
  const [timeLeft, setTimeLeft] = useState(isSimulasiJFT ? 70 * 60 : null);

  useEffect(() => {
    // Ambil soal acak sesuai jumlah yang dipilih
    const randomized = shuffle(soalData).slice(0, jumlahSoal);
    setQuestions(randomized);
  }, [jumlahSoal]);

  // Timer Logic
  useEffect(() => {
    if (timeLeft === null || gameState !== "playing") return;
    if (timeLeft <= 0) {
      setGameState("result");
      triggerFireAnimationIfNewDay();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  if (questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Memuat soal...</div>;
  }

  const current = questions[index];
  const progress = ((index + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  const handleSelect = (optIndex: number) => {
    setSelected(optIndex);
    setAnswers((prev) => ({ ...prev, [current.id]: optIndex }));
  };

  const handleNext = () => {
    if (index + 1 >= questions.length) {
      setGameState("result");
      triggerFireAnimationIfNewDay();
      addMissionProgress("session_complete", 1);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(answers[questions[index + 1].id] ?? null);
  };

  const handlePrev = () => {
    if (index === 0) return;
    setIndex((i) => i - 1);
    setSelected(answers[questions[index - 1].id] ?? null);
  };

  const handleFinishEarly = () => {
    setGameState("result");
    triggerFireAnimationIfNewDay();
    addMissionProgress("session_complete", 1);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` 
      : `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (gameState === "result") {
    const score = questions.reduce((acc, q) => acc + (answers[q.id] === q.answer ? 1 : 0), 0);
    const nilaiAkhir = Math.round((score / questions.length) * 100);
    
    // Cek Achievement Ujian
    try {
      const stats = JSON.parse(localStorage.getItem("kanjiAchievements") || "{}");
      const unlocked = stats.unlocked || [];
      const unlock = (id: string) => { if (!unlocked.includes(id)) unlocked.push(id); };
      
      unlock("mode_ujian_1");
      if (nilaiAkhir >= 80) unlock("mode_ujian_2");
      if (nilaiAkhir === 100) unlock("mode_ujian_3");
      
      localStorage.setItem("kanjiAchievements", JSON.stringify({ ...stats, unlocked }));
      checkKanjiAchievements();
    } catch (e) {}

    // Simpan rekor jika simulasi
    if (isSimulasiJFT) {
      const currentHigh = parseInt(localStorage.getItem("examHighScore") || "0", 10);
      if (nilaiAkhir > currentHigh) {
        localStorage.setItem("examHighScore", nilaiAkhir.toString());
      }
    }

    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="text-6xl mb-4">{nilaiAkhir >= 70 ? "🎉" : "💪"}</div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Hasil Ujian</h1>
            <p className="text-slate-500 mb-6">
              {isSimulasiJFT ? "Simulasi JFT" : "Ujian"} • {questions.length} Soal
            </p>
            
            <div className="flex justify-center gap-8 my-6">
               <div>
                  <div className="text-sm text-slate-500 mb-1">Jawaban Benar</div>
                  <div className="text-2xl font-bold text-slate-800">{score} / {questions.length}</div>
               </div>
               <div>
                  <div className="text-sm text-slate-500 mb-1">Nilai Akhir</div>
                  <div className={`text-6xl font-black ${nilaiAkhir >= 70 ? "text-emerald-500" : "text-rose-500"}`}>
                    {nilaiAkhir}
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {questions.map((q, i) => {
              const userAnswer = answers[q.id];
              const isCorrect = userAnswer === q.answer;
              const isSkipped = userAnswer === undefined;

              return (
                <div key={q.id} className={`bg-white rounded-2xl p-5 border-2 shadow-sm ${isSkipped ? "border-slate-200" : isCorrect ? "border-emerald-200" : "border-rose-200"}`}>
                  <div className="flex gap-4">
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${isSkipped ? "bg-slate-300" : isCorrect ? "bg-emerald-500" : "bg-rose-500"}`}>
                      {isSkipped ? "-" : isCorrect ? "✓" : "✗"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 mb-3">{i + 1}. {q.question}</h3>
                      <div className="space-y-2 text-sm">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = userAnswer === optIdx;
                          const isKey = q.answer === optIdx;
                          
                          let bgClass = "bg-slate-50";
                          if (isKey) bgClass = "bg-emerald-100 border border-emerald-300 font-semibold text-emerald-800";
                          else if (isSelected && !isKey) bgClass = "bg-rose-100 border border-rose-300 text-rose-800";

                          return (
                            <div key={optIdx} className={`p-2 rounded-lg ${bgClass}`}>
                              {String.fromCharCode(65 + optIdx)}. {opt}
                              {isKey && <span className="ml-2 text-xs font-bold text-emerald-600">(Kunci)</span>}
                              {isSelected && !isKey && <span className="ml-2 text-xs font-bold text-rose-600">(Jawabanmu)</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pb-10">
            <button onClick={() => window.location.reload()} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-xl font-bold shadow-md transition">
              🔄 Ulangi Ujian
            </button>
            <Link href="/shiken" className="flex-1 bg-white border-2 border-slate-200 text-slate-700 text-center py-3 rounded-xl font-bold transition">
              ← Kembali ke Menu Shiken
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 relative">
      
      {/* Header Timer & Progress */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <button onClick={() => setShowExitConfirm(true)} className="text-slate-500 hover:text-rose-600 font-bold transition flex items-center gap-1">
            ← Keluar
          </button>
          
          {timeLeft !== null && (
            <div className={`font-mono font-bold text-xl px-4 py-2 rounded-xl ${timeLeft < 300 ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-blue-50 text-blue-600"}`}>
              ⏱️ {formatTime(timeLeft)}
            </div>
          )}

          <div className="text-sm font-bold text-slate-500">
            {index + 1} / {questions.length}
          </div>
        </div>

        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8 mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">{current.question}</h2>
          
          <div className="space-y-3">
            {current.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selected === i
                    ? "border-blue-500 bg-blue-50 font-semibold text-blue-900 shadow-sm"
                    : "border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span className={`inline-block w-6 h-6 rounded-full text-center text-sm font-bold mr-3 ${
                  selected === i ? "bg-blue-200 text-blue-800" : "bg-slate-200 text-slate-600"
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between gap-3 pb-10">
          <button onClick={handlePrev} disabled={index === 0} className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold disabled:opacity-50 transition">
            ← Sebelumnya
          </button>
          
          <div className="flex gap-2">
            <button onClick={handleFinishEarly} className="px-4 py-3 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition">
              Selesai
            </button>
            <button onClick={handleNext} disabled={selected === null} className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50 transition active:scale-95">
              {index + 1 === questions.length ? "Lihat Hasil" : "Selanjutnya →"}
            </button>
          </div>
        </div>
      </div>

      {/* Pop-up Konfirmasi Keluar */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Keluar Ujian?</h3>
            <p className="text-slate-500 text-sm mb-6">
              Progres ujianmu saat ini tidak akan disimpan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowExitConfirm(false)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl transition">
                Batal
              </button>
              <button 
                onClick={() => {
                  setShowExitConfirm(false); // 🆕 Tutup pop-up dulu sebelum pindah
                  router.push("/shiken");
                }} 
                className="flex-1 bg-rose-500 text-white font-bold py-3 rounded-xl transition"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🆕 Wrapper dengan Key untuk mereset state saat pindah ujian
function ShikenWrapper() {
  const searchParams = useSearchParams();
  const soal = searchParams.get("soal");
  return <ShikenContent key={soal || "default"} />;
}

export default function ShikenMulaiPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Memuat...</div>}>
      <ShikenWrapper />
    </Suspense>
  );
}