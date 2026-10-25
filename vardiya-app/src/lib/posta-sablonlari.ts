/**
 * E-posta şablonları.
 *
 * Kural: düz, okunaklı HTML + her postada **metin sürümü** (spam puanı ve
 * erişilebilirlik için). Görseller uzak sunucudan yüklenmez; koyu başlık
 * şeridi + amber vurgu markayı taşır.
 */

const AMBER = "#b45309";
const METIN = "#27272a";
const SOLUK = "#71717a";
const ZEMIN = "#f6f7f8";

function kabuk(opts: { onBaslik: string; icerik: string; altNot?: string }): string {
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Vardiya</title>
</head>
<body style="margin:0;padding:24px 12px;background:${ZEMIN};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${METIN};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e5e4;">
    <tr>
      <td style="padding:20px 28px;background:#14181b;color:#ffffff;">
        <span style="font-size:15px;font-weight:700;letter-spacing:.02em;">Vardiya</span>
        <span style="float:right;font-size:12px;color:#a1a1aa;">${opts.onBaslik}</span>
      </td>
    </tr>
    <tr>
      <td style="padding:28px;">
        ${opts.icerik}
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px;background:#fafaf9;border-top:1px solid #e7e5e4;color:${SOLUK};font-size:12px;line-height:1.6;">
        ${opts.altNot ?? "Bu e-postayı Vardiya hesabın için gönderdik."}
        <br>Vardiya · zihnora.com.tr
      </td>
    </tr>
  </table>
  <p style="max-width:560px;margin:12px auto 0;color:${SOLUK};font-size:11px;text-align:center;">
    Bu iletiye yanıt vermen gerekmez. Yardım için destek@zihnora.com.tr
  </p>
</body>
</html>`;
}

function dugme(yazi: string, baglanti: string): string {
  return `<a href="${baglanti}" style="display:inline-block;background:${AMBER};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 22px;border-radius:10px;">${yazi}</a>`;
}

export function sifreSifirlamaPostasi(opts: {
  kullaniciAdi: string;
  baglanti: string;
  dakika: number;
}): { konu: string; html: string; metin: string } {
  const konu = "Vardiya — şifreni sıfırla";
  const metin = `Merhaba ${opts.kullaniciAdi},

Vardiya hesabın için şifre sıfırlama isteği aldık. Aşağıdaki bağlantı ${opts.dakika} dakika geçerlidir ve yalnızca bir kez kullanılabilir:

${opts.baglanti}

Bu isteği sen yapmadıysan bu e-postayı yok say; şifren değişmez.

— Vardiya`;

  const html = kabuk({
    onBaslik: "Şifre sıfırlama",
    icerik: `
      <h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:#14181b;">Şifreni sıfırla</h1>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${METIN};">
        Merhaba ${opts.kullaniciAdi}, hesabın için şifre sıfırlama isteği aldık.
      </p>
      <p style="margin:0 0 22px;">${dugme("Yeni şifre belirle", opts.baglanti)}</p>
      <p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:${SOLUK};">
        Düğme çalışmazsa bu adresi tarayıcına yapıştır:
      </p>
      <p style="margin:0 0 18px;font-size:12px;line-height:1.5;color:${AMBER};word-break:break-all;">${opts.baglanti}</p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:${SOLUK};">
        Bağlantı <strong>${opts.dakika} dakika</strong> geçerli ve yalnızca bir kez kullanılabilir.
        İsteği sen yapmadıysan bu e-postayı yok say — şifren değişmez.
      </p>`,
  });

  return { konu, html, metin };
}

export function planPostasi(opts: {
  isletme: string;
  hafta: string;
  ozet: string;
  pdfAdi: string;
}): { konu: string; html: string; metin: string } {
  const konu = `${opts.isletme} — ${opts.hafta} vardiya planı (PDF)`;
  const metin = `Merhaba,

${opts.isletme} için ${opts.hafta} haftasının vardiya planı ektedir.

${opts.ozet}

Ek: ${opts.pdfAdi}

— Vardiya · zihnora.com.tr`;

  const html = kabuk({
    onBaslik: "Haftalık plan",
    icerik: `
      <h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:#14181b;">${opts.hafta} planı hazır</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        <strong>${opts.isletme}</strong> için haftalık vardiya planı PDF olarak ekte.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;">
        <tr><td style="padding:14px 16px;font-size:14px;line-height:1.7;color:${METIN};">${opts.ozet}</td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:${SOLUK};">
        PDF telefonda açılmazsa dosyayı bilgisayarda açabilirsin.
      </p>`,
    altNot: "Bu e-postayı panelden sen istedin.",
  });

  return { konu, html, metin };
}

export function dogrulamaPostasi(opts: {
  kullaniciAdi: string;
  baglanti: string;
}): { konu: string; html: string; metin: string } {
  const konu = "Vardiya — e-posta adresini doğrula";
  const metin = `Merhaba ${opts.kullaniciAdi},

E-posta adresini doğrulamak için: ${opts.baglanti}

Bağlantı 24 saat geçerlidir. Bu hesabı sen açmadıysan yok say.

— Vardiya`;

  const html = kabuk({
    onBaslik: "E-posta doğrulama",
    icerik: `
      <h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:#14181b;">E-postanı doğrula</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
        Merhaba ${opts.kullaniciAdi}, hesabını tamamlamak için e-posta adresini doğrula.
      </p>
      <p style="margin:0 0 18px;">${dugme("E-postamı doğrula", opts.baglanti)}</p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:${SOLUK};">
        Bağlantı 24 saat geçerlidir. Bu hesabı sen açmadıysan yok say.
      </p>`,
  });

  return { konu, html, metin };
}
