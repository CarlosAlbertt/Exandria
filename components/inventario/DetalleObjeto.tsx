"use client";

import { useState } from "react";
import { categoriaDe, huecoDestino, metaDe } from "@/lib/inventario";
import { ARMOR_SLOTS, WEAPON_SLOTS } from "@/data/equipmentSlots";
import type { Item } from "@/lib/character";

type Props = {
  item: Item;
  equipment: Record<string, Item>;
  /** Dueño de la ficha, o el DM: puede equipar/desequipar y anotar. */
  puedeEquipar: boolean;
  /** Solo el DM: puede soltar el objeto (añadir y cambiar cantidad quedan
   *  fuera de este componente — el DM controla lo que tienes, tú decides
   *  qué te pones). */
  puedeEditarContenido: boolean;
  onEquipar: (item: Item, slotId: string) => void;
  onSoltar: (item: Item) => void;
  onNotas: (item: Item, notas: string) => void;
  onCerrar: () => void;
};

const SLOTS = [...WEAPON_SLOTS, ...ARMOR_SLOTS];

// El detalle de un objeto de la bolsa. Vive EN LA PÁGINA, bajo la lista de
// BolsaAgrupada, empujando el resto hacia abajo — NO es un modal, y no es un
// olvido: media mesa juega desde el móvil, y un modal ahí tapa la pantalla
// entera y obliga a cerrarlo para seguir jugando. Un panel en línea se puede
// ignorar y seguir con la partida.
export default function DetalleObjeto({
  item,
  equipment,
  puedeEquipar,
  puedeEditarContenido,
  onEquipar,
  onSoltar,
  onNotas,
  onCerrar,
}: Props) {
  const [eligiendoHueco, setEligiendoHueco] = useState(false);

  const cat = categoriaDe(item.name);
  const meta = metaDe(cat);
  // null = la app no sabe dónde va (la mayoría de armadura: cabeza,
  // antebrazos, manos y pies no dan CA en D&D 2024, así que el catálogo no
  // las trae) y hay que preguntárselo al jugador con el selector de huecos.
  const destino = huecoDestino(item.name, equipment);

  const equiparEn = (slotId: string) => {
    setEligiendoHueco(false);
    onEquipar(item, slotId);
  };

  const mostrarFila = puedeEquipar || puedeEditarContenido;

  return (
    <div className="panel-raised p-4 mt-3" style={{ borderColor: "var(--color-bronze)" }}>
      <div className="flex items-start gap-3">
        <span
          className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
          style={{ background: "var(--color-night)" }}
        >
          <i className={`fas ${meta.icon} text-[15px]`} style={{ color: meta.color }} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-ui text-[14px] font-semibold" style={{ color: "var(--color-warm)" }}>
            {item.name}
          </p>
          <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
            {cat}
            {item.qty > 1 ? ` · llevas ${item.qty}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          className="font-ui shrink-0"
          style={{ color: "var(--color-dim)" }}
          aria-label="Cerrar"
        >
          <i className="fas fa-xmark" />
        </button>
      </div>

      {/* Notas: una anotación del jugador sobre SU objeto, no un cambio al
          contenido de la bolsa — por eso sigue a puedeEquipar y no a
          puedeEditarContenido. Sin permiso, se ve como texto si existe y
          desaparece del todo si no hay nada que mostrar. */}
      {puedeEquipar ? (
        <input
          value={item.notes ?? ""}
          onChange={(e) => onNotas(item, e.target.value)}
          placeholder="Notas…"
          className="w-full bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[12px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors mt-3"
          style={{ color: "var(--color-warm)" }}
        />
      ) : item.notes ? (
        <p className="font-ui text-[12px] mt-3" style={{ color: "var(--color-muted)" }}>
          {item.notes}
        </p>
      ) : null}

      {mostrarFila && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {puedeEquipar &&
            (destino ? (
              <button
                type="button"
                className="btn-gold !py-1.5 !px-3 text-[12px]"
                onClick={() => onEquipar(item, destino)}
              >
                Equipar
              </button>
            ) : (
              <button
                type="button"
                className="btn-ghost !py-1.5 !px-3 text-[12px]"
                onClick={() => setEligiendoHueco((v) => !v)}
              >
                Equipar en…
              </button>
            ))}
          {puedeEditarContenido && (
            <button
              type="button"
              className="font-ui text-[12px] font-semibold ml-auto"
              style={{ color: "var(--color-ember)" }}
              onClick={() => onSoltar(item)}
            >
              {item.qty > 1 ? "Soltar uno" : "Soltar"}
            </button>
          )}
        </div>
      )}

      {puedeEquipar && eligiendoHueco && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {SLOTS.map((s) => (
            <button key={s.id} type="button" className="chip" onClick={() => equiparEn(s.id)}>
              <i className={`fas ${s.icon} mr-1`} />
              {s.label}
              {equipment[s.id] ? " (ocupado)" : ""}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
