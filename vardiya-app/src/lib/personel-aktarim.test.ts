import { describe, expect, it } from "vitest";
import {
  ayiriciBul,
  baslikSatiriMi,
  dosyaKabulEdilir,
  parseEmployeeText,
  satiriBol,
} from "./personel-aktarim";

describe("personel içe aktarma", () => {
  it("noktalı virgüllü listeyi okur", () => {
    const list = parseEmployeeText(
      "Ayşe Yılmaz; Barista; 0532 111 22 33\nMehmet Kaya; Garson"
    );
    expect(list).toEqual([
      { name: "Ayşe Yılmaz", role: "Barista", phone: "0532 111 22 33" },
      { name: "Mehmet Kaya", role: "Garson", phone: "" },
    ]);
  });

  it("Excel'den yapıştırılan sekmeli metni okur", () => {
    const list = parseEmployeeText(
      "Ad Soyad\tGörev\tTelefon\nZeynep Demir\tŞef\t0533 222 33 44"
    );
    expect(list).toEqual([
      { name: "Zeynep Demir", role: "Şef", phone: "0533 222 33 44" },
    ]);
  });

  it("başlık satırını atlar", () => {
    expect(baslikSatiriMi("Ad;Görev;Telefon", ";")).toBe(true);
    expect(baslikSatiriMi("Ayşe;Barista;0532", ";")).toBe(false);
    expect(parseEmployeeText("Ad,Görev,Telefon\nCan A.,Barista,0532")).toEqual([
      { name: "Can A.", role: "Barista", phone: "0532" },
    ]);
  });

  it("tırnaklı CSV alanlarını ve içindeki virgülleri korur", () => {
    const list = parseEmployeeText(
      'Ad,Görev,Telefon\n"Yılmaz, Ayşe",Barista,"0532 111 22 33"'
    );
    expect(list).toEqual([
      { name: "Yılmaz, Ayşe", role: "Barista", phone: "0532 111 22 33" },
    ]);
  });

  it("BOM, boş satır ve tek sütunlu satırları temizler", () => {
    const list = parseEmployeeText("\uFEFF\n\n  Elif Şahin  \n\n");
    expect(list).toEqual([{ name: "Elif Şahin", role: "", phone: "" }]);
  });

  it("ayırıcıyı ilk satırdan seçer", () => {
    expect(ayiriciBul("a\tb\tc")).toBe("\t");
    expect(ayiriciBul("a;b;c")).toBe(";");
    expect(ayiriciBul("a,b,c")).toBe(",");
    expect(ayiriciBul("tek sütun")).toBe(";");
  });

  it("satırı tırnak kurallarına göre böler", () => {
    expect(satiriBol('"a;b";c', ";")).toEqual(["a;b", "c"]);
    expect(satiriBol('"a""b";c', ";")).toEqual(['a"b', "c"]);
  });

  it("200 kişiden fazlasını keser", () => {
    const metin = Array.from({ length: 250 }, (_, i) => `Kişi ${i + 1}`).join("\n");
    expect(parseEmployeeText(metin)).toHaveLength(200);
  });

  it("yalnızca csv/tsv/txt dosyalarını kabul eder", () => {
    expect(dosyaKabulEdilir("personel.csv")).toBe(true);
    expect(dosyaKabulEdilir("personel.CSV")).toBe(true);
    expect(dosyaKabulEdilir("personel.xlsx")).toBe(false);
    expect(dosyaKabulEdilir("personel.pdf")).toBe(false);
  });
});
