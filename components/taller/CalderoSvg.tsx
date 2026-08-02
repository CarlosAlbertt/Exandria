"use client";

import { useId } from "react";

/**
 * El caldero, dibujado.
 *
 * **Es SVG y no una imagen**, y no por capricho:
 * - el brebaje **se colorea por poción** (`colorBrebaje`), así que el caldero
 *   dice qué hay dentro sin una etiqueta encima;
 * - el fuego **se enciende y se apaga por fase**: apagado mientras se echan los
 *   materiales, vivo al cocer;
 * - **no hay assets que esperar**. `public/species/lineages/` lleva vacío desde
 *   siempre; un caldero en PNG habría sido el mismo agujero.
 *
 * Los `id` de los degradados se sacan de `useId`: si dos calderos se montaran a
 * la vez con ids fijos, el segundo pisaría los degradados del primero y el
 * brebaje saldría del color equivocado.
 */
export default function CalderoSvg({
  color,
  fuego = false,
  burbujas = false,
  vacio = false,
}: {
  /** Color del brebaje. */
  color: string;
  /** Leña encendida. */
  fuego?: boolean;
  /** Burbujas subiendo. */
  burbujas?: boolean;
  /** Sin receta elegida: el caldero está frío y oscuro. */
  vacio?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const id = (s: string) => `${s}-${uid}`;

  return (
    <svg viewBox="0 0 400 330" className="caldero-svg" role="img"
      aria-label={vacio ? "Caldero vacío" : "Caldero con la mezcla dentro"}>
      <defs>
        <linearGradient id={id("iron")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#414c5e" /><stop offset="38%" stopColor="#232b38" />
          <stop offset="72%" stopColor="#12171f" /><stop offset="100%" stopColor="#0b0f15" />
        </linearGradient>
        <linearGradient id={id("rim")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5c6675" />
          <stop offset="55%" stopColor="#2c3542" /><stop offset="100%" stopColor="#171d26" />
        </linearGradient>
        <radialGradient id={id("brew")} cx="50%" cy="38%" r="65%">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="45%" stopColor={color} />
          <stop offset="100%" stopColor="#0f2a1e" />
        </radialGradient>
        <radialGradient id={id("glow")} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffb056" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ef6a3d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("flame")} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#8e2a1c" /><stop offset="45%" stopColor="#ef6a3d" />
          <stop offset="100%" stopColor="#ffd76a" />
        </linearGradient>
        <filter id={id("soft")}><feGaussianBlur stdDeviation="6" /></filter>
        <filter id={id("halo")}>
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <clipPath id={id("inside")}><ellipse cx="200" cy="122" rx="96" ry="23" /></clipPath>
      </defs>

      {fuego && <ellipse cx="200" cy="292" rx="150" ry="34" fill={`url(#${id("glow")})`} />}

      {/* asa */}
      <path d="M104,118 A98,86 0 0 1 296,118" fill="none" stroke="#39424f" strokeWidth="7" strokeLinecap="round" opacity="0.9" />
      <path d="M104,118 A98,86 0 0 1 296,118" fill="none" stroke="#5a6473" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />

      {/* vapor: solo cuando hay algo cociendo */}
      {burbujas && (
        <g stroke="#cfe6d8" fill="none" strokeLinecap="round" opacity="0.5">
          <path className="caldero-vapor" d="M170,112 c-8,-14 8,-22 0,-36" strokeWidth="4" />
          <path className="caldero-vapor" style={{ animationDelay: "1.6s" }} d="M204,108 c-9,-16 9,-24 1,-40" strokeWidth="5" />
          <path className="caldero-vapor" style={{ animationDelay: "3.1s" }} d="M238,112 c-8,-13 7,-21 0,-34" strokeWidth="4" />
        </g>
      )}

      {/* cuerpo */}
      <path d="M96,124 C86,196 128,258 200,258 C272,258 314,196 304,124 Z" fill={`url(#${id("iron")})`} />
      <path d="M112,140 C108,196 142,242 200,244" fill="none" stroke="#6d7a8c" strokeWidth="4" opacity="0.22" strokeLinecap="round" />
      <path d="M96,150 C104,150 296,150 304,150" stroke="#0a0e14" strokeWidth="7" opacity="0.45" fill="none" />
      <path d="M99,168 C110,170 290,170 301,168" stroke="#5a6473" strokeWidth="2" opacity="0.18" fill="none" />

      {/* patas */}
      <path d="M126,244 l-16,34 h13 l14,-28 Z" fill="#1a2029" />
      <path d="M274,244 l16,34 h-13 l-14,-28 Z" fill="#1a2029" />
      <path d="M193,257 h14 v26 h-14 Z" fill="#141a22" />

      {/* borde */}
      <ellipse cx="200" cy="122" rx="108" ry="27" fill={`url(#${id("rim")})`} />
      <ellipse cx="200" cy="122" rx="108" ry="27" fill="none" stroke="var(--color-bronze)" strokeWidth="1.4" opacity="0.38" />
      <ellipse cx="200" cy="124" rx="96" ry="23" fill="#080b10" />

      {/* brebaje */}
      {!vacio && (
        <>
          <g clipPath={`url(#${id("inside")})`}>
            <ellipse cx="200" cy="124" rx="96" ry="23" fill={`url(#${id("brew")})`} />
            <ellipse cx="200" cy="118" rx="70" ry="12" fill="#ffffff" opacity="0.18" filter={`url(#${id("soft")})`} />
            {burbujas && (
              <g fill="#ffffff" opacity="0.75">
                <circle className="caldero-burbuja" cx="172" cy="132" r="4" />
                <circle className="caldero-burbuja" style={{ animationDelay: "0.8s" }} cx="205" cy="136" r="5.5" />
                <circle className="caldero-burbuja" style={{ animationDelay: "1.5s" }} cx="232" cy="130" r="3.4" />
                <circle className="caldero-burbuja" style={{ animationDelay: "2.1s" }} cx="190" cy="138" r="3" />
              </g>
            )}
          </g>
          <ellipse cx="200" cy="124" rx="96" ry="23" fill="none" stroke={color} strokeWidth="1.2" opacity="0.35" filter={`url(#${id("halo")})`} />
        </>
      )}

      {/* leña, y el fuego solo si está encendido */}
      <rect x="150" y="276" width="100" height="9" rx="4" fill="#3a2a1e" />
      <rect x="163" y="284" width="74" height="8" rx="4" fill="#2c2017" transform="rotate(-4 200 288)" />
      {fuego && (
        <g className="caldero-llama" fill={`url(#${id("flame")})`} opacity="0.95">
          <path d="M200,282 c-16,-16 -6,-30 2,-38 -2,14 10,16 10,26 0,8 -5,12 -12,12 Z" />
          <path d="M172,284 c-12,-12 -5,-23 1,-29 -1,11 8,12 8,20 0,6 -4,9 -9,9 Z" opacity="0.85" />
          <path d="M228,284 c-12,-12 -5,-23 1,-29 -1,11 8,12 8,20 0,6 -4,9 -9,9 Z" opacity="0.85" />
        </g>
      )}
    </svg>
  );
}
