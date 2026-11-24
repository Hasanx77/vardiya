import { beforeEach, describe, expect, it } from "vitest";
import {
  createSign,
  generateKeyPairSync,
} from "node:crypto";
import {
  googleAnahtarOnbelleginiTemizle,
  idTokenDogrulaAnahtarlarla,
  type GoogleJwk,
} from "./google";

/**
 * Google ID token doğrulaması — ağa çıkmadan.
 *
 * Testte gerçek bir RSA anahtar çifti üretilir, Google'ın imzası taklit edilir.
 * Böylece canlıda 400 dönen tokenların hangi kurala takıldığı da doğrulanmış olur.
 */
const ISTEMCI = "test-client-id.apps.googleusercontent.com";

function b64u(deger: Buffer | string): string {
  return Buffer.from(deger).toString("base64url");
}

function imzala(govde: Record<string, unknown>): string {
  const baslik = b64u(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "test-kid" }));
  const icerik = b64u(JSON.stringify(govde));
  const imza = createSign("RSA-SHA256")
    .update(`${baslik}.${icerik}`)
    .sign(ozel)
    .toString("base64url");
  return `${baslik}.${icerik}.${imza}`;
}

function gecerliGovde(ekler: Record<string, unknown> = {}) {
  const simdi = Math.floor(Date.now() / 1000);
  return {
    iss: "https://accounts.google.com",
    aud: ISTEMCI,
    sub: "1234567890",
    email: "Hasan@Example.com",
    email_verified: true,
    iat: simdi - 10,
    exp: simdi + 600,
    name: "Hasan",
    ...ekler,
  };
}

beforeEach(() => {
  process.env.GOOGLE_CLIENT_ID = ISTEMCI;
  googleAnahtarOnbelleginiTemizle();
});

const { privateKey: ozel, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = publicKey.export({ format: "jwk" }) as GoogleJwk;
jwk.kid = "test-kid";

describe("google id token doğrulama", () => {
  it("geçerli tokenı kabul eder ve e-postayı küçük harfe çevirir", () => {
    const sonuc = idTokenDogrulaAnahtarlarla(imzala(gecerliGovde()), [jwk]);
    expect(sonuc.ok).toBe(true);
    if (sonuc.ok) {
      expect(sonuc.kullanici.email).toBe("hasan@example.com");
      expect(sonuc.kullanici.sub).toBe("1234567890");
      expect(sonuc.kullanici.emailVerified).toBe(true);
    }
  });

  it("bozuk imzayı reddeder", () => {
    const token = imzala(gecerliGovde());
    const sonuc = idTokenDogrulaAnahtarlarla(`${token}x`, [jwk]);
    expect(sonuc).toEqual({ ok: false, sebep: "imza" });
  });

  it("başka bir istemci için üretilmiş tokenı reddeder", () => {
    const sonuc = idTokenDogrulaAnahtarlarla(
      imzala(gecerliGovde({ aud: "baska-client" })),
      [jwk],
    );
    expect(sonuc).toEqual({ ok: false, sebep: "izleyici" });
  });

  it("süresi geçmiş tokenı reddeder", () => {
    const gecmis = Math.floor(Date.now() / 1000) - 3600;
    const sonuc = idTokenDogrulaAnahtarlarla(
      imzala(gecerliGovde({ exp: gecmis, iat: gecmis - 600 })),
      [jwk],
    );
    expect(sonuc).toEqual({ ok: false, sebep: "sure" });
  });

  it("yanlış veren (iss) reddeder", () => {
    const sonuc = idTokenDogrulaAnahtarlarla(
      imzala(gecerliGovde({ iss: "https://kotu.example" })),
      [jwk],
    );
    expect(sonuc).toEqual({ ok: false, sebep: "veren" });
  });

  it("doğrulanmamış e-postayı reddeder", () => {
    const sonuc = idTokenDogrulaAnahtarlarla(
      imzala(gecerliGovde({ email_verified: false })),
      [jwk],
    );
    expect(sonuc).toEqual({ ok: false, sebep: "eposta-dogrulanmamis" });
  });

  it("bilinmeyen anahtar kimliğini imza hatası sayar", () => {
    const baskaJwk = { ...jwk, kid: "farkli-kid" };
    const sonuc = idTokenDogrulaAnahtarlarla(imzala(gecerliGovde()), [baskaJwk]);
    expect(sonuc).toEqual({ ok: false, sebep: "imza" });
  });

  it("üç parçalı olmayan tokenı biçim hatası sayar", () => {
    expect(idTokenDogrulaAnahtarlarla("abc.def", [jwk])).toEqual({
      ok: false,
      sebep: "bicim",
    });
  });

  it("aud dizi olarak gelse de kabul eder", () => {
    const sonuc = idTokenDogrulaAnahtarlarla(
      imzala(gecerliGovde({ aud: ["baska", ISTEMCI] })),
      [jwk],
    );
    expect(sonuc.ok).toBe(true);
  });
});
