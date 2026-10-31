// app/api/battle/accept/route.ts
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

    const { inviteId, matchId, action } = await req.json();

    // 1. Ambil data undangan
    const { data: invite } = await supabaseAdmin
      .from('battle_invites')
      .select('*')
      .eq('id', inviteId)
      .eq('receiver_id', user.id) // Pastikan hanya penerima yang bisa aksi
      .single();

    if (!invite || invite.status !== 'pending') {
      return NextResponse.json({ error: "Undangan tidak valid atau sudah kedaluwarsa" }, { status: 400 });
    }

    // 2. Jika Reject
    if (action === 'reject') {
      await supabaseAdmin.from('battle_invites').update({ status: 'rejected' }).eq('id', inviteId);
      await supabaseAdmin.from('battle_matches').update({ status: 'cancelled' }).eq('id', matchId);
      return NextResponse.json({ success: true, message: "Undangan ditolak" });
    }

    // 3. Jika Accept: Update Undangan jadi 'accepted'
    await supabaseAdmin.from('battle_invites').update({ status: 'accepted' }).eq('id', inviteId);
    
    // 4. Update Participant (lawan) jadi 'ready'
    await supabaseAdmin
      .from('battle_participants')
      .update({ status: 'ready' })
      .eq('match_id', matchId)
      .eq('user_id', user.id);

    // 🆕 JANGAN UBAH STATUS MATCH JADI 'active' DI SINI.
    // Biarkan statusnya 'waiting' sampai pemilik ruangan menekan tombol "Mulai Pertandingan".

    return NextResponse.json({ success: true, message: "Undangan diterima", matchId });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}