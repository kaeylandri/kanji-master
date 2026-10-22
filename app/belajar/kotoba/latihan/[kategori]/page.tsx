"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

type Kotoba = { id: number; category: string; word: string; reading: string; meaning: string; };

function shuffle<T>(arr: T[]): T[] { const s = [...arr]; for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; } return s; }

function LatihanContent() {
  const params = useParams();
  const kategori = decodeURIComponent(params.kategori as string);
  const searchParams = useSearchParams();
  const isRandomMode = searchParams.get("acak") === "1";

  const [list, setList] = useState<Kotoba[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [wrongNotif, setWrongNotif] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!kategori) return;
    fetch(`/api/kotoba/${encodeURIComponent(kategori)}`).then((r) => r.json()).then((data: Kotoba[]) => {
      setList(isRandomMode ? shuffle(data).slice(0, 50) : data);
    });
  }, [kategori, isRandomMode]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  if (!list.length) return <div className="min-h-screen flex items-center justify-center bg-emerald-50 text-emerald-600">🌸 Memuat...</div>;

  if (finished) {
    const total = stats.correct + stats.wrong;
    const accuracy = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-100 p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-emerald-900 mb-2">Latihan Selesai!</h1>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-emerald-50 rounded-2xl p-3"><div className="text-2xl font-bold text-emerald-600">{stats.correct}</div><div className="text-xs">Benar</div></div>
            <div className="bg-rose-50 rounded-2xl p-3"><div className="text-2xl font-bold text-rose-600">{stats.wrong}</div><div className="text-xs">Salah</div></div>
            <div className="bg-blue-50 rounded-2xl p-3"><div className="text-2xl font-bold text-blue-600">{accuracy}%</div><div className="text-xs">Akurasi</div></div>
          </div>
          <div className="bg-emerald-500 text-white rounded-2xl p-4 mb-6"><div className="text-xs uppercase">Waktu</div><div className="text-2xl font-bold">{Math.floor(elapsed/60)}m {elapsed%60}s</div></div>
          <div className="space-y-2">
            <button onClick={() => { if (isRandomMode) window.location.reload(); else { setIndex(0); setInput(""); setFlipped(false); setStats({ correct: 0, wrong: 0 }); setFinished(false); setElapsed(0); setIsRunning(true); } }} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold">🔄 Ulangi</button>
            <Link href={`/kotoba/kategori/${encodeURIComponent(kategori)}`} className="block w-full bg-white border-2 border-emerald-200 text-emerald-700 py-3 rounded-xl font-semibold">← Kembali</Link>
          </div>
        </div>
      </div>
    );
  }

  const current = list[index];
  const normalize = (s: string) => s.toLowerCase().replace(/[\s,.\-]/g, "").trim();

  const checkAnswer = () => {
    if (!input.trim()) return;
    if (normalize(input) === normalize(current.reading) || normalize(input) === normalize(current.meaning)) {
      setFlipped(true); setWrongNotif(false); setStats(s => ({ ...s, correct: s.correct + 1 }));
      try { const saved = JSON.parse(localStorage.getItem("masteredKotoba") || "[]"); if (!saved.includes(current.id)) { saved.push(current.id); localStorage.setItem("masteredKotoba", JSON.stringify(saved)); } } catch (e) {}
    } else { setWrongNotif(true); setStats(s => ({ ...s, wrong: s.wrong + 1 })); setTimeout(() => setWrongNotif(false), 1500); }
  };

  const next = () => { if (index + 1 >= list.length) { setFinished(true); setIsRunning(false); return; } setFlipped(false); setInput(""); setWrongNotif(false); setIndex(i => i + 1); };
  const prev = () => { setFlipped(false); setInput(""); setWrongNotif(false); setIndex(i => (i - 1 + list.length) % list.length); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl flex-1 flex flex-col">
        <header className="flex justify-between items-center mb-6">
          <Link href={`/kotoba/kategori/${encodeURIComponent(kategori)}`} className="text-emerald-700 font-semibold">← Kembali</Link>
          <div className="flex gap-2 text-sm"><span className="bg-emerald-600 text-white rounded-full px-3 py-1 font-mono">{Math.floor(elapsed/60)}:{(elapsed%60).toString().padStart(2,'0')}</span><span className="bg-white rounded-full px-3 py-1 border border-emerald-200">✓ {stats.correct}</span><span className="bg-white rounded-full px-3 py-1 border border-rose-200">✗ {stats.wrong}</span></div>
        </header>
        <div className="mb-6">
          <div className="flex justify-between text-xs text-emerald-700 mb-2"><span>Kartu {index + 1} dari {list.length}</span><span>{Math.round(((index+1)/list.length)*100)}%</span></div>
          <div className="h-2 bg-emerald-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${((index+1)/list.length)*100}%` }} /></div>
        </div>
        <div className="flex-1 flex items-center justify-center mb-8">
          <div className="relative w-full max-w-md h-60 [perspective:1200px]">
            <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
              <div className="absolute inset-0 bg-white rounded-3xl shadow-xl border-4 border-emerald-200 flex items-center justify-center [backface-visibility:hidden]"><div className="text-6xl font-bold text-emerald-900">{current.word}</div></div>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl shadow-xl flex flex-col items-center justify-center gap-2 p-6 [transform:rotateY(180deg)] [backface-visibility:hidden] text-white">
                <div className="text-xs opacity-70">Cara Baca</div><div className="text-3xl font-bold">{current.reading}</div><div className="w-16 h-px bg-white/30 my-2" /><div className="text-xs opacity-70">Arti</div><div className="text-xl font-semibold">{current.meaning}</div>
              </div>
            </div>
          </div>
        </div>
        {!flipped ? (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-emerald-100 p-5 space-y-3">
            <input className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-xl px-4 py-3 text-center text-lg" placeholder="Ketik cara baca atau arti..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && checkAnswer()} autoFocus />
            <button onClick={checkAnswer} disabled={!input.trim()} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold disabled:opacity-50">🎯 Cek Jawaban</button>
            {wrongNotif && <div className="text-center text-rose-600 font-bold">❌ Salah!</div>}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-emerald-100 p-5 space-y-3">
            <div className="text-center text-emerald-600 font-bold text-lg">✅ Benar!</div>
            <button onClick={next} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold">{index + 1 >= list.length ? "🏁 Selesai" : "Lanjut →"}</button>
          </div>
        )}
        <div className="flex gap-3 mt-4"><button onClick={prev} className="flex-1 py-2 bg-white border-2 border-emerald-200 text-emerald-700 rounded-xl font-semibold">← Sebelumnya</button><button onClick={next} className="flex-1 py-2 bg-white border-2 border-emerald-200 text-emerald-700 rounded-xl font-semibold">Selanjutnya →</button></div>
      </div>
    </div>
  );
}

function Wrapper() { const sp = useSearchParams(); return <LatihanContent key={sp.get("acak") || "normal"} />; }
export default function Page() { return <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-emerald-600">Memuat...</div>}><Wrapper /></Suspense>; }