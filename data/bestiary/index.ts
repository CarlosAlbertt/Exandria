import type { Monster } from "./types";
import { CR_0_MONSTERS } from "./cr-0";
import { CR_18_MONSTERS } from "./cr-18";
import { CR_14_MONSTERS } from "./cr-14";
import { CR_12_MONSTERS } from "./cr-12";
import { LOTE_01_MONSTERS } from "./lote-01";

const ALL_CHUNKS: Monster[][] = [CR_0_MONSTERS, CR_18_MONSTERS, CR_14_MONSTERS, CR_12_MONSTERS, LOTE_01_MONSTERS];

export const MONSTERS: Partial<Record<string, Monster>> = Object.fromEntries(
  ALL_CHUNKS.flat().map((m) => [m.slug, m])
);

export function getMonster(slug: string | null | undefined): Monster | null {
  return (slug ? MONSTERS[slug] : null) ?? null;
}

export const ALL_MONSTERS: Monster[] = ALL_CHUNKS.flat();

/**
 * Busca por nombre (ES/EN, subcadena, sin distinguir mayúsculas) y filtra por
 * CR y/o tipo.
 *
 * Recibe la lista sobre la que buscar en vez de mirar siempre `ALL_MONSTERS`,
 * porque quien busca de verdad es el DM y su lista **incluye los monstruos
 * personalizados** que `useBestiary` superpone. Buscar sobre los estáticos
 * dejaría fuera justo los que él mismo se ha inventado.
 *
 * **No recorta el resultado**: cuántos caben en pantalla lo decide quien pinta,
 * y el desplegable del selector ya scrollea. Recortar aquí fue un fallo real —
 * con un tope de 10 sobre 124 monstruos, el DM veía siempre los mismos diez.
 */
export function searchMonsters(lista: Monster[], q: string, f?: { cr?: string; type?: string }): Monster[] {
  const query = q.trim().toLowerCase();
  return lista.filter((m) => {
    const matchesQuery =
      query.length === 0 ||
      m.name.toLowerCase().includes(query) ||
      m.nameEn.toLowerCase().includes(query);
    const matchesCr = !f?.cr || m.cr === f.cr;
    const matchesType = !f?.type || m.type === f.type;
    return matchesQuery && matchesCr && matchesType;
  });
}

export type { Monster, MonsterAbility } from "./types";
