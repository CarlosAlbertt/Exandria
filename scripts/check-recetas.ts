// Comprobación de las recetas de oficio y de la maquinaria del caldero.
// Uso: npx tsx scripts/check-recetas.ts
//
// Vigila tres cosas que se rompen en silencio:
//  1. Que una receta no apunte a un material o a una poción que no existe —el
//     caldero se quedaría mudo, sin ningún error.
//  2. Que ninguna receta **gaste una herramienta**. Es el error que el propio
//     catálogo avisa de no cometer: un cincel se exige disponible, no se
//     consume, y confundirlo lo gastaría en cada tirada.
//  3. Que la CD concuerde con la rareza de lo que produce, para que la escala no
//     dependa de que quien escribió la receta mirase la tabla.

import { RECETAS, CD_POR_RAREZA, RECETAS_CON_CUPO, recetasDe, recetaPorSlug, recetasIniciales, recetasConCupo, produceNombre, produceRareza } from "../data/recetas";
import { POCIONES } from "../data/pociones";
import { MATERIALES, materialPorN, materialPorNombre, materialesDe, esMaterial, OFICIOS_ORDEN, OFICIO_PERICIA, type Oficio } from "../lib/materiales";
import { huecosUsados } from "../lib/inventario";
import { recetasSabidas, recetasDeArena, bolsaDeArena, requisitos, puedePreparar, consumir, anadirProducto, idReceta, slugDeId, cupoLibre, cupoHasta, diasDeCupo } from "../lib/recetario";
import { modDmValido, MOD_DM_MIN, MOD_DM_MAX } from "../lib/tallerDm";
import { MINUTES_PER_DAY } from "../lib/gameClock";
import { SKILLS } from "../data/rules";
import { norm } from "../lib/slug";
import type { Item } from "../lib/character";
import type { PlayState } from "../lib/recursos";

let failures = 0;
function check(label: string, condition: boolean) {
  if (condition) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const item = (name: string, qty: number): Item => ({ id: `t-${name}-${qty}`, name, qty });

/* ------------------- El índice de los seis catálogos ------------------- */
// Esta capa es nueva y **depende de un invariante del gate 30**: que no haya
// ningún nombre repetido entre catálogos. Se vuelve a comprobar aquí, desde el
// lado que ahora depende de él, para que el acoplamiento no quede tácito: si
// alguien admite un solapamiento, falla aquí y no en silencio.
check("el índice reúne los 369 materiales", MATERIALES.length === 369);
const REPARTO: Record<Oficio, number> = {
  alquimia: 70, cocina: 100, forja: 75, destilacion: 49, cristalografia: 50, tatuaje: 25,
};
for (const o of OFICIOS_ORDEN) {
  check(`el índice trae los ${REPARTO[o]} de ${o} (trae ${materialesDe(o).length})`, materialesDe(o).length === REPARTO[o]);
}
const normalizados = MATERIALES.map((m) => norm(m.name));
check("ningún nombre de material es ambiguo entre los seis catálogos",
  new Set(normalizados).size === normalizados.length);
check("materialPorNombre ignora tildes y mayúsculas",
  materialPorNombre("raiz de oloore")?.n === 1 && materialPorNombre("Raíz de Oloore")?.oficio === "alquimia");
check("esMaterial no confunde un arma con un material",
  esMaterial("Espada larga") === false && esMaterial("Raíz de Oloore") === true);
check("cada oficio tiene su pericia en data/rules.ts",
  OFICIOS_ORDEN.every((o) => SKILLS.some((s) => s.name === OFICIO_PERICIA[o] && s.oficio)));

/* ------------------------- Huecos de la bolsa ------------------------- */
// La regla de esta tanda: un montón de material ocupa UN hueco; lo demás cuenta
// por unidad. Si esto se invierte, o recolectar arruina la bolsa o las armas
// dejan de pesar.
check("un montón de 50 materiales ocupa 1 hueco",
  huecosUsados([item("Raíz de Oloore", 50)]) === 1);
check("tres dagas siguen ocupando 3 huecos",
  huecosUsados([item("Daga", 3)]) === 3);
check("materiales distintos ocupan un hueco cada uno",
  huecosUsados([item("Raíz de Oloore", 9), item("Cardo de Fuego", 4), item("Polvo de Residuum puro", 2)]) === 3);
check("la bolsa mezclada suma bien",
  huecosUsados([item("Daga", 2), item("Raíz de Oloore", 30), item("Cuerda de cáñamo", 1)]) === 4);
check("una bolsa vacía ocupa 0", huecosUsados([]) === 0);

/* ----------------------------- Las recetas ----------------------------- */
check("hay 32 recetas", RECETAS.length === 32);
check("ningún slug de receta repetido",
  new Set(RECETAS.map((r) => r.slug)).size === RECETAS.length);
check("los slugs son kebab-case sin acentos",
  RECETAS.every((r) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.slug)));
check("esta tanda solo trae recetas de alquimia",
  RECETAS.every((r) => r.oficio === "alquimia") && recetasDe("alquimia").length === 32);
check("recetaPorSlug encuentra y falla bien",
  recetaPorSlug("trepar")?.produce === "trepar" && recetaPorSlug("no-existe") === undefined);

for (const r of RECETAS) {
  // --- Materiales: existen, no se repiten, cantidades sanas ---------------
  check(`«${r.slug}»: lleva al menos un material`, r.materiales.length > 0);
  check(`«${r.slug}»: todos sus materiales existen en el catálogo de ${r.oficio}`,
    r.materiales.every((m) => materialPorN(r.oficio, m.n) !== undefined));
  check(`«${r.slug}»: no repite un material en dos líneas`,
    new Set(r.materiales.map((m) => m.n)).size === r.materiales.length);
  check(`«${r.slug}»: todas las cantidades son enteros ≥ 1`,
    r.materiales.every((m) => Number.isInteger(m.qty) && m.qty >= 1));

  // --- La regla que el catálogo avisa de no romper ------------------------
  check(`«${r.slug}»: NO gasta ninguna herramienta`,
    r.materiales.every((m) => materialPorN(r.oficio, m.n)?.herramienta !== true));
  check(`«${r.slug}»: lo que declara como herramienta lo es`,
    (r.herramientas ?? []).every((n) => materialPorN(r.oficio, n)?.herramienta === true));

  // --- Lo que produce ------------------------------------------------------
  const p = POCIONES.find((x) => x.slug === r.produce);
  check(`«${r.slug}»: produce una poción que existe`, p !== undefined);
  if (!p) continue;
  // Una familia sin variante no diría cuál de las cuatro sale del caldero; una
  // poción simple con variante inventa una que el libro no tiene.
  check(`«${r.slug}»: familia ⇔ declara variante`,
    Array.isArray(p.variantes) === (r.variante !== undefined));
  if (r.variante) {
    check(`«${r.slug}»: la variante «${r.variante}» existe en «${p.name}»`,
      (p.variantes ?? []).some((v) => v.name === r.variante));
  }

  // --- La CD sale de la rareza --------------------------------------------
  const rareza = produceRareza(r);
  check(`«${r.slug}»: se sabe la rareza de lo que produce`, rareza !== undefined && rareza !== "variable");
  if (rareza && rareza !== "variable") {
    check(`«${r.slug}»: CD ${r.cd} es la de ${rareza} (${CD_POR_RAREZA[rareza]})`,
      r.cd === CD_POR_RAREZA[rareza]);
  }
  check(`«${r.slug}»: produceNombre no cae al slug`, produceNombre(r) !== r.produce || p.name === r.produce);
}

/* --------------------- Cobertura: nada queda fuera --------------------- */
// Si una poción del libro no tiene receta, el caldero no puede prepararla y
// nadie se entera: no falla nada, simplemente no está.
for (const p of POCIONES) {
  if (p.variantes) {
    for (const v of p.variantes) {
      check(`«${p.name}» › «${v.name}» tiene receta`,
        RECETAS.some((r) => r.produce === p.slug && r.variante === v.name));
    }
  } else {
    check(`«${p.name}» tiene receta`, RECETAS.some((r) => r.produce === p.slug));
  }
}
check("las 25 pociones del libro están cubiertas",
  new Set(RECETAS.map((r) => r.produce)).size === POCIONES.length);

/* ---------------------------- Las iniciales ---------------------------- */
// Arrancar sabiendo algo raro se saltaría toda la progresión del oficio.
check("hay 3 recetas iniciales", recetasIniciales("alquimia").length === 3);
check("las iniciales son todas comunes (CD 10)",
  recetasIniciales("alquimia").every((r) => r.cd === CD_POR_RAREZA["comun"] && produceRareza(r) === "comun"));

/* ------------------------------- El cupo ------------------------------- */
// Las dos recetas cumbre comparten un cupo de 1d6 días. Se vigila QUIÉNES lo
// llevan, no solo cuántas: marcar una tercera abriría el techo de la campaña, y
// «son 2» seguiría en verde si alguien cambiara una por otra.
check(`hay exactamente ${RECETAS_CON_CUPO} recetas con cupo`,
  recetasConCupo().length === RECETAS_CON_CUPO);
check("las del cupo son Posibilidad y la legendaria, ni una más ni una menos",
  JSON.stringify(recetasConCupo().map((r) => r.slug).sort())
    === JSON.stringify(["fuerza-de-gigante-tormentas", "posibilidad"]));
// Que sean las MÁS caras no es decorativo: es lo que justifica el freno.
check("las dos del cupo son las de mayor CD del libro",
  recetasConCupo().every((r) => r.cd >= 19));

const AHORA = 100_000;
check("sin cupo gastado, el taller está libre", cupoLibre({}, AHORA) === true);
check("un cupo en el futuro bloquea", cupoLibre({ tallerCupo: AHORA + 1 }, AHORA) === false);
check("justo en el minuto de vencimiento ya está libre",
  cupoLibre({ tallerCupo: AHORA }, AHORA) === true);
check("un cupo pasado no bloquea", cupoLibre({ tallerCupo: AHORA - 1 }, AHORA) === true);
// Un dato corrupto tiene que dejar jugar, no bloquear el caldero para siempre.
check("un tallerCupo no numérico cuenta como libre",
  cupoLibre({ tallerCupo: NaN }, AHORA) === true
  && cupoLibre({ tallerCupo: "mañana" } as unknown as PlayState, AHORA) === true);

for (const d of [1, 2, 3, 4, 5, 6]) {
  check(`un ${d} en el 1d6 bloquea ${d} día(s)`,
    cupoHasta(AHORA, d) === AHORA + d * MINUTES_PER_DAY);
}
// El clamp NO es paranoia: Math.min/Math.max propagan NaN, y como cupoLibre
// trata lo no finito como libre, un dado corrupto sin este guardia sería justo
// el que DESACTIVA el freno que debía imponer.
for (const malo of [0, -3, 99, 2.7, NaN, Infinity, -Infinity]) {
  const hasta = cupoHasta(AHORA, malo);
  check(`cupoHasta(${String(malo)}) da un número finito`, Number.isFinite(hasta));
  check(`cupoHasta(${String(malo)}) se queda entre 1 y 6 días`,
    hasta >= AHORA + MINUTES_PER_DAY && hasta <= AHORA + 6 * MINUTES_PER_DAY);
}

check("diasDeCupo dice 0 cuando está libre", diasDeCupo({}, AHORA) === 0);
check("diasDeCupo redondea hacia arriba el día a medias",
  diasDeCupo({ tallerCupo: AHORA + MINUTES_PER_DAY + 1 }, AHORA) === 2);
check("diasDeCupo cuadra con lo que puso cupoHasta",
  diasDeCupo({ tallerCupo: cupoHasta(AHORA, 4) }, AHORA) === 4);

/* ------------------------- El libro del personaje ------------------------- */
check("idReceta y slugDeId son inversas",
  slugDeId(idReceta("trepar")) === "trepar");
check("slugDeId ignora un id de saber que no es receta",
  slugDeId("reg:emon") === null && slugDeId("cont:taldorei:profundo") === null);

// Sin la pericia el libro está vacío aunque el DM haya concedido recetas: saber
// la fórmula no es saber prepararla.
check("sin la pericia Alquimia el libro está vacío",
  recetasSabidas("alquimia", ["Historia"], [idReceta("vuelo")]).length === 0);
check("con la pericia se saben las 3 iniciales",
  recetasSabidas("alquimia", ["Alquimia"], []).length === 3);
check("una receta concedida se suma a las iniciales",
  recetasSabidas("alquimia", ["Alquimia"], [idReceta("vuelo")]).length === 4);
check("conceder una inicial no la duplica",
  recetasSabidas("alquimia", ["Alquimia"], [idReceta("trepar")]).length === 3);
check("un id de saber no cuela como receta",
  recetasSabidas("alquimia", ["Alquimia"], ["reg:emon"]).length === 3);

/* ----------------------------- El caldero ----------------------------- */
const trepar = recetaPorSlug("trepar")!;   // 28 ×1 y 38 ×1
const n28 = materialPorN("alquimia", 28)!.name;
const n38 = materialPorN("alquimia", 38)!.name;

check("requisitos lista todas las líneas de la receta",
  requisitos(trepar, []).length === trepar.materiales.length);
check("con la bolsa vacía no se puede preparar", puedePreparar(trepar, []) === false);
check("faltando una sola unidad tampoco",
  puedePreparar(trepar, [item(n28, 1)]) === false);
check("con todo, se puede preparar",
  puedePreparar(trepar, [item(n28, 1), item(n38, 1)]) === true);
check("sobrar material no estorba",
  puedePreparar(trepar, [item(n28, 5), item(n38, 3)]) === true);

const tras = consumir([item(n28, 3), item(n38, 1), item("Daga", 2)], trepar);
check("consumir descuenta lo justo",
  tras.find((i) => i.name === n28)?.qty === 2);
check("el montón que se agota desaparece de la bolsa",
  tras.find((i) => i.name === n38) === undefined);
check("consumir no toca lo que no es de la receta",
  tras.find((i) => i.name === "Daga")?.qty === 2);

// Al fallar se gasta igual: lo que cambia es solo si además entra la poción.
check("consumir es el mismo camino en éxito y en fallo",
  JSON.stringify(consumir([item(n28, 1), item(n38, 1)], trepar)) === JSON.stringify([]));

check("el producto se apila si ya llevabas uno",
  anadirProducto([item("Poción de curación", 2)], "Poción de curación")
    .find((i) => i.name === "Poción de curación")?.qty === 3);
check("el producto entra como fila nueva si no llevabas",
  anadirProducto([], "Poción de Vuelo").length === 1);
check("el nombre del producto es el de la variante en las familias",
  produceNombre(recetaPorSlug("curacion-suprema")!) === "Poción de curación (suprema)");

// Una herramienta se exige disponible pero NO se gasta. Alquimia no usa
// ninguna, así que se prueba con una receta armada aquí: sin este caso, la
// regla no estaría vigilada por nada hasta que llegue cristalografía.
const cincel = materialesDe("cristalografia").find((m) => m.herramienta)!;
const piedra = materialesDe("cristalografia").find((m) => !m.herramienta)!;

// La regla «ninguna receta gasta una herramienta» hoy se cumple **sin esfuerzo**:
// solo cristalografía y tatuaje tienen herramientas, y ninguno de los dos tiene
// recetas todavía. Una regla que no puede fallar no vigila nada, así que además
// de afirmarla se comprueba que el detector SÍ dispara contra una receta que la
// rompe a propósito. Sin esto, el día que alquimia gane una herramienta la
// comprobación seguiría en verde por casualidad.
const gastaHerramienta = (r: { oficio: Oficio; materiales: { n: number }[] }) =>
  r.materiales.some((m) => materialPorN(r.oficio, m.n)?.herramienta === true);
check("ninguna receta real gasta una herramienta",
  RECETAS.every((r) => !gastaHerramienta(r)));
check("el detector de herramientas gastadas SÍ dispara contra una receta que la rompe",
  gastaHerramienta({ oficio: "cristalografia", materiales: [{ n: cincel.n }] }) === true);
check("y NO dispara contra un material corriente",
  gastaHerramienta({ oficio: "cristalografia", materiales: [{ n: piedra.n }] }) === false);
const conHerramienta = {
  slug: "prueba", oficio: "cristalografia" as Oficio, produce: "x", cd: 10,
  materiales: [{ n: piedra.n, qty: 1 }], herramientas: [cincel.n],
};
check("sin la herramienta no se puede preparar",
  puedePreparar(conHerramienta, [item(piedra.name, 1)]) === false);
check("con la herramienta sí",
  puedePreparar(conHerramienta, [item(piedra.name, 1), item(cincel.name, 1)]) === true);
const trasHerr = consumir([item(piedra.name, 1), item(cincel.name, 1)], conHerramienta);
check("la herramienta NO se gasta",
  trasHerr.find((i) => i.name === cincel.name)?.qty === 1);
check("el material sí se gasta",
  trasHerr.find((i) => i.name === piedra.name) === undefined);

/* --------------------- La caja de arena del DM --------------------- */
// El máster no tiene ficha, así que el caldero lo paraba en la primera puerta y
// alquimia llevaba tres tandas desplegada sin que nadie pudiera mirarla. El modo
// DM le da todas las recetas y una bolsa a medida, y esa bolsa tiene que pasar
// por las MISMAS funciones que usa el jugador: si el modo DM tuviera su propio
// camino, la pantalla que el máster revisa no sería la que juega la mesa.

check("la arena ofrece TODAS las recetas del oficio, no solo las sabidas",
  recetasDeArena("alquimia").length === recetasDe("alquimia").length &&
  recetasDeArena("alquimia").length > recetasSabidas("alquimia", [OFICIO_PERICIA.alquimia], []).length);
check("la arena no mezcla oficios",
  recetasDeArena("alquimia").every((r) => r.oficio === "alquimia"));

// La razón de ser del modo: el DM nunca se queda mirando un botón apagado.
check("con la bolsa de arena se puede preparar CUALQUIER receta",
  RECETAS.every((r) => puedePreparar(r, bolsaDeArena(r))));
check("y ninguna línea de requisitos sale corta",
  RECETAS.every((r) => requisitos(r, bolsaDeArena(r)).every((f) => f.tiene >= f.necesita)));

// Exacta, no generosa: si la bolsa trajera de más, dejaría de contar lo que la
// receta pide de verdad y un requisito mal escrito pasaría desapercibido.
check("la bolsa trae exactamente las líneas que la receta pide",
  RECETAS.every((r) => bolsaDeArena(r).length === r.materiales.length + (r.herramientas?.length ?? 0)));
check("los materiales se agotan justos al preparar en la arena",
  RECETAS.every((r) => consumir(bolsaDeArena(r), r).length === (r.herramientas?.length ?? 0)));

// Las herramientas son el caso que más fácil se olvida: no se gastan, así que
// una basta, pero si faltaran en la bolsa el botón se apagaría sin motivo el día
// que cristalografía y tatuaje tengan recetas.
check("la bolsa de arena incluye la herramienta que la receta exige",
  puedePreparar(conHerramienta, bolsaDeArena(conHerramienta)) === true);
check("y la herramienta sigue ahí después de preparar",
  consumir(bolsaDeArena(conHerramienta), conHerramienta)
    .some((i) => norm(i.name) === norm(cincel.name)));

// Ids estables: esta bolsa no llega nunca a la base de datos, y un id fijo es lo
// que hace la función comprobable.
check("la bolsa de arena es determinista",
  JSON.stringify(bolsaDeArena(RECETAS[0])) === JSON.stringify(bolsaDeArena(RECETAS[0])));

// El modificador lo teclea el DM: sin ficha no hay `derive` de donde sacarlo.
check("el modificador del DM se acota por arriba y por abajo",
  modDmValido(99) === MOD_DM_MAX && modDmValido(-99) === MOD_DM_MIN);
check("un modificador imposible cae a 0 y no envenena la tirada",
  modDmValido(NaN) === 0 && modDmValido(Infinity) === 0);
check("el modificador es entero",
  modDmValido(3.7) === 3 && modDmValido(-1.2) === -1);

console.log(failures === 0 ? `\nTodo OK` : `\n${failures} FALLOS`);
process.exit(failures === 0 ? 0 : 1);
