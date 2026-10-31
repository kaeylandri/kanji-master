// app/api/battle/start/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { matchId } = await req.json();

    // Pastikan hanya pembuat match yang bisa memulai
    const { data: match } = await supabaseAdmin
      .from('battle_matches')
      .select('created_by, status')
      .eq('id', matchId)
      .single();

    if (!match) return NextResponse.json({ error: "Match tidak ditemukan" }, { status: 404 });
    if (match.created_by !== user.id) return NextResponse.json({ error: "Hanya pemilik ruang yang bisa memulai" }, { status: 403 });
    if (match.status !== 'waiting') return NextResponse.json({ error: "Pertandingan sudah dimulai" }, { status: 400 });

    // Panggil RPC untuk memulai match
    await supabaseAdmin.rpc('start_battle_match', { p_match_id: matchId });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}