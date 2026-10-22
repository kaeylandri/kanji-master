// app/api/categories/route.ts
import { NextResponse } from "next/server";
import kotobaData from "@/data/kotoba.json";

export async function GET() {
  try {
    // Hanya ambil kategori dari Kotoba (karena Kanji belum ada file JSON-nya)
    const kotobaCategories = Array.from(new Set(kotobaData.map((k: any) => k.category)));
    
    const categories = kotobaCategories.map((catName, index) => {
      const kotobaInCat = kotobaData.filter((k: any) => k.category === catName);
      return {
        id: index + 1,
        slug: catName.toLowerCase().replace(/ /g, "-"),
        title: catName,
        priority: null,
        count: kotobaInCat.length,
        kanjiIds: [],
      };
    });

    return NextResponse.json(categories);
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}