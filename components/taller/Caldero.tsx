"use client";

import { useEffect, useMemo, useState } from "react";
import { useInventarioVivo } from "@/lib/useInventarioVivo";
import { useGameClock } from "@/lib/useGameClock";
import { rollVisual, RESULTADO_MS } from "@/lib/diceBox";
import { roll as rollFallback } from "@/lib/dice";
import { loadActiveCharacter, saveCharacter } from "@/lib/character";
import { recetaPorSlug, produceNombre, produceRareza, type Receta } from "@/data/recetas";
import { RAREZA_LABEL } from "@/data/pociones";
import { recetasSabidas, recetasDeArena, bolsaDeArena, sabeOficio, requisitos, puedePreparar, consumir, anadirProducto, cupoLibre, cupoHasta, diasDeCupo } from "@/lib/recetario";
import { OFICIO_PERICIA, materialPorN } from "@/lib/materiales";
import { colorBrebaje, danoDeReceta, esDesastre, ordenDeReceta, DANO_LABEL, type Punto } from "@/lib/manipulacion";
import { aplicarDaño } from "@/lib/estado";
import type { ModoDm } from "@/lib/tallerDm";
import type { PlayState } from "@/lib/recursos";
import { fmtMod } from "@/data/rules";
import CalderoSvg from "@/components/taller/CalderoSvg";
import HuecoMaterial from "@/components/taller/HuecoMaterial";
import Manipulacion from "@/components/taller/Manipulacion";

/**
 * El taller de Alquimia: el **libro** de recetas descubiertas y el **banco de
 * trabajo**, donde está el caldero.
 *
 * El libro enseña **solo lo que el personaje ha descubierto**, no el catálogo:
 * la gracia del oficio es ir aprendiendo. Lo que no sabe no aparece — ni en gris
 * ni con candado, porque un hueco numerado ya cuenta que existe algo ahí.
 *
 * El banco ocupa el ancho entero en vez de media pantalla: es lo que deja sitio
 * a las tres fases de manipulación (echar, pipeta, cocer) sin apretarlas, y es
 * la cáscara que heredarán los otros cinco oficios.
 *
 * Se apoya en `useInventarioVivo`, el mismo hook que la pantalla de inventario:
 * escribe las columnas `items`/`equipment` con el mismo debounce y por el mismo
 * camino. Así preparar una poción y soltar un objeto no son dos formas distintas
 * de tocar la bolsa.
 *
 * **`dm` es la caja de arena del máster**: sin ficha, sin la pericia, con todas
 * las recetas y materiales infinitos, y **sin guardar nada**. No es un camino
 * aparte —se le pasa `bolsaDeArena` a las mismas funciones que usa el jugador—
 * porque una pantalla que solo mira el DM no sería la que juega la mesa.
 */
export default function Caldero({ userId, dm }: { userId: string | null; dm: ModoDm | null }) {
  const inv = useInventarioVivo(userId, "self");
  // El cupo se mide en días de JUEGO, así que se compara con el reloj de
  // campaña y no con la hora real: adelantar días desde Panel DM › Tiempo tiene
  // que liberarlo, que es como la mesa entiende «vuelve dentro de tres días».
  const { nowGameMin } = useGameClock();
  const [sel, setSel] = useState<string | null>(null);
  const [vista, setVista] = useState<"libro" | "banco">("libro");
  const [busy, setBusy] = useState(false);
  const [manipulando, setManipulando] = useState(false);
  const [msg, setMsg] = useState<{ texto: string; exito: boolean } | null>(null);
  const [query, setQuery] = useState("");
  const [reducido, setReducido] = useState(false);

  // Si el usuario pide que nada se mueva, las fases no animan y «preparar sin
  // manipular» pasa a ser el camino principal. La preferencia se lee en efecto
  // y no en render: en el servidor no hay `matchMedia`.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    setReducido(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const skills: string[] = useMemo(
    () => (Array.isArray(inv.character?.skills) ? inv.character!.skills as string[] : []),
    [inv.character],
  );
  const lore: string[] = useMemo(
    () => (Array.isArray(inv.character?.lore_unlocked) ? inv.character!.lore_unlocked as string[] : []),
    [inv.character],
  );

  const tieneOficio = sabeOficio(skills, "alquimia");
  // El DM ve las 32: no está jugando un personaje, está mirando si el taller
  // funciona, y con el libro del descubrimiento no llegaría ni a la mitad.
  const libro = useMemo(
    () => (dm ? recetasDeArena("alquimia") : recetasSabidas("alquimia", skills, lore)),
    [dm, skills, lore],
  );

  const filtrado = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return libro;
    return libro.filter((r) => produceNombre(r).toLowerCase().includes(q));
  }, [libro, query]);

  // El modificador de la tirada sale de `derive`, la misma fuente que la ficha:
  // si aquí se recalculara, el caldero podría prometer un +5 que la hoja no da.
  // En la caja de arena no hay ficha de la que derivarlo, así que lo pone el DM.
  const pericia = inv.derived.skills.find((s) => s.name === OFICIO_PERICIA.alquimia);
  const mod = dm ? dm.mod : pericia?.mod ?? 0;

  const play: PlayState = useMemo(
    () => (inv.character?.play_state && typeof inv.character.play_state === "object"
      ? inv.character.play_state as PlayState
      : {}),
    [inv.character],
  );

  const receta = sel ? recetaPorSlug(sel) ?? null : null;
  // La bolsa contra la que se mide todo. En modo DM es la de arena, que trae
  // justo lo que la receta pide: así el caldero no necesita un caso especial en
  // cada comprobación, y las que corren son las mismas que le corren al jugador.
  const bolsa = useMemo(
    () => (dm && receta ? bolsaDeArena(receta) : inv.items),
    [dm, receta, inv.items],
  );
  const lineas = receta ? requisitos(receta, bolsa) : [];
  // El cupo solo frena a las recetas que lo llevan. Es lo que hace que gastarlo
  // no te deje sin poder prepararte una curación.
  // **Al DM no le aplica**: vive en `play_state`, que es de la ficha, y sin
  // ficha no hay dónde guardarlo ni nada que liberar adelantando días.
  const cupoPillado = !dm && !!receta?.cupo && !cupoLibre(play, nowGameMin);
  const diasQueFaltan = cupoPillado ? diasDeCupo(play, nowGameMin) : 0;
  const listo = receta ? puedePreparar(receta, bolsa) && !cupoPillado : false;

  /**
   * Gasta el cupo tras acertar una receta que lo lleva.
   *
   * Relee la ficha antes de escribir y **fusiona** `play_state`: ahí viven
   * también los PG, las condiciones y los usos de clase, así que escribir el
   * objeto que teníamos en memoria borraría lo que el combate haya movido
   * mientras el caldero estaba abierto.
   */
  async function gastarCupo(characterId: string, uid: string, dados: number): Promise<number> {
    const actual = await loadActiveCharacter(uid);
    const previo = (actual?.play_state && typeof actual.play_state === "object"
      ? actual.play_state as PlayState
      : play);
    const hasta = cupoHasta(nowGameMin, dados);
    await saveCharacter(characterId, { play_state: { ...previo, tallerCupo: hasta } });
    return hasta;
  }

  /**
   * El desastre le cuesta PG al alquimista, además de los materiales.
   *
   * Pasa por `aplicarDaño` —el mismo de combate— en vez de restar a mano, para
   * que los PG temporales, el estar a 0 y las salvaciones de muerte se comporten
   * igual que en cualquier otro sitio. Y relee y fusiona `play_state` por el
   * mismo motivo que `gastarCupo`.
   */
  async function aplicarDesastre(characterId: string, uid: string, dano: number): Promise<void> {
    const actual = await loadActiveCharacter(uid);
    const previo = (actual?.play_state && typeof actual.play_state === "object"
      ? actual.play_state as PlayState
      : play);
    await saveCharacter(characterId, { play_state: aplicarDaño(previo, dano, inv.derived.maxHp) });
  }

  /**
   * Prepara la receta. `bono` es lo que han sacado las manos (±3); 0 cuando se
   * prepara sin manipular, que **siempre** es una salida disponible.
   */
  async function preparar(r: Receta, bono: number) {
    if (busy) return;
    if (!dm && !inv.characterId) return;
    // Segunda comprobación, contra el reloj de este instante: entre que se
    // pintó el botón y se pulsa, el DM puede haber adelantado (o no) los días.
    if (!dm && r.cupo && !cupoLibre(play, nowGameMin)) {
      setMsg({ texto: `El alambique aún no se ha asentado. Vuelve dentro de ${diasDeCupo(play, nowGameMin)} día(s).`, exito: false });
      return;
    }
    setBusy(true);
    setManipulando(false);
    setMsg(null);

    const nombre = produceNombre(r);
    const modTotal = mod + bono;
    // `hold`: el veredicto se escribe DESPUÉS de que el dado se haya visto. Sin
    // esto, «sale bien» aparecía bajo el botón con los dados todavía rodando.
    const tirada = await rollVisual("1d20", { mod: modTotal, check: true, label: `Alquimia · ${nombre}`, hold: RESULTADO_MS });
    // La **cara** hace falta aparte del total: la pifia es un 1 natural, y un
    // total de 1 con un +5 detrás no es una pifia.
    const respaldo = tirada ? null : rollFallback("1d20");
    const cara = tirada ? (tirada.rolls[0] ?? 0) : (respaldo?.rolls[0] ?? 0);
    const total = tirada ? tirada.total : (respaldo?.total ?? 0) + modTotal;
    const exito = total >= r.cd;
    const desastre = !exito && esDesastre(cara, bono);
    const tipo = danoDeReceta(r);
    const dano = desastre && tipo ? (rollFallback("1d4")?.total ?? 1) : 0;

    // La caja de arena termina aquí: **no toca la bolsa, ni el cupo, ni los PG**.
    // No hay ficha donde escribirlos, y lo que sale del caldero se tira. Lo que
    // sí es de verdad es la tirada —pasa por el mismo `rollVisual` que la mesa—,
    // que es justo lo que hay que poder mirar.
    if (dm) {
      const cola = dano > 0 && tipo ? ` La mezcla salta: serían ${dano} de daño de ${DANO_LABEL[tipo]}.` : "";
      setMsg({
        texto: exito
          ? `${total} contra CD ${r.cd}: sale bien. Saldría ${nombre} — en la caja de arena no se guarda nada.`
          : `${total} contra CD ${r.cd}: la mezcla se echa a perder.${cola} En la caja de arena no se gasta nada.`,
        exito,
      });
      setBusy(false);
      return;
    }

    // La comprobación se repite DENTRO del updater, contra la bolsa de ese
    // instante y no contra la que se pintó. La bolsa es viva: el DM puede
    // llevarse un ingrediente por Realtime entre que se abre el caldero y se
    // suelta el dado, y sin esto se consumiría de más (o se restaría de un
    // montón que ya no está).
    // En un objeto y no en un `let`: TypeScript no ve que el updater se ejecute,
    // así que con una variable suelta estrecharía el tipo al valor inicial y
    // daría por muerta la rama de abajo.
    const estado = { faltaMaterial: false };
    inv.setItems((prev) => {
      if (!puedePreparar(r, prev)) { estado.faltaMaterial = true; return prev; }
      const gastado = consumir(prev, r);
      // Al fallar se gastan igual: lo único que cambia es si además entra la
      // poción. Es la decisión de la tanda y lo que hace que recolectar importe.
      return exito ? anadirProducto(gastado, nombre) : gastado;
    });

    if (estado.faltaMaterial) {
      setMsg({ texto: "Te has quedado sin algún ingrediente mientras preparabas. No se ha gastado nada.", exito: false });
    } else if (exito) {
      // El cupo se gasta SOLO al acertar: fallar ya cuesta los materiales, que
      // en estas dos recetas son los más difíciles del catálogo.
      let cola = "";
      if (r.cupo && inv.characterId && userId) {
        const dados = rollFallback("1d6")?.total ?? 1;
        const hasta = await gastarCupo(inv.characterId, userId, dados);
        cola = ` El alambique queda asentándose ${diasDeCupo({ tallerCupo: hasta }, nowGameMin)} día(s).`;
      }
      setMsg({ texto: `${total} contra CD ${r.cd}: sale bien. Ya llevas ${nombre}.${cola}`, exito: true });
    } else if (dano > 0 && tipo && inv.characterId && userId) {
      await aplicarDesastre(inv.characterId, userId, dano);
      setMsg({
        texto: `${total} contra CD ${r.cd}: la mezcla revienta. Pierdes los ingredientes y te llevas ${dano} de daño de ${DANO_LABEL[tipo]}.`,
        exito: false,
      });
    } else {
      setMsg({ texto: `${total} contra CD ${r.cd}: la mezcla se echa a perder y los ingredientes con ella.`, exito: false });
    }
    setBusy(false);
  }

  if (!inv.ready) {
    return <p className="text-center italic" style={{ color: "var(--color-dim)" }}>Encendiendo el fuego…</p>;
  }
  // Las dos puertas son del JUGADOR. El DM no las cruza: no tiene ficha ni
  // pericia, y era exactamente lo que le impedía mirar su propio taller.
  if (!dm && !inv.characterId) {
    return (
      <div className="panel-raised p-10 text-center">
        <p className="font-ui text-[13px]" style={{ color: "var(--color-muted)" }}>
          No tienes un personaje en juego, así que no hay manos que preparen nada.
        </p>
      </div>
    );
  }
  if (!dm && !tieneOficio) {
    return (
      <div className="panel-raised p-10 text-center">
        <i className="fas fa-flask text-3xl mb-4 block" style={{ color: "var(--color-dim)" }} />
        <h2 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--color-bronze-bright)" }}>
          No sabes de Alquimia
        </h2>
        <p className="font-ui text-[13px]" style={{ color: "var(--color-muted)" }}>
          Hace falta la pericia de oficio <strong>Alquimia</strong> para acercarse a un caldero.
          Se elige al crear el personaje, o al llegar a nivel 7.
        </p>
      </div>
    );
  }

  const rareza = receta ? produceRareza(receta) : undefined;
  const nombresDeReceta: Record<number, string> = {};
  if (receta) {
    for (const m of receta.materiales) {
      const mat = materialPorN(receta.oficio, m.n);
      if (mat) nombresDeReceta[m.n] = mat.name;
    }
  }

  return (
    <div>
      {/* Libro y banco son hermanos, no dos columnas: el banco necesita el ancho
          entero para las tres fases, y así los otros cinco oficios heredan la
          misma cáscara. */}
      <div className="flex gap-1 mb-4 border-b" style={{ borderColor: "var(--color-line)" }}>
        <button type="button" onClick={() => setVista("libro")}
          className="px-4 py-2 font-ui text-[12px] font-bold rounded-t-lg transition-colors"
          style={{
            color: vista === "libro" ? "var(--color-bronze-bright)" : "var(--color-dim)",
            background: vista === "libro" ? "var(--color-panel)" : "transparent",
            boxShadow: vista === "libro" ? "inset 0 2px 0 var(--color-bronze)" : undefined,
          }}>
          <i className="fas fa-book mr-2" />{dm ? "El recetario entero" : "Tu libro"}
        </button>
        <button type="button" onClick={() => setVista("banco")}
          className="px-4 py-2 font-ui text-[12px] font-bold rounded-t-lg transition-colors"
          style={{
            color: vista === "banco" ? "var(--color-bronze-bright)" : "var(--color-dim)",
            background: vista === "banco" ? "var(--color-panel)" : "transparent",
            boxShadow: vista === "banco" ? "inset 0 2px 0 var(--color-bronze)" : undefined,
          }}>
          <i className="fas fa-fire mr-2" />El banco
        </button>
      </div>

      {/* ------------------------------ EL LIBRO ------------------------------ */}
      {vista === "libro" && (
        <div className="panel-raised p-4">
          <div className="flex items-baseline justify-between gap-2 mb-3">
            <p className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>
              {libro.length} receta{libro.length === 1 ? "" : "s"} · Alquimia {fmtMod(mod)}
              {!dm && pericia?.proficient && <i className="fas fa-star ml-1.5 text-[9px]" style={{ color: "var(--color-bronze)" }} />}
            </p>
          </div>

          {libro.length > 3 && (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en el libro…"
              className="w-full bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors mb-3"
              style={{ color: "var(--color-warm)" }}
            />
          )}

          {filtrado.length === 0 ? (
            <p className="font-ui text-[13px] italic" style={{ color: "var(--color-dim)" }}>
              {libro.length === 0
                ? "El libro está en blanco. Las recetas se aprenden de quien las sabe o de los tomos que encuentres."
                : "Ninguna receta se llama así."}
            </p>
          ) : (
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filtrado.map((r) => {
                const rar = produceRareza(r);
                const puede = puedePreparar(r, dm ? bolsaDeArena(r) : inv.items);
                return (
                  <li key={r.slug}>
                    <button
                      onClick={() => { setSel(r.slug); setMsg(null); setManipulando(false); setVista("banco"); }}
                      className="w-full panel p-3 text-left transition-colors hover:border-[var(--color-bronze)]"
                      style={{ borderColor: sel === r.slug ? "var(--color-bronze)" : undefined }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-display font-bold text-[14px]" style={{ color: "var(--color-bronze-bright)" }}>
                          {produceNombre(r)}
                        </span>
                        <span className="font-ui text-[10px] font-bold whitespace-nowrap px-2 py-0.5 rounded-full"
                          style={{ color: "var(--color-arcane-bright)", border: "1px solid var(--color-arcane)55" }}>
                          CD {r.cd}
                        </span>
                      </div>
                      <p className="font-ui text-[11px] mt-1" style={{ color: "var(--color-muted)" }}>
                        {rar && rar !== "variable" ? RAREZA_LABEL[rar] : ""}
                        {r.inicial && " · la sabes de siempre"}
                        {r.cupo && " · una cada 1d6 días"}
                      </p>
                      {!puede && (
                        <p className="font-ui text-[11px] mt-1" style={{ color: "var(--color-dim)" }}>
                          <i className="fas fa-circle-exclamation mr-1" />te faltan ingredientes
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* ------------------------------ EL BANCO ------------------------------ */}
      {vista === "banco" && (
        <div className="panel-raised p-4">
          {!receta ? (
            <>
              <CalderoSvg color={colorBrebaje(undefined)} vacio />
              <p className="font-ui text-[13px] italic text-center mt-3" style={{ color: "var(--color-dim)" }}>
                El caldero está frío. Elige una receta en el libro.
              </p>
            </>
          ) : (
            <>
              {/* La tira: qué pide, qué sale, con qué se tira y contra cuánto.
                  Va arriba porque es lo que se consulta a mitad de manipulación. */}
              <div className="flex items-center justify-between gap-3 panel p-3 mb-4">
                <div>
                  <p className="font-display font-bold text-[17px]" style={{ color: "var(--color-bronze-bright)" }}>
                    {produceNombre(receta)}
                  </p>
                  <p className="font-ui text-[11px] mt-0.5" style={{ color: "var(--color-muted)" }}>
                    Pide {receta.materiales.length} material{receta.materiales.length === 1 ? "" : "es"} ·
                    sale 1 · <span style={{ color: "var(--color-warm)" }}>Alquimia {fmtMod(mod)}</span>
                  </p>
                </div>
                <span className="font-ui text-[11px] font-bold whitespace-nowrap px-2.5 py-1 rounded-full"
                  style={{ color: "var(--color-arcane-bright)", border: "1px solid var(--color-arcane)55" }}>
                  CD {receta.cd}
                </span>
              </div>

              <CalderoSvg
                color={colorBrebaje(rareza)}
                fuego={manipulando || busy}
                burbujas={manipulando || busy}
              />

              <p className="eyebrow text-center mt-3 mb-2">Lo que pide la receta</p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {lineas.map((f) => {
                  const mat = materialPorN(receta.oficio, f.n);
                  return (
                    <HuecoMaterial
                      key={`${f.esHerramienta ? "h" : "m"}-${f.n}`}
                      oficio={receta.oficio}
                      n={f.n}
                      nombre={f.nombre}
                      categoria={f.esHerramienta ? "herramienta" : mat?.category}
                      cantidad={f.necesita}
                      estado={f.tiene >= f.necesita ? "listo" : "falta"}
                    />
                  );
                })}
              </div>

              <p className="font-ui text-[11px] mt-3 text-center" style={{ color: "var(--color-dim)" }}>
                {dm
                  ? "Caja de arena: la tirada es de verdad, pero no se gasta ni se guarda nada."
                  : "Al fallar, los ingredientes se pierden igual. Un desastre además salpica."}
              </p>

              {/* El cupo se explica ANTES de tocar el botón: un botón apagado sin
                  motivo se lee como «te faltan cosas», que es justo lo que no es. */}
              {receta.cupo && (
                <p className="font-ui text-[11px] mt-2 text-center" style={{ color: cupoPillado ? "var(--color-ember)" : "var(--color-arcane-bright)" }}>
                  <i className="fas fa-hourglass-half mr-1.5" />
                  {cupoPillado
                    ? `El alambique se está asentando: faltan ${diasQueFaltan} día(s) para volver a intentar una de las dos grandes.`
                    : "Solo una de las dos grandes cada 1d6 días, y el cupo se gasta únicamente si sale bien."}
                </p>
              )}

              {manipulando ? (
                <Manipulacion
                  ordenReceta={ordenDeReceta(receta)}
                  nombres={nombresDeReceta}
                  reducido={reducido}
                  onCancelar={() => setManipulando(false)}
                  onListo={(bono: number, _puntos: Punto[]) => { void preparar(receta, bono); }}
                />
              ) : (
                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  {/* Manipular es lo que da el ±3; «sin manipular» tira a pelo y
                      **siempre está**: es accesibilidad, y es el atajo para la
                      décima poción de la tarde. */}
                  <button
                    onClick={() => { setMsg(null); setManipulando(true); }}
                    disabled={busy || !listo}
                    className="btn-gold flex-1 !py-2.5 text-[13px] disabled:opacity-40"
                  >
                    <i className="fas fa-mortar-pestle mr-2" />
                    {busy
                      ? "Preparando…"
                      : cupoPillado
                        ? `El alambique descansa (${diasQueFaltan} día/s)`
                        : listo
                          ? "Preparar manipulando (±3)"
                          : "Te faltan ingredientes"}
                  </button>
                  <button
                    onClick={() => { void preparar(receta, 0); }}
                    disabled={busy || !listo}
                    className="panel px-4 py-2.5 font-ui text-[12px] font-bold disabled:opacity-40 hover:border-[var(--color-bronze)] transition-colors"
                    style={{ color: "var(--color-muted)" }}
                  >
                    Preparar sin manipular
                  </button>
                </div>
              )}

              {msg && (
                <p className="font-ui text-[13px] mt-4 text-center" style={{ color: msg.exito ? "var(--color-verdant)" : "var(--color-ember)" }}>
                  {msg.texto}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {inv.error && (
        <p className="font-ui text-[12px] mt-3" style={{ color: "var(--color-ember)" }}>
          {inv.error}
        </p>
      )}
    </div>
  );
}
