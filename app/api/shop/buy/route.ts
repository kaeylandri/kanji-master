// app/api/shop/buy/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId, itemId, price, itemType, itemKey } = await request.json();

    // 1. Cek saldo Koin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('sakura_coins')
      .eq('id', userId)
      .single();

    if (!profile || profile.sakura_coins < price) {
      return NextResponse.json({ error: "Koin tidak cukup" }, { status: 400 });
    }

    // 2. Potong Koin
    await supabaseAdmin
      .from('profiles')
      .update({ sakura_coins: profile.sakura_coins - price })
      .eq('id', userId);

    // 3. Tambahkan Item / Catat transaksi
    // Jika Consumable (freeze, hint, reveal)
    if (itemType === "consumable") {
      // Update inventory di tabel user_inventory
      const { data: inv } = await supabaseAdmin
        .from('user_inventory')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Mapping itemKey ke nama kolom database
const dbColumn = itemKey === "freeze" ? "freeze_count" : itemKey;
const currentVal = inv ? inv[dbColumn as "freeze_count" | "hint" | "reveal"] : 0;

await supabaseAdmin.from('user_inventory').upsert({
  user_id: userId,
  [dbColumn]: currentVal + 1,
  updated_at: new Date().toISOString(),
});
    }

    // 4. Catat transaksi
    await supabaseAdmin.from('shop_transactions').insert({
      user_id: userId,
      item_id: itemId,
      item_type: itemType,
      price: price,
    });

    return NextResponse.json({ success: true, message: "Pembelian berhasil!" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}