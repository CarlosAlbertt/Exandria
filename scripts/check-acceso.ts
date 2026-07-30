// Comprobación manual del alcance del jugador (lib/acceso.ts).
// Uso: npx tsx scripts/check-acceso.ts
import { puedeVer, RUTAS_JUGADOR, RUTA_CERRADA, NAV_LINKS } from "../lib/acceso";
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

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

// --- Toda ruta de app/ está clasificada ------------------------------------
// Si añades una página nueva, decláralas aquí. Que este check falle es lo que
// impide que una ruta nueva se cuele abierta (o cerrada) sin decidirlo.

// `process.cwd()` y no `__dirname`: es lo que usan check-taldorei y
// check-atlas, y los scripts se lanzan siempre desde la raíz del repo.
const APP = join(process.cwd(), "app");

// Rutas de primer nivel esperadas, clasificadas a mano.
const ESPERADAS_ABIERTAS = ["/", "/crear", "/personaje", "/inventario", "/reino", "/lugar", "/cerrado", "/login"];
const ESPERADAS_CERRADAS = ["/panteon", "/cronica", "/bestiario", "/mapa", "/combate", "/taberna", "/narrador", "/dm"];

// ¿Hay algún page.tsx en este árbol? (una ruta puede tener la página en un
// subdirectorio dinámico, p. ej. app/reino/[continente]/page.tsx)
function tienePagina(dir: string): boolean {
  if (existsSync(join(dir, "page.tsx"))) return true;
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .some((e) => tienePagina(join(dir, e.name)));
}

const descubiertas: string[] = [];
if (existsSync(join(APP, "page.tsx"))) descubiertas.push("/");
for (const e of readdirSync(APP, { withFileTypes: true })) {
  if (!e.isDirectory() || e.name === "api") continue;
  if (tienePagina(join(APP, e.name))) descubiertas.push("/" + e.name);
}

const clasificadas = new Set([...ESPERADAS_ABIERTAS, ...ESPERADAS_CERRADAS]);
for (const r of descubiertas) {
  check(`ruta ${r} está clasificada en check-acceso`, clasificadas.has(r));
  check(`ruta ${r}: puedeVer coincide con su clasificación`,
    puedeVer("player", r) === ESPERADAS_ABIERTAS.includes(r));
}
for (const r of clasificadas) {
  check(`la ruta clasificada ${r} existe en app/`, descubiertas.includes(r));
}

// --- Los enlaces del nav no llevan a puerta cerrada ------------------------
for (const l of NAV_LINKS) {
  check(`nav: el DM puede ver ${l.href}`, puedeVer("dm", l.href) === true);
}
const navJugador = NAV_LINKS.filter((l) => puedeVer("player", l.href)).map((l) => l.href);
check("nav del jugador = Inicio, Ficha, Reino, Crear, Inventario",
  JSON.stringify(navJugador) === JSON.stringify(["/", "/personaje", "/reino", "/crear", "/inventario"]));
check("nav: sin hrefs duplicados",
  new Set(NAV_LINKS.map((l) => l.href)).size === NAV_LINKS.length);
check("nav: ninguna etiqueta vacía", NAV_LINKS.every((l) => l.label.trim().length > 0));

console.log(failures === 0 ? `\nTodo OK` : `\n${failures} FALLOS`);
process.exit(failures === 0 ? 0 : 1);
