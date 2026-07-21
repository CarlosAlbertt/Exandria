import type { Metadata } from "next";
import { WORLD_INTRO } from "@/data/cosmology";
import ReinoRegions from "@/components/ReinoRegions";
import SaberBrowser from "@/components/reino/SaberBrowser";
import CalamidadSection from "@/components/reino/CalamidadSection";
import CalendarWheel from "@/components/reino/CalendarWheel";

export const metadata: Metadata = {
  title: "El Mundo de Exandria",
  description: "Compendio del mundo: lo que tu personaje sabe, y lo que le queda por descubrir.",
};

// /reino ya NO es un volcado de lore. Lo que se sabe del mundo depende del
// personaje (origen, fe, clase, pericias y lo aprendido jugando). El orden de
// la página: cabecera · `CalamidadSection` (el relato de la Calamidad, abierto
// a todo el mundo, con su detalle gateado por pericia o descubrimiento) ·
// `SaberBrowser` (el resto del saber, agrupado por lugar y, dentro, por
// categoría) · la geografía a la vista · el calendario y las lunas.
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

      {/* EXANDRIA Y LA CALAMIDAD — relato abierto + detalle gateado */}
      <CalamidadSection />

      {/* SABER DEL MUNDO — por lugar y categoría */}
      <SaberBrowser />

      {/* GEOGRAFÍA A LA VISTA */}
      <ReinoRegions />

      {/* CALENDARIO */}
      <section className="mb-20">
        <h2 className="font-display text-2xl font-bold mb-8 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-calendar-days text-[var(--color-bronze)]" /> El calendario
        </h2>
        <CalendarWheel />
      </section>
    </main>
  );
}
