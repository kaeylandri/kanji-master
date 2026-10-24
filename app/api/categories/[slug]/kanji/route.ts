// app/api/categories/[slug]/kanji/route.ts
import { NextResponse } from "next/server";
import { KANJI_DATA } from "@/data/kanji";

// 🆕 Next.js 15/16: params adalah Promise
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // 🆕 Wajib await params
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    
    if (!slug) {
      return NextResponse.json({ error: "Slug tidak ditemukan" }, { status: 400 });
    }

    // Filter kanji berdasarkan categorySlug
    const filteredKanji = KANJI_DATA.filter((k) => k.categorySlug === slug);
    
    return NextResponse.json(filteredKanji);
  } catch (err: any) {
    console.error("API kanji per kategori error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}