import Link from "next/link";
import Emblem from "@/components/Emblem";
import { WORLD_INTRO } from "@/data/cosmology";
import { WORLD_POIS } from "@/data/world";
import { CLASSES } from "@/data/classes";
import { SPECIES } from "@/data/species";

const CONTINENTES = WORLD_POIS.filter((p) => p.type === "continente");

export default function HomePage() {
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center reveal">
          <div className="flex justify-center mb-6"><Emblem size={92} /></div>
          <p className="eyebrow mb-5">Escenario de campaña · Exandria</p>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold gold-text leading-[0.95] mb-6">
            Exandria
          </h1>
          <p className="prose-lore lead max-w-2xl mx-auto !mb-8">
            Forja tu héroe, descubre el lore del mundo y prepárate para la
            próxima campaña de Dungeons &amp; Dragons.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/crear" className="btn-gold"><i className="fas fa-hat-wizard mr-2" />Crear personaje</Link>
            <Link href="/reino" className="btn-ghost"><i className="fas fa-scroll mr-2" />Explorar el reino</Link>
          </div>
        </div>
      </section>

      {/* INTRO MUNDO */}
      <section className="max-w-3xl mx-auto px-6 py-10 text-center">
        <p className="prose-lore">{WORLD_INTRO}</p>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: "fa-dice-d20", href: "/crear", title: "Creador de personaje", text: `${SPECIES.length} especies, ${CLASSES.length} clases, trasfondos, aptitudes y pericias del reglamento 2024.`, accent: "var(--color-arcane)" },
            { icon: "fa-book-open", href: "/reino", title: "Lore del mundo", text: "Historia, continentes, panteón y cosmología de Exandria.", accent: "var(--color-bronze)" },
            { icon: "fa-map-location-dot", href: "/mapa", title: "Mapa interactivo", text: "Recorre los continentes de Exandria y sus enclaves clave.", accent: "var(--color-primitivo)" },
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

      {/* CONTINENTES DE EXANDRIA */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="text-center mb-10">
          <p className="eyebrow mb-3">El Atlas</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold gold-text">Las tierras de Exandria</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CONTINENTES.map((c) => (
            <Link key={c.name} href="/mapa" className="panel p-5 hover:border-[var(--color-bronze)] transition-colors group" style={{ borderColor: "var(--color-line)" }}>
              <span className="inline-block w-2.5 h-2.5 rounded-full mb-3" style={{ background: "var(--color-bronze)", boxShadow: "0 0 10px var(--color-bronze)" }} />
              <p className="font-display font-bold text-[15px] mb-1" style={{ color: "var(--color-parch)" }}>
                <i className="fas fa-earth-americas mr-1.5" style={{ color: "var(--color-bronze)" }} />{c.name}
              </p>
              <p className="font-ui text-[12px]" style={{ color: "var(--color-muted)", lineHeight: 1.5 }}>{c.blurb}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
