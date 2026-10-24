// app/api/categories/semua/kanji/route.ts
import { NextResponse } from "next/server";
import { KANJI_DATA } from "@/data/kanji";

export async function GET() {
  try {
    return NextResponse.json(KANJI_DATA);
  } catch (err: any) {
    console.error("API semua kanji error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}