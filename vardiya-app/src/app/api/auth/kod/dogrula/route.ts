import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  COOKIE_NAME,
  aktifKullanici,
  cerezAyarlari,
  girdilerGecerliMi,
  sifreOzetle,
} from "@/lib/auth";
import {
  IKI_ADIM_BEKLEME_MS,
  IKI_ADIM_COOKIE,
  beklemeTokeni,
  oturumAltyapisiHazir,
  oturumTokeni,
} from "@/lib/session";
import { istemciIp, httpsMi } from "@/lib/url";
import { beklemeMetni, girisBasarisiz, girisDenetle } from "@/lib/giris-korumasi";
import {
  kodAmaciGecerliMi,
  kodBicimiGecerliMi,
  kodHataMetni,
  koduTemizle,
  type KodAmaci,
} from "@/lib/eposta-kodu";
import { koduDogrula } from "@/lib/eposta-kodu-db";
import { ikiAdimAktifMi } from "@/lib/iki-adim";

/**
 * E-posta kodunu doğrular ve akışı tamamlar.
 *
 *   giris           → oturum açar (şifresiz giriş)
 *   sifre           → yeni şifreyi kaydeder, eski oturumları düşürür, oturum açar
 *   dogrulama       → e-posta adresini doğrulanmış işaretler
 *   eposta-degistir → hesabın e-postasını yeni adrese taşır
 *
 * Kod tek kullanımlıktır; yanlış denemede sayaç artar (en fazla 5).
 */
async function govde(req: Request): Promise<Record<string, string>> {
  const icerik = (req.headers.get("content-type") ?? "").toLowerCase();
  if (icerik.includes("application/json")) {
    const j = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(j).map(([k, v]) => [k, String(v ?? "")]));
  }
  const form = await req.formData();
  const cikti: Record<string, string> = {};
  form.forEach((v, k) => {
    cikti[String(k)] = String(v);
  });
  return cikti;
}

export async function POST(req: Request) {
  const veri = await govde(req);
  const kod = koduTemizle(veri.kod ?? "");
  const amacHam = String(veri.amac ?? "").trim();
  const ip = istemciIp(req);

  if (!kodAmaciGecerliMi(amacHam)) {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }
  const amac: KodAmaci = amacHam;
  if (!kodBicimiGecerliMi(kod)) {
    return NextResponse.json({ hata: "Kod 6 haneli olmalı." }, { status: 400 });
  }

  const oturum = await aktifKullanici();
  let email = String(veri.email ?? "").trim().toLowerCase();
  if (amac === "dogrulama") {
    if (!oturum) {
      return NextResponse.json({ hata: "Bu işlem için giriş yapmalısın." }, { status: 401 });
    }
    email = oturum.email;
  }
  if (amac === "eposta-degistir" && !oturum) {
    return NextResponse.json({ hata: "Bu işlem için giriş yapmalısın." }, { status: 401 });
  }

  if (!email && amac !== "eposta-degistir") {
    return NextResponse.json({ hata: "E-posta gerekli." }, { status: 400 });
  }

  // Deneme sınırı (IP başına) — kodun kendi deneme sayacı ayrıca var.
  const anahtarlar = [{ anahtar: `kod-dogrula:ip:${ip}`, esik: 30 }];
  const denetim = await girisDenetle(anahtarlar);
  if (!denetim.izinli) {
    return NextResponse.json(
      { hata: `Çok fazla deneme. ${beklemeMetni(denetim.bekleSaniye)} sonra tekrar dene.` },
      { status: 429 },
    );
  }
  await girisBasarisiz(anahtarlar);

  const sonuc = await koduDogrula({ email, amac, kod });
  if (!sonuc.ok) {
    return NextResponse.json(
      {
        hata: kodHataMetni(sonuc.durum) || "Kod hatalı. Tekrar dene.",
        kalanDeneme: sonuc.kalanDeneme,
      },
      { status: 400 },
    );
  }

  /* ---------------- Akış tamamlandı ---------------- */

  if (amac === "sifre") {
    const sifre = String(veri.sifre ?? "");
    const sifreTekrar = String(veri.sifreTekrar ?? "");
    const bicim = girdilerGecerliMi(email, sifre);
    if (bicim) return NextResponse.json({ hata: bicim, adim: "sifre" }, { status: 400 });
    if (sifre !== sifreTekrar) {
      return NextResponse.json(
        { hata: "Şifreler birbiriyle uyuşmuyor.", adim: "sifre" },
        { status: 400 },
      );
    }

    const kullanici = await prisma.user.findUnique({ where: { email } });
    if (!kullanici) {
      return NextResponse.json({ hata: "Hesap bulunamadı." }, { status: 404 });
    }
    const guncel = await prisma.user.update({
      where: { id: kullanici.id },
      data: {
        passwordHash: await sifreOzetle(sifre),
        sessionVersion: { increment: 1 },
        lastLoginAt: new Date(),
      },
    });

    if (!oturumAltyapisiHazir()) {
      return NextResponse.json(
        { ok: true, mesaj: "Şifren güncellendi. Giriş yapabilirsin.", hedef: "/giris?yenilendi=1" },
      );
    }

    const res = NextResponse.json({
      ok: true,
      mesaj: "Şifren güncellendi. Diğer cihazlardaki oturumlar kapatıldı.",
      hedef: guncel.onboardedAt ? "/panel" : "/basla",
    });
    res.cookies.set(
      COOKIE_NAME,
      await oturumTokeni(guncel.id, guncel.sessionVersion),
      cerezAyarlari(httpsMi(req), true),
    );
    return res;
  }

  if (amac === "dogrulama") {
    if (!oturum) {
      return NextResponse.json({ hata: "Oturum bulunamadı." }, { status: 401 });
    }
    await prisma.user.update({
      where: { id: oturum.id },
      data: { emailVerifiedAt: oturum.emailVerifiedAt ?? new Date() },
    });
    return NextResponse.json({ ok: true, mesaj: "E-posta adresin doğrulandı." });
  }

  if (amac === "eposta-degistir") {
    if (!oturum) {
      return NextResponse.json({ hata: "Oturum bulunamadı." }, { status: 401 });
    }
    const cakisan = await prisma.user.findUnique({ where: { email } });
    if (cakisan && cakisan.id !== oturum.id) {
      return NextResponse.json(
        { hata: "Bu e-posta başka bir hesapta kullanılıyor." },
        { status: 409 },
      );
    }
    await prisma.user.update({
      where: { id: oturum.id },
      data: { email, emailVerifiedAt: new Date() },
    });
    return NextResponse.json({
      ok: true,
      mesaj: "E-posta adresin güncellendi.",
      hedef: "/profil",
    });
  }

  // amac === "giris"
  const kullanici = await prisma.user.findUnique({ where: { email } });
  if (!kullanici) {
    return NextResponse.json({ hata: "Kod geçersiz veya süresi dolmuş." }, { status: 400 });
  }

  if (!oturumAltyapisiHazir()) {
    return NextResponse.json(
      { hata: "Sunucu yapılandırması eksik (oturum anahtarı)." },
      { status: 500 },
    );
  }

  const hedef = kullanici.onboardedAt ? "/panel" : "/basla";

  // 2FA açıksa şifresiz girişte de ikinci adım sorulur.
  if (await ikiAdimAktifMi(kullanici.id)) {
    const res = NextResponse.json({
      ok: true,
      hedef: `/iki-adim?next=${encodeURIComponent(hedef)}`,
    });
    res.cookies.set(
      IKI_ADIM_COOKIE,
      await beklemeTokeni(kullanici.id, true),
      {
        ...cerezAyarlari(httpsMi(req), false),
        maxAge: Math.floor(IKI_ADIM_BEKLEME_MS / 1000),
      },
    );
    return res;
  }

  await prisma.user.update({
    where: { id: kullanici.id },
    data: {
      lastLoginAt: new Date(),
      emailVerifiedAt: kullanici.emailVerifiedAt ?? new Date(),
    },
  });

  const res = NextResponse.json({ ok: true, hedef });
  res.cookies.set(
    COOKIE_NAME,
    await oturumTokeni(kullanici.id, kullanici.sessionVersion),
    cerezAyarlari(httpsMi(req), true),
  );
  return res;
}
