"use client";

/** Hesabı silme düğmesi — geri alınamaz işlem olduğu için onay ister. */
export default function HesapSilButonu() {
  return (
    <form
      action="/api/hesap/sil"
      method="post"
      onSubmit={(e) => {
        const onay = window.confirm(
          "Hesabın ve TÜM verilerin (personel, vardiyalar, duyurular, notlar) kalıcı olarak silinecek. Bu işlem geri alınamaz.\n\nDevam edilsin mi?",
        );
        if (!onay) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
      >
        Hesabımı ve tüm verilerimi sil
      </button>
    </form>
  );
}
