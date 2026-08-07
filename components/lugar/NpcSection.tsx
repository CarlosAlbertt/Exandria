"use client";
import { useEffect, useState } from "react";
import { useAllNpcs, type LocationNpc } from "@/lib/useNpcs";
import { npcsDeNodo } from "@/lib/nodos";
import { poiDeNodo, type Nodo } from "@/data/lugares";
import NpcChat from "@/components/lugar/NpcChat";
import { useChronicle } from "@/lib/useChronicle";
import { useSession } from "@/components/SessionProvider";
import { loadActiveCharacter } from "@/lib/character";
import { aceptarEncargo, entregarMision } from "@/lib/encargo";
import { opcionesDeMision, type OpcionDialogo } from "@/lib/misiones";
import DialogoArbol, { type PulsoTrato } from "@/components/lugar/DialogoArbol";
import { DIALOGOS } from "@/data/dialogos";

// Los PNJ del sitio donde estás, no los del pueblo entero (schema_v25).
//
// Pide TODOS los PNJ y filtra con `npcsDeNodo` en vez de consultar por POI: en
// una franja del bosque **no hay POI del que colgar la consulta**, y son unas
// decenas de filas. La regla de quién sale dónde vive en `lib/nodos.ts`, donde
// el gate puede mirarla.
export default function NpcSection({ nodo, ambient }: { nodo: Nodo; ambient?: string }) {
  const { npcs: todos, ready } = useAllNpcs();
  const npcs = npcsDeNodo(todos, nodo);
  const { quests } = useChronicle();
  const session = useSession();
  const [openId, setOpenId] = useState<number | null>(null);
  const [fichaId, setFichaId] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  // La confianza la resuelve `DialogoArbol`, que es quien tiene el trato, y se
  // pinta aquí porque va junto al retrato: es parte de «quién es», no de lo que
  // está diciendo ahora.
  const [pulso, setPulso] = useState<PulsoTrato | null>(null);

  // La ficha EN JUEGO, como ya hacen SaberRoll, PosadaSection y ShopSection.
  // Sin ella no hay opciones de misión: el DM no tiene ficha.
  useEffect(() => {
    if (!session?.id) { setFichaId(null); return; }
    let on = true;
    loadActiveCharacter(session.id).then((c) => { if (on) setFichaId(c?.id ?? null); });
    return () => { on = false; };
  }, [session?.id]);

  // Cerrar con Escape, como cualquier ventana. Se engancha solo mientras hay
  // una abierta para no dejar un listener global vivo en toda la pantalla.
  useEffect(() => {
    if (openId === null) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") cerrar(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  function cerrar() { setOpenId(null); setAviso(null); setPulso(null); }

  if (!ready || npcs.length === 0) return null;
  const open = npcs.find((n) => n.id === openId) ?? null;

  // Las de misión salen de `lib/misiones.ts`, no de la IA. `useChronicle` es
  // realtime sobre `quests`, así que al aceptar o entregar la opción se
  // recalcula sola y no hay que refrescar nada a mano.
  const misionOpts = open ? opcionesDeMision(quests, open.id, fichaId) : [];
  const poiName = poiDeNodo(nodo.id);

  async function accion(o: Extract<OpcionDialogo, { accion: "aceptar" | "entregar" }>) {
    if (!open) return;
    setAviso(null);
    const r = o.accion === "aceptar" ? await aceptarEncargo(o.questId) : await entregarMision(o.questId, open.id);
    setAviso(r.ok
      ? (o.accion === "aceptar" ? "Encargo aceptado. Lo tienes en la Crónica." : "Misión entregada.")
      : r.error);
  }

  const conArbol = !!open?.dialogo && !!DIALOGOS[open.dialogo];

  return (
    <section>
      <div className="lug-sect"><span className="lug-cinta">Gente del lugar</span></div>

      {/* Los medallones. La imagen que genera la IA es CUADRADA (1024×1024), así
          que el marco es cuadrado: se adapta el diseño a la imagen y no al
          contrario. Sin retrato subido va el icono del sitio dentro del mismo
          marco — un PNJ sin cara sigue siendo alguien con quien hablar. */}
      <div className="lug-row">
        {npcs.map((n) => (
          <button key={n.id} onClick={() => { setOpenId(n.id); setAviso(null); setPulso(null); }} className="lug-med">
            <span className="marco-oro">
              {n.portrait
                ? <img src={n.portrait} alt="" />
                : <span className="sincara"><i className={`fas ${nodo.icono}`} /></span>}
            </span>
            <span className="n">
              {n.name}
              {/* Que tiene algo que contarte: se ve desde el medallón, sin
                  entrar a hablar con los seis PNJ del sitio a ver cuál era. */}
              {opcionesDeMision(quests, n.id, fichaId).length > 0 && (
                <i className="fas fa-circle-exclamation bang" title="Tiene algo para ti" />
              )}
            </span>
            {n.role && <span className="r">{n.role}</span>}
          </button>
        ))}
      </div>

      {/* -------------------------- LA VENTANA --------------------------- */}
      {open && (
        <div className="pnj-scrim" role="dialog" aria-modal="true" aria-labelledby={`pnj-nm-${open.id}`}
          onClick={(e) => { if (e.target === e.currentTarget) cerrar(); }}>
          <div className="pnj-win lug-vell">
            <div className="pnj-izq">
              <span className="marco-oro">
                {open.portrait
                  ? <img src={open.portrait} alt="" />
                  : <span className="sincara"><i className={`fas ${nodo.icono}`} /></span>}
              </span>
              <span className="pnj-quien">
                <div className="pnj-nm" id={`pnj-nm-${open.id}`}>{open.name}</div>
                {open.role && <div className="pnj-rl">{open.role}</div>}
                {/* Solo con conversación escrita: un PNJ que solo habla por IA
                    no tiene trato guardado, y una barra a cero mentiría. */}
                {pulso && (
                  <div className="pnj-tr">
                    <div className="bar" role="img" aria-label={`Confianza ${pulso.pct} de 100`}>
                      <i style={{ width: `${pulso.pct}%`, background: pulso.color }} />
                    </div>
                    <div className="lb">{pulso.texto}</div>
                  </div>
                )}
              </span>
            </div>

            <div className="pnj-talk">
              <div className="pnj-top">
                <span className="pnj-place">
                  <i className={`fas ${nodo.icono}`} style={{ marginRight: 8 }} />
                  {nodo.nombre}{poiName && poiName !== nodo.nombre ? ` · ${poiName}` : ""}
                </span>
                <button className="pnj-x" aria-label="Cerrar" onClick={cerrar}><i className="fas fa-xmark" /></button>
              </div>

              {aviso && <p className="lug-note" style={{ margin: "16px 26px 0" }}>{aviso}</p>}

              {/* La conversación ESCRITA manda cuando la hay: es la que lleva
                  tiradas y consecuencias. La IA se queda debajo para lo que no
                  esté previsto, con el mismo `prompt` del PNJ — es lo único que
                  un árbol no puede hacer. Un PNJ sin `dialogo` va solo con IA. */}
              {conArbol && (
                <DialogoArbol
                  npcId={open.id}
                  clave={open.dialogo!}
                  onCerrar={cerrar}
                  onTrato={setPulso}
                  onPremio={(p) => setAviso(
                    p.tipo === "objeto" ? `Te dan: ${p.name}.`
                    : p.tipo === "oro" ? `Recibes ${p.cantidad} po.`
                    : "Aprendes algo nuevo.",
                  )}
                />
              )}

              {/* Sin árbol, la conversación con la IA es lo que se lee, así que
                  ocupa el cuerpo. Con árbol, el árbol ya llenó el cuerpo y esto
                  es el pie: «o dile lo que quieras». */}
              <div className={conArbol ? "pnj-foot" : "pnj-body"}>
                {conArbol && <span className="rot">O dile lo que quieras</span>}
                <NpcChat pergamino persona={personaFor(open, ambient)} placeholder={`Habla con ${open.name}…`}
                  empty="Salúdale o pregúntale por el lugar." memoryRef={`npc:${open.id}`}
                  conOpciones={!conArbol} misionOpts={misionOpts} onMision={accion} />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function personaFor(n: LocationNpc, ambient?: string): string {
  return `${n.prompt || `Eres ${n.name}${n.role ? `, ${n.role}` : ""}, un personaje del mundo de Exandria.`}\nResponde SIEMPRE en personaje, con brevedad, sin romper la ficción ni revelar que eres una IA.${ambient ? `\n${ambient}` : ""}`;
}
