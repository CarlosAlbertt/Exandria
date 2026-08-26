"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { loadActiveCharacter, saveCharacter, type CharacterData } from "@/lib/character";
import { derive } from "@/lib/derive";
import { rollVisual, RESULTADO_MS } from "@/lib/diceBox";
import { roll as rollFallback } from "@/lib/dice";
import { useCadaveres } from "@/lib/useCadaveres";
import { despieceDe, piezasDe } from "@/data/despiece";
import { ALL_MONSTERS } from "@/data/bestiary";
import { OFICIO_PERICIA } from "@/lib/materiales";
import { avisar } from "@/components/Avisos";
import {
  cdDespiece, aciertaCorte, puedeAbrir, faltanHerramientas,
  HERRAMIENTAS_EXTRACCION, type Cadaver,
} from "@/lib/extraccion";

// Despiezar un cadáver **en el sitio, con el bicho fresco** (decisión del DM del
// 2026-08-02). No se arrastra el cadáver al taller: por eso esto vive en
// `/lugar` y no en `/taller`, aunque Extracción sea el séptimo oficio.
//
// ⚠️ **El cadáver es un saldo que se gasta, y ahí está toda la tensión.** En los
// seis talleres se tira una vez y lo que salga salió. Aquí ves cuántas piezas
// quedan y **cada fallo se lleva una**: llevas dos buenas, queda una, y decides
// si la intentas o te vas. Ese «o te vas» es lo único que ningún otro taller
// tiene, y por eso hay botón de retirarse.
//
// Las reglas viven todas en `lib/extraccion.ts`, que es neutro y lo mira
// `scripts/check-despiece.ts`. Aquí solo se pinta y se tira el dado.

const PERICIA = OFICIO_PERICIA.extraccion;

export default function DespieceSection({ nodoId }: { nodoId: string }) {
  const session = useSession();
  const { cadaveres, ready, gastar } = useCadaveres();
  const [char, setChar] = useState<(Partial<CharacterData> & { id: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  /** Lo que se lleva de ESTE cadáver, sin guardar todavía. */
  const [bolsa, setBolsa] = useState<{ id: string; piezas: string[] } | null>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      if (!session?.id) return;
      const c = await loadActiveCharacter(session.id);
      if (on) setChar(c);
    })();
    return () => { on = false; };
  }, [session?.id]);

  if (!char || !ready) return null;

  const aqui = cadaveres.filter((c) => c.lugar === nodoId && c.restantes > 0);

  // ⚠️ **Sin cadáveres no se pinta nada, y es lo contrario de lo que se hizo con
  // «Ponerse en camino».** Allí el vacío se explica porque el viaje siempre es
  // posible en principio y su ausencia parecía un fallo. Aquí no haber cadáveres
  // es lo NORMAL —el bosque no está lleno de bichos recién muertos— y una caja
  // permanente diciendo «no hay nada que despiezar» sería ruido en cada pantalla.
  if (aqui.length === 0) return null;

  const skills = derive(char as CharacterData).skills;
  const mod = skills.find((s) => s.name === PERICIA)?.mod ?? 0;
  const tieneCompetencia = skills.find((s) => s.name === PERICIA)?.proficient ?? false;

  // Las herramientas se exigen DISPONIBLES y no se gastan (decisión 4 del DM).
  const inventario = (Array.isArray(char.items) ? char.items : []).map((i) => (i as { name: string }).name);
  const faltan = faltanHerramientas(inventario);
  const conHerramientas = puedeAbrir(inventario);

  async function cortar(c: Cadaver) {
    if (busy || !char) return;
    const monstruo = ALL_MONSTERS.find((m) => m.slug === c.slug);
    if (!monstruo) return;
    setBusy(true); setMsg(null);

    const cd = cdDespiece(monstruo.cr);
    const r = await rollVisual("1d20", { mod, check: true, label: `${PERICIA} · ${monstruo.name}`, hold: RESULTADO_MS });
    const total = r ? r.total : ((rollFallback("1d20")?.total ?? 0) + mod);
    const bien = aciertaCorte(total, cd);

    // La pieza sale de la tabla del monstruo. Un cadáver puede dar cuatro piezas
    // de una tabla de dos: repite, y eso es correcto.
    const tabla = despieceDe(monstruo);
    const pieza = tabla[Math.floor(Math.random() * tabla.length)] ?? tabla[0];

    // ⚠️ Gane o pierda, el cadáver pierde una pieza. La regla vive en
    // `gastarPiezaDe` y el hook la aplica; aquí solo se llama.
    await gastar(c.id);

    if (bien) {
      const previa = bolsa?.id === c.id ? bolsa.piezas : [];
      setBolsa({ id: c.id, piezas: [...previa, pieza] });
      setMsg(`${total} contra CD ${cd}: sacas ${pieza}.`);
    } else {
      setMsg(`${total} contra CD ${cd}: el corte estropea la pieza.`);
    }
    setBusy(false);
  }

  // Guardar lo llevado en la ficha. Se hace al retirarse y no pieza a pieza para
  // que «retirarse» signifique algo: hasta entonces lo tienes en las manos.
  async function retirar() {
    if (!char || !bolsa || bolsa.piezas.length === 0) { setBolsa(null); return; }
    const items = Array.isArray(char.items) ? char.items : [];
    const nuevos = [...items, ...bolsa.piezas.map((name) => ({ name, qty: 1 }))];
    await saveCharacter(char.id, { items: nuevos } as Partial<CharacterData>);
    setChar({ ...char, items: nuevos } as typeof char);
    avisar({ tipo: "saber", cuantas: bolsa.piezas.length });
    setMsg(`Te llevas ${bolsa.piezas.length} pieza(s).`);
    setBolsa(null);
  }

  return (
    <section className="mt-6">
      <p className="eyebrow mb-2">
        <i className="fas fa-hand-scissors mr-2" style={{ color: "var(--color-bronze)" }} />Despiezar
      </p>
      <div className="panel-raised p-4 space-y-3">
        {msg && <p className="font-ui text-[13px]" style={{ color: "var(--color-bronze-bright)" }}>{msg}</p>}

        {!conHerramientas && (
          <p className="font-ui text-[12px]" style={{ color: "var(--color-ember)" }}>
            Sin {faltan.join(" y ")} no puedes abrir nada. Se piden en el inventario y no se gastan.
          </p>
        )}

        <p className="font-ui text-[12px]" style={{ color: "var(--color-muted)" }}>
          {PERICIA} {mod >= 0 ? `+${mod}` : mod}{tieneCompetencia ? " (competente)" : ""}.
          {" "}Cada intento se lleva una pieza, salga o no salga.
        </p>

        {aqui.map((c) => {
          const m = ALL_MONSTERS.find((x) => x.slug === c.slug);
          if (!m) return null;
          const llevo = bolsa?.id === c.id ? bolsa.piezas : [];
          return (
            <div key={c.id} className="panel-raised p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-ui text-[13px] font-semibold" style={{ color: "var(--color-warm)" }}>
                  {m.name}
                </span>
                <span className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
                  quedan {c.restantes} · CD {cdDespiece(m.cr)} · tabla de {piezasDe(m.cr, m.size)}
                </span>
              </div>

              {llevo.length > 0 && (
                <p className="font-ui text-[12px]" style={{ color: "var(--color-bronze-bright)" }}>
                  En las manos: {llevo.join(", ")}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <button onClick={() => void cortar(c)} disabled={busy || !conHerramientas}
                  className="btn-gold !py-1.5 !px-3 text-[13px] disabled:opacity-40">
                  <i className="fas fa-dice-d20 mr-1.5" />Cortar
                </button>
                {/* El botón que ningún otro taller tiene. */}
                <button onClick={() => void retirar()} disabled={busy || llevo.length === 0}
                  className="btn-ghost !py-1.5 !px-3 text-[13px] disabled:opacity-40">
                  <i className="fas fa-hand-holding mr-1.5" />Retirarme con {llevo.length}
                </button>
              </div>
            </div>
          );
        })}

        <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
          Herramientas: {HERRAMIENTAS_EXTRACCION.join(", ")}.
        </p>
      </div>
    </section>
  );
}
