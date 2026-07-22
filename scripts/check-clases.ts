// Comprobación manual de los pozos de clase. Uso: npx tsx scripts/check-clases.ts
import { CLASS_MECHANICS } from "../data/classdata";
import { pozosDe, referenciasDe, gastar, devolver, recargar, type PlayState } from "../lib/recursos";

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
    // Las tablas usan dos centinelas además de los números: "—" para los
    // niveles en que la clase aún no tiene el rasgo, e "Ilimitados" para la
    // Forma Salvaje del druida a nv20. lib/recursos.ts los traduce.
    const CENTINELAS = ["—", "Ilimitados"];
    check(`${c.slug} · ${r.name}: valores numéricos o centinela conocido`,
      r.values.every((v) => typeof v === "number" || CENTINELAS.includes(String(v))));
    const nums = r.values.map((v) => (typeof v === "number" ? v : String(v) === "Ilimitados" ? Infinity : 0));
    check(`${c.slug} · ${r.name}: nunca decrece al subir`, nums.every((v, i) => i === 0 || v >= nums[i - 1]));
    check(`${c.slug} · ${r.name}: recarga declarada`, r.spend.recharge === "corto" || r.spend.recharge === "largo");
    check(`${c.slug} · ${r.name}: key en kebab-case`, /^[a-z0-9-]+$/.test(r.spend.key));
  }
  const keys = (c.resources ?? []).filter((r) => r.spend).map((r) => r.spend!.key);
  check(`${c.slug}: sin keys de pozo repetidas`, new Set(keys).size === keys.length);
}

const todasLasKeys = clases.flatMap((c) => (c.resources ?? []).filter((r) => r.spend).map((r) => r.spend!.key));
check("hay 11 pozos marcados en total", todasLasKeys.length === 11);

// Los tres pozos con centinela: que se resuelvan como toca.
check("clérigo nv1 no tiene Canalizar Divinidad («—»)", pozosDe("clerigo", 1, {}).length === 0);
check("clérigo nv2 sí lo tiene", pozosDe("clerigo", 2, {}).some((p) => p.key === "canalizar-divinidad" && p.max === 2));
check("paladín nv2 aún no lo tiene", !pozosDe("paladin", 2, {}).some((p) => p.key === "canalizar-divinidad"));
check("paladín nv3 sí, y con su reserva aparte", pozosDe("paladin", 3, {}).length === 2);
const druida20 = pozosDe("druida", 20, {}).find((p) => p.key === "forma-salvaje");
check("druida nv20 tiene forma salvaje ilimitada", !!druida20?.ilimitado);
check("druida nv19 la tiene contada (9)", pozosDe("druida", 19, {}).find((p) => p.key === "forma-salvaje")?.max === 9);
check("un pozo ilimitado no se puede vaciar", recargar(gastar({}, "forma-salvaje", 0), "druida", 20, "corto").usos?.["forma-salvaje"] === 0);

// --- Capa pura de lib/recursos.ts ---
const VACIO: PlayState = {};

const barb1 = pozosDe("barbaro", 1, VACIO);
check("bárbaro nv1 tiene 2 furias", barb1.length === 1 && barb1[0].max === 2 && barb1[0].quedan === 2);
check("bárbaro nv12 tiene 5 furias", pozosDe("barbaro", 12, VACIO)[0].max === 5);

check("monje nv1 no lista el foco (max 0)", pozosDe("monje", 1, VACIO).length === 0);
const monje2 = pozosDe("monje", 2, VACIO);
check("monje nv2 tiene 2 de foco", monje2.length === 1 && monje2[0].max === 2);

check("el pícaro no tiene pozos", pozosDe("picaro", 5, VACIO).length === 0);
check("el bárbaro tiene referencias que consultar", referenciasDe("barbaro", 5).some((r) => r.name.includes("Daño")));
check("una clase inexistente no revienta", pozosDe("inventada", 3, VACIO).length === 0);

let p: PlayState = gastar(VACIO, "furias", 2);
check("gastar descuenta", pozosDe("barbaro", 1, p)[0].quedan === 1);
p = gastar(gastar(p, "furias", 2), "furias", 2);
check("gastar no pasa del máximo", pozosDe("barbaro", 1, p)[0].quedan === 0 && p.usos!["furias"] === 2);
p = devolver(p, "furias");
check("devolver recupera uno", pozosDe("barbaro", 1, p)[0].quedan === 1);
p = devolver(devolver(devolver(p, "furias"), "furias"), "furias");
check("devolver no baja de cero", (p.usos?.["furias"] ?? 0) === 0);

const g: PlayState = gastar(gastar(VACIO, "segundo-aliento", 2), "indomable", 1);
const gCorto = recargar(g, "guerrero", 9, "corto");
check("el descanso corto solo recarga lo suyo", (gCorto.usos?.["segundo-aliento"] ?? 0) === 0 && gCorto.usos?.["indomable"] === 1);
const gLargo = recargar(g, "guerrero", 9, "largo");
check("el descanso largo lo recarga todo", (gLargo.usos?.["segundo-aliento"] ?? 0) === 0 && (gLargo.usos?.["indomable"] ?? 0) === 0);

const conO2 = recargar({ usos: { furias: 1 }, huecos: { "1": 2 } } as PlayState, "barbaro", 5, "largo");
check("recargar no toca las claves de otras fases", JSON.stringify((conO2 as Record<string, unknown>).huecos) === '{"1":2}');

console.log(failures ? `\n${failures} comprobación(es) fallida(s)` : "\nTodo en verde");
process.exit(failures ? 1 : 0);
