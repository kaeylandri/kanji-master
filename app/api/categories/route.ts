// app/api/categories/route.ts
import { NextResponse } from "next/server";
import kanjiData from "@/data/kanji.json"; // Pastikan path ini sesuai dengan lokasi file kanji.json kamu

export async function GET() {
  try {
    // Kita akan mengelompokkan kanji berdasarkan kategorinya dari file JSON
    const categoryMap: Record<string, any> = {};

    // Asumsi: file kanji.json berisi array objek dengan properti category: { slug, title, priority }
    kanjiData.forEach((k: any) => {
      const catSlug = k.category?.slug || "uncategorized";
      const catTitle = k.category?.title || "Uncategorized";
      
      if (!categoryMap[catSlug]) {
        categoryMap[catSlug] = {
          id: Object.keys(categoryMap).length + 1,
          slug: catSlug,
          title: catTitle,
          priority: k.category?.priority || null,
          count: 0,
          kanjiIds: [],
        };
      }
      
      categoryMap[catSlug].count += 1;
      categoryMap[catSlug].kanjiIds.push(k.id);
    });

    const categories = Object.values(categoryMap);
    return NextResponse.json(categories);
  } catch (err) {
    console.error("API categories error:", err);
    return NextResponse.json(
      { error: "Internal error", detail: String(err) },
      { status: 500 }
    );
  }
}