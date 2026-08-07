// Comprobación de los árboles de diálogo. Uso: npx tsx scripts/check-dialogos.ts
//
// ⚠️ No confundir con `check-lugares` (por dónde se anda) ni con `check-lore`
// (el saber). Este vigila **las consecuencias**: que un premio no salga al
// fallar, que una opción quemada no se pueda repetir, que la confianza no se
// desmadre y que ninguna etapa lleve a un sitio que no existe.
//
// La pregunta de siempre: ¿qué rompo para que falle?
import { DIALOGOS, CLAVES_DIALOGO } from "../data/dialogos";
import {
  tratoInicial, leerTrato, resolver, opcionDisponible, tonoConfianza,
  etapaVigente, CONFIANZA_INICIAL, type ArbolDialogo, type TratoPnj,
} from "../lib/dialogo";
import { SKILLS } from "../data/rules";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

/* ------------------------- INTEGRIDAD DE LOS ÁRBOLES -------------------- */
const PERICIAS = new Set(SKILLS.map((s) => s.name));

check("hay árboles escritos", CLAVES_DIALOGO.length > 0);
// Escritas a mano: si salieran de DIALOGOS, borrar a Vell no rompería nada.
for (const clave of ["mirna", "vell"]) {
  check(`existe el árbol "${clave}"`, !!DIALOGOS[clave]);
}

for (const [clave, arbol] of Object.entries(DIALOGOS)) {
  const etapas = Object.keys(arbol.etapas);
  check(`"${clave}": su etapa de inicio existe`, !!arbol.etapas[arbol.inicio]);
  check(`"${clave}": tiene más de una etapa`, etapas.length > 1);

  for (const [ek, etapa] of Object.entries(arbol.etapas)) {
    check(`"${clave}/${ek}": tiene saludo`, etapa.saludo.trim().length > 20);
    check(`"${clave}/${ek}": tiene opciones`, etapa.opciones.length > 0);
    // Sin salida se entra en una etapa y no se sale: la ratonera de `check-lugares`
    // pero en conversación. Vale con `siguiente: null` (despedirse).
    check(`"${clave}/${ek}": se puede cerrar o avanzar desde aquí`,
      etapa.opciones.some((o) => o.siguiente !== undefined));

    etapa.opciones.forEach((o, i) => {
      const donde = `"${clave}/${ek}" opción ${i}`;
      check(`${donde}: tiene texto y éxito`, o.texto.trim().length > 3 && o.exito.trim().length > 10);
      // LA GORDA de los árboles: un `siguiente` que no existe deja la
      // conversación en una etapa fantasma.
      if (o.siguiente) check(`${donde}: "${o.siguiente}" es una etapa real`, !!arbol.etapas[o.siguiente]);
      if (o.siguienteSiFalla) check(`${donde}: "${o.siguienteSiFalla}" es una etapa real`, !!arbol.etapas[o.siguienteSiFalla]);
      if (o.chequeo) {
        // Una pericia mal escrita no tendría modificador que sumar y la tirada
        // saldría a pelo, en silencio y siempre peor.
        check(`${donde}: "${o.chequeo.pericia}" es una pericia real`, PERICIAS.has(o.chequeo.pericia));
        check(`${donde}: la CD es de D&D (5–25)`, o.chequeo.cd >= 5 && o.chequeo.cd <= 25);
        // Con chequeo hace falta texto de fallo, o al fallar el PNJ diría lo
        // mismo que al acertar y no se notaría que salió mal.
        check(`${donde}: tiene texto de fallo`, !!o.fallo && o.fallo.trim().length > 10);
      }
      // Un premio sin chequeo es un objeto gratis por pulsar un botón.
      if (o.premio) check(`${donde}: el premio va detrás de una tirada o de una etapa ganada`,
        !!o.chequeo || !!o.siguiente || ek !== arbol.inicio);
    });
  }

  // Toda etapa se alcanza desde alguna opción, o es la de inicio. Una suelta
  // es contenido escrito que nadie va a leer nunca.
  const alcanzables = new Set([arbol.inicio]);
  for (const e of Object.values(arbol.etapas)) {
    for (const o of e.opciones) {
      if (o.siguiente) alcanzables.add(o.siguiente);
      if (o.siguienteSiFalla) alcanzables.add(o.siguienteSiFalla);
    }
  }
  for (const ek of etapas) check(`"${clave}/${ek}" se alcanza desde algún sitio`, alcanzables.has(ek));
}

/* ---------------------------- LAS CONSECUENCIAS ------------------------- */
// Árbol de laboratorio, escrito a mano aquí: probar sobre `mirna` haría que
// reescribirla tumbara el gate por motivos que no son el gate.
const T: ArbolDialogo = {
  inicio: "a",
  etapas: {
    a: {
      saludo: "Saludo de prueba para el laboratorio.",
      opciones: [
        { texto: "charla", exito: "dice algo sin más" },
        {
          texto: "tirada", chequeo: { pericia: "Persuasión", cd: 12 },
          exito: "acierta y te da la cosa", fallo: "falla y no te da nada",
          premio: { tipo: "objeto", name: "Cosa" }, siguiente: "b",
        },
        { texto: "adiós", exito: "hasta luego", siguiente: null },
      ],
    },
    b: { saludo: "Segunda etapa del laboratorio.", confianzaMin: 55, opciones: [{ texto: "x", exito: "y", siguiente: null }] },
  },
};
const base = tratoInicial(T);

check("la confianza empieza en 50", base.confianza === CONFIANZA_INICIAL && CONFIANZA_INICIAL === 50);
check("se empieza en la etapa de inicio", base.etapa === "a");

// ⚠️ LA REGLA QUE NO PUEDE FALLAR EN SILENCIO: el premio SOLO al acertar.
const gana = resolver(T, base, 1, 15)!;
const pierde = resolver(T, base, 1, 8)!;
check("acertando la tirada, acierta", gana.acierto);
check("acertando, entrega el premio", !!gana.premio);
check("fallando, NO entrega el premio", !pierde.premio);
check("fallando, dice el texto de fallo", pierde.texto === "falla y no te da nada");
check("acertando, dice el de éxito", gana.texto === "acierta y te da la cosa");
check("justo en la CD se acierta", resolver(T, base, 1, 12)!.acierto);
check("uno por debajo de la CD se falla", !resolver(T, base, 1, 11)!.acierto);

// La confianza se mueve, y acotada.
check("acertar sube la confianza", gana.trato.confianza === 60);
check("fallar la baja", pierde.trato.confianza === 45);
check("no pasa de 100", resolver(T, { ...base, confianza: 98 }, 1, 20)!.trato.confianza === 100);
check("no baja de 0", resolver(T, { ...base, confianza: 2 }, 1, 3)!.trato.confianza === 0);

// Quemar la opción fallada: es lo que hace que elegir pese.
check("la opción fallada queda quemada", pierde.trato.fallidas["a"]?.includes(1) === true);
check("y ya no está disponible", !opcionDisponible(pierde.trato, "a", 1));
check("no se puede volver a jugar una quemada", resolver(T, pierde.trato, 1, 20) === null);
check("las demás siguen disponibles", opcionDisponible(pierde.trato, "a", 0));
// Una opción de charla que se falle no se quema: no hay nada que fallar.
check("acertar NO quema nada", Object.keys(gana.trato.fallidas).length === 0);

// El salto de etapa.
check("acertar avanza de etapa", gana.trato.etapa === "b");
check("fallar se queda donde estaba", pierde.trato.etapa === "a");
check("`siguiente: null` cierra la conversación", resolver(T, base, 2, null)!.cierra);
check("una opción normal no cierra", !resolver(T, base, 0, null)!.cierra);

// Sin tirada donde hace falta, no se resuelve: la pantalla no puede saltarse
// el dado y cobrar el premio.
check("una opción con CD exige un total", resolver(T, base, 1, null) === null);
check("una opción sin CD no lo exige", !!resolver(T, base, 0, null));
check("un índice que no existe no resuelve nada", resolver(T, base, 99, null) === null);

// No muta lo que se le pasa: el trato viejo tiene que seguir intacto.
check("resolver no muta el trato recibido", base.confianza === 50 && Object.keys(base.fallidas).length === 0);

/* ------------------------ LEER LO QUE HAY GUARDADO ---------------------- */
check("un play_state vacío da el trato inicial", leerTrato(undefined, T).etapa === "a");
check("basura no tumba nada", leerTrato("nada de esto", T).confianza === 50);
// Una etapa que ya no existe —el árbol se reescribió— vuelve al inicio en vez
// de dejar al jugador mirando una pantalla vacía.
check("una etapa borrada cae al inicio", leerTrato({ etapa: "zzz", confianza: 70, fallidas: {} }, T).etapa === "a");
check("pero conserva la confianza", leerTrato({ etapa: "zzz", confianza: 70, fallidas: {} }, T).confianza === 70);
check("una confianza fuera de rango se acota", leerTrato({ etapa: "a", confianza: 500, fallidas: {} }, T).confianza === 100);
check("una confianza que no es número cae a 50", leerTrato({ etapa: "a", confianza: "mucha", fallidas: {} }, T).confianza === 50);
check("las quemadas se conservan", leerTrato({ etapa: "a", confianza: 50, fallidas: { a: [1] } }, T).fallidas["a"]?.[0] === 1);

/* -------------------------- CONFIANZA Y ETAPAS -------------------------- */
check("por debajo de 30 es hostil", tonoConfianza(29) === "hostil");
check("entre 30 y 70 es neutral", tonoConfianza(50) === "neutral");
check("de 70 para arriba es amistoso", tonoConfianza(70) === "amistoso");

// Una etapa con mínimo se cierra si la confianza cae después de alcanzarla: el
// PNJ deja de tratarte como te trataba.
const enB: TratoPnj = { confianza: 60, etapa: "b", fallidas: {} };
check("con confianza de sobra, la etapa aguanta", etapaVigente(T, enB) === "b");
check("si la confianza baja del mínimo, se cae al inicio", etapaVigente(T, { ...enB, confianza: 40 }) === "a");
check("una etapa sin mínimo nunca caduca", etapaVigente(T, { confianza: 0, etapa: "a", fallidas: {} }) === "a");

const nOpts = Object.values(DIALOGOS).reduce((n, a) => n + Object.values(a.etapas).reduce((m, e) => m + e.opciones.length, 0), 0);
const nEtapas = Object.values(DIALOGOS).reduce((n, a) => n + Object.keys(a.etapas).length, 0);
console.log(`\nDiálogos: ${CLAVES_DIALOGO.length} PNJ, ${nEtapas} etapas, ${nOpts} opciones.`);
console.log(failures === 0 ? "Todas las comprobaciones pasaron." : `${failures} fallaron.`);
process.exit(failures === 0 ? 0 : 1);
