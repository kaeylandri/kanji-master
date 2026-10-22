// app/api/categories/semua/kanji/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // Sementara, kembalikan array kosong (karena kanji.json belum ada)
  // Ini mencegah error "page could not load" saat membuka halaman latihan
  return NextResponse.json([]);
}