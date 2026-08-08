// Comprobación de los avisos. Uso: npx tsx scripts/check-avisos.ts
//
// ⚠️ Esto vigila `lib/avisos.ts`, que es el QUÉ dice cada aviso. El CÓMO
// —la llamada a SILEO— vive en `components/Avisos.tsx` y no se comprueba aquí:
// es una línea que traduce a la librería. Lo que puede romperse en silencio es
// el texto, y por eso el texto está fuera del componente.
//
// La pregunta de siempre: ¿qué rompo para que falle?
//   · Un tipo nuevo en el union sin su rama en `textoDe` → no compila (bien),
//     pero un `title` vacío SÍ compila y pinta una caja gris sin nada dentro.
//   · Un tipo que se queda fuera de `TIPOS_AVISO` → el gate dejaría de mirarlo
//     sin que nadie lo note, que es el fallo de las listas escritas a mano.
import { textoDe, TIPOS_AVISO, type Aviso } from "../lib/avisos";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// Un ejemplar de CADA tipo, escrito a mano. Si saliera de `TIPOS_AVISO`, las
// dos mitades se moverían juntas y añadir un tipo sin texto no rompería nada.
const MUESTRAS: Aviso[] = [
  { tipo: "mision-aceptada", titulo: "Lo que subió del suelo", recompensa: "50 po" },
  { tipo: "mision-aceptada", titulo: "Sin recompensa escrita" },
  { tipo: "mision-ya-la-tenias", titulo: "Lo que subió del suelo" },
  { tipo: "mision-completada", titulo: "El perro que va y viene", recompensa: "15 po" },
  { tipo: "mision-fallida", titulo: "La partida que no volvió" },
  { tipo: "objeto", name: "Jarra de cerveza de Byroden" },
  { tipo: "objeto", name: "Flecha", qty: 20 },
  { tipo: "oro", cantidad: 50 },
  { tipo: "oro", cantidad: -12 },
  { tipo: "pista", texto: "Las lápidas apuntan todas al mismo punto del bosque." },
  { tipo: "saber", cuantas: 1 },
  { tipo: "saber", cuantas: 3 },
  { tipo: "nivel", nivel: 3 },
  { tipo: "descanso", largo: true },
  { tipo: "descanso", largo: false },
];

// 1. TODOS los tipos declarados tienen al menos una muestra. Esta es la que
//    caza el olvido: añadir un evento y no probarlo nunca.
for (const t of TIPOS_AVISO) {
  check(`el tipo "${t}" está cubierto por una muestra`, MUESTRAS.some((m) => m.tipo === t));
}
check(`no hay muestras de tipos que ya no existen`,
  MUESTRAS.every((m) => (TIPOS_AVISO as readonly string[]).includes(m.tipo)));

// 2. Ninguna sale sin título. Un aviso sin título es una caja gris: el jugador
//    ve que ha pasado algo y no sabe qué, que es peor que no avisar.
for (const m of MUESTRAS) {
  const t = textoDe(m);
  const etiqueta = `${m.tipo}${"titulo" in m ? ` (${m.titulo})` : ""}`;
  check(`"${etiqueta}" tiene título`, t.title.trim().length > 0);
  check(`"${etiqueta}" tiene un tono válido`,
    ["success", "info", "warning", "error"].includes(t.tono));
  // La descripción puede faltar, pero si está, que diga algo.
  check(`"${etiqueta}" no tiene una descripción vacía`,
    t.description === undefined || t.description.trim().length > 0);
}

// 3. Reglas concretas que se pensaron y que se perderían al reescribir el texto.
const conRecompensa = textoDe({ tipo: "mision-aceptada", titulo: "X", recompensa: "50 po" });
const sinRecompensa = textoDe({ tipo: "mision-aceptada", titulo: "X" });
check("una misión con recompensa la NOMBRA en el aviso", conRecompensa.description?.includes("50 po") === true);
check("una sin recompensa no inventa ninguna", sinRecompensa.description === "X");

// El oro se cobra Y se paga: sin signo, «12 po» de cobro y de pago se leen
// igual y el jugador no sabe si le han quitado o dado.
const cobro = textoDe({ tipo: "oro", cantidad: 50 });
const pago = textoDe({ tipo: "oro", cantidad: -12 });
check("cobrar oro lo marca con +", cobro.description?.startsWith("+") === true);
check("pagar oro lo marca con −", pago.description?.startsWith("−") === true);
check("cobrar y pagar no dicen lo mismo", cobro.title !== pago.title);

// «Ya la llevabas» NO es un error: es información. Pintarlo en rojo haría creer
// al jugador que ha roto algo por repetir una conversación.
check("«ya la llevabas» no se pinta como error",
  textoDe({ tipo: "mision-ya-la-tenias", titulo: "X" }).tono === "info");
check("una misión fallida sí es un error",
  textoDe({ tipo: "mision-fallida", titulo: "X" }).tono === "error");

// Singular y plural del saber: «1 entradas nuevas» se lee como un bug.
const uno = textoDe({ tipo: "saber", cuantas: 1 });
const varias = textoDe({ tipo: "saber", cuantas: 3 });
check("el saber distingue singular de plural", uno.title !== varias.title && uno.description !== varias.description);

// Un objeto suelto no lleva «×1» colgando; varios sí dicen cuántos.
const suelto = textoDe({ tipo: "objeto", name: "Cuerda" });
const varios = textoDe({ tipo: "objeto", name: "Flecha", qty: 20 });
check("un objeto suelto no enseña la cantidad", suelto.description === "Cuerda");
check("varios objetos sí la enseñan", varios.description === "Flecha ×20");

console.log(`\nAvisos: ${TIPOS_AVISO.length} tipos, ${MUESTRAS.length} muestras.`);
console.log(failures === 0 ? "Todas las comprobaciones pasaron." : `${failures} fallaron.`);
process.exit(failures === 0 ? 0 : 1);
