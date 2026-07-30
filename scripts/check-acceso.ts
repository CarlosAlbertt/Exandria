// Comprobación manual del alcance del jugador (lib/acceso.ts).
// Uso: npx tsx scripts/check-acceso.ts
import { puedeVer, RUTAS_JUGADOR, RUTA_CERRADA } from "../lib/acceso";

let failures = 0;
function check(label: string, condition: boolean) {
  if (condition) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// --- El DM lo ve todo -------------------------------------------------------
for (const p of ["/", "/mapa", "/bestiario", "/combate", "/dm", "/taberna", "/reino/wildemount"]) {
  check(`dm ve ${p}`, puedeVer("dm", p) === true);
}

// --- El jugador ve exactamente su lista ------------------------------------
const ABIERTAS = ["/", "/crear", "/personaje", "/inventario", "/reino", "/lugar", "/cerrado", "/login"];
for (const p of ABIERTAS) {
  check(`jugador ve ${p}`, puedeVer("player", p) === true);
}

const CERRADAS = ["/panteon", "/cronica", "/bestiario", "/mapa", "/combate", "/taberna", "/narrador", "/dm"];
for (const p of CERRADAS) {
  check(`jugador NO ve ${p}`, puedeVer("player", p) === false);
}

// --- Subrutas: la barra tiene que ser explícita ----------------------------
check("jugador ve /reino/wildemount (subruta)", puedeVer("player", "/reino/wildemount") === true);
check("jugador ve /reino/tal-dorei (subruta)", puedeVer("player", "/reino/tal-dorei") === true);
check("jugador NO ve /reinos (prefijo falso)", puedeVer("player", "/reinos") === false);
check("jugador NO ve /personajes (prefijo falso)", puedeVer("player", "/personajes") === false);
check("jugador NO ve /mapa/algo (subruta cerrada)", puedeVer("player", "/mapa/algo") === false);
check('"/" no abre todo por prefijo', puedeVer("player", "/dm") === false);

// --- Coherencia de la lista ------------------------------------------------
check("RUTAS_JUGADOR incluye la ruta cerrada (si no, bucle de rewrite)",
  (RUTAS_JUGADOR as readonly string[]).includes(RUTA_CERRADA));
check("RUTAS_JUGADOR incluye /login", (RUTAS_JUGADOR as readonly string[]).includes("/login"));
check("RUTAS_JUGADOR sin duplicados",
  new Set(RUTAS_JUGADOR).size === RUTAS_JUGADOR.length);
check("todas las RUTAS_JUGADOR empiezan por /",
  RUTAS_JUGADOR.every((r) => r.startsWith("/")));
check("ninguna RUTAS_JUGADOR acaba en / salvo la raíz",
  RUTAS_JUGADOR.every((r) => r === "/" || !r.endsWith("/")));

console.log(failures === 0 ? `\nTodo OK` : `\n${failures} FALLOS`);
process.exit(failures === 0 ? 0 : 1);
