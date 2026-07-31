// Capa pura del inventario: sin React, sin Supabase, sin estado.
// Verificada por scripts/check-inventario.ts.

import { CATALOG } from "@/data/equipment";
import { ARMAS } from "@/data/weapons";
import { ARMOR_LOOKUP, SHIELD_NAME } from "@/lib/derive";
import { ACCESSORY_SLOTS, FIXED_ACCESSORY } from "@/data/leveling";
import { esMaterial } from "@/lib/materiales";
import { norm } from "@/lib/slug";
import type { Item } from "@/lib/character";

export type CategoriaId = "Armas" | "Armaduras" | "Aventura" | "Consumibles" | "Herramientas" | "Otro";

export type Categoria = {
  id: CategoriaId;
  icon: string;   // Font Awesome, con el prefijo "fa-"
  color: string;  // var() del tema: si no está definida en globals.css NO se ve, y sin error
};

/**
 * Icono y color de cada categoría. Es un `Record` sobre `CategoriaId` **a
 * propósito**: así, si algún día se añade una categoría al tipo y se olvida
 * aquí, **no compila**. Con un array suelto el olvido habría sido mudo, y
 * `CATEGORIAS.find(...)` habría devuelto `undefined` en tiempo de ejecución.
 */
const META: Record<CategoriaId, Omit<Categoria, "id">> = {
  Armas:        { icon: "fa-khanda",              color: "var(--color-ember)" },
  Armaduras:    { icon: "fa-shield-halved",       color: "var(--color-arcane)" },
  Aventura:     { icon: "fa-hiking",              color: "var(--color-bronze)" },
  Consumibles:  { icon: "fa-flask",               color: "var(--color-verdant)" },
  Herramientas: { icon: "fa-screwdriver-wrench",  color: "var(--color-violet)" },
  Otro:         { icon: "fa-cube",                color: "var(--color-dim)" },
};

/** El orden manda: es el de los grupos en la bolsa. «Otro» siempre al final. */
const ORDEN: CategoriaId[] = ["Armas", "Armaduras", "Aventura", "Consumibles", "Herramientas", "Otro"];

export const CATEGORIAS: Categoria[] = ORDEN.map((id) => ({ id, ...META[id] }));

/** Icono y color de una categoría. Nunca es `undefined`: el `Record` lo garantiza. */
export function metaDe(cat: CategoriaId): Categoria {
  return { id: cat, ...META[cat] };
}

/**
 * Normaliza para comparar: sin mayúsculas, sin tildes, sin espacios de sobra.
 *
 * **Se mudó a `lib/slug.ts`** (módulo neutral) cuando `lib/materiales.ts` pasó a
 * necesitarla: los dos índices se importan mutuamente —la bolsa pregunta si un
 * objeto es material, el índice de materiales normaliza igual que la bolsa— y
 * tenerla aquí creaba un ciclo de módulos. Se reexporta para que nadie que ya la
 * importaba de aquí tenga que cambiar.
 *
 * Sigue siendo compartida **para que las comprobaciones normalicen igual que el
 * índice**: un check que compare los nombres de otra forma tiene un punto ciego
 * justo donde el índice es más permisivo (las tildes), y entonces no vigila lo
 * que dice vigilar.
 */
export { norm };

// Índice nombre normalizado → categoría, armado una vez a partir de las listas
// que ya existen. Ninguna se duplica aquí: si el catálogo crece, esto crece solo.
const INDICE: Map<string, CategoriaId> = (() => {
  const m = new Map<string, CategoriaId>();
  for (const n of Object.keys(ARMAS)) m.set(norm(n), "Armas");
  for (const n of Object.keys(ARMOR_LOOKUP)) m.set(norm(n), "Armaduras");
  m.set(norm(SHIELD_NAME), "Armaduras");
  for (const n of CATALOG.Armas) m.set(norm(n), "Armas");
  for (const n of CATALOG.Armaduras) m.set(norm(n), "Armaduras");
  for (const n of CATALOG.Aventura) m.set(norm(n), "Aventura");
  for (const n of CATALOG.Consumibles) m.set(norm(n), "Consumibles");
  for (const n of CATALOG.Herramientas) m.set(norm(n), "Herramientas");
  return m;
})();

/**
 * Categoría de un objeto, deducida del nombre por coincidencia EXACTA (salvo
 * mayúsculas, tildes y espacios). No se adivina por trozos del nombre a
 * propósito: "Poción de curación mayor" sale como Otro antes que arriesgarse a
 * pintar de verde una "Poción de veneno". Quedarse corto es preferible.
 */
export function categoriaDe(nombre: string): CategoriaId {
  return INDICE.get(norm(nombre)) ?? "Otro";
}

/** Huecos de la bolsa: 20 + 2 × mod. Fuerza, con un suelo de 10. */
export function huecosDe(modFuerza: number): number {
  return Math.max(10, 20 + 2 * Math.round(modFuerza));
}

/**
 * Huecos que ocupa lo que llevas encima. **Los materiales de oficio son la
 * excepción**: un montón ocupa **un solo hueco** lleve 1 unidad o 50; todo lo
 * demás cuenta por unidad, exactamente como siempre.
 *
 * La excepción existe porque los dos sistemas miden cosas distintas. La bolsa
 * cuenta bultos: dos espadas estorban el doble que una. Los materiales se
 * recolectan a puñados —una receta pide tres raíces— y contarlos por unidad
 * dejaría sin bolsa a cualquiera que junte para una poción: con 20 + 2×FUE
 * huecos, doce hierbas se comen más de media mochila. Ocupar sitio sí ocupan:
 * llevar treinta materiales **distintos** llena la bolsa igual.
 *
 * Vive aquí, en una sola función, porque antes era un `reduce` **duplicado** en
 * `app/inventario/page.tsx` y en `components/CharacterSheet.tsx`. Dos copias de
 * la regla de capacidad son dos sitios donde puede divergir, y el gate no veía
 * ninguna de las dos.
 */
export function huecosUsados(items: Item[]): number {
  return items.reduce((s, i) => s + (esMaterial(i.name) ? 1 : i.qty), 0);
}

/**
 * A qué hueco va un objeto al pulsar «Equipar». `null` = la app no lo sabe y
 * hay que preguntárselo al jugador.
 *
 * Devuelve `null` para casi toda la armadura por una razón del juego, no por
 * pereza: el muñeco tiene huecos de cabeza, antebrazos, manos y pies, y en
 * D&D 2024 esas piezas NO dan CA, así que el catálogo no las trae.
 */
export function huecoDestino(nombre: string, equipo: Record<string, Item>): string | null {
  if (norm(nombre) === norm(SHIELD_NAME)) return equipo.arma_secundaria ? null : "arma_secundaria";
  const cat = categoriaDe(nombre);
  if (cat === "Armas") {
    if (!equipo.arma_principal) return "arma_principal";
    if (!equipo.arma_secundaria) return "arma_secundaria";
    return null;
  }
  if (cat === "Armaduras") return equipo.torso ? null : "torso";
  return null;
}

/**
 * Quita UNA unidad del objeto con ese `id`. Si era la última, la entrada
 * desaparece de la bolsa; si no, baja `qty` en uno.
 *
 * Un `id` que no está en la bolsa devuelve la lista tal cual (sin lanzar): es
 * lo que pasa cuando dos pestañas sueltan el mismo objeto a la vez.
 */
export function quitarUno(items: Item[], id: string): Item[] {
  const out: Item[] = [];
  for (const it of items) {
    if (it.id === id) {
      if (it.qty > 1) out.push({ ...it, qty: it.qty - 1 });
    } else out.push(it);
  }
  return out;
}

/**
 * Devuelve UNA unidad a la bolsa: al retirar algo del muñeco, o al desplazar a
 * quien ocupaba el hueco donde acabas de equipar.
 *
 * Busca por **NOMBRE, no por id**, y eso es a propósito y carga con peso: es
 * justo lo que hace que dos dagas sean una sola entrada `{ name: "Daga", qty: 2 }`
 * en vez de dos filas. Media app cuenta con ello — `puedeDosArmas`
 * (lib/ataque.ts) suma cantidades precisamente porque la bolsa fusiona por
 * nombre. Si esto pasara a comparar por id, cada unidad equipada y retirada
 * volvería como fila suelta y esa regla dejaría de dispararse.
 *
 * La entrada nueva estrena `id`: el del objeto que vuelve puede seguir vivo en
 * otro hueco del equipo.
 */
export function devolver(items: Item[], item: Item): Item[] {
  const idx = items.findIndex((i) => i.name === item.name);
  if (idx >= 0) {
    const next = [...items];
    next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
    return next;
  }
  return [...items, { id: crypto.randomUUID(), name: item.name, qty: 1, notes: item.notes }];
}

export type TipoHueco = "arma" | "armadura" | "accesorio";

/**
 * Qué CLASES de hueco admite un objeto al equiparlo a mano. La enumeración de
 * huecos concretos la hace quien pinta; la regla vive aquí, donde el gate la ve.
 *
 * La línea que se traza: **un hueco que alimenta una regla solo acepta lo que la
 * app puede verificar.**
 *
 * - Los huecos de **arma** alimentan `ataqueDe`, que produce impacto y daño. Si
 *   ahí cabe cualquier cosa, la app acaba enseñando una tirada de ataque para un
 *   anillo — afirmando algo falso, que es peor que quedarse corta. Así que solo
 *   admiten armas del catálogo (`ARMAS`), que es una lista cerrada y comprobable.
 * - Los huecos de **armadura** solo admiten armaduras del catálogo, que es la
 *   lista que `ARMOR_LOOKUP` sabe convertir en CA.
 * - Los **accesorios** no alimentan ninguna regla, así que son el destino de
 *   todo lo que la app no reconoce: un anillo, un colgante, el trofeo raro que
 *   te dio el DM.
 *
 * Cada objeto va a **un solo tipo de hueco**. Nada de ofrecer todos los sitios
 * «por si acaso»: un anillo en la cabeza no es una opción que nadie quiera.
 *
 * Dos consecuencias asumidas, dichas aquí para que no sorprendan:
 * 1. Una «Espada de Kael» inventada **no** entra en el hueco de arma. Correcto:
 *    la app tampoco sabría calcular su ataque. Para que un arma funcione, tiene
 *    que llamarse como una del catálogo.
 * 2. Un «Yelmo» escrito a mano va a un accesorio, no a la cabeza. Los huecos de
 *    cabeza, antebrazos, manos y pies **no tienen nada en el catálogo** que los
 *    llene, porque en D&D 2024 esas piezas no dan CA. Si algún día se quieren
 *    usar de verdad, lo que hace falta es ampliar el catálogo, no relajar esto.
 */
export function tiposDeHuecoPara(nombre: string): TipoHueco[] {
  const cat = categoriaDe(nombre);
  if (cat === "Armas") return ["arma"];
  if (cat === "Armaduras") return norm(nombre) === norm(SHIELD_NAME) ? ["arma"] : ["armadura"];
  return ["accesorio"];
}

/** Los tipos de accesorio que existen, sacados de donde ya viven. */
const TIPOS_ACCESORIO: string[] = [FIXED_ACCESSORY.type, ...ACCESSORY_SLOTS.map((a) => a.type)];

/**
 * Qué clase de accesorio es un objeto, por la **primera palabra de su nombre**:
 * «Anillo de protección» → `anillo`. `null` si no se reconoce.
 *
 * Aquí sí se mira el nombre por partes, y no contradice la regla de
 * `categoriaDe` (que exige coincidencia exacta). La diferencia está en lo que se
 * arriesga: equivocar una categoría pinta de verde una «Poción de veneno» y
 * miente sobre lo que es; equivocar esto solo ofrece el dedo en vez del cuello,
 * y el jugador lo ve y elige otro. Además los huecos se llaman **igual** que los
 * objetos —anillo, colgante, amuleto, collar—, así que la primera palabra es la
 * señal, no una corazonada.
 *
 * Solo la primera palabra y solo en singular, a propósito: «Anillos» o «Sortija»
 * devuelven `null` y se ofrecen todos los accesorios. Quedarse corto y preguntar
 * es preferible a colar un objeto en el hueco equivocado.
 */
export function tipoAccesorioDe(nombre: string): string | null {
  const primera = norm(nombre).split(/\s+/)[0] ?? "";
  return TIPOS_ACCESORIO.find((t) => norm(t) === primera) ?? null;
}

/**
 * ¿Este hueco de accesorio le vale a este objeto? Los ids que genera el muñeco
 * son `collar`, `anillo_1`, `anillo_2`, `colgante_1`… así que el tipo es el id
 * entero o lo que va antes del `_`.
 */
export function accesorioAdmite(slotId: string, nombre: string): boolean {
  const tipo = tipoAccesorioDe(nombre);
  if (!tipo) return true; // no se reconoce: que elija el jugador entre todos
  return slotId === tipo || slotId.startsWith(`${tipo}_`);
}

export type Grupo = { cat: CategoriaId; items: Item[] };

/** Agrupa la bolsa por categoría, en el orden de CATEGORIAS y sin grupos vacíos. */
export function agrupaPorCategoria(items: Item[]): Grupo[] {
  return CATEGORIAS
    .map((c) => ({ cat: c.id, items: items.filter((i) => categoriaDe(i.name) === c.id) }))
    .filter((g) => g.items.length > 0);
}
