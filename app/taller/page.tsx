"use client";

import { useState } from "react";
import { useSession } from "@/components/SessionProvider";
import Caldero from "@/components/taller/Caldero";
import { OFICIOS_ORDEN, OFICIO_LABEL, type Oficio } from "@/lib/materiales";

/**
 * El taller de oficios. **Una ruta con pestañas**, no una ruta por oficio: así
 * abrir la forja mañana no vuelve a pasar por `lib/acceso.ts` ni por el nav.
 *
 * Cada oficio tiene (o tendrá) su propia interfaz, no una pantalla genérica de
 * «fabricar»: el caldero de alquimia no se parece al yunque ni al alambique.
 * Hoy solo alquimia está construida; las otras cinco dicen que aún no, en vez
 * de esconderse — que estén ahí es lo que cuenta que el oficio existe.
 */

const ICONO: Record<Oficio, string> = {
  alquimia: "fa-flask",
  cocina: "fa-drumstick-bite",
  forja: "fa-hammer",
  destilacion: "fa-wine-bottle",
  cristalografia: "fa-gem",
  tatuaje: "fa-pen-nib",
};

/** Lo que será cada taller cuando le toque. Es la promesa, no una descripción. */
const PROMESA: Record<Oficio, string> = {
  alquimia: "El caldero y el libro de recetas.",
  cocina: "Los fuegos y las ollas.",
  forja: "El yunque, el martillo y el temple.",
  destilacion: "El alambique y sus riesgos.",
  cristalografia: "El tallado, los cinceles y las pinzas.",
  tatuaje: "La plantilla, las agujas y la tinta.",
};

export default function TallerPage() {
  const session = useSession();
  const [oficio, setOficio] = useState<Oficio>("alquimia");

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <header className="text-center mb-8 reveal">
        <p className="eyebrow mb-3">Oficios de Exandria</p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold gold-text">El taller</h1>
        <p className="font-ui text-[12px] mt-3" style={{ color: "var(--color-dim)" }}>
          Lo que sabes preparar con tus propias manos.
        </p>
      </header>

      {/* Las seis pestañas. Se pintan todas aunque solo una funcione: esconder
          las que faltan haría creer que el personaje tiene menos oficios. */}
      <div className="panel p-3 mb-8 flex flex-wrap gap-2 justify-center">
        {OFICIOS_ORDEN.map((o) => (
          <button
            key={o}
            onClick={() => setOficio(o)}
            className="chip"
            data-on={oficio === o}
            title={PROMESA[o]}
          >
            <i className={`fas ${ICONO[o]} mr-1.5`} />
            {OFICIO_LABEL[o]}
          </button>
        ))}
      </div>

      {oficio === "alquimia" ? (
        <Caldero userId={session?.id ?? null} />
      ) : (
        <div className="panel-raised p-10 text-center">
          <i className={`fas ${ICONO[oficio]} text-3xl mb-4 block`} style={{ color: "var(--color-dim)" }} />
          <h2 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--color-bronze-bright)" }}>
            {OFICIO_LABEL[oficio]}
          </h2>
          <p className="font-ui text-[13px]" style={{ color: "var(--color-muted)" }}>
            {PROMESA[oficio]} Este taller se abrirá más adelante.
          </p>
        </div>
      )}
    </main>
  );
}
