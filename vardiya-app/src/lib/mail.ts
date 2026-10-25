/**
 * E-posta gönderimi — tek kapı.
 *
 * Neden tek dosya: uygulamanın her yerinde (şifre sıfırlama, doğrulama, PDF,
 * duyuru) aynı gönderim kuralları geçerli olsun. Sağlayıcı değişirse yalnız
 * buradaki SMTP ayarları değişir; çağıran kod aynı kalır.
 *
 * Yapılandırma (ortam değişkenleri):
 *   SMTP_HOST      örn. mail.zihnora.com.tr
 *   SMTP_PORT      465 (SSL) veya 587 (STARTTLS)
 *   SMTP_USER      no-reply@zihnora.com.tr
 *   SMTP_PASS      posta kutusu şifresi
 *   MAIL_FROM      "Vardiya <no-reply@zihnora.com.tr>"  (isteğe bağlı)
 *   SMTP_TLS_INSECURE=1  → sertifika doğrulamasını kapat (yalnız acil durum)
 *   MAIL_OUTBOX    → SMTP yokken e-postaların yazılacağı klasör
 *
 * SMTP tanımlı değilse e-posta **sessizce kaybolmaz**: sunucuda/yerelde
 * `.mail-outbox/` klasörüne `.html` + `.json` olarak yazılır ve konsola
 * bağlantı basılır. Böylece geliştirmede akış test edilebilir.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import nodemailer, { type Transporter } from "nodemailer";

export type Ek = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type Posta = {
  kime: string;
  konu: string;
  html: string;
  metin: string;
  ekler?: Ek[];
};

/**
 * Alıcı adresini günlük/dosya adı için maskeler: `hasan.mum@ornek.com` → `h***@ornek.com`.
 * Kişisel veri günlüklere düz yazılmasın.
 */
export function maskeliEposta(email: string): string {
  const temiz = String(email ?? "").trim();
  const at = temiz.lastIndexOf("@");
  if (at <= 0 || at === temiz.length - 1) return "***";
  return `${temiz.slice(0, 1)}***@${temiz.slice(at + 1)}`;
}

/**
 * Metindeki tek kullanımlık jetonları maskeler (`?token=...`, `&code=...`).
 *
 * Şifre sıfırlama bağlantısı günlüğe düşerse jeton ele geçirilebilir; bu yüzden
 * hem hata mesajları hem dosya adları maskelenir.
 */
export function jetonlariMaskele(metin: string): string {
  return String(metin ?? "")
    .replace(/([?&](?:token|code|state|credential)=)[^&\s"'<>]+/gi, "$1***")
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, "$1***");
}

/** SMTP ayarları tam mı? */
export function postaHazirMi(): boolean {
  return Boolean(
    (process.env.SMTP_HOST ?? "").trim() &&
      (process.env.SMTP_USER ?? "").trim() &&
      (process.env.SMTP_PASS ?? "").trim(),
  );
}

/** "Vardiya <no-reply@zihnora.com.tr>" biçiminde gönderen. */
export function gonderenAdres(): string {
  return (process.env.MAIL_FROM ?? "").trim() || "Vardiya <no-reply@zihnora.com.tr>";
}

/** Gönderen adresin ham hâli (Reply-To vb. için). */
export function gonderenEposta(): string {
  const ham = gonderenAdres();
  const m = ham.match(/<([^>]+)>/);
  return (m ? m[1] : ham).trim();
}

let tasiyici: Transporter | null = null;

function tasiyiciAl(): Transporter {
  if (tasiyici) return tasiyici;
  const port = Number(process.env.SMTP_PORT ?? 465) || 465;
  // 465 → doğrudan SSL; 587/25 → STARTTLS (nodemailer otomatik yükseltir).
  const secure = (process.env.SMTP_SECURE ?? String(port === 465)) === "true";
  tasiyici = nodemailer.createTransport({
    host: (process.env.SMTP_HOST ?? "").trim(),
    port,
    secure,
    auth: {
      user: (process.env.SMTP_USER ?? "").trim(),
      pass: process.env.SMTP_PASS ?? "",
    },
    ...(process.env.SMTP_TLS_INSECURE === "1"
      ? { tls: { rejectUnauthorized: false } }
      : {}),
    // Paylaşımlı sunucuda bağlantı birikmesin (havuz kullanmıyoruz).
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });
  return tasiyici;
}

/** SMTP yokken postayı diske yaz (geliştirme/teşhis kanalı). */
async function yerelKutuyaYaz(posta: Posta, sebep: string): Promise<string> {
  // 🔒 Üretimde diske YAZILMAZ: gövdede şifre sıfırlama jetonu bulunur.
  // Bu koruma `postaGonder` içinde de var; burada ikinci savunma katmanı.
  if (process.env.NODE_ENV === "production") return "";

  const klasor = (process.env.MAIL_OUTBOX ?? "").trim() || path.join(process.cwd(), ".mail-outbox");
  const damga = new Date().toISOString().replace(/[:.]/g, "-");
  const guvenli = maskeliEposta(posta.kime).replace(/[^a-zA-Z0-9._@-]/g, "_").slice(0, 80);
  const taban = path.join(klasor, `${damga}__${guvenli}`);

  try {
    await mkdir(klasor, { recursive: true });
    await writeFile(
      `${taban}.json`,
      JSON.stringify(
        {
          sebep,
          kime: posta.kime,
          konu: posta.konu,
          metin: posta.metin,
          ekler: (posta.ekler ?? []).map((e) => ({
            filename: e.filename,
            boyut: e.content.length,
            contentType: e.contentType ?? "application/octet-stream",
          })),
        },
        null,
        2,
      ),
      "utf8",
    );
    await writeFile(`${taban}.html`, posta.html, "utf8");
    for (const ek of posta.ekler ?? []) {
      await writeFile(path.join(klasor, `${damga}__${ek.filename}`), ek.content);
    }
  } catch (e) {
    console.error("mail: yerel kutuya yazılamadı:", e);
  }

  console.warn(
    `[mail] SMTP tanımlı değil (${sebep}) → posta diske yazıldı: ${taban}.html`,
  );
  return taban;
}

/**
 * Postayı gönderir. Hata fırlatmaz: dönen sonuç her zaman kontrol edilebilir
 * (`ok:false` → akış devam eder, kullanıcıya "tekrar dene" denir).
 */
export async function postaGonder(
  posta: Posta,
): Promise<{ ok: boolean; hata?: string; dosya?: string }> {
  if (!postaHazirMi()) {
    if (process.env.NODE_ENV === "production") {
      // Diske yazma, jeton sızdırma: yalnız maskelenmiş özet.
      console.error(
        `[mail] SMTP yapılandırılmadı → gönderilmedi (${maskeliEposta(posta.kime)} · ${posta.konu})`,
      );
      return { ok: false, hata: "E-posta altyapısı yapılandırılmadı." };
    }
    const dosya = await yerelKutuyaYaz(posta, "SMTP_HOST/SMTP_USER/SMTP_PASS yok");
    return { ok: false, hata: "E-posta altyapısı yapılandırılmadı.", dosya };
  }

  try {
    await tasiyiciAl().sendMail({
      from: gonderenAdres(),
      to: posta.kime,
      subject: posta.konu,
      text: posta.metin,
      html: posta.html,
      replyTo: process.env.MAIL_REPLY_TO?.trim() || undefined,
      attachments: (posta.ekler ?? []).map((e) => ({
        filename: e.filename,
        content: e.content,
        contentType: e.contentType,
      })),
    });
    return { ok: true };
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : String(e);
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[mail] gönderilemedi:",
        `${maskeliEposta(posta.kime)} · ${posta.konu}`,
        "·",
        jetonlariMaskele(mesaj),
      );
      return { ok: false, hata: "E-posta gönderilemedi." };
    }
    console.error("mail: gönderilemedi:", mesaj);
    // Teşhis için diske de yazalım (canlıda klasör yoksa sessizce geçer).
    const dosya = await yerelKutuyaYaz(posta, `SMTP hatası: ${mesaj}`);
    return { ok: false, hata: mesaj, dosya };
  }
}
