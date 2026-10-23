// app/api/rewards/claim-mission/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Gunakan service role key agar bisa update tanpa RLS (hanya di server)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. Dapatkan data dari body
    const { userId, missionId, periodKey, rewardExp, rewardCoins } = await request.json();

    if (!userId || !missionId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 2. Cek apakah misi ini sudah pernah diklaim di periode ini
    const { data: existingClaim } = await supabaseAdmin
      .from('mission_claims')
      .select('id')
      .eq('user_id', userId)
      .eq('mission_id', missionId)
      .eq('period_key', periodKey)
      .maybeSingle();

    if (existingClaim) {
      return NextResponse.json({ error: "Misi ini sudah diklaim!" }, { status: 400 });
    }

    // 3. Catat klaim (tabel baru)
    const { error: insertError } = await supabaseAdmin
      .from('mission_claims')
      .insert({
        user_id: userId,
        mission_id: missionId,
        period_key: periodKey,
        claimed_at: new Date().toISOString()
      });

    if (insertError) {
      return NextResponse.json({ error: "Gagal mencatat klaim: " + insertError.message }, { status: 500 });
    }

    // 4. Tambahkan reward ke profil user
    // Ambil dulu EXP & Koin saat ini
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('exp, coins')
      .eq('id', userId)
      .single();

    const currentExp = profile?.exp || 0;
    const currentCoins = profile?.coins || 0;

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        exp: currentExp + rewardExp,
        coins: currentCoins + rewardCoins,
      })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: "Gagal update reward: " + updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Hadiah diklaim! +${rewardExp} XP, +${rewardCoins} Koin`,
      newExp: currentExp + rewardExp,
      newCoins: currentCoins + rewardCoins
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}