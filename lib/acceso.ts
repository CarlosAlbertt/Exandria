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
  "/reino",
  "/lugar",
  "/cerrado",
  "/login",
] as const;

/** La página que se pinta en lugar de una ruta cerrada. */
export const RUTA_CERRADA = "/cerrado";

/** Los enlaces de la barra, en orden. `SiteNav` los filtra con `puedeVer`. */
export const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/", label: "Inicio" },
  { href: "/personaje", label: "Ficha" },
  { href: "/reino", label: "Reino" },
  { href: "/panteon", label: "Panteón" },
  { href: "/cronica", label: "Crónica" },
  { href: "/bestiario", label: "Bestiario" },
  { href: "/crear", label: "Crear" },
  { href: "/inventario", label: "Inventario" },
  { href: "/mapa", label: "Mapa" },
  { href: "/combate", label: "Combate" },
  { href: "/narrador", label: "Narrador" },
  { href: "/dm", label: "Panel DM" },
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
