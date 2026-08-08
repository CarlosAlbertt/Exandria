// Comprobación de a quién le pasa el tiempo al descansar.
// Uso: npx tsx scripts/check-descanso.ts
//
// ⚠️ No confundir con `check-clock` (el reloj de campaña y el calendario) ni con
// `check-viaje` (dónde está cada jugador). Este vigila lo que pasa **cuando uno
// descansa y los demás no**.
//
// Nació porque al sacar la regla de dentro de `/api/descanso` —donde ningún gate
// llegaba— aparecieron DOS fallos que ya estaban en producción. Los dos están
// abajo, cada uno con su comprobación.
import { planDescanso, puedeDescansarLargo, MINUTOS_DESCANSO, MIN_ENTRE_LARGOS } from "../lib/tiempoDescanso";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const AHORA = 100000;

/* ------------------- CON EL GRUPO: MUEVE EL RELOJ DE TODOS ------------------ */
// El caso normal, y tiene que seguir haciendo lo de siempre: el grupo descansa
// junto y a todos les pasan ocho horas.
const conGrupo = planDescanso({ kind: "largo", conElGrupo: true, desfase: 0, ahoraCompartido: AHORA, ultimoAvanceGrupo: null });
check("con el grupo, el largo mueve el reloj compartido", conGrupo.avanceCompartido === MINUTOS_DESCANSO.largo);
check("y son 8 h", MINUTOS_DESCANSO.largo === 480);
check("con el grupo no se genera desfase", conGrupo.desfase === 0);
const cortoGrupo = planDescanso({ kind: "corto", conElGrupo: true, desfase: 0, ahoraCompartido: AHORA, ultimoAvanceGrupo: null });
check("con el grupo, el corto mueve el reloj compartido", cortoGrupo.avanceCompartido === MINUTOS_DESCANSO.corto);
check("y es 1 h", MINUTOS_DESCANSO.corto === 60);

/* ------------------ ⚠️ FALLO 1: EL RELOJ SE SUMABA POR CADA UNO ------------- */
// Cinco jugadores descansando largo juntos son CINCO llamadas al endpoint, y cada
// una hacía `epochGameMin = ahora + 480`: el grupo se comía CUARENTA HORAS por una
// noche. Estaba en producción y no lo veía nadie, porque el reloj corre solo y
// nadie lo mira dos veces.
let compartido = AHORA;
let ultimoAvance: number | null = null;
let vueltas = 0;
for (let i = 0; i < 5; i++) {
  const p = planDescanso({ kind: "largo", conElGrupo: true, desfase: 0, ahoraCompartido: compartido, ultimoAvanceGrupo: ultimoAvance });
  if (p.avanceCompartido > 0) { compartido += p.avanceCompartido; ultimoAvance = compartido; vueltas++; }
}
check("cinco durmiendo juntos mueven el reloj UNA vez", vueltas === 1);
check("y el grupo se come 8 h, no 40", compartido - AHORA === MINUTOS_DESCANSO.largo);
// El segundo en llamar ya no lo mueve.
const segundo = planDescanso({ kind: "largo", conElGrupo: true, desfase: 0, ahoraCompartido: AHORA + 480, ultimoAvanceGrupo: AHORA + 480 });
check("el segundo que descansa no vuelve a mover el reloj", segundo.avanceCompartido === 0);
// Pero pasado el rato, sí: la noche siguiente cuenta.
const otraNoche = planDescanso({ kind: "largo", conElGrupo: true, desfase: 0, ahoraCompartido: AHORA + 480 + 1440, ultimoAvanceGrupo: AHORA + 480 });
check("a la noche siguiente el reloj vuelve a moverse", otraNoche.avanceCompartido === MINUTOS_DESCANSO.largo);
// Un avance guardado que no es un número no puede bloquear el reloj para siempre.
check("un ultimoAvance corrupto no congela el reloj",
  planDescanso({ kind: "largo", conElGrupo: true, desfase: 0, ahoraCompartido: AHORA, ultimoAvanceGrupo: Number.NaN }).avanceCompartido > 0);

/* --------- ⚠️ FALLO 2: EL QUE DESCANSA SOLO ADELANTABA A LOS DEMÁS --------- */
// Un jugador solo en Emon le adelantaba OCHO HORAS a los cuatro que seguían en
// Byroden, sin que hubieran hecho nada. Ahora mueve solo su desfase.
const solo = planDescanso({ kind: "largo", conElGrupo: false, desfase: 0, ahoraCompartido: AHORA, ultimoAvanceGrupo: null });
check("solo, NO mueve el reloj de los demás", solo.avanceCompartido === 0);
check("solo, se le suma a su desfase", solo.desfase === MINUTOS_DESCANSO.largo);
check("y su ahora propio va por delante del compartido", solo.ahoraPropioDespues === AHORA + MINUTOS_DESCANSO.largo);
// El desfase se ACUMULA sobre lo que ya llevara de camino.
const soloOtraVez = planDescanso({ kind: "corto", conElGrupo: false, desfase: 390, ahoraCompartido: AHORA, ultimoAvanceGrupo: null });
check("el desfase se acumula sobre el camino ya andado", soloOtraVez.desfase === 390 + MINUTOS_DESCANSO.corto);
check("y sigue sin tocar el reloj de nadie", soloOtraVez.avanceCompartido === 0);
// Un desfase corrupto no puede volverse negativo ni contagiar el resultado.
check("un desfase negativo se trata como cero", planDescanso({ kind: "corto", conElGrupo: false, desfase: -900, ahoraCompartido: AHORA, ultimoAvanceGrupo: null }).desfase === MINUTOS_DESCANSO.corto);
check("un desfase que no es número, igual", planDescanso({ kind: "corto", conElGrupo: false, desfase: Number.NaN, ahoraCompartido: AHORA, ultimoAvanceGrupo: null }).desfase === MINUTOS_DESCANSO.corto);
// Y nunca se mueven los dos relojes a la vez: es o lo tuyo o lo de todos.
for (const conElGrupo of [true, false]) {
  for (const kind of ["corto", "largo"] as const) {
    const p = planDescanso({ kind, conElGrupo, desfase: 120, ahoraCompartido: AHORA, ultimoAvanceGrupo: null });
    check(`${kind}/${conElGrupo ? "con el grupo" : "solo"}: no se mueven los dos relojes`, p.avanceCompartido === 0 || p.desfase === 0);
  }
}

/* --------------- EL FRENO DEL LARGO, Y AHORA ES POR FICHA ------------------- */
// Antes vivía en `app_config.last_long_rest`, del grupo: quien se iba solo a Emon
// **no podía descansar porque sus compañeros habían descansado en Byroden**, y el
// mensaje se lo decía tal cual («el grupo ya ha descansado hace poco»).
check("sin descanso previo, se puede", puedeDescansarLargo(undefined, AHORA).ok);
check("recién descansado, NO se puede", !puedeDescansarLargo(AHORA, AHORA + 60).ok);
check("y lo dice en vez de callarse", !!(puedeDescansarLargo(AHORA, AHORA + 60) as { error: string }).error);
check("el mensaje habla de TI, no del grupo",
  !/grupo/i.test((puedeDescansarLargo(AHORA, AHORA + 60) as { error: string }).error));
check("pasado el día, se puede otra vez", puedeDescansarLargo(AHORA, AHORA + MIN_ENTRE_LARGOS).ok);
check("justo un minuto antes, todavía no", !puedeDescansarLargo(AHORA, AHORA + MIN_ENTRE_LARGOS - 1).ok);
check("el freno son 20 h de juego", MIN_ENTRE_LARGOS === 1200);
// Tolerante hacia el lado bueno: un `ultimoLargo` corrupto DEJA descansar. Lo
// peor que pasa es un descanso de más; lo contrario dejaría a alguien sin poder
// descansar nunca por un jsonb a medias.
check("un ultimoLargo corrupto deja descansar", puedeDescansarLargo("ayer", AHORA).ok);
check("un ultimoLargo infinito deja descansar", puedeDescansarLargo(Number.POSITIVE_INFINITY, AHORA).ok);
check("un ultimoLargo nulo deja descansar", puedeDescansarLargo(null, AHORA).ok);

// ⚠️ EL FRENO SE MIDE EN LA HORA PROPIA, no en la compartida. Quien descansó solo
// selló su `ultimoLargo` con el desfase dentro; si luego se comparara contra el
// reloj del grupo, el freno le duraría de más — justo el castigo que esto quitaba.
const seDurmioSolo = planDescanso({ kind: "largo", conElGrupo: false, desfase: 0, ahoraCompartido: AHORA, ultimoAvanceGrupo: null });
check("el sello del que durmió solo lleva su desfase dentro", seDurmioSolo.ahoraPropioDespues > AHORA);
check("y con su hora propia el freno cae cuando toca",
  puedeDescansarLargo(seDurmioSolo.ahoraPropioDespues, seDurmioSolo.ahoraPropioDespues + MIN_ENTRE_LARGOS).ok);
check("mientras que con la del grupo le duraría de más",
  !puedeDescansarLargo(seDurmioSolo.ahoraPropioDespues, AHORA + MIN_ENTRE_LARGOS).ok);

console.log(`\nDescanso: corto ${MINUTOS_DESCANSO.corto} min, largo ${MINUTOS_DESCANSO.largo} min, freno ${MIN_ENTRE_LARGOS} min.`);
console.log(failures === 0 ? "Todas las comprobaciones pasaron." : `${failures} fallaron.`);
process.exit(failures === 0 ? 0 : 1);
