"use client";

import { useMemo, useState } from "react";
import { useBestiary } from "@/lib/useBestiary";
import { searchMonsters } from "@/data/bestiary";
import { nombresNumerados, cuentaEnMesa, cantidadValida } from "@/lib/combate";
import { d20Check } from "@/lib/dice";
import { addMonstersInitiative } from "@/lib/useInitiative";

type Props = {
  /** Falta ejecutar schema_v23: se avisa y no se deja añadir. */
  faltaMigracion: boolean;
  /** Nombres de PNJ ya en la iniciativa, para no repetir numeración entre tandas. */
  nombresExistentes: string[];
};

// Buscador de monstruos del bestiario para añadirlos a la iniciativa (solo
// DM). Vive en su propio fichero, cargado con next/dynamic desde
// InitiativeTracker: un import estático de useBestiary metería data/bestiary
// (~25 KB comprimidos de estadísticas) en el bundle de CUALQUIER pantalla que
// monte el tracker, incluida /combate, que ven los jugadores.
export default function SelectorMonstruos({ faltaMigracion, nombresExistentes }: Props) {
  const { monsters, marcarDescubierto } = useBestiary();
  const [busqueda, setBusqueda] = useState("");
  const [slugSel, setSlugSel] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [individual, setIndividual] = useState(false);
  const [anadiendo, setAnadiendo] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // El bestiario ENTERO, sin recortar: la lista tiene su propio scroll, así que
  // el tope solo servía para esconder monstruos. Con 124 y orden alfabético, un
  // tope de 10 dejaba al DM viendo siempre los diez primeros y ninguno más.
  const sugerencias = useMemo(() => searchMonsters(monsters, busqueda), [monsters, busqueda]);

  const monstruoSel = monsters.find((m) => m.slug === slugSel) ?? null;

  // Añade una TANDA: un monstruo y una cantidad. Cada tanda tira su propia
  // iniciativa con el modificador de ESE monstruo, así que un jefe añadido
  // aparte nunca comparte turno con sus esbirros — sale gratis, sin ninguna
  // opción que marcar.
  async function addMonsters() {
    if (!monstruoSel || anadiendo) return;
    const n = cantidadValida(cantidad);
    setAnadiendo(true);
    setErr(null);

    try {
      const yaHay = cuentaEnMesa(nombresExistentes, monstruoSel.name);
      const nombres = nombresNumerados(monstruoSel.name, n, yaHay);
      // Sin "iniciativa individual", una sola tirada para toda la tanda: los
      // bichos idénticos van juntos y la lista se queda corta, que es como se
      // juega en la mesa. Con ella, cada fila tira la suya y `comun` no se usa.
      const comun = individual ? 0 : d20Check(monstruoSel.initiative).total;
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
        const { error: descError } = await marcarDescubierto(monstruoSel.slug, true);
        if (descError) setErr(`Añadido, pero no se pudo marcar como descubierto: ${descError}`);
        setBusqueda("");
        setSlugSel("");
        setCantidad("1");
      }
    } finally {
      setAnadiendo(false);
    }
  }

  return (
    <div className="space-y-2 pb-2 mb-1 border-b border-[var(--color-line)]">
      <p className="font-ui text-[11px] uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--color-dim)" }}>
        <span><i className="fas fa-dragon mr-1.5" />Del bestiario</span>
        {/* El recuento a la vista: si algún día vuelve a faltar un monstruo, se
            nota aquí antes que buscándolo a ciegas. */}
        <span className="ml-auto normal-case tracking-normal">
          {busqueda.trim().length > 0
            ? `${sugerencias.length} de ${monsters.length}`
            : `${monsters.length} monstruos`}
        </span>
      </p>
      <input
        value={busqueda}
        onChange={(e) => { setBusqueda(e.target.value); setSlugSel(""); }}
        placeholder="Buscar monstruo…"
        className="w-full bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[12px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
        style={{ color: "var(--color-warm)" }}
      />
      {err && <p className="text-[11px] italic" style={{ color: "var(--color-ember)" }}>{err}</p>}
      {!monstruoSel && sugerencias.length > 0 && (
        <div className="max-h-64 overflow-y-auto space-y-1">
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
      {!monstruoSel && sugerencias.length === 0 && busqueda.trim().length > 0 && (
        // El bestiario es deliberadamente incompleto (124 monstruos, hasta CR
        // 1/2): no encontrar nada es el caso normal, no la excepción. Sin este
        // aviso el DM no puede distinguir "no está" de "está cargando todavía".
        <p className="font-ui text-[11px] italic" style={{ color: "var(--color-dim)" }}>
          No está en el bestiario. Puedes añadirlo a mano con el formulario de abajo.
        </p>
      )}
      {monstruoSel && (
        <div className="flex gap-2 items-center flex-wrap">
          <input
            type="number"
            min={1}
            max={20}
            value={cantidad}
            onChange={(e) => setCantidad(String(cantidadValida(e.target.value)))}
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
  );
}
