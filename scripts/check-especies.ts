// Comprobación del roster de especies. Uso: npx tsx scripts/check-especies.ts
import { SPECIES, REGIONS, regionSpecies, getSpecies } from "../data/species";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

check("hay 36 especies", SPECIES.length === 36);

// --- Integridad de cada ficha ---
for (const s of SPECIES) {
  check(`${s.slug}: slug en kebab-case`, /^[a-z0-9-]+$/.test(s.slug));
  check(`${s.slug}: name/tagline/blurb/origin no vacíos`,
    [s.name, s.tagline, s.blurb, s.origin].every((t) => t.trim().length > 0));
  check(`${s.slug}: al menos un rasgo`, s.traits.length > 0 && s.traits.every((t) => t.trim().length > 0));
  check(`${s.slug}: velocidad positiva`, s.speed > 0);
  check(`${s.slug}: tamaño conocido`, ["Pequeño", "Mediano", "Grande"].includes(s.size));
  if (s.lineages) {
    check(`${s.slug}: 2+ linajes si los declara`, s.lineages.length >= 2);
    check(`${s.slug}: linajes con nombre y ventaja`,
      s.lineages.every((l) => l.name.trim().length > 0 && l.perk.trim().length > 0));
    const nombres = s.lineages.map((l) => l.name);
    check(`${s.slug}: linajes sin repetir`, new Set(nombres).size === nombres.length);
  }
}

const slugs = SPECIES.map((s) => s.slug);
check("slugs únicos", new Set(slugs).size === slugs.length);
const nombres = SPECIES.map((s) => s.name);
check("nombres únicos", new Set(nombres).size === nombres.length);
check("getSpecies encuentra todas", slugs.every((sl) => !!getSpecies(sl)));
check("getSpecies con slug inventado no revienta", getSpecies("no-existe") === undefined);

// --- Regiones: lo que hace que la escena las vea ---
// SpeciesScene recorre REGIONS y filtra por región. Una especie con una región
// que no esté en REGIONS DESAPARECE de la escena sin dar ningún error, así que
// esta es la comprobación que de verdad protege el paso de Especie.
const claves = REGIONS.map((r) => r.key);
check("claves de región únicas", new Set(claves).size === claves.length);
check("REGIONS con etiqueta y blurb", REGIONS.every((r) => r.label.trim().length > 0 && r.blurb.trim().length > 0));
for (const s of SPECIES) {
  check(`${s.slug}: su región existe en REGIONS`, claves.includes(s.region));
}
for (const r of REGIONS) {
  check(`región ${r.key}: no está vacía`, regionSpecies(r.key).length > 0);
}
// El recorrido de las flechas es REGIONS.flatMap(...): tiene que cubrir las 36
// exactamente una vez, o navegando se saltarían especies.
const recorrido = REGIONS.flatMap((r) => regionSpecies(r.key));
check("el recorrido por región cubre las 36", recorrido.length === SPECIES.length);
check("el recorrido no repite ninguna", new Set(recorrido.map((s) => s.slug)).size === SPECIES.length);

console.log(failures ? `\n${failures} comprobación(es) fallida(s)` : "\nTodo en verde");
process.exit(failures ? 1 : 0);
