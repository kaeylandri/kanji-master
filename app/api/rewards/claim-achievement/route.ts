// app/api/rewards/claim-achievement/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🆕 Gunakan Service Role Key (Bukan Anon Key) agar bisa bypass RLS
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

    // 1. Cek apakah achievement sudah pernah diklaim
    const { data: existingClaim } = await supabaseAdmin
      .from('achievement_rewards')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .maybeSingle();

    if (existingClaim) {
      return NextResponse.json({ error: "Achievement ini sudah diklaim!" }, { status: 400 });
    }

    // 2. Catat klaim ke tabel achievement_rewards
    const { error: insertError } = await supabaseAdmin
      .from('achievement_rewards')
      .insert({
        user_id: userId,
        achievement_id: achievementId,
      });

    if (insertError) {
      console.error("Insert Error:", insertError);
      return NextResponse.json({ error: "Gagal mencatat klaim: " + insertError.message }, { status: 500 });
    }

    // 3. Ambil data profil saat ini
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('total_exp, sakura_coins')
      .eq('id', userId)
      .single();

    // 4. Update profil dengan hadiah baru
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        total_exp: (profile?.total_exp || 0) + (rewardExp || 0),
        sakura_coins: (profile?.sakura_coins || 0) + (rewardCoins || 0),
      })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: "Gagal update reward: " + updateError.message }, { status: 500 });
    }

    // 5. Update Inventory (Hint, Freeze, Reveal)
    if (rewardHint > 0 || rewardFreeze > 0 || rewardReveal > 0) {
      // Ambil inventory saat ini
      const { data: inventory } = await supabaseAdmin
        .from('user_inventory')
        .select('hint, freeze_count, reveal')
        .eq('user_id', userId)
        .single();

      if (inventory) {
        // Jika baris inventory sudah ada, update
        await supabaseAdmin
          .from('user_inventory')
          .update({
            hint: (inventory.hint || 0) + (rewardHint || 0),
            freeze_count: (inventory.freeze_count || 0) + (rewardFreeze || 0),
            reveal: (inventory.reveal || 0) + (rewardReveal || 0),
          })
          .eq('user_id', userId);
      } else {
        // Jika belum ada (user baru), buat baris baru
        await supabaseAdmin
          .from('user_inventory')
          .insert({
            user_id: userId,
            hint: rewardHint || 0,
            freeze_count: rewardFreeze || 0,
            reveal: rewardReveal || 0,
          });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Hadiah berhasil diklaim!` 
    });

  } catch (err: any) {
    console.error("Server Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}