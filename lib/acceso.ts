import type { Role } from "@/lib/auth";

/**
 * Las rutas que un jugador puede ver durante el arranque de campaña.
 * Abrir una sección es añadir su ruta aquí y desplegar: el nav, la puerta del
 * proxy y la portada leen todos de esta lista, así que no pueden divergir.
 * `/cerrado` y `/login` van dentro porque son alcanzables por cualquiera (si
 * `/cerrado` se cerrase a sí misma, el rewrite entraría en bucle).
 */
export const RUTAS_JUGADOR = [
  "/",
  "/crear",
  "/personaje",
  "/inventario",
  // El taller de oficios. Va una sola ruta con PESTAÑAS por oficio, y no una
  // ruta por oficio, justo para no volver a tocar este archivo: abrir la forja
  // o la destilación mañana no vuelve a pasar por aquí ni por el nav.
  "/taller",
  "/reino",
  "/lugar",
  "/cerrado",
  "/login",
] as const;

/** La página que se pinta en lugar de una ruta cerrada. */
export const RUTA_CERRADA = "/cerrado";

/**
 * Rutas que dejan de tener sentido **en cuanto el jugador tiene ficha**.
 *
 * `/crear` no se cierra por permisos —el jugador puede crear— sino porque ya lo
 * ha hecho: dejarla en la barra invita a empezar otra, y el jugador solo tiene
 * tres huecos. **Al DM no se le esconde**: monta fichas para la mesa.
 *
 * Una fila a medio crear NO cuenta como ficha (`tienePersonaje` en
 * `lib/character.ts`): si contara, quien dejó el asistente por la mitad se
 * quedaría sin poder volver a él.
 */
export const RUTAS_SOLO_SIN_PERSONAJE = ["/crear"] as const;

/**
 * ¿Se le enseña esta ruta a este rol **ahora mismo**?
 *
 * Es `puedeVer` más el estado de la partida. Se separa a propósito: `puedeVer`
 * es la puerta (quién puede entrar) y esto es el escaparate (qué tiene sentido
 * enseñar). El proxy sigue usando `puedeVer` — esconder `/crear` no es una
 * medida de seguridad y no debe comportarse como si lo fuera.
 */
export function puedeVerAhora(role: Role, href: string, tienePersonaje: boolean): boolean {
  if (!puedeVer(role, href)) return false;
  if (role === "dm") return true;
  if (tienePersonaje && (RUTAS_SOLO_SIN_PERSONAJE as readonly string[]).includes(href)) return false;
  return true;
}

/** Los enlaces de la barra, en orden. `SiteNav` los filtra con `puedeVer`. */
export const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/", label: "Inicio" },
  { href: "/personaje", label: "Ficha" },
  { href: "/reino", label: "Reino" },
  { href: "/panteon", label: "Panteón" },
  { href: "/cronica", label: "Crónica" },
  { href: "/bestiario", label: "Bestiario" },
  // Los catálogos de oficio del máster. Cerrada al jugador: su libro de recetas
  // está en el taller — la gracia del oficio es descubrirlo, no leer la lista.
  { href: "/oficios", label: "Oficios" },
  { href: "/crear", label: "Crear" },
  { href: "/inventario", label: "Inventario" },
  { href: "/taller", label: "Taller" },
  { href: "/mapa", label: "Mapa" },
  { href: "/combate", label: "Combate" },
  { href: "/narrador", label: "Narrador" },
  { href: "/dm", label: "Panel DM" },
];

/**
 * Las puertas del jugador: las secciones que puede tocar en el arranque.
 * Las pintan la portada (`components/home/PanelJugador.tsx`) y la página
 * `/cerrado`. Viven aquí y no en cada componente para que no puedan quedarse
 * enlazando a una sección que se haya cerrado: el gate comprueba que todas
 * pasan `puedeVer("player", …)`.
 */
export const PUERTAS_JUGADOR: {
  href: string;
  icon: string;
  label: string;
  text: string;
  accent: string;
}[] = [
  { href: "/personaje", icon: "fa-scroll", label: "Tu ficha", text: "Aptitudes, salvaciones, pericias, equipo y nivel de tu héroe.", accent: "var(--color-arcane)" },
  { href: "/inventario", icon: "fa-sack-xmark", label: "Tu inventario", text: "Lo que llevas encima, lo que pesa y lo que llevas puesto.", accent: "var(--color-bronze)" },
  { href: "/reino", icon: "fa-book-open", label: "El reino", text: "La historia de Exandria y las tierras que vais conociendo.", accent: "var(--color-primitivo)" },
  { href: "/crear", icon: "fa-hat-wizard", label: "Crear personaje", text: "Especie, clase, trasfondo y aptitudes del reglamento 2024.", accent: "var(--color-violet)" },
];

/**
 * ¿Puede este rol ver esta ruta? El DM lo ve todo.
 * La barra del `startsWith` es obligatoria: sin ella `/reino` dejaría entrar a
 * `/reinos`, y `/` dejaría entrar a todo.
 */
export function puedeVer(role: Role, path: string): boolean {
  if (role === "dm") return true;
  return RUTAS_JUGADOR.some(
    (r) => path === r || (r !== "/" && path.startsWith(r + "/"))
  );
}
