import { NextResponse } from "next/server";
import { aktifKullanici, sifreDogruMu } from "@/lib/auth";
import {
  etkinlestir,
  ikiAdimDurumu,
  kapat,
  kodDogrulaKullanici,
  kurulumBaslat,
  yedekYenile,
} from "@/lib/iki-adim";
import { girisBasarisiz, girisDenetle, girisTemizle } from "@/lib/giris-korumasi";

/**
 * İki adımlı doğrulama ayarları (oturum zorunlu).
 *
 * POST gövdesi: { islem: "baslat" | "etkinlestir" | "kapat" | "yenile", kod?, sifre? }
 *
 * Not: 2FA'yı **kapatmak** için hem şifre hem geçerli kod istenir. Böylece
 * çalınmış bir oturum çerezi tek başına korumayı devre dışı bırakamaz.
 */
export async function GET() {
  const kullanici = await aktifKullanici();
  if (!kullanici) {
    return NextResponse.json({ hata: "Oturum gerekli" }, { status: 401 });
  }
  return NextResponse.json(await ikiAdimDurumu(kullanici.id));
}

export async function POST(req: Request) {
  const kullanici = await aktifKullanici();
  if (!kullanici) {
    return NextResponse.json({ hata: "Oturum gerekli" }, { status: 401 });
  }

  const govde = (await req.json().catch(() => ({}))) as {
    islem?: string;
    kod?: string;
    sifre?: string;
  };
  const islem = String(govde.islem ?? "");
  const kod = String(govde.kod ?? "");
  const sifre = String(govde.sifre ?? "");

  // Kaba kuvvet: kod denemeleri de kalıcı sayaçla sınırlanır.
  const anahtarlar = [{ anahtar: `ikiadim-ayar:${kullanici.id}`, esik: 8 }];
  const denetim = await girisDenetle(anahtarlar);
  if (!denetim.izinli) {
    return NextResponse.json(
      { hata: `Çok fazla hatalı kod. ${Math.ceil(denetim.bekleSaniye / 60)} dakika sonra tekrar dene.` },
      { status: 429 },
    );
  }

  const hataliKod = async () => {
    await girisBasarisiz(anahtarlar);
    return NextResponse.json({ hata: "Kod hatalı veya süresi geçmiş." }, { status: 400 });
  };

  /**
   * 🔐 Şifre doğrulaması: çalınmış bir oturum çerezi tek başına 2FA kurulumunu
   * başlatamaz. Aksi halde saldırgan kendi authenticator'ını bağlar ve hesabın
   * sahibi dışarıda kalır.
   */
  const sifreGerekli = async () => {
    await girisBasarisiz(anahtarlar);
    return NextResponse.json(
      {
        hata:
          "Şifren hatalı. Güvenlik için iki adımlı doğrulamayı açmak şifre doğrulaması ister.",
      },
      { status: 400 },
    );
  };

  if (islem === "baslat") {
    if (!sifre || !(await sifreDogruMu(sifre, kullanici.passwordHash))) {
      return sifreGerekli();
    }
    const durum = await ikiAdimDurumu(kullanici.id);
    if (durum.aktif) {
      return NextResponse.json({ hata: "İki adımlı doğrulama zaten açık." }, { status: 409 });
    }
    const kurulum = await kurulumBaslat(kullanici.id, kullanici.email);
    return NextResponse.json({ ok: true, ...kurulum });
  }

  if (islem === "etkinlestir") {
    if (!sifre || !(await sifreDogruMu(sifre, kullanici.passwordHash))) {
      return sifreGerekli();
    }
    if (!/^\d{6}$/.test(kod.replace(/\s/g, ""))) {
      return NextResponse.json({ hata: "6 haneli kodu gir." }, { status: 400 });
    }
    const yedekKodlar = await etkinlestir(kullanici.id, kod);
    if (!yedekKodlar) return hataliKod();
    await girisTemizle(anahtarlar);
    return NextResponse.json({ ok: true, yedekKodlar });
  }

  if (islem === "kapat") {
    if (!(await sifreDogruMu(sifre, kullanici.passwordHash))) {
      await girisBasarisiz(anahtarlar);
      return NextResponse.json({ hata: "Şifre hatalı." }, { status: 400 });
    }
    const sonuc = await kodDogrulaKullanici(kullanici.id, kod);
    if (!sonuc) return hataliKod();
    await kapat(kullanici.id);
    await girisTemizle(anahtarlar);
    return NextResponse.json({ ok: true });
  }

  if (islem === "yenile") {
    const sonuc = await kodDogrulaKullanici(kullanici.id, kod);
    if (!sonuc) return hataliKod();
    const yedekKodlar = await yedekYenile(kullanici.id);
    if (!yedekKodlar) {
      return NextResponse.json({ hata: "İki adımlı doğrulama açık değil." }, { status: 400 });
    }
    await girisTemizle(anahtarlar);
    return NextResponse.json({ ok: true, yedekKodlar });
  }

  return NextResponse.json({ hata: "Bilinmeyen işlem." }, { status: 400 });
}
