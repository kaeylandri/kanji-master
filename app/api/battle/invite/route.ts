// app/api/battle/invite/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { KANJI_DATA } from "@/data/kanji";
import KOTOBA_DATA from "@/data/kotoba.json"; // Pastikan file JSON ini ada di folder data/

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Wajib pakai service role untuk bypass RLS
);

// Fungsi helper untuk generate soal
function generateQuestions(mode: 'kanji' | 'kotoba' | 'random', count: number = 50) {
  let pool: any[] = [];
  
  // Masukkan data Kanji jika mode kanji atau random
  if (mode === 'kanji' || mode === 'random') {
    pool = [...pool, ...KANJI_DATA.map(k => {
      // Ambil 3 distraktor (jawaban salah) dari data lain secara acak
      const otherKanji = KANJI_DATA.filter(x => x.id !== k.id);
      const shuffled = otherKanji.sort(() => 0.5 - Math.random());
      const wrongs = shuffled.slice(0, 3).map(x => x.meaning);

      return {
        type: 'kanji', 
        id: k.id, 
        text: k.character, 
        correct: k.meaning, // Tebak artinya
        wrongs: wrongs
      };
    })];
  }

  // Masukkan data Kotoba jika mode kotoba atau random
  if (mode === 'kotoba' || mode === 'random') {
    pool = [...pool, ...KOTOBA_DATA.map((k: any) => {
      // Ambil 3 distraktor (jawaban salah) dari data lain secara acak
      const otherKotoba = KOTOBA_DATA.filter((x: any) => x.id !== k.id);
      const shuffled = otherKotoba.sort(() => 0.5 - Math.random());
      const wrongs = shuffled.slice(0, 3).map((x: any) => x.meaning);

      return {
        type: 'kotoba', 
        id: k.id, 
        text: k.word, 
        correct: k.meaning, 
        wrongs: wrongs
      };
    })];
  }

  // Acak urutan soal secara keseluruhan
  pool.sort(() => Math.random() - 0.5);
  const selected = pool.slice(0, count);

  return selected.map((item) => {
    // Gabungkan jawaban benar dan 3 jawaban salah, lalu acak posisinya
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
    // 1. Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { receiverId, mode } = await req.json();

    if (user.id === receiverId) return NextResponse.json({ error: "Tidak bisa menantang diri sendiri" }, { status: 400 });

    // 2. Cek apakah mereka berteman (status: accepted)
    const { data: friendship } = await supabaseAdmin
      .from('friends')
      .select('id')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${user.id})`)
      .eq('status', 'accepted')
      .maybeSingle();

    if (!friendship) return NextResponse.json({ error: "Hanya bisa menantang teman" }, { status: 403 });

    // 3. Cek apakah salah satu sedang dalam match aktif (mencegah double match)
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
    
    const { error: qError } = await supabaseAdmin.from('battle_questions').insert(questionsInsert);
    if (qError) throw new Error("Gagal membuat soal: " + qError.message);

    // 6. Daftarkan peserta (Pengirim & Penerima)
    const { error: pError } = await supabaseAdmin.from('battle_participants').insert([
      { match_id: match.id, user_id: user.id, status: 'ready' },
      { match_id: match.id, user_id: receiverId, status: 'waiting' }
    ]);
    if (pError) throw new Error("Gagal mendaftarkan peserta: " + pError.message);

    // 7. Buat Undangan
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