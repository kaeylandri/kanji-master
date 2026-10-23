// app/api/categories/[slug]/kanji/route.ts
import { NextResponse } from "next/server";
import { KANJI_DATA } from "@/data/kanji";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params; // Next.js 15: params adalah Promise
    
    // Filter kanji berdasarkan categorySlug yang sesuai dengan slug di URL
    const filteredKanji = KANJI_DATA.filter((k) => k.categorySlug === slug);
    
    // Kembalikan data yang sudah difilter (bisa berupa array kosong jika tidak ada)
    return NextResponse.json(filteredKanji);
  } catch (err) {
    console.error("API kanji per kategori error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}