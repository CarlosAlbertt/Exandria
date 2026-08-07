"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { useSession } from "@/components/SessionProvider";
import { loadActiveCharacter, type Item } from "@/lib/character";
import { derive } from "@/lib/derive";
import { rollVisual } from "@/lib/diceBox";
import { DIALOGOS } from "@/data/dialogos";
import {
  leerTrato, resolver, opcionDisponible, tonoConfianza, etapaVigente,
  type TratoPnj, type Premio,
} from "@/lib/dialogo";

const TONO: Record<ReturnType<typeof tonoConfianza>, string> = {
  hostil: "var(--color-ember)",
  neutral: "var(--color-bronze)",
  amistoso: "var(--color-primitivo)",
};

/**
 * La conversación ESCRITA de un PNJ: opciones con su CD, éxito y fracaso
 * distintos, confianza y etapas.
 *
 * Toda la decisión —si acierta, cuánta confianza mueve, qué se entrega, a qué
 * etapa salta— vive en `lib/dialogo.ts`, donde el gate puede mirarla. Aquí solo
 * se pinta y se persiste.
 *
 * ⚠️ **La tirada la hace el tablero 3D de la app** (`rollVisual`), no se teclea:
 * el modificador sale de las pericias de la ficha, así que no hay que fiarse de
 * lo que alguien escriba ni obligarle a sumar. Si el tablero no está disponible
 * —navegador sin WebGL—, se cae a un campo para escribir el total, que es mejor
 * que dejar la conversación bloqueada.
 */
export default function DialogoArbol({
  npcId, clave, onCerrar, onPremio,
}: {
  npcId: number;
  clave: string;
  onCerrar: () => void;
  onPremio?: (p: Premio) => void;
}) {
  const arbol = DIALOGOS[clave];
  const session = useSession();
  const [charId, setCharId] = useState<string | null>(null);
  const [mods, setMods] = useState<Record<string, number>>({});
  const [trato, setTrato] = useState<TratoPnj | null>(null);
  const [dicho, setDicho] = useState<string | null>(null);
  const [tirando, setTirando] = useState<number | null>(null);
  const [manual, setManual] = useState("");
  const playRef = useRef<Record<string, unknown>>({});

  // Carga la ficha: de ella salen los modificadores de pericia y el trato
  // guardado con este PNJ.
  useEffect(() => {
    if (!session?.id || !arbol) return;
    let on = true;
    void loadActiveCharacter(session.id).then((c) => {
      if (!on || !c) { setTrato(leerTrato(undefined, arbol)); return; }
      setCharId(c.id);
      const play = (c.play_state as Record<string, unknown>) ?? {};
      playRef.current = play;
      const pnj = (play.pnj as Record<string, unknown>) ?? {};
      setTrato(leerTrato(pnj[`npc:${npcId}`], arbol));
      const d = derive(c as Parameters<typeof derive>[0]);
      setMods(Object.fromEntries(d.skills.map((s) => [s.name, s.mod])));
    });
    return () => { on = false; };
  }, [session?.id, npcId, arbol]);

  /**
   * ⚠️ Se RELEE `play_state` antes de escribir y se fusiona. Ahí viven también
   * los PG, las condiciones y los usos de clase: escribir el objeto que esta
   * pantalla tenía en memoria borraría lo que el combate hubiera movido
   * mientras se hablaba. Es lo mismo que hace el cupo del caldero.
   */
  const guardar = useCallback(async (t: TratoPnj) => {
    if (!supabaseConfigured || !charId) return;
    const supabase = createClient();
    const { data } = await supabase.from("characters").select("play_state").eq("id", charId).maybeSingle();
    const prev = (data?.play_state as Record<string, unknown>) ?? {};
    const pnj = { ...((prev.pnj as Record<string, unknown>) ?? {}), [`npc:${npcId}`]: t };
    await supabase.from("characters")
      .update({ play_state: { ...prev, pnj }, updated_at: new Date().toISOString() })
      .eq("id", charId);
  }, [charId, npcId]);

  // Entregar el premio. La regla de CUÁNDO ya la decidió `resolver`; aquí solo
  // se aplica lo que venga.
  const entregar = useCallback(async (p: Premio) => {
    onPremio?.(p);
    if (!supabaseConfigured || !charId) return;
    const supabase = createClient();
    const { data } = await supabase.from("characters").select("items, gold, lore_unlocked").eq("id", charId).maybeSingle();
    if (!data) return;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (p.tipo === "objeto") {
      const items: Item[] = Array.isArray(data.items) ? [...(data.items as Item[])] : [];
      const ex = items.find((x) => x.name === p.name && !x.doc);
      if (ex) ex.qty += p.qty ?? 1;
      else items.push({ id: crypto.randomUUID(), name: p.name, qty: p.qty ?? 1, notes: p.notes });
      patch.items = items;
    } else if (p.tipo === "oro" && p.cantidad > 0) {
      patch.gold = ((data.gold as number) ?? 0) + p.cantidad;
    } else if (p.tipo === "saber" && p.ids.length > 0) {
      const prev = Array.isArray(data.lore_unlocked) ? (data.lore_unlocked as string[]) : [];
      patch.lore_unlocked = Array.from(new Set([...prev, ...p.ids]));
    } else return;
    await supabase.from("characters").update(patch).eq("id", charId);
  }, [charId, onPremio]);

  const aplicar = useCallback(async (indice: number, total: number | null) => {
    if (!trato || !arbol) return;
    const r = resolver(arbol, trato, indice, total);
    setTirando(null); setManual("");
    if (!r) return;
    setTrato(r.trato);
    setDicho(r.texto);
    void guardar(r.trato);
    if (r.premio) void entregar(r.premio);
    if (r.cierra) setTimeout(onCerrar, 1200);
  }, [trato, arbol, guardar, entregar, onCerrar]);

  if (!arbol || !trato) return null;

  // Una etapa cuya confianza ya no da se cae sola: el PNJ deja de tratarte como
  // te trataba. La regla vive en `lib/dialogo.ts`.
  const claveEtapa = etapaVigente(arbol, trato);
  const etapa = arbol.etapas[claveEtapa];
  if (!etapa) return null;
  const tono = tonoConfianza(trato.confianza);

  async function elegir(i: number) {
    const opt = etapa.opciones[i];
    if (!opt || tirando !== null) return;
    if (!opt.chequeo) { void aplicar(i, null); return; }
    setTirando(i);
    const mod = mods[opt.chequeo.pericia] ?? 0;
    const res = await rollVisual("1d20", { mod, check: true, label: `${opt.chequeo.pericia} (CD ${opt.chequeo.cd})` });
    // Sin tablero (WebGL caído) se deja escribir el total en vez de bloquear.
    if (res) void aplicar(i, res.total);
  }

  return (
    <div className="space-y-3">
      {/* Confianza: lectura de un vistazo de cómo te llevas con él. */}
      <div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--color-night)", border: "1px solid var(--color-line)" }}>
          <div className="h-full transition-all duration-500" style={{ width: `${trato.confianza}%`, background: TONO[tono] }} />
        </div>
        <p className="font-ui text-[10px] mt-1" style={{ color: "var(--color-dim)" }}>
          {tono === "hostil" ? "Desconfía de ti" : tono === "amistoso" ? "Te tiene aprecio" : "Ni frío ni calor"}
        </p>
      </div>

      <p className="font-body text-[14px] leading-relaxed whitespace-pre-wrap px-3 py-2 rounded-2xl"
        style={{ background: "var(--color-night)", border: "1px solid var(--color-line)", color: "var(--color-warm)" }}>
        {dicho ?? etapa.saludo}
      </p>

      {tirando !== null ? (
        <ManualRoll
          opt={etapa.opciones[tirando]!}
          valor={manual}
          onValor={setManual}
          onConfirmar={() => { const n = parseInt(manual, 10); if (!Number.isNaN(n)) void aplicar(tirando, n); }}
          onCancelar={() => { setTirando(null); setManual(""); }}
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          {etapa.opciones.map((o, i) => {
            const viva = opcionDisponible(trato!, claveEtapa, i);
            return (
              <button key={i} onClick={() => elegir(i)} disabled={!viva}
                title={viva ? undefined : "Ya lo intentaste y salió mal"}
                className="text-left px-3 py-2 rounded-2xl font-body text-[14px] transition-colors disabled:opacity-30 disabled:line-through"
                style={{ background: "var(--color-raised)", border: "1px solid var(--color-line)", color: "var(--color-parch)" }}>
                {o.chequeo && (
                  <span className="font-ui text-[11px] font-bold mr-2" style={{ color: "var(--color-arcane)" }}>
                    [{o.chequeo.pericia} CD {o.chequeo.cd}
                    {mods[o.chequeo.pericia] != null && ` · tu ${mods[o.chequeo.pericia] >= 0 ? "+" : ""}${mods[o.chequeo.pericia]}`}]
                  </span>
                )}
                {o.texto}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * El campo para escribir el total a mano.
 *
 * Es el **respaldo**, no el camino: sale mientras el tablero 3D está tirando, y
 * es la única salida si el navegador no lo soporta. Sin él, quien no pueda
 * lanzar dados se quedaría con la conversación bloqueada a mitad.
 */
function ManualRoll({
  opt, valor, onValor, onConfirmar, onCancelar,
}: {
  opt: { chequeo?: { pericia: string; cd: number } };
  valor: string;
  onValor: (v: string) => void;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <div className="panel-raised p-3 space-y-2">
      <p className="font-ui text-[13px] font-bold" style={{ color: "var(--color-bronze-bright)" }}>
        <i className="fas fa-dice-d20 mr-2" />Tirada de {opt.chequeo?.pericia} · CD {opt.chequeo?.cd}
      </p>
      <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
        Se está lanzando en el tablero. Si no te sale, escribe aquí el total de tus dados.
      </p>
      <div className="flex gap-2">
        <input type="number" value={valor} onChange={(e) => onValor(e.target.value)} placeholder="0"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onConfirmar(); } }}
          className="w-24 text-center bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[15px] font-bold outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]"
          style={{ color: "var(--color-warm)" }} />
        <button onClick={onConfirmar} disabled={!valor.trim()} className="btn-gold !py-2 !px-3 text-[12px] flex-1 disabled:opacity-40">Confirmar</button>
        <button onClick={onCancelar} className="btn-ghost !py-2 !px-3 text-[12px]"><i className="fas fa-xmark" /></button>
      </div>
    </div>
  );
}
