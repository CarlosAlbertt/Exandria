"use client";

import { useGameClock } from "@/lib/useGameClock";
import { momentFromGameMin } from "@/lib/gameClock";

// Icono aproximado por estación (fallback fa-leaf si no coincide ninguno).
const SEASON_ICONS: Record<string, string> = {
  Primavera: "fa-seedling",
  Verano: "fa-sun",
  Otoño: "fa-leaf",
  Invierno: "fa-snowflake",
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// Reloj de campaña en grande, para paneles (`/lugar` de camino, Panel DM ›
// Tiempo). La variante compacta de la barra de navegación vive ahora en
// `ClockPopover`, que además despliega el mes.
export default function ClockWidget() {
  const { nowGameMin, ready } = useGameClock();

  if (!ready) {
    return (
      <div className="panel p-4">
        <p className="eyebrow mb-1">Calendario de Exandria</p>
        <p className="text-[13px]" style={{ color: "var(--color-dim)" }}>
          <i className="fas fa-clock mr-1.5" />Cargando el reloj de campaña…
        </p>
      </div>
    );
  }

  const m = momentFromGameMin(nowGameMin);
  const seasonIcon = SEASON_ICONS[m.season] ?? "fa-leaf";
  const hh = pad(m.hour);
  const mm = pad(m.minute);


  return (
    <div className="panel p-5">
      <p className="eyebrow mb-2">Calendario de Exandria</p>
      <p className="font-display text-lg font-bold gold-text leading-snug">
        {m.weekdayName}, {m.day} de {m.monthName} de {m.year} PD
      </p>
      <p className="font-ui text-2xl font-bold mt-1" style={{ color: "var(--color-parch)" }}>
        {hh}:{mm}
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        <span
          className="font-ui text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{ color: "var(--color-arcane)", border: "1px solid color-mix(in srgb, var(--color-arcane) 55%, transparent)" }}
        >
          <i className={`fas ${seasonIcon} mr-1.5`} />{m.season}
        </span>
        <span
          className="font-ui text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{ color: "var(--color-violet)", border: "1px solid color-mix(in srgb, var(--color-violet) 55%, transparent)" }}
        >
          <i className={`fas ${m.moonIcon} mr-1.5`} />{m.moonPhase}
        </span>
        {m.holiday && (
          <span
            className="font-ui text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ color: "var(--color-bronze-bright)", border: "1px solid color-mix(in srgb, var(--color-bronze) 55%, transparent)" }}
          >
            <i className="fas fa-star mr-1.5" />{m.holiday}
          </span>
        )}
      </div>
    </div>
  );
}
