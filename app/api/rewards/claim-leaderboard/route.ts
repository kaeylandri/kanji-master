// app/api/rewards/claim-leaderboard/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function getWeekIdentifier() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNumber}`;
}

export async function POST(request: Request) {
  try {
    const { userId, rank, rewardExp, rewardCoins } = await request.json();
    const weekId = getWeekIdentifier();

    // 1. Cek klaim minggu ini
    const { data: existingClaim } = await supabaseAdmin
      .from('leaderboard_rewards')
      .select('id')
      .eq('user_id', userId)
      .eq('week_identifier', weekId)
      .maybeSingle();

    if (existingClaim) {
      return NextResponse.json({ error: "Hadiah minggu ini sudah diklaim!" }, { status: 400 });
    }

    // 2. Catat klaim
    await supabaseAdmin.from('leaderboard_rewards').insert({
      user_id: userId,
      week_identifier: weekId,
      rank_claimed: rank,
    });

    // 3. Update profil
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('total_exp, sakura_coins')
      .eq('id', userId)
      .single();

    await supabaseAdmin.from('profiles').update({
      total_exp: (profile?.total_exp || 0) + rewardExp,
      sakura_coins: (profile?.sakura_coins || 0) + rewardCoins,
    }).eq('id', userId);

    return NextResponse.json({ success: true, message: `Hadiah Peringkat #${rank} diklaim!` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}