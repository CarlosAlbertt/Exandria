"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { loadActiveCharacter } from "@/lib/character";
import { useLoreRevealed } from "@/lib/useLoreRevealed";
import { SABER, CATEGORIES, PLACE_ACCENT, PLACE_ICON, type SaberPlace } from "@/data/saber";
import { WORLD_POIS } from "@/data/world";
import { knows, EMPTY_CTX, type SaberCtx } from "@/lib/saber";
import SaberCategory from "./SaberCategory";
import SaberCard from "./SaberCard";
import ContinenteGeografia from "./ContinenteGeografia";

// Categorías que se leen SIN candado en la página de un continente: geografía y
// costumbres se compran en cualquier puerto. Lo demás (historia profunda,
// potencias, fe, secretos) sigue el saber por origen.
const ABIERTAS: string[] = ["Geografía", "Vida y lenguas"];

export default function ContinentePage({ place }: { place: SaberPlace }) {
  const session = useSession();
  const isDm = session?.role === "dm";
  const { revealed, toggle, revealMany, hideMany } = useLoreRevealed();
  const [ctx, setCtx] = useState<SaberCtx>({ ...EMPTY_CTX });

  useEffect(() => {
    let on = true;
    (async () => {
      if (!session?.id) return;
      const c = isDm ? null : await loadActiveCharacter(session.id);
      if (!on) return;
      setCtx({
        isDm,
        originContinent: c?.origin_continent ?? null,
        originRegion: c?.origin_region ?? null,
        deity: c?.deity ?? null,
        cls: c?.cls ?? null,
        skills: c?.skills ?? [],
        unlocked: Array.isArray(c?.lore_unlocked) ? c!.lore_unlocked : [],
        revealed: [],
      });
    })();
    return () => { on = false; };
  }, [session?.id, isDm]);

  const full: SaberCtx = { ...ctx, isDm, revealed };
  const accent = PLACE_ACCENT[place];
  const suyas = SABER.filter((e) => e.place === place);
  const abiertas = suyas.filter((e) => ABIERTAS.includes(e.category));
  const conCandado = suyas.filter((e) => !ABIERTAS.includes(e.category));
  const gateadas = conCandado.filter((e) => isDm || knows(e, full));
  const porGanar = conCandado.length - gateadas.length;
  const cabecera = WORLD_POIS.find((p) => p.type === "continente" && p.continent === place);

  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <Link href="/reino" className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>← El Mundo de Exandria</Link>

      <header className="mb-12 mt-4 reveal">
        <div className="flex items-center gap-4">
          <i className={`fas ${PLACE_ICON[place]} text-3xl`} style={{ color: accent }} />
          <h1 className="font-display text-4xl md:text-5xl font-extrabold" style={{ color: "var(--color-parch)" }}>{place}</h1>
        </div>
        {cabecera && <p className="prose-lore lead max-w-3xl mt-4">{cabecera.blurb}</p>}
      </header>

      <section className="mb-16">
        <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-map" style={{ color: accent }} /> Geografía
        </h2>
        <ContinenteGeografia continent={place} accent={accent} />
      </section>

      {abiertas.length > 0 && (
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
            <i className="fas fa-people-group" style={{ color: accent }} /> La tierra y su gente
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {abiertas.map((e) => (
              <SaberCard key={e.id} entry={e} open accent={accent} isDm={false} revealed={false} onToggle={() => {}} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-20">
        <h2 className="font-display text-2xl font-bold mb-2 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
          <i className="fas fa-book-skull" style={{ color: accent }} /> Lo que hay que ganarse
        </h2>
        <p className="prose-lore !text-[14px] mb-6 max-w-2xl">
          Historia, potencias, fe y secretos de esta tierra. Se abren estudiando, viajando o
          descubriéndolos en la mesa.
        </p>
        {/* Si no sabes nada de esta tierra, la sección se quedaba en un título
            huérfano. Se dice CUÁNTO falta pero no el qué: un candado con el
            título puesto ya spoilea (mismo criterio que SaberPlace). */}
        {gateadas.length === 0 ? (
          <p className="font-ui text-[12px] italic" style={{ color: "var(--color-dim)" }}>
            <i className="fas fa-lock mr-1.5" />
            De esto no sabes nada todavía · {porGanar} cosas por descubrir
          </p>
        ) : (
          CATEGORIES.filter((c) => !ABIERTAS.includes(c)).map((c) => {
            const entries = gateadas.filter((e) => e.category === c);
            if (!entries.length) return null;
            return (
              <SaberCategory
                key={c}
                category={c}
                entries={entries}
                ctx={full}
                accent={accent}
                revealed={revealed}
                onToggle={toggle}
                onRevealMany={revealMany}
                onHideMany={hideMany}
                defaultOpen
              />
            );
          })
        )}
      </section>
    </main>
  );
}
