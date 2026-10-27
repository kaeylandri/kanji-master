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

  // 1. Ambil Data Awal (Match & Peserta)
  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      // Ambil data match
      const { data: matchData } = await supabase
        .from('battle_matches')
        .select('*')
        .eq('id', matchId)
        .single();
        
      if (!matchData) return router.push('/battle');
      setMatch(matchData);

      // Ambil data peserta (termasuk profil)
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
      .on(
        'postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'battle_matches', filter: `id=eq.${matchId}` }, 
        (payload) => {
          const updatedMatch = payload.new as BattleMatch;
          setMatch(updatedMatch);
          
          // 🆕 JIKA LAWAN MENERIMA UNDANGAN, MULAI COUNTDOWN
          if (updatedMatch.status === 'active' && countdown === null) {
            setCountdown(3);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId, countdown]);

  // 3. Logika Countdown
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Setelah hitungan selesai (GO!), pindah ke arena tempur
      const timer = setTimeout(() => {
        router.push(`/battle/${matchId}`);
      }, 800); // Beri jeda sedikit agar tulisan "GO!" terbaca
      return () => clearTimeout(timer);
    }
  }, [countdown, matchId, router]);

  if (loading || !match || !me) {
    return <div className="flex h-screen items-center justify-center text-slate-500 font-bold text-xl">Menyiapkan Arena...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[url('/battle-bg.jpg')] bg-cover bg-center opacity-20 blur-sm"></div>

      <div className="relative z-10 w-full max-w-4xl p-8 flex flex-col items-center">
        
        <h1 className="text-white text-3xl font-black mb-12 tracking-widest uppercase text-center">
          Persiapan Pertandingan
        </h1>

        {/* VS Area */}
        <div className="flex flex-col md:flex-row items-center justify-between w-full mb-16 gap-8 md:gap-0">
          
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
          <div className="text-white text-6xl font-black italic opacity-50 px-4">VS</div>

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
                <span className="text-pink-400 font-bold text-sm mt-1">
                  {match.status === 'active' ? 'SIAP' : 'MENUNGGU...'}
                </span>
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

        {/* Status */}
        <div className="text-center h-16">
          {opponent ? (
            match.status === 'active' ? (
              <div className="text-emerald-400 font-bold text-lg bg-emerald-400/10 px-6 py-3 rounded-full animate-bounce">
                Pertandingan Dimulai!
              </div>
            ) : (
              <div className="text-yellow-400 font-bold text-lg bg-yellow-400/10 px-6 py-3 rounded-full animate-pulse">
                Lawan ditemukan. Menunggu lawan menerima undangan...
              </div>
            )
          ) : (
            <div className="text-slate-400 font-medium">
              Bagikan tautan ini ke temanmu atau tunggu mereka menerima undangan.
            </div>
          )}
        </div>

      </div>

      {/* COUNTDOWN OVERLAY */}
      {countdown !== null && (
        <div className="absolute inset-0 z-50 bg-slate-900/95 flex items-center justify-center backdrop-blur-md">
          <div className="text-center">
            <h2 className="text-[150px] md:text-[200px] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 animate-bounce drop-shadow-[0_0_50px_rgba(255,255,255,0.8)]">
              {countdown > 0 ? countdown : "GO!"}
            </h2>
            <p className="text-2xl text-slate-300 font-bold mt-4 tracking-widest uppercase">Bersiaplah...</p>
          </div>
        </div>
      )}

    </div>
  );
}