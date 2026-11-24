/**
 * Kod gönderimi — tek kapı.
 *
 * Bütün "e-posta ile kod" akışları (doğrulama, şifresiz giriş, şifre sıfırlama,
 * e-posta değiştirme) buradan geçer. Böylece sınırlar (60 sn bekleme, saatte 5)
 * ve gönderim dili tek yerde kalır.
 */
import { createHmac } from "node:crypto";
import { postaGonder, postaHazirMi } from "./mail";
import { kodPostasi } from "./posta-sablonlari";
import {
  KOD_OMRU_DK,
  SAATLIK_AZAMI_GONDERIM,
  TEKRAR_GONDERME_SN,
  amacBasligi,
  kodOzetle,
  kodUret,
  type KodAmaci,
} from "./eposta-kodu";
import {
  eskiKodlariSil,
  kodKaydet,
  saatlikGonderimSayisi,
  sonGonderimZamani,
} from "./eposta-kodu-db";

/** IP'yi ham saklamayız: günlük tuzlu özet yeterli (gizlilik). */
export function ipOzeti(ip: string): string {
  const sir = (process.env.AUTH_SECRET ?? "").trim() || "vardiya-gelistirme-sirri";
  return createHmac("sha256", sir).update(`ip:${ip}`).digest("hex").slice(0, 32);
}

export type GonderimSonucu =
  | { ok: true; kalanDk: number; tekrarSn: number }
  | { ok: false; kod: "bekle" | "limit" | "posta" | "yapilandirma"; hata: string; bekleSn?: number };

/**
 * Kod üretir, özetini saklar ve e-postayı gönderir.
 *
 * Not: Çağıran taraf **kullanıcı yoksa bile** aynı yanıtı döndürmeli
 * (hesap varlığı sızmasın). Bu fonksiyon yalnızca gerçek gönderimi yapar.
 */
export async function kodGonder(girdi: {
  email: string;
  amac: KodAmaci;
  userId?: string | null;
  ip?: string;
  kullaniciAdi?: string;
}): Promise<GonderimSonucu> {
  const email = girdi.email.trim().toLowerCase();

  // 1) Aynı e-posta için 60 saniyede bir kod.
  const son = await sonGonderimZamani(email, girdi.amac);
  if (son) {
    const gecen = Math.floor((Date.now() - son.getTime()) / 1000);
    if (gecen < TEKRAR_GONDERME_SN) {
      return {
        ok: false,
        kod: "bekle",
        hata: `Yeni kod için ${TEKRAR_GONDERME_SN - gecen} saniye bekle.`,
        bekleSn: TEKRAR_GONDERME_SN - gecen,
      };
    }
  }

  // 2) Saatte en fazla 5 kod (bombardıman koruması).
  const adet = await saatlikGonderimSayisi(email);
  if (adet >= SAATLIK_AZAMI_GONDERIM) {
    return {
      ok: false,
      kod: "limit",
      hata: "Bu adrese çok fazla kod istendi. 1 saat sonra tekrar dene.",
    };
  }

  // 3) E-posta altyapısı yoksa kullanıcıyı boşa bekletme.
  if (!postaHazirMi() && process.env.NODE_ENV === "production") {
    return {
      ok: false,
      kod: "yapilandirma",
      hata: "E-posta gönderimi şu an yapılandırılmadı. destek@zihnora.com.tr adresine yazabilirsin.",
    };
  }

  const kod = kodUret();
  const kodHash = kodOzetle(kod, email, girdi.amac);

  await kodKaydet({
    email,
    amac: girdi.amac,
    kodHash,
    userId: girdi.userId ?? null,
    ipHash: girdi.ip ? ipOzeti(girdi.ip) : null,
  });

  const posta = kodPostasi({
    kod,
    baslik: amacBasligi(girdi.amac),
    dakika: KOD_OMRU_DK,
    kullaniciAdi: girdi.kullaniciAdi,
  });

  const sonuc = await postaGonder({
    kime: email,
    konu: posta.konu,
    html: posta.html,
    metin: posta.metin,
  });

  // Eski satırları fırsat buldukça temizle (yanıtı bekletmeyiz).
  void eskiKodlariSil();

  if (!sonuc.ok) {
    // Geliştirmede SMTP yoksa posta `.mail-outbox/` klasörüne yazılır; akış
    // test edilebilsin diye bunu başarı sayıyoruz (üretimde asla).
    if (sonuc.dosya && process.env.NODE_ENV !== "production") {
      console.warn(`[kod] SMTP yok, kod diske yazıldı: ${sonuc.dosya}`);
      return { ok: true, kalanDk: KOD_OMRU_DK, tekrarSn: TEKRAR_GONDERME_SN };
    }
    console.error("kod-gonder: posta gönderilemedi:", sonuc.hata);
    return {
      ok: false,
      kod: "posta",
      hata: "Kod e-postası gönderilemedi. Lütfen birkaç dakika sonra tekrar dene.",
    };
  }

  return { ok: true, kalanDk: KOD_OMRU_DK, tekrarSn: TEKRAR_GONDERME_SN };
}
