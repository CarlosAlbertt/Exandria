"use client";

import { useMemo, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { useParty } from "@/lib/character";
import {
  useInitiative,
  setMyInitiative,
  addNpcInitiative,
  addMonstersInitiative,
  setActiveInitiative,
  clearInitiative,
  removeInitiativeRow,
  setNpcHp,
  setNpcConds,
  type InitiativeRow,
} from "@/lib/useInitiative";
import { useBestiary, setDiscovered } from "@/lib/useBestiary";
import { publishRoll } from "@/lib/useDiceFeed";
import { derive } from "@/lib/derive";
import { pgActuales, CONDICIONES } from "@/lib/estado";
import { saludDe, nombresNumerados } from "@/lib/combate";
import { d20Check } from "@/lib/dice";
import type { PlayState } from "@/lib/recursos";

type Props = {
  mod?: number;      // modificador de Destreza para "Tirar iniciativa" (derive().abilities.des.mod)
  hideEmpty?: boolean; // no renderizar nada si no hay ronda en curso (uso embebido en la hoja)
  /**
   * Si se pasa, cada fila (menos la tuya) es pulsable y elige objetivo. Recibe
   * el id de la fila, o null al deseleccionar tocando la ya elegida.
   */
  onSelect?: (id: number | null) => void;
  /** Fila elegida ahora mismo como objetivo. */
  selectedId?: number | null;
  /** Muestra los PG y las condiciones de los jugadores en cada fila. */
  conEstado?: boolean;
};

// Iniciativa en vivo, compartida por todo el grupo. RLS hace que las
// mutaciones de DM (PNJ/turno/vaciar) sean no-op silenciosas para
// jugadores, así que sus controles solo se muestran con role === "dm".
export default function InitiativeTracker({ mod = 0, hideEmpty = false, onSelect, selectedId = null, conEstado = false }: Props) {
  const session = useSession();
  const myId = session?.id ?? "";
  const isDM = session?.role === "dm";
  const { party } = useParty();
  const { rows, faltaMigracion } = useInitiative();

  // Estado del jugador de una fila: PG actuales/máximos y condiciones. Los PNJ
  // no tienen ficha, así que devuelven null (sus PG llegan en la losa siguiente).
  const estadoDe = (r: InitiativeRow): { hp: number; maxHp: number; conds: string[] } | null => {
    if (r.is_npc || !r.user_id) return null;
    const p = party.find((x) => x.user_id === r.user_id);
    if (!p) return null;
    const play = (p.play_state as PlayState | undefined) ?? {};
    const maxHp = derive(p).maxHp;
    return { hp: pgActuales(play, maxHp), maxHp, conds: play.conds ?? [] };
  };

  const [rolling, setRolling] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [npcName, setNpcName] = useState("");
  const [npcValue, setNpcValue] = useState("");

  // Selector de monstruos del bestiario (solo DM). `monsters` ya incluye los
  // personalizados del DM, así que el buscador los encuentra igual.
  const { monsters } = useBestiary();
  const [busqueda, setBusqueda] = useState("");
  const [slugSel, setSlugSel] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [individual, setIndividual] = useState(false);
  const [anadiendo, setAnadiendo] = useState(false);

  // Diez coincidencias como mucho: es un desplegable, no el bestiario entero.
  const sugerencias = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (q.length === 0) return monsters.slice(0, 10);
    return monsters
      .filter((m) => m.name.toLowerCase().includes(q) || m.nameEn.toLowerCase().includes(q))
      .slice(0, 10);
  }, [monsters, busqueda]);

  const monstruoSel = monsters.find((m) => m.slug === slugSel) ?? null;

  if (hideEmpty && rows.length === 0) return null;

  const nameFor = (r: InitiativeRow) => {
    if (r.is_npc) return r.npc_name ?? "PNJ";
    if (r.user_id === myId) return session?.username ?? "Tú";
    return party.find((p) => p.user_id === r.user_id)?.username ?? "Jugador";
  };

  async function rollInitiative() {
    if (!myId || rolling) return;
    setRolling(true);
    setErr(null);
    const { error, result } = await publishRoll(myId, "ability", "Iniciativa", "1d20", { mod });
    if (error || !result) {
      setErr(error ?? "No se pudo tirar la iniciativa.");
    } else {
      const { error: saveError } = await setMyInitiative(myId, result.total);
      if (saveError) setErr(saveError);
    }
    setRolling(false);
  }

  async function advanceTurn() {
    if (rows.length === 0) return;
    const curIdx = rows.findIndex((r) => r.active);
    const nextIdx = curIdx === -1 ? 0 : (curIdx + 1) % rows.length;
    await setActiveInitiative(rows[nextIdx].id);
  }

  async function addNpc() {
    const name = npcName.trim();
    const value = Number(npcValue);
    if (!name || npcValue.trim() === "" || Number.isNaN(value)) return;
    await addNpcInitiative(name, value);
    setNpcName("");
    setNpcValue("");
  }

  // Añade una TANDA: un monstruo y una cantidad. Cada tanda tira su propia
  // iniciativa con el modificador de ESE monstruo, así que un jefe añadido
  // aparte nunca comparte turno con sus esbirros — sale gratis, sin ninguna
  // opción que marcar.
  async function addMonsters() {
    if (!monstruoSel || anadiendo) return;
    const n = Math.max(1, Math.min(20, Math.round(Number(cantidad) || 1)));
    setAnadiendo(true);
    setErr(null);

    const nombres = nombresNumerados(monstruoSel.name, n);
    // Sin "iniciativa individual", una sola tirada para toda la tanda: los
    // bichos idénticos van juntos y la lista se queda corta, que es como se
    // juega en la mesa.
    const comun = d20Check(monstruoSel.initiative).total;
    const filas = nombres.map((nombre) => ({
      nombre,
      slug: monstruoSel.slug,
      hp: monstruoSel.hp,
      valor: individual ? d20Check(monstruoSel.initiative).total : comun,
    }));

    const { error } = await addMonstersInitiative(filas);
    if (error) {
      setErr(error);
    } else {
      // Si os lo habéis peleado, lo habéis visto: queda descubierto en
      // /bestiario para los jugadores. Un fallo aquí no debe deshacer las
      // filas ya creadas, así que solo se avisa.
      const { error: descError } = await setDiscovered(monstruoSel.slug, true);
      if (descError) setErr(`Añadido, pero no se pudo marcar como descubierto: ${descError}`);
      setBusqueda("");
      setSlugSel("");
      setCantidad("1");
    }
    setAnadiendo(false);
  }

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <p className="eyebrow"><i className="fas fa-bolt mr-1.5" style={{ color: "var(--color-arcane)" }} />Iniciativa</p>
        <button className="btn-gold !py-1.5 !px-3 text-[12px]" onClick={rollInitiative} disabled={!myId || rolling}>
          <i className="fas fa-dice-d20 mr-1.5" />{rolling ? "Tirando…" : "Tirar iniciativa"}
        </button>
      </div>

      {err && <p className="text-[12px] mb-2 italic" style={{ color: "var(--color-ember)" }}>{err}</p>}

      {rows.length === 0 ? (
        <p className="font-ui text-[13px] text-center py-3" style={{ color: "var(--color-dim)" }}>Sin ronda de iniciativa en curso.</p>
      ) : (
        <div className="space-y-1.5 mb-1">
          {rows.map((r) => {
            const est = conEstado ? estadoDe(r) : null;
            const esMia = !r.is_npc && r.user_id === myId;
            const elegible = !!onSelect && !esMia;
            const elegida = selectedId === r.id;
            return (
              <div
                key={r.id}
                onClick={elegible ? () => onSelect!(elegida ? null : r.id) : undefined}
                className={`panel-raised px-3 py-2 flex items-center justify-between gap-3 ${elegible ? "cursor-pointer" : ""}`}
                style={
                  elegida
                    ? { borderColor: "var(--color-ember)", boxShadow: "0 0 0 1px var(--color-ember)" }
                    : r.active
                      ? { borderColor: "var(--color-bronze)", boxShadow: "0 0 0 1px var(--color-bronze), 0 0 20px -4px rgba(201,163,92,0.5)" }
                      : undefined
                }
              >
                <span className="min-w-0">
                  <span className="font-ui text-[13px] font-semibold flex items-center gap-2" style={{ color: r.active ? "var(--color-bronze-bright)" : "var(--color-warm)" }}>
                    {r.active && <i className="fas fa-play text-[10px]" style={{ color: "var(--color-bronze)" }} />}
                    {r.is_npc && <i className="fas fa-dragon text-[11px]" style={{ color: "var(--color-dim)" }} />}
                    {nameFor(r)}
                    {elegida && <i className="fas fa-crosshairs text-[11px]" style={{ color: "var(--color-ember)" }} title="Tu objetivo" />}
                  </span>
                  {est && (
                    <span className="font-ui text-[11px] flex items-center gap-2 mt-0.5" style={{ color: "var(--color-dim)" }}>
                      <span>PG {est.hp}/{est.maxHp}</span>
                      {est.conds.length > 0 && (
                        <span style={{ color: "var(--color-violet)" }}>{est.conds.join(" · ")}</span>
                      )}
                    </span>
                  )}
                </span>
                <span className="font-display font-extrabold text-[15px] shrink-0" style={{ color: "var(--color-arcane-bright)" }}>
                  {r.value ?? "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {isDM && (
        <div className="pt-3 mt-2 border-t border-[var(--color-line)] space-y-2">
          {faltaMigracion && (
            <p className="font-ui text-[11px] italic mb-2" style={{ color: "var(--color-ember)" }}>
              <i className="fas fa-triangle-exclamation mr-1.5" />
              Falta ejecutar <code>schema_v23</code>: los monstruos no guardarán PG ni condiciones todavía.
            </p>
          )}
          <div className="space-y-2 pb-2 mb-1 border-b border-[var(--color-line)]">
            <p className="font-ui text-[11px] uppercase tracking-wider" style={{ color: "var(--color-dim)" }}>
              <i className="fas fa-dragon mr-1.5" />Del bestiario
            </p>
            <input
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setSlugSel(""); }}
              placeholder="Buscar monstruo…"
              className="w-full bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[12px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
              style={{ color: "var(--color-warm)" }}
            />
            {!monstruoSel && sugerencias.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {sugerencias.map((m) => (
                  <button
                    key={m.slug}
                    onClick={() => { setSlugSel(m.slug); setBusqueda(m.name); }}
                    className="w-full text-left panel-raised px-2.5 py-1.5 font-ui text-[12px] hover:border-[var(--color-bronze)] transition-colors"
                    style={{ color: "var(--color-warm)" }}
                  >
                    {m.name}
                    <span className="ml-2 text-[10px]" style={{ color: "var(--color-dim)" }}>
                      CR {m.cr} · {m.hp} PG · ini {m.initiative >= 0 ? `+${m.initiative}` : m.initiative}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {monstruoSel && (
              <div className="flex gap-2 items-center flex-wrap">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-16 bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[12px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
                  style={{ color: "var(--color-warm)" }}
                />
                <label className="font-ui text-[11px] flex items-center gap-1.5 cursor-pointer" style={{ color: "var(--color-dim)" }}>
                  <input type="checkbox" checked={individual} onChange={(e) => setIndividual(e.target.checked)} />
                  Iniciativa individual
                </label>
                <button className="btn-gold !py-1.5 !px-3 text-[12px] ml-auto" onClick={addMonsters} disabled={anadiendo || faltaMigracion}>
                  <i className="fas fa-plus mr-1.5" />{anadiendo ? "Añadiendo…" : "Añadir"}
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={npcName}
              onChange={(e) => setNpcName(e.target.value)}
              placeholder="Nombre del PNJ"
              className="flex-1 bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[12px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
              style={{ color: "var(--color-warm)" }}
            />
            <input
              type="number"
              value={npcValue}
              onChange={(e) => setNpcValue(e.target.value)}
              placeholder="Valor"
              className="w-20 bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[12px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
              style={{ color: "var(--color-warm)" }}
            />
            <button className="btn-ghost !py-1.5 !px-3 text-[12px]" onClick={addNpc} disabled={!npcName.trim() || npcValue.trim() === ""}>
              <i className="fas fa-plus mr-1.5" />PNJ
            </button>
          </div>
          <div className="flex gap-2">
            <button className="btn-gold flex-1 !py-1.5 text-[12px]" onClick={advanceTurn} disabled={rows.length === 0}>
              <i className="fas fa-forward mr-1.5" />Siguiente turno
            </button>
            <button
              className="btn-ghost !py-1.5 !px-3 text-[12px]"
              style={{ color: "var(--color-ember)" }}
              onClick={() => { if (confirm("¿Vaciar toda la iniciativa?")) clearInitiative(); }}
              disabled={rows.length === 0}
            >
              <i className="fas fa-trash mr-1.5" />Vaciar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
