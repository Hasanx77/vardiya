import { describe, it, expect } from "vitest";
import {
  IZIN_DURUM_ETIKETI,
  IZIN_TUR_ETIKETI,
  IZIN_TURLERI,
  izinAraligiGecerliMi,
  izinCakismasiVarMi,
  izinGunSayisi,
  izinTarihMetni,
  izinTuruGecerliMi,
  izinDurumuGecerliMi,
  onayliIzinVarMi,
  bekleyenTalepler,
  tarihAraligiKapsar,
  tarihGecerliMi,
} from "./izin";
import type { IzinTalebi } from "./types";

const bugun = "2026-10-30"; // 30 Eki 2026 (testte sabit)

describe("tarihGecerliMi", () => {
  it("geçerli ISO tarih kabul eder", () => {
    expect(tarihGecerliMi("2026-10-30")).toBe(true);
  });

  it("geçersiz / taşan tarihleri reddeder", () => {
    expect(tarihGecerliMi("2026-02-31")).toBe(false);
    expect(tarihGecerliMi("2026-10-32")).toBe(false);
    expect(tarihGecerliMi("2026-13-01")).toBe(false);
    expect(tarihGecerliMi("20261030")).toBe(false);
    expect(tarihGecerliMi("")).toBe(false);
  });
});

describe("izinGunSayisi", () => {
  it("başlangıç/bitiş dahil gün sayısı hesaplar", () => {
    expect(izinGunSayisi("2026-10-30", "2026-10-30")).toBe(1);
    expect(izinGunSayisi("2026-10-30", "2026-11-01")).toBe(3);
  });

  it("geçersiz aralıklarda 0 döner", () => {
    expect(izinGunSayisi("2026-10-31", "2026-10-30")).toBe(0);
    expect(izinGunSayisi("2026-99-01", "2026-99-05")).toBe(0);
  });
});

describe("tarihAraligiKapsar", () => {
  it("belirli bir gün aralıkta mı?", () => {
    expect(tarihAraligiKapsar("2026-10-30", "2026-11-01", "2026-10-30")).toBe(true);
    expect(tarihAraligiKapsar("2026-10-30", "2026-11-01", "2026-11-02")).toBe(false);
  });
});

describe("izinCakismasiVarMi", () => {
  it("kapsayan iki aralık algılar", () => {
    expect(izinCakismasiVarMi("2026-10-30", "2026-11-01", "2026-11-01", "2026-11-07")).toBe(
      true,
    );
    expect(izinCakismasiVarMi("2026-10-30", "2026-10-31", "2026-11-01", "2026-11-07")).toBe(
      false,
    );
  });
});

describe("izinAraligiGecerliMi", () => {
  it("geçerli aralık kabul eder", () => {
    expect(izinAraligiGecerliMi({ baslangic: "2026-10-30", bitis: "2026-11-01" }, bugun)).toBeNull();
  });

  it("bitiş önce başlangıçtan küçükse reddeder", () => {
    const hata = izinAraligiGecerliMi({ baslangic: "2026-11-05", bitis: "2026-11-01" }, bugun);
    expect(hata).toBeTruthy();
  });

  it("azami aralık sınırını uygular", () => {
    expect(izinAraligiGecerliMi({ baslangic: "2026-10-30", bitis: "2026-11-28" }, bugun)).toBeNull();
    expect(izinAraligiGecerliMi({ baslangic: "2026-10-30", bitis: "2026-12-31" }, bugun)).toBeTruthy();
  });

  it("geçmişe dönük aralığı reddeder", () => {
    const hata = izinAraligiGecerliMi({ baslangic: "2026-01-01", bitis: "2026-01-05" }, bugun);
    expect(hata).toBeTruthy();
  });
});

describe("izinTuru / durum doğrulama", () => {
  it("izin türlerini kabul eder", () => {
    expect(izinTuruGecerliMi("izin")).toBe(true);
    expect(izinTuruGecerliMi("mazeret")).toBe(true);
    expect(izinTuruGecerliMi("rapor")).toBe(true);
    expect(izinTuruGecerliMi("degisim")).toBe(true);
    expect(izinTuruGecerliMi("saat")).toBe(false);
  });

  it("izin durumlarını kabul eder", () => {
    expect(izinDurumuGecerliMi("bekliyor")).toBe(true);
    expect(izinDurumuGecerliMi("onaylandi")).toBe(true);
    expect(izinDurumuGecerliMi("reddedildi")).toBe(true);
    expect(izinDurumuGecerliMi("iptal")).toBe(true);
    expect(izinDurumuGecerliMi("durum")).toBe(false);
  });

  it("etiketler dolu", () => {
    expect(IZIN_TURLERI).toHaveLength(4);
    expect(IZIN_TUR_ETIKETI.izin).toBe("İzin");
    expect(IZIN_TUR_ETIKETI.degisim).toBe("Vardiya değişimi");
    expect(IZIN_DURUM_ETIKETI.bekliyor).toBe("Onay bekliyor");
    expect(IZIN_DURUM_ETIKETI.onaylandi).toBe("Onaylandı");
  });
});

describe("izinTarihMetni", () => {
  it("aynı gün için tek tarih", () => {
    expect(izinTarihMetni("2026-10-30", "2026-10-30")).toBe("30 Eki 2026");
  });

  it("aynı ayda aralık", () => {
    expect(izinTarihMetni("2026-10-30", "2026-10-31")).toBe("30–31 Eki 2026");
  });

  it("gün aralığını gösterir", () => {
    expect(izinTarihMetni("2026-10-30", "2026-11-02")).toBe("30 Eki – 2 Kas 2026");
  });
});

describe("onayliIzinVarMi", () => {
  const talepler: IzinTalebi[] = [
    {
      id: "t1",
      employeeId: "e1",
      baslangic: "2026-10-30",
      bitis: "2026-11-01",
      tur: "izin",
      not: "",
      durum: "onaylandi",
      createdAt: "2026-10-29T10:00:00.000Z",
      kararAt: "2026-10-29T10:05:00.000Z",
      kararNot: "",
    },
  ];

  it("onaylı aralıkta günü kapsar", () => {
    expect(onayliIzinVarMi(talepler, "e1", "2026-10-31")).toBe(true);
  });

  it("reddedilen talep onay gibi sayılmaz", () => {
    expect(onayliIzinVarMi(talepler, "e1", "2026-11-30")).toBe(false);
  });

  it("kendi personelin talebini kapsamaz", () => {
    expect(onayliIzinVarMi(talepler, "e2", "2026-10-30")).toBe(false);
  });
});

describe("bekleyenTalepler", () => {
  const talepler: IzinTalebi[] = [
    {
      id: "t2",
      employeeId: "e1",
      baslangic: "2026-10-30",
      bitis: "2026-11-01",
      tur: "izin",
      not: "",
      durum: "bekliyor",
      createdAt: "2026-10-29T10:00:00.000Z",
      kararAt: null,
      kararNot: "",
    },
  ];

  it("yalnızca bekleyenleri döner", () => {
    const bekleyen = bekleyenTalepler(talepler);
    expect(bekleyen).toHaveLength(1);
    expect(bekleyen[0].id).toBe("t2");
  });
});
