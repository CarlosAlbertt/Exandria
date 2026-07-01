import Link from "next/link";
import Emblem from "@/components/Emblem";
import { CONTINENT, REGIONS } from "@/data/taldorei";
import { CLASSES } from "@/data/classes";
import { SPECIES } from "@/data/species";

export default function HomePage() {
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center reveal">
          <div className="flex justify-center mb-6"><Emblem size={92} /></div>
          <p className="eyebrow mb-5">Escenario de campaña · Exandria</p>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold gold-text leading-[0.95] mb-6">
            Tal'Dorei
          </h1>
          <p className="prose-lore lead max-w-2xl mx-auto !mb-8">
            Forja tu héroe, descubre el lore del continente y prepárate para la
            próxima campaña de Dungeons &amp; Dragons.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/crear" className="btn-gold"><i className="fas fa-hat-wizard mr-2" />Crear personaje</Link>
            <Link href="/reino" className="btn-ghost"><i className="fas fa-scroll mr-2" />Explorar el reino</Link>
          </div>
        </div>
      </section>

      {/* INTRO CONTINENTE */}
      <section className="max-w-3xl mx-auto px-6 py-10 text-center">
        <p className="prose-lore">{CONTINENT.intro}</p>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: "fa-dice-d20", href: "/crear", title: "Creador de personaje", text: `${SPECIES.length} especies, ${CLASSES.length} clases, trasfondos, aptitudes y pericias del reglamento 2024.`, accent: "var(--color-arcane)" },
            { icon: "fa-book-open", href: "/reino", title: "Lore del reino", text: "Historia, regiones, panteón y facciones del continente de Tal'Dorei.", accent: "var(--color-bronze)" },
            { icon: "fa-map-location-dot", href: "/mapa", title: "Mapa interactivo", text: "Recorre las ocho grandes regiones y sus enclaves clave.", accent: "var(--color-primitivo)" },
          ].map((c) => (
            <Link key={c.title} href={c.href} className="pick-card p-7 block" style={{ ["--accent" as string]: c.accent, ["--glow" as string]: "rgba(69,199,189,0.3)" }}>
              <i className={`fas ${c.icon} text-3xl mb-4`} style={{ color: c.accent }} />
              <h3 className="font-display text-xl font-bold mb-2" style={{ color: "var(--color-parch)" }}>{c.title}</h3>
              <p style={{ color: "var(--color-muted)", fontSize: "15px", lineHeight: 1.6 }}>{c.text}</p>
              <span className="mt-4 inline-flex items-center gap-2 font-ui text-[12px] font-bold tracking-wide" style={{ color: c.accent }}>
                Entrar <i className="fas fa-arrow-right-long" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* REGIONES PREVIEW */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="text-center mb-10">
          <p className="eyebrow mb-3">El Atlas</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold gold-text">Las tierras de Tal'Dorei</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {REGIONS.map((r) => (
            <Link key={r.slug} href="/mapa" className="panel p-5 hover:border-[var(--color-bronze)] transition-colors group" style={{ borderColor: "var(--color-line)" }}>
              <span className="inline-block w-2.5 h-2.5 rounded-full mb-3" style={{ background: r.accent, boxShadow: `0 0 10px ${r.accent}` }} />
              <p className="font-display font-bold text-[15px] mb-1" style={{ color: "var(--color-parch)" }}>{r.name}</p>
              <p className="font-ui text-[11px] font-semibold tracking-wide" style={{ color: "var(--color-dim)" }}>
                <i className="fas fa-location-dot mr-1" />{r.capital}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
