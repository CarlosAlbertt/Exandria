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
import { MISIONES } from "../data/misiones";
import { ALL_MONSTERS } from "../data/bestiary";
import { CR_XP, XP_BUDGET } from "../data/encounters";
import { franjaDeNodo } from "../data/bosque";
import { seedAtlas } from "../data/atlas";

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

/* ===================== EL CATÁLOGO DE MISIONES PREPARADAS ================ */
// Va en este script y no en uno nuevo por lo mismo que las figuras fueron a
// `check-lore`: la pregunta es «las misiones están bien», que es la que este
// script ya responde. Dos scripts para un tema son dos fuentes de verdad.
//
// ⚠️ **LO QUE DE VERDAD MUERDE ES EL CRUCE CONTRA EL BESTIARIO.** Un guion en
// markdown puede decir «tres osgos acechadores» y nadie se entera hasta el día
// de jugar, cuando resulta que el Osgo Acechador está en `PENDIENTES` y no
// tiene statblock. Esa es la razón entera de que el catálogo sea TypeScript.
{
  const porNombre = new Map(ALL_MONSTERS.map((m) => [m.name, m]));
  const CR_NUM: Record<string, number> = { "0": 0, "1/8": 0.125, "1/4": 0.25, "1/2": 0.5 };
  const xpDe = (cr: string) => CR_XP.find((c) => c.cr === cr)?.xp ?? -1;
  void CR_NUM;

  check(`el catálogo tiene 15 misiones (tiene ${MISIONES.length})`, MISIONES.length === 15);

  const slugs = MISIONES.map((m) => m.slug);
  check("slugs únicos", new Set(slugs).size === slugs.length);
  check("títulos únicos", new Set(MISIONES.map((m) => m.titulo)).size === MISIONES.length);

  // El reparto que se pidió, escrito a mano aquí: si saliera del propio
  // catálogo, borrar las tres legendarias no rompería nada.
  const de = (t: string) => MISIONES.filter((m) => m.tamano === t).length;
  check(`5-6 misiones para uno o dos (hay ${de("solitaria") + de("pareja")})`,
    de("solitaria") + de("pareja") >= 5 && de("solitaria") + de("pareja") <= 6);
  check(`3-4 misiones para tres (hay ${de("trio")})`, de("trio") >= 3 && de("trio") <= 4);
  check(`2 misiones de grupo (hay ${de("grupo")})`, de("grupo") === 2);
  check(`2-3 legendarias (hay ${de("legendaria")})`, de("legendaria") >= 2 && de("legendaria") <= 3);

  // Los lugares: un POI del atlas o una franja del bosque. Una misión en un
  // sitio inventado no se puede poner en el mapa, y el fallo no se ve hasta que
  // alguien la busca.
  const POIS = new Set(Object.values(seedAtlas()).flatMap((c) => Object.values(c.pois).flat().map((p) => p.name)));

  for (const m of MISIONES) {
    const tag = `"${m.slug}"`;

    check(`${tag} el lugar existe (${m.lugar})`,
      m.lugar.startsWith("franja:") ? franjaDeNodo(m.lugar) !== null : POIS.has(m.lugar));

    check(`${tag} el rango de nivel va de menos a más`, m.nivel[0] <= m.nivel[1]);
    check(`${tag} tiene gancho, recompensa, fracaso y body`,
      m.gancho.trim().length >= 80 && m.recompensa.trim().length >= 40 &&
      m.siFalla.trim().length >= 40 && m.body.trim().length >= 40);
    check(`${tag} tiene al menos dos escenas`, m.escenas.length >= 2);
    check(`${tag} toda escena tiene título y texto`,
      m.escenas.every((e) => e.titulo.trim().length > 0 && e.texto.trim().length >= 80));
    check(`${tag} tiene al menos un encuentro`, m.encuentros.length >= 1);

    // El tamaño manda sobre el número de jugadores, y de ahí sale todo el
    // presupuesto. Si divergen, la misión está medida para otra mesa.
    const esperado: Record<string, (n: number) => boolean> = {
      solitaria: (n) => n === 1,
      pareja: (n) => n === 2,
      trio: (n) => n === 3,
      grupo: (n) => n >= 4,
      legendaria: (n) => n >= 4,
    };
    check(`${tag} el tamaño "${m.tamano}" cuadra con ${m.jugadores} jugador(es)`,
      esperado[m.tamano](m.jugadores));

    for (const e of m.encuentros) {
      // 1. Todo monstruo citado TIENE FICHA. No vale que esté en la tabla del
      //    bosque ni en PENDIENTES: si no hay statblock, no se puede jugar.
      const sinFicha = e.monstruos.filter((x) => !porNombre.has(x.name)).map((x) => x.name);
      check(`${tag} · "${e.nombre}": todos los monstruos tienen ficha${sinFicha.length ? ` (faltan: ${sinFicha.join(", ")})` : ""}`,
        sinFicha.length === 0);
      check(`${tag} · "${e.nombre}": ninguna cantidad a cero`, e.monstruos.every((x) => x.n >= 1));

      // 2. La XP declarada se RECALCULA. Un número escrito a ojo es un
      //    encuentro mal medido que nadie detecta hasta la mesa.
      if (sinFicha.length === 0) {
        const suma = e.monstruos.reduce((n, x) => n + xpDe(porNombre.get(x.name)!.cr) * x.n, 0);
        check(`${tag} · "${e.nombre}": la XP declarada (${e.xp}) es la suma real (${suma})`, e.xp === suma);
      }

      check(`${tag} · "${e.nombre}": explica cómo se juega`, e.nota.trim().length >= 60);
    }

    // 3. EL PRESUPUESTO, en los DOS sentidos. `XP_BUDGET` va por nivel (índice
    //    = nivel-1) y por jugador. Se mide contra el nivel MÁXIMO del rango,
    //    que es el más benévolo: si ni así cabe, no cabe.
    const alta = XP_BUDGET.alta[m.nivel[1] - 1] * m.jugadores;
    const gordo = Math.max(...m.encuentros.map((e) => e.xp));
    if (m.letal) {
      // Una legendaria que cupiera en `alta` sería una promesa incumplida: se
      // anuncia como mortal y no mata a nadie.
      check(`${tag} es legendaria y se pasa de alta (${gordo} > ${alta})`, gordo > alta);
      check(`${tag} solo las legendarias son letales`, m.tamano === "legendaria");
    } else {
      check(`${tag} ningún encuentro se pasa de alta (${gordo} <= ${alta})`, gordo <= alta);
    }
  }

  // Y al revés: toda legendaria va marcada. Una legendaria sin `letal` se
  // mediría con la vara de las normales y el aviso de arriba no la miraría.
  check("todas las legendarias van marcadas como letales",
    MISIONES.filter((m) => m.tamano === "legendaria").every((m) => m.letal === true));

  // El zigurat es la que se preparó a fondo: si alguien la recorta, que se note.
  const zig = MISIONES.find((m) => m.slug === "zigurat-de-la-linde");
  check("la misión del zigurat sigue en el catálogo", !!zig);
  check("la del zigurat conserva sus ocho escenas y tres combates",
    (zig?.escenas.length ?? 0) >= 8 && (zig?.encuentros.length ?? 0) === 3);

  const total = MISIONES.reduce((n, m) => n + m.encuentros.length, 0);
  console.log(`\nCatálogo: ${MISIONES.length} misiones, ${total} encuentros escritos.`);
}

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} fallaron.`);
process.exit(failures === 0 ? 0 : 1);
