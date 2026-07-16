"use client";

import { useEffect, useMemo, useState } from "react";

export type RailOption = {
  slug: string;
  name: string;
  sub?: string;
  img?: string | null; // ruta de miniatura; si falta, se ve el rombo de reserva
  group?: string;      // para agrupar (p. ej. región de la especie)
};

// Quita diacríticos para comparar sin acentos (mismo criterio que lib/slug.ts).
function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function Thumb({ img, name }: { img?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  // Si cambia la imagen, olvida el fallo anterior (si no, una rota deja
  // marcadas de por vida a las siguientes).
  useEffect(() => setFailed(false), [img]);
  if (!img || failed) return <div className="rail-thumb"><span className="ph">◆</span></div>;
  return (
    <div className="rail-thumb">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={name} onError={() => setFailed(true)} />
    </div>
  );
}

// Carril de opciones del paso actual. Agrupa por `group` si alguna opción lo
// trae (mantiene el orden de aparición de los grupos) y muestra los grupos
// como acordeón (solo uno abierto a la vez; se abre solo el de la opción
// seleccionada). Un buscador filtra por nombre en todas las opciones,
// ignorando el acordeón mientras haya texto.
export default function OptionRail({
  title,
  options,
  selected,
  onPick,
  searchPlaceholder,
}: {
  title: string;
  options: RailOption[];
  selected: string | null;
  onPick: (slug: string) => void;
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState("");

  const groups: { name: string | null; items: RailOption[] }[] = [];
  for (const o of options) {
    const g = o.group ?? null;
    const last = groups[groups.length - 1];
    if (last && last.name === g) last.items.push(o);
    else groups.push({ name: g, items: [o] });
  }
  // Si nada trae `group`, todo cae en un único grupo sin nombre: se muestra
  // plano, sin acordeón (caso de los trasfondos).
  const hasGroups = groups.length > 1 || (groups.length === 1 && groups[0].name !== null);

  const [open, setOpen] = useState<string | null>(null);
  // Auto-abre el grupo de la opción seleccionada (p. ej. al volver al paso
  // con una especie ya elegida, se abre sola su región).
  useEffect(() => {
    if (!hasGroups || !selected) return;
    const g = options.find((o) => o.slug === selected)?.group;
    if (g) setOpen(g);
  }, [selected, options, hasGroups]);

  const trimmedQuery = query.trim();
  const searching = trimmedQuery.length > 0;
  const matches = useMemo(() => {
    if (!searching) return [];
    const q = norm(trimmedQuery);
    return options.filter((o) => norm(o.name).includes(q));
  }, [searching, trimmedQuery, options]);

  function renderOption(o: RailOption) {
    const isSel = selected === o.slug;
    return (
      <div key={o.slug}>
        <button
          type="button"
          className={`rail-opt${isSel ? " sel" : ""}`}
          onClick={() => onPick(o.slug)}
          aria-pressed={isSel}
        >
          <Thumb img={o.img} name={o.name} />
          <span>
            <span className="rail-name">{o.name}</span>
            {o.sub && <><br /><span className="rail-sub">{o.sub}</span></>}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="rail">
      <div className="rail-group" style={{ marginTop: 0 }}>{title}</div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={searchPlaceholder ?? "Buscar…"}
        className="rail-search"
      />

      {searching ? (
        matches.length ? (
          matches.map((o) => renderOption(o))
        ) : (
          <p className="rail-sub px-1">Sin resultados.</p>
        )
      ) : !hasGroups ? (
        options.map((o) => renderOption(o))
      ) : (
        groups.map((g, gi) => {
          const key = g.name ?? `g${gi}`;
          const isOpen = g.name != null && open === g.name;
          return (
            <div key={key}>
              <button
                type="button"
                className="rail-acc"
                onClick={() => setOpen(isOpen ? null : g.name)}
                aria-expanded={isOpen}
              >
                <span>{g.name}<span className="rail-acc-count">· {g.items.length}</span></span>
                <i className={`fas ${isOpen ? "fa-chevron-up" : "fa-chevron-down"}`} />
              </button>
              {isOpen && g.items.map((o) => renderOption(o))}
            </div>
          );
        })
      )}
    </div>
  );
}
