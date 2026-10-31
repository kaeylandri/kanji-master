// app/battle/room/[matchId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { BattleMatch, BattleParticipant } from "@/utils/battleTypes";

export default function BattleRoomPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const [match, setMatch] = useState<BattleMatch | null>(null);
  const [me, setMe] = useState<BattleParticipant | null>(null);
  const [opponent, setOpponent] = useState<BattleParticipant | null>(null);
  
  const [countdown, setCountdown] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  // 1. Fetch Data Awal
  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      const { data: matchData } = await supabase.from('battle_matches').select('*').eq('id', matchId).single();
      if (!matchData) return router.push('/battle');
      setMatch(matchData);

      const { data: parts } = await supabase.from('battle_participants').select('*, profiles(username, avatar_url)').eq('match_id', matchId);
      if (parts) {
        setMe(parts.find(p => p.user_id === user.id) || null);
        setOpponent(parts.find(p => p.user_id !== user.id) || null);
      }
      setLoading(false);
    }
    fetchData();
  }, [matchId, router]);

  // 2. Realtime Listener
  useEffect(() => {
    const channel = supabase.channel(`room:${matchId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'battle_matches', filter: `id=eq.${matchId}` }, (payload) => {
        const updatedMatch = payload.new as BattleMatch;
        setMatch(updatedMatch);
        if (updatedMatch.status === 'active' && countdown === null) setCountdown(3);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'battle_participants', filter: `match_id=eq.${matchId}` }, async () => {
        const { data: parts } = await supabase.from('battle_participants').select('*, profiles(username, avatar_url)').eq('match_id', matchId);
        if (parts) {
          setMe(parts.find(p => p.user_id === me?.user_id) || null);
          setOpponent(parts.find(p => p.user_id !== me?.user_id) || null);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [matchId, countdown, me?.user_id]);

  // 3. Logika Countdown
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      const timer = setTimeout(() => router.push(`/battle/${matchId}`), 800);
      return () => clearTimeout(timer);
    }
  }, [countdown, matchId, router]);

  const handleStartMatch = async () => {
    setStarting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/battle/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ matchId })
      });
      if (!res.ok) throw new Error("Gagal memulai pertandingan");
    } catch (err: any) {
      alert(err.message);
      setStarting(false);
    }
  };

  if (loading || !match || !me) {
    return <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center text-blue-500 font-bold text-xl">Menyiapkan Ruang Laga...</div>;
  }

  const isOwner = match.created_by === me.user_id;
  const isOpponentReady = opponent?.status === 'ready';

  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-600/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto p-6 md:p-12 flex flex-col min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-yellow-400 mb-1 tracking-wide">Ruang Laga</h1>
          <div className="flex items-center gap-2 text-blue-400">
            <span className="text-sm font-bold">No. Ruang:</span>
            <span className="text-sm font-mono bg-blue-500/10 px-2 py-1 rounded">{matchId.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>

        <div className="bg-[#151A25] border border-slate-800 rounded-3xl p-6 md:p-8 flex-1 flex flex-col shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full border-2 border-yellow-500 bg-slate-800 overflow-hidden">
              {me.profiles?.avatar_url ? <img src={me.profiles.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-yellow-500 font-bold text-xl">{me.profiles?.username?.charAt(0).toUpperCase()}</div>}
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">{me.profiles?.username}</h2>
              <span className="text-xs text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded">Pemilik</span>
            </div>
          </div>

          <div className="w-full h-px bg-slate-800 my-2 mb-6"></div>

          {opponent ? (
            <div className="flex items-center gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-16 h-16 rounded-full border-2 border-blue-500 bg-slate-800 overflow-hidden">
                {opponent.profiles?.avatar_url ? <img src={opponent.profiles.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-blue-500 font-bold text-xl">{opponent.profiles?.username?.charAt(0).toUpperCase()}</div>}
              </div>
              <div>
                <h2 className="text-white font-bold text-xl">{opponent.profiles?.username}</h2>
                {isOpponentReady ? <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Siap Bertanding</span> : <span className="text-xs text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded animate-pulse">Menghubungkan...</span>}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 mb-6 opacity-50">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center bg-slate-800/50">
                <span className="text-2xl text-slate-500">+</span>
              </div>
              <div>
                <h2 className="text-slate-400 font-bold text-lg">Menunggu Lawan...</h2>
                <p className="text-xs text-slate-500">Tautan ruangan telah dikirim via notifikasi</p>
              </div>
            </div>
          )}

          <div className="mt-auto pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500 font-medium">
              {isOwner ? (isOpponentReady ? "Lawan sudah siap. Mulai pertandingan!" : "Menunggu lawan bergabung...") : "Menunggu pemilik ruangan memulai pertandingan..."}
            </p>
            {isOwner && (
              <button onClick={handleStartMatch} disabled={!isOpponentReady || starting || match.status === 'active'} className={`px-8 py-3 rounded-xl font-black text-white shadow-lg transition-all ${isOpponentReady ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:scale-105 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-slate-700 cursor-not-allowed opacity-50'}`}>
                {starting ? 'Memulai...' : 'Mulai Pertandingan ⚔️'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-8">
          <button onClick={() => router.push('/battle')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium">
            <span className="text-xl">⬅</span> Keluar dari Ruang Laga
          </button>
        </div>
      </div>

      {countdown !== null && (
        <div className="fixed inset-0 z-50 bg-[#0B0E14]/95 flex items-center justify-center backdrop-blur-md">
          <div className="text-center">
            <h2 className="text-[150px] md:text-[200px] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-800 animate-bounce drop-shadow-[0_0_50px_rgba(59,130,246,0.8)]">
              {countdown > 0 ? countdown : "GO!"}
            </h2>
            <p className="text-2xl text-blue-400 font-bold mt-4 tracking-widest uppercase">Bersiaplah...</p>
          </div>
        </div>
      )}
    </div>
  );
}