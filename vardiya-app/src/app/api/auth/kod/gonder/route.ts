import { NextResponse } from "next/server";
import { aktifKullanici } from "@/lib/auth";
import { istemciIp } from "@/lib/url";
import { beklemeMetni, girisBasarisiz, girisDenetle } from "@/lib/giris-korumasi";
import { amacBasligi, epostaGecerliMi, kodAmaciGecerliMi, KOD_OMRU_DK, TEKRAR_GONDERME_SN, type KodAmaci } from "@/lib/eposta-kodu";
import { kodGonder } from "@/lib/kod-gonderim";
import { prisma } from "@/lib/prisma";

/**
 * Tek kullanımlık kod gönderir.
 *
 * 🔒 **Hesap varlığını sızdırmaz:** "giris" ve "sifre" amaçlarında e-posta
 * kayıtlı değilse de aynı başarılı yanıt döner; posta gönderilmez.
 * (Kullanıcı "kayıt yok" bilgisini buradan öğrenemez.)
 */
async function govde(req: Request): Promise<Record<string, string>> {
  const icerik = (req.headers.get("content-type") ?? "").toLowerCase();
  if (icerik.includes("application/json")) {
    const j = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(j).map(([k, v]) => [k, String(v ?? "")]),
    );
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
  const email = String(veri.email ?? "").trim().toLowerCase();
  const amacHam = String(veri.amac ?? "").trim();

  if (!kodAmaciGecerliMi(amacHam)) {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }
  const amac: KodAmaci = amacHam;
  const ip = istemciIp(req);

  const oturum = await aktifKullanici();
  const oturumGerekli = amac === "dogrulama" || amac === "eposta-degistir" || amac === "hesap-sil";

  // E-posta: oturum gerektiren akışlarda hedef adres oturumdan veya yeni adresten gelir.
  let hedefEposta = email;
  if (amac === "dogrulama" || amac === "hesap-sil") {
    if (!oturum) {
      return NextResponse.json(
        { hata: "Bu işlem için giriş yapmalısın.", girisAdresi: "/giris" },
        { status: 401 },
      );
    }
    hedefEposta = oturum.email;
  }
  if (amac === "eposta-degistir" && !oturum) {
    return NextResponse.json(
      { hata: "Bu işlem için giriş yapmalısın.", girisAdresi: "/giris" },
      { status: 401 },
    );
  }

  if (!epostaGecerliMi(hedefEposta)) {
    return NextResponse.json({ hata: "Geçerli bir e-posta adresi gir." }, { status: 400 });
  }

  // Kalıcı hız sınırı: IP ve adres ayrı sayılır.
  const anahtarlar = [
    { anahtar: `kod:ip:${ip}`, esik: 20 },
    { anahtar: `kod:eposta:${hedefEposta}`, esik: 6 },
  ];
  const denetim = await girisDenetle(anahtarlar);
  if (!denetim.izinli) {
    return NextResponse.json(
      { hata: `Çok fazla kod isteği. ${beklemeMetni(denetim.bekleSaniye)} sonra tekrar dene.` },
      { status: 429 },
    );
  }
  await girisBasarisiz(anahtarlar);

  // Oturum gerektiren akışlarda kullanıcı gerçekten var mı?
  let kullanici = oturum;
  if (!oturumGerekli) {
    kullanici = await prisma.user.findUnique({ where: { email: hedefEposta } });
  }

  // Hesap yoksa sessizce başarılı görün (enumeration koruması).
  if (!kullanici) {
    return NextResponse.json({
      ok: true,
      kalanDk: KOD_OMRU_DK,
      tekrarSn: TEKRAR_GONDERME_SN,
      baslik: amacBasligi(amac),
    });
  }

  // E-posta değiştirme: yeni adres başka bir hesapta olmamalı.
  if (amac === "eposta-degistir" && oturum) {
    const cakisan = await prisma.user.findUnique({ where: { email: hedefEposta } });
    if (cakisan && cakisan.id !== oturum.id) {
      return NextResponse.json(
        { hata: "Bu e-posta ile başka bir hesap var. Farklı bir adres dene." },
        { status: 409 },
      );
    }
  }

  // Doğrulama: adres zaten doğrulanmışsa tekrar kod göndermeyelim.
  if (amac === "dogrulama" && kullanici.emailVerifiedAt) {
    return NextResponse.json({
      ok: true,
      zatenDogrulanmis: true,
      baslik: amacBasligi(amac),
      kalanDk: KOD_OMRU_DK,
      tekrarSn: TEKRAR_GONDERME_SN,
    });
  }

  const sonuc = await kodGonder({
    email: hedefEposta,
    amac,
    userId: kullanici.id,
    ip,
    kullaniciAdi: kullanici.username ?? undefined,
  });

  if (!sonuc.ok) {
    return NextResponse.json({ hata: sonuc.hata }, { status: sonuc.kod === "bekle" ? 429 : 503 });
  }

  return NextResponse.json({
    ok: true,
    kalanDk: sonuc.kalanDk,
    tekrarSn: sonuc.tekrarSn,
    baslik: amacBasligi(amac),
  });
}
