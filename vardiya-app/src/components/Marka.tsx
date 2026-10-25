/**
 * Marka işareti — sade, statik "V".
 *
 * 3B/WebGL logo vitrinden kaldırıldı: tanıtım yüzeyi tek renkli ve
 * durgun. İşaret tek bir SVG yolundan oluşur; her boyutta net kalır.
 */
export default function Marka({
  boyut = 22,
  yazi = false,
  nokta = false,
  className = "",
}: {
  boyut?: number;
  yazi?: boolean;
  nokta?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={boyut}
        height={boyut}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M4 4.5 12 20 20 4.5"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {yazi ? <span className="marka text-[15px]">Vardiya</span> : null}
      {nokta ? (
        <span
          aria-hidden="true"
          className="h-[5px] w-[5px] shrink-0 rounded-full bg-[#e8ae55]"
        />
      ) : null}
    </span>
  );
}
