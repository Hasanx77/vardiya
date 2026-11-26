import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/auth";
import { sahipMi } from "@/lib/visits";

export const dynamic = "force-dynamic";

type Tablo = { ad: string; tur: string; satir: number; kolonlar: { ad: string; tur: string }[] };

/**
 * SQL paneli — tablo listesi ve şeması.
 * Yalnızca **site sahibi**. Tablo adları veritabanının kendisinden gelir;
 * yine de tırnaklanarak kullanılır.
 */
export async function GET() {
  const kullanici = await aktifKullanici();
  if (!kullanici) return NextResponse.json({ hata: "Oturum gerekli" }, { status: 401 });
  if (!sahipMi(kullanici.email)) {
    return NextResponse.json({ hata: "Bu ekran yalnızca site sahibine açık." }, { status: 404 });
  }

  try {
    const ham = await prisma.$queryRawUnsafe<{ name: string; type: string }[]>(
      `SELECT name, type FROM sqlite_master
        WHERE type IN ('table','view')
          AND name NOT LIKE 'sqlite_%'
          AND name NOT LIKE '_prisma%'
        ORDER BY name`,
    );

    const tablolar: Tablo[] = [];
    for (const t of ham) {
      const tirnakli = `"${String(t.name).replace(/"/g, '""')}"`;
      let satir = 0;
      let kolonlar: { ad: string; tur: string }[] = [];
      try {
        const sayi = await prisma.$queryRawUnsafe<{ n: bigint | number }[]>(
          `SELECT COUNT(*) AS n FROM ${tirnakli}`,
        );
        satir = Number(sayi[0]?.n ?? 0);
      } catch {
        satir = -1;
      }
      try {
        const kol = await prisma.$queryRawUnsafe<{ name: string; type: string }[]>(
          `PRAGMA table_info(${tirnakli})`,
        );
        kolonlar = kol.map((k) => ({ ad: String(k.name), tur: String(k.type ?? "") }));
      } catch {
        kolonlar = [];
      }
      tablolar.push({ ad: String(t.name), tur: String(t.type), satir, kolonlar });
    }

    return NextResponse.json({ tablolar }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("sql/tablolar:", e);
    return NextResponse.json({ hata: "Tablolar okunamadı." }, { status: 500 });
  }
}
