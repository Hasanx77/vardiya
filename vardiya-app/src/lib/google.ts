/**
 * Google ile giriş (Google Identity Services — ID token).
 *
 * 🔒 Düğme, `GOOGLE_CLIENT_ID` tanımlı **değilse hiç gösterilmez**.
 *
 * Akış:
 *   1. Tarayıcıda Google'ın kendi düğmesi bir **ID token** (JWT) üretir.
 *   2. Token `/api/auth/google/gsi` ucuna gönderilir.
 *   3. Token **yerelde** doğrulanır: imza (Google JWKS), `iss`, `aud`, `exp`,
 *      `email_verified`. Böylece her girişte Google'a ek istek atılmaz ve
 *      hangi kontrolün başarısız olduğu **açıkça** bilinir.
 *
 * Neden tokeninfo değil: 22-25 Ekim'de canlıda GSI "redirect" modunda gelen
 * tokenlar `tokeninfo` tarafından 400 ile reddediliyordu ve neden
 * anlaşılmıyordu. Yerel doğrulama hem daha hızlı hem teşhis edilebilir.
 * JWKS'e ulaşılamazsa (ağ engeli) son çare olarak tokeninfo'ya düşülür.
 *
 * Client secret **gerekmez**; sunucuda saklanan bir Google sırrı yoktur.
 * (Kod + PKCE akışı yedek olarak duruyor: `googleKullanicisi`.)
 */
import {
  createHash,
  createPublicKey,
  randomBytes,
  verify as imzaDogrula,
} from "node:crypto";

export const GOOGLE_DURUM_COOKIE = "vardiya_google";
export const GOOGLE_KAPSAM = "openid email profile";

/** Google'ın kabul ettiği `iss` değerleri. */
const GECERLI_VERENLER = new Set(["accounts.google.com", "https://accounts.google.com"]);

/** Saat kaymasına tolerans (ms). */
const SAAT_TOLERANSI_MS = 60_000;
/** JWKS önbelleği (ms) — Google anahtarları günde birkaç kez döner. */
const JWKS_TTL_MS = 60 * 60 * 1000;

export function googleHazirMi(): boolean {
  return Boolean((process.env.GOOGLE_CLIENT_ID ?? "").trim());
}

/** İstemci kimliği (istemciye verilir; gizli değildir). */
export function googleIstemciKimligi(): string {
  return (process.env.GOOGLE_CLIENT_ID ?? "").trim();
}

/** Secret var mı? (yalnız yedek kod akışı için) */
export function googleSecretVarMi(): boolean {
  return Boolean((process.env.GOOGLE_CLIENT_SECRET ?? "").trim());
}

function istemciKimligi(): string {
  return (process.env.GOOGLE_CLIENT_ID ?? "").trim();
}

function istemciGizlisi(): string {
  return (process.env.GOOGLE_CLIENT_SECRET ?? "").trim();
}

function jwksAdresi(): string {
  return (
    (process.env.GOOGLE_JWKS_URL ?? "").trim() ||
    "https://www.googleapis.com/oauth2/v3/certs"
  );
}

/* ------------------------------------------------------------------ *
 * ID token doğrulama
 * ------------------------------------------------------------------ */

export type GoogleJwk = {
  kid?: string;
  kty?: string;
  n?: string;
  e?: string;
  alg?: string;
  use?: string;
};

export type IdTokenHatasi =
  | "bicim"
  | "baslik"
  | "imza"
  | "sure"
  | "izleyici"
  | "veren"
  | "eposta-yok"
  | "eposta-dogrulanmamis"
  | "jwks";

export type IdTokenSonuc =
  | { ok: true; kullanici: GoogleKullanici }
  | { ok: false; sebep: IdTokenHatasi };

type JwtBaslik = { alg?: string; kid?: string; typ?: string };
type JwtGovde = {
  iss?: string;
  aud?: string | string[];
  azp?: string;
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  exp?: number | string;
  iat?: number | string;
  name?: string;
  nonce?: string;
};

let jwksOnbellek: { anahtarlar: GoogleJwk[]; zaman: number } | null = null;

/** Google imza anahtarlarını getirir (1 saat önbellekli). */
export async function googleAnahtarlari(zorla = false): Promise<GoogleJwk[]> {
  const simdi = Date.now();
  if (!zorla && jwksOnbellek && simdi - jwksOnbellek.zaman < JWKS_TTL_MS) {
    return jwksOnbellek.anahtarlar;
  }

  const yanit = await fetch(jwksAdresi(), { cache: "no-store" });
  if (!yanit.ok) throw new Error(`JWKS alınamadı (${yanit.status})`);
  const govde = (await yanit.json()) as { keys?: GoogleJwk[] };
  const anahtarlar = Array.isArray(govde.keys) ? govde.keys : [];
  if (!anahtarlar.length) throw new Error("JWKS boş");
  jwksOnbellek = { anahtarlar, zaman: simdi };
  return anahtarlar;
}

/** Testler için: önbelleği temizler. */
export function googleAnahtarOnbelleginiTemizle(): void {
  jwksOnbellek = null;
}

function coz(parca: string): unknown {
  return JSON.parse(Buffer.from(parca, "base64url").toString("utf8"));
}

/**
 * ID token'ı **verilen anahtarlarla** doğrular (ağ erişimi yok).
 * Testlerde sahte RSA anahtarıyla aynı kod yolu çalıştırılır.
 */
export function idTokenDogrulaAnahtarlarla(
  credential: string,
  anahtarlar: readonly GoogleJwk[],
  simdi = Date.now(),
): IdTokenSonuc {
  const parcalar = String(credential ?? "").split(".");
  if (parcalar.length !== 3 || parcalar.some((p) => !p)) return { ok: false, sebep: "bicim" };

  let baslik: JwtBaslik;
  let govde: JwtGovde;
  try {
    baslik = coz(parcalar[0]) as JwtBaslik;
    govde = coz(parcalar[1]) as JwtGovde;
  } catch {
    return { ok: false, sebep: "bicim" };
  }

  if (baslik.alg !== "RS256") return { ok: false, sebep: "baslik" };

  const jwk = anahtarlar.find((k) => k.kid === baslik.kid) ?? null;
  if (!jwk || !jwk.n || !jwk.e) return { ok: false, sebep: "imza" };

  let dogru = false;
  try {
    const anahtar = createPublicKey({
      key: { kty: jwk.kty ?? "RSA", n: jwk.n, e: jwk.e },
      format: "jwk",
    });
    dogru = imzaDogrula(
      "RSA-SHA256",
      Buffer.from(`${parcalar[0]}.${parcalar[1]}`),
      anahtar,
      Buffer.from(parcalar[2], "base64url"),
    );
  } catch {
    return { ok: false, sebep: "imza" };
  }
  if (!dogru) return { ok: false, sebep: "imza" };

  if (typeof govde.iss !== "string" || !GECERLI_VERENLER.has(govde.iss)) {
    return { ok: false, sebep: "veren" };
  }

  const izleyiciler = Array.isArray(govde.aud) ? govde.aud : [govde.aud ?? ""];
  if (!izleyiciler.includes(istemciKimligi())) return { ok: false, sebep: "izleyici" };

  const bitis = Number(govde.exp);
  if (!Number.isFinite(bitis) || bitis * 1000 + SAAT_TOLERANSI_MS < simdi) {
    return { ok: false, sebep: "sure" };
  }
  const baslangic = Number(govde.iat);
  if (Number.isFinite(baslangic) && baslangic * 1000 - SAAT_TOLERANSI_MS > simdi) {
    return { ok: false, sebep: "sure" };
  }

  if (!govde.sub || !govde.email) return { ok: false, sebep: "eposta-yok" };

  const dogrulanmis =
    govde.email_verified === true || govde.email_verified === "true";
  if (!dogrulanmis) return { ok: false, sebep: "eposta-dogrulanmamis" };

  return {
    ok: true,
    kullanici: {
      sub: String(govde.sub),
      email: String(govde.email).toLowerCase(),
      emailVerified: true,
      name: govde.name,
    },
  };
}

/**
 * ID token'ı Google'ın güncel anahtarlarıyla doğrular.
 * `kid` tanınmazsa anahtarlar bir kez tazelenir (anahtar dönmüş olabilir).
 */
export async function idTokenDogrula(credential: string): Promise<GoogleKullanici | null> {
  const sonuc = await idTokenDogrulaAyrintili(credential);
  if (sonuc.ok) return sonuc.kullanici;
  console.error(`google: id token reddedildi (${sonuc.sebep})`);
  return null;
}

export async function idTokenDogrulaAyrintili(
  credential: string,
): Promise<IdTokenSonuc> {
  if (!credential) return { ok: false, sebep: "bicim" };

  let anahtarlar: GoogleJwk[];
  try {
    anahtarlar = await googleAnahtarlari();
  } catch (e) {
    console.error("google: JWKS alınamadı:", e instanceof Error ? e.message : e);
    return { ok: false, sebep: "jwks" };
  }

  let sonuc = idTokenDogrulaAnahtarlarla(credential, anahtarlar);
  if (!sonuc.ok && sonuc.sebep === "imza") {
    // Anahtar dönmüş olabilir: bir kez tazele.
    try {
      anahtarlar = await googleAnahtarlari(true);
      sonuc = idTokenDogrulaAnahtarlarla(credential, anahtarlar);
    } catch {
      /* ilk sonucu döndür */
    }
  }
  return sonuc;
}

/** Kullanıcıya gösterilecek kısa hata metni. */
export function idTokenHataMetni(sebep: IdTokenHatasi): string {
  switch (sebep) {
    case "eposta-dogrulanmamis":
      return "Google e-posta adresin doğrulanmamış. Google hesabından doğrulayıp tekrar dene.";
    case "sure":
      return "Google oturumunun süresi dolmuş. Lütfen tekrar dene.";
    case "eposta-yok":
      return "Google hesabından e-posta adresi alınamadı.";
    case "jwks":
      return "Google doğrulama sunucusuna ulaşılamadı. Lütfen tekrar dene.";
    case "izleyici":
    case "veren":
    case "imza":
    case "baslik":
    case "bicim":
    default:
      return "Google yanıtı doğrulanamadı. Lütfen tekrar dene.";
  }
}

/* ------------------------------------------------------------------ *
 * Yedek akış: yetkilendirme kodu + PKCE (client secret gerekir)
 * ------------------------------------------------------------------ */

export type GoogleKullanici = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
};

/** PKCE: code_verifier + code_challenge (S256). */
export function pkceUret(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function durumUret(): string {
  return randomBytes(16).toString("hex");
}

export function googleAdresi(opts: {
  yonlendirmeAdresi: string;
  durum: string;
  challenge: string;
  girisIpucu?: string;
}): string {
  const p = new URLSearchParams({
    client_id: istemciKimligi(),
    redirect_uri: opts.yonlendirmeAdresi,
    response_type: "code",
    scope: GOOGLE_KAPSAM,
    state: opts.durum,
    code_challenge: opts.challenge,
    code_challenge_method: "S256",
    access_type: "online",
    prompt: "select_account",
    hl: "tr",
  });
  if (opts.girisIpucu) p.set("login_hint", opts.girisIpucu);
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}

/** Kodu erişim anahtarına çevirir, sonra kullanıcı bilgisini okur. */
export async function googleKullanicisi(
  kod: string,
  yonlendirmeAdresi: string,
  verifier: string,
): Promise<GoogleKullanici | null> {
  const govde = new URLSearchParams({
    code: kod,
    client_id: istemciKimligi(),
    client_secret: istemciGizlisi(),
    redirect_uri: yonlendirmeAdresi,
    grant_type: "authorization_code",
    code_verifier: verifier,
  });

  const tokenYaniti = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: govde.toString(),
    cache: "no-store",
  });
  if (!tokenYaniti.ok) {
    console.error(
      "google: token alınamadı",
      tokenYaniti.status,
      await tokenYaniti.text().catch(() => ""),
    );
    return null;
  }

  const token = (await tokenYaniti.json()) as { access_token?: string };
  if (!token.access_token) return null;

  const bilgiYaniti = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });
  if (!bilgiYaniti.ok) {
    console.error("google: userinfo alınamadı", bilgiYaniti.status);
    return null;
  }

  const bilgi = (await bilgiYaniti.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean | string;
    name?: string;
  };

  if (!bilgi.sub || !bilgi.email) return null;

  return {
    sub: bilgi.sub,
    email: bilgi.email.toLowerCase(),
    emailVerified:
      bilgi.email_verified === true || bilgi.email_verified === "true",
    name: bilgi.name,
  };
}
