// Comprobación de data/bosque.ts. Uso: npx tsx scripts/check-bosque.ts
//
// ⚠️ Este NO es `check-bestiary` (que vigila los statblocks y el censo) ni
// `check-encuentros`. Vigila el PUENTE: que la tabla de la Expansión Verdante
// apunte a monstruos que existen o que están declarados como pendientes, y que
// las dos listas no se solapen nunca.
//
// La pregunta de siempre: ¿qué tendría que romperse para que esto falle?
//   · Un nombre mal escrito → no está en ALL_MONSTERS ni en PENDIENTES.
//   · Un lote nuevo que extraiga un pendiente y no lo quite de la lista → el
//     bicho estaría en los dos sitios y el DM creería que sigue sin ficha.
//   · Una franja que contradiga el CR de un monstruo que SÍ existe.
import fs from "node:fs";
import path from "node:path";
import { ALL_MONSTERS } from "../data/bestiary";
import {
  ENCUENTROS_VERDANTE, PENDIENTES, FRANJAS, encuentrosDe, jugablesDe,
  franjaDeNodo, profundidadDe, franjaVecina,
  type Franja,
} from "../data/bosque";
import { idFranja } from "../data/lugares";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const porNombre = new Map(ALL_MONSTERS.map((m) => [m.name, m]));
const pendientes = new Set(PENDIENTES);

/* ----------------------------- LAS FRANJAS ----------------------------- */
// Las tres van escritas a mano aquí: si salieran de FRANJAS, las dos mitades
// se moverían juntas y renombrar una no rompería nada.
const ESPERADAS: Franja[] = ["linde", "espesura", "corazon"];
check("hay exactamente 3 franjas", FRANJAS.length === 3);
check("las franjas son linde, espesura y corazon (en ese orden)",
  FRANJAS.map((f) => f.key).join(",") === ESPERADAS.join(","));
for (const f of FRANJAS) {
  check(`la franja "${f.key}" tiene etiqueta y descripción`, f.label.length > 0 && f.blurb.length > 20);
}

/* ------------------------- EL PUENTE, LO QUE IMPORTA ------------------- */
check("la tabla no está vacía", ENCUENTROS_VERDANTE.length > 0);

// Nada repetido: dos filas del mismo bicho harían que saliera el doble.
const nombres = ENCUENTROS_VERDANTE.map((e) => e.name);
const repes = nombres.filter((n, i) => nombres.indexOf(n) !== i);
check(`ningún monstruo repetido en la tabla${repes.length ? ` (repetidos: ${[...new Set(repes)].join(", ")})` : ""}`,
  repes.length === 0);

// LA GORDA: cada entrada existe o está declarada pendiente. Un nombre inventado
// —o con una tilde de menos— no está en ninguno de los dos sitios.
for (const e of ENCUENTROS_VERDANTE) {
  const existe = porNombre.has(e.name);
  const pend = pendientes.has(e.name);
  check(`"${e.name}" está en el bestiario o declarado pendiente`, existe || pend);
  // Y NUNCA en los dos: si un lote lo extrajo, hay que quitarlo de PENDIENTES o
  // la tabla seguirá diciendo que no tiene ficha cuando ya la tiene.
  check(`"${e.name}" no está a la vez extraído y pendiente`, !(existe && pend));
}

// Al revés: un pendiente que no use nadie es una lista que se quedó vieja.
const enTabla = new Set(nombres);
for (const p of PENDIENTES) {
  check(`el pendiente "${p}" sale en la tabla`, enTabla.has(p));
}

// Toda entrada lleva franja válida y nota escrita: una fila sin nota obliga al
// DM a adivinar por qué ese bicho está en esa franja.
for (const e of ENCUENTROS_VERDANTE) {
  check(`"${e.name}" tiene una franja válida`, ESPERADAS.includes(e.franja));
  check(`"${e.name}" explica por qué está en su franja`, e.nota.trim().length >= 15);
}

/* ------------------- LA FRANJA CONTRA EL CR, DONDE SE PUEDE ------------ */
// Solo se puede comprobar en los que YA tienen ficha; de los pendientes no
// sabemos el CR y no se inventa. La franja la dicta la narración, así que esto
// no es circular: pone suelo y techo a una decisión tomada a mano.
const CR_NUM: Record<string, number> = { "0": 0, "1/8": 0.125, "1/4": 0.25, "1/2": 0.5 };
const cr = (s: string) => (s in CR_NUM ? CR_NUM[s] : Number(s));

/**
 * El techo de cada franja, subido el 2026-08-08 a pedido del usuario.
 *
 * ⚠️ **La razón es el TAMAÑO DEL GRUPO: son cinco o seis jugadores.** Los techos
 * viejos —linde CR 1/2— estaban calculados para un grupo de cuatro de nivel
 * bajo, y con seis a la mesa el presupuesto de XP de un encuentro se dobla: lo
 * que era una pelea pasaba a ser un trámite. Las bandas pedidas son linde 2-3,
 * espesura 5-7 y corazón 10-15, y aquí se guardan como TECHOS.
 *
 * ⚠️ **Solo techo, y NO suelo, en la linde y la espesura.** Un Ciervo de CR 0 o
 * un Lobo de 1/4 siguen valiendo en la linde: contra seis jugadores no salen de
 * uno en uno, salen **en número**, y de eso se encarga el `XP_BUDGET` de
 * `data/encounters.ts`. Poner suelo habría borrado once entradas escritas para
 * arreglar algo que no está roto.
 *
 * El suelo del corazón se queda en CR 1 —lo que había— y no sube a la banda
 * pedida: de los diez del corazón **ninguno tiene ficha todavía**, así que subir
 * el suelo sería legislar sobre números que no conocemos. Cuando se extraigan se
 * verá si hay que apretarlo.
 */
const TECHO_CR: Record<string, number> = { linde: 3, espesura: 7, corazon: 15 };
const SUELO_CR: Record<string, number> = { corazon: 1 };

for (const e of ENCUENTROS_VERDANTE) {
  const m = porNombre.get(e.name);
  if (!m) continue;
  const c = cr(m.cr);
  const techo = TECHO_CR[e.franja];
  if (techo !== undefined) {
    check(`"${e.name}" en ${e.franja} no pasa de CR ${techo} (es ${m.cr})`, c <= techo);
  }
  const suelo = SUELO_CR[e.franja];
  if (suelo !== undefined) {
    check(`"${e.name}" en ${e.franja} no baja de CR ${suelo} (es ${m.cr})`, c >= suelo);
  }
}

// Y los techos suben de fuera adentro. Si alguien los tocara dejando la linde
// por encima de la espesura, la progresión del bosque se invertiría sin que
// ninguna de las comprobaciones de arriba dijera nada.
check("el techo sube de la linde a la espesura", TECHO_CR.linde < TECHO_CR.espesura);
check("y de la espesura al corazón", TECHO_CR.espesura < TECHO_CR.corazon);

/* ------------- LA PROFUNDIDAD: LA PIEL QUE SE CIERRA -------------------- */
// ⚠️ LO QUE MUERDE: una clase `prof-*` que no existe **no da ningún error**. La
// hoja se queda con la piel de la franja anterior —o con la del tema pelado— y
// el bosque deja de cerrarse sin que nada lo diga. Es el mismo fallo silencioso
// que ya se vigila con `.tema-*`.
{
  const CSS = fs.readFileSync(path.join(process.cwd(), "app", "globals.css"), "utf8");

  for (const f of FRANJAS) {
    const bloque = new RegExp(`\\.prof-${f.key}\\s*\\{([^}]*)\\}`).exec(CSS)?.[1];
    check(`la franja "${f.key}" tiene su regla .prof-${f.key} en globals.css`, !!bloque);
    // Toda franja tiene que mover AL MENOS el cielo: si no cambia nada, la
    // clase existe y no hace nada, que se lee igual que si faltara.
    check(`.prof-${f.key} baja la luz del cielo`, !!bloque?.includes("--cielo-1:"));
  }

  // El corazón es el que apaga los haces y enciende las luciérnagas. Si esas dos
  // reglas se pierden, el fondo del bosque se ve igual que la linde.
  check("en el corazón se apagan los haces de luz", /\.prof-corazon\s+\.lug-haces\s*\{[^}]*opacity:\s*0/.test(CSS));
  check("y se encienden las luciérnagas", /\.prof-corazon\s+\.lug-luces\s*\{[^}]*opacity:\s*1/.test(CSS));

  // Los rastros: el TONO de cada franja, que es lo que se le enseña al jugador.
  for (const f of FRANJAS) {
    check(`"${f.key}" tiene rastros escritos`, f.rastros.length >= 3);
    for (const r of f.rastros) {
      check(`el rastro "${r.titulo}" (${f.key}) tiene icono`, /^fa-[a-z0-9-]+$/.test(r.icono));
      check(`el rastro "${r.titulo}" está escrito de verdad`, r.texto.trim().length > 25);
    }
    // ⚠️ Un rastro NO puede nombrar a un monstruo de la tabla: se destriparía lo
    // que va a salir, que es justo lo que estos textos existen para no hacer.
    for (const e of encuentrosDe(f.key)) {
      const nombra = f.rastros.some((r) => `${r.titulo} ${r.texto}`.toLowerCase().includes(e.name.toLowerCase()));
      check(`ningún rastro de "${f.key}" destripa a "${e.name}"`, !nombra);
    }
  }
}

// `franjaDeNodo` es el seto: valida contra FRANJAS en vez de fiarse del prefijo,
// porque un `franja:inventada` daría la clase `prof-inventada`, que no casa con
// nada y deja la hoja sin ninguno de sus tokens.
for (const f of FRANJAS) {
  check(`franjaDeNodo reconoce "${f.key}"`, franjaDeNodo(idFranja(f.key)) === f.key);
}
check("franjaDeNodo rechaza una franja inventada", franjaDeNodo("franja:inventada") === null);
check("franjaDeNodo rechaza un pueblo", franjaDeNodo("poi:Byroden") === null);
check("franjaDeNodo rechaza un sub-lugar", franjaDeNodo("sub:Byroden/taberna") === null);
check("franjaDeNodo rechaza basura", franjaDeNodo("") === null && franjaDeNodo("franja:") === null);

// La profundidad sale del ORDEN de FRANJAS y va de 1 a 3, sin huecos ni repes.
const profs = FRANJAS.map((f) => profundidadDe(f.key));
check("las profundidades son 1, 2 y 3", JSON.stringify(profs) === JSON.stringify([1, 2, 3]));

// Y las vecinas encadenan el bosque de fuera adentro. Si esto se rompe, la
// vereda ofrece un paso que no lleva a la franja de al lado.
check("de la linde se entra a la espesura", franjaVecina("linde", "dentro") === "espesura");
check("de la espesura al corazón", franjaVecina("espesura", "dentro") === "corazon");
check("del corazón no se entra más adentro", franjaVecina("corazon", "dentro") === null);
check("de la linde no se sale a otra franja", franjaVecina("linde", "fuera") === null);
check("del corazón se vuelve a la espesura", franjaVecina("corazon", "fuera") === "espesura");

/* ------------------------------ CONSULTAS ------------------------------ */
// Las tres franjas tienen algo. Una vacía deja al DM sin tabla en ese tramo.
for (const f of ESPERADAS) {
  check(`la franja "${f}" tiene entradas`, encuentrosDe(f).length > 0);
}
check("encuentrosDe reparte todas las entradas",
  ESPERADAS.reduce((n, f) => n + encuentrosDe(f).length, 0) === ENCUENTROS_VERDANTE.length);

// `jugablesDe` es lo que se puede poner en la mesa HOY. Que la linde tenga algo
// jugable es lo que hace que la tabla no nazca muerta esperando al bestiario.
check("la linde tiene monstruos jugables ya", jugablesDe("linde").length > 0);
check("la espesura tiene monstruos jugables ya", jugablesDe("espesura").length > 0);
for (const f of ESPERADAS) {
  check(`jugablesDe("${f}") no devuelve ningún pendiente`,
    jugablesDe(f).every((j) => !pendientes.has(j.name)));
  check(`jugablesDe("${f}") resuelve el monstruo de verdad`,
    jugablesDe(f).every((j) => j.monster.name === j.name));
}

const jugables = ESPERADAS.reduce((n, f) => n + jugablesDe(f).length, 0);
console.log(`\nTabla de la Expansión Verdante: ${ENCUENTROS_VERDANTE.length} entradas, ` +
  `${jugables} con ficha y ${PENDIENTES.length} esperando extracción.`);
console.log(failures === 0 ? "Todas las comprobaciones pasaron." : `${failures} fallaron.`);
process.exit(failures === 0 ? 0 : 1);
