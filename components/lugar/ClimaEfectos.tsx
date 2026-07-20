"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { loadActiveCharacter } from "@/lib/character";
import { EFECTOS, efectosPara, esDuro, type Weather, type PersonajeClima } from "@/lib/weather";

// Consecuencias en mesa del clima duro. Muestra lo que te afecta y, aparte, lo
// que te saltas por ser quien eres (Explorador, Guía, Goliat, Supervivencia…).
// Si el tiempo es llevadero no pinta nada.
export default function ClimaEfectos({ weather }: { weather: Weather }) {
  const session = useSession();
  const [pj, setPj] = useState<PersonajeClima | null>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      if (!session?.id) return;
      const c = await loadActiveCharacter(session.id);
      if (on && c) setPj({ cls: c.cls, background: c.background, species: c.species, skills: c.skills ?? [] });
    })();
    return () => { on = false; };
  }, [session?.id]);

  if (!esDuro(weather)) return null;
  const { afectan, exentos } = efectosPara(weather, pj);

  return (
    <section className="mb-5">
      <div className="panel-raised p-4 space-y-3" style={{ borderColor: afectan.length ? "var(--color-ember)" : "var(--color-line)" }}>
        <p className="eyebrow" style={{ color: afectan.length ? "var(--color-ember)" : "var(--color-primitivo)" }}>
          <i className="fas fa-triangle-exclamation mr-1.5" />
          {afectan.length ? "El tiempo aprieta" : "El tiempo aprieta, pero a ti no"}
        </p>

        {afectan.map((e) => {
          const info = EFECTOS[e];
          return (
            <div key={e} className="flex items-start gap-2.5">
              <i className={`fas ${info.icon} mt-0.5`} style={{ color: info.color }} />
              <div className="min-w-0">
                <p className="font-ui text-[13px] font-bold" style={{ color: "var(--color-parch)" }}>{info.label}</p>
                <p className="font-ui text-[12px]" style={{ color: "var(--color-muted)" }}>{info.regla}</p>
              </div>
            </div>
          );
        })}

        {exentos.length > 0 && (
          <div className="pt-2" style={{ borderTop: afectan.length ? "1px solid var(--color-line)" : undefined }}>
            {exentos.map(({ efecto, motivo }) => (
              <p key={efecto} className="font-ui text-[12px] flex items-start gap-2" style={{ color: "var(--color-primitivo)" }}>
                <i className="fas fa-shield-heart mt-0.5" />
                <span><strong>{EFECTOS[efecto].label}</strong> no te afecta — {motivo}.</span>
              </p>
            ))}
          </div>
        )}

        {!pj && (
          <p className="font-ui text-[11px] italic" style={{ color: "var(--color-dim)" }}>
            Sin ficha en juego no se puede comprobar si te libras de algo.
          </p>
        )}
      </div>
    </section>
  );
}
