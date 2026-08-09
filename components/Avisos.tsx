"use client";
// El CÓMO de los avisos: el único archivo de la app que conoce SILEO.
//
// El QUÉ —el texto de cada suceso— vive en `lib/avisos.ts`, que es neutro y
// pasa por `scripts/check-avisos.ts`. Aquí solo se traduce a la llamada de la
// librería y se monta el contenedor.
//
// ⚠️ **SILEO va por la 0.1.5.** Si cambia de API o se abandona, se toca ESTE
// archivo y nada más: los sitios que avisan llaman a `avisar(...)` con un objeto
// del tipo `Aviso`, no a la librería.
// ⚠️ **La hoja de la librería hay que importarla A MANO.** `sileo` la publica
// como `sileo/styles.css` y NO la inyecta sola: sin esta línea los avisos salen
// sin una sola regla —sin caja, sin sombra, sin animación— y parecen un fallo
// de la app. Se fue así en el primer commit y no se vio porque el `<Toaster>`
// solo se monta con sesión y `/lugar` cae a `/login` sin ella.
import "sileo/styles.css";
import { sileo, Toaster } from "sileo";
import { textoDe, type Aviso } from "@/lib/avisos";

/**
 * Anuncia un suceso.
 *
 * Se puede llamar desde cualquier componente de cliente sin montar nada: el
 * `<Avisos />` del layout ya está puesto. Si no lo estuviera, SILEO se lo traga
 * en silencio y la app sigue funcionando — que es lo que se quiere de un aviso.
 */
export function avisar(a: Aviso): void {
  const { title, description, tono, acento, enfasis } = textoDe(a);
  sileo[tono]({
    title,
    description: describir(description, enfasis, acento),
  });
}

/**
 * La descripción con su trozo resaltado.
 *
 * Parte el texto en tres —lo de antes, el énfasis, lo de después— y solo el del
 * medio va en negrita y con color. Se hace aquí y no en `lib/avisos.ts` porque
 * esto ya es JSX: allí vive QUÉ se resalta, aquí CÓMO se pinta.
 *
 * Si el énfasis no aparece en el texto —no debería, el gate lo comprueba— se
 * devuelve la descripción tal cual en vez de romperse. Un aviso plano es peor
 * que uno bonito, pero mucho mejor que ninguno.
 */
function describir(description: string | undefined, enfasis: string | undefined, acento: string) {
  if (!description) return undefined;
  if (!enfasis) return description;
  const i = description.indexOf(enfasis);
  if (i < 0) return description;
  return (
    <>
      {description.slice(0, i)}
      <strong className={`aviso-enfasis acento-${acento}`}>{enfasis}</strong>
      {description.slice(i + enfasis.length)}
    </>
  );
}

/**
 * El fondo del aviso: el mismo `--color-panel` de la app (#131b25).
 *
 * ⚠️ **Va en hexadecimal y no como `var(--color-panel)` a propósito.** SILEO lo
 * pinta dentro de un SVG (`fill`), y ahí una variable de CSS del documento no
 * siempre resuelve. Si algún día se cambia la paleta, este número hay que
 * cambiarlo aquí — por eso está escrito con el nombre del token al lado.
 *
 * ⚠️ Y `theme` NO sirve para esto, aunque lo parezca: los rellenos de la
 * librería son `{ light: "#1a1a1a", dark: "#f2f2f2" }`, o sea que `theme`
 * describe **la página**, no el aviso. `theme="dark"` daba un aviso BLANCO, que
 * es justo lo que se veía mal sobre esta app.
 */
const FONDO = "#131b25"; // --color-panel

/**
 * El contenedor. Va una sola vez, en el layout.
 *
 * **Arriba y al centro**, a petición del usuario: es donde se mira cuando algo
 * acaba de pasar, y no compite con la hoja de personaje ni con el tablero de
 * dados, que viven abajo.
 */
export default function Avisos() {
  return <Toaster position="top-center" options={{ fill: FONDO }} />;
}
