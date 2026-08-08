"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { useSession } from "@/components/SessionProvider";
import { loadActiveCharacter, type Item } from "@/lib/character";
import { derive } from "@/lib/derive";
import { rollVisual, isDiceBoxSupported } from "@/lib/diceBox";
import { DIALOGOS } from "@/data/dialogos";
import { avisar } from "@/components/Avisos";
import {
  leerTrato, resolver, opcionDisponible, tonoConfianza, etapaVigente,
  type TratoPnj, type Premio,
} from "@/lib/dialogo";

/**
 * El color de la barra de confianza, **en tokens del tema de la hoja** y no en
 * los de la app: la barra vive sobre pergamino claro, y el bronce de
 * `--color-bronze` sobre papel casi no se ve.
 */
const TONO: Record<ReturnType<typeof tonoConfianza>, string> = {
  hostil: "var(--acento)",
  neutral: "var(--metal-hondo)",
  amistoso: "var(--natura)",
};

const TEXTO_TONO: Record<ReturnType<typeof tonoConfianza>, string> = {
  hostil: "Desconfía de ti",
  neutral: "Ni frío ni calor",
  amistoso: "Te tiene aprecio",
};

/** Lo que la ventana necesita saber del trato para pintarlo junto al retrato. */
export type PulsoTrato = { pct: number; color: string; texto: string };

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
 * lo que alguien escriba ni obligarle a sumar. Mientras rueda, la ventana
 * enseña un d20 girando con la pericia y la CD — el campo para escribir el
 * total **solo aparece si el tablero no puede lanzar** (navegador sin WebGL, o
 * `prefers-reduced-motion`), que es mejor que dejar la conversación bloqueada.
 */
export default function DialogoArbol({
  npcId, clave, onCerrar, onPremio, onTrato, onMision,
}: {
  npcId: number;
  clave: string;
  onCerrar: () => void;
  onPremio?: (p: Premio) => void;
  /** Para que la ventana pinte la confianza junto al retrato, que es donde va. */
  onTrato?: (p: PulsoTrato) => void;
  /** Se abrió una misión del catálogo hablando con este PNJ. */
  onMision?: (info: { titulo: string; recompensa: string; yaLaTenias: boolean }) => void;
}) {
  const arbol = DIALOGOS[clave];
  const session = useSession();
  const [charId, setCharId] = useState<string | null>(null);
  const [mods, setMods] = useState<Record<string, number>>({});
  const [trato, setTrato] = useState<TratoPnj | null>(null);
  const [dicho, setDicho] = useState<string | null>(null);
  const [tirando, setTirando] = useState<number | null>(null);
  const [manual, setManual] = useState("");
  // El campo de escribir el total. Es el RESPALDO, y por eso es un estado
  // aparte de `tirando`: mientras el tablero rueda no se ofrece, o el jugador
  // teclearía un número mientras sus dados están en el aire.
  const [manualAbierto, setManualAbierto] = useState(false);
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

  // La confianza se pinta ARRIBA, junto al retrato: es parte de «quién es»,
  // no de lo que está diciendo ahora. El trato vive aquí porque aquí se
  // resuelve, así que se avisa hacia arriba.
  //
  // ⚠️ El callback va por ref y NO en las dependencias. La ventana lo pasa como
  // arrow inline: en las dependencias cambiaría en cada render y el efecto se
  // dispararía en bucle.
  const onTratoRef = useRef(onTrato);
  useEffect(() => { onTratoRef.current = onTrato; }, [onTrato]);
  useEffect(() => {
    if (!trato) return;
    const t = tonoConfianza(trato.confianza);
    onTratoRef.current?.({ pct: trato.confianza, color: TONO[t], texto: TEXTO_TONO[t] });
  }, [trato]);

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
    // ⚠️ El premio entraba en la bolsa SIN QUE NADIE SE ENTERARA: el objeto
    // aparecía en el inventario tres pantallas más allá y el oro cambiaba solo.
    if (p.tipo === "objeto") avisar({ tipo: "objeto", name: p.name, qty: p.qty });
    else if (p.tipo === "oro") avisar({ tipo: "oro", cantidad: p.cantidad });
    else if (p.tipo === "saber" && p.ids.length > 0) avisar({ tipo: "saber", cuantas: p.ids.length });
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

  /**
   * Abre la misión que acaba de dar el PNJ.
   *
   * ⚠️ **Esto faltaba entero.** `resolver()` devolvía `mision` desde el primer
   * día y aquí se tiraba: el jugador aceptaba el encargo, el PNJ se lo decía, y
   * no se creaba ninguna fila en `quests`. La misión no aparecía en la Crónica
   * ni existía para nadie.
   *
   * Va por `/api/mision-dialogo` y no por el cliente porque `quests` es DM-only
   * por RLS, y porque el TEXTO tiene que ponerlo el servidor desde el catálogo:
   * si lo mandara el cliente, cualquiera se escribiría su propia recompensa.
   */
  const abrirMision = useCallback(async (slug: string) => {
    const r = await fetch("/api/mision-dialogo", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, npcId }),
    });
    const d = await r.json().catch(() => null);
    if (!r.ok || !d?.ok) return;
    if (d.yaLaTenias) avisar({ tipo: "mision-ya-la-tenias", titulo: d.titulo ?? "" });
    else avisar({ tipo: "mision-aceptada", titulo: d.titulo ?? "", recompensa: d.recompensa });
    onMision?.({
      titulo: d.titulo ?? "", recompensa: d.recompensa ?? "", yaLaTenias: d.yaLaTenias === true,
    });
  }, [npcId, onMision]);

  const aplicar = useCallback(async (indice: number, total: number | null) => {
    if (!trato || !arbol) return;
    const r = resolver(arbol, trato, indice, total);
    setTirando(null); setManual(""); setManualAbierto(false);
    if (!r) return;
    setTrato(r.trato);
    setDicho(r.texto);
    void guardar(r.trato);
    if (r.premio) void entregar(r.premio);
    if (r.mision) void abrirMision(r.mision);
    if (r.cierra) setTimeout(onCerrar, 1200);
  }, [trato, arbol, guardar, entregar, abrirMision, onCerrar]);

  if (!arbol || !trato) return null;

  // Una etapa cuya confianza ya no da se cae sola: el PNJ deja de tratarte como
  // te trataba. La regla vive en `lib/dialogo.ts`.
  const claveEtapa = etapaVigente(arbol, trato);
  const etapa = arbol.etapas[claveEtapa];
  if (!etapa) return null;

  async function elegir(i: number) {
    const opt = etapa.opciones[i];
    if (!opt || tirando !== null) return;
    if (!opt.chequeo) { void aplicar(i, null); return; }
    setTirando(i);
    // Sin tablero, el campo desde el primer momento: enseñar un d20 girando que
    // no va a resolver nunca dejaría la ventana colgada sin decir por qué.
    const soporta = isDiceBoxSupported();
    setManualAbierto(!soporta);
    const mod = mods[opt.chequeo.pericia] ?? 0;
    const res = await rollVisual("1d20", { mod, check: true, label: `${opt.chequeo.pericia} (CD ${opt.chequeo.cd})` });
    if (res) { void aplicar(i, res.total); return; }
    // El tablero se soportaba pero no dio resultado (ya había otra tirada
    // esperando lanzamiento, o el jugador la cerró): respaldo, no bloqueo.
    setManualAbierto(true);
  }

  const opt = tirando !== null ? etapa.opciones[tirando] : undefined;

  return (
    <>
      {/* Lo que dice, con su calderón. */}
      <div className="pnj-body">
        <p className="lug-say"><span className="cald">¶</span>{dicho ?? etapa.saludo}</p>
      </div>

      {/* Rodando en la mesa: el d20 gira aquí y los dados de verdad están en el
          tablero 3D. La tirada NO se teclea. */}
      {tirando !== null && !manualAbierto && (
        <div className="lug-tirando" role="status">
          <i className="fas fa-dice-d20 d20" />
          <div className="q">{opt?.chequeo?.pericia} · CD {opt?.chequeo?.cd}</div>
          <div className="s">Los dados están rodando en la mesa…</div>
        </div>
      )}

      {tirando !== null && manualAbierto && (
        <ManualRoll
          opt={etapa.opciones[tirando]!}
          valor={manual}
          onValor={setManual}
          onConfirmar={() => { const n = parseInt(manual, 10); if (!Number.isNaN(n)) void aplicar(tirando, n); }}
          onCancelar={() => { setTirando(null); setManual(""); setManualAbierto(false); }}
        />
      )}

      {tirando === null && (
        <div className="lug-opts">
          {etapa.opciones.map((o, i) => {
            const viva = opcionDisponible(trato!, claveEtapa, i);
            const mod = o.chequeo ? mods[o.chequeo.pericia] : undefined;
            return (
              <button key={i} onClick={() => elegir(i)} disabled={!viva} className="lug-opt"
                title={viva ? undefined : "Ya lo intentaste y salió mal"}>
                {o.chequeo && (
                  <span className="lug-cd">
                    <i className="fas fa-dice-d20" />
                    {o.chequeo.pericia} CD {o.chequeo.cd}
                    {mod != null && ` · tu ${mod >= 0 ? "+" : ""}${mod}`}
                  </span>
                )}
                {o.texto}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

/**
 * El campo para escribir el total a mano.
 *
 * Es el **respaldo, y solo el respaldo**: sale cuando el tablero 3D no puede
 * lanzar —sin WebGL, o con `prefers-reduced-motion`— o cuando lanzó y no dio
 * resultado. Con tablero lo que se ve es el d20 girando, no esto. Sin él, quien
 * no pueda lanzar dados se quedaría con la conversación bloqueada a mitad.
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
    <div className="lug-tirando" style={{ textAlign: "left" }}>
      <p className="q" style={{ marginTop: 0 }}>
        <i className="fas fa-dice-d20 mr-2" />Tirada de {opt.chequeo?.pericia} · CD {opt.chequeo?.cd}
      </p>
      <p className="s">Este navegador no puede lanzar en la mesa. Escribe aquí el total de tus dados.</p>
      <div className="flex gap-2 mt-3">
        <input type="number" inputMode="numeric" value={valor} onChange={(e) => onValor(e.target.value)} placeholder="0"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onConfirmar(); } }}
          aria-label="Total de tus dados"
          className="lug-campo w-24 text-center" style={{ fontStyle: "normal", fontWeight: 700 }} />
        <button onClick={onConfirmar} disabled={!valor.trim()} className="lug-enviar flex-1">Confirmar</button>
        <button onClick={onCancelar} className="pnj-x" aria-label="Dejarlo"><i className="fas fa-xmark" /></button>
      </div>
    </div>
  );
}
