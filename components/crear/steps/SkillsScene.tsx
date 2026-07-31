"use client";

import { getClass } from "@/data/classes";
import { ABILITIES, SKILLS, esOficio } from "@/data/rules";
import type { Build } from "@/lib/character";

// Escena 5 — Pericias: tres bloques (del trasfondo, fijas | de la clase, a
// elegir | de oficio, cupo aparte). Antes vivía apilada en un carril de 280px;
// a lo ancho caben lado a lado.
//
// Los dos cupos son independientes y se guardan en el MISMO `b.skills`: se
// separan por pertenencia al conjunto de oficios, así que elegir un oficio no
// consume una pericia de clase ni al revés.
export default function SkillsScene({
  b, set, cls, bgSkills, classPool, oficioPool, oficioNeed,
}: {
  b: Build;
  set: (p: Partial<Build>) => void;
  cls: ReturnType<typeof getClass>;
  bgSkills: string[];
  classPool: string[];
  oficioPool: string[];
  oficioNeed: number;
}) {
  const need = cls?.skillCount ?? 0;
  const elegidasClase = b.skills.filter((s) => !esOficio(s));
  const elegidosOficio = b.skills.filter((s) => esOficio(s));

  // Un solo toggle para los dos cupos: cada pericia cuenta contra el suyo.
  const toggle = (s: string) => {
    const has = b.skills.includes(s);
    if (has) { set({ skills: b.skills.filter((x) => x !== s) }); return; }
    const tope = esOficio(s) ? oficioNeed : need;
    const usadas = esOficio(s) ? elegidosOficio.length : elegidasClase.length;
    if (usadas < tope) set({ skills: [...b.skills, s] });
  };
  if (!cls) return <Empty msg="Elige primero una clase." />;
  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-1" style={{ color: "var(--color-parch)" }}>Escoge tus pericias</h2>
      <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
        Tu clase otorga <strong>{need}</strong> pericias a elección y tu trasfondo añade {bgSkills.length}.
        Además eliges <strong>{oficioNeed}</strong> pericia de <strong>oficio</strong>, que va por su cuenta:
        no te quita ninguna de las otras.
      </p>
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="chip inline-block" data-on={elegidasClase.length === need}>Pericias: {elegidasClase.length}/{need}</span>
        <span className="chip inline-block" data-on={elegidosOficio.length === oficioNeed}>Oficio: {elegidosOficio.length}/{oficioNeed}</span>
      </div>

      <div className="scene-boxes">
        <div className="panel p-5">
          <p className="eyebrow mb-2">Del trasfondo (fijas)</p>
          {bgSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {bgSkills.map((s) => <span key={s} className="chip" data-on><i className="fas fa-lock text-[9px] mr-1" />{s}</span>)}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--color-dim)" }}>—</p>
          )}
        </div>

        <div className="panel p-5">
          <p className="eyebrow mb-2">De la clase ({cls.name})</p>
          <div className="flex flex-wrap gap-2">
            {classPool.map((s) => {
              const on = b.skills.includes(s);
              const lleno = !on && elegidasClase.length >= need;
              const ab = SKILLS.find((x) => x.name === s)?.ability;
              return (
                <button key={s} className="chip" data-on={on} onClick={() => toggle(s)}
                  disabled={lleno} style={{ opacity: lleno ? 0.4 : 1 }}>
                  {s} <span className="opacity-60">{ABILITIES.find((a) => a.key === ab)?.abbr}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel p-5">
          <p className="eyebrow mb-1">Oficio ({cls.name})</p>
          <p className="text-[12px] mb-3" style={{ color: "var(--color-dim)" }}>
            Cupo aparte. Aprenderás otro al llegar a nivel 7.
          </p>
          {oficioPool.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {oficioPool.map((s) => {
                const on = b.skills.includes(s);
                const lleno = !on && elegidosOficio.length >= oficioNeed;
                const sk = SKILLS.find((x) => x.name === s);
                // En las de aptitud doble se enseñan las dos: la primera es la
                // que suma competencia.
                const abbr = [sk?.ability, sk?.ability2]
                  .filter(Boolean)
                  .map((k) => ABILITIES.find((a) => a.key === k)?.abbr)
                  .join("–");
                return (
                  <button key={s} className="chip" data-on={on} onClick={() => toggle(s)}
                    disabled={lleno} style={{ opacity: lleno ? 0.4 : 1 }}>
                    {s} <span className="opacity-60">{abbr}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--color-dim)" }}>—</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="panel p-8 text-center" style={{ color: "var(--color-dim)" }}><i className="fas fa-triangle-exclamation mr-2" />{msg}</div>;
}
