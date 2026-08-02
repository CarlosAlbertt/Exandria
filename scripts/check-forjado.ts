// Gate: las tres fases del FORJADO (caldear, martillar, templar).
// Uso: npx tsx scripts/check-forjado.ts
//
// Ojo con el nombre: `check-forja.ts` es otro y vigila el CATÁLOGO de los 75
// materiales. Este vigila la manipulación, que es `lib/forjado.ts`.
//
// Lo que se rompe en silencio en un minijuego: que las bandas dejen de dar lo
// que prometen, que el compás regale golpes que no se han dado, y que el ±1 de
// forja deje de valer lo mismo que el de alquimia — si cada taller se escribiera
// su aritmética, un +1 no significaría lo mismo en dos pantallas y la mesa no
// podría fiarse de ninguna.

import {
  CALDEAR, TEMPLAR, GOLPES, TOLERANCIA_GOLPE,
  puntoCaldear, puntoTemplar, puntoMartillar, tramoDeCalor, COLORES_CALOR,
} from "../lib/forjado";
import { TOPE, totalManipulacion, puntoEnBandas, type Punto } from "../lib/manipulacion";

let fallos = 0;
function check(label: string, condition: boolean) {
  if (condition) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); fallos++; }
}

const medio = (b: readonly [number, number]) => (b[0] + b[1]) / 2;

/* ---------------------------- 1 · Caldear ------------------------------ */

check("el cereza da +1", puntoCaldear(medio(CALDEAR.centro)) === 1);
check("dentro del rango forjable da 0",
  puntoCaldear(CALDEAR.banda[0] + 0.001) === 0 && puntoCaldear(CALDEAR.banda[1] - 0.001) === 0);
check("frío y quemado cuestan -1", puntoCaldear(0) === -1 && puntoCaldear(1) === -1);

// La banda NO está centrada, y es la decisión de diseño: quedarse corto solo
// significa que no se puede forjar, pasarse quema la pieza. El punto bueno va
// por encima de la mitad para que el error barato quede más cerca.
check("el cereza está por encima de la mitad de la escala", medio(CALDEAR.centro) > 0.5);
const margenAbajo = CALDEAR.centro[0] - CALDEAR.banda[0];
const margenArriba = CALDEAR.banda[1] - CALDEAR.centro[1];
check(`caldear perdona más por abajo que por arriba (${margenAbajo.toFixed(2)} vs ${margenArriba.toFixed(2)})`,
  margenAbajo < margenArriba);

// La escala de color tiene que cubrir el 0–1 entero y en orden: un hueco entre
// dos tramos dejaría una temperatura sin nombre y la barra mentiría.
let anterior = 0;
let escalaSana = true;
for (const t of COLORES_CALOR) {
  if (t.hasta <= anterior) escalaSana = false;
  anterior = t.hasta;
}
check("los tramos de calor van en orden y sin huecos", escalaSana);
check("la escala llega hasta el final", anterior >= 1);
check("el nombre del tramo cambia a lo largo de la escala",
  tramoDeCalor(0).nombre === "frío" && tramoDeCalor(1).nombre === "blanco");
check("el punto bueno cae en el tramo que se le promete al jugador",
  tramoDeCalor(medio(CALDEAR.centro)).nombre === "cereza");
// Fuera de rango no puede reventar ni inventarse un tramo.
check("una temperatura imposible se acota",
  tramoDeCalor(-5).nombre === "frío" && tramoDeCalor(9).nombre === "blanco");
check("un calor que no es número no rompe", tramoDeCalor(NaN).nombre === "frío");

/* --------------------------- 2 · Martillar ----------------------------- */

const clavados = [0, 0, 0];
check("los tres golpes clavados dan +1", puntoMartillar(clavados) === 1);
check("dos a tiempo dan 0", puntoMartillar([0, 0, 0.5]) === 0);
check("uno a tiempo cuesta -1", puntoMartillar([0, 0.4, 0.5]) === -1);
check("ninguno a tiempo cuesta -1", puntoMartillar([0.3, 0.4, 0.5]) === -1);

// **Un golpe que no se da es un golpe que no cayó a tiempo.** Soltar el martillo
// a media tanda no es una forma barata de no arriesgar —no suma— pero tampoco un
// castigo aparte: dos clavados y soltar vale lo mismo que dar los tres fallando
// uno, que es lo que la mesa espera al contarlos.
//
// Este check nació al revés (pedía -1) y **el gate destapó que el equivocado era
// el check, no la aritmética**. Se deja escrito porque es la clase de regla que
// dentro de tres meses se «arregla» en la dirección contraria.
check("dos clavados y soltar vale lo mismo que dos de tres",
  puntoMartillar([0, 0]) === 0 && puntoMartillar([0, 0]) === puntoMartillar([0, 0, 0.5]));
check("un solo golpe, aunque sea clavado, cuesta -1", puntoMartillar([0]) === -1);
check("no dar ninguno cuesta -1", puntoMartillar([]) === -1);

// El desvío es una DISTANCIA: adelantarse tiene que costar lo mismo que
// retrasarse. Si solo se mirara el signo, medio compás saldría gratis.
check("adelantarse y retrasarse cuestan igual",
  puntoMartillar([TOLERANCIA_GOLPE * 2, 0, 0]) === puntoMartillar([-TOLERANCIA_GOLPE * 2, 0, 0]));
check("justo en el límite todavía cuenta",
  puntoMartillar([TOLERANCIA_GOLPE, TOLERANCIA_GOLPE, -TOLERANCIA_GOLPE]) === 1);
check("pasado el límite ya no", puntoMartillar([TOLERANCIA_GOLPE + 0.001, 0, 0]) === 0);
// Un desvío corrupto no puede colar como golpe bueno.
check("un desvío que no es número no cuenta como acierto",
  puntoMartillar([NaN, 0, 0]) === 0 && puntoMartillar([Infinity, NaN, 0]) === -1);
// Y golpes de más no pueden tapar un fallo: solo cuentan los que se piden.
check("golpear de más no arregla un fallo", puntoMartillar([0.5, 0, 0, 0, 0]) === 0);
check("la tolerancia es una ventana sensata", TOLERANCIA_GOLPE > 0 && TOLERANCIA_GOLPE < 0.5);
check("se piden tres golpes", GOLPES === 3);

/* ---------------------------- 3 · Templar ------------------------------ */

check("templar a tiempo da +1", puntoTemplar(medio(TEMPLAR.centro)) === 1);
check("dentro del margen da 0",
  puntoTemplar(TEMPLAR.banda[0] + 0.001) === 0 && puntoTemplar(TEMPLAR.banda[1] - 0.001) === 0);
check("pronto o tarde cuesta -1", puntoTemplar(0) === -1 && puntoTemplar(1) === -1);
// Aquí SÍ es simétrico: blanda de un lado, rajada del otro, cuestan lo mismo.
const bajoT = TEMPLAR.centro[0] - TEMPLAR.banda[0];
const altoT = TEMPLAR.banda[1] - TEMPLAR.centro[1];
check(`templar es simétrico (${bajoT.toFixed(2)} vs ${altoT.toFixed(2)})`, Math.abs(bajoT - altoT) < 0.001);

/* --------------------- Lo mismo que en alquimia ------------------------ */
// Un +1 de forja vale lo que un +1 de alquimia porque las dos pasan por las
// MISMAS funciones. Si alguien duplicara la aritmética aquí, esto lo caza.
check("caldear usa la banda compartida", puntoCaldear(0.55) === puntoEnBandas(0.55, CALDEAR));
check("templar usa la banda compartida", puntoTemplar(0.5) === puntoEnBandas(0.5, TEMPLAR));

const PUNTOS: Punto[] = [-1, 0, 1];
const combos: Punto[][] = [];
for (const a of PUNTOS) for (const b of PUNTOS) for (const c of PUNTOS) combos.push([a, b, c]);
const fuera = combos.filter((c) => { const t = totalManipulacion(c); return t < -TOPE || t > TOPE; }).length;
check(`las ${combos.length} combinaciones de forja caben en ±${TOPE}`, fuera === 0);
// Las tres fases perfectas dan exactamente el tope, ni más ni menos.
check("tres fases clavadas dan +3",
  totalManipulacion([
    puntoCaldear(medio(CALDEAR.centro)), puntoMartillar(clavados), puntoTemplar(medio(TEMPLAR.centro)),
  ]) === TOPE);
check("tres fases falladas dan -3",
  totalManipulacion([puntoCaldear(0), puntoMartillar([]), puntoTemplar(1)]) === -TOPE);

if (fallos > 0) {
  console.error(`\ncheck-forjado: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("check-forjado: ok");
