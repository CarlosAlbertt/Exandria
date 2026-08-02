// Comprobación manual del alcance del jugador (lib/acceso.ts).
// Uso: npx tsx scripts/check-acceso.ts
import { puedeVer, puedeVerAhora, RUTAS_JUGADOR, RUTAS_SOLO_SIN_PERSONAJE, RUTA_CERRADA, NAV_LINKS, PUERTAS_JUGADOR } from "../lib/acceso";
import { tienePersonaje } from "../lib/character";
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

let failures = 0;
function check(label: string, condition: boolean) {
  if (condition) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// --- El DM lo ve todo -------------------------------------------------------
// `puedeVer` devuelve true para "dm" en su primera línea, así que un check por
// ruta no comprobaría nada: basta anclar ese early-return una vez. Lo que sí
// tiene contenido es comprobarlo contra las rutas REALES de app/, y eso se
// hace más abajo, cuando ya se han descubierto.
check("dm: el early-return abre cualquier ruta",
  ["/", "/mapa", "/dm", "/reino/wildemount", "/lo-que-sea"].every((p) => puedeVer("dm", p)));

// --- El jugador ve exactamente su lista ------------------------------------
const ABIERTAS = ["/", "/crear", "/personaje", "/inventario", "/taller", "/reino", "/lugar", "/cerrado", "/login"];
for (const p of ABIERTAS) {
  check(`jugador ve ${p}`, puedeVer("player", p) === true);
}

const CERRADAS = ["/panteon", "/cronica", "/bestiario", "/oficios", "/mapa", "/combate", "/taberna", "/narrador", "/dm"];
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

// TODAS las rutas de páginas esperadas, no solo las de primer nivel: una ruta
// anidada bajo una carpeta abierta (p. ej. app/reino/loquesea/) heredaría el
// permiso de su padre por la regla de prefijo y se colaría sin decidirlo.
const ESPERADAS_ABIERTAS = ["/", "/crear", "/personaje", "/inventario", "/taller", "/reino", "/reino/[continente]", "/lugar", "/cerrado", "/login"];
const ESPERADAS_CERRADAS = ["/panteon", "/cronica", "/bestiario", "/oficios", "/mapa", "/combate", "/taberna", "/narrador", "/dm"];

// Todas las rutas con página bajo este directorio, con su ruta completa (los
// segmentos dinámicos se conservan tal cual: `/reino/[continente]`).
function rutasCon(dir: string, prefijo: string): string[] {
  const encontradas: string[] = [];
  if (existsSync(join(dir, "page.tsx"))) encontradas.push(prefijo === "" ? "/" : prefijo);
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    encontradas.push(...rutasCon(join(dir, e.name), `${prefijo}/${e.name}`));
  }
  return encontradas;
}

const descubiertas = rutasCon(APP, "").filter((r) => r !== "/api" && !r.startsWith("/api/"));

const clasificadas = new Set([...ESPERADAS_ABIERTAS, ...ESPERADAS_CERRADAS]);
for (const r of descubiertas) {
  check(`ruta ${r} está clasificada en check-acceso`, clasificadas.has(r));
  check(`ruta ${r}: puedeVer coincide con su clasificación`,
    puedeVer("player", r) === ESPERADAS_ABIERTAS.includes(r));
  check(`ruta ${r}: el DM la ve`, puedeVer("dm", r) === true);
}
for (const r of clasificadas) {
  check(`la ruta clasificada ${r} existe en app/`, descubiertas.includes(r));
}

// --- Los enlaces del nav no llevan a puerta cerrada ------------------------
const navJugador = NAV_LINKS.filter((l) => puedeVer("player", l.href)).map((l) => l.href);
check("nav del jugador = Inicio, Ficha, Reino, Crear, Inventario, Taller",
  JSON.stringify(navJugador) === JSON.stringify(["/", "/personaje", "/reino", "/crear", "/inventario", "/taller"]));
check("nav: sin hrefs duplicados",
  new Set(NAV_LINKS.map((l) => l.href)).size === NAV_LINKS.length);
check("nav: ninguna etiqueta vacía", NAV_LINKS.every((l) => l.label.trim().length > 0));

// --- Las puertas del jugador (portada y /cerrado) están abiertas -----------
// Sin esto, cerrar una sección dejaría a la portada y a la página «aún no»
// enlazando a una puerta que rebota al jugador contra /cerrado.
for (const p of PUERTAS_JUGADOR) {
  check(`puerta ${p.href}: el jugador la puede ver`, puedeVer("player", p.href) === true);
  check(`puerta ${p.href}: está clasificada como abierta`, ESPERADAS_ABIERTAS.includes(p.href));
}
check("puertas: sin hrefs duplicados",
  new Set(PUERTAS_JUGADOR.map((p) => p.href)).size === PUERTAS_JUGADOR.length);
check("puertas: ninguna etiqueta, texto o icono vacío",
  PUERTAS_JUGADOR.every((p) => p.label.trim() && p.text.trim() && p.icon.trim() && p.accent.trim()));

// --- Lo que se retira cuando el jugador YA tiene ficha ---------------------
// `puedeVer` es la PUERTA (quién puede entrar) y `puedeVerAhora` el ESCAPARATE
// (qué tiene sentido enseñar). Esconder `/crear` no es seguridad y no debe
// comportarse como si lo fuera: el proxy sigue mirando `puedeVer`.

check("sin ficha, el jugador ve todo lo suyo",
  NAV_LINKS.filter((l) => puedeVer("player", l.href))
    .every((l) => puedeVerAhora("player", l.href, false)));
check("con ficha, al jugador se le retira /crear",
  puedeVerAhora("player", "/crear", true) === false);
check("y solo /crear: lo demás sigue en pie",
  NAV_LINKS.filter((l) => puedeVer("player", l.href) && l.href !== "/crear")
    .every((l) => puedeVerAhora("player", l.href, true)));
// Al DM no se le esconde: monta fichas para la mesa.
check("al DM no se le retira /crear aunque tenga ficha",
  puedeVerAhora("dm", "/crear", true) === true);
// Y esconder no es abrir: una ruta cerrada sigue cerrada tenga ficha o no.
check("esconder no abre: una ruta cerrada lo sigue estando",
  puedeVerAhora("player", "/dm", false) === false && puedeVerAhora("player", "/dm", true) === false);
// Todo lo que se retira tiene que ser algo que el jugador pudiera ver: retirar
// una ruta que ya estaba cerrada sería una regla muerta que nadie notaría.
check("todo lo que se retira estaba abierto",
  RUTAS_SOLO_SIN_PERSONAJE.every((r) => puedeVer("player", r)));

// --- La regla de «tiene personaje» -----------------------------------------
// Vivía copiada en `app/crear/page.tsx` y en `components/CharacterSheet.tsx`.
// Es un **o**, no un **y**: con `&&`, a una ficha a la que le falte solo la
// clase se le retiraría el asistente y no habría forma de terminarla.
check("una fila con especie y clase es personaje",
  tienePersonaje({ species: "elfo", cls: "mago" }) === true);
check("una fila a medias NO es personaje",
  tienePersonaje({ species: null, cls: null }) === false);
check("con solo especie ya cuenta", tienePersonaje({ species: "elfo", cls: null }) === true);
check("con solo clase ya cuenta", tienePersonaje({ species: null, cls: "mago" }) === true);
check("sin fila no hay personaje",
  tienePersonaje(null) === false && tienePersonaje(undefined) === false);

console.log(failures === 0 ? `\nTodo OK` : `\n${failures} FALLOS`);
process.exit(failures === 0 ? 0 : 1);
