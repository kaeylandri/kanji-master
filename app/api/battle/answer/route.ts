// app/api/battle/answer/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { matchId, questionId, selectedAnswer, responseTimeMs } = await req.json();

    // 2. Validasi Match (Harus aktif)
    const { data: match } = await supabaseAdmin
      .from('battle_matches')
      .select('status, ends_at')
      .eq('id', matchId)
      .single();

    if (!match || match.status !== 'active') {
      return NextResponse.json({ error: "Pertandingan tidak aktif" }, { status: 400 });
    }

    // Cek waktu server (Toleransi 2 detik untuk network latency)
    if (new Date(match.ends_at).getTime() < Date.now() - 2000) {
      return NextResponse.json({ error: "Waktu habis" }, { status: 400 });
    }

    // 3. Ambil soal & kunci jawaban (Dari database, bukan dari client)
    const { data: question } = await supabaseAdmin
      .from('battle_questions')
      .select('correct_answer')
      .eq('id', questionId)
      .eq('match_id', matchId)
      .single();

    if (!question) return NextResponse.json({ error: "Soal tidak valid" }, { status: 404 });

    const isCorrect = question.correct_answer === selectedAnswer;

    // 4. Catat Jawaban (Gunakan RPC/Transaksi agar atomic, tapi di sini kita pakai insert)
    // Unique constraint di database akan mencegah jawaban ganda (Error 23505)
    const { error: insertError } = await supabaseAdmin
      .from('battle_answers')
      .insert({
        match_id: matchId,
        user_id: user.id,
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        response_time_ms: responseTimeMs
      });

    if (insertError) {
      // Jika error karena jawaban ganda, kembalikan 409 (Conflict)
      if (insertError.code === '23505') {
        return NextResponse.json({ error: "Soal sudah dijawab" }, { status: 409 });
      }
      throw insertError;
    }

    // 5. Update Skor (Jika benar)
    if (isCorrect) {
      // Gunakan RPC atomic untuk menambah skor agar tidak race condition
      await supabaseAdmin.rpc('increment_battle_score', {
        p_match_id: matchId,
        p_user_id: user.id,
        p_points: 10
      });
    }

    return NextResponse.json({ success: true, isCorrect });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}