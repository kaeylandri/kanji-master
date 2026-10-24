// app/kotoba/latihan/[kategori]/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { triggerFireAnimationIfNewDay } from "@/utils/streakEngine";
import { addMissionProgress } from "@/utils/missionEngine";
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

function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const renderWithFurigana = (word: string, reading: string) => {
  const hasKanji = /[\u4e00-\u9faf]/.test(word);
  if (!hasKanji) {
    return <span className="text-6xl font-bold text-emerald-900">{word}</span>;
  }

  return (
    <ruby className="text-6xl font-bold text-emerald-900 leading-tight">
      {word}
      <rt className="text-base text-emerald-600 font-normal tracking-widest mt-2">
        {reading}
      </rt>
    </ruby>
  );
};

function LatihanKotobaContent() {
  const params = useParams();
  const kategori = decodeURIComponent(params.kategori as string);
  const searchParams = useSearchParams();
  const isRandomMode = searchParams.get("acak") === "1";

  const [kotobaList, setKotobaList] = useState<Kotoba[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [wrongNotif, setWrongNotif] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [loading, setLoading] = useState(true);

  const [hintsLeft, setHintsLeft] = useState(3);
  const [wasHinted, setWasHinted] = useState(false);
  
  const [inventory, setInventory] = useState<any>({});
  const [revealActive, setRevealActive] = useState(false);
  const [revealTimeLeft, setRevealTimeLeft] = useState(0);

  useEffect(() => {
    // 🆕 Panggil fungsi api DI SINI (saat halaman pertama kali dimuat)
    triggerFireAnimationIfNewDay();
  }, []);

  useEffect(() => {
    setLoading(true);
    
    const apiUrl = isRandomMode ? "/api/kotoba/semua" : `/api/kotoba/${encodeURIComponent(kategori)}`;
    
    fetch(apiUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`Gagal ambil data dari ${apiUrl}`);
        return r.json();
      })
      .then((data: Kotoba[]) => {
        if (data && data.length > 0) {
          if (isRandomMode) {
            const shuffled = shuffle(data);
            setKotobaList(shuffled.slice(0, 50));
          } else {
            setKotobaList(data);
          }
        } else {
          setKotobaList([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat kotoba:", err);
        setKotobaList([]);
        setLoading(false);
      });

    setInventory(getInventory());
    window.addEventListener("inventoryUpdated", () => setInventory(getInventory()));
    
    return () => {
      window.removeEventListener("inventoryUpdated", () => setInventory(getInventory()));
    }
  }, [kategori, isRandomMode]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (!revealActive) return;
    if (revealTimeLeft <= 0) {
      setRevealActive(false);
      return;
    }
    const timer = setInterval(() => setRevealTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [revealActive, revealTimeLeft]);

  const handleUseHint = () => {
    if (useItem("hint")) {
      setHintsLeft(prev => prev + 1);
      setInventory(getInventory());
      triggerToast("Berhasil menambah jatah intip! 💡", "success");
    } else {
      triggerToast("Kamu tidak punya item Intip Jawaban!", "error");
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="text-emerald-600 text-xl animate-pulse">🌸 Memuat kotoba...</div>
      </div>
    );
  }

  if (kotobaList.length === 0) {
    const backLink = isRandomMode ? "/belajar/kotoba" : `/kotoba/kategori/${encodeURIComponent(kategori)}`;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 p-6 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h1 className="text-2xl font-bold text-emerald-900 mb-2">Data Kotoba Belum Tersedia</h1>
        <p className="text-emerald-600 mb-6">Maaf, latihan ini belum bisa dimulai karena data kotoba masih kosong. Pastikan API `/api/kotoba/semua` sudah berfungsi.</p>
        <Link href={backLink} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-md transition">
          ← Kembali
        </Link>
      </div>
    );
  }

  if (finished) {
    const total = stats.correct + stats.wrong;
    const accuracy = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
    const backLink = isRandomMode ? "/belajar/kotoba" : `/kotoba/kategori/${encodeURIComponent(kategori)}`;

    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-100 p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-emerald-900 mb-2">Latihan Selesai!</h1>
          <p className="text-emerald-600 mb-6 text-sm">Kamu sudah melewati semua {kotobaList.length} kotoba</p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
              <div className="text-2xl font-bold text-emerald-600">{stats.correct}</div>
              <div className="text-xs text-emerald-700">Benar</div>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3">
              <div className="text-2xl font-bold text-rose-600">{stats.wrong}</div>
              <div className="text-xs text-rose-700">Salah</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3">
              <div className="text-2xl font-bold text-blue-600">{accuracy}%</div>
              <div className="text-xs text-blue-700">Akurasi</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500 to-teal-700 text-white rounded-2xl p-4 mb-6 shadow-md">
             <div className="text-sm uppercase tracking-wider mb-1">Waktu Pengerjaan</div>
             <div className="text-2xl font-bold">{Math.floor(elapsed/60)}m {elapsed%60}s</div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                if (isRandomMode) window.location.reload();
                else {
                  setIndex(0); setInput(""); setFlipped(false); setStats({ correct: 0, wrong: 0 }); setFinished(false); setElapsed(0); setIsRunning(true); setHintsLeft(3); setWasHinted(false); setRevealActive(false);
                }
              }}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-700 text-white py-3 rounded-xl font-bold shadow-md transition active:scale-95"
            >
              🔄 Ulangi Latihan
            </button>
            <Link href={backLink} className="block w-full bg-white border-2 border-emerald-200 text-emerald-700 py-3 rounded-xl font-semibold transition">
              ← Kembali
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const current = kotobaList[index];
  const normalize = (s: string) => s.toLowerCase().replace(/[\s,.\-]/g, "").trim();

  const isCorrect = () => {
    const userInput = normalize(input);
    if (!userInput) return false;

    if (userInput === normalize(current.reading)) return true;

    const meanings = current.meaning.split(/[\/,]/).map((m: string) => normalize(m));
    if (meanings.includes(userInput)) return true;

    if (userInput === normalize(current.meaning)) return true;

    return false;
  };

  const checkAnswer = () => {
    if (!input.trim()) return;
    if (isCorrect()) {
      setFlipped(true);
      setWrongNotif(false);
      
      // 🆕 HAPUS triggerFireAnimationIfNewDay() dari sini

      if (!wasHinted) {
        setStats((s) => ({ ...s, correct: s.correct + 1 }));
        try {
          const saved = JSON.parse(localStorage.getItem("uniqueKotobaAnswered") || "[]");
          if (!saved.includes(current.id)) {
            saved.push(current.id);
            localStorage.setItem("uniqueKotobaAnswered", JSON.stringify(saved));
            
            checkKotobaAchievements();
            addMissionProgress("kotoba_correct", 1);
          }
        } catch (e) {}
      } else {
        setStats((s) => ({ ...s, wrong: s.wrong + 1 }));
      }
    } else {
      setWrongNotif(true);
      setStats((s) => ({ ...s, wrong: s.wrong + 1 }));
      setTimeout(() => setWrongNotif(false), 1500);
    }
  };

  const handleHint = () => {
    if (flipped) return;
    if (isRandomMode && hintsLeft <= 0) return;

    setFlipped(true);
    setWasHinted(true);
    setStats((s) => ({ ...s, wrong: s.wrong + 1 }));

    if (isRandomMode) {
      setHintsLeft((prev) => prev - 1);
    }
  };

  const next = () => {
    if (index + 1 >= kotobaList.length) { setFinished(true); setIsRunning(false); return; }
    setFlipped(false); setInput(""); setWrongNotif(false); setWasHinted(false); setIndex((i) => i + 1);
  };

  const prev = () => {
    if (index === 0) return;
    setFlipped(false); 
    setInput(""); 
    setWrongNotif(false); 
    setIndex((i) => i - 1); 
  };

  const progress = ((index + 1) / kotobaList.length) * 100;
  const backLink = isRandomMode ? "/belajar/kotoba" : `/kotoba/kategori/${encodeURIComponent(kategori)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 relative overflow-hidden">
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-8 flex flex-col min-h-screen">
        <header className="flex justify-between items-center mb-6">
          <Link href={backLink} className="text-emerald-700 font-semibold transition">
            ← Kembali
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="bg-emerald-600 text-white rounded-full px-3 py-1 font-mono font-bold">{Math.floor(elapsed/60)}:{(elapsed%60).toString().padStart(2,'0')}</span>
            <span className="bg-white border border-emerald-200 rounded-full px-3 py-1 text-emerald-700 shadow-sm">✓ {stats.correct}</span>
            <span className="bg-white border border-rose-200 rounded-full px-3 py-1 text-rose-600 shadow-sm">✗ {stats.wrong}</span>
          </div>
        </header>

        <div className="flex justify-center gap-3 mb-4">
          <button 
            onClick={handleUseHint}
            disabled={inventory.hint === 0}
            className="flex items-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-4 py-2 rounded-full font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            💡 Intip ({inventory.hint || 0})
          </button>
          <button 
            onClick={handleUseReveal}
            disabled={inventory.reveal === 0 || revealActive}
            className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-full font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            🪄 Reveal ({inventory.reveal || 0})
          </button>
        </div>

        {revealActive && (
          <div className="w-full bg-purple-100 text-purple-700 font-bold py-2 rounded-xl text-center animate-pulse mb-4 border border-purple-200">
            🪄 Full Reveal Aktif: {Math.floor(revealTimeLeft / 60)}:{(revealTimeLeft % 60).toString().padStart(2, '0')}
          </div>
        )}

        <div className="text-center mb-4">
          {isRandomMode && (
            <div className="flex justify-center items-center gap-2">
               <span className="inline-block text-xs bg-rose-100 text-rose-600 px-3 py-1 rounded-full border border-rose-200 font-semibold">
                🔀 Mode Acak
              </span>
              <span className={`inline-block text-xs px-3 py-1 rounded-full border font-semibold ${hintsLeft > 0 ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-gray-100 text-gray-400 border-gray-200"}`}>
                💡 Sisa Intip: {hintsLeft}
              </span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-emerald-700 mb-2">
            <span className="font-semibold">Kartu {index + 1} dari {kotobaList.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-md h-60 [perspective:1200px]">
            <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
              <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl border-4 border-emerald-200 flex flex-col items-center justify-center [backface-visibility:hidden]">
                <div className="select-none text-center">
                  {renderWithFurigana(current.word, current.reading)}
                </div>
                {revealActive && (
                  <div className="mt-4 text-xl text-purple-600 font-bold animate-in fade-in">
                    {current.reading} - {current.meaning}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl shadow-2xl flex flex-col items-center justify-center gap-2 p-6 [transform:rotateY(180deg)] [backface-visibility:hidden] text-white">
                <div className="text-center">
                  <div className="text-xs text-white/70 uppercase tracking-wider mb-1">Cara Baca</div>
                  <div className="text-3xl font-bold">{current.reading}</div>
                </div>
                <div className="w-16 h-px bg-white/30 my-2" />
                <div className="text-center">
                  <div className="text-xs text-white/70 uppercase tracking-wider mb-1">Arti</div>
                  <div className="text-xl font-semibold">
                    {current.meaning.replace(/\//g, " atau ")}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {!flipped && (
            <button
              onClick={handleHint}
              disabled={isRandomMode && hintsLeft <= 0}
              className="mt-4 flex items-center gap-2 text-sm font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 disabled:bg-gray-100 disabled:text-gray-400 px-4 py-2 rounded-full transition border border-amber-200 disabled:border-gray-200"
            >
              💡 Intip Jawaban {isRandomMode && `(${hintsLeft} tersisa)`}
            </button>
          )}
        </div>

        <div className="mt-8 mb-4">
          {!flipped ? (
            <div className="bg-white rounded-2xl shadow-lg border-2 border-emerald-100 p-5 space-y-3">
              <label className="block text-sm font-semibold text-emerald-700 text-center">✏️ Ketik cara baca atau arti</label>
              <input
                className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-xl px-4 py-3 text-center text-lg text-emerald-900 focus:outline-none focus:border-emerald-500 transition"
                placeholder="Ketik jawaban..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
                autoFocus
              />
              <button onClick={checkAnswer} disabled={!input.trim()} className="w-full bg-gradient-to-r from-emerald-500 to-teal-700 text-white py-3 rounded-xl font-bold shadow-md transition disabled:opacity-50">
                🎯 Cek Jawaban
              </button>
              {wrongNotif && <div className="text-center text-rose-600 font-bold animate-pulse">❌ Salah, coba lagi!</div>}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border-2 border-emerald-100 p-5 space-y-3">
              <div className="text-center text-emerald-600 font-bold text-lg">
                {wasHinted ? "👀 Kamu mengintip jawaban ini." : "✅ Benar! 🎉"}
              </div>
              <button onClick={next} className="w-full bg-gradient-to-r from-emerald-500 to-teal-700 text-white py-3 rounded-xl font-bold shadow-md transition">
                {index + 1 >= kotobaList.length ? "🏁 Selesai — Lihat Hasil" : "Lanjut →"}
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-3">
         <button onClick={prev} disabled={index === 0} className="flex-1 py-2 bg-white border-2 border-emerald-200 text-emerald-700 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50">
            ← Sebelumnya
          </button>
          <button onClick={next} className="flex-1 py-2 bg-white border-2 border-emerald-200 text-emerald-700 rounded-xl font-semibold transition">
            Selanjutnya →
          </button>
        </div>
      </div>
    </div>
  );
}

function Wrapper() {
  const searchParams = useSearchParams();
  return <LatihanKotobaContent key={searchParams.get("acak") || "normal"} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-emerald-600">Memuat...</div>}>
      <Wrapper />
    </Suspense>
  );
}