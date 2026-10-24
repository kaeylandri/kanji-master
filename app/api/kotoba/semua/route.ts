// app/api/kotoba/semua/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export async function GET() {
  try {
    const jsonDirectory = path.join(process.cwd(), "data");
    const fileContents = await fs.readFile(jsonDirectory + "/kotoba.json", "utf8");
    const kotobaData = JSON.parse(fileContents);

    if (!kotobaData || !Array.isArray(kotobaData)) {
      return NextResponse.json({ error: "Data kotoba tidak valid" }, { status: 500 });
    }

    return NextResponse.json(kotobaData);
  } catch (err: any) {
    console.error("API semua kotoba error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}