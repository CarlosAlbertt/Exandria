import type { Monster } from "./types";
import { CR_0_MONSTERS } from "./cr-0";
import { CR_18_MONSTERS } from "./cr-18";

const ALL_CHUNKS: Monster[][] = [CR_0_MONSTERS, CR_18_MONSTERS];

export const MONSTERS: Partial<Record<string, Monster>> = Object.fromEntries(
  ALL_CHUNKS.flat().map((m) => [m.slug, m])
);

export function getMonster(slug: string | null | undefined): Monster | null {
  return (slug ? MONSTERS[slug] : null) ?? null;
}

export const ALL_MONSTERS: Monster[] = ALL_CHUNKS.flat();

/** Busca por nombre (ES/EN, subcadena, sin distinguir mayúsculas) y filtra por CR y/o tipo. */
export function searchMonsters(q: string, f?: { cr?: string; type?: string }): Monster[] {
  const query = q.trim().toLowerCase();
  return ALL_MONSTERS.filter((m) => {
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
