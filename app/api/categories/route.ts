// app/api/categories/route.ts
import { NextResponse } from "next/server";
import { KANJI_DATA } from "@/data/kanji";

export async function GET() {
  try {
    const categoriesMap: Record<string, any> = {};
    KANJI_DATA.forEach((k) => {
      if (!categoriesMap[k.categorySlug]) {
        categoriesMap[k.categorySlug] = {
          id: Object.keys(categoriesMap).length + 1,
          slug: k.categorySlug,
          title: k.categoryTitle,
          priority: "tinggi",
          count: 0,
          kanjiIds: [],
        };
      }
      categoriesMap[k.categorySlug].count += 1;
      categoriesMap[k.categorySlug].kanjiIds.push(k.id);
    });
    return NextResponse.json(Object.values(categoriesMap));
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}