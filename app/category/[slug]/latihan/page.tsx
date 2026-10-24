// app/category/[slug]/latihan/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { triggerFireAnimationIfNewDay } from "@/utils/streakEngine";
import { checkKanjiAchievements } from "@/utils/checkAchievements";
import { addMissionProgress } from "@/utils/missionEngine";
import { getInventory, useItem } from "@/utils/luckyEngine";
import { triggerToast } from "@/utils/toast";

type Kanji = {
  id: number;
  character: string;
  hiragana: string;
  romaji: string | null;
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

function LatihanContent() {
  const params = useParams();
  const slug = params.slug as string;
  const searchParams = useSearchParams();
  const isRandomMode = searchParams.get("acak") === "1";

  const [kanjiList, setKanjiList] = useState<Kanji[]>([]);
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
    if (!slug) return;
    setLoading(true);
    
    // 🆕 Beri pengaman & endpoint yang benar
    const apiUrl = isRandomMode ? "/api/categories/semua/kanji" : `/api/categories/${slug}/kanji`;
    
    fetch(apiUrl)
      .then((r) => r.json())
      .then((data: Kanji[]) => {
        if (data && data.length > 0) {
          if (isRandomMode) {
            const shuffled = shuffle(data);
            setKanjiList(shuffled.slice(0, 50));
          } else {
            setKanjiList(data);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat kanji:", err);
        setLoading(false);
      });

    setInventory(getInventory());
    window.addEventListener("inventoryUpdated", () => setInventory(getInventory()));
  }, [slug, isRandomMode]);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-blue-600 text-xl animate-pulse">🌸 Memuat kanji...</div>
      </div>
    );
  }

  if (kanjiList.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-6 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h1 className="text-2xl font-bold text-blue-900 mb-2">Data Kanji Belum Tersedia</h1>
        <p className="text-blue-600 mb-6">Maaf, latihan ini belum bisa dimulai karena data kanji masih kosong.</p>
        <Link href={`/category/${slug}`} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-md transition">
          ← Kembali ke Persiapan
        </Link>
      </div>
    );
  }

  if (finished) {
    if (typeof window !== "undefined") {
      triggerFireAnimationIfNewDay();
    }

    if (typeof window !== "undefined" && isRandomMode) {
      const currentTime = localStorage.getItem("randomBestTime");
      if (!currentTime || elapsed < parseInt(currentTime, 10)) {
        localStorage.setItem("randomBestTime", elapsed.toString());
      }
      
      try {
        const statsAch = JSON.parse(localStorage.getItem("kanjiAchievements") || "{}");
        const unlocked = statsAch.unlocked || [];
        const acakSessions = statsAch.acakSessions || 0;
        
        const unlock = (id: string) => { if (!unlocked.includes(id)) unlocked.push(id); };
        
        unlock("mode_acak_1");
        if (kanjiList.length >= 50) unlock("mode_acak_2");
        
        const totalAnswered = stats.correct + stats.wrong;
        if (stats.correct === 50 && totalAnswered === 50) unlock("mode_acak_3");
        
        const newSessions = acakSessions + 1;
        if (newSessions >= 50) unlock("mode_acak_4");
        
        localStorage.setItem("kanjiAchievements", JSON.stringify({ ...statsAch, unlocked, acakSessions: newSessions }));
      } catch (e) {}
    }

    const total = stats.correct + stats.wrong;
    const accuracy = total > 0 ? Math.round((stats.correct / total) * 100) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden flex items-center justify-center p-6">
        <div className="absolute top-10 left-10 text-6xl opacity-10 select-none">🌸</div>
        <div className="absolute bottom-20 right-20 text-6xl opacity-10 select-none">🎌</div>

        <div className="relative z-10 bg-white rounded-3xl shadow-2xl border-2 border-blue-100 p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-blue-900 mb-2">Latihan Selesai!</h1>
          <p className="text-blue-600 mb-6 text-sm">Kamu sudah melewati semua {kanjiList.length} kanji</p>

          {isRandomMode && (
            <div className="inline-block text-xs bg-rose-100 text-rose-600 px-3 py-1 rounded-full border border-rose-200 font-semibold mb-4">
              🔀 Mode Acak
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-4">
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

          <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-2xl p-4 mb-6 shadow-md">
            <div className="flex items-center justify-center gap-3">
              <div className="text-3xl">⏱️</div>
              <div className="text-left">
                <div className="text-xs text-blue-100 uppercase tracking-wider">Waktu Pengerjaan</div>
                <div className="text-2xl font-bold tabular-nums">{formatDuration(elapsed)}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                if (isRandomMode) {
                  window.location.reload();
                  return;
                }
                setIndex(0);
                setInput("");
                setFlipped(false);
                setStats({ correct: 0, wrong: 0 });
                setFinished(false);
                setElapsed(0);
                setIsRunning(true);
                setHintsLeft(3);
                setWasHinted(false);
                setRevealActive(false);
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white py-3 rounded-xl font-bold shadow-md transition active:scale-95"
            >
              🔄 Ulangi Latihan
            </button>
            <Link href={`/category/${slug}`} className="block w-full bg-white border-2 border-blue-200 hover:bg-blue-50 text-blue-700 py-3 rounded-xl font-semibold transition">
              ← Kembali ke Persiapan
            </Link>
          </div>

          <p className="text-xs text-blue-400 mt-6">🌸 お疲れ様！ (Otsukaresama!) — Kerja bagus! 🌸</p>
        </div>
      </div>
    );
  }

  const current = kanjiList[index];

  const normalize = (s: string) => s.toLowerCase().replace(/[\u30FB\s\u3001,.\-]/g, "").trim();
  const splitVariants = (s: string) => s.split(/[\u30FB,]/).map((v) => v.trim().toLowerCase()).filter(Boolean);

  const isCorrect = () => {
    const userInput = normalize(input);
    if (!userInput) return false;
    if (normalize(current.hiragana) === userInput) return true;
    if (splitVariants(current.hiragana).includes(userInput)) return true;
    if (current.romaji) {
      if (normalize(current.romaji) === userInput) return true;
      if (splitVariants(current.romaji).includes(userInput)) return true;
    }
    return false;
  };

  const checkAnswer = () => {
    if (!input.trim()) return;
    if (isCorrect()) {
      setFlipped(true);
      setWrongNotif(false);
      
      triggerFireAnimationIfNewDay();

      if (!wasHinted) {
        setStats((s) => ({ ...s, correct: s.correct + 1 }));
        try {
          const saved = JSON.parse(localStorage.getItem("masteredKanji") || "[]");
          if (!saved.includes(current.id)) {
            saved.push(current.id);
            localStorage.setItem("masteredKanji", JSON.stringify(saved));
            
            checkKanjiAchievements();
            addMissionProgress("kanji_correct", 1);
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
    if (index + 1 >= kanjiList.length) {
      addMissionProgress("session_complete", 1);
      
      if (stats.wrong === 0 && stats.correct > 0 && !isRandomMode) {
         addMissionProgress("session_perfect", 1);
      }

      setFinished(true);
      setIsRunning(false);
      return;
    }
    setFlipped(false);
    setInput("");
    setWrongNotif(false);
    setWasHinted(false);
    setIndex((i) => i + 1);
  };

  const prev = () => {
    if (index === 0) return;
    setFlipped(false);
    setInput("");
    setWrongNotif(false);
    setWasHinted(false);
    setIndex((i) => i - 1);
  };

  const progress = ((index + 1) / kanjiList.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
      <div className="absolute top-10 left-10 text-6xl opacity-10 select-none">🌸</div>
      <div className="absolute top-40 right-16 text-6xl opacity-10 select-none">🎌</div>
      <div className="absolute bottom-20 left-20 text-6xl opacity-10 select-none">⛩️</div>
      <div className="absolute bottom-32 right-24 text-6xl opacity-10 select-none">🗾</div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-8 flex flex-col min-h-screen">
        <header className="flex justify-between items-center mb-6">
          <Link href={`/category/${slug}`} className="flex items-center gap-2 text-blue-700 hover:text-blue-900 font-semibold transition">
            <span>←</span> <span>Kembali</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="bg-blue-600 text-white rounded-full px-3 py-1 shadow-sm font-mono font-bold tabular-nums">⏱️ {formatTime(elapsed)}</span>
            <span className="bg-white border border-blue-200 rounded-full px-3 py-1 text-blue-700 shadow-sm">✓ <span className="font-bold">{stats.correct}</span></span>
            <span className="bg-white border border-rose-200 rounded-full px-3 py-1 text-rose-600 shadow-sm">✗ <span className="font-bold">{stats.wrong}</span></span>
          </div>
        </header>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-900 mb-1">🎴 Latihan Kanji</h1>
          <p className="text-sm text-blue-600 mb-2">Ketik hiragana atau romaji di bawah kartu</p>
          {isRandomMode && (
            <div className="flex justify-center items-center gap-2">
               <span className="inline-block text-xs bg-rose-100 text-rose-600 px-3 py-1 rounded-full border border-rose-200 font-semibold">🔀 Mode Acak</span>
               <span className={`inline-block text-xs px-3 py-1 rounded-full border font-semibold ${hintsLeft > 0 ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-gray-100 text-gray-400 border-gray-200"}`}>💡 Sisa Intip: {hintsLeft}</span>
            </div>
          )}
        </div>

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

        <div className="mb-6">
          <div className="flex justify-between text-xs text-blue-700 mb-2">
            <span className="font-semibold">Kartu {index + 1} dari {kanjiList.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-md h-60 [perspective:1200px]">
            <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
              <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl border-4 border-blue-200 flex items-center justify-center [backface-visibility:hidden]">
                <div className="absolute top-3 left-3 text-2xl opacity-30">🌸</div>
                <div className="absolute bottom-3 right-3 text-2xl opacity-30">🌸</div>
                <div className="absolute top-3 right-3 text-xs text-blue-400 font-bold">{index + 1}/{kanjiList.length}</div>
                <div className="text-9xl font-bold text-blue-900 select-none leading-none">{current.character}</div>
                {revealActive && (
                  <div className="absolute bottom-6 text-xl text-purple-600 font-bold animate-in fade-in">
                    {current.hiragana} — {current.meaning}
                  </div>
                )}
              </div>

              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl shadow-2xl flex flex-col items-center justify-center gap-2 p-6 [transform:rotateY(180deg)] [backface-visibility:hidden] text-white">
                <div className="absolute top-3 left-3 text-2xl opacity-50">🎌</div>
                <div className="absolute bottom-3 right-3 text-2xl opacity-50">🎌</div>

                <div className="text-center">
                  <div className="text-xs text-white/70 uppercase tracking-wider mb-1">Hiragana</div>
                  <div className="text-3xl font-bold">{current.hiragana}</div>
                </div>

                {current.romaji && (
                  <div className="text-center">
                    <div className="text-xs text-white/70 uppercase tracking-wider mb-1">Romaji</div>
                    <div className="text-lg font-medium text-blue-100">{current.romaji}</div>
                  </div>
                )}

                <div className="w-16 h-px bg-white/30 my-1" />

                <div className="text-center">
                  <div className="text-xs text-white/70 uppercase tracking-wider mb-1">Arti</div>
                  <div className="text-xl font-semibold">{current.meaning}</div>
                </div>
              </div>
            </div>
          </div>
          
          {!flipped && (
            <button onClick={handleHint} disabled={isRandomMode && hintsLeft <= 0} className="mt-4 flex items-center gap-2 text-sm font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 disabled:bg-gray-100 disabled:text-gray-400 px-4 py-2 rounded-full transition border border-amber-200 disabled:border-gray-200">
              💡 Intip Jawaban {isRandomMode && `(${hintsLeft} tersisa)`}
            </button>
          )}
        </div>

        <div className="mt-8 mb-4">
          {!flipped ? (
            <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 p-5 space-y-3">
              <label className="block text-sm font-semibold text-blue-700 text-center">✏️ Ketik hiragana atau romaji</label>
              <input
                className="w-full bg-blue-50 border-2 border-blue-200 rounded-xl px-4 py-3 text-center text-lg text-blue-900 focus:outline-none focus:border-blue-500 focus:bg-white transition placeholder:text-blue-300"
                placeholder="ひ ・ にち ・ び  /  hi ・ nichi ・ bi"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
                autoFocus
              />
              <button onClick={checkAnswer} disabled={!input.trim()} className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 disabled:from-blue-300 disabled:to-blue-400 text-white py-3 rounded-xl font-bold shadow-md transition active:scale-95">
                🎯 Cek Jawaban
              </button>

              {wrongNotif && (
                <div className="text-center text-rose-600 font-bold animate-pulse bg-rose-50 rounded-xl py-2 border border-rose-200">❌ Salah, coba lagi!</div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 p-5 space-y-3">
              <div className="text-center text-emerald-600 font-bold text-lg">
                {wasHinted ? "👀 Kamu mengintip jawaban ini." : "✅ Benar! Kanji sudah terbalik 🎉"}
              </div>
              <button onClick={next} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white py-3 rounded-xl font-bold shadow-md transition active:scale-95">
                {index + 1 >= kanjiList.length ? "🏁 Selesai — Lihat Hasil" : "Lanjut ke Kanji Berikutnya →"}
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-3">
          <button onClick={prev} disabled={index === 0} className="flex-1 py-2 bg-white border-2 border-blue-200 text-blue-700 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50">← Sebelumnya</button>
          <button onClick={next} className="flex-1 py-2 bg-white border-2 border-blue-200 text-blue-700 rounded-xl font-semibold transition">Selanjutnya →</button>
        </div>

        <div className="text-center mt-6 text-xs text-blue-400">🌸 がんばって！ (Ganbatte!) — Semangat! 🌸</div>
      </div>
    </div>
  );
}

function LatihanWrapper() {
  const searchParams = useSearchParams();
  const acak = searchParams.get("acak");
  return <LatihanContent key={acak || "normal"} />;
}

export default function LatihanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100"><div className="text-blue-600 text-xl animate-pulse">🌸 Memuat latihan...</div></div>}>
      <LatihanWrapper />
    </Suspense>
  );
}

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) return `${s} detik`;
  if (s === 0) return `${m} menit`;
  return `${m} menit ${s} detik`;
}