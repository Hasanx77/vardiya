import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tokenCoz } from "@/lib/employee-link";
import { izinTalebiOlustur, personelIzinTalepleri } from "@/lib/izin-db";
import { hizDenetle } from "@/lib/hiz-siniri";
import { istemciIp } from "@/lib/url";
import { cleanText } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

const SAAT = 60 * 60_000;

/** Jetonu veritabanına düz yazmamak için kısa özet. */
function jetonAnahtari(jeton: string): string {
  return createHash("sha256").update(jeton).digest("hex").slice(0, 24);
}

const BASLIKLAR = {
  "Cache-Control": "no-store",
  // 🔒 Jeton URL'de: dış bağlantılara referer sızmasın.
  "Referrer-Policy": "no-referrer",
};

/**
 * Personelin **kendi** izin talebi (giriş gerektirmez, imzalı link).
 *
 * POST → talep açar; talep her zaman `bekliyor` durumunda başlar.
 *
 * 🔒 Yalnızca linkteki personel adına talep açılabilir; başka personelin
 * kimliği gövdede gönderilse bile yok sayılır. Hız sınırı: jeton başına
 * 5/saat, IP başına 20/saat (talep yağmuru ve ucuz DoS'a karşı).
 */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const jeton = String(id ?? "");

  const ip = istemciIp(req);
  const [ipSonuc, jetonSonuc] = await Promise.all([
    hizDenetle(`izin:ip:${ip}`, 20, SAAT),
    hizDenetle(`izin:jeton:${jetonAnahtari(jeton)}`, 5, SAAT),
  ]);
  if (!ipSonuc.izinli || !jetonSonuc.izinli) {
    return NextResponse.json(
      { hata: "Çok fazla talep gönderildi. Lütfen biraz sonra tekrar dene." },
      { status: 429, headers: { ...BASLIKLAR, "Retry-After": "3600" } },
    );
  }

  const employeeId = await tokenCoz(jeton);
  if (!employeeId) {
    return NextResponse.json(
      { hata: "Bağlantı geçersiz ya da kapatılmış." },
      { status: 404, headers: BASLIKLAR },
    );
  }

  const personel = await prisma.employee.findFirst({
    where: { id: employeeId, active: true },
    select: { id: true, businessId: true },
  });
  if (!personel) {
    return NextResponse.json(
      { hata: "Personel bulunamadı." },
      { status: 404, headers: BASLIKLAR },
    );
  }

  const body = await req.json().catch(() => ({}));
  const sonuc = await izinTalebiOlustur({
    businessId: personel.businessId,
    employeeId: personel.id,
    baslangic: String(body?.baslangic ?? ""),
    bitis: String(body?.bitis ?? ""),
    tur: String(body?.tur ?? "izin"),
    not: cleanText(body?.not, 500),
  });

  if (!sonuc.ok) {
    return NextResponse.json({ hata: sonuc.hata }, { status: 400, headers: BASLIKLAR });
  }

  return NextResponse.json(
    { ok: true, talep: sonuc.talep, talepler: await personelIzinTalepleri(personel.id) },
    { status: 201, headers: BASLIKLAR },
  );
}
