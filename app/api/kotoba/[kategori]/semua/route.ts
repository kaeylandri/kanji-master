// app/api/kotoba/semua/route.ts
import { NextResponse } from "next/server";
import kotobaData from "@/data/kotoba.json";

export async function GET() {
  try {
    return NextResponse.json(kotobaData);
  } catch (err: any) {
    console.error("API semua kotoba error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}