import { NextResponse } from "next/server";
import { COOKIE_NAME, cerezAyarlari } from "@/lib/auth";
import {
  IKI_ADIM_BEKLEME_MS,
  IKI_ADIM_COOKIE,
  beklemeTokeni,
  oturumTokeni,
} from "@/lib/session";
import { disAdres, guvenliHedef, httpsMi } from "@/lib/url";
import { googleHazirMi, idTokenDogrulaAyrintili, idTokenHataMetni } from "@/lib/google";
import { googleHesabiniBulVeyaAc } from "@/lib/google-hesap";
import { denemeBasarisiz, denemeIzinli } from "@/lib/rate-limit";
import { ikiAdimAktifMi } from "@/lib/iki-adim";

/**
 * Google Identity Services ile giriş.
 *
 * Tarayıcıdaki "Google ile devam et" düğmesi bir **ID token** üretir ve buraya
 * gönderir. Token doğrulanır (yerel imza kontrolü), kullanıcı bulunur/oluşturulur
 * ve oturum çerezi yazılır. **Client secret gerekmez**.
 *
 * İki biçim desteklenir:
 *   • `application/json`  → popup modundaki JS geri çağrısı (asıl yol)
 *   • form POST           → Google'ın "redirect" modu (yedek)
 */
export async function GET(req: Request) {
  const url = disAdres(req, "/giris");
  url.searchParams.set(
    "hata",
    "Google girişi bu adresten başlatılmaz. Aşağıdaki düğmeyi kullan.",
  );
  return NextResponse.redirect(url, 303);
}

export async function POST(req: Request) {
  if (!googleHazirMi()) {
    return NextResponse.json(
      { hata: "Google ile giriş yapılandırılmadı." },
      { status: 503 },
    );
  }

  let credential = "";
  let hedef = "/panel";

  const icerik = (req.headers.get("content-type") ?? "").toLowerCase();
  try {
    if (icerik.includes("application/json")) {
      const govde = (await req.json()) as { credential?: string; next?: string };
      credential = String(govde.credential ?? "");
      hedef = guvenliHedef(String(govde.next ?? "/panel"), "/panel");
    } else if (
      icerik.includes("application/x-www-form-urlencoded") ||
      icerik.includes("multipart/form-data")
    ) {
      const form = await req.formData();
      credential = String(form.get("credential") ?? "");
      hedef = guvenliHedef(String(form.get("next") ?? "/panel"), "/panel");
    } else {
      return NextResponse.json(
        { hata: "Desteklenmeyen içerik türü." },
        { status: 415 },
      );
    }
  } catch (e) {
    console.error("google/gsi: gövde okunamadı:", e);
    return NextResponse.json({ hata: "Google yanıtı okunamadı." }, { status: 400 });
  }

  if (!credential) {
    return NextResponse.json({ hata: "Google yanıtı eksik." }, { status: 400 });
  }

  // Teşhis: token asla günlüğe yazılmaz; yalnız uzunluk ve parça sayısı.
  const parca = credential.split(".").length;
  if (parca !== 3) {
    console.error(`google/gsi: beklenmeyen token biçimi (${credential.length} kr, ${parca} parça)`);
    return NextResponse.json(
      { hata: "Google yanıtı geçersiz. Lütfen tekrar dene." },
      { status: 400 },
    );
  }

  // Kaba kuvvet: aynı IP'den dakikada çok fazla deneme olmasın.
  const ip = (req.headers.get("x-real-ip") ?? "").trim() || "yerel";
  if (!denemeIzinli(`google|${ip}`, 15)) {
    return NextResponse.json(
      { hata: "Çok fazla deneme. Biraz sonra tekrar dene." },
      { status: 429 },
    );
  }
  denemeBasarisiz(`google|${ip}`);

  const sonuc = await idTokenDogrulaAyrintili(credential);
  if (!sonuc.ok) {
    console.error(`google/gsi: doğrulama başarısız (${sonuc.sebep}, ${credential.length} kr)`);
    return NextResponse.json({ hata: idTokenHataMetni(sonuc.sebep) }, { status: 401 });
  }
  const kimlik = sonuc.kullanici;

  try {
    const kullanici = await googleHesabiniBulVeyaAc(kimlik);
    const gidilecek = kullanici.onboardedAt ? hedef : "/basla";

    // 🔐 İki adımlı doğrulama açıksa (Google ile gelinse bile) kod sorulur.
    if (await ikiAdimAktifMi(kullanici.id)) {
      const hedefYol = `/iki-adim?next=${encodeURIComponent(gidilecek)}`;
      const bekleme = await beklemeTokeni(kullanici.id, true);
      const ayar = {
        ...cerezAyarlari(httpsMi(req), false),
        maxAge: Math.floor(IKI_ADIM_BEKLEME_MS / 1000),
      };

      if (!icerik.includes("application/json")) {
        const res = NextResponse.redirect(disAdres(req, hedefYol), 303);
        res.cookies.set(IKI_ADIM_COOKIE, bekleme, ayar);
        return res;
      }

      const res = NextResponse.json({
        ok: true,
        hedef: disAdres(req, hedefYol).toString(),
      });
      res.cookies.set(IKI_ADIM_COOKIE, bekleme, ayar);
      return res;
    }

    const cerez = await oturumTokeni(kullanici.id, kullanici.sessionVersion);

    if (!icerik.includes("application/json")) {
      const res = NextResponse.redirect(disAdres(req, gidilecek), 303);
      res.cookies.set(COOKIE_NAME, cerez, cerezAyarlari(httpsMi(req), true));
      return res;
    }

    const res = NextResponse.json({
      ok: true,
      hedef: disAdres(req, gidilecek).toString(),
    });
    res.cookies.set(COOKIE_NAME, cerez, cerezAyarlari(httpsMi(req), true));
    return res;
  } catch (e) {
    console.error("google/gsi:", e);
    return NextResponse.json(
      { hata: "Giriş tamamlanamadı. Lütfen tekrar dene." },
      { status: 500 },
    );
  }
}
