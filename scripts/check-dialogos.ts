// Comprobación de los árboles de diálogo. Uso: npx tsx scripts/check-dialogos.ts
//
// ⚠️ No confundir con `check-lugares` (por dónde se anda) ni con `check-lore`
// (el saber). Este vigila **las consecuencias**: que un premio no salga al
// fallar, que una opción quemada no se pueda repetir, que la confianza no se
// desmadre y que ninguna etapa lleve a un sitio que no existe.
//
// La pregunta de siempre: ¿qué rompo para que falle?
import { DIALOGOS, CLAVES_DIALOGO, PNJ_REALES, PALABRAS_PROHIBIDAS_ELARA } from "../data/dialogos";
import {
  tratoInicial, leerTrato, resolver, opcionDisponible, tonoConfianza,
  etapaVigente, CONFIANZA_INICIAL, type ArbolDialogo, type TratoPnj,
} from "../lib/dialogo";
import { SKILLS } from "../data/rules";
import { MISIONES } from "../data/misiones";
import { NPC_TEMPLATES } from "../data/npcTemplates";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

/* ------------------------- INTEGRIDAD DE LOS ÁRBOLES -------------------- */
const PERICIAS = new Set(SKILLS.map((s) => s.name));

check("hay árboles escritos", CLAVES_DIALOGO.length > 0);
// ⚠️ Los CINCO que existen de verdad en la partida, escritos a mano aquí. Si la
// lista saliera de `DIALOGOS`, borrar a Elara no rompería nada — y borrar a
// Elara rompe la campaña, porque es la líder del culto.
for (const clave of ["silas", "garrick", "elara", "cora", "yorick"]) {
  check(`existe el árbol del PNJ real "${clave}"`, !!DIALOGOS[clave]);
}
check("PNJ_REALES no se ha quedado corto", PNJ_REALES.length === 5);
for (const clave of PNJ_REALES) {
  check(`"${clave}" sigue teniendo árbol`, !!DIALOGOS[clave]);
}

/* ---------------------- LA TAPADERA DE ELARA ---------------------------- */
// ⚠️ **Es una REGLA, no un estilo.** El usuario decidió el 2026-08-09 que a
// Elara no se la puede destapar hablando: ninguna tirada, ningún «casi». Una
// palabra suelta en su boca —«ritual», «altar», «sótano»— la delata sin que
// nadie lo haya decidido en la mesa, y quien la escriba (yo el primero, dentro
// de tres meses y sin acordarme) no se va a dar cuenta.
{
  const elara = DIALOGOS["elara"];
  check("Elara tiene árbol", !!elara);
  if (elara) {
    const texto = Object.values(elara.etapas)
      .flatMap((e) => [e.saludo, ...e.opciones.flatMap((o) => [o.texto, o.exito, o.fallo ?? ""])])
      .join(" ")
      .toLowerCase();
    for (const p of PALABRAS_PROHIBIDAS_ELARA) {
      check(`Elara nunca dice "${p}"`, !texto.includes(p));
    }
    // Y ninguna tirada la desmonta: si alguna opción suya lleva chequeo, es que
    // alguien ha abierto una puerta que se decidió tener cerrada.
    const conTirada = Object.entries(elara.etapas).flatMap(([ek, e]) =>
      e.opciones.map((o, i) => (o.chequeo ? `${ek}/${i}` : null)).filter(Boolean));
    check(`ninguna opción de Elara se resuelve con una tirada${conTirada.length ? ` (${conTirada.join(", ")})` : ""}`,
      conTirada.length === 0);
  }
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
          // ⚠️ Lleva premio Y misión Y tienda a la vez a propósito: son tres
          // consecuencias distintas, y cada una necesita su propia
          // comprobación de que NO sale al fallar. Con solo el premio, romper
          // la de la misión dejaba el gate verde — lo destapó la mutación.
          texto: "tirada", chequeo: { pericia: "Persuasión", cd: 12 },
          exito: "acierta y te da la cosa", fallo: "falla y no te da nada",
          premio: { tipo: "objeto", name: "Cosa" },
          // Slug del catálogo desde que la misión se ata por referencia. Este
          // árbol es de mentira y no pasa por la comprobación del puente, así
          // que aquí vale cualquier slug con forma de slug.
          mision: "encargo-de-prueba",
          abreTienda: true,
          siguiente: "b",
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
// Las TRES consecuencias, cada una comprobada por separado en las dos
// direcciones. Son tres campos distintos del mismo objeto y romper uno solo no
// mueve a los otros dos.
check("acertando, entrega el premio", !!gana.premio);
check("fallando, NO entrega el premio", !pierde.premio);
check("acertando, concede la misión", !!gana.mision);
check("fallando, NO concede la misión", !pierde.mision);
check("acertando, abre la tienda", gana.abreTienda === true);
check("fallando, NO abre la tienda", !pierde.abreTienda);
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

/* ------------- EL PUENTE CON EL CATÁLOGO DE MISIONES -------------------- */
// ⚠️ **Un `mision` es un SLUG de `data/misiones/`, no texto suelto.** Si apunta
// a un slug que no existe, `/api/mision-dialogo` devuelve 404 y el jugador
// acepta un encargo que no se abre nunca — y el PNJ le habrá dicho que sí. Es
// un fallo mudo perfecto: la conversación se lee bien y no pasa nada.
{
  const slugs = new Set(MISIONES.map((m) => m.slug));
  let conMision = 0;
  for (const [clave, arbol] of Object.entries(DIALOGOS)) {
    for (const [nombreEtapa, etapa] of Object.entries(arbol.etapas)) {
      etapa.opciones.forEach((o, i) => {
        if (!o.mision) return;
        conMision++;
        check(`"${clave}/${nombreEtapa}" opción ${i}: la misión "${o.mision}" existe en el catálogo`,
          slugs.has(o.mision));
      });
    }
  }
  // Y la regla de oro del módulo: la misión NO sale al fallar. Ya se comprueba
  // para el premio; esto es lo mismo y se olvidaría igual.
  for (const [clave, arbol] of Object.entries(DIALOGOS)) {
    for (const [nombreEtapa, etapa] of Object.entries(arbol.etapas)) {
      etapa.opciones.forEach((o, i) => {
        if (!o.mision || !o.chequeo) return;
        const t = { confianza: CONFIANZA_INICIAL, etapa: nombreEtapa, fallidas: {} };
        const fallo = resolver(arbol, t, i, o.chequeo.cd - 1);
        check(`"${clave}/${nombreEtapa}" opción ${i}: al FALLAR no se abre la misión`,
          fallo?.mision === undefined);
      });
    }
  }
  console.log(`\nOpciones que abren misión: ${conMision}.`);

  // ⚠️ **TODA misión del catálogo tiene que tener quien la dé.** Una escrita y
  // sin PNJ que la ofrezca es contenido muerto: está en el repo, pasa su gate,
  // y en la mesa no aparece nunca porque no hay forma de llegar a ella. Es
  // exactamente el fallo del corazón del bosque —diez entradas y ningún
  // statblock— repetido con otra ropa.
  const ofrecidas = new Set<string>();
  for (const arbol of Object.values(DIALOGOS)) {
    for (const etapa of Object.values(arbol.etapas)) {
      for (const o of etapa.opciones) if (o.mision) ofrecidas.add(o.mision);
    }
  }
  const huerfanas = MISIONES.filter((m) => !ofrecidas.has(m.slug)).map((m) => m.slug);
  check(`toda misión del catálogo la ofrece alguien${huerfanas.length ? ` (sin dueño: ${huerfanas.join(", ")})` : ""}`,
    huerfanas.length === 0);

  // Y las claves de las plantillas: sembrar mete `dialogo` en la fila, así que
  // una clave que no exista deja al PNJ sin su conversación escrita y sin sus
  // misiones, hablando solo por IA. No da ningún error.
  const claves = new Set(Object.keys(DIALOGOS));
  for (const [sitio, gente] of Object.entries(NPC_TEMPLATES)) {
    for (const t of gente) {
      if (!t.dialogo) continue;
      check(`la plantilla "${t.name}" (${sitio}) apunta a un árbol real ("${t.dialogo}")`,
        claves.has(t.dialogo));
    }
  }
}

const nOpts = Object.values(DIALOGOS).reduce((n, a) => n + Object.values(a.etapas).reduce((m, e) => m + e.opciones.length, 0), 0);
const nEtapas = Object.values(DIALOGOS).reduce((n, a) => n + Object.keys(a.etapas).length, 0);
console.log(`\nDiálogos: ${CLAVES_DIALOGO.length} PNJ, ${nEtapas} etapas, ${nOpts} opciones.`);
console.log(failures === 0 ? "Todas las comprobaciones pasaron." : `${failures} fallaron.`);
process.exit(failures === 0 ? 0 : 1);
