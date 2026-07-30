"use client";

import { useMemo, useState } from "react";
import { SPECIES, REGIONS, type Species } from "@/data/species";
import ArtPanel from "@/components/crear/ArtPanel";
import Modal from "@/components/crear/Modal";
import { useArt } from "@/lib/useArt";

// Escena 0 — Especie. Mismo pase de arte que la de Clase: flechas a los lados,
// emblema grande, detalle a la derecha y tira de las 36 abajo para saltar. Se
// retiró el acordeón por región: la tira ya agrupa y la navegación es igual en
// los dos pasos, que era lo que se pedía.
//
// El recorrido va por REGIÓN (Universales · Tal'Dorei · Wildemount · Marquet ·
// Issylra · Infraoscuridad · Océanos), el mismo criterio que usaba el acordeón,
// para que las flechas no salten de un continente a otro.
const ORDERED: Species[] = REGIONS.flatMap((r) => SPECIES.filter((s) => s.region === r.key));
const REGION_LABEL: Record<string, string> = Object.fromEntries(REGIONS.map((r) => [r.key, r.label]));

function Thumb({ sp, on, onClick }: { sp: Species; on: boolean; onClick: () => void }) {
  const [failed, setFailed] = useState(false);
  return (
    <button type="button" className={`cls-thumb${on ? " on" : ""}`} onClick={onClick} title={sp.name} aria-pressed={on}>
      {failed ? (
        <span className="ph">◆</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/species/${sp.slug}.jpg`} alt={sp.name} onError={() => setFailed(true)} />
      )}
      <span className="cls-thumb-nm">{sp.name}</span>
    </button>
  );
}

export default function SpeciesScene({
  species,
  selected,
  lineage,
  onPick,
  onLineage,
}: {
  species?: Species;
  selected: string | null;
  lineage: string | null;
  onPick: (slug: string) => void;
  onLineage: (name: string) => void;
}) {
  const { artSrc } = useArt();
  // Dos ventanas: "linajes" es el SELECTOR de subraza; "descripcion" describe la
  // especie entera; un nombre de linaje describe ESE linaje recién elegido.
  const [modal, setModal] = useState<"linajes" | "descripcion" | null>(null);
  const [linajeVisto, setLinajeVisto] = useState<string | null>(null);

  const idx = useMemo(() => {
    const i = ORDERED.findIndex((s) => s.slug === selected);
    return i === -1 ? 0 : i;
  }, [selected]);

  const shown = ORDERED[idx];
  const go = (delta: number) => {
    const next = (idx + delta + ORDERED.length) % ORDERED.length;
    onPick(ORDERED[next].slug);
  };

  // Elegir linaje cierra el selector y abre su descripción: el jugador ve qué
  // acaba de coger sin tener que buscarlo en la lista otra vez.
  const pickLineage = (name: string) => {
    onLineage(name);
    setModal(null);
    setLinajeVisto(name);
  };

  const elegida = species?.slug === shown.slug;
  const linajeDetalle = linajeVisto ? shown.lineages?.find((l) => l.name === linajeVisto) : undefined;

  return (
    <div>
      <span aria-live="polite" className="sr-only">{shown.name}</span>
      <div className="cls-stage">
        <button type="button" className="cls-arrow" onClick={() => go(-1)} aria-label="Especie anterior">
          <i className="fas fa-chevron-left" />
        </button>

        <ArtPanel src={artSrc("species", shown.slug, `/species/${shown.slug}.jpg`) ?? null} alt={shown.name} />

        <div className="scene-detail">
          <p className="eyebrow mb-1">
            {REGION_LABEL[shown.region]} · Especie {idx + 1} de {ORDERED.length}
            {shown.homebrew ? " · a criterio del DM" : ""}
          </p>
          <h2 className="font-display text-3xl font-extrabold mb-1" style={{ color: "var(--color-bronze-bright)" }}>
            {shown.name}
          </h2>
          <p className="font-ui text-[13px] italic mb-3" style={{ color: "var(--color-muted)" }}>{shown.tagline}</p>
          <p className="font-ui text-[14px] leading-relaxed mb-4" style={{ color: "var(--color-warm)" }}>{shown.blurb}</p>

          <div className="cls-stats">
            <div><p className="eyebrow !text-[9px]">Tamaño</p><p className="font-display font-extrabold" style={{ color: "var(--color-parch)" }}>{shown.size}</p></div>
            <div><p className="eyebrow !text-[9px]">Velocidad</p><p className="font-display font-extrabold" style={{ color: "var(--color-parch)" }}>{shown.speed} m</p></div>
            <div><p className="eyebrow !text-[9px]">Rasgos</p><p className="font-display font-extrabold" style={{ color: "var(--color-parch)" }}>{shown.traits.length}</p></div>
            <div><p className="eyebrow !text-[9px]">Linajes</p><p className="font-display font-extrabold" style={{ color: "var(--color-parch)" }}>{shown.lineages?.length ?? "—"}</p></div>
          </div>

          <div className="cls-actions">
            <button type="button" className="btn-ghost" onClick={() => setModal("descripcion")}>
              <i className="fas fa-book-open mr-2" />Ver descripción
            </button>
            {elegida && shown.lineages && (
              <button type="button" className="btn-gold" onClick={() => setModal("linajes")}>
                <i className="fas fa-code-branch mr-2" />
                {lineage ? `Linaje: ${lineage}` : "Elegir linaje *"}
              </button>
            )}
          </div>

          {/* Igual que en Clase: al entrar se ENSEÑA una especie pero no se
              selecciona sola; hace falta un clic explícito porque el gate lo exige. */}
          {!elegida && (
            <button type="button" className="btn-gold mt-3" onClick={() => onPick(shown.slug)}>
              Elegir {shown.name}
            </button>
          )}

          {elegida && !shown.lineages && (
            <p className="font-ui text-[12px] mt-3" style={{ color: "var(--color-muted)" }}>
              <i className="fas fa-circle-check mr-1.5" style={{ color: "var(--color-bronze-bright)" }} />
              Esta especie no tiene linajes: ya puedes continuar.
            </p>
          )}
        </div>

        <button type="button" className="cls-arrow" onClick={() => go(1)} aria-label="Especie siguiente">
          <i className="fas fa-chevron-right" />
        </button>
      </div>

      <div className="cls-strip">
        {ORDERED.map((s) => (
          <Thumb key={s.slug} sp={s} on={s.slug === shown.slug} onClick={() => onPick(s.slug)} />
        ))}
      </div>

      {/* Ventana 1 — ELEGIR linaje. */}
      {modal === "linajes" && shown.lineages && (
        <Modal eyebrow={`${shown.name} · Linaje`} title="Elige tu linaje" onClose={() => setModal(null)}>
          <p className="font-ui text-[13px] mb-3" style={{ color: "var(--color-muted)" }}>
            El linaje afina qué te aporta ser {shown.name.toLowerCase()}. Es obligatorio para continuar.
          </p>
          <div className="cls-subs">
            {shown.lineages.map((l) => {
              const sel = lineage === l.name;
              return (
                <button
                  key={l.name}
                  type="button"
                  className={`pick-row${sel ? " sel" : ""}`}
                  onClick={() => pickLineage(l.name)}
                  aria-pressed={sel}
                >
                  <span className="pick-row-name">
                    {l.name}{l.homebrew ? " · DM" : ""}
                    {sel && <i className="fas fa-circle-check ml-2" style={{ color: "var(--color-bronze-bright)" }} />}
                  </span>
                  <span className="pick-row-sub">{l.perk}</span>
                </button>
              );
            })}
          </div>
        </Modal>
      )}

      {/* Ventana 2 — DESCRIBIR: la especie entera (origen y rasgos). */}
      {modal === "descripcion" && (
        <Modal eyebrow={`${REGION_LABEL[shown.region]} · Especie`} title={shown.name} onClose={() => setModal(null)}>
          <p className="font-ui text-[13px] italic mb-3" style={{ color: "var(--color-muted)" }}>{shown.tagline}</p>
          <p className="font-ui text-[13px] leading-relaxed mb-4" style={{ color: "var(--color-warm)" }}>{shown.blurb}</p>

          <p className="eyebrow mb-1.5">Origen</p>
          <p className="font-ui text-[12.5px] leading-relaxed mb-4" style={{ color: "var(--color-muted)" }}>{shown.origin}</p>

          <p className="eyebrow mb-2">Rasgos</p>
          <div className="cls-modal-feats">
            {shown.traits.map((t) => (
              <div key={t} className="cls-feat">
                <p className="cls-feat-t" style={{ color: "var(--color-warm)" }}>
                  <span style={{ color: "var(--color-bronze)" }}>◆ </span>{t}
                </p>
              </div>
            ))}
          </div>

          <button type="button" className="btn-gold mt-4 w-full" onClick={() => setModal(null)}>Entendido</button>
        </Modal>
      )}

      {/* Ventana 3 — DESCRIBIR el linaje recién elegido. */}
      {linajeDetalle && (
        <Modal eyebrow={`${shown.name} · Linaje`} title={linajeDetalle.name} onClose={() => setLinajeVisto(null)}>
          <p className="font-ui text-[13px] leading-relaxed mb-3" style={{ color: "var(--color-warm)" }}>{linajeDetalle.perk}</p>
          {linajeDetalle.homebrew && (
            <p className="cls-modal-deity">
              <i className="fas fa-triangle-exclamation mr-2" />
              Linaje <strong>homebrew</strong>: queda a criterio del DM.
            </p>
          )}
          <button type="button" className="btn-gold mt-4 w-full" onClick={() => setLinajeVisto(null)}>Entendido</button>
        </Modal>
      )}
    </div>
  );
}
