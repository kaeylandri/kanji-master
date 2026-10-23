// app/api/categories/[slug]/kanji/route.ts
import { NextResponse } from "next/server";
import { KANJI_DATA } from "@/data/kanji";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const filteredKanji = KANJI_DATA.filter((k) => k.categorySlug === slug);
    return NextResponse.json(filteredKanji);
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}