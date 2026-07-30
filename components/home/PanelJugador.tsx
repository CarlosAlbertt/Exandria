import Link from "next/link";
import Emblem from "@/components/Emblem";
import { WORLD_INTRO } from "@/data/cosmology";
// Las puertas viven en lib/acceso.ts, junto a la lista de rutas permitidas:
// son fijas (no se consulta si el jugador ya tiene ficha para esconder «Crear
// personaje») y el gate comprueba que ninguna lleve a sección cerrada.
import { PUERTAS_JUGADOR } from "@/lib/acceso";

export default function PanelJugador() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-10 text-center reveal">
          <div className="flex justify-center mb-6"><Emblem size={92} /></div>
          <p className="eyebrow mb-5">Escenario de campaña · Exandria</p>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold gold-text leading-[0.95] mb-6">
            Exandria
          </h1>
          <p className="prose-lore lead max-w-2xl mx-auto">{WORLD_INTRO}</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-2 gap-5">
          {PUERTAS_JUGADOR.map((c) => (
            <Link key={c.href} href={c.href} className="pick-card p-7 block"
              style={{ ["--accent" as string]: c.accent, ["--glow" as string]: "rgba(69,199,189,0.3)" }}>
              <i className={`fas ${c.icon} text-3xl mb-4`} style={{ color: c.accent }} />
              <h3 className="font-display text-xl font-bold mb-2" style={{ color: "var(--color-parch)" }}>{c.label}</h3>
              <p style={{ color: "var(--color-muted)", fontSize: "15px", lineHeight: 1.6 }}>{c.text}</p>
              <span className="mt-4 inline-flex items-center gap-2 font-ui text-[12px] font-bold tracking-wide" style={{ color: c.accent }}>
                Entrar <i className="fas fa-arrow-right-long" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
