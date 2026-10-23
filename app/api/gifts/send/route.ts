// app/api/gifts/send/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { senderId, receiverId, itemType, amount } = await request.json();

    // 1. Cek saldo pengirim berdasarkan tipe item
    if (itemType === "coins") {
      const { data: sender } = await supabaseAdmin
        .from('profiles')
        .select('sakura_coins')
        .eq('id', senderId)
        .single();

      if (!sender || sender.sakura_coins < amount) {
        return NextResponse.json({ error: "Koin tidak cukup" }, { status: 400 });
      }

      await supabaseAdmin
        .from('profiles')
        .update({ sakura_coins: sender.sakura_coins - amount })
        .eq('id', senderId);
    } else if (itemType === "freeze") {
      // 🆕 Gunakan freeze_count
      const { data: inv } = await supabaseAdmin
        .from('user_inventory')
        .select('freeze_count')
        .eq('user_id', senderId)
        .single();

      if (!inv || inv.freeze_count < amount) {
        return NextResponse.json({ error: "Item Freeze tidak cukup" }, { status: 400 });
      }

      await supabaseAdmin
        .from('user_inventory')
        .update({ freeze_count: inv.freeze_count - amount })
        .eq('user_id', senderId);
    } else {
      return NextResponse.json({ error: "Tipe item tidak valid" }, { status: 400 });
    }

    // 2. Simpan hadiah ke tabel gifts
    await supabaseAdmin.from('gifts').insert({
      sender_id: senderId,
      receiver_id: receiverId,
      item_type: itemType,
      amount: amount,
      is_claimed: false,
    });

    return NextResponse.json({ success: true, message: "Hadiah terkirim!" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}