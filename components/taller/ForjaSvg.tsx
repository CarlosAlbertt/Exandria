"use client";

import { useId } from "react";
import { tramoDeCalor } from "@/lib/forjado";

/**
 * La fragua, dibujada: carbones, fuelle, yunque con la pieza al rojo, martillo y
 * cubeta de temple.
 *
 * **Es SVG y no una imagen**, por lo mismo que el caldero: la barra **se colorea
 * con la temperatura de verdad** (`tramoDeCalor`), así que el metal dice a qué
 * punto está sin leer la escala; los carbones se avivan al dar al fuelle; y no
 * hay assets que esperar.
 *
 * ⚠️ **El martillo tiene dos trampas que ya costaron una vuelta**, y por eso van
 * escritas aquí:
 * 1. **El eje es el 0,0 del grupo**, que se coloca con `transform` en el SVG y se
 *    gira con CSS. Con un `transform-origin` en porcentaje, el giro cae en la
 *    esquina de la caja del grupo y el martillo **se desliza** en vez de pivotar.
 * 2. **En SVG la `y` crece hacia abajo**, así que un ángulo positivo gira en el
 *    sentido de las agujas del reloj. Con el mango apuntando a la izquierda,
 *    levantar es `+58deg`. Con el signo al revés el martillo se hunde por debajo
 *    del yunque.
 */
export default function ForjaSvg({
  calor = 0,
  fuelle = false,
  martillando = false,
  templando = false,
}: {
  /** Temperatura de la pieza, 0–1. Colorea la barra sobre el yunque. */
  calor?: number;
  /** Carbones avivados. */
  fuelle?: boolean;
  /** El martillo cae a compás. */
  martillando?: boolean;
  /** La cubeta echa vapor. */
  templando?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const id = (s: string) => `${s}-${uid}`;
  const tramo = tramoDeCalor(calor);

  return (
    <svg viewBox="0 0 460 300" className="forja-svg" role="img"
      aria-label={`Fragua. La pieza está ${tramo.nombre}.`}>
      <defs>
        <linearGradient id={id("anvil")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a5464" /><stop offset="45%" stopColor="#252d39" />
          <stop offset="100%" stopColor="#0f141b" />
        </linearGradient>
        {/* La barra va del hierro frío al color del tramo en que esté. */}
        <linearGradient id={id("bar")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b424e" />
          <stop offset="40%" stopColor={tramo.color} />
          <stop offset="100%" stopColor={tramo.color} />
        </linearGradient>
        <radialGradient id={id("forge")} cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#ffd76a" /><stop offset="45%" stopColor="#ef6a3d" />
          <stop offset="100%" stopColor="#5a1c0e" />
        </radialGradient>
        <radialGradient id={id("glow")} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff9a4d" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ef6a3d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("wood")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5c422a" /><stop offset="100%" stopColor="#2b1e13" />
        </linearGradient>
        <filter id={id("soft")}><feGaussianBlur stdDeviation="5" /></filter>
      </defs>

      <ellipse cx="86" cy="150" rx="96" ry="76" fill={`url(#${id("glow")})`} opacity={fuelle ? 1 : 0.45} />

      {/* fragua de piedra con carbones */}
      <path d="M28,196 h116 v20 h-116 Z" fill="#232a34" />
      <path d="M34,150 h104 l6,46 h-116 Z" fill="#2f3846" />
      <ellipse cx="86" cy="150" rx="52" ry="17" fill="#141a22" />
      <ellipse className={fuelle ? "forja-carbon" : undefined} cx="86" cy="150" rx="44" ry="13"
        fill={`url(#${id("forge")})`} opacity={fuelle ? 1 : 0.75} />
      {fuelle && (
        <g fill="#ffd76a">
          <circle className="forja-chispa" style={{ "--dx": "-14px" } as React.CSSProperties} cx="70" cy="146" r="2.4" />
          <circle className="forja-chispa" style={{ "--dx": "9px", animationDelay: "0.5s" } as React.CSSProperties} cx="92" cy="148" r="2" />
          <circle className="forja-chispa" style={{ "--dx": "-4px", animationDelay: "0.9s" } as React.CSSProperties} cx="104" cy="145" r="1.7" />
        </g>
      )}

      {/* fuelle */}
      <path d="M8,120 l30,-14 8,26 -30,12 Z" fill={`url(#${id("wood")})`} stroke="#6b4a2a" strokeWidth="1.5" />
      <path d="M44,116 l26,10" stroke="#4a5464" strokeWidth="5" strokeLinecap="round" />

      {/* yunque */}
      <path d="M232,206 h56 v40 h-56 Z" fill="#1b2029" />
      <path d="M214,182 h92 l-8,24 h-76 Z" fill={`url(#${id("anvil")})`} />
      <path d="M306,186 l40,-6 -40,14 Z" fill={`url(#${id("anvil")})`} />
      <path d="M214,182 h92 v5 h-92 Z" fill="#5c6675" opacity="0.5" />
      <path d="M226,246 h68 v10 h-68 Z" fill="#141a22" />

      {/* La pieza. Da un respingo al recibir el golpe. */}
      <g className={martillando ? "forja-yunque" : undefined}>
        <rect x="222" y="168" width="104" height="13" rx="6" fill={`url(#${id("bar")})`} />
        <rect x="222" y="168" width="104" height="13" rx="6" fill={tramo.color} opacity="0.28" filter={`url(#${id("soft")})`} />
        {martillando && (
          <ellipse className="forja-flash" cx="262" cy="170" rx="34" ry="11" fill="#fff3c4" filter={`url(#${id("soft")})`} />
        )}
      </g>

      {martillando && (
        <g fill="#ffd76a">
          {[["-20px", 256, 166, 2.6], ["-9px", 262, 166, 2], ["7px", 266, 167, 2.3], ["19px", 272, 165, 1.8], ["29px", 278, 167, 1.5]]
            .map(([bx, cx, cy, r], i) => (
              <circle key={i} className="forja-golpe-chispa" style={{ "--bx": bx } as React.CSSProperties}
                cx={cx as number} cy={cy as number} r={r as number} />
            ))}
        </g>
      )}

      {/* El martillo. Ver el aviso de arriba antes de tocar el ángulo o el eje. */}
      <g transform="translate(368,160)">
        <g className={martillando ? "forja-martillo" : "forja-martillo-quieto"}>
          {/* El mango se dibuja PRIMERO y entra por el ojo de la cabeza: al revés
              parecía un bloque clavado en la punta de un palo. */}
          <rect x="-118" y="-5" width="118" height="10" rx="5" fill={`url(#${id("wood")})`} />
          <rect x="-30" y="-6" width="26" height="12" rx="5" fill="#3b2a1a" />
          <rect x="-30" y="-6" width="26" height="4" rx="2" fill="#6b4a2a" opacity="0.5" />

          {/* Cabeza de peña cruzada: cara plana a la izquierda, ojo en medio y
              peña afilada a la derecha. Un rectángulo se leía como un ladrillo. */}
          <path d="M-134,-16 L-108,-16 L-104,-11 L-88,-6 L-82,-2 L-82,4 L-88,8 L-104,12 L-108,16 L-134,16 Z" fill="#39424f" />
          <path d="M-134,-16 L-108,-16 L-104,-11 L-88,-6 L-82,-2 L-134,-9 Z" fill="#5c6675" opacity="0.5" />
          <rect x="-134" y="-16" width="7" height="32" rx="2" fill="#8b96a5" opacity="0.7" />
          <rect x="-112" y="-17" width="8" height="34" rx="3" fill="#2b323d" opacity="0.8" />

          {/* El puño. Sin él el martillo giraba solo en mitad del aire. */}
          <ellipse cx="-14" cy="0" rx="15" ry="12" fill="#6b4a2a" />
          <ellipse cx="-14" cy="-3" rx="13" ry="7" fill="#8a6236" opacity="0.65" />
          <path d="M-26,-4 h24" stroke="#3b2a1a" strokeWidth="2" opacity="0.7" />
          <path d="M-26,2 h24" stroke="#3b2a1a" strokeWidth="2" opacity="0.55" />
        </g>
      </g>

      {/* cubeta de temple */}
      <path d="M370,190 h72 l-9,58 h-54 Z" fill={`url(#${id("wood")})`} />
      <ellipse cx="406" cy="190" rx="36" ry="10" fill="#1d2733" />
      <ellipse cx="406" cy="190" rx="30" ry="7.5" fill="#2f6f8f" />
      <path d="M372,210 h68" stroke="#7a5e2c" strokeWidth="3" opacity="0.7" />
      <path d="M376,232 h60" stroke="#7a5e2c" strokeWidth="3" opacity="0.7" />
      {templando && (
        <g stroke="#cfe6d8" fill="none" strokeLinecap="round" opacity="0.55">
          <path className="forja-vapor" d="M394,182 c-7,-12 7,-18 0,-30" strokeWidth="4" />
          <path className="forja-vapor" style={{ animationDelay: "1.7s" }} d="M418,182 c-7,-12 7,-18 0,-28" strokeWidth="3.5" />
        </g>
      )}
    </svg>
  );
}
