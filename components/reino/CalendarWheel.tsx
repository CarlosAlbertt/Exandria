"use client";
import { useState } from "react";
import { CALENDAR } from "@/data/cosmology";
import { useGameClock } from "@/lib/useGameClock";
import { momentFromGameMin, moonPhaseForDay } from "@/lib/gameClock";
import {
  YEAR, WEEK, STARTS, SEASON_COLOR, SEASON_RANGES, seasonOfDay, daysLeftInSeason,
  HOLIDAY_DOY, nextHoliday, absDayOf, monthCells, isWeekend, holidayAt,
} from "@/lib/calendar";

// Calendario exandrino: rueda del año (meses por sus días reales, teñidos por
// estación, con anillo de estaciones y festividades en el aro) + vista de mes
// con rejilla de días, fase de Catha por día y festividades marcadas.
// La aguja se mueve con el reloj de campaña, que ya es realtime.

const CX = 180;
const CY = 180;
const R_SEASON_OUT = 172;
const R_SEASON_IN = 156;
const R_OUT = 150;
const R_IN = 106;

// Las coordenadas se REDONDEAN a 2 decimales a propósito: Node y el navegador
// no dan el mismo último bit en sin/cos, y sin esto React avisa de hydration
// mismatch en cada arco del SVG.
const r2 = (n: number) => Math.round(n * 100) / 100;
const angleOf = (doy: number) => r2(((doy - 1) / YEAR) * 360);
const pt = (deg: number, r: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [r2(CX + r * Math.cos(rad)), r2(CY + r * Math.sin(rad))] as const;
};

function arcPath(a0: number, a1: number, rOut: number, rIn: number): string {
  const large = a1 - a0 > 180 ? 1 : 0;
  const [x0, y0] = pt(a0, rOut);
  const [x1, y1] = pt(a1, rOut);
  const [x2, y2] = pt(a1, rIn);
  const [x3, y3] = pt(a0, rIn);
  return `M ${x0} ${y0} A ${rOut} ${rOut} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${rIn} ${rIn} 0 ${large} 0 ${x3} ${y3} Z`;
}

export default function CalendarWheel() {
  const { nowGameMin, ready } = useGameClock();
  const moment = momentFromGameMin(nowGameMin);
  const [sel, setSel] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const hoy = moment.dayOfYear;
  const mesVisto = sel ?? moment.monthIndex;

  const next = nextHoliday(hoy);
  const restanEstacion = daysLeftInSeason(hoy, moment.season);

  const hhmm = `${String(moment.hour).padStart(2, "0")}:${String(moment.minute).padStart(2, "0")}`;
  const esDeDia = moment.hour >= 6 && moment.hour < 20;

  return (
    <div className="space-y-6">
      {/* Cabecera: dónde estamos en el tiempo */}
      <div className="panel p-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div>
          <p className="eyebrow !text-[9px] mb-0.5">Hoy</p>
          <p className="font-display text-xl font-extrabold" style={{ color: "var(--color-bronze-bright)" }}>
            {moment.day} de {moment.monthName}, {moment.year} {CALENDAR.era}
          </p>
          <p className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>{moment.weekdayName}</p>
        </div>
        <Dato icon={esDeDia ? "fa-sun" : "fa-moon"} label="Hora" valor={hhmm} color={esDeDia ? "var(--color-bronze)" : "var(--color-arcane)"} />
        <Dato icon="fa-cloud-sun-rain" label="Estación" valor={moment.season} color={SEASON_COLOR[moment.season] ?? "var(--color-bronze)"}
          sub={restanEstacion != null ? `${restanEstacion} días` : undefined} />
        <Dato icon={moment.moonIcon} label="Catha" valor={moment.moonPhase} color="var(--color-violet)" />
        {next && (
          <Dato icon="fa-star" label="Próxima fiesta" valor={next.name} color="var(--color-divino)"
            sub={next.falta === 0 ? "¡hoy!" : `en ${next.falta} días`} />
        )}
        {moment.holiday && (
          <span className="font-ui text-[11px] font-bold px-3 py-1 rounded-full"
            style={{ color: "var(--color-ink)", background: "var(--color-divino)" }}>
            <i className="fas fa-star mr-1.5" />Hoy es {moment.holiday}
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-[auto_1fr] gap-8 items-start">
        {/* RUEDA DEL AÑO */}
        <div className="mx-auto">
          <svg viewBox="0 0 360 360" className="w-[320px] h-[320px] sm:w-[360px] sm:h-[360px]" role="img" aria-label="Rueda del año exandrino">
            <defs>
              <radialGradient id="wheelCore">
                <stop offset="0%" stopColor="rgba(255,220,150,0.16)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
            </defs>

            <circle cx={CX} cy={CY} r={R_IN - 4} fill="url(#wheelCore)" />

            {/* Anillo de estaciones */}
            {SEASON_RANGES.map((s) => {
              const a0 = angleOf(s.start);
              const a1 = angleOf(s.start + s.days);
              const color = SEASON_COLOR[s.name] ?? "var(--color-bronze)";
              const esActual = s.name === moment.season;
              const [lx, ly] = pt((a0 + (a1 > a0 ? a1 : a1 + 360)) / 2, (R_SEASON_OUT + R_SEASON_IN) / 2);
              return (
                <g key={s.name}>
                  <path d={arcPath(a0, a1 > a0 ? a1 : a1 + 360, R_SEASON_OUT, R_SEASON_IN)}
                    fill={color} fillOpacity={esActual ? 0.6 : 0.22} stroke="none" />
                  <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                    fontSize={8.5} fontWeight={esActual ? 800 : 600} letterSpacing={0.6}
                    fill={esActual ? "var(--color-parch)" : "var(--color-muted)"}>{s.name.toUpperCase()}</text>
                </g>
              );
            })}

            {/* Meses */}
            {CALENDAR.months.map((name, i) => {
              const a0 = angleOf(STARTS[i]);
              const a1 = angleOf(STARTS[i] + CALENDAR.monthDays[i]);
              const season = seasonOfDay(STARTS[i] + 1);
              const color = SEASON_COLOR[season] ?? "var(--color-bronze)";
              const esActual = i === moment.monthIndex;
              const esSel = i === mesVisto;
              const esHover = i === hover;
              const [lx, ly] = pt((a0 + a1) / 2, (R_OUT + R_IN) / 2);
              return (
                <g key={name} style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                  onClick={() => setSel(i)}>
                  <title>{`${name} · ${CALENDAR.monthDays[i]} días · ${season}`}</title>
                  <path d={arcPath(a0, a1, R_OUT, R_IN)} fill={color}
                    fillOpacity={esHover ? 0.7 : esSel ? 0.5 : 0.18}
                    stroke={esSel ? "var(--color-bronze-bright)" : "var(--color-line)"}
                    strokeWidth={esSel ? 1.6 : 1}>
                    {esActual && <animate attributeName="fillOpacity" values="0.5;0.28;0.5" dur="3.6s" repeatCount="indefinite" />}
                  </path>
                  <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                    fontSize={9.5} fontWeight={esActual || esSel ? 800 : 600}
                    fill={esActual || esSel ? "var(--color-parch)" : "var(--color-warm)"}
                    style={{ pointerEvents: "none" }}>{name.slice(0, 8)}</text>
                </g>
              );
            })}

            {/* Festividades en el aro */}
            {HOLIDAY_DOY.map((h) => {
              const [x, y] = pt(angleOf(h.doy), R_OUT + 6);
              const esHoy = h.doy === hoy;
              return (
                <circle key={h.name} cx={x} cy={y} r={esHoy ? 4.5 : 2.8}
                  fill={esHoy ? "var(--color-divino)" : "var(--color-bronze)"} style={{ cursor: "help" }}>
                  <title>{`${h.name} · ${h.date}`}</title>
                  {esHoy && <animate attributeName="r" values="4.5;7;4.5" dur="1.8s" repeatCount="indefinite" />}
                </circle>
              );
            })}

            {/* Aguja del día actual */}
            {ready && (
              <g style={{ transition: "transform 900ms ease" }} transform={`rotate(${angleOf(hoy)} ${CX} ${CY})`}>
                <line x1={CX} y1={CY} x2={CX} y2={CY - (R_OUT - 4)} stroke="var(--color-bronze-bright)" strokeWidth={2} strokeLinecap="round" />
                <circle cx={CX} cy={CY - (R_OUT - 4)} r={3.5} fill="var(--color-bronze-bright)" />
              </g>
            )}
            <circle cx={CX} cy={CY} r={4} fill="var(--color-bronze)" />

            {/* Centro */}
            <text x={CX} y={CY - 30} textAnchor="middle" fontSize={10} letterSpacing={0.8} fill="var(--color-dim)">{moment.season.toUpperCase()}</text>
            <text x={CX} y={CY + 26} textAnchor="middle" fontSize={15} fontWeight={800} fill="var(--color-parch)">{moment.day} de {moment.monthName}</text>
            <text x={CX} y={CY + 44} textAnchor="middle" fontSize={10.5} fill="var(--color-bronze-bright)">{moment.year} {CALENDAR.era} · {hhmm}</text>
            <text x={CX} y={CY + 62} textAnchor="middle" fontSize={9.5} fill="var(--color-muted)">{moment.moonPhase}</text>
          </svg>
          <p className="text-center font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
            Pulsa un mes para verlo en detalle.
          </p>
        </div>

        {/* VISTA DE MES */}
        <MesDetalle
          mi={mesVisto}
          year={moment.year}
          hoyDoy={hoy}
          esMesActual={mesVisto === moment.monthIndex}
          onReset={sel != null && sel !== moment.monthIndex ? () => setSel(null) : undefined}
        />
      </div>
    </div>
  );
}

function Dato({ icon, label, valor, color, sub }: { icon: string; label: string; valor: string; color: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <i className={`fas ${icon} text-lg`} style={{ color }} />
      <div>
        <p className="eyebrow !text-[9px]">{label}</p>
        <p className="font-ui text-[13px] font-bold" style={{ color: "var(--color-parch)" }}>{valor}</p>
        {sub && <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>{sub}</p>}
      </div>
    </div>
  );
}

// Rejilla de días del mes: semanas de 7, festividades marcadas, día de hoy
// resaltado y la fase de Catha en cada día.
function MesDetalle({ mi, year, hoyDoy, esMesActual, onReset }: {
  mi: number; year: number; hoyDoy: number; esMesActual: boolean; onReset?: () => void;
}) {
  const nombre = CALENDAR.months[mi];
  const { cells: celdas, firstDoy, days: dias } = monthCells(mi, year);
  const season = seasonOfDay(firstDoy + 1);
  const color = SEASON_COLOR[season] ?? "var(--color-bronze)";

  const fiestasMes = HOLIDAY_DOY.filter((h) => h.doy >= firstDoy && h.doy < firstDoy + dias);

  return (
    <div className="panel p-5">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
        <h3 className="font-display text-xl font-extrabold" style={{ color }}>{nombre}</h3>
        <div className="flex items-center gap-2">
          <span className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>{dias} días · {season}</span>
          {onReset && (
            <button onClick={onReset} className="btn-ghost !py-1 !px-2 text-[11px]">
              <i className="fas fa-rotate-left mr-1" />Mes actual
            </button>
          )}
        </div>
      </div>
      {esMesActual && <p className="font-ui text-[11px] mb-3" style={{ color: "var(--color-bronze-bright)" }}><i className="fas fa-circle-dot mr-1" />Estáis en este mes</p>}

      {/* Cabecera de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {CALENDAR.weekdays.map((d) => (
          <div key={d} className="text-center font-ui text-[9px] font-bold uppercase tracking-wide truncate"
            style={{ color: CALENDAR.weekend.includes(d) ? "var(--color-bronze)" : "var(--color-dim)" }} title={d}>
            {d.slice(0, 3)}
          </div>
        ))}
      </div>

      {/* Días */}
      <div className="grid grid-cols-7 gap-1">
        {celdas.map((d, idx) => {
          if (d == null) return <div key={`b${idx}`} />;
          const doy = firstDoy + d - 1;
          const abs = absDayOf(year, doy);
          const esHoy = doy === hoyDoy;
          const finde = isWeekend(abs);
          const fiesta = holidayAt(doy);
          const luna = moonPhaseForDay(abs);
          return (
            <div key={d} title={`${d} de ${nombre}${fiesta ? ` · ${fiesta.name}` : ""} · ${luna.name}`}
              className="aspect-square rounded-md flex flex-col items-center justify-center relative"
              style={{
                background: esHoy ? "var(--color-bronze)" : finde ? "rgba(0,0,0,0.32)" : "rgba(0,0,0,0.18)",
                border: `1px solid ${esHoy ? "var(--color-bronze-bright)" : fiesta ? "var(--color-divino)" : "var(--color-line)"}`,
              }}>
              <span className="font-ui text-[11px] font-bold leading-none"
                style={{ color: esHoy ? "var(--color-ink)" : "var(--color-warm)" }}>{d}</span>
              <i className={`fas ${luna.icon} text-[6px] mt-0.5`}
                style={{ color: esHoy ? "var(--color-ink)" : "var(--color-violet)", opacity: 0.75 }} />
              {fiesta && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-divino)" }} />}
            </div>
          );
        })}
      </div>

      {/* Festividades del mes */}
      <div className="mt-4">
        <p className="eyebrow !text-[9px] mb-2" style={{ color: "var(--color-divino)" }}>Festividades de {nombre}</p>
        {fiestasMes.length === 0 ? (
          <p className="font-ui text-[12px] italic" style={{ color: "var(--color-dim)" }}>Ninguna: mes de trabajo.</p>
        ) : (
          <ul className="space-y-1.5">
            {fiestasMes.map((h) => (
              <li key={h.name} className="panel-raised px-3 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display font-semibold text-[13px]" style={{ color: "var(--color-parch)" }}>{h.name}</span>
                  <span className="font-ui text-[11px] whitespace-nowrap" style={{ color: "var(--color-bronze-bright)" }}>{h.date}</span>
                </div>
                <p style={{ color: "var(--color-muted)", fontSize: "12px", lineHeight: 1.45 }}>{h.blurb}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="font-ui text-[10px] mt-3 flex items-center gap-2 flex-wrap" style={{ color: "var(--color-dim)" }}>
        <span><i className="fas fa-circle mr-1" style={{ color: "var(--color-divino)", fontSize: 6 }} />festividad</span>
        <span><i className="fas fa-moon mr-1" style={{ color: "var(--color-violet)" }} />fase de Catha</span>
        <span>fin de semana: {CALENDAR.weekend.join(" y ")}</span>
      </p>
    </div>
  );
}
