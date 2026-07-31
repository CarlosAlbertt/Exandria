// Utilidad neutral (sin "use client") para derivar slugs a partir de nombres.
// Vive aquí para poder importarse desde módulos de datos (data/*) sin arrastrar
// la frontera de cliente de lib/useAtlas.ts (o cualquier hook "use client") a
// un componente de servidor.

/**
 * Normaliza para comparar: sin mayúsculas, sin tildes, sin espacios de sobra.
 *
 * Vive aquí, y no en `lib/inventario.ts` donde nació, porque ahora la usan **dos
 * índices que se necesitan entre sí**: el de la bolsa (`lib/inventario.ts`) y el
 * de los materiales (`lib/materiales.ts`), que se importan mutuamente. Con
 * `norm` en cualquiera de los dos habría un ciclo de módulos; en un tercero
 * neutral no lo hay. `lib/inventario.ts` la reexporta, así que quien ya la
 * importaba de allí no se entera.
 *
 * Se comparte a propósito: que las comprobaciones normalicen **igual** que el
 * índice. Un check que compare de otra forma tiene un punto ciego justo donde el
 * índice es más permisivo (las tildes), y entonces no vigila lo que dice vigilar.
 */
export function norm(s: string): string {
  return s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// slug a partir del nombre (para regiones nuevas).
export function slugify(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `region-${Date.now()}`;
}
