// app/api/kotoba/[kategori]/route.ts
import { NextResponse } from "next/server";
import kotobaData from "@/data/kotoba.json";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ kategori: string }> }
) {
  try {
    const { kategori } = await params;
    const decodedKategori = decodeURIComponent(kategori);
    
    // Filter data Kotoba berdasarkan kategori
    const filteredKotoba = kotobaData.filter((k: any) => k.category === decodedKategori);
    
    return NextResponse.json(filteredKotoba);
  } catch (err) {
    console.error("API kotoba per kategori error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}