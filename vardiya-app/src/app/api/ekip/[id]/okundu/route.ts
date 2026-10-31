import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tokenCoz } from "@/lib/employee-link";
import { okunduIsaretle } from "@/lib/okundu-db";
import {
  AZAMI_OKUNDU_KAYDI,
  okunduHedefiGecerliMi,
  okunduTuruGecerliMi,
  type OkunduTuru,
} from "@/lib/okundu";
import { hizDenetle } from "@/lib/hiz-siniri";
import { istemciIp } from "@/lib/url";

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

type Kayit = { tur: OkunduTuru; hedefId: string };

/**
 * Personel bağlantısından **okundu** işareti (giriş gerektirmez).
 *
 * Gövde: `{ kayitlar: [{ tur: "plan" | "duyuru", hedefId }] }`
 *
 * 🔒 Güvenlik:
 *   - Yalnızca linkteki personel adına yazılır (gövdedeki kimlik yok sayılır).
 *   - `plan` hedefi **yayınlanmış** bir hafta olmalı; taslak hafta işaretlenemez.
 *   - `duyuru` hedefi o işletmenin duyurusu olmalı (başka hesabın kimliği 404).
 *   - Hız sınırı: jeton başına 120/saat, IP başına 300/saat.
 *
 * Kayıt tutmuyorsa **hata döndürmez**: okundu bilgisi yardımcı veridir,
 * plan görüntülemeyi engellememeli. Yalnızca geçersiz istek 400 alır.
 */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const jeton = String(id ?? "");

  const ip = istemciIp(req);
  const [ipSonuc, jetonSonuc] = await Promise.all([
    hizDenetle(`okundu:ip:${ip}`, 300, SAAT),
    hizDenetle(`okundu:jeton:${jetonAnahtari(jeton)}`, 120, SAAT),
  ]);
  if (!ipSonuc.izinli || !jetonSonuc.izinli) {
    return NextResponse.json(
      { hata: "Çok fazla istek. Lütfen biraz sonra tekrar dene." },
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
  const gelen = Array.isArray(body?.kayitlar) ? body.kayitlar : [];
  if (gelen.length === 0) {
    return NextResponse.json(
      { hata: "İşaretlenecek kayıt yok." },
      { status: 400, headers: BASLIKLAR },
    );
  }

  // Biçim doğrulaması + tekrar temizliği (aynı kayıt iki kez gönderilirse bir kez yazılır).
  const kayitlar: Kayit[] = [];
  const gorulen = new Set<string>();
  for (const ham of gelen.slice(0, AZAMI_OKUNDU_KAYDI)) {
    const tur = String((ham as { tur?: unknown })?.tur ?? "");
    const hedefId = String((ham as { hedefId?: unknown })?.hedefId ?? "");
    if (!okunduTuruGecerliMi(tur)) continue;
    if (!okunduHedefiGecerliMi(tur, hedefId)) continue;
    const anahtar = `${tur}:${hedefId}`;
    if (gorulen.has(anahtar)) continue;
    gorulen.add(anahtar);
    kayitlar.push({ tur, hedefId });
  }
  if (kayitlar.length === 0) {
    return NextResponse.json(
      { hata: "Geçersiz kayıt." },
      { status: 400, headers: BASLIKLAR },
    );
  }

  // 🔒 Hedeflerin bu işletmeye ait olduğunu **tek tek** doğrula.
  const planHedefleri = kayitlar
    .filter((k) => k.tur === "plan")
    .map((k) => k.hedefId);
  const duyuruHedefleri = kayitlar
    .filter((k) => k.tur === "duyuru")
    .map((k) => k.hedefId);

  const [yayinli, duyurular] = await Promise.all([
    planHedefleri.length > 0
      ? prisma.weekPlan.findMany({
          where: { businessId: personel.businessId, weekStart: { in: planHedefleri } },
          select: { weekStart: true },
        })
      : Promise.resolve([]),
    duyuruHedefleri.length > 0
      ? prisma.announcement.findMany({
          where: { businessId: personel.businessId, id: { in: duyuruHedefleri } },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  const gecerli = new Set<string>([
    ...yayinli.map((y) => `plan:${y.weekStart}`),
    ...duyurular.map((d) => `duyuru:${d.id}`),
  ]);

  let isaretlenen = 0;
  for (const k of kayitlar) {
    if (!gecerli.has(`${k.tur}:${k.hedefId}`)) continue;
    const yazildi = await okunduIsaretle({
      businessId: personel.businessId,
      employeeId: personel.id,
      tur: k.tur,
      hedefId: k.hedefId,
    });
    if (yazildi) isaretlenen += 1;
  }

  return NextResponse.json(
    { ok: true, isaretlenen },
    { status: 200, headers: BASLIKLAR },
  );
}
