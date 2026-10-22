// app/api/categories/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

export async function GET() {
  try {
    // Ambil semua data kanji dari tabel 'kanji' di Supabase
    const { data: kanjiData, error } = await supabase
      .from('kanji') // Pastikan nama tabel di Supabase kamu adalah 'kanji'
      .select('*');

    if (error) throw error;

    // Kelompokkan data berdasarkan kategori
    const categoryMap: Record<string, any> = {};

    (kanjiData || []).forEach((k: any) => {
      const catSlug = k.category_slug || "uncategorized"; // Sesuaikan dengan nama kolom di Supabase
      const catTitle = k.category_title || "Uncategorized";
      
      if (!categoryMap[catSlug]) {
        categoryMap[catSlug] = {
          id: Object.keys(categoryMap).length + 1,
          slug: catSlug,
          title: catTitle,
          priority: k.priority || null,
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