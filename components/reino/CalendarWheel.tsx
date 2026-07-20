"use client";
import { useState } from "react";
import { CALENDAR, SEASONS, HOLIDAYS } from "@/data/cosmology";
import { useGameClock } from "@/lib/useGameClock";
import { momentFromGameMin } from "@/lib/gameClock";

// Rueda del año exandrino: los 11 meses repartidos por sus días reales, teñidos
// por estación, con las festividades como marcas en el aro y la aguja en el día
// de campaña. Gira sola con el reloj (el reloj ya es realtime).

const SEASON_COLOR: Record<string, string> = {
  Primavera: "var(--color-primitivo)",
  Verano: "var(--color-bronze)",
  Otoño: "var(--color-ember)",
  Invierno: "var(--color-arcane)",
};

const R_OUT = 148;
const R_IN = 104;
const CX = 170;
const CY = 170;

// Día-del-año (1-based) en que empieza cada mes.
function monthStarts(): number[] {
  const out: number[] = [];
  let acc = 0;
  for (const d of CALENDAR.monthDays) { out.push(acc + 1); acc += d; }
  return out;
}

const STARTS = monthStarts();
const YEAR = CALENDAR.yearDays;

// Las coordenadas se REDONDEAN a 2 decimales a propósito: Node y el navegador
// no dan el mismo último bit en sin/cos, y sin esto React avisa de hydration
// mismatch en cada arco del SVG.
const r2 = (n: number) => Math.round(n * 100) / 100;

// Día-del-año -> ángulo (grados, 0 arriba, sentido horario).
const angleOf = (doy: number) => r2(((doy - 1) / YEAR) * 360);
const pt = (deg: number, r: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [r2(CX + r * Math.cos(rad)), r2(CY + r * Math.sin(rad))] as const;
};

// Sector anular entre dos ángulos.
function arcPath(a0: number, a1: number, rOut: number, rIn: number): string {
  const large = a1 - a0 > 180 ? 1 : 0;
  const [x0, y0] = pt(a0, rOut);
  const [x1, y1] = pt(a1, rOut);
  const [x2, y2] = pt(a1, rIn);
  const [x3, y3] = pt(a0, rIn);
  return `M ${x0} ${y0} A ${rOut} ${rOut} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${rIn} ${rIn} 0 ${large} 0 ${x3} ${y3} Z`;
}

// Estación de un día-del-año (misma regla que lib/gameClock, resumida).
function seasonOfDay(doy: number): string {
  let best = SEASONS[SEASONS.length - 1].name;
  for (const s of SEASONS) {
    const [dStr, , mName] = s.start.split(" ");
    const mi = CALENDAR.months.findIndex((m) => m.toLowerCase() === (mName ?? "").toLowerCase().replace(/[(),]/g, ""));
    if (mi < 0) continue;
    const start = STARTS[mi] + (Number(dStr) - 1);
    const off = ((doy - start) % YEAR + YEAR) % YEAR;
    if (off < s.days) { best = s.name; break; }
  }
  return best;
}

// Día-del-año de una festividad ("20 de Duscar").
function holidayDoy(date: string): number | null {
  const m = date.match(/^(\d+)\s+de\s+(.+)$/i);
  if (!m) return null;
  const mi = CALENDAR.months.findIndex((x) => x.toLowerCase() === m[2].trim().toLowerCase());
  if (mi < 0) return null;
  return STARTS[mi] + (Number(m[1]) - 1);
}

export default function CalendarWheel() {
  const { nowGameMin, ready } = useGameClock();
  const moment = momentFromGameMin(nowGameMin);
  const [hover, setHover] = useState<{ title: string; sub: string } | null>(null);

  const hoy = moment.dayOfYear;
  const agujaDeg = angleOf(hoy);

  const holidays = HOLIDAYS.map((h) => ({ ...h, doy: holidayDoy(h.date) })).filter((h) => h.doy != null) as (typeof HOLIDAYS[number] & { doy: number })[];

  return (
    <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
      <div className="mx-auto">
        <svg viewBox="0 0 340 340" className="w-[300px] h-[300px] sm:w-[340px] sm:h-[340px]" role="img" aria-label="Rueda del año exandrino">
          <defs>
            <radialGradient id="wheelCore">
              <stop offset="0%" stopColor="rgba(255,220,150,0.18)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>

          <circle cx={CX} cy={CY} r={R_IN - 4} fill="url(#wheelCore)" />

          {/* Meses */}
          {CALENDAR.months.map((name, i) => {
            const a0 = angleOf(STARTS[i]);
            const a1 = angleOf(STARTS[i] + CALENDAR.monthDays[i]);
            const season = seasonOfDay(STARTS[i] + 1);
            const color = SEASON_COLOR[season] ?? "var(--color-bronze)";
            const esActual = i === moment.monthIndex;
            const [lx, ly] = pt((a0 + a1) / 2, (R_OUT + R_IN) / 2);
            return (
              <g key={name} onMouseEnter={() => setHover({ title: name, sub: `${CALENDAR.monthDays[i]} días · ${season}` })} onMouseLeave={() => setHover(null)} style={{ cursor: "default" }}>
                <path d={arcPath(a0, a1, R_OUT, R_IN)} fill={color}
                  fillOpacity={esActual ? 0.55 : 0.2}
                  stroke="var(--color-line)" strokeWidth={1} />
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                  fontSize={9.5} fontWeight={esActual ? 800 : 600}
                  fill={esActual ? "var(--color-parch)" : "var(--color-warm)"}>{name.slice(0, 8)}</text>
              </g>
            );
          })}

          {/* Festividades */}
          {holidays.map((h) => {
            const [x, y] = pt(angleOf(h.doy), R_OUT + 9);
            const esHoy = h.doy === hoy;
            return (
              <circle key={h.name} cx={x} cy={y} r={esHoy ? 5 : 3.2}
                fill={esHoy ? "var(--color-divino)" : "var(--color-bronze)"}
                onMouseEnter={() => setHover({ title: h.name, sub: h.date })} onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer" }}>
                {esHoy && <animate attributeName="r" values="5;7;5" dur="1.8s" repeatCount="indefinite" />}
              </circle>
            );
          })}

          {/* Aguja del día actual */}
          {ready && (
            <g style={{ transition: "transform 900ms ease" }} transform={`rotate(${agujaDeg} ${CX} ${CY})`}>
              <line x1={CX} y1={CY} x2={CX} y2={CY - (R_OUT - 6)} stroke="var(--color-bronze-bright)" strokeWidth={2} strokeLinecap="round" />
              <circle cx={CX} cy={CY - (R_OUT - 6)} r={3.5} fill="var(--color-bronze-bright)" />
            </g>
          )}
          <circle cx={CX} cy={CY} r={4} fill="var(--color-bronze)" />

          {/* Centro: fecha y luna */}
          <text x={CX} y={CY - 28} textAnchor="middle" fontSize={11} fill="var(--color-dim)">{moment.season}</text>
          <text x={CX} y={CY + 34} textAnchor="middle" fontSize={13} fontWeight={800} fill="var(--color-parch)">
            {moment.day} de {moment.monthName}
          </text>
          <text x={CX} y={CY + 50} textAnchor="middle" fontSize={10} fill="var(--color-bronze-bright)">{moment.year} {CALENDAR.era}</text>
          <text x={CX} y={CY + 68} textAnchor="middle" fontSize={9.5} fill="var(--color-muted)">{moment.moonPhase}</text>
        </svg>

        <p className="text-center font-ui text-[12px] mt-1 min-h-[34px]" style={{ color: "var(--color-muted)" }}>
          {hover ? (<><strong style={{ color: "var(--color-bronze-bright)" }}>{hover.title}</strong><br />{hover.sub}</>) : "Pasa el ratón por un mes o una festividad."}
        </p>
      </div>

      <div>
        <p className="prose-lore !text-[15px] !mb-4">
          El año dura <strong>{CALENDAR.yearDays} días</strong> en <strong>{CALENDAR.months.length} meses</strong> y semanas de <strong>{CALENDAR.weekdays.length}</strong>.
          Los años se cuentan desde la Divergencia (<strong>{CALENDAR.era}</strong>).
        </p>

        <p className="eyebrow mb-2" style={{ color: "var(--color-divino)" }}>La semana</p>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {CALENDAR.weekdays.map((d) => {
            const finde = CALENDAR.weekend.includes(d);
            const esHoy = d === moment.weekdayName;
            return (
              <span key={d} className="font-ui text-[12px] font-semibold px-2.5 py-1 rounded-lg"
                style={{
                  color: esHoy ? "var(--color-ink)" : finde ? "var(--color-bronze-bright)" : "var(--color-muted)",
                  background: esHoy ? "var(--color-bronze)" : "rgba(0,0,0,0.25)",
                  border: `1px solid ${finde || esHoy ? "var(--color-bronze)" : "var(--color-line)"}`,
                }}>{d}</span>
            );
          })}
        </div>

        <p className="eyebrow mb-2" style={{ color: "var(--color-divino)" }}>Las estaciones</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {SEASONS.map((s) => {
            const esActual = s.name === moment.season;
            return (
              <div key={s.name} className="panel-raised px-3 py-2"
                style={esActual ? { borderColor: SEASON_COLOR[s.name] } : undefined}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display font-bold text-[14px]" style={{ color: SEASON_COLOR[s.name] }}>{s.name}</span>
                  <span className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>{s.days} días</span>
                </div>
                <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>Empieza: {s.start}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
