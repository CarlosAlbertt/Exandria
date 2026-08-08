"use client";

import { useEffect, useMemo, useState } from "react";
import { useInventarioVivo } from "@/lib/useInventarioVivo";
import { useRelojJugador } from "@/lib/useRelojJugador";
import { rollVisual, RESULTADO_MS } from "@/lib/diceBox";
import { roll as rollFallback } from "@/lib/dice";
import { loadActiveCharacter, saveCharacter } from "@/lib/character";
import { recetaPorSlug, produceNombre, produceRareza, type Receta } from "@/data/recetas";
import { RAREZA_LABEL } from "@/data/pociones";
import { recetasSabidas, recetasDeArena, bolsaDeArena, sabeOficio, requisitos, puedePreparar, consumir, anadirProducto, cupoLibre, cupoHasta, diasDeCupo } from "@/lib/recetario";
import { OFICIO_PERICIA, materialPorN } from "@/lib/materiales";
import {
  colorBrebaje, colorDeCategoria, danoDeReceta, esDesastre, ordenDeReceta,
  puntoEchar, totalManipulacion, DANO_LABEL, type Punto,
} from "@/lib/manipulacion";
import { aplicarDaño } from "@/lib/estado";
import type { ModoDm } from "@/lib/tallerDm";
import type { PlayState } from "@/lib/recursos";
import { fmtMod } from "@/data/rules";
import CalderoSvg from "@/components/taller/CalderoSvg";
import HuecoMaterial from "@/components/taller/HuecoMaterial";
import Manipulacion from "@/components/taller/Manipulacion";

/**
 * El taller de Alquimia: el **libro** de recetas a la izquierda y el **caldero**
 * a la derecha, que es donde se juega.
 *
 * El libro enseña **solo lo que el personaje ha descubierto**, no el catálogo:
 * la gracia del oficio es ir aprendiendo. Lo que no sabe no aparece — ni en gris
 * ni con candado, porque un hueco numerado ya cuenta que existe algo ahí.
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
/** En qué posición de la olla cayó la ocurrencia número `saltar+1` de `n`. */
function posicionDeLaEnesima(echado: number[], n: number, saltar: number): number {
  let vistas = 0;
  for (let i = 0; i < echado.length; i++) {
    if (echado[i] !== n) continue;
    if (vistas === saltar) return i;
    vistas++;
  }
  return -1;
}

export default function Caldero({ userId, dm }: { userId: string | null; dm: ModoDm | null }) {
  const inv = useInventarioVivo(userId, "self");
  // El cupo se mide en días de JUEGO, así que se compara con el reloj de
  // campaña y no con la hora real: adelantar días desde Panel DM › Tiempo tiene
  // que liberarlo, que es como la mesa entiende «vuelve dentro de tres días».
  // ⚠️ **La hora de este jugador, no la del grupo, y aquí es MECÁNICA**: el cupo
  // del taller cuenta días de juego (`tallerCupo` es un minuto absoluto), así que
  // quien se ha ido ocho horas de camino recupera el cupo ocho horas antes. Es lo
  // que el usuario decidió: el desfase es su hora de verdad.
  //
  // El `tallerCupo` que se guarde llevará su desfase dentro. Al volver con el
  // grupo el desfase se borra y el cupo le dura un poco más de lo apuntado: se
  // acepta, es la misma simplificación que hace que el viaje de vuelta no se
  // cobre, y el error va hacia el lado de no castigar.
  const { nowGameMin } = useRelojJugador();
  const [sel, setSel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ texto: string; exito: boolean } | null>(null);
  const [query, setQuery] = useState("");
  const [reducido, setReducido] = useState(false);

  /* La fase 1 (echar) vive AQUÍ y no en `Manipulacion` porque se juega
     arrastrando los huecos **al dibujo del caldero**: el blanco del arrastre es
     la olla, y la olla es de este componente. */
  const [fase, setFase] = useState<"quieto" | "echar" | "resto">("quieto");
  const [echado, setEchado] = useState<number[]>([]);
  const [puntoDeEchar, setPuntoDeEchar] = useState<Punto | null>(null);
  const [sobreOlla, setSobreOlla] = useState(false);

  // Si el usuario pide que nada se mueva, las fases no animan. La preferencia se
  // lee en efecto y no en render: en el servidor no hay `matchMedia`.
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

  /** Deja el banco como estaba: ni fase a medias ni materiales en la olla. */
  function reposar() {
    setFase("quieto");
    setEchado([]);
    setPuntoDeEchar(null);
    setSobreOlla(false);
  }

  /**
   * Echa un material a la olla. Lo llaman **el arrastre y el clic**: el arrastre
   * es lo natural con ratón, pero en táctil no existe, y sin el clic el taller
   * no se podría jugar desde el móvil.
   */
  function echarMaterial(n: number, orden: number[]) {
    if (fase !== "echar") return;
    const next = [...echado, n];
    setEchado(next);
    setSobreOlla(false);
    if (next.length < orden.length) return;
    // Ya está todo dentro: se cierra la fase 1 y arrancan pipeta y aguja.
    setPuntoDeEchar(puntoEchar(next, orden));
    setFase("resto");
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

    reposar();

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
  const orden = receta ? ordenDeReceta(receta) : [];
  // El siguiente hueco que la receta espera, para poder decirlo sin desvelar el
  // resto: si se cantara la lista entera no habría orden que acertar.
  const echando = fase === "echar";

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* ------------------------------ EL LIBRO ------------------------------ */}
      <section>
        <p className="eyebrow mb-3">
          <i className="fas fa-book mr-2" style={{ color: "var(--color-bronze)" }} />
          {dm ? "El recetario entero" : "Tu libro de recetas"}
        </p>

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
            <ul className="space-y-2">
              {filtrado.map((r) => {
                const rar = produceRareza(r);
                const puede = puedePreparar(r, dm ? bolsaDeArena(r) : inv.items);
                return (
                  <li key={r.slug}>
                    <button
                      onClick={() => { setSel(r.slug); setMsg(null); reposar(); }}
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
                      {/* Los colores de lo que pide, aquí ya: se ve de un vistazo
                          si una receta es de plantas o de minerales. */}
                      <span className="flex gap-1 mt-2">
                        {r.materiales.map((m, i) => (
                          <span key={i} className="mat-punto"
                            style={{ background: colorDeCategoria(materialPorN(r.oficio, m.n)?.category) }} />
                        ))}
                      </span>
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
      </section>

      {/* ----------------------------- EL CALDERO ----------------------------- */}
      <section>
        <p className="eyebrow mb-3">
          <i className="fas fa-flask mr-2" style={{ color: "var(--color-verdant)" }} />
          El caldero
        </p>

        <div className="panel-raised p-4">
          {!receta ? (
            <>
              <CalderoSvg color={colorBrebaje(undefined)} vacio />
              <p className="font-ui text-[13px] italic text-center mt-3" style={{ color: "var(--color-dim)" }}>
                El caldero borbotea vacío. Elige una receta del libro.
              </p>
            </>
          ) : (
            <>
              <h3 className="font-display text-xl font-bold mb-1" style={{ color: "var(--color-bronze-bright)" }}>
                {produceNombre(receta)}
              </h3>
              <p className="font-ui text-[12px] mb-3" style={{ color: "var(--color-muted)" }}>
                Se tira <strong>Alquimia {fmtMod(mod)}</strong> contra <strong>CD {receta.cd}</strong>.
              </p>

              {/* La olla es el BLANCO del arrastre. Se marca al pasar por encima
                  para que no haya que adivinar dónde se suelta. */}
              <div
                className={`olla-zona${echando ? " is-activa" : ""}${sobreOlla ? " is-sobre" : ""}`}
                onDragOver={(e) => { if (echando) { e.preventDefault(); setSobreOlla(true); } }}
                onDragLeave={() => setSobreOlla(false)}
                onDrop={(e) => {
                  if (!echando) return;
                  e.preventDefault();
                  const n = Number(e.dataTransfer.getData("text/plain"));
                  if (Number.isFinite(n)) echarMaterial(n, orden);
                }}
              >
                <CalderoSvg
                  color={colorBrebaje(rareza)}
                  fuego={fase !== "quieto" || busy}
                  burbujas={fase !== "quieto" || busy}
                />
                {echando && (
                  <p className="olla-pista">
                    <i className="fas fa-hand-pointer mr-2" />
                    Arrastra aquí el material {echado.length + 1} de {orden.length}
                    <span className="block text-[10px] opacity-70 mt-0.5">o pulsa el hueco, si vas en táctil</span>
                  </p>
                )}
              </div>

              <ul className="space-y-1.5 mb-3 mt-3">
                {lineas.map((f) => {
                  const ok = f.tiene >= f.necesita;
                  const mat = materialPorN(receta.oficio, f.n);
                  const cat = f.esHerramienta ? "herramienta" : mat?.category;
                  return (
                    <li key={`${f.esHerramienta ? "h" : "m"}-${f.n}`} className="flex items-center justify-between gap-3 font-ui text-[13px]">
                      <span style={{ color: ok ? "var(--color-warm)" : "var(--color-dim)" }}>
                        <span className="mat-punto mr-2" style={{ background: colorDeCategoria(cat) }} />
                        {f.nombre}
                        {/* Una herramienta se exige a mano pero NO se gasta. Se
                            dice en la propia línea para que nadie tema perderla. */}
                        {f.esHerramienta && (
                          <span className="ml-2 text-[10px] italic" style={{ color: "var(--color-dim)" }}>
                            (no se gasta)
                          </span>
                        )}
                      </span>
                      <span className="whitespace-nowrap text-[12px]" style={{ color: ok ? "var(--color-muted)" : "var(--color-ember)" }}>
                        {f.tiene} / {f.necesita}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* Los huecos, del mismo tamaño que los de la bolsa. En la fase de
                  echar son lo que se arrastra; el resto del tiempo dicen qué
                  pide la receta y de qué categoría es cada cosa. */}
              <div className="flex flex-wrap justify-center gap-2.5 mb-3">
                {receta.materiales.map((m, i) => {
                  const mat = materialPorN(receta.oficio, m.n);
                  const linea = lineas.find((l) => !l.esHerramienta && l.n === m.n);
                  // Una receta puede pedir dos veces el mismo `n`, así que un
                  // hueco está dentro cuando ya se han echado MÁS unidades de
                  // ese material que huecos suyos hay antes en la fila.
                  const previas = receta.materiales.slice(0, i).filter((x) => x.n === m.n).length;
                  const puestas = echado.filter((x) => x === m.n).length;
                  const yaEsta = echando && puestas > previas;
                  const dentro = yaEsta ? posicionDeLaEnesima(echado, m.n, previas) : -1;
                  return (
                    <HuecoMaterial
                      key={`${m.n}-${i}`}
                      oficio={receta.oficio}
                      n={m.n}
                      nombre={mat?.name ?? `Material ${m.n}`}
                      categoria={mat?.category}
                      cantidad={m.qty}
                      estado={yaEsta ? "echado" : (linea && linea.tiene >= linea.necesita) ? "listo" : "falta"}
                      orden={yaEsta ? dentro + 1 : undefined}
                      arrastrable={echando && !yaEsta}
                      onClick={echando && !yaEsta ? () => echarMaterial(m.n, orden) : undefined}
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", String(m.n))}
                    />
                  );
                })}
              </div>

              <p className="font-ui text-[11px] mb-3 text-center" style={{ color: "var(--color-dim)" }}>
                {dm
                  ? "Caja de arena: la tirada es de verdad, pero no se gasta ni se guarda nada."
                  : "Al fallar, los ingredientes se pierden igual. Un desastre además salpica."}
              </p>

              {/* El cupo se explica ANTES de tocar el botón: un botón apagado sin
                  motivo se lee como «te faltan cosas», que es justo lo que no es. */}
              {receta.cupo && (
                <p className="font-ui text-[11px] mb-3 text-center" style={{ color: cupoPillado ? "var(--color-ember)" : "var(--color-arcane-bright)" }}>
                  <i className="fas fa-hourglass-half mr-1.5" />
                  {cupoPillado
                    ? `El alambique se está asentando: faltan ${diasQueFaltan} día(s) para volver a intentar una de las dos grandes.`
                    : "Solo una de las dos grandes cada 1d6 días, y el cupo se gasta únicamente si sale bien."}
                </p>
              )}

              {fase === "resto" && puntoDeEchar !== null ? (
                <Manipulacion
                  yaSacado={[puntoDeEchar]}
                  reducido={reducido}
                  onCancelar={reposar}
                  onListo={(puntos) => {
                    void preparar(receta, totalManipulacion([puntoDeEchar, ...puntos]));
                  }}
                />
              ) : fase === "echar" ? (
                <button type="button" onClick={reposar}
                  className="w-full font-ui text-[11px] underline py-2" style={{ color: "var(--color-dim)" }}>
                  dejarlo
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Manipular es lo que da el ±3; «sin manipular» tira a pelo y
                      **siempre está**: es accesibilidad, y es el atajo para la
                      décima poción de la tarde. */}
                  <button
                    onClick={() => { setMsg(null); setEchado([]); setPuntoDeEchar(null); setFase("echar"); }}
                    disabled={busy || !listo}
                    className="btn-gold w-full !py-2.5 text-[13px] disabled:opacity-40"
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
                    className="panel px-4 py-2 font-ui text-[12px] font-bold disabled:opacity-40 hover:border-[var(--color-bronze)] transition-colors"
                    style={{ color: "var(--color-muted)" }}
                  >
                    Preparar sin manipular
                  </button>
                </div>
              )}

              {msg && (
                <p className="font-ui text-[13px] mt-4" style={{ color: msg.exito ? "var(--color-verdant)" : "var(--color-ember)" }}>
                  {msg.texto}
                </p>
              )}
            </>
          )}
        </div>

        {inv.error && (
          <p className="font-ui text-[12px] mt-3" style={{ color: "var(--color-ember)" }}>
            {inv.error}
          </p>
        )}
      </section>
    </div>
  );
}
