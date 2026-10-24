// app/api/kotoba/semua/route.ts
import { NextResponse } from "next/server";
import kotobaData from "@/data/kotoba.json";

export async function GET() {
  try {
    // 🆕 Pastikan kotobaData adalah array
    if (!kotobaData || !Array.isArray(kotobaData)) {
      console.error("Kotoba data tidak valid");
      return NextResponse.json({ error: "Data kotoba tidak valid" }, { status: 500 });
    }

    return NextResponse.json(kotobaData);
  } catch (err: any) {
    console.error("API semua kotoba error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}