// app/api/battle/invite/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { KANJI_DATA } from "@/data/kanji";
import KOTOBA_DATA from "@/data/kotoba.json";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateQuestions(mode: 'kanji' | 'kotoba' | 'random', count: number = 50) {
  let pool: any[] = [];
  
  if (mode === 'kanji' || mode === 'random') {
    pool = [...pool, ...KANJI_DATA.map(k => {
      const otherKanji = KANJI_DATA.filter(x => x.id !== k.id);
      const shuffled = otherKanji.sort(() => 0.5 - Math.random());
      const wrongs = shuffled.slice(0, 3).map(x => x.meaning);
      return { type: 'kanji', id: k.id, text: k.character, correct: k.meaning, wrongs: wrongs };
    })];
  }

  if (mode === 'kotoba' || mode === 'random') {
    pool = [...pool, ...KOTOBA_DATA.map((k: any) => {
      const otherKotoba = KOTOBA_DATA.filter((x: any) => x.id !== k.id);
      const shuffled = otherKotoba.sort(() => 0.5 - Math.random());
      const wrongs = shuffled.slice(0, 3).map((x: any) => x.meaning);
      return { type: 'kotoba', id: k.id, text: k.word, correct: k.meaning, wrongs: wrongs };
    })];
  }

  pool.sort(() => Math.random() - 0.5);
  const selected = pool.slice(0, count);

  return selected.map((item) => {
    const options = [item.correct, ...item.wrongs].sort(() => Math.random() - 0.5);
    return {
      item_type: item.type,
      item_id: item.id,
      question_text: item.text,
      options: options,
      correct_answer: item.correct
    };
  });
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { receiverId, mode } = await req.json();

    if (user.id === receiverId) return NextResponse.json({ error: "Tidak bisa menantang diri sendiri" }, { status: 400 });

    // 1. Cek Pertemanan
    const { data: friendship1 } = await supabaseAdmin
      .from('friends').select('id').eq('user_id', user.id).eq('friend_id', receiverId).eq('status', 'accepted').maybeSingle();

    const { data: friendship2 } = await supabaseAdmin
      .from('friends').select('id').eq('user_id', receiverId).eq('friend_id', user.id).eq('status', 'accepted').maybeSingle();

    if (!friendship1 && !friendship2) return NextResponse.json({ error: "Hanya bisa menantang teman" }, { status: 403 });

    // =========================================================================
    // 2. CEK MATCH AKTIF (DENGAN FILTER STATUS MATCH YANG LEBIH KETAT)
    // =========================================================================
    const { data: activeMatch } = await supabaseAdmin
      .from('battle_participants')
      .select(`
        match_id, 
        status,
        battle_matches!inner(status)
      `)
      .in('user_id', [user.id, receiverId])
      .in('status', ['waiting', 'ready', 'active', 'paused'])
      .maybeSingle();

    if (activeMatch) {
      const matchData = (activeMatch as any).battle_matches;
      
      // Jika match ternyata sudah completed atau cancelled, abaikan!
      if (matchData.status !== 'completed' && matchData.status !== 'cancelled') {
        
        // Jika match masih 'waiting' (baru dibuat), kita cek umurnya. Jika > 5 menit, batalkan paksa.
        if (matchData.status === 'waiting') {
           const { data: fullMatch } = await supabaseAdmin.from('battle_matches').select('created_at').eq('id', activeMatch.match_id).single();
           if (fullMatch) {
             const matchAgeMs = new Date().getTime() - new Date(fullMatch.created_at).getTime();
             if (matchAgeMs > 5 * 60 * 1000) {
               await supabaseAdmin.from('battle_matches').update({ status: 'cancelled' }).eq('id', activeMatch.match_id);
             } else {
               return NextResponse.json({ error: "Pemain sedang dalam pertandingan lain" }, { status: 400 });
             }
           }
        } else {
           // Jika match sedang active atau paused, tolak!
           return NextResponse.json({ error: "Pemain sedang dalam pertandingan lain" }, { status: 400 });
        }
      }
    }
    // =========================================================================

    // 3. Buat Match Baru
    const { data: match, error: matchError } = await supabaseAdmin
      .from('battle_matches')
      .insert({ mode, created_by: user.id, status: 'waiting' })
      .select()
      .single();
    
    if (matchError) throw matchError;

    // 4. Generate Soal
    const questions = generateQuestions(mode, 50);
    const questionsInsert = questions.map((q, index) => ({
      match_id: match.id,
      question_order: index + 1,
      ...q
    }));
    
    const { error: qError } = await supabaseAdmin.from('battle_questions').insert(questionsInsert);
    if (qError) throw new Error("Gagal membuat soal: " + qError.message);

    // 5. Daftarkan Peserta
    const { error: pError } = await supabaseAdmin.from('battle_participants').insert([
      { match_id: match.id, user_id: user.id, status: 'ready' },
      { match_id: match.id, user_id: receiverId, status: 'waiting' }
    ]);
    if (pError) throw new Error("Gagal mendaftarkan peserta: " + pError.message);

    // 6. Buat Undangan
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('battle_invites')
      .insert({ match_id: match.id, sender_id: user.id, receiver_id: receiverId, status: 'pending' })
      .select()
      .single();

    if (inviteError) throw new Error("Gagal membuat undangan: " + inviteError.message);

    return NextResponse.json({ success: true, invite, matchId: match.id });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}