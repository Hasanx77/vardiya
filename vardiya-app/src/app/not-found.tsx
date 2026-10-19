import Link from "next/link";

export const metadata = {
  title: "Sayfa bulunamadı — Vardiya",
};

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
          404
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Bu sayfa bulunamadı.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Adres yanlış yazılmış olabilir ya da sayfa taşınmış olabilir.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/" className="btn-birincil">
            Ana sayfa
          </Link>
          <Link href="/panel" className="btn-ikincil">
            Panele git
          </Link>
        </div>
      </div>
    </main>
  );
}
