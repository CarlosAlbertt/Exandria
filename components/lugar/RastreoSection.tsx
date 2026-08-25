"use client";
// «Mirar alrededor»: encontrar trabajo sin que nadie te lo encargue.
//
// ⚠️ **No es `SaberRoll`.** Aquella es Historia/Arcanos/Religión y devuelve lo
// que tu personaje RECUERDA de un sitio. Esta es Percepción/Perspicacia/
// Supervivencia y devuelve lo que hay AHÍ DELANTE. Una mira hacia dentro y la
// otra hacia fuera.
//
// La regla —qué se puede encontrar aquí y con qué total— vive en
// `lib/rastreo.ts`, que es neutro y pasa por el gate. Aquí solo se tira, se
// pinta y se guarda.
//
// ⚠️ **La sección se enseña SIEMPRE, haya algo o no.** Si solo apareciera
// cuando queda algo por descubrir, su mera presencia sería el spoiler: el
// jugador sabría que hay algo antes de tirar. Cuando no hay nada, la tirada
// contesta que no ves nada raro, que es una respuesta legítima.
import { useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { loadActiveCharacter, saveCharacter, type CharacterData } from "@/lib/character";
import { derive } from "@/lib/derive";
import { rollVisual, RESULTADO_MS } from "@/lib/diceBox";
import { roll as rollFallback } from "@/lib/dice";
import { rastrosDe, seEncuentra, PERICIAS_RASTREO, type PericiaRastreo } from "@/lib/rastreo";
import { avisar } from "@/components/Avisos";

/** Lo que este personaje ya buscó, dentro de `play_state`. */
type EstadoRastreo = { vistos: string[]; tirado: string[] };

function leerEstado(play: unknown): EstadoRastreo {
  const o = (play ?? {}) as Record<string, unknown>;
  const r = (o.rastreo ?? {}) as Record<string, unknown>;
  return {
    vistos: Array.isArray(r.vistos) ? (r.vistos as string[]) : [],
    tirado: Array.isArray(r.tirado) ? (r.tirado as string[]) : [],
  };
}

export default function RastreoSection({ nodoId }: { nodoId: string }) {
  const session = useSession();
  const [char, setChar] = useState<(Partial<CharacterData> & { id: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      if (!session?.id) return;
      const c = await loadActiveCharacter(session.id);
      if (on) setChar(c);
    })();
    return () => { on = false; };
  }, [session?.id]);

  // Sin ficha en juego no hay pericias que sumar: el DM no tiene, y quien dejó
  // la creación a medias tampoco.
  if (!char) return null;

  const estado = leerEstado(char.play_state);
  const skills = derive(char as CharacterData).skills;

  async function buscar(pericia: PericiaRastreo) {
    if (busy || !char) return;
    const clave = `${nodoId}|${pericia}`;
    setBusy(true); setMsg(null);

    const mod = skills.find((s) => s.name === pericia)?.mod ?? 0;
    const r = await rollVisual("1d20", { mod, check: true, label: `${pericia} · mirar alrededor`, hold: RESULTADO_MS });
    const total = r ? r.total : ((rollFallback("1d20")?.total ?? 0) + mod);

    // ⚠️ Los rastros se calculan DESPUÉS de tirar, y con el estado de este
    // momento: calcularlos antes y guardarlos en el render dejaría que dos
    // pestañas abiertas encontraran lo mismo dos veces.
    const aquí = rastrosDe(nodoId, estado.vistos).filter((x) => x.pericia === pericia);
    const hallados = aquí.filter((x) => seEncuentra(x, total));

    for (const h of hallados) {
      // La misión la crea el SERVIDOR desde el catálogo, igual que cuando la da
      // un PNJ: el cliente solo manda el slug. Sin `npcId`, que aquí no hay
      // nadie que la encargue.
      const res = await fetch("/api/mision-dialogo", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: h.slug }),
      });
      const d = await res.json().catch(() => null);
      avisar({ tipo: "pista", texto: h.texto });
      if (res.ok && d?.ok && !d.yaLaTenias) {
        avisar({ tipo: "mision-aceptada", titulo: d.titulo ?? h.titulo, recompensa: d.recompensa });
      }
    }

    const siguiente: EstadoRastreo = {
      vistos: Array.from(new Set([...estado.vistos, ...hallados.map((h) => h.slug)])),
      tirado: Array.from(new Set([...estado.tirado, clave])),
    };
    const play = { ...((char.play_state ?? {}) as Record<string, unknown>), rastreo: siguiente };
    await saveCharacter(char.id, { play_state: play });
    setChar({ ...char, play_state: play });

    setMsg(
      hallados.length > 0
        ? `${total}: ${hallados.map((h) => h.texto).join(" ")}`
        : `${total}: miras con calma y no ves nada que no debiera estar.`
    );
    setBusy(false);
  }

  return (
    <section className="mt-6">
      <p className="eyebrow mb-2">
        <i className="fas fa-magnifying-glass mr-2" style={{ color: "var(--color-bronze)" }} />
        Mirar alrededor
      </p>
      <div className="panel-raised p-4 space-y-3">
        {msg && <p className="font-ui text-[13px]" style={{ color: "var(--color-bronze-bright)" }}>{msg}</p>}

        <p className="font-ui text-[12px]" style={{ color: "var(--color-muted)" }}>
          Una tirada de cada por sitio. Lo que encuentres se te apunta como encargo.
        </p>

        <div className="flex flex-wrap gap-2">
          {PERICIAS_RASTREO.map((name) => {
            const s = skills.find((x) => x.name === name);
            const mod = s?.mod ?? 0;
            const hecha = estado.tirado.includes(`${nodoId}|${name}`);
            return (
              <button key={name} onClick={() => buscar(name)} disabled={busy || hecha}
                title={hecha ? "Ya has mirado con esta pericia en este sitio" : undefined}
                className="btn-ghost !py-1.5 !px-3 text-[13px] disabled:opacity-40">
                <i className={`fas ${hecha ? "fa-check" : "fa-dice-d20"} mr-1.5`} />
                {name} {mod >= 0 ? `+${mod}` : mod}
                {s?.proficient && <i className="fas fa-star ml-1.5 text-[9px]" style={{ color: "var(--color-bronze)" }} />}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
