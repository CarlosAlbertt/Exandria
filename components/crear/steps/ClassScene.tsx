"use client";

import { useMemo, useState } from "react";
import { CLASSES, GROUP_LABEL, type CharClass } from "@/data/classes";
import { abbrOf } from "@/data/rules";
import ArtPanel from "@/components/crear/ArtPanel";
import { useArt } from "@/lib/useArt";

// Escena 1 — Clase. Navegación por FLECHAS (una clase cada vez, con su arte
// grande) + tira de las 13 abajo para saltar. Sin acordeón ni buscador: es lo
// que el carril hacía y lo que se pidió retirar aquí.
//
// El orden de recorrido es por grupo (Marcial · Arcano · Divino · Primigenio),
// el mismo criterio que usaba el carril, para que las flechas pasen por los
// grupos en orden en vez de saltar de uno a otro.
const GROUP_ORDER = Object.keys(GROUP_LABEL) as (keyof typeof GROUP_LABEL)[];
const ORDERED: CharClass[] = [...CLASSES].sort(
  (a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group)
);

// Miniatura de la tira: cae al rombo si no hay .jpg (bardo y paladin hoy).
function Thumb({ cls, on, onClick }: { cls: CharClass; on: boolean; onClick: () => void }) {
  const [failed, setFailed] = useState(false);
  return (
    <button type="button" className={`cls-thumb${on ? " on" : ""}`} onClick={onClick} title={cls.name} aria-pressed={on}>
      {failed ? (
        <span className="ph">◆</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/classes/${cls.slug}.jpg`} alt={cls.name} onError={() => setFailed(true)} />
      )}
      <span className="cls-thumb-nm">{cls.name}</span>
    </button>
  );
}

export default function ClassScene({
  cls,
  subclass,
  onPick,
  onSubclass,
}: {
  cls?: CharClass;
  subclass: string | null;
  onPick: (slug: string) => void;
  onSubclass: (name: string) => void;
}) {
  // Sin clase elegida arrancamos en la primera: la escena SIEMPRE enseña una
  // clase (es un pase de arte, no una lista vacía). No selecciona nada por su
  // cuenta — el gate sigue pidiendo que el jugador pulse.
  const { artSrc } = useArt();
  const idx = useMemo(() => {
    const i = ORDERED.findIndex((c) => c.slug === cls?.slug);
    return i === -1 ? 0 : i;
  }, [cls?.slug]);

  const shown = ORDERED[idx];
  const go = (delta: number) => {
    const next = (idx + delta + ORDERED.length) % ORDERED.length;
    onPick(ORDERED[next].slug);
  };

  return (
    <div>
      <span aria-live="polite" className="sr-only">{shown.name}</span>
      <div className="cls-stage">
        <button type="button" className="cls-arrow" onClick={() => go(-1)} aria-label="Clase anterior">◀</button>

        <ArtPanel src={artSrc("class", shown.slug, `/classes/${shown.slug}.jpg`) ?? null} alt={shown.name} />

        <div className="scene-detail">
          <p className="eyebrow mb-1">{GROUP_LABEL[shown.group]} · Clase {idx + 1} de {ORDERED.length}</p>
          <h2 className="font-display text-3xl font-extrabold mb-1" style={{ color: "var(--color-bronze-bright)" }}>
            {shown.name}
          </h2>
          <p className="font-ui text-[13px] italic mb-3" style={{ color: "var(--color-muted)" }}>{shown.tagline}</p>
          <p className="font-ui text-[14px] leading-relaxed mb-4" style={{ color: "var(--color-warm)" }}>{shown.blurb}</p>

          <div className="flex gap-6 mb-4 flex-wrap">
            <div><p className="eyebrow !text-[9px]">Dado de golpe</p><p className="font-display font-extrabold" style={{ color: "var(--color-parch)" }}>d{shown.hitDie}</p></div>
            <div><p className="eyebrow !text-[9px]">Aptitud principal</p><p className="font-display font-extrabold" style={{ color: "var(--color-parch)" }}>{shown.primary.map(abbrOf).join(" / ")}</p></div>
            <div><p className="eyebrow !text-[9px]">Salvaciones</p><p className="font-display font-extrabold" style={{ color: "var(--color-parch)" }}>{shown.saves.map(abbrOf).join(" / ")}</p></div>
            <div><p className="eyebrow !text-[9px]">Pericias</p><p className="font-display font-extrabold" style={{ color: "var(--color-parch)" }}>{shown.skillCount} a elegir</p></div>
          </div>

          {/* Al entrar sin clase elegida se muestra la primera, pero NO se selecciona
              sola: hace falta un clic explícito (el gate lo exige). En cuanto se pulsa
              una flecha o una miniatura, `onPick` ya fija la clase, así que a partir de
              ahí siempre se ven sus subclases y este botón no vuelve a aparecer. */}
          {cls?.slug === shown.slug ? (
            <>
              <p className="eyebrow mb-1.5">{shown.subclassLabel} *</p>
              {shown.subclasses.map((sc) => (
                <button
                  key={sc.name}
                  type="button"
                  className={`pick-row${subclass === sc.name ? " sel" : ""}`}
                  onClick={() => onSubclass(sc.name)}
                  aria-pressed={subclass === sc.name}
                >
                  <span className="pick-row-name">{sc.name}</span>
                  <span className="pick-row-sub">{sc.blurb}</span>
                </button>
              ))}
            </>
          ) : (
            <button type="button" className="btn-gold" onClick={() => onPick(shown.slug)}>
              Elegir {shown.name}
            </button>
          )}
        </div>

        <button type="button" className="cls-arrow" onClick={() => go(1)} aria-label="Clase siguiente">▶</button>
      </div>

      <div className="cls-strip">
        {ORDERED.map((c) => (
          <Thumb key={c.slug} cls={c} on={c.slug === shown.slug} onClick={() => onPick(c.slug)} />
        ))}
      </div>
    </div>
  );
}
