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
        className="btn-tehlike"
      >
        Hesabımı ve tüm verilerimi sil
      </button>
    </form>
  );
}
