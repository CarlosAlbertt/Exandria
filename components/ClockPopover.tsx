"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CALENDAR } from "@/data/cosmology";
import { useGameClock } from "@/lib/useGameClock";
import { momentFromGameMin, moonPhaseForDay } from "@/lib/gameClock";
import {
  SEASON_COLOR, SEASON_ICON, seasonOfDay, daysLeftInSeason,
  nextHoliday, absDayOf, monthCells, isWeekend, holidayAt,
} from "@/lib/calendar";

const pad = (n: number) => String(n).padStart(2, "0");

// Reloj de la barra: la chapa compacta de siempre, pero ahora ABRE un panel con
// el mes de un vistazo (fecha, hora, estación, luna, próxima fiesta y la
// rejilla del mes en curso) para no tener que ir a /reino.
export default function ClockPopover() {
  const { nowGameMin, ready } = useGameClock();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Cerrar al pulsar fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (!ready) {
    return <span className="font-ui text-[11px] shrink-0" style={{ color: "var(--color-dim)" }}><i className="fas fa-clock" /></span>;
  }

  const m = momentFromGameMin(nowGameMin);
  const hhmm = `${pad(m.hour)}:${pad(m.minute)}`;
  const restan = daysLeftInSeason(m.dayOfYear, m.season);
  const next = nextHoliday(m.dayOfYear);
  const esDeDia = m.hour >= 6 && m.hour < 20;
  const { cells, firstDoy } = monthCells(m.monthIndex, m.year);
  const color = SEASON_COLOR[m.season] ?? "var(--color-bronze)";

  return (
    <div className="relative shrink-0" ref={boxRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title={`${m.weekdayName}, ${m.dateStr} · ${hhmm}`}
        className="font-ui text-[11px] font-semibold flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors hover:border-[var(--color-bronze)]"
        style={{
          color: m.holiday ? "var(--color-bronze-bright)" : "var(--color-muted)",
          border: `1px solid ${open ? "var(--color-bronze)" : "transparent"}`,
        }}
      >
        <i className={`fas ${m.moonIcon}`} />
        <span>{m.day} {m.monthName} · {hhmm}</span>
        {m.holiday && <i className="fas fa-star" style={{ color: "var(--color-bronze-bright)" }} />}
        <i className={`fas fa-chevron-down text-[8px] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[290px] rounded-xl p-4 z-50"
          style={{ background: "var(--color-night)", border: "1px solid var(--color-line)", boxShadow: "0 12px 32px rgba(0,0,0,0.55)" }}
        >
          {/* Fecha y hora */}
          <p className="font-display text-[15px] font-extrabold leading-tight" style={{ color: "var(--color-bronze-bright)" }}>
            {m.day} de {m.monthName}, {m.year} {CALENDAR.era}
          </p>
          <p className="font-ui text-[11px] mb-2" style={{ color: "var(--color-dim)" }}>{m.weekdayName}</p>

          <div className="flex items-center gap-3 mb-3">
            <span className="font-ui text-[20px] font-bold" style={{ color: "var(--color-parch)" }}>
              <i className={`fas ${esDeDia ? "fa-sun" : "fa-moon"} text-[13px] mr-1.5`} style={{ color: esDeDia ? "var(--color-bronze)" : "var(--color-arcane)" }} />
              {hhmm}
            </span>
          </div>

          {/* Estación y luna */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <Chip icon={SEASON_ICON[m.season] ?? "fa-leaf"} color={color}
              text={restan != null ? `${m.season} · ${restan}d` : m.season} />
            <Chip icon={m.moonIcon} color="var(--color-violet)" text={m.moonPhase} />
          </div>

          {m.holiday && (
            <p className="font-ui text-[11px] font-bold px-2.5 py-1 rounded-full mb-3 inline-block"
              style={{ color: "var(--color-ink)", background: "var(--color-divino)" }}>
              <i className="fas fa-star mr-1.5" />Hoy: {m.holiday}
            </p>
          )}

          {/* Rejilla del mes */}
          <div className="grid grid-cols-7 gap-[3px] mb-1">
            {CALENDAR.weekdays.map((d) => (
              <div key={d} className="text-center font-ui text-[8px] font-bold uppercase"
                style={{ color: CALENDAR.weekend.includes(d) ? "var(--color-bronze)" : "var(--color-dim)" }}>{d.slice(0, 2)}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-[3px]">
            {cells.map((d, i) => {
              if (d == null) return <div key={`b${i}`} />;
              const doy = firstDoy + d - 1;
              const abs = absDayOf(m.year, doy);
              const esHoy = doy === m.dayOfYear;
              const fiesta = holidayAt(doy);
              return (
                <div key={d} title={`${d} de ${m.monthName}${fiesta ? ` · ${fiesta.name}` : ""} · ${moonPhaseForDay(abs).name}`}
                  className="aspect-square rounded flex items-center justify-center relative"
                  style={{
                    background: esHoy ? "var(--color-bronze)" : isWeekend(abs) ? "rgba(255,255,255,0.05)" : "transparent",
                    border: `1px solid ${esHoy ? "var(--color-bronze-bright)" : fiesta ? "var(--color-divino)" : "transparent"}`,
                  }}>
                  <span className="font-ui text-[9px] font-bold leading-none"
                    style={{ color: esHoy ? "var(--color-ink)" : "var(--color-warm)" }}>{d}</span>
                  {fiesta && !esHoy && <span className="absolute top-[1px] right-[1px] w-1 h-1 rounded-full" style={{ background: "var(--color-divino)" }} />}
                </div>
              );
            })}
          </div>

          {/* Próxima fiesta + salida al calendario grande */}
          {next && (
            <p className="font-ui text-[11px] mt-3 pt-3" style={{ color: "var(--color-muted)", borderTop: "1px solid var(--color-line)" }}>
              <i className="fas fa-star mr-1.5" style={{ color: "var(--color-divino)" }} />
              <strong style={{ color: "var(--color-parch)" }}>{next.name}</strong>
              {next.falta === 0 ? " · hoy" : ` · en ${next.falta} días`}
            </p>
          )}
          <Link href="/reino" onClick={() => setOpen(false)}
            className="font-ui text-[11px] font-semibold mt-2 inline-flex items-center gap-1.5"
            style={{ color: "var(--color-bronze-bright)" }}>
            Calendario completo <i className="fas fa-arrow-right text-[9px]" />
          </Link>
        </div>
      )}
    </div>
  );
}

function Chip({ icon, color, text }: { icon: string; color: string; text: string }) {
  return (
    <span className="font-ui text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ color, border: `1px solid color-mix(in srgb, ${color} 55%, transparent)` }}>
      <i className={`fas ${icon} mr-1`} />{text}
    </span>
  );
}
