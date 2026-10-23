// app/api/kanji/route.ts (atau sesuaikan nama file-nya)
import { NextResponse } from "next/server";
import { KANJI_DATA } from "@/data/kanji";

export async function GET() {
  try {
    return NextResponse.json(KANJI_DATA);
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}