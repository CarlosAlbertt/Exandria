// Comprobación de lib/misiones.ts. Uso: npx tsx scripts/check-misiones.ts
//
// Vigila TRES cosas distintas y conviene no confundirlas:
//   · `visiblePara` — quién lee qué. Es el espejo de la RLS de schema_v24, y
//     romperlo es una FUGA: un jugador leyendo la misión secreta de otro.
//   · `opcionesDeMision` — qué opción de misión inyecta la app. Romperlo cierra
//     misiones que no tocan o deja al jugador sin poder entregar.
//   · `parseOpciones` — el recorte del bloque que emite la IA. Romperlo imprime
//     etiquetas crudas dentro del globo de diálogo del PNJ.
//
// ⚠️ Los ids de las fichas van ESCRITOS A MANO abajo, no salidos de la misma
// función que los compone. Es la lección de `check-origen` y `check-tiendas`:
// si las dos mitades de una comprobación se mueven juntas, el check es verde
// por construcción y no vigila nada.
import {
  visiblePara,
  esIndividual,
  opcionesDeMision,
  parseOpciones,
  INSTRUCCION_OPCIONES,
  type MisionMin,
} from "../lib/misiones";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

/* ------------------------------- FIXTURES ------------------------------- */
// Escritos a mano a propósito (ver el aviso de arriba).
const FICHA_MIA = "11111111-1111-1111-1111-111111111111";
const FICHA_MIA_ARCHIVADA = "22222222-2222-2222-2222-222222222222";
const FICHA_AJENA = "99999999-9999-9999-9999-999999999999";
const MIS_FICHAS = [FICHA_MIA, FICHA_MIA_ARCHIVADA];

const HERRERO = 7;
const TABERNERO = 8;

function q(p: Partial<MisionMin> & Pick<MisionMin, "id">): MisionMin {
  return {
    title: `Misión ${p.id}`,
    status: "activa",
    assigned_character_id: null,
    npc_id: null,
    ...p,
  };
}

/* ------------------------------ visiblePara ----------------------------- */

const delGrupo = q({ id: 1 });
const miaActiva = q({ id: 2, assigned_character_id: FICHA_MIA });
const ajena = q({ id: 3, assigned_character_id: FICHA_AJENA });
const miaArchivada = q({ id: 4, assigned_character_id: FICHA_MIA_ARCHIVADA });
const ocultaDelGrupo = q({ id: 5, status: "oculta" });
const ocultaMia = q({ id: 6, status: "oculta", assigned_character_id: FICHA_MIA });

const yo = { esDm: false, misFichas: MIS_FICHAS };
const dm = { esDm: true, misFichas: [] as string[] };

// LA FUGA. Si esta pasa a true, un jugador lee la misión secreta de otro.
check("la misión de OTRA ficha NO se ve", visiblePara(ajena, yo) === false);

// El comportamiento de antes de la v24: sin asignar sigue siendo del grupo.
check("la misión sin asignar SÍ se ve", visiblePara(delGrupo, yo) === true);
check("mi misión asignada SÍ se ve", visiblePara(miaActiva, yo) === true);

// Archivar un personaje no puede hacer desaparecer su misión.
check("la misión de mi ficha ARCHIVADA sí se ve", visiblePara(miaArchivada, yo) === true);

// `oculta` es el borrador del DM: ni siquiera a su asignado.
check("una 'oculta' del grupo NO se ve", visiblePara(ocultaDelGrupo, yo) === false);
check("una 'oculta' MÍA tampoco se ve", visiblePara(ocultaMia, yo) === false);

// El DM lo ve todo, incluidas las ocultas y las de otros.
check("el DM ve la misión ajena", visiblePara(ajena, dm) === true);
check("el DM ve la oculta", visiblePara(ocultaDelGrupo, dm) === true);
check("el DM ve la oculta ajena", visiblePara(q({ id: 7, status: "oculta", assigned_character_id: FICHA_AJENA }), dm) === true);

// Sin fichas (jugador recién llegado): ve las del grupo y ninguna asignada.
const sinFichas = { esDm: false, misFichas: [] as string[] };
check("sin fichas ve las del grupo", visiblePara(delGrupo, sinFichas) === true);
check("sin fichas NO ve ninguna asignada", visiblePara(miaActiva, sinFichas) === false);

// esIndividual
check("esIndividual: asignada = true", esIndividual(miaActiva) === true);
check("esIndividual: del grupo = false", esIndividual(delGrupo) === false);

/* --------------------------- opcionesDeMision --------------------------- */

const ofertaHerrero = q({ id: 10, status: "oferta", npc_id: HERRERO });
const activaMiaHerrero = q({ id: 11, status: "activa", npc_id: HERRERO, assigned_character_id: FICHA_MIA });
const activaAjenaHerrero = q({ id: 12, status: "activa", npc_id: HERRERO, assigned_character_id: FICHA_AJENA });
const activaMiaTabernero = q({ id: 13, status: "activa", npc_id: TABERNERO, assigned_character_id: FICHA_MIA });
const completadaMiaHerrero = q({ id: 14, status: "completada", npc_id: HERRERO, assigned_character_id: FICHA_MIA });
const ofertaSinNpc = q({ id: 15, status: "oferta", npc_id: null });

const opc = (qs: MisionMin[], npc: number, ficha: string | null) => opcionesDeMision(qs, npc, ficha);

// Ofrecer una oferta suya.
const soloOferta = opc([ofertaHerrero], HERRERO, FICHA_MIA);
check("ofrece aceptar la oferta del PNJ", soloOferta.length === 1 && soloOferta[0].accion === "aceptar");
check("la opción de aceptar lleva el questId", soloOferta[0]?.accion === "aceptar" && soloOferta[0].questId === 10);

// Ofrecer entregar la que ya tengo suya.
const soloEntrega = opc([activaMiaHerrero], HERRERO, FICHA_MIA);
check("ofrece entregar mi misión de ese PNJ", soloEntrega.length === 1 && soloEntrega[0].accion === "entregar");
check("la opción de entregar lleva el questId", soloEntrega[0]?.accion === "entregar" && soloEntrega[0].questId === 11);

// NUNCA las dos: aceptar y darlo por hecho en el mismo turno.
const ambas = opc([ofertaHerrero, activaMiaHerrero], HERRERO, FICHA_MIA);
check("nunca ofrece aceptar y entregar a la vez", ambas.length === 1);
check("con las dos disponibles, entregar va primero", ambas[0]?.accion === "entregar");

// El PNJ equivocado. Entregarle al tabernero el encargo del herrero.
check("no ofrece entregar la misión de OTRO PNJ",
  opc([activaMiaHerrero], TABERNERO, FICHA_MIA).length === 0);
check("no ofrece aceptar la oferta de OTRO PNJ",
  opc([ofertaHerrero], TABERNERO, FICHA_MIA).length === 0);
check("el tabernero sí ofrece la suya",
  opc([activaMiaHerrero, activaMiaTabernero], TABERNERO, FICHA_MIA)[0]?.accion === "entregar");

// La ficha equivocada. Entregar lo que le encargaron a otro.
check("no ofrece entregar la misión de OTRA ficha",
  opc([activaAjenaHerrero], HERRERO, FICHA_MIA).length === 0);

// El estado equivocado.
check("no ofrece entregar una 'oferta' sin aceptar",
  opc([q({ id: 16, status: "oferta", npc_id: HERRERO, assigned_character_id: FICHA_MIA })], HERRERO, FICHA_MIA)
    .every((o) => o.accion !== "entregar"));
check("no ofrece entregar una ya completada",
  opc([completadaMiaHerrero], HERRERO, FICHA_MIA).length === 0);
check("no ofrece aceptar una oferta YA asignada",
  opc([q({ id: 17, status: "oferta", npc_id: HERRERO, assigned_character_id: FICHA_AJENA })], HERRERO, FICHA_MIA).length === 0);

// Sin PNJ detrás: es de tablón, no sale en ninguna conversación.
check("una oferta sin npc_id no sale en el diálogo",
  opc([ofertaSinNpc], HERRERO, FICHA_MIA).length === 0);

// Sin ficha activa (el DM, o quien dejó el asistente a medias) no hay nada.
check("sin ficha activa no hay opciones de misión",
  opc([ofertaHerrero, activaMiaHerrero], HERRERO, null).length === 0);

// Sin misiones, ninguna opción.
check("sin misiones no hay opciones", opc([], HERRERO, FICHA_MIA).length === 0);

/* ----------------------------- parseOpciones ---------------------------- */

const conBloque = `El herrero te mira de arriba abajo.

<opciones>
- Pregúntale por la espada.
- Ofrécele monedas.
- Despídete.
</opciones>`;
const r1 = parseOpciones(conBloque);
check("parseOpciones saca las 3 opciones", r1.opciones.length === 3);
check("parseOpciones quita el guion", r1.opciones[0] === "Pregúntale por la espada.");
check("parseOpciones deja el texto SIN el bloque", !r1.texto.includes("<opciones>"));
check("parseOpciones deja el texto SIN el cierre", !r1.texto.includes("</opciones>"));
check("parseOpciones conserva la respuesta", r1.texto === "El herrero te mira de arriba abajo.");

// EL BLOQUE SIN CERRAR: el modelo se quedó sin num_predict a media lista. Si
// esto falla, un "<opciones>" crudo acaba impreso en el globo del PNJ.
const sinCerrar = `El herrero gruñe.

<opciones>
- Pregúntale por la espada.
- Ofréc`;
const r2 = parseOpciones(sinCerrar);
check("bloque SIN CERRAR: el texto no lo incluye", !r2.texto.includes("<opciones>"));
check("bloque SIN CERRAR: el texto es solo la respuesta", r2.texto === "El herrero gruñe.");
check("bloque SIN CERRAR: rescata las opciones que llegaron", r2.opciones.length === 2);

// Sin bloque: la app de antes de esta tanda. Texto entero, cero opciones.
const r3 = parseOpciones("El herrero no dice nada.");
check("sin bloque: texto entero", r3.texto === "El herrero no dice nada.");
check("sin bloque: cero opciones", r3.opciones.length === 0);

// Tolerancia de formato: viñetas y numeración.
const r4 = parseOpciones("Hola.\n<opciones>\n1. Una.\n2) Dos.\n• Tres.\n* Cuatro.\n</opciones>");
check("acepta numeración y viñetas", r4.opciones.length === 4 && r4.opciones[0] === "Una." && r4.opciones[3] === "Cuatro.");

// Tope de 4: más y deja de leerse como novela visual.
const r5 = parseOpciones("Hola.\n<opciones>\n- a\n- b\n- c\n- d\n- e\n- f\n</opciones>");
check("corta a 4 opciones como mucho", r5.opciones.length === 4);

// Líneas en blanco dentro del bloque no cuentan como opción.
const r6 = parseOpciones("Hola.\n<opciones>\n\n- a\n\n- b\n\n</opciones>");
check("ignora las líneas en blanco del bloque", r6.opciones.length === 2);

// Bloque vacío: no rompe y no inventa.
const r7 = parseOpciones("Hola.\n<opciones>\n</opciones>");
check("bloque vacío = cero opciones", r7.opciones.length === 0);
check("bloque vacío conserva el texto", r7.texto === "Hola.");

/* ------------------------- LA INSTRUCCIÓN Y EL PARSER ------------------- */
// Las dos mitades del contrato con la IA: lo que se le pide y lo que se lee.
// Si divergen, el modelo emite un bloque que el parser no reconoce y las
// opciones desaparecen sin que salte nada.
check("la instrucción menciona la etiqueta de apertura", INSTRUCCION_OPCIONES.includes("<opciones>"));
check("la instrucción menciona la etiqueta de cierre", INSTRUCCION_OPCIONES.includes("</opciones>"));
check("la instrucción pide el mismo tope de 4", INSTRUCCION_OPCIONES.includes("4"));

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} fallaron.`);
process.exit(failures === 0 ? 0 : 1);
