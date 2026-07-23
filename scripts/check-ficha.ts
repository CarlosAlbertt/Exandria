// Comprobación del reintento tolerante a migraciones a medias.
// Uso: npx tsx scripts/check-ficha.ts
//
// Simula una base a la que le faltan columnas y comprueba que la ficha se
// carga igualmente, perdiendo solo esos campos. El caso real que lo motivó:
// una `characters` sin `lore` dejaba al jugador viendo «Aún no hay personaje»
// con el personaje intacto en la base (2026-07-22).

import { __selectToleranteParaTests as selectTolerante, __FIELD_LIST as FIELD_LIST } from "../lib/character";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// Base simulada: falla mientras el `select` pida una columna que no tiene.
function baseSin(ausentes: string[]) {
  let intentos = 0;
  const run = async (fields: string) => {
    intentos++;
    const pedidas = fields.split(", ");
    const falta = ausentes.find((c) => pedidas.includes(c));
    if (falta) {
      return { data: null as unknown, error: { code: "42703", message: `column characters.${falta} does not exist` } };
    }
    return { data: { ok: true, campos: pedidas } as unknown, error: null };
  };
  return { run, intentos: () => intentos };
}

(async () => {
  // Base al día: una sola consulta, con todo.
  const alDia = baseSin([]);
  const r1 = await selectTolerante(alDia.run, "la ficha");
  check("base al día: carga a la primera", !r1.error && alDia.intentos() === 1);
  check("base al día: pide todas las columnas", (r1.data as { campos: string[] }).campos.length === FIELD_LIST.length);

  // El caso real: falta `lore`.
  const sinLore = baseSin(["lore"]);
  const r2 = await selectTolerante(sinLore.run, "la ficha");
  check("sin `lore`: carga igualmente", !r2.error && !!r2.data);
  check("sin `lore`: la quita del select", !(r2.data as { campos: string[] }).campos.includes("lore"));
  check("sin `lore`: conserva el resto", (r2.data as { campos: string[] }).campos.includes("species"));
  check("sin `lore`: solo un reintento", sinLore.intentos() === 2);

  // Varias a la vez (una base muy vieja).
  const sinVarias = baseSin(["lore", "play_state", "deity"]);
  const r3 = await selectTolerante(sinVarias.run, "la ficha");
  const campos3 = (r3.data as { campos: string[] }).campos;
  check("faltan tres: carga igualmente", !r3.error && !!r3.data);
  check("faltan tres: las quita todas", !campos3.some((c) => ["lore", "play_state", "deity"].includes(c)));
  check("faltan tres: mantiene lo esencial", ["name", "species", "cls", "level"].every((c) => campos3.includes(c)));

  // Un error que NO es de columna: se propaga, no se reintenta en bucle.
  let vueltas = 0;
  const rota = await selectTolerante(async () => {
    vueltas++;
    return { data: null as unknown, error: { code: "42501", message: "permission denied" } };
  }, "la ficha");
  check("otro error se propaga sin reintentar", !!rota.error && vueltas === 1);

  // 42703 que no nombra columna conocida: no debe quedarse en bucle.
  let vueltas2 = 0;
  const rara = await selectTolerante(async () => {
    vueltas2++;
    return { data: null as unknown, error: { code: "42703", message: "algo raro sin nombre de columna" } };
  }, "la ficha");
  check("42703 irreconocible corta en seco", !!rara.error && vueltas2 === 1);

  console.log(failures ? `\n${failures} comprobación(es) fallida(s)` : "\nTodo en verde");
  process.exit(failures ? 1 : 0);
})();
