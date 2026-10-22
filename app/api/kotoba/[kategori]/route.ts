// app/api/kotoba/semua/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase.from('kotoba').select('*'); // Sesuaikan nama tabel
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("API kotoba error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}