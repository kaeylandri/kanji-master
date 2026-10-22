// app/api/categories/[slug]/kanji/route.ts
import { NextResponse } from "next/server";
import kanjiData from "@/data/kanji.json";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    // Filter kanji berdasarkan categorySlug
    const filteredKanji = kanjiData.filter((k: any) => k.categorySlug === slug);
    return NextResponse.json(filteredKanji);
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}