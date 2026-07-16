"use client";

import { getClass } from "@/data/classes";
import { ABILITIES, SKILLS } from "@/data/rules";
import type { Build } from "@/app/crear/page";

// Escena 5 — Pericias: dos bloques en paralelo (del trasfondo, fijas | de la
// clase, a elegir). Antes vivía apilada en un carril de 280px; a lo ancho
// caben los dos bloques lado a lado.
export default function SkillsScene({
  b, set, cls, bgSkills, classPool,
}: {
  b: Build;
  set: (p: Partial<Build>) => void;
  cls: ReturnType<typeof getClass>;
  bgSkills: string[];
  classPool: string[];
}) {
  const need = cls?.skillCount ?? 0;
  const toggle = (s: string) => {
    const has = b.skills.includes(s);
    if (has) set({ skills: b.skills.filter((x) => x !== s) });
    else if (b.skills.length < need) set({ skills: [...b.skills, s] });
  };
  if (!cls) return <Empty msg="Elige primero una clase." />;
  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-1" style={{ color: "var(--color-parch)" }}>Escoge tus pericias</h2>
      <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
        Tu clase otorga <strong>{need}</strong> pericias a elección. Tu trasfondo añade {bgSkills.length}.
      </p>
      <span className="chip mb-6 inline-block" data-on={b.skills.length === need}>Elegidas: {b.skills.length}/{need}</span>

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
              const ab = SKILLS.find((x) => x.name === s)?.ability;
              return (
                <button key={s} className="chip" data-on={on} onClick={() => toggle(s)}
                  disabled={!on && b.skills.length >= need}
                  style={{ opacity: !on && b.skills.length >= need ? 0.4 : 1 }}>
                  {s} <span className="opacity-60">{ABILITIES.find((a) => a.key === ab)?.abbr}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="panel p-8 text-center" style={{ color: "var(--color-dim)" }}><i className="fas fa-triangle-exclamation mr-2" />{msg}</div>;
}
