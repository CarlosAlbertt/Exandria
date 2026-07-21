"use client";
import { useAtlas, regionsOf, poisOf } from "@/lib/useAtlas";
import { POI_ICON, POI_COLOR, type PoiType } from "@/data/pois";

// Geografía ABIERTA: las regiones y los lugares de un continente. Sale del
// atlas (no de data/world.ts) para que refleje lo que el DM haya editado.
// Los POIs van agrupados por tipo, que leído de corrido es más útil que una
// lista suelta de treinta nombres.
const ORDEN: PoiType[] = ["ciudad", "fortaleza", "ruina", "natural", "peligro"];
const TITULO: Record<PoiType, string> = {
  ciudad: "Ciudades y aldeas",
  fortaleza: "Fortalezas",
  ruina: "Ruinas",
  natural: "Parajes",
  peligro: "Peligros",
};

export default function ContinenteGeografia({ continent, accent }: { continent: string; accent: string }) {
  const { atlas, ready } = useAtlas();
  const regiones = regionsOf(atlas, continent);

  if (!ready) return <p className="font-ui text-[13px]" style={{ color: "var(--color-dim)" }}>Cargando el atlas…</p>;
  if (!regiones.length) return <p className="font-ui text-[13px] italic" style={{ color: "var(--color-dim)" }}>Este continente aún no tiene regiones en el atlas.</p>;

  return (
    <div className="space-y-6">
      {regiones.map((r) => {
        const pois = poisOf(atlas, continent, r.slug);
        return (
          <div key={r.slug} className="panel p-5" style={{ borderLeft: `3px solid ${r.accent || accent}` }}>
            <h3 className="font-display text-lg font-extrabold mb-1" style={{ color: "var(--color-parch)" }}>{r.name}</h3>
            {r.blurb && <p className="prose-lore !text-[14px] mb-4">{r.blurb}</p>}

            {ORDEN.map((tipo) => {
              const suyos = pois.filter((p) => p.type === tipo);
              if (!suyos.length) return null;
              return (
                <div key={tipo} className="mb-3">
                  <p className="font-ui text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-dim)" }}>
                    {TITULO[tipo]}
                  </p>
                  <ul className="space-y-1.5">
                    {suyos.map((p) => (
                      <li key={p.name} className="flex gap-2">
                        <i className={`fas ${POI_ICON[p.type]} text-[11px] mt-1 shrink-0`} style={{ color: POI_COLOR[p.type] }} />
                        <span className="prose-lore !text-[14px] !mb-0">
                          <strong style={{ color: "var(--color-parch)" }}>{p.name}</strong>
                          {p.blurb ? ` — ${p.blurb}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
