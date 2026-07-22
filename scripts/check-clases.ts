// Comprobación manual de los pozos de clase. Uso: npx tsx scripts/check-clases.ts
import { CLASS_MECHANICS } from "../data/classdata";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const clases = Object.values(CLASS_MECHANICS).filter((c): c is NonNullable<typeof c> => !!c);
// Nota: el plan original decía "14 clases"; CLASS_MECHANICS solo registra 13
// (barbaro, bardo, brujo, clerigo, druida, explorador, guerrero, hechicero,
// mago, monje, paladin, picaro, cazador-de-sangre). Cifra ajustada a la real.
check("hay 13 clases con mecánicas", clases.length === 13);

for (const c of clases) {
  for (const r of c.resources ?? []) {
    check(`${c.slug} · ${r.name}: 20 niveles`, r.values.length === 20);
    if (!r.spend) continue;
    check(`${c.slug} · ${r.name}: el pozo es numérico`, r.values.every((v) => typeof v === "number"));
    const nums = r.values as number[];
    check(`${c.slug} · ${r.name}: nunca decrece al subir`, nums.every((v, i) => i === 0 || v >= nums[i - 1]));
    check(`${c.slug} · ${r.name}: recarga declarada`, r.spend.recharge === "corto" || r.spend.recharge === "largo");
    check(`${c.slug} · ${r.name}: key en kebab-case`, /^[a-z0-9-]+$/.test(r.spend.key));
  }
  const keys = (c.resources ?? []).filter((r) => r.spend).map((r) => r.spend!.key);
  check(`${c.slug}: sin keys de pozo repetidas`, new Set(keys).size === keys.length);
}

const todasLasKeys = clases.flatMap((c) => (c.resources ?? []).filter((r) => r.spend).map((r) => r.spend!.key));
// Nota: el plan original decía "11 pozos". Clérigo (Usos de Canalizar
// Divinidad), Druida (Usos de Forma Salvaje) y Paladín (Usos de Canalizar
// Divinidad) traen "—"/"Ilimitados" en niveles donde aún no se tiene el
// rasgo: no son 100% numéricos, así que NO se marcan como pozo en esta
// tanda (ver informe). Quedan 8 pozos marcados.
check("hay 8 pozos marcados en total", todasLasKeys.length === 8);

console.log(failures ? `\n${failures} comprobación(es) fallida(s)` : "\nTodo en verde");
process.exit(failures ? 1 : 0);
