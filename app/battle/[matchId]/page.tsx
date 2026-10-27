// app/battle/[matchId]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { BattleMatch, BattleParticipant, BattleQuestion } from "@/utils/battleTypes";
import BattleScoreboard from "@/components/battle/BattleScoreboard";

export default function BattleRoomPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const [match, setMatch] = useState<BattleMatch | null>(null);
  const [me, setMe] = useState<BattleParticipant | null>(null);
  const [opponent, setOpponent] = useState<BattleParticipant | null>(null);
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  
  // Timer Response
  const questionStartTime = useRef<number>(Date.now());

  // 1. Fetch Initial Data
  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      // Fetch Match
      const { data: matchData } = await supabase.from('battle_matches').select('*').eq('id', matchId).single();
      if (!matchData) return router.push('/battle');
      setMatch(matchData);

      // Fetch Participants (dengan join profiles)
      const { data: parts } = await supabase
        .from('battle_participants')
        .select('*, profiles(username, avatar_url)')
        .eq('match_id', matchId);
      
      if (parts) {
        setMe(parts.find(p => p.user_id === user.id) || null);
        setOpponent(parts.find(p => p.user_id !== user.id) || null);
      }

      // Fetch Questions (Hanya kolom aman)
      const { data: qs } = await supabase
        .from('battle_questions')
        .select('id, question_order, item_type, item_id, question_text, options')
        .eq('match_id', matchId)
        .order('question_order', { ascending: true });
      
      if (qs) setQuestions(qs as BattleQuestion[]);
      setLoading(false);
    }
    fetchData();
  }, [matchId, router]);

  // 2. Realtime Listener (Skor Lawan & Status Match)
  useEffect(() => {
    const channel = supabase.channel(`battle:${matchId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'battle_participants', filter: `match_id=eq.${matchId}` }, (payload) => {
        const updated = payload.new as BattleParticipant;
        if (updated.user_id === me?.user_id) setMe(updated);
        else setOpponent(updated);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'battle_matches', filter: `id=eq.${matchId}` }, (payload) => {
        setMatch(payload.new as BattleMatch);
        if (payload.new.status === 'completed') {
          router.push(`/battle/result/${matchId}`);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId, me?.user_id, router]);

  // 3. Handler Jawaban
  const handleAnswer = async (option: string) => {
    if (feedback || !me || !questions[currentQIndex] || match?.status !== 'active') return;

    const timeTaken = Date.now() - questionStartTime.current;
    const currentQ = questions[currentQIndex];

    // Tampilkan feedback sementara (Optimistic)
    setFeedback('correct'); // Asumsi benar dulu, nanti dikoreksi server jika salah

    try {
      const res = await fetch('/api/battle/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          matchId,
          questionId: currentQ.id,
          selectedAnswer: option,
          responseTimeMs: timeTaken
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Koreksi feedback jika ternyata salah
      if (!data.isCorrect) setFeedback('wrong');

    } catch (err) {
      console.error(err);
      setFeedback('wrong');
    }

    // Delay sebelum lanjut ke soal berikutnya
    setTimeout(() => {
      setFeedback(null);
      setCurrentQIndex(prev => prev + 1);
      questionStartTime.current = Date.now();
    }, 800);
  };

  if (loading || !match || !me || !opponent) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Memuat Arena...</div>;
  }

  // Tampilan Pause Overlay
  if (match.status === 'paused') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-slate-200">
          <h2 className="text-2xl font-bold text-orange-500 mb-2">Pertandingan Dijeda</h2>
          <p className="text-slate-500">Menunggu pemain yang terputus untuk kembali...</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];

  if (!currentQ) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Menghitung hasil...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        
        {/* Scoreboard */}
        <BattleScoreboard 
          me={me} 
          opponent={opponent} 
          endsAt={match.ends_at!} 
          isPaused={match.status === 'paused'} 
        />

        {/* Area Soal */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center relative overflow-hidden">
          
          {/* Indikator Soal */}
          <div className="absolute top-4 left-4 text-xs font-semibold text-slate-400">
            Soal {currentQIndex + 1}
          </div>

          {/* Teks Soal (Kanji / Kotoba) */}
          <div className="my-8">
            <h1 className="text-6xl md:text-8xl font-black text-slate-800 tracking-wider">
              {currentQ.question_text}
            </h1>
          </div>

          {/* Pilihan Jawaban (2x2 Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {currentQ.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                disabled={!!feedback}
                className={`
                  p-4 rounded-xl text-lg font-bold border-2 transition-all
                  ${feedback === 'correct' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : ''}
                  ${feedback === 'wrong' ? 'bg-red-50 border-red-500 text-red-700' : ''}
                  ${!feedback ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-500 hover:bg-blue-50' : 'opacity-50'}
                `}
              >
                <span className="inline-block w-6 h-6 rounded-full bg-slate-200 text-slate-500 text-sm mr-2 leading-6">
                  {i + 1}
                </span>
                {opt}
              </button>
            ))}
          </div>

          {/* Overlay Benar/Salah */}
          {feedback && (
            <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm ${feedback === 'correct' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              <span className={`text-6xl font-black ${feedback === 'correct' ? 'text-emerald-500' : 'text-red-500'} animate-bounce`}>
                {feedback === 'correct' ? 'BENAR!' : 'SALAH'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}