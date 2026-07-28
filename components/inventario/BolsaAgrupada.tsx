"use client";

import { useMemo, useState } from "react";
import { agrupaPorCategoria, categoriaDe, metaDe, norm } from "@/lib/inventario";
import type { Item } from "@/lib/character";

type Props = {
  items: Item[];
  /** Objeto abierto en el detalle, para resaltarlo. */
  seleccionado?: string | null;
  /** Si falta, la lista es de solo lectura (panel del DM). */
  onSelect?: (item: Item) => void;
};

// La bolsa: lo que llevas GUARDADO. Lo que llevas puesto está en el muñeco y
// no aparece aquí — equipar saca el objeto de la bolsa (CharacterSheet.tsx,
// removeOne), así que no hace falta ninguna chapa de "equipada".
export default function BolsaAgrupada({ items, seleccionado = null, onSelect }: Props) {
  const [q, setQ] = useState("");

  // norm() (de lib/inventario) quita mayúsculas, tildes y espacios de sobra:
  // lo mismo que usa categoriaDe para indexar. Un jugador que escriba "pocion"
  // sin tilde debe encontrar "Poción de curación" igual — es lo que se espera
  // de un buscador en español, y un simple toLowerCase() lo dejaría fuera.
  const filtrados = useMemo(() => {
    const t = norm(q);
    if (!t) return items;
    return items.filter((i) => norm(i.name).includes(t));
  }, [items, q]);

  const grupos = useMemo(() => agrupaPorCategoria(filtrados), [filtrados]);

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar en la bolsa…"
        className="w-full bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors mb-3"
        style={{ color: "var(--color-warm)" }}
      />

      {items.length === 0 ? (
        <p className="font-ui text-[13px] text-center py-6" style={{ color: "var(--color-dim)" }}>
          La bolsa está vacía.
        </p>
      ) : grupos.length === 0 ? (
        <p className="font-ui text-[13px] text-center py-6" style={{ color: "var(--color-dim)" }}>
          Nada coincide con «{q.trim()}».
        </p>
      ) : (
        grupos.map((g) => {
          const m = metaDe(g.cat);
          return (
            <div key={g.cat}>
              <p className="font-ui text-[10px] uppercase tracking-[.16em] mt-4 mb-2 flex items-center gap-2" style={{ color: "var(--color-dim)" }}>
                <i className={`fas ${m.icon}`} style={{ color: m.color }} />
                {g.cat} · {g.items.length}
                <span className="flex-1 h-px" style={{ background: "var(--color-line)" }} />
              </p>
              <div className="space-y-1.5">
                {g.items.map((it) => (
                  <div
                    key={it.id}
                    onClick={onSelect ? () => onSelect(it) : undefined}
                    className={`panel-raised px-3 py-2 flex items-center gap-3 ${onSelect ? "cursor-pointer" : ""}`}
                    style={seleccionado === it.id ? { borderColor: "var(--color-bronze)", boxShadow: "0 0 0 1px var(--color-bronze)" } : undefined}
                  >
                    <span className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: "var(--color-night)" }}>
                      <i className={`fas ${it.doc ? "fa-scroll" : metaDe(categoriaDe(it.name)).icon} text-[13px]`}
                         style={{ color: it.doc ? "var(--color-arcane)" : metaDe(categoriaDe(it.name)).color }} />
                    </span>
                    <span className="font-ui text-[13px] font-semibold flex-1 min-w-0" style={{ color: "var(--color-warm)" }}>
                      {it.name}
                    </span>
                    {it.qty > 1 && (
                      <span className="font-ui text-[12px] font-bold" style={{ color: "var(--color-bronze-bright)" }}>×{it.qty}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
