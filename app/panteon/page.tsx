import type { Metadata } from "next";
import PanteonBrowser from "@/components/panteon/PanteonBrowser";

export const metadata: Metadata = {
  title: "El Panteón de Exandria",
  description: "Los dioses de Exandria: Primarios, Traidores e Ídolos Menores, con sus esferas, símbolos y preceptos.",
};

// A diferencia de /reino, esta página NO va gateada por el saber: que los
// dioses existen y cómo se llaman no es secreto en Exandria. Es un catálogo de
// consulta, decidido así con el usuario (spec del 2026-07-21).
export default function PanteonPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <header className="text-center mb-14 reveal">
        <p className="eyebrow mb-3">Compendio del mundo</p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold gold-text">El Panteón</h1>
        <p className="prose-lore lead max-w-2xl mx-auto mt-5">
          Treinta y dos nombres. Doce que defendieron el mundo, nueve que lo vendieron y once que
          nunca tuvieron trono pero siguen repartiendo poder. Tras la Divergencia ninguno puede pisar
          Exandria: solo hablan a través de quien les reza.
        </p>
      </header>
      <PanteonBrowser />
    </main>
  );
}
