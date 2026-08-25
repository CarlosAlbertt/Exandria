// El catálogo de misiones PREPARADAS: lo que el DM tiene escrito de antemano
// para poder sacarlo en mesa sin improvisar.
//
// ⚠️ **Esto NO es la tabla `quests` de Supabase.** Aquella es el ESTADO de una
// misión en curso —quién la lleva, si está activa, quién la encargó— y la
// escribe el DM desde el panel. Esto es el GUION, que no cambia y por eso puede
// vivir en el repo y pasar por el gate. El puente entre las dos es el campo
// `body`: se copia tal cual en `quests.body` el día que la misión se abre.
//
// ⚠️ **Y NO es `lib/misiones.ts`**, que son las reglas puras de quién ve qué.
//
// La razón de que esto sea TypeScript y no una carpeta de markdown es una sola,
// y es la que se decidió el 2026-08-08: **un guion puede citar un monstruo que
// no existe**. Escribes «tres osgos acechadores» en un documento, llega el día
// de jugar, y resulta que el Osgo Acechador está en `PENDIENTES` y no tiene
// statblock. Con el catálogo tipado, `scripts/check-misiones.ts` cruza cada
// nombre contra `ALL_MONSTERS` y cada lugar contra el atlas, y eso no pasa.

/**
 * Para cuánta gente está pensada.
 *
 * No es una etiqueta decorativa: de aquí sale el número de jugadores con el que
 * el gate calcula el presupuesto de XP, así que cambiarla cambia si la misión
 * está bien medida o no.
 */
export type Tamano = "solitaria" | "pareja" | "trio" | "grupo" | "legendaria";

/**
 * Los cinco tamaños, EN ORDEN, de menos gente a más.
 *
 * ⚠️ Va aquí y no escrito a mano en la pantalla que los pinte. El panel del
 * catálogo tenía su propia copia, y una lista paralela se queda vieja sola: se
 * añade un tamaño, nadie toca la copia, y el filtro deja de ofrecerlo sin que
 * falle nada. Misma lección que el recuento de PNJ de `check-lugares`.
 */
export const TAMANOS: Tamano[] = ["solitaria", "pareja", "trio", "grupo", "legendaria"];

export const TAMANO_LABEL: Record<Tamano, string> = {
  solitaria: "En solitario",
  pareja: "Para dos",
  trio: "Para tres",
  grupo: "Para el grupo entero",
  legendaria: "Legendaria — se puede morir",
};

/**
 * ¿La misión es DEL GRUPO, o de quien la saca hablando?
 *
 * ⚠️ **Esto decide quién la ve.** Una misión del grupo se abre SIN asignar a
 * ninguna ficha, y la RLS de la `schema_v24` enseña las no asignadas a todo el
 * mundo; una asignada solo la ve su dueño. Así que equivocarse aquí no da error:
 * o esconde del resto del grupo una misión que era de todos, o enseña a todos
 * una que era de uno.
 *
 * Vivía DENTRO de `app/api/mision-dialogo/route.ts`, escrita como
 * `m.tamano === "grupo" || m.tamano === "legendaria"`. Una regla dentro de una
 * ruta no la mira ningún gate: se podía añadir un `Tamano` nuevo y esta línea lo
 * trataba como individual en silencio, con las 45 comprobaciones en verde.
 *
 * Se resuelve por LISTA y no por comparaciones sueltas para que
 * `check-misiones` pueda cruzarla contra `TAMANOS` y cantar un tamaño sin
 * clasificar.
 */
export const TAMANOS_DE_GRUPO: Tamano[] = ["grupo", "legendaria"];

export function esDelGrupo(tamano: Tamano): boolean {
  return TAMANOS_DE_GRUPO.includes(tamano);
}

/** Un combate escrito, con la cuenta hecha. */
export type Encuentro = {
  nombre: string;
  /** Nombres EXACTOS de `Monster.name`. El gate exige que tengan ficha. */
  monstruos: { name: string; n: number }[];
  /** XP total. El gate la recalcula desde `CR_XP` y no se fía de este número. */
  xp: number;
  /** Cómo se comporta, para que el DM no tenga que decidirlo en caliente. */
  nota: string;
};

/** Un tramo de la misión. El orden es el orden en que se juega. */
export type Escena = { titulo: string; texto: string };

export type Mision = {
  /** kebab, único en todo el catálogo. */
  slug: string;
  /** Lo que se copia en `quests.title`. */
  titulo: string;
  tamano: Tamano;
  /** Para cuántos está presupuestada. El gate mide el XP contra este número. */
  jugadores: number;
  /** Rango de nivel [min, max] para el que está escrita. */
  nivel: [number, number];
  /**
   * Dónde pasa. Un POI del atlas (`Byroden`, `Emon`…) o un nodo de franja
   * (`franja:linde`). El gate comprueba que exista: una misión en un sitio
   * inventado no se puede poner en el mapa.
   */
  lugar: string;
  /** Quién la encarga, si la encarga alguien. */
  encargante?: string;
  /** Cómo llega a los jugadores. */
  gancho: string;
  escenas: Escena[];
  encuentros: Encuentro[];
  recompensa: string;
  /** Qué pasa si sale mal. Escrito de antemano para no castigar improvisando. */
  siFalla: string;
  /** Lo que ven los jugadores. Se pega tal cual en `quests.body`. */
  body: string;
  /**
   * Cómo se encuentra esta misión SIN que nadie la encargue.
   *
   * ⚠️ **No todas lo llevan, y ahí está la gracia.** Solo las que un grupo
   * observador encontraría por su cuenta: unas lápidas torcidas, un rastro en el
   * arcén, la cara de alguien que lleva semanas sin dormir. Las demás siguen
   * necesitando que un PNJ las dé, que es lo que mantiene a los PNJ en el
   * centro. Si todas fueran descubribles, hablar con la gente sería opcional.
   *
   * `pericia` se limita a las TRES de buscar —Percepción, Perspicacia,
   * Supervivencia— y el gate lo exige: con Historia o Religión esto sería otra
   * vez la tirada de saber, que ya existe (`SaberRoll`) y hace otra cosa.
   *
   * `texto` es lo que se ve al acertar, y va escrito desde los ojos del
   * jugador. No dice el nombre de la misión: dice qué hay raro.
   */
  descubrimiento?: {
    pericia: "Percepción" | "Perspicacia" | "Supervivencia";
    cd: number;
    texto: string;
  };
  /**
   * Se salta el presupuesto ALTO a propósito.
   *
   * ⚠️ El gate lo usa **en los dos sentidos**: una misión normal que se pase de
   * `alta` falla, y una legendaria que NO se pase también. Una legendaria
   * medida como un encuentro cómodo es una promesa incumplida — se anuncia como
   * mortal y no mata a nadie.
   */
  letal?: boolean;
};
