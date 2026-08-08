// La Expansión Verdante por profundidad: qué te sale al cabo según lo adentro
// que estés del bosque.
//
// La región existe desde siempre (`data/taldorei.ts`, slug `expansion-verdante`,
// capital Syngorn), pero **no había ninguna tabla de encuentros por sitio**:
// `data/encounters.ts` solo trae `XP_BUDGET` y `CR_XP`, que son presupuesto y
// nada geográfico. Esto es lo primero que dice QUÉ vive DÓNDE.

import { ALL_MONSTERS } from "./bestiary";

/**
 * Las tres franjas, de fuera adentro.
 *
 * ⚠️ **Esto NO es el `depth` de `SaberEntry`.** Aquel tiene dos valores
 * (`"basico" | "profundo"`) y habla de **cuánto sabes** —lo que sabe cualquiera
 * frente a lo que sabe quien tiene el vínculo—. Este habla de **dónde estás**.
 * Son dos ejes que no se cruzan, y por eso el campo se llama `franja` y no
 * `depth`: llamarlos igual los habría confundido para siempre.
 */
export type Franja = "linde" | "espesura" | "corazon";

/**
 * La región del atlas a la que pertenecen las franjas.
 *
 * ⚠️ **Hace falta escrito.** Una franja **no es de ningún POI** (`poiDeNodo`
 * devuelve `null`), así que es el único nodo cuya región no se puede deducir de
 * su id. Y de la región salen el clima y el nombre que se pinta en la cabecera:
 * sin esto, el bosque heredaría el tiempo del pueblo desde el que se entró.
 *
 * El gate cruza este slug contra el atlas sembrado: si alguien renombra la
 * región, el bosque se queda sin tiempo y no salta nada.
 */
export const REGION_DEL_BOSQUE = "expansion-verdante";

export const FRANJAS: { key: Franja; label: string; blurb: string }[] = [
  {
    key: "linde",
    label: "La linde",
    blurb:
      "Los primeros kilómetros, donde todavía se ven los caminos de carro y el " +
      "humo de Syngorn entre las copas. Aquí el bosque aún se deja andar, pero " +
      "ya hay cosas que salen del suelo y cosas que bajan a por las colmenas.",
  },
  {
    key: "espesura",
    label: "La espesura",
    blurb:
      "Bajo el dosel cerrado ya no se distingue la hora. Aquí el bosque deja de " +
      "ser un sitio por el que se pasa y empieza a ser un sitio donde algo vive.",
  },
  {
    key: "corazon",
    label: "El corazón",
    blurb:
      "Donde los árboles llevan más años que Tal'Dorei y el pacto feérico aún se " +
      "respeta. No se entra sin permiso, y lo que hay dentro sabe si lo tienes. " +
      "Aquí sobrevive lo de una edad anterior, que nunca se fue.",
  },
];

/** Una entrada de la tabla. `name` apunta al `Monster.name` exacto. */
export type EncuentroBosque = {
  /** Nombre ES exacto, la misma clave que cruza el gate contra `ALL_MONSTERS`. */
  name: string;
  franja: Franja;
  /** Por qué está en esa franja, para que el DM no tenga que adivinarlo. */
  nota: string;
};

/**
 * ⚠️ **Los que TODAVÍA no tienen ficha.** Escrito a mano, y esa es la gracia.
 *
 * La tabla se escribe entera y el bestiario la va alcanzando (van 151 de 501
 * statblocks). Sin esta lista el gate no podría distinguir **un nombre mal
 * escrito** de **uno que aún no se ha extraído**, que es justo el fallo que
 * `check-despiece` cazó por mutación: un monstruo al que se le despieza y no
 * suelta nada sin que salte ningún error.
 *
 * Con la lista, el gate muerde **por los dos lados**: un nombre inventado no
 * está ni en `ALL_MONSTERS` ni aquí y falla; y cuando un lote futuro extraiga
 * uno de estos, falla también hasta que se le quite de aquí. Nadie puede
 * olvidarse de actualizarla.
 */
export const PENDIENTES: string[] = [
  // De los que pidió el DM.
  "Montículo Reptante", "Ser del Agua", "Unicornio", "Lobo Huargo",
  "Jabalí Gigante", "Centauro Guardián", "Centauro Soldado", "Oso Pardo",
  "Araña Gigante", "Osgo Acechador", "Cría de Dragón Verde",
  // Los que pide un bosque feérico y salen de cruzar el censo con el hábitat
  // "Forest" del apéndice B.
  "Dríade", "Sátiro Juerguista", "Duende", "Duende Prodigioso", "Ent",
  "Oso Lechuza", "Oso Lechuza Primigenio", "Ettercap", "Bruja Verde", "Worg",
  "Grick", "Arpía", "Peryton", "Hongo Chillón",
  // El fondo del corazón, pedido el 2026-08-08.
  //
  // ⚠️ **Los nombres ES son la CLAVE con la que se cruzará el statblock**, y los
  // puse yo traduciendo del inglés que se pidió: `Tyrannosaurus Rex`,
  // `Cyclops Sentry` y `Triceratops`. Si al extraerlos del Manual salen con otro
  // nombre, hay que cambiarlos **aquí y en la tabla**, o el gate los tratará como
  // inventados.
  "Triceratops", "Cíclope Centinela", "Tiranosaurio Rex",
];

/**
 * La tabla. Ordenada por franja y, dentro, de menos a más peligroso.
 *
 * La franja **la dicta la narración, no el CR**: el Ciervo y el Unicornio son
 * los dos bestias del bosque y están en extremos opuestos porque uno es comida
 * y el otro es un guardián. El CR solo pone el suelo y el techo, y de eso se
 * encarga el gate.
 */
export const ENCUENTROS_VERDANTE: EncuentroBosque[] = [
  /* ------------------------------ LA LINDE ------------------------------ */
  { name: "Ciervo", franja: "linde", nota: "Caza menor. Es lo que se ve antes de entender que el bosque mira." },
  { name: "Arbusto Despierto", franja: "linde", nota: "Centinela de los elfos: no ataca, avisa." },
  { name: "Araña", franja: "linde", nota: "Telas entre las ramas bajas, el primer aviso de lo que hay más adentro." },
  { name: "Jabalí", franja: "linde", nota: "Territorial y ciego de rabia. Mata más viajeros que ningún feérico." },
  { name: "Lobo", franja: "linde", nota: "En manada y por la linde, donde la caza es más fácil." },
  { name: "Búho Gigante", franja: "linde", nota: "Vigía de Syngorn. Habla, y decide si te deja pasar." },
  { name: "Plaga de Agujas", franja: "linde", nota: "Crece donde el bosque ya está herido: al borde de los caminos." },
  { name: "Sprite", franja: "linde", nota: "Guardia de frontera feérica. Te lee el corazón antes de dejarte seguir." },
  { name: "Perro Parpadeante", franja: "linde", nota: "Va y viene del Feywild sin avisar; la linde es donde el velo está más fino." },
  { name: "Araña Lobo Gigante", franja: "linde", nota: "Caza a la carrera, no con tela. El escalón entre la linde y la espesura." },
  { name: "Goblin Guerrero", franja: "linde", nota: "Partidas de saqueo que no se atreven a pasar del primer claro." },
  { name: "Hongo Chillón", franja: "linde", nota: "No hace daño: grita, y lo que viene detrás sí." },
  // Los tres que bajan de la espesura o entran nuevos. ⚠️ Rompen el techo de la
  // linde a propósito: hasta aquí era CR 1/4 y esto sube a 1 y a 2. Ver el aviso
  // en la cabecera de la tabla.
  { name: "Oso Pardo", franja: "linde", nota: "Baja al linde a por las colmenas y los frutales del camino. No busca pelea; la da si te interpones." },
  { name: "Araña Gigante", franja: "linde", nota: "Tela de verdad entre dos troncos del sendero: se cae en ella antes de verla." },
  { name: "Ankheg", franja: "linde", nota: "Sale del suelo en los claros de labranza, donde la tierra está removida. Es el techo del linde y el que enseña que aquí también se caza." },

  /* ----------------------------- LA ESPESURA ---------------------------- */
  { name: "Plaga de Enredaderas", franja: "espesura", nota: "Ya no crece al borde del camino: crece donde no hay camino." },
  { name: "Sátiro", franja: "espesura", nota: "Fiesta a deshora. Peligrosa por lo que te hace prometer, no por lo que pega." },
  { name: "Micónido Adulto", franja: "espesura", nota: "Colonias enteras bajo el dosel cerrado, donde no llega la luz." },
  { name: "Oso Negro", franja: "espesura", nota: "Territorio propio y cachorros detrás." },
  { name: "Hobgoblin Guerrero", franja: "espesura", nota: "Campamento organizado, no una partida suelta: han venido a quedarse." },
  { name: "Árbol Despierto", franja: "espesura", nota: "Ya no solo avisa. Aquí el bosque empieza a defenderse." },
  { name: "Dríade", franja: "espesura", nota: "Atada a su roble. Negocia antes que pelear, pero el roble no se toca." },
  { name: "Sátiro Juerguista", franja: "espesura", nota: "Como el sátiro, pero con menos escrúpulos y más aguante." },
  { name: "Duende", franja: "espesura", nota: "Se ríe de ti desde un sitio donde no estabas mirando." },
  { name: "Duende Prodigioso", franja: "espesura", nota: "La broma se vuelve trampa y la trampa mata." },
  { name: "Montículo Reptante", franja: "espesura", nota: "El suelo del bosque cuando el bosque decide moverse." },
  { name: "Ser del Agua", franja: "espesura", nota: "Los arroyos de la espesura llevan más años que Syngorn." },
  { name: "Lobo Huargo", franja: "espesura", nota: "El lobo de la linde, pero grande y sin miedo al fuego." },
  { name: "Worg", franja: "espesura", nota: "Habla, y sirve a quien le conviene. Suele venir con goblinoides encima." },
  { name: "Jabalí Gigante", franja: "espesura", nota: "Arrasa el sotobosque a su paso; se le oye antes de verlo." },
  // El Oso Pardo y la Araña Gigante se han ido al LINDE. No están duplicados
  // aquí a propósito: un bicho en dos franjas deja de decir dónde estás.
  { name: "Ettercap", franja: "espesura", nota: "Pastorea a las arañas. Donde hay tela ordenada, hay una." },
  { name: "Oso Lechuza", franja: "espesura", nota: "Sin territorio fijo y con muy mal genio. El encuentro que nadie busca." },
  { name: "Osgo Acechador", franja: "espesura", nota: "Te sigue dos días antes de saltar." },
  { name: "Grick", franja: "espesura", nota: "Tentáculos desde una grieta o desde una rama. Nunca de frente." },
  { name: "Arpía", franja: "espesura", nota: "Canta desde los claros altos, donde el eco engaña." },
  { name: "Peryton", franja: "espesura", nota: "Caza desde arriba y se lleva el corazón. Literalmente." },

  /* ----------------------------- EL CORAZÓN ----------------------------- */
  { name: "Ent", franja: "corazon", nota: "El bosque en pie. No negocia con quien ha talado." },
  { name: "Centauro Guardián", franja: "corazon", nota: "Patrulla el pacto. Pregunta primero, una vez." },
  { name: "Centauro Soldado", franja: "corazon", nota: "El que viene cuando el guardián ya preguntó." },
  { name: "Oso Lechuza Primigenio", franja: "corazon", nota: "El de la espesura, viejo y crecido en el sitio donde nadie lo molestó." },
  { name: "Bruja Verde", franja: "corazon", nota: "Vive del trato, y siempre sale ganando." },
  { name: "Unicornio", franja: "corazon", nota: "El corazón del bosque tiene guardián, y no perdona un paso de más." },
  // ⚠️ La nota decía «es el techo de la tabla» y ya NO lo es: por encima están el
  // Triceratops, el Cíclope y el Tiranosaurio. Una nota que se queda vieja es
  // peor que no tenerla, porque el DM la lee y decide con ella.
  { name: "Cría de Dragón Verde", franja: "corazon", nota: "Ya se cree el dueño, y aún no ha crecido. El más peligroso de lo que vuela aquí." },
  // Los tres del fondo del corazón. La justificación in-ficción es la que ya da
  // el blurb de la franja —«los árboles llevan más años que Tal'Dorei»—: aquí
  // sobrevive lo de una edad anterior, que nunca se fue.
  { name: "Triceratops", franja: "corazon", nota: "Pasta en los claros hondos como si el mundo de fuera no hubiera cambiado. No ataca: arrolla lo que se le pone delante." },
  { name: "Cíclope Centinela", franja: "corazon", nota: "Puesto de guardia de algo que ya no existe, y él no se ha enterado. Sigue cumpliendo la orden que le dieron." },
  { name: "Tiranosaurio Rex", franja: "corazon", nota: "Lo que había antes del pacto, y el pacto no lo incluye. Es el techo de la tabla y no negocia con nadie." },
];

/* ------------------------------ CONSULTAS ------------------------------ */

/** Las entradas de una franja, en el orden en que están escritas. */
export function encuentrosDe(franja: Franja): EncuentroBosque[] {
  return ENCUENTROS_VERDANTE.filter((e) => e.franja === franja);
}

/**
 * Las de una franja **que ya tienen ficha**, que son las que se pueden jugar.
 *
 * Un bicho pendiente de extraer **no sale**, y eso no es un fallo: es
 * exactamente lo mismo que hace el despiece con un monstruo sin ficha. La
 * tabla se escribió entera a propósito para que el bestiario la alcance.
 */
export function jugablesDe(franja: Franja) {
  const idx = new Map(ALL_MONSTERS.map((m) => [m.name, m]));
  return encuentrosDe(franja).flatMap((e) => {
    const m = idx.get(e.name);
    return m ? [{ ...e, monster: m }] : [];
  });
}
