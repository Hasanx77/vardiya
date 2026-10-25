import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, cerezAyarlari } from "@/lib/auth";
import {
  IKI_ADIM_COOKIE,
  beklemeBilgi,
  oturumAltyapisiHazir,
  oturumTokeni,
} from "@/lib/session";
import { disAdres, guvenliHedef, httpsMi, istemciIp } from "@/lib/url";
import {
  beklemeMetni,
  girisBasarisiz,
  girisDenetle,
  girisTemizle,
} from "@/lib/giris-korumasi";
import { kodDogrulaKullanici } from "@/lib/iki-adim";

/**
 * İki adımlı doğrulama kodunu doğrular ve **asıl oturumu** burada açar.
 * Şifre aşaması `/api/auth/login` içinde geçmiş, kısa ömürlü bekleme çerezi
 * verilmiştir. Kod yanlışsa oturum açılmaz; sayaç kademeli olarak uzar.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const kod = String(form.get("kod") ?? "");
  let next = guvenliHedef(String(form.get("next") ?? "/panel"));
  if (next.startsWith("/giris") || next.startsWith("/kayit") || next.startsWith("/iki-adim")) {
    next = "/panel";
  }

  const cerezler = await cookies();
  const bilgi = await beklemeBilgi(cerezler.get(IKI_ADIM_COOKIE)?.value);

  const geriDon = (mesaj: string) => {
    const url = disAdres(req, "/iki-adim");
    url.searchParams.set("hata", mesaj);
    url.searchParams.set("next", next);
    const res = NextResponse.redirect(url, 303);
    if (!bilgi) res.cookies.delete(IKI_ADIM_COOKIE);
    return res;
  };

  if (!bilgi || !oturumAltyapisiHazir()) {
    const url = disAdres(req, "/giris");
    url.searchParams.set("hata", "Doğrulama süresi doldu. Lütfen yeniden giriş yap.");
    return NextResponse.redirect(url, 303);
  }

  const ip = istemciIp(req);
  const anahtarlar = [
    { anahtar: `ikiadim:${bilgi.kullaniciId}`, esik: 8 },
    { anahtar: `ikiadim-ip:${ip}`, esik: 20 },
  ];

  const denetim = await girisDenetle(anahtarlar);
  if (!denetim.izinli) {
    return geriDon(
      `Çok fazla hatalı kod. ${beklemeMetni(denetim.bekleSaniye)} sonra tekrar dene.`,
    );
  }

  const kullanici = await prisma.user.findUnique({ where: { id: bilgi.kullaniciId } });
  if (!kullanici) return geriDon("Hesap bulunamadı.");

  const sonuc = await kodDogrulaKullanici(kullanici.id, kod);
  if (!sonuc) {
    await girisBasarisiz(anahtarlar);
    const sonraki = await girisDenetle(anahtarlar);
    if (!sonraki.izinli) {
      return geriDon(
        `Çok fazla hatalı kod. ${beklemeMetni(sonraki.bekleSaniye)} sonra tekrar dene.`,
      );
    }
    return geriDon("Kod hatalı veya süresi geçmiş. Yeni kod gir.");
  }

  await girisTemizle(anahtarlar);
  await prisma.user.update({
    where: { id: kullanici.id },
    data: { lastLoginAt: new Date() },
  });

  if (!kullanici.onboardedAt && next === "/panel") next = "/basla";

  const res = NextResponse.redirect(disAdres(req, next), 303);
  res.cookies.set(
    COOKIE_NAME,
    await oturumTokeni(kullanici.id, kullanici.sessionVersion),
    cerezAyarlari(httpsMi(req), bilgi.hatirla),
  );
  res.cookies.delete(IKI_ADIM_COOKIE);
  return res;
}
