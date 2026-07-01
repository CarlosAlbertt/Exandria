import type { Metadata } from "next";
import { CONTINENT, HISTORY, PANTHEON, FACTIONS } from "@/data/taldorei";
import ReinoRegions from "@/components/ReinoRegions";

export const metadata: Metadata = {
  title: "El Reino",
  description: "Historia, regiones, panteón y facciones del continente de Tal'Dorei.",
};

export default function ReinoPage() {
  const primarias = PANTHEON.filter((d) => d.side === "Primaria");
  const traidores = PANTHEON.filter((d) => d.side === "Traidor");

  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <header className="text-center mb-14 reveal">
        <p className="eyebrow mb-3">Compendio del continente</p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold gold-text">El Reino de Tal'Dorei</h1>
        <p className="prose-lore lead max-w-2xl mx-auto mt-5">{CONTINENT.intro}</p>
      </header>

      {/* HISTORIA */}
      <section className="mb-20">
        <h2 className="font-display text-2xl font-bold mb-8 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-hourglass-half text-[var(--color-bronze)]" /> Una historia de Tal'Dorei
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

      {/* REGIONES (filtradas por exploración) */}
      <ReinoRegions />

      {/* PANTEON */}
      <section className="mb-20">
        <h2 className="font-display text-2xl font-bold mb-8 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-sun text-[var(--color-bronze)]" /> Panteón de Exandria
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="eyebrow mb-4" style={{ color: "var(--color-divino)" }}>Deidades primarias</p>
            <ul className="space-y-2">
              {primarias.map((d) => (
                <li key={d.name} className="panel-raised px-4 py-3 flex items-center justify-between">
                  <span className="font-display font-semibold text-[15px]" style={{ color: "var(--color-parch)" }}>{d.name}</span>
                  <span className="font-ui text-[12px]" style={{ color: "var(--color-muted)" }}>{d.domain}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-4" style={{ color: "var(--color-ember)" }}>Dioses traidores</p>
            <ul className="space-y-2">
              {traidores.map((d) => (
                <li key={d.name} className="panel-raised px-4 py-3 flex items-center justify-between" style={{ borderColor: "color-mix(in srgb, var(--color-ember) 30%, var(--color-line))" }}>
                  <span className="font-display font-semibold text-[15px]" style={{ color: "var(--color-parch)" }}>{d.name}</span>
                  <span className="font-ui text-[12px]" style={{ color: "var(--color-muted)" }}>{d.domain}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FACCIONES */}
      <section>
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
    </main>
  );
}
