// app/api/kotoba/semua/route.ts
import { NextResponse } from "next/server";
import kotobaData from "@/data/kotoba.json"; // Sesuaikan path JSON kotoba kamu

export async function GET() {
  try {
    return NextResponse.json(kotobaData);
  } catch (err) {
    console.error("API kotoba error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}