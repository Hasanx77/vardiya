import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Y-2 regresyon testi — şifre sıfırlama bağlantısı diske yazılmaz.
 *
 * Sorun: SMTP yapılandırılmadığında veya gönderim hata verdiğinde tüm e-posta
 * gövdesi (jeton dahil) `.mail-outbox/` altına düz metin yazılıyordu. Üretimde
 * bu artık yapılmaz; günlüğe yalnız maskelenmiş özet düşer.
 *
 * Geliştirmede eski davranış korunur (akış test edilebilsin).
 */

const takip = vi.hoisted(() => ({
  gonder: vi.fn(),
  yaz: vi.fn(),
  mkdir: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail: takip.gonder }) },
}));

vi.mock("node:fs/promises", () => ({
  mkdir: takip.mkdir,
  writeFile: takip.yaz,
}));

import { jetonlariMaskele, maskeliEposta, postaGonder } from "./mail";

const posta = {
  kime: "hasan.mum@ornek.com",
  konu: "Vardiya — şifreni sıfırla",
  metin: "Bağlantı: https://zihnora.com.tr/sifre-sifirla/yeni?token=GIZLI-JETON-123",
  html: "<a href='https://zihnora.com.tr/sifre-sifirla/yeni?token=GIZLI-JETON-123'>x</a>",
};

function smtpAyarla() {
  vi.stubEnv("SMTP_HOST", "mail.zihnora.com.tr");
  vi.stubEnv("SMTP_USER", "no-reply@zihnora.com.tr");
  vi.stubEnv("SMTP_PASS", "test");
}

beforeEach(() => {
  vi.clearAllMocks();
  takip.mkdir.mockResolvedValue(undefined);
  takip.yaz.mockResolvedValue(undefined);
  takip.gonder.mockResolvedValue({ accepted: ["hasan.mum@ornek.com"] });
  vi.stubEnv("SMTP_HOST", "");
  vi.stubEnv("SMTP_USER", "");
  vi.stubEnv("SMTP_PASS", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("maskeliEposta", () => {
  it("yerel kısmı maskeler, alan adını korur", () => {
    expect(maskeliEposta("hasan.mum@ornek.com")).toBe("h***@ornek.com");
  });

  it("geçersiz girdide *** döner", () => {
    expect(maskeliEposta("")).toBe("***");
    expect(maskeliEposta("bozuk")).toBe("***");
  });
});

describe("jetonlariMaskele", () => {
  it("token parametresini maskeler", () => {
    expect(jetonlariMaskele(posta.metin)).toBe(
      "Bağlantı: https://zihnora.com.tr/sifre-sifirla/yeni?token=***",
    );
  });

  it("code/state/credential parametrelerini de maskeler", () => {
    const metin = "?code=ABC123&state=XYZ&credential=IDTOKEN";
    expect(jetonlariMaskele(metin)).toBe("?code=***&state=***&credential=***");
  });

  it("normal metne dokunmaz", () => {
    expect(jetonlariMaskele("Merhaba dünya")).toBe("Merhaba dünya");
  });
});

describe("postaGonder — üretim", () => {
  it("SMTP yoksa diske yazmaz", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const hata = vi.spyOn(console, "error").mockImplementation(() => {});

    const sonuc = await postaGonder(posta);

    expect(sonuc.ok).toBe(false);
    expect(takip.yaz).not.toHaveBeenCalled();
    expect(takip.mkdir).not.toHaveBeenCalled();
    hata.mockRestore();
  });

  it("gönderim hata verirse diske yazmaz, jetonu loga sızdırmaz", async () => {
    vi.stubEnv("NODE_ENV", "production");
    smtpAyarla();
    takip.gonder.mockRejectedValue(
      new Error("550 reddedildi: https://zihnora.com.tr/sifre-sifirla/yeni?token=GIZLI-JETON-123"),
    );
    const hata = vi.spyOn(console, "error").mockImplementation(() => {});

    const sonuc = await postaGonder(posta);

    expect(sonuc.ok).toBe(false);
    expect(takip.yaz).not.toHaveBeenCalled();
    const loglanan = hata.mock.calls.flat().map(String).join(" ");
    expect(loglanan).not.toContain("GIZLI-JETON-123");
    expect(loglanan).not.toContain("hasan.mum@ornek.com");
    hata.mockRestore();
  });

  it("SMTP varsa normal gönderir", async () => {
    vi.stubEnv("NODE_ENV", "production");
    smtpAyarla();
    const sonuc = await postaGonder(posta);
    expect(sonuc.ok).toBe(true);
    expect(takip.gonder).toHaveBeenCalledTimes(1);
  });
});

describe("postaGonder — geliştirme", () => {
  it("SMTP yoksa diske yazar (akış test edilebilsin)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const sonuc = await postaGonder(posta);

    expect(sonuc.ok).toBe(false);
    expect(takip.yaz).toHaveBeenCalled();
  });
});
