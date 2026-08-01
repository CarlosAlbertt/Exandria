"use client";

import { useState } from "react";
import { useSession, useRole } from "@/components/SessionProvider";
import Caldero from "@/components/taller/Caldero";
import { OFICIOS_ORDEN, OFICIO_LABEL, type Oficio } from "@/lib/materiales";
import { modDmValido, MOD_DM_MIN, MOD_DM_MAX, type ModoDm } from "@/lib/tallerDm";
import { fmtMod } from "@/data/rules";

/**
 * El taller de oficios. **Una ruta con pestañas**, no una ruta por oficio: así
 * abrir la forja mañana no vuelve a pasar por `lib/acceso.ts` ni por el nav.
 *
 * Cada oficio tiene (o tendrá) su propia interfaz, no una pantalla genérica de
 * «fabricar»: el caldero de alquimia no se parece al yunque ni al alambique.
 * Hoy solo alquimia está construida; las otras cinco dicen que aún no, en vez
 * de esconderse — que estén ahí es lo que cuenta que el oficio existe.
 *
 * **La caja de arena del DM vive AQUÍ, no dentro del caldero.** El máster no
 * tiene ficha, así que el caldero lo paraba en su primera puerta y alquimia
 * estuvo tres tandas desplegada sin que nadie pudiera mirarla. Poniéndola en la
 * cáscara, cada taller nuevo la hereda: si naciera dentro de cada oficio, el
 * siguiente nacería otra vez invisible.
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
  const role = useRole();
  const esDm = role === "dm";
  const [oficio, setOficio] = useState<Oficio>("alquimia");
  // Encendida de entrada para el DM: si tuviera que buscar el interruptor cada
  // vez, seguiría chocándose con «no tienes un personaje en juego». La puede
  // apagar para ver el taller tal y como lo ve la mesa.
  const [arena, setArena] = useState(true);
  const [mod, setMod] = useState(0);

  const dm: ModoDm | null = esDm && arena ? { mod: modDmValido(mod) } : null;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <header className="text-center mb-8 reveal">
        <p className="eyebrow mb-3">Oficios de Exandria</p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold gold-text">El taller</h1>
        <p className="font-ui text-[12px] mt-3" style={{ color: "var(--color-dim)" }}>
          {dm
            ? "Caja de arena: todas las recetas, materiales de sobra y nada que se guarde."
            : "Lo que sabes preparar con tus propias manos."}
        </p>
      </header>

      {/* La caja de arena solo existe para el DM, y se dice lo que hace: un modo
          que cambia lo que ves sin decirlo se acaba confundiendo con un fallo. */}
      {esDm && (
        <div className="panel p-3 mb-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <label className="flex items-center gap-2 font-ui text-[12px] cursor-pointer" style={{ color: "var(--color-warm)" }}>
            <input type="checkbox" checked={arena} onChange={(e) => setArena(e.target.checked)} />
            <i className="fas fa-flask-vial" style={{ color: "var(--color-arcane-bright)" }} />
            Caja de arena del DM
          </label>

          {arena ? (
            <label className="flex items-center gap-2 font-ui text-[12px]" style={{ color: "var(--color-muted)" }}>
              Tiras con
              <input
                type="number"
                value={mod}
                min={MOD_DM_MIN}
                max={MOD_DM_MAX}
                onChange={(e) => setMod(modDmValido(Number(e.target.value)))}
                className="w-16 bg-[var(--color-night)] rounded-lg px-2 py-1 font-ui text-[13px] text-center outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
                style={{ color: "var(--color-warm)" }}
              />
              <span style={{ color: "var(--color-dim)" }}>
                ({fmtMod(modDmValido(mod))}, sin ficha de la que sacarlo)
              </span>
            </label>
          ) : (
            <span className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>
              Apagada: ves el taller como lo ve un jugador, con tu ficha si la tienes.
            </span>
          )}
        </div>
      )}

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
        <Caldero userId={session?.id ?? null} dm={dm} />
      ) : (
        <div className="panel-raised p-10 text-center">
          <i className={`fas ${ICONO[oficio]} text-3xl mb-4 block`} style={{ color: "var(--color-dim)" }} />
          <h2 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--color-bronze-bright)" }}>
            {OFICIO_LABEL[oficio]}
          </h2>
          <p className="font-ui text-[13px]" style={{ color: "var(--color-muted)" }}>
            {PROMESA[oficio]} Este taller se abrirá más adelante.
          </p>
          {/* Que el DM sepa que la caja de arena no es lo que falta aquí: lo que
              falta es el taller. Sin esto parecería que el modo no funciona. */}
          {dm && (
            <p className="font-ui text-[11px] mt-3" style={{ color: "var(--color-dim)" }}>
              La caja de arena lo cubrirá en cuanto exista: es de la cáscara, no del caldero.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
