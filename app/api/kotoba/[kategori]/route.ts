import { NextResponse } from "next/server";
import kotobaData from "@/data/kotoba.json";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ kategori: string }> }
) {
  const { kategori } = await params;
  if (kategori === "semua") return NextResponse.json(kotobaData);
  
  const decodedKategori = decodeURIComponent(kategori);
  const filtered = kotobaData.filter((k) => k.category === decodedKategori);
  
  if (filtered.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(filtered);
}