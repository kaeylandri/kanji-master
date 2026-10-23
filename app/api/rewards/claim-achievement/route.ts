// app/api/rewards/claim-achievement/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId, achievementId, rewardExp, rewardCoins, rewardHint, rewardFreeze, rewardReveal } = await request.json();

    if (!userId || !achievementId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 1. Cek apakah sudah pernah diklaim
    const { data: existingClaim } = await supabaseAdmin
      .from('achievement_rewards')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .maybeSingle();

    if (existingClaim) {
      return NextResponse.json({ error: "Achievement ini sudah diklaim!" }, { status: 400 });
    }

    // 2. Catat klaim
    const { error: insertError } = await supabaseAdmin
      .from('achievement_rewards')
      .insert({
        user_id: userId,
        achievement_id: achievementId,
        claimed_at: new Date().toISOString()
      });

    if (insertError) {
      return NextResponse.json({ error: "Gagal mencatat klaim: " + insertError.message }, { status: 500 });
    }

    // 3. Update profil (EXP & Koin)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('total_exp, sakura_coins')
      .eq('id', userId)
      .single();

    const currentExp = profile?.total_exp || 0;
    const currentCoins = profile?.sakura_coins || 0;

    await supabaseAdmin
      .from('profiles')
      .update({
        total_exp: currentExp + rewardExp,
        sakura_coins: currentCoins + rewardCoins,
      })
      .eq('id', userId);

    // 4. Update inventory (Item)
    if (rewardHint > 0 || rewardFreeze > 0 || rewardReveal > 0) {
      // Ambil inventory saat ini dari tabel (asumsi ada tabel user_inventory)
      // Untuk sementara, kita simpan di user_progress atau tabel baru
      // Rekomendasi: buat tabel user_inventory
      console.log("TODO: Save item to inventory");
    }

    return NextResponse.json({ 
      success: true, 
      message: `Achievement diklaim! +${rewardExp} XP, +${rewardCoins} Koin`,
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}