import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aktifKullaniciId } from "@/lib/auth";
import { kullaniciAdiHatasi, kullaniciAdiTemizle } from "@/lib/kullanici-adi";

export const dynamic = "force-dynamic";

/**
 * Kullanıcı adını değiştirir (ayarlar ekranı).
 *
 * Kurallar kayıt/başlangıç ekranıyla aynı: 3–24 karakter, küçük harf,
 * harf/rakam/nokta/tire/alt çizgi. Başkasında olan ad alınamaz.
 */
export async function POST(req: Request) {
  const kullaniciId = await aktifKullaniciId();
  if (!kullaniciId) return NextResponse.json({ hata: "Oturum gerekli" }, { status: 401 });

  const icerik = (req.headers.get("content-type") ?? "").toLowerCase();
  let ham = "";
  if (icerik.includes("application/json")) {
    const j = (await req.json().catch(() => ({}))) as { username?: unknown };
    ham = String(j.username ?? "");
  } else {
    const form = await req.formData();
    ham = String(form.get("username") ?? "");
  }

  const hata = kullaniciAdiHatasi(ham);
  if (hata) return NextResponse.json({ hata }, { status: 400 });

  const ad = kullaniciAdiTemizle(ham);
  const cakisan = await prisma.user.findFirst({
    where: { username: ad, NOT: { id: kullaniciId } },
    select: { id: true },
  });
  if (cakisan) {
    return NextResponse.json({ hata: "Bu kullanıcı adı alınmış. Başka bir tane dene." }, { status: 409 });
  }

  const guncel = await prisma.user.update({
    where: { id: kullaniciId },
    data: { username: ad },
    select: { username: true },
  });

  return NextResponse.json({ ok: true, username: guncel.username });
}
