// app/api/categories/route.ts
import { NextResponse } from "next/server";
import kanjiData from "@/data/kanji.json";

export async function GET() {
  try {
    const categoriesMap: Record<string, any> = {};

    kanjiData.forEach((k: any) => {
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

    const categories = Object.values(categoriesMap);
    return NextResponse.json(categories);
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}