"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { loadActiveCharacter } from "@/lib/character";
import { useLoreRevealed } from "@/lib/useLoreRevealed";
import { SABER, PLACES, type SaberPlace } from "@/data/saber";
import { knows, EMPTY_CTX, type SaberCtx } from "@/lib/saber";
import SaberPlaceBlock from "./SaberPlace";

// "Saber del mundo": lo que TU personaje sabe, ordenado por tierra y, dentro,
// por categoría. De salida conoces lo básico de los continentes, el tuyo a
// fondo, tu región y tu deidad; las pericias abren la capa erudita. Lo demás se
// descubre jugando (tomos, misiones, el DM, o una tirada in situ).
export default function SaberBrowser() {
  const session = useSession();
  const isDm = session?.role === "dm";
  const { revealed, toggle, revealMany, hideMany } = useLoreRevealed();
  const [ctx, setCtx] = useState<SaberCtx>({ ...EMPTY_CTX });
  const [onlyKnown, setOnlyKnown] = useState(false);
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({});

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
      // Al entrar se abren tu tierra y Exandria; el resto, plegado. El DM entra
      // con todo cerrado (si no, la página es un muro).
      setAbiertos(isDm ? {} : { "Exandria": true, ...(c?.origin_continent ? { [c.origin_continent]: true } : {}) });
    })();
    return () => { on = false; };
  }, [session?.id, isDm]);

  const full: SaberCtx = useMemo(() => ({ ...ctx, isDm, revealed }), [ctx, isDm, revealed]);

  const porLugar = useMemo(() => {
    const m = new Map<SaberPlace, typeof SABER>();
    for (const p of PLACES) m.set(p, []);
    for (const e of SABER) {
      if (onlyKnown && !knows(e, full)) continue;
      m.get(e.place)!.push(e);
    }
    return m;
  }, [full, onlyKnown]);

  const known = SABER.filter((e) => knows(e, full)).length;
  const porDescubrir = SABER.length - known;

  return (
    <section className="mb-20 reveal">
      <h2 className="font-display text-2xl font-bold mb-3 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
        <i className="fas fa-book-skull text-[var(--color-arcane)]" /> Saber del mundo
      </h2>
      <p className="prose-lore !text-[15px] mb-4 max-w-2xl">
        Sabes lo que tu personaje sabría: algo de los continentes, tu tierra y tu fe. Lo demás se gana
        leyendo, viajando y jugando.
      </p>

      <div className="flex items-center gap-3 flex-wrap mb-6">
        <span className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>
          Sabes <strong style={{ color: "var(--color-bronze-bright)" }}>{known}</strong> cosas
          {porDescubrir > 0 && <> · te quedan <strong style={{ color: "var(--color-arcane)" }}>{porDescubrir}</strong> por descubrir</>}
        </span>
        <button onClick={() => setOnlyKnown((v) => !v)} className="btn-ghost !py-1 !px-2.5 text-[11px]">
          <i className={`fas ${onlyKnown ? "fa-eye" : "fa-filter"} mr-1`} />{onlyKnown ? "Ver todo" : "Solo lo que sé"}
        </button>
        <button onClick={() => setAbiertos(Object.fromEntries(PLACES.map((p) => [p, true])))} className="btn-ghost !py-1 !px-2.5 text-[11px]">
          <i className="fas fa-angles-down mr-1" />Desplegar todo
        </button>
        <button onClick={() => setAbiertos({})} className="btn-ghost !py-1 !px-2.5 text-[11px]">
          <i className="fas fa-angles-up mr-1" />Plegar todo
        </button>
      </div>

      {PLACES.map((p) => (
        <SaberPlaceBlock
          key={p}
          place={p}
          entries={porLugar.get(p) ?? []}
          ctx={full}
          open={!!abiertos[p]}
          onOpenChange={(v) => setAbiertos((prev) => ({ ...prev, [p]: v }))}
          revealed={revealed}
          onToggle={toggle}
          onRevealMany={revealMany}
          onHideMany={hideMany}
        />
      ))}
    </section>
  );
}
