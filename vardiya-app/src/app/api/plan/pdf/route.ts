import { NextResponse } from "next/server";
import { aktifKullanici } from "@/lib/auth";
import { ensureBusiness } from "@/lib/server-data";
import { haftaBasiISO } from "@/lib/dates";
import { isValidISODate } from "@/lib/validate";
import { isoHaftaBasi } from "@/lib/yayin";
import { planPdfUret } from "@/lib/plan-pdf";
import { postaGonder, postaHazirMi } from "@/lib/mail";
import { planPostasi } from "@/lib/posta-sablonlari";
import { istemciIp } from "@/lib/url";
import { denemeBasarisiz, denemeIzinli } from "@/lib/rate-limit";

/**
 * Haftalık plan PDF'i.
 *
 *   GET  /api/plan/pdf?hafta=YYYY-MM-DD  → dosyayı indir
 *   POST /api/plan/pdf?hafta=YYYY-MM-DD  → kendi e-postana gönder
 *
 * Oturum zorunlu. E-posta **yalnızca hesabın kendi adresine** gider; kullanıcı
 * başka bir adres yazamaz (istemci tarafından adres kabul edilmez).
 */
function haftaParametresi(req: Request): string {
  const ham = new URL(req.url).searchParams.get("hafta") ?? "";
  // Gerçek takvim tarihi mi? (2026-13-45 gibi değerler NaN üretip PDF'i bozuyordu)
  if (!isValidISODate(ham)) return haftaBasiISO(new Date());
  // Hafta her zaman pazartesiye hizalanır (Çarşamba verilirse o haftanın pazartesisi).
  return isoHaftaBasi(ham) ?? haftaBasiISO(new Date());
}

export async function GET(req: Request) {
  const kullanici = await aktifKullanici();
  if (!kullanici) {
    return NextResponse.json({ hata: "Oturum gerekli" }, { status: 401 });
  }

  const business = await ensureBusiness();
  const hafta = haftaParametresi(req);

  try {
    const { pdf, dosyaAdi } = await planPdfUret(business.id, hafta);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${dosyaAdi}"`,
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    console.error("plan/pdf:", e);
    return NextResponse.json({ hata: "PDF oluşturulamadı." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const kullanici = await aktifKullanici();
  if (!kullanici) {
    return NextResponse.json({ hata: "Oturum gerekli" }, { status: 401 });
  }

  if (!postaHazirMi()) {
    return NextResponse.json(
      { hata: "E-posta gönderimi yapılandırılmadı. PDF'i indirip kendin gönderebilirsin." },
      { status: 503 },
    );
  }

  const ip = istemciIp(req);
  if (!denemeIzinli(`plan-pdf|${ip}`, 6)) {
    return NextResponse.json(
      { hata: "Çok fazla istek. Birkaç dakika sonra tekrar dene." },
      { status: 429 },
    );
  }
  denemeBasarisiz(`plan-pdf|${ip}`);

  const business = await ensureBusiness();
  const hafta = haftaParametresi(req);

  try {
    const { pdf, dosyaAdi, hafta: haftaEtiketi, ozet } = await planPdfUret(business.id, hafta);
    const posta = planPostasi({
      isletme: business.name,
      hafta: haftaEtiketi,
      ozet,
      pdfAdi: dosyaAdi,
    });

    const sonuc = await postaGonder({
      kime: kullanici.email,
      konu: posta.konu,
      html: posta.html,
      metin: posta.metin,
      ekler: [
        {
          filename: dosyaAdi,
          contentType: "application/pdf",
          content: Buffer.from(pdf),
        },
      ],
    });

    if (!sonuc.ok) {
      return NextResponse.json(
        { hata: `E-posta gönderilemedi: ${sonuc.hata ?? "bilinmeyen hata"}` },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, kime: kullanici.email });
  } catch (e) {
    console.error("plan/pdf (posta):", e);
    return NextResponse.json({ hata: "PDF hazırlanamadı." }, { status: 500 });
  }
}
