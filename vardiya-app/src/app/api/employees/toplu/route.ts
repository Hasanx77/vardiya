import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";
import { nextColor } from "@/lib/colors";
import { denemeBasarisiz, denemeIzinli } from "@/lib/rate-limit";
import { istemciIp } from "@/lib/url";

/**
 * "Kaç personel var?" → **toplu boş satır** oluşturur.
 *
 * Patron isteği (26 Kas 2026): panel açılınca sayı sorulsun, 4 yazınca 4 satır
 * açılsın. Satırlar "Personel 1…N" adıyla gelir; kullanıcı adları sonra
 * ızgaradan tek tıkla düzenler. Hiçbir zaman mevcut personeli silmez.
 */
export async function POST(req: Request) {
  const ip = istemciIp(req);
  if (!denemeIzinli(`personel-toplu|${ip}`, 20)) {
    return NextResponse.json({ hata: "Çok fazla istek. Biraz sonra dene." }, { status: 429 });
  }
  denemeBasarisiz(`personel-toplu|${ip}`);

  const govde = (await req.json().catch(() => ({}))) as { adet?: unknown; rol?: unknown };
  const adet = Math.trunc(Number(govde.adet));
  if (!Number.isFinite(adet) || adet < 1 || adet > 50) {
    return NextResponse.json(
      { hata: "1 ile 50 arasında bir sayı gir." },
      { status: 400 },
    );
  }

  const rol = String(govde.rol ?? "").trim().slice(0, 40) || "Personel";

  try {
    const business = await ensureBusiness();
    const mevcut = await prisma.employee.count({ where: { businessId: business.id } });

    const veri = Array.from({ length: adet }, (_, i) => ({
      businessId: business.id,
      name: `Personel ${mevcut + i + 1}`,
      role: rol,
      phone: "",
      color: nextColor(mevcut + i),
    }));

    await prisma.employee.createMany({ data: veri });

    return NextResponse.json({ ok: true, created: adet });
  } catch (e) {
    console.error("personel/toplu:", e);
    return NextResponse.json({ hata: "Satırlar oluşturulamadı." }, { status: 500 });
  }
}
