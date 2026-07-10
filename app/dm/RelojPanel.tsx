"use client";

import { useState } from "react";
import { useGameClock, setClockRunning, advanceGame, setGameDateTime } from "@/lib/useGameClock";
import { momentFromGameMin, gameMinFromMoment } from "@/lib/gameClock";
import { CALENDAR } from "@/data/cosmology";
import ClockWidget from "@/components/ClockWidget";

const inputCls =
  "w-full bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors";

// Pestaña DM "Tiempo": reloj de campaña grande + controles para pausar/
// reanudar, avanzar el tiempo (descansos, días) y fijar una fecha/hora
// concreta. Las mutaciones ya están protegidas por la RLS de app_config
// (solo el DM escribe); este panel solo vive bajo /dm.
export default function RelojPanel() {
  const { clock, nowGameMin, ready } = useGameClock();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Formulario "Fijar fecha/hora", precargado desde el momento actual la
  // primera vez que el reloj está listo.
  const [initialized, setInitialized] = useState(false);
  const [year, setYear] = useState(CALENDAR.currentYear);
  const [monthIndex, setMonthIndex] = useState(0);
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);

  // Precarga el formulario con el momento actual la primera vez que el
  // reloj está listo. Ajuste durante el render (no en un efecto), mismo
  // patrón que NotasDmSection en EncuentrosPanel.tsx: se detiene sola tras
  // la primera vez gracias a `initialized`.
  if (ready && !initialized) {
    const m = momentFromGameMin(nowGameMin);
    setInitialized(true);
    setYear(m.year);
    setMonthIndex(m.monthIndex);
    setDay(m.day);
    setHour(m.hour);
    setMinute(m.minute);
  }

  const maxDay = CALENDAR.monthDays[monthIndex] ?? 30;

  function handleMonthChange(newMonthIndex: number) {
    setMonthIndex(newMonthIndex);
    setDay((d) => Math.min(d, CALENDAR.monthDays[newMonthIndex] ?? d));
  }

  async function run(mutation: () => Promise<{ error: string | null }>) {
    if (busy) return;
    setBusy(true);
    setErr(null);
    const { error } = await mutation();
    if (error) setErr(error);
    setBusy(false);
  }

  const running = !!clock?.running;

  return (
    <div className="space-y-6">
      <ClockWidget />

      {/* PLAY / PAUSA */}
      <section className="panel p-5">
        <p className="eyebrow mb-3">
          <i className="fas fa-hourglass-half mr-1.5" style={{ color: "var(--color-bronze)" }} />
          Control del reloj
        </p>
        <button
          className="btn-gold"
          onClick={() => run(() => setClockRunning(!running))}
          disabled={busy || !ready}
        >
          <i className={`fas ${running ? "fa-pause" : "fa-play"} mr-2`} />
          {running ? "Pausar" : "Reanudar"}
        </button>
      </section>

      {/* AVANCE RÁPIDO */}
      <section className="panel p-5">
        <p className="eyebrow mb-3">
          <i className="fas fa-forward mr-1.5" style={{ color: "var(--color-bronze)" }} />
          Avanzar el tiempo
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={() => run(() => advanceGame(60))} disabled={busy || !ready}>
            <i className="fas fa-clock mr-1.5" />+1 hora
          </button>
          <button className="btn-ghost" onClick={() => run(() => advanceGame(60))} disabled={busy || !ready}>
            <i className="fas fa-bed mr-1.5" />Descanso corto (1 h)
          </button>
          <button className="btn-ghost" onClick={() => run(() => advanceGame(480))} disabled={busy || !ready}>
            <i className="fas fa-campground mr-1.5" />Descanso largo (8 h)
          </button>
          <button className="btn-ghost" onClick={() => run(() => advanceGame(1440))} disabled={busy || !ready}>
            <i className="fas fa-calendar-plus mr-1.5" />+1 día
          </button>
        </div>
      </section>

      {/* FIJAR FECHA/HORA */}
      <section className="panel p-5">
        <p className="eyebrow mb-3">
          <i className="fas fa-calendar-day mr-1.5" style={{ color: "var(--color-bronze)" }} />
          Fijar fecha y hora
        </p>
        <div className="grid sm:grid-cols-[1fr_100px_90px_80px_80px] gap-2 items-end mb-3">
          <div>
            <label className="eyebrow !text-[9px] block mb-1">Mes</label>
            <select
              value={monthIndex}
              onChange={(e) => handleMonthChange(Number(e.target.value))}
              className={inputCls}
              style={{ color: "var(--color-warm)" }}
            >
              {CALENDAR.months.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="eyebrow !text-[9px] block mb-1">Día</label>
            <select
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className={inputCls}
              style={{ color: "var(--color-warm)" }}
            >
              {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="eyebrow !text-[9px] block mb-1">Año</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value) || 0)}
              className={inputCls}
              style={{ color: "var(--color-warm)" }}
            />
          </div>
          <div>
            <label className="eyebrow !text-[9px] block mb-1">Hora</label>
            <input
              type="number"
              min={0}
              max={23}
              value={hour}
              onChange={(e) => setHour(Math.min(23, Math.max(0, Number(e.target.value) || 0)))}
              className={inputCls}
              style={{ color: "var(--color-warm)" }}
            />
          </div>
          <div>
            <label className="eyebrow !text-[9px] block mb-1">Minuto</label>
            <input
              type="number"
              min={0}
              max={59}
              value={minute}
              onChange={(e) => setMinute(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
              className={inputCls}
              style={{ color: "var(--color-warm)" }}
            />
          </div>
        </div>
        <button
          className="btn-gold"
          onClick={() => run(() => setGameDateTime(gameMinFromMoment(year, monthIndex, day, hour, minute)))}
          disabled={busy || !ready}
        >
          <i className="fas fa-check mr-2" />Fijar
        </button>
      </section>

      {err && <p className="text-[13px] italic" style={{ color: "var(--color-ember)" }}>{err}</p>}
    </div>
  );
}
