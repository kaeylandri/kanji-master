  // app/api/categories/[slug]/kanji/route.ts
  import { NextResponse } from "next/server";
  import { KANJI_DATA } from "@/data/kanji";

  export async function GET(
    request: Request,
    { params }: { params: { slug: string } } // 🆕 Hapus Promise
  ) {
    try {
      // 🆕 Tidak perlu await params, langsung ambil slug
      const slug = params.slug;
      
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