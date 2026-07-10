import type { Metadata } from "next";
import { HISTORY, FACTIONS } from "@/data/taldorei";
import { HISTORY_TIMELINE } from "@/data/history";
import { PRIME_DEITIES, BETRAYER_GODS, LESSER_IDOLS, type Deity } from "@/data/pantheon";
import { CALENDAR, SEASONS, HOLIDAYS, MOONS, PLANES, WORLD_INTRO } from "@/data/cosmology";
import ReinoRegions from "@/components/ReinoRegions";

export const metadata: Metadata = {
  title: "El Mundo",
  description: "Historia, continentes, panteón, calendario y cosmología de Exandria. La campaña transcurre en Tal'Dorei.",
};

function DeityCard({ deity, accent }: { deity: Deity; accent: string }) {
  return (
    <li
      className="panel-raised px-4 py-3.5"
      style={{ borderColor: `color-mix(in srgb, ${accent} 30%, var(--color-line))` }}
    >
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <span className="font-display font-semibold text-[15px]" style={{ color: "var(--color-parch)" }}>
          {deity.name}
        </span>
        <span className="font-ui text-[11px] font-bold uppercase tracking-wide" style={{ color: accent }}>
          {deity.alignment}
        </span>
      </div>
      <p className="font-ui text-[12px] italic mb-2" style={{ color: "var(--color-muted)" }}>{deity.epithet}</p>
      <p style={{ color: "var(--color-muted)", fontSize: "13px", lineHeight: 1.55 }} className="mb-2">{deity.blurb}</p>
      <div className="font-ui text-[11px] mb-2" style={{ color: "var(--color-dim)" }}>
        <p><strong style={{ color: "var(--color-warm)" }}>Esfera:</strong> {deity.province}</p>
        <p><strong style={{ color: "var(--color-warm)" }}>Símbolo:</strong> {deity.symbol}</p>
        {deity.holyDay && (
          <p><strong style={{ color: "var(--color-warm)" }}>Día santo:</strong> {deity.holyDay.name} — {deity.holyDay.date}</p>
        )}
        {deity.patron && (
          <p><strong style={{ color: "var(--color-warm)" }}>Patrón de brujo:</strong> {deity.patron}</p>
        )}
      </div>
      <ul className="list-disc list-inside space-y-0.5">
        {deity.commandments.map((c) => (
          <li key={c} className="font-ui text-[12px]" style={{ color: "var(--color-muted)" }}>{c}</li>
        ))}
      </ul>
    </li>
  );
}

export default function ReinoPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <header className="text-center mb-14 reveal">
        <p className="eyebrow mb-3">Compendio del mundo</p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold gold-text">El Mundo de Exandria</h1>
        <p className="prose-lore lead max-w-2xl mx-auto mt-5">{WORLD_INTRO}</p>
      </header>

      {/* HISTORIA */}
      <section className="mb-20">
        <h2 className="font-display text-2xl font-bold mb-8 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-hourglass-half text-[var(--color-bronze)]" /> Una historia de Exandria
        </h2>
        <ol className="relative border-l-2 border-[var(--color-line)] ml-2 space-y-8">
          {HISTORY.map((e, i) => (
            <li key={i} className="relative pl-8">
              <span className="absolute -left-[11px] top-1 w-5 h-5 rounded-full border-2 border-[var(--color-bronze)] bg-[var(--color-night)]" />
              <p className="eyebrow mb-1" style={{ color: "var(--color-arcane)" }}>{e.year}</p>
              <h3 className="font-display text-lg font-bold mb-1" style={{ color: "var(--color-parch)" }}>{e.title}</h3>
              <p className="prose-lore !text-[15px] !mb-0">{e.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CRONOLOGÍA AMPLIADA */}
      <section className="mb-20">
        <h2 className="font-display text-2xl font-bold mb-2 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-scroll text-[var(--color-bronze)]" /> Cronología ampliada: de la Fundación a la Guerra de la Ceniza y la Luz
        </h2>
        <p className="prose-lore !text-[14px] mb-8" style={{ color: "var(--color-muted)" }}>
          Los mitos compartidos de Exandria y, tras la Divergencia, el rastro detallado de Wildemount: el ascenso del Imperio Dwendaliano, la Dinastía Kryn y la guerra que hoy los enfrenta.
        </p>
        <ol className="relative border-l-2 border-[var(--color-line)] ml-2 space-y-8">
          {HISTORY_TIMELINE.map((e, i) => (
            <li key={i} className="relative pl-8">
              <span className="absolute -left-[11px] top-1 w-5 h-5 rounded-full border-2 border-[var(--color-bronze)] bg-[var(--color-night)]" />
              <div className="flex items-center gap-2 mb-1">
                <p className="eyebrow" style={{ color: "var(--color-arcane)" }}>{e.year}</p>
                {e.continent && (
                  <span className="font-ui text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ color: "var(--color-ember)", border: "1px solid var(--color-ember)" }}>
                    {e.continent}
                  </span>
                )}
              </div>
              <h3 className="font-display text-lg font-bold mb-1" style={{ color: "var(--color-parch)" }}>{e.title}</h3>
              <p className="prose-lore !text-[15px] !mb-0">{e.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* REGIONES (filtradas por exploración) */}
      <ReinoRegions />

      {/* PANTEON */}
      <section className="mb-20">
        <h2 className="font-display text-2xl font-bold mb-8 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-sun text-[var(--color-bronze)]" /> Panteón de Exandria
        </h2>
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <div>
            <p className="eyebrow mb-4" style={{ color: "var(--color-divino)" }}>Deidades primarias</p>
            <ul className="space-y-3">
              {PRIME_DEITIES.map((d) => (
                <DeityCard key={d.slug} deity={d} accent="var(--color-divino)" />
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-4" style={{ color: "var(--color-ember)" }}>Dioses traidores</p>
            <ul className="space-y-3">
              {BETRAYER_GODS.map((d) => (
                <DeityCard key={d.slug} deity={d} accent="var(--color-ember)" />
              ))}
            </ul>
          </div>
        </div>
        <div>
          <p className="eyebrow mb-4" style={{ color: "var(--color-violet)" }}>Ídolos menores</p>
          <ul className="grid md:grid-cols-2 gap-3">
            {LESSER_IDOLS.map((d) => (
              <DeityCard key={d.slug} deity={d} accent="var(--color-violet)" />
            ))}
          </ul>
        </div>
      </section>

      {/* FACCIONES */}
      <section className="mb-20">
        <h2 className="font-display text-2xl font-bold mb-8 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-flag text-[var(--color-bronze)]" /> Facciones y sociedades
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FACTIONS.map((f) => (
            <div key={f.name} className="panel p-5" style={{ borderColor: "var(--color-line)" }}>
              <h3 className="font-display font-bold text-[15px] mb-1.5" style={{ color: "var(--color-bronze-bright)" }}>{f.name}</h3>
              <p style={{ color: "var(--color-muted)", fontSize: "14px", lineHeight: 1.55 }}>{f.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CALENDARIO */}
      <section className="mb-20">
        <h2 className="font-display text-2xl font-bold mb-8 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-calendar-days text-[var(--color-bronze)]" /> El calendario de Exandria
        </h2>
        <div className="grid md:grid-cols-[1fr_1fr] gap-8">
          <div className="panel p-6">
            <p className="prose-lore !text-[15px] !mb-4">
              El año exandrino dura <strong>{CALENDAR.yearDays} días</strong> en <strong>{CALENDAR.months.length} meses</strong>. Los años se cuentan desde la Divergencia, en formato <strong>{CALENDAR.era}</strong> (Post-Divergencia). La campaña transcurre hacia el año <strong>{CALENDAR.currentYear} {CALENDAR.era}</strong>.
            </p>
            <p className="eyebrow mb-2" style={{ color: "var(--color-divino)" }}>Los meses</p>
            <div className="flex flex-wrap gap-1.5 mb-5">
              {CALENDAR.months.map((m) => (
                <span key={m} className="font-ui text-[12px] font-semibold px-2.5 py-1 rounded-lg" style={{ color: "var(--color-warm)", background: "rgba(0,0,0,0.25)", border: "1px solid var(--color-line)" }}>{m}</span>
              ))}
            </div>
            <p className="eyebrow mb-2" style={{ color: "var(--color-divino)" }}>La semana (7 días)</p>
            <div className="flex flex-wrap gap-1.5">
              {CALENDAR.weekdays.map((d) => (
                <span key={d} className="font-ui text-[12px] font-semibold px-2.5 py-1 rounded-lg" style={{ color: CALENDAR.weekend.includes(d) ? "var(--color-bronze-bright)" : "var(--color-muted)", background: "rgba(0,0,0,0.25)", border: `1px solid ${CALENDAR.weekend.includes(d) ? "var(--color-bronze)" : "var(--color-line)"}` }}>{d}</span>
              ))}
            </div>
            <p className="font-ui text-[11px] mt-2" style={{ color: "var(--color-dim)" }}>Yulisen y Da'leysen forman el fin de semana.</p>
          </div>
          <div>
            <p className="eyebrow mb-3" style={{ color: "var(--color-divino)" }}>Festividades</p>
            <ul className="space-y-2">
              {HOLIDAYS.map((h) => (
                <li key={h.name} className="panel-raised px-4 py-3">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="font-display font-semibold text-[15px]" style={{ color: "var(--color-parch)" }}>{h.name}</span>
                    <span className="font-ui text-[11px] whitespace-nowrap" style={{ color: "var(--color-bronze-bright)" }}>{h.date}</span>
                  </div>
                  <p style={{ color: "var(--color-muted)", fontSize: "13px", lineHeight: 1.5 }}>{h.blurb}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ESTACIONES */}
      <section className="mb-20">
        <h2 className="font-display text-2xl font-bold mb-8 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-cloud-sun-rain text-[var(--color-bronze)]" /> Las estaciones
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SEASONS.map((s) => (
            <div key={s.name} className="panel p-5">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-display font-bold text-[16px]" style={{ color: "var(--color-bronze-bright)" }}>{s.name}</h3>
                <span className="font-ui text-[12px] font-bold" style={{ color: "var(--color-arcane)" }}>{s.days} días</span>
              </div>
              <p className="font-ui text-[11px] mb-2" style={{ color: "var(--color-dim)" }}>Empieza: {s.start}</p>
              <p style={{ color: "var(--color-muted)", fontSize: "13px", lineHeight: 1.5 }}>{s.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LUNAS Y PLANOS */}
      <section>
        <h2 className="font-display text-2xl font-bold mb-8 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-moon text-[var(--color-bronze)]" /> Lunas y planos
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="eyebrow mb-4" style={{ color: "var(--color-violet)" }}>Las dos lunas</p>
            <ul className="space-y-3">
              {MOONS.map((m) => (
                <li key={m.name} className="panel-raised px-4 py-3">
                  <p className="font-display font-semibold text-[15px] mb-1" style={{ color: "var(--color-parch)" }}>{m.name}</p>
                  <p style={{ color: "var(--color-muted)", fontSize: "13px", lineHeight: 1.5 }}>{m.blurb}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-4" style={{ color: "var(--color-arcane)" }}>Planos de existencia</p>
            <ul className="space-y-2">
              {PLANES.map((p) => (
                <li key={p.name} className="panel-raised px-4 py-2.5">
                  <p className="font-display font-semibold text-[14px]" style={{ color: "var(--color-parch)" }}>{p.name}</p>
                  <p style={{ color: "var(--color-muted)", fontSize: "13px", lineHeight: 1.45 }}>{p.blurb}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
