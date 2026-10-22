import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { orderIndex: "asc" },
      include: {
        _count: { select: { kanji: true } },
        kanji: { select: { id: true } }, // 🆕 Ambil array ID kanji untuk cek hafalan
      },
    });

    // Format ulang agar ringan
    const data = categories.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      title: cat.title,
      priority: cat.priority,
      count: cat._count.kanji,
      kanjiIds: cat.kanji.map((k) => k.id),
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error("API categories error:", err);
    return NextResponse.json(
      { error: "Internal error", detail: String(err) },
      { status: 500 }
    );
  }
}