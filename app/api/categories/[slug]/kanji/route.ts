import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 🆕 Jika slug "semua", ambil semua data kanji
    if (slug === "semua") {
      const allKanji = await prisma.kanji.findMany({
        orderBy: { id: "asc" },
      });
      return NextResponse.json(allKanji);
    }

    const category = await prisma.category.findUnique({
      where: { slug },
      include: { kanji: { orderBy: { id: "asc" } } },
    });

    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(category.kanji);
  } catch (err) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}