// Integridad de la semilla de conjuros. Uso: npx tsx scripts/check-spells.ts
import { SPELLS, spellsForClass, spellById } from "../data/spells";
import { CLASS_MECHANICS } from "../data/classdata";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const todos = Object.values(SPELLS);
check("la semilla tiene al menos 25 conjuros", todos.length >= 25);

// Cada entrada: la clave del registro es su id.
let idsOk = true;
for (const [key, s] of Object.entries(SPELLS)) if (key !== s.id) idsOk = false;
check("la clave del registro coincide con el id", idsOk);

// Niveles 0-3 en esta semilla (0 = truco).
check("todos los niveles están entre 0 y 3", todos.every((s) => s.level >= 0 && s.level <= 3));

// Campos de texto obligatorios, no vacíos.
const camposOk = todos.every((s) => !!s.name && !!s.school && !!s.time && !!s.range && !!s.components && !!s.duration && s.desc.length > 20);
check("nombre/escuela/tiempo/alcance/componentes/duración/desc rellenos", camposOk);

// Las clases referenciadas existen en classdata y son conjuradoras.
const slugsValidos = new Set(Object.keys(CLASS_MECHANICS));
const clasesOk = todos.every((s) => s.classes.length > 0 && s.classes.every((c) => slugsValidos.has(c)));
check("todas las clases de la lista existen en classdata", clasesOk);
const conjuradorasOk = todos.every((s) => s.classes.every((c) => CLASS_MECHANICS[c]?.caster !== "none"));
check("ningún conjuro se asigna a una clase no conjuradora", conjuradorasOk);

// Coherencia: si es de concentración, la duración lo dice.
const concOk = todos.every((s) => !s.concentration || /concentraci/i.test(s.duration));
check("los de concentración lo declaran en la duración", concOk);

// Un truco nunca gasta hueco: no debe declararse ritual (los rituales son de nivel ≥1).
check("ningún truco está marcado como ritual", todos.every((s) => !(s.level === 0 && s.ritual)));

// Lectores.
check("spellById encuentra un conjuro conocido", spellById("curar-heridas")?.name === "Curar Heridas");
check("spellById devuelve null con un id inventado", spellById("no-existe") === null);

const mago = spellsForClass("mago");
check("el mago tiene conjuros en la semilla", mago.length > 0);
check("spellsForClass solo devuelve conjuros de esa clase", mago.every((s) => s.classes.includes("mago")));
check("spellsForClass ordena por nivel y luego por nombre", (() => {
  for (let i = 1; i < mago.length; i++) {
    const a = mago[i - 1], b = mago[i];
    if (a.level > b.level) return false;
    if (a.level === b.level && a.name.localeCompare(b.name, "es") > 0) return false;
  }
  return true;
})());
check("spellsForClass de una clase sin conjuros devuelve vacío", spellsForClass("barbaro").length === 0);

// Las 8 clases conjuradoras tienen algo que preparar en la semilla.
for (const c of ["bardo", "brujo", "clerigo", "druida", "explorador", "hechicero", "mago", "paladin"]) {
  check(`${c}: la semilla le da al menos un conjuro`, spellsForClass(c).length > 0);
}

if (failures) { console.log(`\n${failures} FALLos`); process.exit(1); }
console.log("\nTodo en verde");
