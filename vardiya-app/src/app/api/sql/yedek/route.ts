import { NextResponse } from "next/server";
import { readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { activeDbPath } from "@/lib/db-bakim";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/auth";
import { sahipMi } from "@/lib/visits";
import { istanbulGunu } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * Veritabanı yedeği (yalnızca site sahibi).
 *
 * Kopya `VACUUM INTO` ile alınır: SQLite yazma sürerken bile **tutarlı** tek
 * dosya üretir. Doğrudan dosya kopyalamak yarım işlem görebilir.
 */
export async function GET() {
  const kullanici = await aktifKullanici();
  if (!kullanici) return NextResponse.json({ hata: "Oturum gerekli" }, { status: 401 });
  if (!sahipMi(kullanici.email)) {
    return NextResponse.json({ hata: "Yalnızca site sahibi." }, { status: 404 });
  }

  const gecici = join(tmpdir(), `vardiya-yedek-${Date.now()}.db`);
  try {
    await prisma.$executeRawUnsafe(`VACUUM INTO '${gecici.replace(/'/g, "''")}'`);
    const veri = await readFile(gecici);
    await unlink(gecici).catch(() => {});

    return new NextResponse(new Uint8Array(veri), {
      headers: {
        "content-type": "application/octet-stream",
        "content-disposition": `attachment; filename="vardiya-${istanbulGunu()}.db"`,
        "content-length": String(veri.length),
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    console.error("sql/yedek:", e);
    // Son çare: doğrudan dosyayı oku (WAL varsa tutarsız olabilir, uyarı verilir).
    try {
      const veri = await readFile(activeDbPath());
      return new NextResponse(new Uint8Array(veri), {
        headers: {
          "content-type": "application/octet-stream",
          "content-disposition": `attachment; filename="vardiya-${istanbulGunu()}.db"`,
          "cache-control": "no-store",
        },
      });
    } catch {
      return NextResponse.json({ hata: "Yedek alınamadı." }, { status: 500 });
    }
  }
}
