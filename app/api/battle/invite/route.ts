// app/api/battle/invite/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { KANJI_DATA } from "@/data/kanji";
// import KOTOBA_DATA from "@/data/kotoba.json"; // Sesuaikan path-mu

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Wajib pakai service role untuk bypass RLS
);

// Fungsi helper untuk generate soal
function generateQuestions(mode: 'kanji'|'kotoba'|'random', count: number = 50) {
  let pool: any[] = [];
  if (mode === 'kanji' || mode === 'random') {
    pool = [...pool, ...KANJI_DATA.map(k => ({
      type: 'kanji', id: k.id, text: k.character, correct: k.hiragana, wrongs: [k.meaning, k.romaji]
    }))];
  }
  // if (mode === 'kotoba' || mode === 'random') {
  //   pool = [...pool, ...KOTOBA_DATA.map(k => ({
  //     type: 'kotoba', id: k.id, text: k.word, correct: k.meaning, wrongs: [k.reading]
  //   }))];
  // }

  // Acak pool
  pool.sort(() => Math.random() - 0.5);
  const selected = pool.slice(0, count);

  return selected.map((item) => {
    // Ambil 3 jawaban salah dari data lain (dummy logic)
    const wrongOptions = item.wrongs.slice(0, 3); 
    // Gabung dan acak opsi
    const options = [item.correct, ...wrongOptions].sort(() => Math.random() - 0.5);
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
    // 1. Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { receiverId, mode } = await req.json();

    if (user.id === receiverId) return NextResponse.json({ error: "Tidak bisa menantang diri sendiri" }, { status: 400 });

    // 2. Cek apakah mereka berteman (accepted)
    const { data: friendship } = await supabaseAdmin
      .from('friends')
      .select('id')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${user.id})`)
      .eq('status', 'accepted')
      .maybeSingle();

    if (!friendship) return NextResponse.json({ error: "Hanya bisa menantang teman" }, { status: 403 });

    // 3. Cek apakah salah satu sedang dalam match aktif
    const { data: activeMatch } = await supabaseAdmin
      .from('battle_participants')
      .select('match_id')
      .in('user_id', [user.id, receiverId])
      .in('status', ['waiting', 'active', 'paused'])
      .maybeSingle();

    if (activeMatch) return NextResponse.json({ error: "Pemain sedang dalam pertandingan lain" }, { status: 400 });

    // 4. Buat Match (Status Waiting)
    const { data: match, error: matchError } = await supabaseAdmin
      .from('battle_matches')
      .insert({ mode, created_by: user.id, status: 'waiting' })
      .select()
      .single();
    
    if (matchError) throw matchError;

    // 5. Generate & Simpan Soal (Bank soal sama untuk berdua)
    const questions = generateQuestions(mode, 50);
    const questionsInsert = questions.map((q, index) => ({
      match_id: match.id,
      question_order: index + 1,
      ...q
    }));
    await supabaseAdmin.from('battle_questions').insert(questionsInsert);

    // 6. Daftarkan peserta (Pengirim & Penerima)
    await supabaseAdmin.from('battle_participants').insert([
      { match_id: match.id, user_id: user.id, status: 'ready' },
      { match_id: match.id, user_id: receiverId, status: 'waiting' }
    ]);

    // 7. Buat Undangan
    const { data: invite } = await supabaseAdmin
      .from('battle_invites')
      .insert({ match_id: match.id, sender_id: user.id, receiver_id: receiverId, status: 'pending' })
      .select()
      .single();

    return NextResponse.json({ success: true, invite, matchId: match.id });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}