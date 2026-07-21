"use client";

import Link from "next/link";
import { useWorldPois } from "@/lib/useWorldPois";
import { useRole } from "@/components/SessionProvider";
import { continentBySlug } from "@/data/saber";
import { slugify } from "@/lib/slug";

// Lista de continentes de Exandria, filtrada por lo que el grupo ha descubierto.
export default function ReinoRegions() {
  const role = useRole();
  const { pois } = useWorldPois();
  const isDM = role === "dm";

  const continents = pois.filter((p) => p.type === "continente");
  const visible = continents.filter((c) => isDM || c.revealed);

  return (
    <section className="mb-20">
      <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
        <h2 className="font-display text-2xl font-bold flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-earth-americas text-[var(--color-bronze)]" /> {isDM ? "Las tierras de Exandria" : "Las tierras que conocéis"}
        </h2>
        <Link href="/mapa" className="btn-ghost !py-2 !px-4 text-[12px]">Ver en el mapa →</Link>
      </div>
      <p className="prose-lore !text-[15px] mb-8 max-w-2xl">
        Cada continente tiene su propia página: su geografía, sus regiones y ciudades, su gente y
        su historia. Entra en la tierra que quieras leer.
      </p>

      {visible.length === 0 ? (
        <div className="panel p-8 text-center">
          <p className="prose-lore !text-[15px] !mb-0" style={{ color: "var(--color-muted)" }}>
            Aún no habéis descubierto ningún continente. Tu DM los irá revelando conforme avance la campaña.
          </p>
          {/* Al DM esta rama no le sale nunca (ve todos los continentes), pero
              si algún día cambia el filtro, que sepa dónde se revelan. */}
          {isDM && (
            <p className="font-ui text-[12px] mt-3" style={{ color: "var(--color-dim)" }}>
              Se revelan desde Panel DM › Mapa.
            </p>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {visible.map((c) => (
            <Link
              key={c.id}
              href={continentBySlug(slugify(c.continent)) ? `/reino/${slugify(c.continent)}` : "/mapa"}
              className="panel p-6 block transition-transform hover:-translate-y-0.5"
              style={{ borderColor: "var(--color-line)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: "var(--color-bronze)", boxShadow: "0 0 10px var(--color-bronze)" }} />
                <h3 className="font-display text-lg font-bold" style={{ color: "var(--color-bronze-bright)" }}>{c.name}</h3>
              </div>
              <p className="prose-lore !text-[15px] !mb-0">{c.blurb}</p>
              <p className="font-ui text-[11px] mt-3" style={{ color: "var(--color-dim)" }}>Leer sobre esta tierra →</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
