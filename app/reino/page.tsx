import type { Metadata } from "next";
import { MOONS, HOLIDAYS, WORLD_INTRO } from "@/data/cosmology";
import { HISTORIA_BREVE } from "@/data/loreTiers";
import ReinoRegions from "@/components/ReinoRegions";
import SaberSection from "@/components/SaberSection";
import CalendarWheel from "@/components/reino/CalendarWheel";

export const metadata: Metadata = {
  title: "El Mundo de Exandria",
  description: "Compendio del mundo: lo que tu personaje sabe, y lo que le queda por descubrir.",
};

// /reino ya NO es un volcado de lore. Lo que se sabe del mundo depende del
// personaje (origen, fe, clase, pericias y lo aprendido jugando) y vive en
// `SaberSection`; aquí solo quedan las cosas que cualquiera sabría: una
// historia breve, la geografía a la vista, el calendario y las lunas.
// El detalle —eras, cronología, panteón, facciones, Wildemount, planos— se
// deriva a `data/saber.ts` y se descubre poco a poco.
export default function ReinoPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <header className="text-center mb-14 reveal">
        <p className="eyebrow mb-3">Compendio del mundo</p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold gold-text">El Mundo de Exandria</h1>
        <p className="prose-lore lead max-w-2xl mx-auto mt-5">{WORLD_INTRO}</p>
      </header>

      {/* HISTORIA BREVE — lo que cualquiera sabe */}
      <section className="mb-20">
        <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-hourglass-half text-[var(--color-bronze)]" /> Lo que todo el mundo sabe
        </h2>
        <div className="panel p-6 space-y-3 max-w-3xl">
          {HISTORIA_BREVE.map((p, i) => (
            <p key={i} className="prose-lore !text-[15px] !mb-0">{p}</p>
          ))}
          <p className="font-ui text-[12px] pt-2 italic" style={{ color: "var(--color-dim)" }}>
            <i className="fas fa-circle-info mr-1.5" />
            Lo demás —las eras, el panteón, las facciones, otras tierras— no se sabe por nacer: se estudia, se viaja o se descubre jugando.
          </p>
        </div>
      </section>

      {/* SABER DEL MUNDO — lo que TU personaje sabe */}
      <SaberSection />

      {/* GEOGRAFÍA A LA VISTA */}
      <ReinoRegions />

      {/* CALENDARIO */}
      <section className="mb-20">
        <h2 className="font-display text-2xl font-bold mb-8 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-calendar-days text-[var(--color-bronze)]" /> El calendario
        </h2>
        <CalendarWheel />

        <p className="eyebrow mb-3 mt-8" style={{ color: "var(--color-divino)" }}>Festividades</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {HOLIDAYS.map((h) => (
            <div key={h.name} className="panel-raised px-3 py-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display font-semibold text-[14px]" style={{ color: "var(--color-parch)" }}>{h.name}</span>
                <span className="font-ui text-[11px] whitespace-nowrap" style={{ color: "var(--color-bronze-bright)" }}>{h.date}</span>
              </div>
              <p style={{ color: "var(--color-muted)", fontSize: "12px", lineHeight: 1.45 }}>{h.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LUNAS — se ven desde cualquier parte */}
      <section>
        <h2 className="font-display text-2xl font-bold mb-8 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-moon text-[var(--color-bronze)]" /> Las dos lunas
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {MOONS.map((m) => (
            <div key={m.name} className="panel-raised px-4 py-3">
              <p className="font-display font-semibold text-[15px] mb-1" style={{ color: "var(--color-parch)" }}>{m.name}</p>
              <p style={{ color: "var(--color-muted)", fontSize: "13px", lineHeight: 1.5 }}>{m.blurb}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
