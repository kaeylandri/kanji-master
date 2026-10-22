"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import soalData from "@/data/questions.json";
import RevealButton from "@/components/RevealButton"; // 🆕

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

export default function UjianPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [gameState, setGameState] = useState<"playing" | "result">("playing");
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // 🆕 State Full Reveal
  const [revealActive, setRevealActive] = useState(false);

  useEffect(() => {
    const randomized = shuffle(soalData).slice(0, 20);
    setQuestions(randomized);
  }, []);

  if (questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-blue-50 text-blue-600">Memuat soal...</div>;
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
  };

  if (gameState === "result") {
    const score = questions.reduce((acc, q) => {
      return acc + (answers[q.id] === q.answer ? 1 : 0);
    }, 0);
    const nilaiAkhir = Math.round((score / questions.length) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 bg-white p-8 rounded-3xl shadow-sm border-2 border-blue-100 relative">
            <div className="text-6xl mb-4">📝</div>
            <h1 className="text-3xl font-bold text-blue-900 mb-2">Hasil Ujian Kanji</h1>
            
            <div className="flex justify-center gap-8 my-6">
               <div>
                  <div className="text-sm text-blue-600 mb-1">Jawaban Benar</div>
                  <div className="text-2xl font-bold text-blue-800">{score} / {questions.length}</div>
               </div>
               <div>
                  <div className="text-sm text-blue-600 mb-1">Nilai Akhir</div>
                  <div className="text-5xl font-black text-blue-500">{nilaiAkhir}</div>
               </div>
            </div>
            
            {nilaiAkhir === 100 ? (
              <p className="text-blue-600 font-semibold">Sempurna! Kamu hebat! 🎉</p>
            ) : nilaiAkhir >= 70 ? (
              <p className="text-blue-600 font-semibold">Bagus! Terus tingkatkan! 👍</p>
            ) : (
              <p className="text-rose-500 font-semibold">Jangan menyerah, ayo coba lagi! 💪</p>
            )}
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
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white py-3 rounded-xl font-bold shadow-md transition"
            >
              🔄 Ulangi Ujian (Soal Baru)
            </button>
            <Link
              href="/belajar/kanji"
              className="flex-1 bg-white border-2 border-blue-200 hover:bg-blue-50 text-blue-700 text-center py-3 rounded-xl font-bold transition"
            >
              ← Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6 relative">
      
      <div className="max-w-2xl mx-auto flex justify-between items-center mb-6">
        <button 
          onClick={() => setShowExitConfirm(true)} 
          className="flex items-center gap-2 text-blue-700 hover:text-blue-900 font-semibold transition bg-white px-4 py-2 rounded-full shadow-sm border border-blue-100"
        >
          <span>←</span> Kembali
        </button>
        
        <button 
          onClick={handleFinishEarly}
          className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2 rounded-full font-bold shadow-md transition active:scale-95 text-sm"
        >
          🏁 Selesai Ujian
        </button>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* 🆕 Tombol Full Reveal */}
        <RevealButton onRevealActive={setRevealActive} />

        <div className="mb-8">
          <div className="flex justify-between text-sm font-bold text-blue-800 mb-2">
            <span>Soal {index + 1} dari {questions.length} (Terjawab: {answeredCount})</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border-2 border-blue-100 p-8 mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">{current.question}</h2>
          
          <div className="space-y-3">
            {current.options.map((opt, i) => {
              const isKey = i === current.answer;
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selected === i
                      ? "border-blue-500 bg-blue-50 font-semibold text-blue-900"
                      : revealActive && isKey
                      ? "border-purple-500 bg-purple-50 font-semibold text-purple-900" // 🆕 Highlight jawaban jika reveal aktif
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className={`inline-block w-6 h-6 rounded-full text-center text-sm font-bold mr-3 ${
                    selected === i 
                      ? "bg-blue-200 text-blue-800" 
                      : revealActive && isKey
                      ? "bg-purple-200 text-purple-800"
                      : "bg-slate-200 text-slate-600"
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between gap-3 pb-10">
          <button
            onClick={handlePrev}
            disabled={index === 0}
            className="px-6 py-3 bg-white border-2 border-blue-200 text-blue-700 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            ← Sebelumnya
          </button>
          <button
            onClick={handleNext}
            disabled={selected === null}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white py-3 rounded-xl font-bold shadow-md disabled:opacity-50 transition active:scale-95"
          >
            {index + 1 === questions.length ? "🏁 Selesai & Lihat Nilai" : "Selanjutnya →"}
          </button>
        </div>
      </div>

      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Keluar Ujian?</h3>
            <p className="text-slate-500 text-sm mb-6">
              Progres ujianmu saat ini tidak akan disimpan. Apakah kamu yakin ingin kembali ke dashboard?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowExitConfirm(false)} 
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition"
              >
                Batal
              </button>
              <button 
                onClick={() => router.push("/belajar/kanji")} 
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition"
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