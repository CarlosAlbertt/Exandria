// Gate: la lectura del resultado de dice-box y el descarte del menor.
//
// Existe por un fallo que estuvo vivo mucho tiempo sin que nada lo viera:
// dice-box 1.1.4 resuelve `roll()` con un array PLANO de dados, no con grupos,
// así que leer `res[0].rolls` lanzaba un TypeError, rollVisual devolvía null y
// TODA tirada de la app caía al fallback aleatorio — los dados de la mesa eran
// decoración. Nada podía detectarlo porque la lectura no era comprobable.
import { facesFrom } from "../lib/diceBox";
import { droppedIndexes, keepHighestFromDice } from "../lib/dice";

let fallos = 0;
function comprueba(que: string, real: unknown, esperado: unknown) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) {
    fallos++;
    console.error(`  ✗ ${que}\n      esperado ${JSON.stringify(esperado)}\n      salió    ${JSON.stringify(real)}`);
  }
}

// --- facesFrom: las dos formas que puede devolver dice-box ------------------
// La de verdad hoy: dados sueltos, uno por tirada.
comprueba(
  "dados sueltos (dice-box 1.1.4)",
  facesFrom([
    { groupId: 0, rollId: 0, sides: 6, value: 6 },
    { groupId: 0, rollId: 1, sides: 6, value: 5 },
    { groupId: 0, rollId: 2, sides: 6, value: 4 },
    { groupId: 0, rollId: 3, sides: 6, value: 2 },
  ]),
  [6, 5, 4, 2],
);
// La que se suponía: grupos con `rolls` dentro. Si una versión futura vuelve a
// esta forma, tiene que seguir leyéndose.
comprueba(
  "grupos con rolls dentro",
  facesFrom([{ value: 17, qty: 4, rolls: [{ value: 6 }, { value: 5 }, { value: 4 }, { value: 2 }] }]),
  [6, 5, 4, 2],
);
comprueba("varios grupos", facesFrom([{ rolls: [{ value: 3 }] }, { rolls: [{ value: 8 }] }]), [3, 8]);

// Basura: nunca debe inventarse una cara. Devolver [] hace que rollVisual
// tire del fallback en vez de guardar un total a medias.
comprueba("null", facesFrom(null), []);
comprueba("objeto suelto", facesFrom({ value: 4 }), []);
comprueba("array vacío", facesFrom([]), []);
comprueba("dados sin value", facesFrom([{ sides: 6 }, { value: 5 }]), [5]);
comprueba("value no numérico", facesFrom([{ value: "6" }]), []);

// --- 4d6 descartando el menor ----------------------------------------------
comprueba("descarta el menor", droppedIndexes([6, 5, 4, 2], 3), [3]);
// El empate se rompe por posición: con dos cuatros se cae el 1, no un cuatro.
comprueba("empate arriba", droppedIndexes([4, 4, 3, 1], 3), [3]);
comprueba("todo iguales", droppedIndexes([3, 3, 3, 3], 3), [3]);
comprueba("el menor en medio", droppedIndexes([2, 6, 1, 5], 3), [2]);
comprueba("nada que descartar", droppedIndexes([3, 3, 3], 3), []);

comprueba("total de los tres mejores", keepHighestFromDice("4d6", [6, 5, 4, 2], 3, 0).total, 15);
comprueba("mínimo posible", keepHighestFromDice("4d6", [1, 1, 1, 1], 3, 0).total, 3);
comprueba("máximo posible", keepHighestFromDice("4d6", [6, 6, 6, 6], 3, 0).total, 18);
// `rolls` guarda las CUATRO caras: el dado descartado también se vio rodar.
comprueba("rolls conserva los cuatro", keepHighestFromDice("4d6", [6, 5, 4, 2], 3, 0).rolls, [6, 5, 4, 2]);
comprueba("sin descarte suma todo", keepHighestFromDice("4d6", [6, 5, 4, 2], 4, 0).total, 17);

if (fallos > 0) {
  console.error(`\ncheck-dados: ${fallos} fallo(s)`);
  process.exit(1);
}
console.log("check-dados: ok");
