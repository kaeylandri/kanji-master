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

  // 1. Fetch Data Awal
  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      const { data: matchData } = await supabase.from('battle_matches').select('*').eq('id', matchId).single();
      if (!matchData) return router.push('/battle');
      setMatch(matchData);

      const { data: parts } = await supabase
        .from('battle_participants')
        .select('*, profiles(username, avatar_url)')
        .eq('match_id', matchId);
      
      if (parts) {
        setMe(parts.find(p => p.user_id === user.id) || null);
        setOpponent(parts.find(p => p.user_id !== user.id) || null);
      }
      setLoading(false);
    }
    fetchData();
  }, [matchId, router]);

  // 2. Realtime Listener (Mendengarkan jika match dimulai)
  useEffect(() => {
    const channel = supabase.channel(`room:${matchId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'battle_matches', filter: `id=eq.${matchId}` }, (payload) => {
        setMatch(payload.new as BattleMatch);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId]);

  // 3. Logika Countdown (Jika status match berubah jadi 'countdown')
  useEffect(() => {
    if (match?.status === 'countdown') {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(timer);
            return 0; // 0 artinya GO!
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else if (match?.status === 'active') {
      // Jika sudah aktif, pindah ke arena tempur
      router.push(`/battle/${matchId}`);
    }
  }, [match?.status, matchId, router]);

  if (loading || !match || !me) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Menyiapkan Arena...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Effect (Opsional) */}
      <div className="absolute inset-0 bg-[url('/battle-bg.jpg')] bg-cover bg-center opacity-20 blur-sm"></div>

      <div className="relative z-10 w-full max-w-4xl p-8 flex flex-col items-center">
        
        <h1 className="text-white text-3xl font-black mb-12 tracking-widest uppercase">Persiapan Pertandingan</h1>

        {/* VS Area */}
        <div className="flex items-center justify-between w-full mb-16">
          
          {/* Player 1 (Kamu) */}
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-3xl bg-blue-600 border-4 border-blue-400 overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.5)]">
              {me.profiles?.avatar_url ? (
                <img src={me.profiles.avatar_url} alt="Me" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-black text-4xl">
                  {me.profiles?.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-white font-bold text-xl mt-4">{me.profiles?.username} (Kamu)</span>
            <span className="text-blue-400 font-bold text-sm mt-1">SIAP</span>
          </div>

          {/* VS */}
          <div className="text-white text-6xl font-black italic opacity-50 px-8">VS</div>

          {/* Player 2 (Lawan) */}
          <div className="flex flex-col items-center">
            {opponent ? (
              <>
                <div className="w-32 h-32 rounded-3xl bg-pink-600 border-4 border-pink-400 overflow-hidden shadow-[0_0_30px_rgba(236,72,153,0.5)]">
                  {opponent.profiles?.avatar_url ? (
                    <img src={opponent.profiles.avatar_url} alt="Opponent" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-black text-4xl">
                      {opponent.profiles?.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-white font-bold text-xl mt-4">{opponent.profiles?.username}</span>
                <span className="text-pink-400 font-bold text-sm mt-1">SIAP</span>
              </>
            ) : (
              <div className="flex flex-col items-center animate-pulse">
                <div className="w-32 h-32 rounded-3xl bg-slate-700 border-4 border-slate-600 flex items-center justify-center">
                  <span className="text-4xl">⏳</span>
                </div>
                <span className="text-slate-400 font-bold text-xl mt-4">Menunggu Lawan...</span>
              </div>
            )}
          </div>
        </div>

        {/* Status / Tombol Mulai */}
        <div className="text-center">
          {opponent ? (
             <div className="text-emerald-400 font-bold text-lg bg-emerald-400/10 px-6 py-3 rounded-full">
               Lawan ditemukan. Menunggu sistem memulai...
             </div>
          ) : (
            <div className="text-slate-400">
              Bagikan tautan ini ke temanmu atau tunggu mereka menerima undangan.
            </div>
          )}
        </div>

      </div>

      {/* COUNTDOWN OVERLAY */}
      {countdown !== null && (
        <div className="absolute inset-0 z-50 bg-slate-900/90 flex items-center justify-center backdrop-blur-md">
          <div className="text-center">
            <h2 className="text-9xl font-black text-white animate-bounce drop-shadow-[0_0_50px_rgba(255,255,255,0.8)]">
              {countdown > 0 ? countdown : "GO!"}
            </h2>
            <p className="text-2xl text-slate-300 font-bold mt-8">Bersiaplah...</p>
          </div>
        </div>
      )}

    </div>
  );
}