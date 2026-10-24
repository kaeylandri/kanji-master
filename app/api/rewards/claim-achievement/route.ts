// app/api/rewards/claim-achievement/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    // 🆕 Cek Environment Variable dulu
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("Missing Supabase Environment Variables!");
      return NextResponse.json({ error: "Konfigurasi server tidak lengkap." }, { status: 500 });
    }

    // Gunakan Service Role Key agar bisa bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const { userId, achievementId, rewardExp, rewardCoins, rewardHint, rewardFreeze, rewardReveal } = await request.json();

    if (!userId || !achievementId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 1. Cek apakah achievement sudah pernah diklaim
    const { data: existingClaim, error: checkError } = await supabaseAdmin
      .from('achievement_rewards')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .maybeSingle();

    if (checkError) {
      console.error("Check Error:", checkError);
      return NextResponse.json({ error: "Gagal mengecek klaim: " + checkError.message }, { status: 500 });
    }

    if (existingClaim) {
      return NextResponse.json({ error: "Achievement ini sudah diklaim!" }, { status: 400 });
    }

    // 2. Catat klaim ke tabel achievement_rewards
    const { error: insertError } = await supabaseAdmin
      .from('achievement_rewards')
      .insert({ user_id: userId, achievement_id: achievementId });

    if (insertError) {
      console.error("Insert Error:", insertError);
      return NextResponse.json({ error: "Gagal mencatat klaim: " + insertError.message }, { status: 500 });
    }

    // 3. Ambil data profil saat ini
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('total_exp, sakura_coins')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error("Profile Error:", profileError);
    }

    // 4. Update profil dengan hadiah baru
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        total_exp: (profile?.total_exp || 0) + (rewardExp || 0),
        sakura_coins: (profile?.sakura_coins || 0) + (rewardCoins || 0),
      })
      .eq('id', userId);

    if (updateError) {
      console.error("Update Error:", updateError);
      return NextResponse.json({ error: "Gagal update reward: " + updateError.message }, { status: 500 });
    }

    // 5. Update Inventory (Aman dari error kolom)
    if (rewardHint > 0 || rewardFreeze > 0 || rewardReveal > 0) {
      // Cek dulu apakah baris inventory user ada
      const { data: inventory } = await supabaseAdmin
        .from('user_inventory')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (inventory) {
        // Jika ada, update (pastikan nama kolom sesuai DB kamu)
        await supabaseAdmin
          .from('user_inventory')
          .update({
            hint: (inventory.hint || 0) + (rewardHint || 0),
            freeze_count: (inventory.freeze_count || 0) + (rewardFreeze || 0),
            reveal: (inventory.reveal || 0) + (rewardReveal || 0),
          })
          .eq('user_id', userId);
      } else {
        // Jika belum ada, buat baru (Insert)
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

    return NextResponse.json({ success: true, message: `Hadiah berhasil diklaim!` });

  } catch (err: any) {
    console.error("Fatal Server Error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan sistem: " + err.message }, { status: 500 });
  }
}