// Comprobación de lib/rastreo.ts. Uso: npx tsx scripts/check-rastreo.ts
//
// Vigila «buscarse la vida»: encontrar una misión mirando, sin que nadie la
// encargue. Es la pieza que más fácil se rompe en silencio, porque un rastro mal
// puesto no da error — simplemente no aparece nunca en el sitio donde alguien lo
// buscaría, y el contenido se vuelve inalcanzable.
//
// La pregunta de siempre: ¿qué rompo para que falle?
//   · Un `lugar` que no case con ningún nodo → el rastro no sale en ninguna
//     parte y la misión solo se puede conseguir hablando.
//   · Una pericia que no sea de buscar → sería otra vez la tirada de saber.
//   · Que se puedan encontrar dos veces → la CD deja de significar nada.
import { rastrosDe, seEncuentra, poiDelNodo, PERICIAS_RASTREO } from "../lib/rastreo";
import { MISIONES } from "../data/misiones";
import { SKILLS } from "../data/rules";
import { franjaDeNodo } from "../data/bosque";
import { seedAtlas } from "../data/atlas";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const conRastro = MISIONES.filter((m) => m.descubrimiento);

/* ------------------------- EL DATO: LOS SEIS RASTROS -------------------- */
// El número va escrito a mano: si saliera de `MISIONES`, quedarse sin ninguno
// no rompería nada y la pieza entera dejaría de existir en silencio.
check(`hay entre 5 y 6 misiones descubribles (hay ${conRastro.length})`,
  conRastro.length >= 5 && conRastro.length <= 6);
check("no son TODAS: los PNJ siguen haciendo falta", conRastro.length < MISIONES.length);

const PERICIAS_REALES = new Set(SKILLS.map((s) => s.name));
for (const m of conRastro) {
  const d = m.descubrimiento!;
  const tag = `"${m.slug}"`;

  // Una pericia mal escrita no tendría modificador que sumar y la tirada saldría
  // a pelo, en silencio y siempre peor. Y tiene que ser DE BUSCAR: con Historia
  // esto sería `SaberRoll`, que ya existe y hace otra cosa.
  check(`${tag}: "${d.pericia}" es una pericia real`, PERICIAS_REALES.has(d.pericia));
  check(`${tag}: "${d.pericia}" es de las tres de buscar`,
    (PERICIAS_RASTREO as readonly string[]).includes(d.pericia));
  check(`${tag}: la CD es de D&D (5-25)`, d.cd >= 5 && d.cd <= 25);
  // El texto se lee en pantalla al acertar: si es de dos palabras, encontrar
  // algo se parece demasiado a no encontrar nada.
  check(`${tag}: el texto de lo que se ve tiene cuerpo`, d.texto.trim().length >= 100);
  // ⚠️ Y NO dice el nombre de la misión: se supone que estás viendo algo raro,
  // no leyendo el título de un encargo.
  check(`${tag}: el texto no destripa el título de la misión`,
    !d.texto.toLowerCase().includes(m.titulo.toLowerCase()));
}

/* --------------- LO QUE MUERDE: QUE EL RASTRO SALGA DONDE TOCA ---------- */
// Un `lugar` que no case con ningún nodo real deja el rastro fuera de todas
// partes. No falla nada: la misión existe, el texto está escrito, y no aparece
// jamás. Es el fallo mudo de esta pieza.
{
  const POIS = new Set(Object.values(seedAtlas()).flatMap((c) => Object.values(c.pois).flat().map((p) => p.name)));
  for (const m of conRastro) {
    const esFranja = m.lugar.startsWith("franja:");
    const nodo = esFranja ? m.lugar : `poi:${m.lugar}`;
    check(`"${m.slug}": su lugar (${m.lugar}) es un nodo real`,
      esFranja ? franjaDeNodo(m.lugar) !== null : POIS.has(m.lugar));
    check(`"${m.slug}": se encuentra estando en ${nodo}`,
      rastrosDe(nodo).some((r) => r.slug === m.slug));
  }
}

// Un sub-lugar HEREDA lo de su pueblo: una misión de Byroden tiene que poder
// encontrarse desde la taberna. Sin esa rama, entrar en un edificio hacía
// desaparecer lo que se ve desde la plaza, que es al revés de como funciona
// mirar.
{
  const deByroden = MISIONES.filter((m) => m.descubrimiento && m.lugar === "Byroden");
  check("hay alguna descubrible en Byroden (si no, esta regla no se prueba)", deByroden.length > 0);
  for (const m of deByroden) {
    check(`"${m.slug}" también se encuentra desde la taberna`,
      rastrosDe("sub:Byroden/taberna").some((r) => r.slug === m.slug));
  }
  check("poiDelNodo lee el pueblo de un sub-lugar", poiDelNodo("sub:Byroden/taberna") === "Byroden");
  check("poiDelNodo lee el pueblo de un POI", poiDelNodo("poi:Emon") === "Emon");
  check("una franja no es de ningún pueblo", poiDelNodo("franja:linde") === null);
}

// Un sitio sin nada escrito no ofrece rastros, y eso también hay que poder
// decirlo: la pantalla enseña la sección igual y contesta que no ves nada.
check("un sitio sin rastros devuelve la lista vacía", rastrosDe("poi:Emon").length === 0);
check("un nodo inventado no revienta ni inventa rastros", rastrosDe("poi:Atlantida").length === 0);

/* ----------------------- YA DESCUBIERTAS: NO SE REPITEN ----------------- */
// Sin esto, la misma tirada se repite hasta que sale y una CD deja de
// significar nada.
{
  const uno = conRastro[0];
  const nodo = uno.lugar.startsWith("franja:") ? uno.lugar : `poi:${uno.lugar}`;
  check("un rastro ya descubierto no se vuelve a ofrecer",
    !rastrosDe(nodo, [uno.slug]).some((r) => r.slug === uno.slug));
  check("y los demás del sitio siguen ahí",
    rastrosDe(nodo, [uno.slug]).length === rastrosDe(nodo).length - 1);
}

/* --------------------------- EL EMPATE CUENTA --------------------------- */
// En D&D sacar JUSTO la CD acierta. Se olvida al reescribir y nadie lo nota:
// solo se pierde un caso de cada veinte.
{
  const r = { slug: "x", titulo: "X", pericia: "Percepción" as const, cd: 13, texto: "..." };
  check("justo en la CD se encuentra", seEncuentra(r, 13));
  check("uno por debajo, no", !seEncuentra(r, 12));
  check("por encima, sí", seEncuentra(r, 20));
}

console.log(`\nRastreo: ${conRastro.length} misiones descubribles de ${MISIONES.length}.`);
console.log(failures === 0 ? "Todas las comprobaciones pasaron." : `${failures} fallaron.`);
process.exit(failures === 0 ? 0 : 1);
