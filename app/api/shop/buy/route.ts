// app/api/shop/buy/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId, itemId, itemType, price } = await request.json();

    if (!userId || !itemId || !itemType) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 1. Cek saldo koin user di Database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('sakura_coins')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (profile.sakura_coins < price) {
      return NextResponse.json({ error: "Koin tidak cukup!" }, { status: 400 });
    }

    // 2. Potong saldo koin
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ sakura_coins: profile.sakura_coins - price })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: "Gagal memotong koin: " + updateError.message }, { status: 500 });
    }

    // 3. Tambahkan item ke Inventory
    // Pastikan nama kolom di database sesuai (freeze_count / hint / reveal)
    const columnToUpdate = itemType === "freeze" ? "freeze_count" : itemType === "hint" ? "hint" : "reveal";
    
    // Ambil inventory saat ini
    const { data: inventory } = await supabaseAdmin
      .from('user_inventory')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (inventory) {
      // Update jika sudah ada
      await supabaseAdmin
        .from('user_inventory')
        .update({ [columnToUpdate]: (inventory[columnToUpdate] || 0) + 1 })
        .eq('user_id', userId);
    } else {
      // Insert jika belum ada
      await supabaseAdmin
        .from('user_inventory')
        .insert({
          user_id: userId,
          [columnToUpdate]: 1
        });
    }

    // 4. Catat transaksi (Opsional)
    await supabaseAdmin.from('shop_transactions').insert({
      user_id: userId,
      item_id: itemId,
      item_type: itemType,
      price: price
    });

    return NextResponse.json({ success: true, message: "Pembelian berhasil" });

  } catch (err: any) {
    console.error("Server Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}