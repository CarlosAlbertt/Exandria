"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { loadActiveCharacter } from "@/lib/character";
import { useLoreRevealed } from "@/lib/useLoreRevealed";
import { CALAMIDAD_RELATO } from "@/data/calamidad";
import { SABER, PLACE_ACCENT } from "@/data/saber";
import { knows, EMPTY_CTX, type SaberCtx } from "@/lib/saber";
import SaberCategory from "./SaberCategory";

// Exandria y la Calamidad. El relato lo sabe cualquiera —es lo que se cuenta en
// las tabernas—; el detalle se gana con pericia o descubriéndolo.
export default function CalamidadSection() {
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
  const accent = PLACE_ACCENT["Exandria"];
  const detalle = SABER.filter((e) => e.id.startsWith("cal:") && (isDm || knows(e, full)));

  return (
    <section className="mb-20">
      <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
        <i className="fas fa-hourglass-half" style={{ color: accent }} /> Exandria y la Calamidad
      </h2>

      <div className="panel p-6 max-w-3xl space-y-5" style={{ borderTop: `2px solid ${accent}` }}>
        {CALAMIDAD_RELATO.map((a) => (
          <div key={a.title}>
            <p className="font-display font-extrabold text-[15px] mb-1" style={{ color: accent }}>{a.title}</p>
            <p className="prose-lore !text-[15px] !mb-0">{a.body}</p>
          </div>
        ))}
        <p className="font-ui text-[12px] pt-2 italic" style={{ color: "var(--color-dim)" }}>
          <i className="fas fa-circle-info mr-1.5" />
          Esto lo sabe cualquiera. El detalle —quién hizo qué, y qué se perdió— se estudia o se descubre.
        </p>
      </div>

      {detalle.length > 0 && (
        <div className="mt-6 panel p-5" style={{ borderTop: `2px solid ${accent}` }}>
          <p className="eyebrow mb-3" style={{ color: accent }}>El detalle</p>
          <SaberCategory
            category="La Calamidad"
            entries={detalle}
            ctx={full}
            accent={accent}
            revealed={revealed}
            onToggle={toggle}
            onRevealMany={revealMany}
            onHideMany={hideMany}
            defaultOpen
          />
        </div>
      )}
    </section>
  );
}
