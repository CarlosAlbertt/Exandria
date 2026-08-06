// Comprobación manual de los catálogos de tienda (data/shopTemplates.ts) y del
// tipo de tienda libre. Uso: npx tsx scripts/check-tiendas.ts
//
// Ojo con el nombre: `check-forja.ts` es OTRO gate (el catálogo de 75 materiales
// de forja) y no tiene nada que ver con esto.
import {
  SHOP_TEMPLATES, SHOP_KINDS, SHOP_ICON_FALLBACK,
  kindLabel, kindIcon, normalizaKind,
} from "../data/shopTemplates";

let failures = 0;
function check(label: string, condition: boolean) {
  if (condition) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// --- Forma de cada plantilla ------------------------------------------------
for (const k of SHOP_KINDS) {
  const d = SHOP_TEMPLATES[k];
  check(`${k}: tiene etiqueta`, typeof d.label === "string" && d.label.trim().length > 0);
  check(`${k}: tiene icono`, typeof d.icon === "string" && d.icon.startsWith("fa-"));
  check(`${k}: la clave no lleva mayúsculas ni espacios`, k === k.trim().toLowerCase());

  // Un catálogo de dos objetos no merece un botón «Semilla»: si el tipo existe
  // como sugerencia, tiene que traer algo con lo que empezar a jugar.
  check(`${k}: al menos 5 objetos`, d.items.length >= 5);

  // Sin plata ni cobre (`shop_items.price` es `int` en po), un objeto por
  // debajo de 1 po solo puede escribirse como 0 — y 0 es GRATIS en
  // `shopTx.comprar`, que compara `char.gold < item.price`. Por eso los
  // catálogos baratos se venden por lote.
  check(`${k}: todos los precios son enteros >= 1 po`,
    d.items.every((i) => Number.isInteger(i.price) && i.price >= 1));

  check(`${k}: ningún objeto con el nombre vacío`,
    d.items.every((i) => i.name.trim().length > 0));

  // Dentro de un mismo catálogo, dos filas iguales son un descuido: la semilla
  // las insertaría las dos. Entre catálogos distintos SÍ se puede repetir a
  // propósito (el incienso está en alquimista y en templo) — los objetos de
  // tienda son texto con precio, no se referencian por clave como los
  // materiales de oficio, así que no hay ambigüedad que resolver.
  check(`${k}: sin nombres repetidos dentro del catálogo`,
    new Set(d.items.map((i) => i.name)).size === d.items.length);
}

// --- Las tres claves que ya están guardadas en la base de datos -------------
// ESCRITAS A MANO, no derivadas de SHOP_TEMPLATES: si se sacaran del propio
// catálogo, los dos lados se moverían juntos y el check sería verde por
// construcción (la lección del gate 33). Son las que crearon las tiendas
// existentes; borrar una las dejaría sin plantilla ni icono.
for (const k of ["herreria", "alquimista", "general"]) {
  check(`la clave original ${k} sigue existiendo`, SHOP_KINDS.includes(k));
}

// --- Etiquetas únicas -------------------------------------------------------
// Si dos tipos compartieran etiqueta, `normalizaKind` tendría que elegir uno y
// el otro sería inalcanzable desde el desplegable de sugerencias. Se compara
// sin tildes ni mayúsculas porque así es como compara la función.
const plano = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
check("ninguna etiqueta repetida entre dos tipos (ignorando tildes)",
  new Set(SHOP_KINDS.map((k) => plano(kindLabel(k)))).size === SHOP_KINDS.length);
check("ninguna etiqueta choca con la clave de OTRO tipo",
  SHOP_KINDS.every((k) => {
    const otra = SHOP_KINDS.find((o) => o !== k && plano(o) === plano(kindLabel(k)));
    return otra === undefined;
  }));

// --- El tipo libre: `normalizaKind` -----------------------------------------
// Esto es lógica nueva que no mira nadie más, y es donde este gate se gana el
// sueldo. El caso que la motiva: el `<datalist>` escribe en el input LA
// ETIQUETA, no la clave.
check('normalizaKind("Herrería") = "herreria" (el caso del desplegable)',
  normalizaKind("Herrería") === "herreria");
check('normalizaKind("HERRERIA") = "herreria" (mayúsculas)',
  normalizaKind("HERRERIA") === "herreria");
check('normalizaKind("  herreria  ") = "herreria" (espacios)',
  normalizaKind("  herreria  ") === "herreria");
check('normalizaKind("Bazar general") = "general" (etiqueta de dos palabras)',
  normalizaKind("Bazar general") === "general");

// Y lo contrario: un tipo inventado tiene que pasar INTACTO, o el tipo libre no
// sería libre.
check('normalizaKind("Pescadería") pasa intacto',
  normalizaKind("Pescadería") === "Pescadería");
check('normalizaKind("  Pescadería  ") solo recorta',
  normalizaKind("  Pescadería  ") === "Pescadería");
check('normalizaKind("") cae en "general", no en cadena vacía',
  normalizaKind("") === "general" && normalizaKind("   ") === "general");

// Ida y vuelta sobre los doce. Sin esto, elegir una sugerencia podría dejar de
// caer en su clave y la tienda saldría sin plantilla ni icono — un fallo que en
// la app se ve como «le falta el icono» y que nadie relaciona con una tilde.
check("ida y vuelta: normalizaKind(kindLabel(k)) === k para los doce",
  SHOP_KINDS.every((k) => normalizaKind(kindLabel(k)) === k));
check("ida y vuelta también desde la clave: normalizaKind(k) === k",
  SHOP_KINDS.every((k) => normalizaKind(k) === k));

// --- Los fallbacks son el camino normal, no una red de seguridad ------------
// Son lo que se ejecuta con CUALQUIER tipo que el DM se invente, y lo que se
// pinta en /lugar. Devolver `undefined` ahí sería un hueco en la pantalla.
check("kindLabel de un tipo inventado devuelve el texto",
  kindLabel("Pescadería") === "Pescadería");
check("kindIcon de un tipo inventado devuelve el icono genérico",
  kindIcon("Pescadería") === SHOP_ICON_FALLBACK);
check("el icono genérico es un icono de verdad",
  SHOP_ICON_FALLBACK.startsWith("fa-"));
check("kindLabel y kindIcon nunca devuelven vacío ni undefined",
  ["Pescadería", "", "general", "loquesea"].every(
    (k) => typeof kindLabel(k) === "string" && typeof kindIcon(k) === "string" && kindIcon(k).length > 0));

console.log(failures === 0 ? `\nTodo OK` : `\n${failures} FALLOS`);
process.exit(failures === 0 ? 0 : 1);
