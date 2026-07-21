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
// la página: cabecera · `ReinoRegions` (las puertas a la página de cada
// continente) · `CalamidadSection` (el relato de la Calamidad, abierto a todo
// el mundo, con su detalle gateado) · `SaberBrowser` (el resto del saber, por
// lugar y categoría) · el calendario y las lunas.
//
// `ReinoRegions` va ARRIBA a propósito: es el índice de las páginas por
// continente, y enterrado bajo la Calamidad y los seis bloques del saber no lo
// encontraba nadie (lo reportó el usuario el 2026-07-21).
export default function ReinoPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <header className="text-center mb-14 reveal">
        <p className="eyebrow mb-3">Compendio del mundo</p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold gold-text">El Mundo de Exandria</h1>
        <p className="prose-lore lead max-w-2xl mx-auto mt-5">{WORLD_INTRO}</p>
      </header>

      {/* LAS TIERRAS — puerta a la página de lore de cada continente */}
      <ReinoRegions />

      {/* EXANDRIA Y LA CALAMIDAD — relato abierto + detalle gateado */}
      <CalamidadSection />

      {/* SABER DEL MUNDO — por lugar y categoría */}
      <SaberBrowser />

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
