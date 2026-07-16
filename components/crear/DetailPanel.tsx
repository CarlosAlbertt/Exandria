"use client";

import type { Species } from "@/data/species";
import { REGIONS } from "@/data/species";
import type { CharClass } from "@/data/classes";
import { GROUP_LABEL } from "@/data/classes";
import type { Background } from "@/data/backgrounds";
import { ABILITIES } from "@/data/rules";

// Panel de detalle bajo el círculo de invocación: muestra el lore y las
// mecánicas de la opción seleccionada en el paso actual (especie / clase /
// trasfondo). Sin esto no se puede elegir con criterio: el círculo y el
// carril solo dan nombre + miniatura.
//
// Pasos 3-5 (Aptitudes / Pericias / Resumen) no tienen "opción" que detallar
// aquí — sus propios paneles viven en la columna derecha — así que este
// componente no renderiza nada para ellos.

function abbr(key: string) {
  return ABILITIES.find((a) => a.key === key)?.abbr ?? key.toUpperCase();
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="panel p-4">
      <p className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>{children}</p>
    </div>
  );
}

function Trait({ children }: { children: React.ReactNode }) {
  return (
    <li className="font-ui text-[12px] leading-snug" style={{ color: "var(--color-warm)" }}>
      <span style={{ color: "var(--color-bronze)" }}>◆ </span>{children}
    </li>
  );
}

function SpeciesDetail({ species }: { species?: Species }) {
  if (!species) return <Hint>Elige una especie en la lista.</Hint>;
  const region = REGIONS.find((r) => r.key === species.region)?.label;
  return (
    <div className="panel p-4">
      <p className="font-display text-lg font-bold" style={{ color: "var(--color-bronze-bright)" }}>{species.name}</p>
      <p className="eyebrow mt-1 mb-2">{region}{species.homebrew ? " · a criterio del DM" : ""}</p>
      <p className="font-ui text-[13px] leading-relaxed" style={{ color: "var(--color-warm)" }}>{species.blurb}</p>
      <p className="font-ui text-[12px] italic mt-2" style={{ color: "var(--color-muted)" }}>{species.origin}</p>
      <p className="eyebrow mt-3 mb-1.5">Rasgos</p>
      <ul className="space-y-1">
        {species.traits.map((t) => <Trait key={t}>{t}</Trait>)}
      </ul>
    </div>
  );
}

function ClassDetail({ cls, subclass }: { cls?: CharClass; subclass?: string | null }) {
  if (!cls) return <Hint>Elige una clase en la lista.</Hint>;
  const sub = subclass ? cls.subclasses.find((s) => s.name === subclass) : undefined;
  return (
    <div className="panel p-4">
      <p className="font-display text-lg font-bold" style={{ color: "var(--color-bronze-bright)" }}>{cls.name}</p>
      <p className="eyebrow mt-1 mb-2">{GROUP_LABEL[cls.group]}</p>
      <p className="font-ui text-[13px] leading-relaxed" style={{ color: "var(--color-warm)" }}>{cls.blurb}</p>
      <ul className="space-y-1 mt-2">
        <Trait>Dado de golpe: d{cls.hitDie}</Trait>
        <Trait>Aptitud principal: {cls.primary.map(abbr).join(" / ")}</Trait>
        <Trait>Salvaciones: {cls.saves.map(abbr).join(" / ")}</Trait>
      </ul>
      {sub && (
        <>
          <p className="eyebrow mt-3 mb-1" style={{ color: "var(--color-arcane)" }}>{sub.name}</p>
          <p className="font-ui text-[12px] leading-relaxed" style={{ color: "var(--color-muted)" }}>{sub.blurb}</p>
        </>
      )}
    </div>
  );
}

function BackgroundDetail({ bg }: { bg?: Background }) {
  if (!bg) return <Hint>Elige un trasfondo en la lista.</Hint>;
  return (
    <div className="panel p-4">
      <p className="font-display text-lg font-bold" style={{ color: "var(--color-bronze-bright)" }}>{bg.name}</p>
      <p className="font-ui text-[13px] leading-relaxed mt-2" style={{ color: "var(--color-warm)" }}>{bg.blurb}</p>
      <p className="eyebrow mt-3 mb-1">Pericias</p>
      <p className="font-ui text-[12px]" style={{ color: "var(--color-warm)" }}>{bg.skills.join(", ")}</p>
      <p className="eyebrow mt-3 mb-1">Herramienta</p>
      <p className="font-ui text-[12px]" style={{ color: "var(--color-warm)" }}>{bg.tool}</p>
      <p className="eyebrow mt-3 mb-1">Dote</p>
      <p className="font-ui text-[12px]" style={{ color: "var(--color-warm)" }}>{bg.feat}</p>
    </div>
  );
}

export default function DetailPanel({
  step,
  species,
  cls,
  subclass,
  bg,
}: {
  step: number;
  species?: Species;
  cls?: CharClass;
  subclass?: string | null;
  bg?: Background;
}) {
  if (step === 0) return <SpeciesDetail species={species} />;
  if (step === 1) return <ClassDetail cls={cls} subclass={subclass} />;
  if (step === 2) return <BackgroundDetail bg={bg} />;
  return null;
}
