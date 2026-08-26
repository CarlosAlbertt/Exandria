// Comprobación de la tabla de despiece (data/despiece.ts): qué suelta cada
// monstruo con Extracción de Componentes.
// Uso: npx tsx scripts/check-despiece.ts
//
// Ojo con el nombre: `check-materiales.ts` es OTRO gate (los seis catálogos y
// el cruce entre ellos) y `check-bestiary.ts` otro más (los statblocks). Este
// vigila solo el PUENTE entre los dos, que es donde nadie miraba.
import { DESPIECE, piezasDe, esDespiezable, despieceDe } from "../data/despiece";
import {
  piezasDelCadaver, abrirCadaver, trasIntento, agotado, retirarse,
  puedeAbrir, faltanHerramientas, HERRAMIENTAS_EXTRACCION,
  cdDespiece, aciertaCorte, CD_MIN, CD_MAX,
  visionTrasEstudiar, VISION_LABEL,
  FASES_EXTRACCION, FASE_EXTRACCION_LABEL, FASE_EXTRACCION_BLURB,
  manipulacionExtraccion, TOPE,
} from "../lib/extraccion";
import { TOPE as TOPE_TALLER } from "../lib/manipulacion";
import { MATERIALES } from "../lib/materiales";
import { ALL_MONSTERS } from "../data/bestiary";

let failures = 0;
function check(label: string, condition: boolean) {
  if (condition) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const PORNOMBRE = new Map(MATERIALES.map((m) => [m.name, m]));
const SLUGS = new Map(ALL_MONSTERS.map((m) => [m.slug, m]));

// --- Todo lo que la tabla promete existe -----------------------------------
// Es la invariante que de verdad importa: un nombre mal escrito aquí sería un
// monstruo que al despiezarlo no suelta NADA, sin ningún error a la vista.
for (const [slug, mats] of Object.entries(DESPIECE)) {
  check(`${slug}: el monstruo existe en el bestiario`, SLUGS.has(slug));
  check(`${slug}: suelta algo`, mats.length > 0);
  check(`${slug}: sin materiales repetidos`, new Set(mats).size === mats.length);
  for (const n of mats) {
    check(`${slug}: el material «${n}» existe en algún catálogo`, PORNOMBRE.has(n));
  }
}

// --- La tabla no puede prometer más de lo que la regla permite -------------
for (const [slug, mats] of Object.entries(DESPIECE)) {
  const m = SLUGS.get(slug);
  if (!m) continue;
  const tope = piezasDe(m.cr, m.size);
  check(`${slug} (CR ${m.cr}, ${m.size}): ${mats.length} pieza(s) y el tope es ${tope}`,
    mats.length <= tope);
}

// --- La regla de cuántas piezas --------------------------------------------
check("CR 0 Diminuto → 1", piezasDe("0", "Diminuto") === 1);
check("CR 1/4 Mediano → 1", piezasDe("1/4", "Mediano") === 1);
check("CR 2 Mediano → 2", piezasDe("2", "Mediano") === 2);
check("CR 5 Mediano → 3", piezasDe("5", "Mediano") === 3);
check("CR 10 Mediano → 4", piezasDe("10", "Mediano") === 4);
check("CR 20 Mediano → 5", piezasDe("20", "Mediano") === 5);
// El tamaño suma, que es el motivo de que esté en la fórmula.
check("ser Grande suma uno: CR 2 Grande → 3", piezasDe("2", "Grande") === 3);
check("Enorme y Gargantuesco también suman",
  piezasDe("2", "Enorme") === 3 && piezasDe("2", "Gargantuesco") === 3);
// Y los topes, que es donde una fórmula se va de madre sin que se note.
check("nunca menos de 1", piezasDe("0", "Diminuto") >= 1);
check("nunca más de 5 aunque sume el tamaño",
  piezasDe("30", "Gargantuesco") === 5 && piezasDe("20", "Enorme") === 5);

// --- Los Humanoides se quedan fuera a propósito ----------------------------
// Va comprobado y no solo escrito: es una decisión de mesa, y si algún día
// alguien empareja un Plebeyo por inercia, que salte.
for (const [slug] of Object.entries(DESPIECE)) {
  const m = SLUGS.get(slug);
  if (!m) continue;
  check(`${slug}: no es Humanoide`, !/Humanoide/i.test(m.type));
}

// --- Los ayudantes hacen lo que dicen --------------------------------------
check("esDespiezable() dice que sí a uno emparejado", esDespiezable("aguila") === true);
check("esDespiezable() dice que no a uno sin emparejar",
  esDespiezable("plebeyo") === false && esDespiezable("no-existe") === false);
check("despieceDe() devuelve vacío y no undefined para uno sin emparejar",
  Array.isArray(despieceDe({ slug: "plebeyo" })) && despieceDe({ slug: "plebeyo" }).length === 0);

/* ================== EL BUCLE: lib/extraccion.ts ==========================
 * La TABLA (arriba) dice qué suelta cada bicho. Esto vigila el BUCLE: cuántas
 * piezas hay, qué cuesta fallar y cuándo se acaba. Son las reglas que hacen que
 * el oficio sea una habilidad y no un botón, y viven en un módulo neutro
 * justamente para que se puedan mirar desde aquí.
 */

// --- 1d4 al abrir, y acotado ----------------------------------------------
// Escrito a mano y no sacado de DADO_PIEZAS: si las dos mitades se movieran
// juntas esto sería verde por construcción (lección de check-origen).
check("un 1 en el dado da una pieza", piezasDelCadaver(1) === 1);
check("un 4 en el dado da cuatro", piezasDelCadaver(4) === 4);
check("una tirada imposible por abajo se acota a 1", piezasDelCadaver(0) === 1 && piezasDelCadaver(-3) === 1);
check("una tirada imposible por arriba se acota a 4", piezasDelCadaver(9) === 4);

// --- ⚠️ LA REGLA QUE SOSTIENE EL OFICIO ------------------------------------
// Gane o pierda, el cadáver pierde una pieza. Si fallar no costara, el jugador
// repetiría hasta vaciar la tabla y el oficio sería un botón con animación.
const abierto = abrirCadaver(3);
check("abrir un cadáver con un 3 deja tres piezas y nada obtenido",
  abierto.restantes === 3 && abierto.obtenidos.length === 0);

const acierto = trasIntento(abierto, true, "Pluma de Águila");
check("acertar se lleva la pieza Y gasta el saldo",
  acierto.restantes === 2 && acierto.obtenidos.length === 1);

const fallo = trasIntento(abierto, false, "Pluma de Águila");
check("FALLAR gasta el saldo igual y no da nada",
  fallo.restantes === 2 && fallo.obtenidos.length === 0);

check("el original no se muta: se devuelve estado nuevo", abierto.restantes === 3);

// Un cadáver agotado no da más, ni siquiera acertando.
let d = abrirCadaver(1);
d = trasIntento(d, true, "A");
check("con una pieza y un acierto, el cadáver queda agotado", agotado(d) === true);
d = trasIntento(d, true, "B");
check("un cadáver agotado no suelta nada más aunque se acierte",
  d.obtenidos.length === 1 && d.restantes === 0);

// Retirarse conserva lo llevado. Es lo único que ningún otro taller tiene.
let r = abrirCadaver(4);
r = trasIntento(r, true, "X");
r = trasIntento(r, false, "Y");
check("retirarse conserva lo bueno y no lo fallado",
  retirarse(r).length === 1 && retirarse(r)[0] === "X" && r.restantes === 2);

// --- Herramientas: se exigen, no se gastan ---------------------------------
check("sin nada no se abre", puedeAbrir([]) === false);
check("con solo el cuchillo tampoco", puedeAbrir(["Cuchillo de Despiece"]) === false);
check("con cuchillo y frascos sí", puedeAbrir([...HERRAMIENTAS_EXTRACCION]) === true);
check("dice QUÉ falta, no solo que falta",
  faltanHerramientas(["Cuchillo de Despiece"]).length === 1);

// --- CD: lo único que la spec no fijó --------------------------------------
// Se vigila la FORMA (sube con el CR, acotada), no los números exactos: son
// ajustables por el DM y clavarlos aquí convertiría un ajuste en un fallo.
check("la CD de un CR 0 es la mínima", cdDespiece("0") === CD_MIN);
check("un CR fraccionario no se pasa de la mínima", cdDespiece("1/4") === CD_MIN);
check("la CD sube con el CR", cdDespiece("10") > cdDespiece("2"));
check("la CD nunca se pasa del techo", cdDespiece("30") === CD_MAX && cdDespiece("24") <= CD_MAX);
for (const m of ALL_MONSTERS) {
  const cd = cdDespiece(m.cr);
  if (cd < CD_MIN || cd > CD_MAX) check(`la CD de "${m.name}" (CR ${m.cr}) está en rango`, false);
}
check("ninguna CD del bestiario se sale de rango", true);
check("acertar es llegar a la CD, no pasarla",
  aciertaCorte(12, 12) === true && aciertaCorte(11, 12) === false);

// --- Cortar a ciegas NO es un −1 ------------------------------------------
// Modelarlo como penalización habría matado la decisión de estudiar.
check("sin estudiar se corta a ciegas", visionTrasEstudiar(null) === "a-ciegas");
check("estudiar bien enseña el punto", visionTrasEstudiar(1) === "visto");
check("estudiar regular lo intuye", visionTrasEstudiar(0) === "intuido");
check("estudiar mal deja a ciegas", visionTrasEstudiar(-1) === "a-ciegas");
check("toda visión tiene texto en pantalla",
  (["visto", "intuido", "a-ciegas"] as const).every((v) => !!VISION_LABEL[v]));

// --- El tope es el MISMO que el de los otros seis --------------------------
// Tenerlo escrito dos veces era la forma segura de que un día dejaran de
// coincidir y un despiece bien jugado se comiera la matemática del reglamento.
check("el tope de manipulación es el compartido", TOPE === TOPE_TALLER);
check("la manipulación no se pasa del tope",
  manipulacionExtraccion([1, 1, 1]) <= TOPE_TALLER && manipulacionExtraccion([-1, -1, -1]) >= -TOPE_TALLER);

// --- Las tres fases --------------------------------------------------------
check("son tres fases, en orden", FASES_EXTRACCION.join(",") === "estudiar,cortar,guardar");
check("toda fase tiene nombre y explicación",
  FASES_EXTRACCION.every((f) => !!FASE_EXTRACCION_LABEL[f] && !!FASE_EXTRACCION_BLURB[f]));

// --- Cobertura, informativa ------------------------------------------------
const cubiertos = Object.keys(DESPIECE).length;
console.log(`\n(${cubiertos} de ${ALL_MONSTERS.length} monstruos emparejados; el resto no es despiezable, que es válido)`);

console.log(failures === 0 ? `\nTodo OK` : `\n${failures} FALLOS`);
process.exit(failures === 0 ? 0 : 1);
