"use client";

import { useEffect, useMemo, useState } from "react";
import { CLASSES, GROUP_LABEL, type CharClass } from "@/data/classes";
import { abbrOf } from "@/data/rules";
import { subclassFeaturesFor } from "@/data/classdata/subclases";
import { deityForSubclass, deityLabel } from "@/data/subclassDeity";
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

// Miniatura de la tira: cae al rombo si no hay .png. Es VERTICAL porque el arte
// de clase es 659×1025; con marco cuadrado se recortaba la cabeza y los pies.
function Thumb({ cls, on, onClick }: { cls: CharClass; on: boolean; onClick: () => void }) {
  const [failed, setFailed] = useState(false);
  return (
    <button type="button" className={`cls-thumb${on ? " on" : ""}`} onClick={onClick} title={cls.name} aria-pressed={on}>
      {failed ? (
        <span className="ph">◆</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/classes/${cls.slug}.png`} alt={cls.name} onError={() => setFailed(true)} />
      )}
      <span className="cls-thumb-nm">{cls.name}</span>
    </button>
  );
}

// Ventana emergente con el detalle de lo recién elegido: qué es, qué te da por
// nivel y qué fe arrastra. Se cierra con Esc, con el fondo o con el botón.
function DetailModal({
  title,
  eyebrow,
  blurb,
  features,
  deity,
  onClose,
}: {
  title: string;
  eyebrow: string;
  blurb: string;
  features: { level: number; name: string; text: string }[];
  deity: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="cls-modal-back" onClick={onClose} role="presentation">
      <div className="cls-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <button type="button" className="cls-modal-x" onClick={onClose} aria-label="Cerrar">
          <i className="fas fa-xmark" />
        </button>
        <p className="eyebrow mb-1">{eyebrow}</p>
        <h3 className="font-display text-2xl font-extrabold mb-2" style={{ color: "var(--color-bronze-bright)" }}>{title}</h3>
        <p className="font-ui text-[13px] leading-relaxed mb-3" style={{ color: "var(--color-warm)" }}>{blurb}</p>

        {deity && (
          <p className="cls-modal-deity">
            <i className="fas fa-hands-praying mr-2" />
            Fe predefinida: <strong>{deity}</strong>. Puedes cambiarla en el paso de Trasfondo.
          </p>
        )}

        {features.length > 0 && (
          <>
            <p className="eyebrow mt-4 mb-2">Rasgos por nivel</p>
            <div className="cls-modal-feats">
              {features.map((f) => (
                <div key={`${f.level}-${f.name}`} className="cls-feat">
                  <p className="cls-feat-h">
                    <span className="cls-feat-lv">Nv {f.level}</span>
                    {f.name}
                  </p>
                  <p className="cls-feat-t">{f.text}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <button type="button" className="btn-gold mt-4 w-full" onClick={onClose}>Entendido</button>
      </div>
    </div>
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
  // Qué enseña el modal: la subclase recién pulsada, o null si está cerrado.
  const [detail, setDetail] = useState<string | null>(null);
  const idx = useMemo(() => {
    const i = ORDERED.findIndex((c) => c.slug === cls?.slug);
    return i === -1 ? 0 : i;
  }, [cls?.slug]);

  const shown = ORDERED[idx];
  const go = (delta: number) => {
    const next = (idx + delta + ORDERED.length) % ORDERED.length;
    onPick(ORDERED[next].slug);
  };

  const pickSub = (name: string) => {
    onSubclass(name);
    setDetail(name);
  };

  const detailSub = detail ? shown.subclasses.find((s) => s.name === detail) : undefined;

  return (
    <div>
      <span aria-live="polite" className="sr-only">{shown.name}</span>
      <div className="cls-stage">
        <button type="button" className="cls-arrow" onClick={() => go(-1)} aria-label="Clase anterior">
          <i className="fas fa-chevron-left" />
        </button>

        <ArtPanel src={artSrc("class", shown.slug, `/classes/${shown.slug}.png`) ?? null} alt={shown.name} />

        <div className="scene-detail">
          <p className="eyebrow mb-1">{GROUP_LABEL[shown.group]} · Clase {idx + 1} de {ORDERED.length}</p>
          <h2 className="font-display text-3xl font-extrabold mb-1" style={{ color: "var(--color-bronze-bright)" }}>
            {shown.name}
          </h2>
          <p className="font-ui text-[13px] italic mb-3" style={{ color: "var(--color-muted)" }}>{shown.tagline}</p>
          <p className="font-ui text-[14px] leading-relaxed mb-4" style={{ color: "var(--color-warm)" }}>{shown.blurb}</p>

          <div className="cls-stats">
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
              <div className="cls-subs">
                {shown.subclasses.map((sc) => {
                  const sel = subclass === sc.name;
                  const fe = deityLabel(deityForSubclass(sc.name));
                  return (
                    <button
                      key={sc.name}
                      type="button"
                      className={`pick-row${sel ? " sel" : ""}`}
                      onClick={() => pickSub(sc.name)}
                      aria-pressed={sel}
                    >
                      <span className="pick-row-name">
                        {sc.name}
                        {sel && <i className="fas fa-circle-check ml-2" style={{ color: "var(--color-bronze-bright)" }} />}
                      </span>
                      <span className="pick-row-sub">{sc.blurb}</span>
                      {fe && (
                        <span className="pick-row-tag"><i className="fas fa-hands-praying mr-1" />{fe}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <button type="button" className="btn-gold" onClick={() => onPick(shown.slug)}>
              Elegir {shown.name}
            </button>
          )}
        </div>

        <button type="button" className="cls-arrow" onClick={() => go(1)} aria-label="Clase siguiente">
          <i className="fas fa-chevron-right" />
        </button>
      </div>

      <div className="cls-strip">
        {ORDERED.map((c) => (
          <Thumb key={c.slug} cls={c} on={c.slug === shown.slug} onClick={() => onPick(c.slug)} />
        ))}
      </div>

      {detailSub && (
        <DetailModal
          eyebrow={`${shown.name} · ${shown.subclassLabel}`}
          title={detailSub.name}
          blurb={detailSub.blurb}
          features={subclassFeaturesFor(shown.slug, detailSub.name)}
          deity={deityLabel(deityForSubclass(detailSub.name))}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
