"use client";

import { useEffect, useState } from "react";

export type RailOption = {
  slug: string;
  name: string;
  sub?: string;
  img?: string | null; // ruta de miniatura; si falta, se ve el rombo de reserva
  group?: string;      // para agrupar (p. ej. región de la especie)
};

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
// trae (mantiene el orden de aparición de los grupos).
export default function OptionRail({
  title,
  options,
  selected,
  onPick,
}: {
  title: string;
  options: RailOption[];
  selected: string | null;
  onPick: (slug: string) => void;
}) {
  const groups: { name: string | null; items: RailOption[] }[] = [];
  for (const o of options) {
    const g = o.group ?? null;
    const last = groups[groups.length - 1];
    if (last && last.name === g) last.items.push(o);
    else groups.push({ name: g, items: [o] });
  }

  return (
    <div className="rail">
      <div className="rail-group" style={{ marginTop: 0 }}>{title}</div>
      {groups.map((g, gi) => (
        <div key={g.name ?? `g${gi}`}>
          {g.name && <div className="rail-group">{g.name}</div>}
          {g.items.map((o) => (
            <button
              key={o.slug}
              type="button"
              className={`rail-opt${selected === o.slug ? " sel" : ""}`}
              onClick={() => onPick(o.slug)}
              aria-pressed={selected === o.slug}
            >
              <Thumb img={o.img} name={o.name} />
              <span>
                <span className="rail-name">{o.name}</span>
                {o.sub && <><br /><span className="rail-sub">{o.sub}</span></>}
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
