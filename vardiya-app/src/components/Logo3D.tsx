/**
 * Vardiya 3B logosu.
 *
 * Harici kütüphane yok: marka, üst üste bindirilmiş yuvarlatılmış kare
 * katmanlarından oluşan "ekstrüzyon" ile üç boyut hissi verir. En üstteki
 * yüz ambersi gradyan + parlama taşır; "V" harfi kabartma gibi durur.
 *
 * Neden SVG? Header'da 28 px'e kadar küçülüyor; raster görsel bulanıklaşırdı.
 * Neden CSS animasyon? Tek bir transform; Three.js/WebGL ekran kartı ve
 * Lighthouse maliyeti getirirdi, logo için gereksiz.
 */
import type { CSSProperties } from "react";

type Props = {
  /** İşaretin piksel cinsinden kenar uzunluğu. */
  boyut?: number;
  /** Sadece işaret (varsayılan) ya da işaret + "Vardiya" yazısı. */
  yazi?: boolean;
  /**
   * Gradyan kimlik öneki. Aynı sayfada birden fazla logo varsa
   * (header + footer) benzersiz olmalı.
   */
  id?: string;
  /** Büyük vitrin kullanımı: nefes alan süzülme animasyonu + ışıma. */
  canli?: boolean;
  sinif?: string;
};

/** Ekstrüzyon katmanlarının en uzaktan en yakına renkleri. */
const KENAR_RENKLERI = [
  "#7a3f06",
  "#864507",
  "#924b07",
  "#9e5107",
  "#aa5707",
  "#b65e07",
  "#c26507",
  "#ce6c07",
  "#da7406",
  "#e67c05",
];

const KATMAN = KENAR_RENKLERI.length;
const DERINLIK = 4.6; // 64'lük viewBox içinde toplam kayma

export default function Logo3D({
  boyut = 28,
  yazi = false,
  id = "vardiya-logo",
  canli = false,
  sinif = "",
}: Props) {
  return (
    <span
      className={`logo3d ${canli ? "logo3d-canli" : ""} ${sinif}`.trim()}
      style={{ "--logo-boyut": `${boyut}px` } as CSSProperties}
    >
      <span className="logo3d-isaret">
        <svg
          width={boyut}
          height={boyut}
          viewBox="0 0 64 64"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            {/* Ön yüz: sol üstten ışık alan amber yüzey */}
            <linearGradient id={`${id}-yuz`} x1="10%" y1="0%" x2="90%" y2="100%">
              <stop offset="0%" stopColor="#ffdb85" />
              <stop offset="38%" stopColor="#fbb125" />
              <stop offset="72%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#e2840a" />
            </linearGradient>
            {/* Cam parlaması */}
            <linearGradient id={`${id}-parlak`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            {/* Alt kenarda hafif gölgelenme: yüzey düz görünmesin */}
            <linearGradient id={`${id}-ic-golge`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="55%" stopColor="#7a3f06" stopOpacity="0" />
              <stop offset="100%" stopColor="#7a3f06" stopOpacity="0.22" />
            </linearGradient>
          </defs>

          {/* Ekstrüzyon: en dipteki katmandan öne doğru */}
          {KENAR_RENKLERI.map((renk, i) => {
            const kayma = (DERINLIK * (KATMAN - i)) / KATMAN;
            return (
              <rect
                key={renk}
                x={7 + kayma}
                y={5.5 + kayma}
                width={42}
                height={42}
                rx={11.5}
                fill={renk}
              />
            );
          })}

          {/* Ön yüz */}
          <rect
            x={7}
            y={5.5}
            width={42}
            height={42}
            rx={11.5}
            fill={`url(#${id}-yuz)`}
          />
          {/* Üst kenar ışığı */}
          <rect
            x={7.6}
            y={6.1}
            width={40.8}
            height={41}
            rx={11}
            fill="none"
            stroke="#fff7e0"
            strokeOpacity="0.5"
            strokeWidth="0.9"
          />
          {/* Cam parlaması */}
          <rect
            x={9.4}
            y={8}
            width={37.2}
            height={17}
            rx={8.5}
            fill={`url(#${id}-parlak)`}
          />
          {/* Alt iç gölge */}
          <rect
            x={7}
            y={5.5}
            width={42}
            height={42}
            rx={11.5}
            fill={`url(#${id}-ic-golge)`}
          />

          {/* V: önce gölgesi (kabartma), sonra krem yüz */}
          <path
            d="M20.5 17.5 28.5 38 36.5 17.5"
            fill="none"
            stroke="#8f4a05"
            strokeOpacity="0.45"
            strokeWidth="6.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="translate(0.85 1.15)"
          />
          <path
            d="M20.5 17.5 28.5 38 36.5 17.5"
            fill="none"
            stroke="#fffaf0"
            strokeWidth="6.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {yazi ? <span className="marka logo3d-yazi">Vardiya</span> : null}
    </span>
  );
}
