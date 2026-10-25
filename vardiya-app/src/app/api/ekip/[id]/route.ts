import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getEkipPayload } from "@/lib/ekip";
import { hizDenetle } from "@/lib/hiz-siniri";
import { istemciIp } from "@/lib/url";

type Ctx = { params: Promise<{ id: string }> };

const DAKIKA = 60_000;

/** Jetonu veritabanına düz yazmamak için kısa özet. */
function jetonAnahtari(jeton: string): string {
  return createHash("sha256").update(jeton).digest("hex").slice(0, 24);
}

function cokIstek() {
  return NextResponse.json(
    { hata: "Çok fazla istek. Lütfen biraz sonra tekrar dene." },
    {
      status: 429,
      headers: {
        "Retry-After": "60",
        "Cache-Control": "no-store",
        // 🔒 Jeton URL'de: dış bağlantılara referer sızmasın.
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}

/**
 * Personelin salt-okunur programı (giriş gerektirmez).
 * Yalnızca o personele ait alanları döner; telefon ve diğer personel yoktur.
 *
 * Hız sınırı: IP başına 60/dk, jeton başına 120/dk (paylaşımlı sayaç).
 */
export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;

  const ip = istemciIp(req);
  const [ipSonuc, jetonSonuc] = await Promise.all([
    hizDenetle(`ekip:ip:${ip}`, 60, DAKIKA),
    hizDenetle(`ekip:jeton:${jetonAnahtari(String(id ?? ""))}`, 120, DAKIKA),
  ]);
  if (!ipSonuc.izinli || !jetonSonuc.izinli) return cokIstek();

  const veri = await getEkipPayload(id);
  if (!veri) {
    return NextResponse.json({ hata: "Personel bulunamadı" }, { status: 404 });
  }
  return NextResponse.json(veri, {
    headers: {
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
