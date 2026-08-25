// Misiones individuales, como reglas puras.
//
// Módulo neutral (sin "use client" y sin importar nada) a propósito, igual que
// `lib/niebla.ts` y `lib/slug.ts`: así puede mirarlo `scripts/check-misiones.ts`.
// La niebla falló ABIERTA durante semanas precisamente porque su regla vivía
// dentro de un `.map` y no había forma de comprobarla; aquí lo que está en
// juego es quién lee la misión secreta de otro jugador, así que con más razón.
//
// `visiblePara` es el ESPEJO de la RLS de `schema_v24`, no la puerta: la base
// de datos vuelve a garantizarlo por su cuenta. Esto existe para que la
// interfaz sepa qué ofrecer sin tener que preguntar, y para que el gate pueda
// mirar la regla.

/** Lo mínimo que estas reglas necesitan saber de una misión. */
export type MisionMin = {
  id: number;
  title: string;
  status: "activa" | "completada" | "fallida" | "oculta" | "oferta";
  /** Ficha a la que está asignada, o null si es del grupo. */
  assigned_character_id: string | null;
  /** PNJ que la encarga, o null si es de tablón o del DM. */
  npc_id: number | null;
};

/* --------------------------------- VER --------------------------------- */

/**
 * ¿Se le enseña esta misión a quien mira?
 *
 * Tres ramas, y las tres importan:
 * - El DM lo ve todo, como siempre.
 * - Una misión **sin asignar** sigue siendo del grupo: se comporta como antes
 *   de la v24, que es lo que hace que abrir esto no esconda nada de lo viejo.
 * - Una **asignada** solo la ve quien tiene esa ficha. `misFichas` son TODAS
 *   las del jugador, archivadas incluidas: la misión de un personaje retirado
 *   sigue siendo suya de leer, y esconderla sería perderla al archivar.
 *
 * `oculta` es el borrador del DM y **no** se le enseña ni a su asignado.
 */
export function visiblePara(
  q: MisionMin,
  { esDm, misFichas }: { esDm: boolean; misFichas: readonly string[] },
): boolean {
  if (esDm) return true;
  if (q.status === "oculta") return false;
  if (q.assigned_character_id === null) return true;
  return misFichas.includes(q.assigned_character_id);
}

/** ¿Es individual? Lo pinta distinto `/cronica`. */
export function esIndividual(q: MisionMin): boolean {
  return q.assigned_character_id !== null;
}

/* ------------------------------- ACEPTAR -------------------------------- */

/**
 * Al aceptar una OFERTA del tablón, ¿se le asigna a la ficha de quien acepta?
 *
 * Asignarla la vuelve individual y la RLS de la `schema_v24` la esconde del
 * resto; dejarla sin asignar la deja siendo del grupo. La marca es el `npc_id`:
 * una oferta con PNJ se sacó hablando con alguien y es de quien habló; una de
 * tablón no tiene PNJ y sigue siendo de todos. Sin ficha en juego no se asigna
 * nada — el DM no tiene ficha, y quien dejó la creación a medias tampoco.
 *
 * ⚠️ **No es la misma regla que `esDelGrupo`, y no puede serlo.** Aquella mira
 * el `tamano` del CATÁLOGO; esta mira una fila de `quests` que **no tiene
 * columna `tamano`** (ver `schema_v12` y `schema_v24`): la escribió el DM a
 * mano y el catálogo no existe ahí. Son dos preguntas con dos entradas
 * distintas, y por eso viven separadas en vez de unificadas a la fuerza. Si
 * algún día `quests` guarda el tamaño, esto se replantea; hasta entonces,
 * juntarlas sería inventarse un dato que no está.
 *
 * Vivía dentro de `app/api/aceptar-encargo/route.ts`, donde ningún gate la veía.
 */
export function seAsignaAlAceptar(
  q: Pick<MisionMin, "npc_id">,
  tieneFichaEnJuego: boolean,
): boolean {
  return q.npc_id !== null && tieneFichaEnJuego;
}

/* ------------------------------- ENTREGAR ------------------------------- */

/**
 * Por qué NO se puede entregar esta misión, o `null` si sí se puede.
 *
 * ⚠️ **Esta es la regla, y antes estaba escrita DOS veces.** `opcionesDeMision`
 * decidía en el navegador qué opción enseñar, y `app/api/entregar-mision` volvía
 * a comprobar las mismas tres condiciones a mano contra la base de datos. Dos
 * copias, una vigilada por el gate y otra no: se tocaba esta y la puerta del
 * servidor se quedaba con el criterio viejo, en verde.
 *
 * Ahora la escriben las dos desde aquí. **Y la ruta sigue siendo la puerta**:
 * que el navegador no ofrezca la opción no impide llamar a la API a mano, así
 * que el servidor la vuelve a preguntar. Lo que se comparte es el CRITERIO, no
 * la confianza.
 *
 * Devuelve el motivo y no un booleano porque la ruta necesita decir CUÁL de las
 * tres falló: «ya no está en curso» y «no es tuya» no son el mismo error ni el
 * mismo código HTTP, y un booleano obligaría a la ruta a volver a mirarlo por su
 * cuenta — que es exactamente el problema que esto viene a quitar.
 *
 * El ORDEN importa y es el que ya tenía la ruta: primero el estado, luego el
 * PNJ, luego el dueño. Cambiarlo cambia qué mensaje ve el jugador.
 *
 * `no-existe` no está aquí a propósito: que la fila no aparezca en la tabla no
 * es una regla de misiones, es una búsqueda fallida, y la resuelve la ruta.
 */
export type MotivoNoEntregable = "no-activa" | "otro-pnj" | "no-es-tuya";

export function motivoNoEntregable(
  // Lo mínimo, y no `MisionMin` entero, para que la ruta pueda pasarle su fila
  // sin inventarse un `title` que no ha pedido a la base de datos.
  q: Pick<MisionMin, "status" | "npc_id" | "assigned_character_id">,
  npcId: number,
  fichaActivaId: string | null,
): MotivoNoEntregable | null {
  if (q.status !== "activa") return "no-activa";
  if (q.npc_id !== npcId) return "otro-pnj";
  if (q.assigned_character_id === null || q.assigned_character_id !== fichaActivaId) return "no-es-tuya";
  return null;
}

/**
 * Qué contesta la ruta por cada motivo.
 *
 * Vive aquí y no dentro del `if` de la ruta para que el gate pueda exigir que
 * **todo motivo tenga respuesta**. Un motivo nuevo sin entrada aquí dejaría a la
 * ruta cayéndose por el final con un 500 genérico, y eso no lo canta nadie.
 */
export const RESPUESTA_NO_ENTREGABLE: Record<MotivoNoEntregable, { status: number; error: string }> = {
  "no-activa": { status: 409, error: "Esa misión ya no está en curso." },
  "otro-pnj": { status: 409, error: "Esa misión no es de este personaje." },
  "no-es-tuya": { status: 403, error: "Esa misión no es tuya." },
};

/* ------------------------------- OPCIONES ------------------------------- */

/** Una opción de diálogo. `accion` la distingue de las que propone la IA. */
export type OpcionDialogo =
  | { texto: string; accion: null }
  | { texto: string; accion: "aceptar" | "entregar"; questId: number };

/**
 * Las opciones de misión que la app INYECTA al hablar con un PNJ.
 *
 * ⚠️ **Estas no las propone la IA, y es la decisión de diseño de la tanda.** Si
 * la opción de entregar saliera del modelo, se le olvidaría cuando toca y la
 * inventaría cuando no: la misión no se podría cerrar, o se cerraría sin
 * haberla hecho. La IA pone la voz; el estado lo mueve el servidor. Es la misma
 * línea que `bolsaDeArena` en el caldero.
 *
 * Devuelve como mucho UNA. Aceptar y entregar en el mismo turno sería aceptar
 * un encargo y darlo por hecho sin salir de la conversación.
 *
 * Sin ficha activa no hay nada que ofrecer: el DM no tiene ficha, y quien dejó
 * el asistente de creación a medias tampoco.
 */
export function opcionesDeMision(
  quests: readonly MisionMin[],
  npcId: number,
  fichaActivaId: string | null,
): OpcionDialogo[] {
  if (fichaActivaId === null) return [];
  const mias = quests.filter((q) => q.npc_id === npcId);

  // Entregar va primero: si ya tienes una suya hecha, eso es lo que quieres
  // decirle antes que aceptarle otra.
  //
  // ⚠️ El criterio es `motivoNoEntregable`, el MISMO que usa la ruta. Antes
  // estaba escrito aquí a mano y allí otra vez, y podían separarse sin que nada
  // fallara: el jugador veía la opción y el servidor se la negaba, o al revés.
  const entregable = mias.find((q) => motivoNoEntregable(q, npcId, fichaActivaId) === null);
  if (entregable) {
    return [{ texto: `Está hecho: ${entregable.title}`, accion: "entregar", questId: entregable.id }];
  }

  const ofrecida = mias.find((q) => q.status === "oferta" && q.assigned_character_id === null);
  if (ofrecida) {
    return [{ texto: `Acepto el encargo: ${ofrecida.title}`, accion: "aceptar", questId: ofrecida.id }];
  }

  return [];
}

/* -------------------------- EL BLOQUE DE LA IA -------------------------- */

// Cuántas opciones de conversación se aceptan. Más de cuatro y la pantalla deja
// de leerse como una novela visual y pasa a ser una lista.
const MAX_OPCIONES = 4;

const APERTURA = "<opciones>";
const CIERRE = "</opciones>";

/**
 * Separa la respuesta en personaje del bloque de opciones que la acompaña.
 *
 * Una sola llamada por turno y no dos: pedirle las opciones aparte con
 * `generarJSON` doblaría el coste contra un `qwen2.5:14b` local por túnel —el
 * timeout de `/api/ia` es de 180 s— y la conversación se volvería inusable.
 *
 * **Falla abierto a lo que ya funciona**: si el modelo no emite el bloque, o lo
 * emite mal, salen `opciones: []` y el texto entero. Que es exactamente la app
 * de antes de esta tanda, con su caja de texto libre. Ninguna conversación se
 * rompe porque el modelo no colabore.
 *
 * ⚠️ Un bloque **sin cerrar** —el modelo se quedó sin `num_predict` a media
 * lista— se recorta igual hasta el final. Lo contrario dejaría un `<opciones>`
 * crudo impreso dentro del globo de diálogo del PNJ.
 */
export function parseOpciones(reply: string): { texto: string; opciones: string[] } {
  const i = reply.indexOf(APERTURA);
  if (i < 0) return { texto: reply.trim(), opciones: [] };

  const texto = reply.slice(0, i).trim();
  const j = reply.indexOf(CIERRE, i);
  // Sin cierre, el bloque llega hasta el final: se recorta entero igual.
  const cuerpo = reply.slice(i + APERTURA.length, j < 0 ? reply.length : j);

  const opciones = cuerpo
    .split("\n")
    .map((l) => l.replace(/^\s*[-*•]\s*/, "").replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter((l) => l.length > 0)
    .slice(0, MAX_OPCIONES);

  return { texto, opciones };
}

/**
 * Lo que se le añade a la persona del PNJ para que emita el bloque.
 *
 * Va aparte de `personaFor` porque `personaFor` compone QUIÉN es el PNJ y esto
 * es CÓMO tiene que formatear; mezclarlos haría que tocar el formato obligara a
 * tocar la personalidad.
 */
export const INSTRUCCION_OPCIONES =
  `Después de tu respuesta, y SOLO después, escribe una línea con ${APERTURA}, ` +
  `luego de 2 a ${MAX_OPCIONES} líneas que empiecen por "- " con lo que el ` +
  `aventurero podría decirte o hacer a continuación (en primera persona, breves, ` +
  `distintas entre sí), y una línea final con ${CIERRE}. No menciones ese bloque ` +
  `dentro de tu respuesta ni hables de él.`;
