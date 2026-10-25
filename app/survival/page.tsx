// app/survival/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { triggerFireAnimationIfNewDay } from "@/utils/streakEngine";
import { checkKanjiAchievements } from "@/utils/checkAchievements";
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

export default function SurvivalPage() {
  const [kanjiList, setKanjiList] = useState<Kanji[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [gameState, setGameState] = useState<"idle" | "playing" | "over">("idle");
  const [wrongNotif, setWrongNotif] = useState(false);
  const [shake, setShake] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const [inventory, setInventory] = useState<any>({});
  const [revealActive, setRevealActive] = useState(false);
  const [revealTimeLeft, setRevealTimeLeft] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("survivalHighScore");
    if (saved) setHighScore(parseInt(saved, 10));
    
    setInventory(getInventory());
    window.addEventListener("inventoryUpdated", () => setInventory(getInventory()));
  }, []);

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

  const playTickSound = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }, []);

  const startGame = useCallback(async () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }

      const res = await fetch(`/api/categories/semua/kanji`);
      if (!res.ok) throw new Error("Gagal ambil data");
      
      const data: Kanji[] = await res.json();
      
      if (data.length === 0) {
        triggerToast("Data kanji tidak ditemukan.", "error");
        return;
      }
      
      setKanjiList(shuffle(data));
      setIndex(0);
      setInput("");
      setScore(0);
      setTimeLeft(120);
      setGameState("playing");
      setWrongNotif(false);
      setRevealActive(false);
      
     triggerFireAnimationIfNewDay(); // 🆕 Panggil api saat game dimulai (sekali sehari)
      
    } catch (error) {
      console.error("Gagal memuat kanji", error);
      triggerToast("Koneksi terputus saat memuat kanji.", "error");
    }
  }, []);

  useEffect(() => {
    if (gameState !== "playing") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setGameState("over");
          return 0;
        }
        
        playTickSound();
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, playTickSound]);

  useEffect(() => {
    if (gameState === "over") {
      const currentRecord = parseInt(localStorage.getItem("survivalHighScore") || "0", 10);
      if (score > currentRecord) {
        localStorage.setItem("survivalHighScore", score.toString());
        setHighScore(score);
      }
    }
  }, [gameState, score]);

  const normalize = (s: string) =>
    s.toLowerCase().replace(/[\u30FB\s\u3001,.\-]/g, "").trim();

  const splitVariants = (s: string) =>
    s.split(/[\u30FB,]/).map((v) => v.trim().toLowerCase()).filter(Boolean);

  const checkAnswer = () => {
    if (!input.trim() || gameState !== "playing") return;
    const current = kanjiList[index];
    const userInput = normalize(input);

    const isCorrect =
      normalize(current.hiragana) === userInput ||
      splitVariants(current.hiragana).includes(userInput) ||
      (current.romaji &&
        (normalize(current.romaji) === userInput ||
          splitVariants(current.romaji).includes(userInput)));

    if (isCorrect) {
      const newScore = score + 1;
      setScore(newScore);

      try {
        const saved = JSON.parse(localStorage.getItem("masteredKanji") || "[]");
        if (!saved.includes(current.id)) {
          saved.push(current.id);
          localStorage.setItem("masteredKanji", JSON.stringify(saved));
          
          checkKanjiAchievements();
        }
      } catch (e) {}

      try {
        const stats = JSON.parse(localStorage.getItem("kanjiAchievements") || "{}");
        const unlocked = stats.unlocked || [];
        const unlock = (id: string) => { if (!unlocked.includes(id)) unlocked.push(id); };
        
        unlock("mode_survival_1");
        if (newScore >= 10) unlock("mode_survival_2");
        if (newScore >= 20) unlock("mode_survival_3");
        if (newScore >= 50) unlock("mode_survival_4");
        
        localStorage.setItem("kanjiAchievements", JSON.stringify({ ...stats, unlocked }));
      } catch (e) {}
      
      setInput("");
      setIndex((prev) => (prev + 1) % kanjiList.length);
    } else {
      setShake(true);
      setWrongNotif(true);
      setTimeout(() => setShake(false), 400);
      setTimeout(() => setWrongNotif(false), 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (gameState === "idle") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 max-w-md w-full text-center text-white shadow-2xl">
          <div className="text-7xl mb-4 animate-bounce">⚔️</div>
          <h1 className="text-3xl font-extrabold mb-2 tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
            MODE SURVIVAL
          </h1>
          <p className="text-blue-200 mb-8 text-sm">
            Kamu punya waktu <strong className="text-white">2 Menit</strong>.<br />
            Tebak sebanyak mungkin kanji yang muncul!
          </p>
          
          <div className="bg-black/30 rounded-xl p-4 mb-6 text-left text-sm space-y-2 border border-white/10">
            <p>⏱️ Waktu: <strong>120 Detik</strong></p>
            <p>🎴 Kanji: <strong>Acak (Semua Kategori)</strong></p>
            <p>🏆 Skor Tertinggi: <strong className="text-emerald-400 text-lg">{highScore}</strong></p>
          </div>

          <button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all active:scale-95"
          >
            🚀 Mulai Tantangan
          </button>
          <Link href="/" className="block mt-4 text-sm text-blue-300 hover:text-white transition">
            ← Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (gameState === "over") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 max-w-md w-full text-center text-white shadow-2xl">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold mb-2 text-rose-400">WAKTU HABIS!</h1>
          
          <div className="my-6">
            <div className="text-sm text-blue-300 mb-1">Skor Kamu</div>
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500">
              {score}
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-4 mb-6 border border-white/10">
            {score > highScore ? (
              <div className="text-yellow-400 font-bold animate-pulse">
                🎉 REKOR BARU! 🎉
              </div>
            ) : (
              <div className="text-sm text-blue-200">
                🏆 Skor Tertinggi: <strong className="text-emerald-400 text-lg">{highScore}</strong>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-3 rounded-xl transition active:scale-95"
            >
              🔄 Main Lagi
            </button>
            <Link
              href="/"
              className="block w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition"
            >
              ← Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const current = kanjiList[index];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-sm mb-4">
        <button 
          onClick={handleUseReveal}
          disabled={inventory.reveal === 0 || revealActive}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          🪄 Gunakan Full Reveal (Tersisa: {inventory.reveal || 0})
        </button>
        {revealActive && (
          <div className="w-full bg-purple-900/50 border border-purple-500/50 text-purple-300 font-bold py-2 rounded-xl text-center animate-pulse mt-2">
            🪄 Full Reveal Aktif: {Math.floor(revealTimeLeft / 60)}:{(revealTimeLeft % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>

      <div className="w-full max-w-lg flex justify-between items-center mb-8">
        <div className="text-white text-lg font-bold">
          Skor: <span className="text-emerald-400 text-2xl">{score}</span>
        </div>
        <div className={`text-3xl font-mono font-bold ${timeLeft <= 10 ? "text-rose-500 animate-pulse" : "text-white"}`}>
          ⏱️ {formatTime(timeLeft)}
        </div>
      </div>

      <div className={`relative w-full max-w-sm aspect-square bg-white rounded-3xl shadow-2xl border-8 border-slate-700 flex flex-col items-center justify-center mb-8 overflow-hidden transition-all ${timeLeft <= 10 ? "border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.5)]" : ""}`}>
        <div className="absolute top-4 left-4 text-4xl opacity-20">🌸</div>
        <div className="absolute bottom-4 right-4 text-4xl opacity-20">🌸</div>
        <div className="text-[8rem] font-bold text-slate-800 leading-none select-none">
          {current.character}
        </div>

        {revealActive && (
          <div className="text-3xl text-purple-600 font-bold mt-2 animate-in fade-in">
            {current.meaning}
          </div>
        )}
      </div>

      <div className={`w-full max-w-sm transition-transform ${shake ? "translate-x-2" : ""}`}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
          placeholder="Ketik romaji / hiragana..."
          className="w-full bg-slate-800 border-2 border-slate-600 text-white text-center text-xl rounded-xl px-4 py-4 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500 mb-3"
          autoFocus
          autoComplete="off"
        />
        <button
          onClick={checkAnswer}
          disabled={!input.trim()}
          className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition active:scale-95"
        >
          Enter / Cek
        </button>
        
        <div className={`text-center mt-4 font-bold text-rose-500 transition-opacity duration-200 ${wrongNotif ? "opacity-100" : "opacity-0"}`}>
          ❌ Salah!
        </div>
      </div>
    </div>
  );
}