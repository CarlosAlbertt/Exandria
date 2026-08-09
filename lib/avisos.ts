// QUÉ dice cada aviso. Módulo neutro: sin "use client" y **sin importar SILEO**.
//
// ⚠️ La partición es deliberada y es la lección de siempre: si el texto de los
// avisos viviera dentro del componente que llama a la librería, **ningún gate
// podría mirarlo** — como pasó con `puedeSembrar` y con las dos reglas de
// `/api/descanso`. Aquí está el QUÉ, en `components/Avisos.tsx` está el CÓMO, y
// `scripts/check-avisos.ts` puede comprobar que todo evento tiene texto.
//
// El otro motivo: SILEO va por la 0.1.5. Una librería en esa versión cambia de
// API o se queda sin mantenimiento, y cuando pase habrá que tocar UN archivo
// —el otro— y no los quince sitios que avisan.

/** Todo lo que la app puede anunciar. */
export type Aviso =
  // --- Misiones -------------------------------------------------------------
  | { tipo: "mision-aceptada"; titulo: string; recompensa?: string }
  | { tipo: "mision-ya-la-tenias"; titulo: string }
  | { tipo: "mision-completada"; titulo: string; recompensa?: string }
  | { tipo: "mision-fallida"; titulo: string }
  // --- Lo que se lleva encima ----------------------------------------------
  | { tipo: "objeto"; name: string; qty?: number }
  | { tipo: "oro"; cantidad: number }
  // --- Lo que se descubre ---------------------------------------------------
  | { tipo: "pista"; texto: string }
  | { tipo: "saber"; cuantas: number }
  // --- La ficha -------------------------------------------------------------
  | { tipo: "nivel"; nivel: number }
  | { tipo: "descanso"; largo: boolean };

/** El tono, en los términos de SILEO (`SileoState`) pero sin importar nada. */
export type TonoAviso = "success" | "info" | "warning" | "error";

/**
 * El color del aviso, por lo que ES y no por si salió bien o mal.
 *
 * ⚠️ **No es lo mismo que `tono`, y por eso son dos campos.** El tono es el
 * estado —bien, mal, informativo— y SILEO lo usa para el icono. El acento es la
 * MATERIA: el oro se lee en dorado, un objeto en pergamino, una misión en
 * bronce claro. Con un solo campo, «Encargo aceptado» y «Has recibido 50 po»
 * serían del mismo color por ser los dos `success`, y se leen igual de sosos.
 *
 * Los valores son tokens, no colores: la traducción a CSS vive en `globals.css`
 * y aquí no se importa nada.
 */
export type AcentoAviso = "oro" | "objeto" | "mision" | "saber" | "peligro" | "descanso";

export type TextoAviso = {
  title: string;
  description?: string;
  tono: TonoAviso;
  acento: AcentoAviso;
  /**
   * El trozo de la descripción que va en negrita y con el color del acento.
   *
   * ⚠️ Tiene que estar CONTENIDO en `description`, y el gate lo exige: si no,
   * el resaltado no se aplica y el aviso sale plano sin que nadie se entere.
   */
  enfasis?: string;
};

/**
 * El texto de un aviso. Función PURA: entra el suceso, sale lo que se lee.
 *
 * ⚠️ **Ni un solo `title` vacío**, y el gate lo exige. Un aviso sin título en
 * SILEO se pinta como una caja gris sin nada dentro: el jugador ve que ha
 * pasado *algo* y no sabe qué, que es peor que no avisar.
 */
export function textoDe(a: Aviso): TextoAviso {
  switch (a.tipo) {
    case "mision-aceptada":
      // El énfasis va en la RECOMPENSA cuando la hay: es lo que el jugador
      // busca con los ojos. Sin recompensa escrita, en el título del encargo.
      return {
        title: "Encargo aceptado",
        description: a.recompensa
          ? `${a.titulo} · Pagan: ${a.recompensa}`
          : a.titulo,
        tono: "success", acento: a.recompensa ? "oro" : "mision",
        enfasis: a.recompensa ?? a.titulo,
      };

    // No es un error y no se pinta como tal: es que ya la llevabas. Pasa al
    // repetir la conversación con el mismo PNJ, y sin avisar el jugador cree
    // que el botón no ha hecho nada y le da otra vez.
    case "mision-ya-la-tenias":
      return { title: "Ya llevas ese encargo", description: a.titulo, tono: "info", acento: "mision", enfasis: a.titulo };

    case "mision-completada":
      return {
        title: "Encargo completado",
        description: a.recompensa ? `${a.titulo} · Te dan: ${a.recompensa}` : a.titulo,
        tono: "success", acento: a.recompensa ? "oro" : "mision",
        enfasis: a.recompensa ?? a.titulo,
      };

    case "mision-fallida":
      return { title: "Encargo fallido", description: a.titulo, tono: "error", acento: "peligro", enfasis: a.titulo };

    case "objeto":
      return {
        title: "A la bolsa",
        description: a.qty && a.qty > 1 ? `${a.name} ×${a.qty}` : a.name,
        tono: "success", acento: "objeto",
        enfasis: a.name,
      };

    case "oro":
      // El signo va delante porque se cobra Y se paga: «−12 po» al comprar es
      // el mismo aviso, y sin signo los dos se leen igual. La cifra ENTERA va
      // resaltada —signo incluido—, que es lo único que se mira aquí.
      return {
        title: a.cantidad >= 0 ? "Monedas" : "Has pagado",
        description: `${a.cantidad >= 0 ? "+" : "−"}${Math.abs(a.cantidad)} po`,
        tono: a.cantidad >= 0 ? "success" : "info",
        acento: a.cantidad >= 0 ? "oro" : "peligro",
        enfasis: `${a.cantidad >= 0 ? "+" : "−"}${Math.abs(a.cantidad)} po`,
      };

    case "pista":
      return { title: "Has atado cabos", description: a.texto, tono: "info", acento: "saber" };

    case "saber":
      return {
        title: a.cuantas === 1 ? "Sabes algo nuevo" : "Sabes cosas nuevas",
        description: a.cuantas === 1
          ? "Una entrada nueva en tu saber."
          : `${a.cuantas} entradas nuevas en tu saber.`,
        tono: "info", acento: "saber",
        enfasis: a.cuantas === 1 ? "Una entrada nueva" : `${a.cuantas} entradas nuevas`,
      };

    case "nivel":
      return {
        title: "¡Has subido de nivel!",
        description: `Ahora eres de nivel ${a.nivel}.`,
        tono: "success", acento: "mision", enfasis: `nivel ${a.nivel}`,
      };

    case "descanso":
      return a.largo
        ? { title: "Descanso largo", description: "Recuperas los PG, los espacios y los usos diarios.", tono: "success", acento: "descanso", enfasis: "los PG, los espacios y los usos diarios" }
        : { title: "Descanso corto", description: "Una hora. Puedes gastar Dados de Golpe.", tono: "info", acento: "descanso", enfasis: "Dados de Golpe" };
  }
}

/** Todos los tipos que existen, para que el gate los recorra sin olvidarse uno. */
export const TIPOS_AVISO = [
  "mision-aceptada", "mision-ya-la-tenias", "mision-completada", "mision-fallida",
  "objeto", "oro", "pista", "saber", "nivel", "descanso",
] as const;
