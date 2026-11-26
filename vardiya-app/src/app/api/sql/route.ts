import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/auth";
import { sahipMi } from "@/lib/visits";
import { denemeBasarisiz, denemeIzinli } from "@/lib/rate-limit";
import { istemciIp } from "@/lib/url";
import { SQL_SATIR_SINIRI, sqlJsonlastir, sqlKontrol } from "@/lib/sql-guard";

export const dynamic = "force-dynamic";

/**
 * SQL paneli — **salt-okunur** sorgu çalıştırıcı.
 *
 * Koruma katmanları:
 *   1. Oturum + site sahibi doğrulaması
 *   2. `sqlKontrol` (tek ifade, yorum yok, yazma anahtar sözcüğü yok, LIMIT)
 *   3. IP başına dakikada 30 sorgu
 *   4. Sonuç 200 satırla sınırlı
 *
 * Not: SQLite'ın kendi yazma koruması yoktur; bu yüzden kural denetimi
 * **çalıştırmadan önce** yapılır ve yalnızca okuma ifadeleri geçer.
 */
export async function POST(req: Request) {
  const kullanici = await aktifKullanici();
  if (!kullanici) return NextResponse.json({ hata: "Oturum gerekli" }, { status: 401 });
  if (!sahipMi(kullanici.email)) {
    return NextResponse.json({ hata: "Bu ekran yalnızca site sahibine açık." }, { status: 404 });
  }

  const ip = istemciIp(req);
  if (!denemeIzinli(`sql|${ip}`, 30)) {
    return NextResponse.json({ hata: "Çok fazla sorgu. Bir dakika sonra dene." }, { status: 429 });
  }
  denemeBasarisiz(`sql|${ip}`);

  const govde = (await req.json().catch(() => ({}))) as { sorgu?: unknown };
  const kontrol = sqlKontrol(String(govde.sorgu ?? ""));
  if (!kontrol.ok) {
    return NextResponse.json({ hata: kontrol.hata }, { status: 400 });
  }

  const bas = Date.now();
  try {
    const sonuc = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(kontrol.sql);
    const sureMs = Date.now() - bas;
    const toplam = sonuc.length;
    const satirlar = sqlJsonlastir(sonuc.slice(0, SQL_SATIR_SINIRI));
    const kolonlar = satirlar.length ? Object.keys(satirlar[0]) : [];

    return NextResponse.json(
      {
        ok: true,
        kolonlar,
        satirlar,
        toplam,
        kesildi: toplam > SQL_SATIR_SINIRI,
        sureMs,
        calisan: kontrol.sql,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : String(e);
    console.error("sql:", mesaj.slice(0, 200));
    return NextResponse.json(
      { hata: mesaj.replace(/^.*?: /, "").slice(0, 400) },
      { status: 400 },
    );
  }
}
