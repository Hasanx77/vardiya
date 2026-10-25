import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  COOKIE_NAME,
  cerezAyarlari,
  sifreDogruMu,
  sifreOzetle,
} from "@/lib/auth";
import {
  IKI_ADIM_COOKIE,
  IKI_ADIM_BEKLEME_MS,
  beklemeTokeni,
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
import { ikiAdimAktifMi } from "@/lib/iki-adim";

/**
 * Kullanıcı bulunamadığında da scrypt çalıştırmak için sahte özet.
 * Böylece yanıt süresi, e-postanın kayıtlı olup olmadığını ele vermez.
 *
 * Tembel üretiliyor: modül yüklenirken scrypt çalıştırmak (eski hâli) her
 * süreç başlangıcında gereksiz maliyet çıkarıyordu.
 */
let sahteOzet: string | null = null;
async function sahteOzetAl(): Promise<string> {
  if (!sahteOzet) sahteOzet = await sifreOzetle("gecersiz-sifre-zamani-esitle");
  return sahteOzet;
}

/** Giriş yap: e-posta + şifre. Şifre özeti scrypt ile karşılaştırılır. */
export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const sifre = String(form.get("sifre") ?? "");
  const hatirla = String(form.get("hatirla") ?? "") === "1";
  let next = guvenliHedef(String(form.get("next") ?? "/panel"));
  if (next.startsWith("/giris") || next.startsWith("/kayit")) next = "/panel";
  const ip = istemciIp(req);

  // Üç ayrı sayaç: tek IP'den tek hesap, dağıtık IP'lerden tek hesap, tek IP'den çok hesap.
  const anahtarlar = [
    { anahtar: `giris:ip-eposta:${ip}|${email}`, esik: 5 },
    { anahtar: `giris:hesap:${email}`, esik: 8 },
    { anahtar: `giris:ip:${ip}`, esik: 20 },
  ];

  const hata = (mesaj: string) => {
    const url = disAdres(req, "/giris");
    url.searchParams.set("hata", mesaj);
    if (email) url.searchParams.set("email", email);
    url.searchParams.set("next", next);
    return NextResponse.redirect(url, 303);
  };

  if (!email || !sifre) return hata("E-posta ve şifre gerekli.");

  // Oturum anahtarı yoksa çerez imzalanamaz → giriş "başarılı" görünse bile
  // kullanıcı giriş yapmamış sayılırdı. Bunu sessizce yaşatmak yerine söyle.
  if (!oturumAltyapisiHazir()) {
    return hata("Sunucu yapılandırması eksik (oturum anahtarı). Lütfen yöneticiye bildir.");
  }

  const denetim = await girisDenetle(anahtarlar);
  if (!denetim.izinli) {
    return hata(
      `Çok fazla hatalı deneme. ${beklemeMetni(denetim.bekleSaniye)} sonra tekrar dene.`,
    );
  }

  const kullanici = await prisma.user.findUnique({ where: { email } });
  let sifreDogru = false;
  if (kullanici) {
    sifreDogru = await sifreDogruMu(sifre, kullanici.passwordHash);
  } else {
    // Sahte karşılaştırma: süre farkından hesap varlığı anlaşılmasın.
    await sifreDogruMu(sifre, await sahteOzetAl());
  }

  if (!kullanici || !sifreDogru) {
    await girisBasarisiz(anahtarlar);
    const sonraki = await girisDenetle(anahtarlar);
    if (!sonraki.izinli) {
      return hata(
        `Çok fazla hatalı deneme. ${beklemeMetni(sonraki.bekleSaniye)} sonra tekrar dene.`,
      );
    }
    return hata("E-posta veya şifre hatalı.");
  }

  await girisTemizle(anahtarlar);

  // Başlangıç adımları tamamlanmadıysa önce kısa karşılama ekranına götür.
  if (!kullanici.onboardedAt && next === "/panel") next = "/basla";

  // 🔐 İki adımlı doğrulama açıksa oturum HENÜZ açılmaz: yalnız kısa ömürlü
  // bir "bekleme" çerezi verilir, kod `/iki-adim` sayfasında sorulur.
  if (await ikiAdimAktifMi(kullanici.id)) {
    const hedef = `/iki-adim?next=${encodeURIComponent(next)}`;
    const res = NextResponse.redirect(disAdres(req, hedef), 303);
    res.cookies.set(IKI_ADIM_COOKIE, await beklemeTokeni(kullanici.id, hatirla), {
      ...cerezAyarlari(httpsMi(req), false),
      maxAge: Math.floor(IKI_ADIM_BEKLEME_MS / 1000),
    });
    return res;
  }

  await prisma.user.update({
    where: { id: kullanici.id },
    data: { lastLoginAt: new Date() },
  });

  const res = NextResponse.redirect(disAdres(req, next), 303);
  res.cookies.set(
    COOKIE_NAME,
    await oturumTokeni(kullanici.id, kullanici.sessionVersion),
    cerezAyarlari(httpsMi(req), hatirla),
  );
  return res;
}
