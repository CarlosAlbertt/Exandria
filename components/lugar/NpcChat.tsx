"use client";
import { useEffect, useRef, useState } from "react";
import { narrar, type Msg } from "@/lib/narrador";
import { useSession } from "@/components/SessionProvider";
import { loadMemory, saveMemory } from "@/lib/useNpcMemory";
import { parseOpciones, INSTRUCCION_OPCIONES, type OpcionDialogo } from "@/lib/misiones";

// Chat IA reutilizable (tendero, PNJ…). persona = personalidad/contexto para
// el system prompt; la IA responde en personaje.
// memoryRef (opcional, Fase M): si se pasa, el NPC recuerda entre visitas —
// carga el resumen del jugador al abrir (se inyecta al prompt) y, al cerrar
// (desmontar) con conversación, la IA la resume y persiste.
//
// OPCIONES DE DIÁLOGO (schema_v24), y tienen DOS orígenes que se ven igual:
// - Las de conversación las propone la IA en un bloque al final de su respuesta
//   (`parseOpciones` lo recorta). Son sabor: al pulsarlas se mandan como si las
//   hubieras escrito. Se piden solo si `conOpciones`, para no cambiarle el
//   prompt al tendero de `ShopSection`, que no las usa.
// - Las de MISIÓN llegan por `misionOpts`, calculadas por quien nos monta a
//   partir del estado de `quests`. ⚠️ No salen del modelo a propósito: si la
//   opción de entregar dependiera de que la IA se acordara, la misión no se
//   podría cerrar unas veces y se cerraría sin hacerla otras.
export default function NpcChat({
  persona, placeholder = "Escribe…", empty = "Salúdale.", memoryRef,
  conOpciones = false, misionOpts = [], onMision,
}: {
  persona: string; placeholder?: string; empty?: string; memoryRef?: string;
  conOpciones?: boolean;
  misionOpts?: OpcionDialogo[];
  onMision?: (o: Extract<OpcionDialogo, { accion: "aceptar" | "entregar" }>) => void | Promise<void>;
}) {
  const session = useSession();
  const userId = session?.id ?? null;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [memory, setMemory] = useState("");
  // Las que propuso la IA en su último turno. Se vacían al mandar algo: son de
  // ESE momento de la conversación y dejarlas puestas ofrecería contestar a lo
  // que el PNJ ya no está diciendo.
  const [sugeridas, setSugeridas] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // Refs con los valores vivos para el guardado en el desmontaje (cleanup).
  const msgsRef = useRef<Msg[]>([]);
  const memRef = useRef("");
  msgsRef.current = messages;
  memRef.current = memory;

  // Carga el recuerdo del jugador con este NPC.
  useEffect(() => {
    if (!memoryRef || !userId) return;
    let on = true;
    loadMemory(memoryRef, userId).then((s) => { if (on) setMemory(s); });
    return () => { on = false; };
  }, [memoryRef, userId]);

  // Al cerrar (desmontar): si hubo conversación, resumir + guardar (sin await).
  useEffect(() => {
    return () => {
      if (!memoryRef || !userId) return;
      const convo = msgsRef.current;
      if (!convo.some((m) => m.role === "user")) return;
      const transcript = convo.map((m) => `${m.role === "user" ? "Aventurero" : "NPC"}: ${m.content}`).join("\n");
      const prev = memRef.current;
      const sumPersona =
        "Eres un archivador silencioso. Resume en 2-3 frases y en tercera persona lo relevante de " +
        "esta conversación para que el NPC lo recuerde la próxima vez (quién es el aventurero, qué " +
        "pidió o prometió, el tono). Si hay un resumen previo, intégralo sin repetir. Responde SOLO " +
        "con el resumen, sin preámbulos.";
      const prompt = `${prev ? `Resumen previo: ${prev}\n\n` : ""}Conversación:\n${transcript}`;
      void narrar({ messages: [{ role: "user", content: prompt }], persona: sumPersona }).then((r) => {
        if (r.ok && r.reply.trim()) void saveMemory(memoryRef, userId, r.reply.trim());
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoryRef, userId]);

  const conMemoria = memory ? `${persona}\n\nRecuerdas de encuentros pasados con este aventurero: ${memory}` : persona;
  const effectivePersona = conOpciones ? `${conMemoria}\n\n${INSTRUCCION_OPCIONES}` : conMemoria;

  async function send(texto?: string) {
    const text = (texto ?? input).trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next); setInput(""); setSugeridas([]); setLoading(true);
    const r = await narrar({ messages: next, persona: effectivePersona });
    // El bloque <opciones> se recorta ANTES de guardar el mensaje: así no se
    // pinta, y tampoco acaba en el resumen que se manda a `npc_memories` al
    // cerrar. Sin bloque, `parseOpciones` devuelve el texto entero y cero
    // opciones, que es la conversación de siempre.
    if (r.ok) {
      const { texto: dicho, opciones } = parseOpciones(r.reply || "…");
      setMessages((m) => [...m, { role: "assistant", content: dicho || "…" }]);
      if (conOpciones) setSugeridas(opciones);
    } else {
      setMessages((m) => [...m, { role: "assistant", content: "(No responde ahora mismo.)" }]);
    }
    setLoading(false);
  }

  async function pulsar(o: OpcionDialogo) {
    if (loading) return;
    if (o.accion === null) { void send(o.texto); return; }
    // Las de misión NO se le mandan al modelo: mueven estado en el servidor.
    // Quien nos monta recarga las misiones y recalcula `misionOpts`.
    setSugeridas([]);
    await onMision?.(o);
  }

  return (
    <div className="space-y-2">
      <div className="max-h-[220px] overflow-y-auto flex flex-col gap-2 pr-1">
        {messages.length === 0 && <p className="text-sm italic" style={{ color: "var(--color-dim)" }}>{empty}{memory ? " Os recuerda." : ""}</p>}
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] px-3 py-2 rounded-2xl ${m.role === "user" ? "self-end" : "self-start"}`} style={{ background: m.role === "user" ? "var(--color-raised)" : "var(--color-night)", border: "1px solid var(--color-line)" }}>
            <p className="font-body text-[14px] whitespace-pre-wrap" style={{ color: "var(--color-warm)" }}>{m.content}</p>
          </div>
        ))}
        {loading && <p className="pulse font-ui text-[12px] self-start" style={{ color: "var(--color-muted)" }}>…</p>}
        <div ref={endRef} />
      </div>

      {/* Las de misión van SIEMPRE y van primero, aunque el modelo esté caído:
          son las que mueven el estado, y esconderlas dejaría al jugador con una
          misión que no puede entregar porque la IA no contestó. */}
      {!loading && (misionOpts.length > 0 || sugeridas.length > 0) && (
        <div className="flex flex-col gap-1.5">
          {misionOpts.map((o) => (
            <button key={`m${o.accion}${"questId" in o ? o.questId : ""}`} onClick={() => pulsar(o)} disabled={loading}
              className="text-left px-3 py-2 rounded-2xl font-body text-[14px] transition-colors disabled:opacity-40"
              style={{ background: "var(--color-raised)", border: "1px solid var(--color-bronze)", color: "var(--color-parch)" }}>
              <i className={`fas ${o.accion === "entregar" ? "fa-hand-holding-heart" : "fa-hand-fist"} mr-2`} style={{ color: "var(--color-bronze-bright)" }} />
              {o.texto}
            </button>
          ))}
          {sugeridas.map((t, i) => (
            <button key={`s${i}`} onClick={() => pulsar({ texto: t, accion: null })} disabled={loading}
              className="text-left px-3 py-2 rounded-2xl font-body text-[14px] transition-colors hover:border-[var(--color-bronze)] disabled:opacity-40"
              style={{ background: "var(--color-night)", border: "1px solid var(--color-line)", color: "var(--color-warm)" }}>
              <i className="fas fa-angle-right mr-2" style={{ color: "var(--color-dim)" }} />{t}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }} placeholder={placeholder} disabled={loading}
          className="flex-1 bg-[var(--color-night)] rounded-lg px-3 py-2 font-body text-[14px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]" style={{ color: "var(--color-warm)" }} />
        {/* `() => send()` y no `send`: ahora acepta un texto y el handler le
            pasaría el MouseEvent, que no tiene `.trim()`. */}
        <button onClick={() => send()} disabled={loading || !input.trim()} className="btn-gold !px-3"><i className="fas fa-paper-plane" /></button>
      </div>
    </div>
  );
}
