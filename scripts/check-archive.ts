// Comprobación manual de lib/archive.ts. Uso: npx tsx scripts/check-archive.ts
import { MAX_CHARACTERS, activeOf, archivedOf, canCreate, canRestore, type CharSlot } from "../lib/archive";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const activo: CharSlot = { id: "a", archived_at: null };
const arch1: CharSlot = { id: "b", archived_at: "2026-07-17T10:00:00Z" };
const arch2: CharSlot = { id: "c", archived_at: "2026-07-17T11:00:00Z" };

check("MAX_CHARACTERS = 3", MAX_CHARACTERS === 3);

// activeOf: el que no tiene archived_at
check("activeOf encuentra el activo", activeOf([arch1, activo, arch2])?.id === "a");
check("activeOf sin activo = null", activeOf([arch1, arch2]) === null);
check("activeOf sin personajes = null", activeOf([]) === null);

// archivedOf: los demás
check("archivedOf devuelve solo archivados", archivedOf([arch1, activo, arch2]).length === 2);
check("archivedOf sin archivados = vacío", archivedOf([activo]).length === 0);

// canCreate: solo si NO hay activo y quedan huecos. /crear EDITA el activo, así
// que con activo no se crea nada nuevo.
check("canCreate con activo = false", canCreate([activo]) === false);
check("canCreate sin activo y 0 = true", canCreate([]) === true);
check("canCreate sin activo y 2 archivados = true", canCreate([arch1, arch2]) === true);
check("canCreate sin activo y 3 archivados = false (límite)",
  canCreate([arch1, arch2, { id: "d", archived_at: "2026-07-17T12:00:00Z" }]) === false);

// canRestore: el DM solo puede devolver a juego si el jugador NO tiene activo
// (si no, chocaría contra el índice único parcial).
check("canRestore sin activo = true", canRestore([arch1, arch2]) === true);
check("canRestore con activo = false", canRestore([activo, arch1]) === false);
check("canRestore sin personajes = true", canRestore([]) === true);

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} fallaron.`);
process.exit(failures === 0 ? 0 : 1);
