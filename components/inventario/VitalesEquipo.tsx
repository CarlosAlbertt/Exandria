"use client";

import { huecosDe } from "@/lib/inventario";

type Props = {
  /** Clase de Armadura ya calculada por derive() — no se recalcula aquí. */
  ac: number;
  /**
   * Explicación en español llano de esa CA (p. ej. "Coraza + DES (máx 2)").
   * `derive()` la calcula desde siempre (lib/derive.ts) pero hasta ahora
   * ningún componente la pintaba: un jugador se ponía una coraza y no veía
   * NADA que le dijera por qué la CA cambió, ni a qué achacarla si algo
   * salía mal. Esta línea es el motivo de existir de este componente.
   */
  acSource: string;
  /** Modificador de Fuerza ya derivado (derived.abilities.fue.mod), para huecosDe(). */
  modFuerza: number;
  /** Suma de qty de la bolsa: cuántos huecos van ocupados. */
  usados: number;
  /** Tiles extra opcionales (p. ej. impacto y daño), si quien monta este componente ya los tiene. */
  extras?: { label: string; value: string }[];
};

// Vitales del equipo: la CA y de dónde sale, más la capacidad de la bolsa y
// de dónde sale ESA. No calcula nada nuevo — todo esto ya lo devolvía
// derive() (o huecosDe(), ya cubierto por scripts/check-inventario.ts) y se
// tiraba. Vive bajo el muñeco de equipo y se reutiliza en el resumen de la
// ficha (Task 7), así que no debe asumir un contenedor ancho.
export default function VitalesEquipo({ ac, acSource, modFuerza, usados, extras = [] }: Props) {
  const cap = huecosDe(modFuerza);
  // cap siempre es >= 10 (suelo de huecosDe), así que no hace falta guardia
  // contra división por cero — pero usados sí puede superar cap (el DM puede
  // soltar más de lo que cabe), así que la barra se recorta para no desbordar.
  const ratio = usados / cap;
  const anchoPct = Math.max(0, Math.min(1, ratio)) * 100;
  const color =
    ratio >= 1 ? "var(--color-ember)" : ratio >= 0.8 ? "var(--color-marcial)" : "var(--color-bronze)";
  const signoFuerza = modFuerza >= 0 ? "+" : "";

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <div className="panel-raised flex-1 min-w-[72px] px-3 py-2.5 text-center">
          <p className="font-display text-[26px] leading-none" style={{ color: "var(--color-bronze-bright)" }}>
            {ac}
          </p>
          <p className="font-ui text-[10px] uppercase tracking-[.14em] mt-1" style={{ color: "var(--color-dim)" }}>
            CA
          </p>
        </div>
        {extras.map((e) => (
          <div key={e.label} className="panel-raised flex-1 min-w-[72px] px-3 py-2.5 text-center">
            <p className="font-display text-[26px] leading-none" style={{ color: "var(--color-bronze-bright)" }}>
              {e.value}
            </p>
            <p className="font-ui text-[10px] uppercase tracking-[.14em] mt-1" style={{ color: "var(--color-dim)" }}>
              {e.label}
            </p>
          </div>
        ))}
      </div>

      {acSource && (
        <p className="font-ui italic text-[11px] text-center mt-2" style={{ color: "var(--color-dim)" }}>
          {acSource}
        </p>
      )}

      <div className="mt-3">
        <div className="flex items-center justify-between font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
          <span>Carga</span>
          <span>
            {usados} / {cap}
          </span>
        </div>
        <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: "var(--color-night)" }}>
          <div
            className="h-full rounded-full transition-[width]"
            style={{ width: `${anchoPct}%`, background: color }}
          />
        </div>
        <p className="font-ui text-[10px] text-center mt-1" style={{ color: "var(--color-dim)" }}>
          20 + 2 × mod. Fuerza ({signoFuerza}
          {modFuerza})
        </p>
      </div>
    </div>
  );
}
