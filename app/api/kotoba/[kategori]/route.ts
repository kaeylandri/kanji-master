// app/api/kotoba/[kategori]/route.ts
import { NextResponse } from "next/server";
import kotobaData from "@/data/kotoba.json";

// 🆕 Next.js 15/16: params adalah Promise
export async function GET(
  request: Request,
  { params }: { params: Promise<{ kategori: string }> }
) {
  try {
    // 🆕 Wajib await params
    const resolvedParams = await params;
    const kategori = resolvedParams.kategori;
    
    if (!kategori) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 400 });
    }

    const decodedKategori = decodeURIComponent(kategori);
    
    // Filter data Kotoba berdasarkan kategori
    const filteredKotoba = kotobaData.filter((k: any) => k.category === decodedKategori);
    
    return NextResponse.json(filteredKotoba);
  } catch (err: any) {
    console.error("API kotoba per kategori error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}