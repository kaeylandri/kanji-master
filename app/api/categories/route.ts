// app/api/categories/route.ts
import { NextResponse } from "next/server";
import kotobaData from "@/data/kotoba.json";

export async function GET() {
  try {
    // Ambil daftar nama kategori dari file kotoba.json
    const kotobaCategories = Array.from(new Set(kotobaData.map((k: any) => k.category)));
    
    // Format ulang ke bentuk yang dibutuhkan halaman
    const categories = kotobaCategories.map((catName, index) => {
      const kotobaInCat = kotobaData.filter((k: any) => k.category === catName);
      return {
        id: index + 1,
        slug: catName.toLowerCase().replace(/ /g, "-"),
        title: catName,
        priority: null,
        count: kotobaInCat.length,
        kanjiIds: [], // Kosongkan dulu karena data Kanji belum ada
      };
    });

    return NextResponse.json(categories);
  } catch (err) {
    console.error("API categories error:", err);
    return NextResponse.json([], { status: 200 }); // Kembalikan array kosong jika error
  }
}