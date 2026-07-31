// El libro de recetas: qué sabe un personaje, qué le falta para preparar algo y
// qué se gasta al intentarlo. Capa pura —sin React, sin Supabase, sin estado—
// para que `scripts/check-recetas.ts` pueda comprobar las reglas del caldero
// sin montar una pantalla.

import { RECETAS, recetasIniciales, type Receta } from "@/data/recetas";
import { OFICIO_PERICIA, materialPorN, type Oficio } from "@/lib/materiales";
import { norm } from "@/lib/slug";
import type { Item } from "@/lib/character";

/**
 * Las recetas descubiertas viven en `characters.lore_unlocked` con este
 * prefijo, junto a los `reg:` y `cont:x:profundo` del saber.
 *
 * **Por qué ahí y no en una columna nueva**: la columna ya es `jsonb` desde
 * `schema_v19`, así que no hace falta migración, y sobre todo sale gratis toda
 * la maquinaria de descubrir poco a poco — el DM concede con la op `unlockLore`
 * de `/api/dm/character` (que ya fusiona sin pisar) y un tomo in-game enseña con
 * `ItemDoc.unlockLore`, que ya existe.
 *
 * **No ensucia `/reino`**: los cuatro consumidores de saber (`SaberBrowser`,
 * `ContinentePage`, `CalamidadSection`, `SaberRoll`) recorren el catálogo
 * `SABER` y preguntan `unlocked.includes(id)`. Iteran el catálogo, no el array
 * del personaje, así que un id que no es de saber no se pinta en ningún sitio.
 */
export const PREFIJO_RECETA = "receta:";

/** El id con el que se guarda una receta descubierta. */
export function idReceta(slug: string): string {
  return `${PREFIJO_RECETA}${slug}`;
}

/** El slug de un id de receta, o `null` si ese id no es de una receta. */
export function slugDeId(id: string): string | null {
  return id.startsWith(PREFIJO_RECETA) ? id.slice(PREFIJO_RECETA.length) : null;
}

/** ¿Tiene este personaje la pericia de oficio que hace falta? */
export function sabeOficio(skills: string[], oficio: Oficio): boolean {
  return skills.includes(OFICIO_PERICIA[oficio]);
}

/**
 * Las recetas que este personaje sabe de un oficio: las iniciales (por tener la
 * pericia) más las que le hayan enseñado.
 *
 * **Sin la pericia el libro está vacío**, aunque el DM le haya concedido
 * recetas: saber la fórmula no es saber prepararla. Las concedidas no se
 * pierden —siguen en `lore_unlocked`—, solo dejan de servir mientras no tenga
 * el oficio.
 */
export function recetasSabidas(oficio: Oficio, skills: string[], loreUnlocked: string[]): Receta[] {
  if (!sabeOficio(skills, oficio)) return [];
  const concedidas = new Set(
    loreUnlocked.map(slugDeId).filter((s): s is string => s !== null)
  );
  const iniciales = new Set(recetasIniciales(oficio).map((r) => r.slug));
  return RECETAS.filter(
    (r) => r.oficio === oficio && (iniciales.has(r.slug) || concedidas.has(r.slug))
  );
}

/** Cuántas unidades de este material lleva encima. */
export function cuantoLleva(items: Item[], nombre: string): number {
  const objetivo = norm(nombre);
  return items.reduce((s, i) => s + (norm(i.name) === objetivo ? i.qty : 0), 0);
}

export type Falta = {
  n: number;
  nombre: string;
  necesita: number;
  tiene: number;
  /** Una herramienta que no está: hace falta tenerla, pero no se gasta. */
  esHerramienta: boolean;
};

/**
 * Qué hace falta para preparar esto, contra la bolsa real. Devuelve **todas**
 * las líneas, no solo las que faltan, para que el caldero pueda pintar la lista
 * entera marcando cuáles están.
 *
 * Las **herramientas se exigen disponibles pero no se cuentan por cantidad**:
 * un cincel es un cincel, tengas uno o tres.
 */
export function requisitos(r: Receta, items: Item[]): Falta[] {
  const out: Falta[] = [];
  for (const m of r.materiales) {
    const mat = materialPorN(r.oficio, m.n);
    if (!mat) continue; // el gate impide que esto pase; aquí no se revienta
    out.push({ n: m.n, nombre: mat.name, necesita: m.qty, tiene: cuantoLleva(items, mat.name), esHerramienta: false });
  }
  for (const n of r.herramientas ?? []) {
    const mat = materialPorN(r.oficio, n);
    if (!mat) continue;
    out.push({ n, nombre: mat.name, necesita: 1, tiene: cuantoLleva(items, mat.name), esHerramienta: true });
  }
  return out;
}

/** ¿Están todos los materiales y todas las herramientas? */
export function puedePreparar(r: Receta, items: Item[]): boolean {
  return requisitos(r, items).every((f) => f.tiene >= f.necesita);
}

/**
 * Lo que queda en la bolsa tras intentar la preparación: se descuentan los
 * materiales y **nada más**.
 *
 * Se llama igual tanto si la tirada sale como si no. **Al fallar también se
 * gastan**: es la decisión de la tanda, y es lo que hace que recolectar
 * importe. Lo que cambia entre éxito y fallo es solo si además entra la poción.
 *
 * **Las herramientas nunca se tocan.** Si aparecieran aquí, el cincel se
 * gastaría en cada tirada.
 */
export function consumir(items: Item[], r: Receta): Item[] {
  const pendiente = new Map<string, number>();
  for (const m of r.materiales) {
    const mat = materialPorN(r.oficio, m.n);
    if (!mat) continue;
    const k = norm(mat.name);
    pendiente.set(k, (pendiente.get(k) ?? 0) + m.qty);
  }
  const out: Item[] = [];
  for (const it of items) {
    const k = norm(it.name);
    const debe = pendiente.get(k) ?? 0;
    if (debe <= 0) { out.push(it); continue; }
    const quita = Math.min(debe, it.qty);
    pendiente.set(k, debe - quita);
    // El montón que se agota desaparece de la bolsa; no se deja en qty 0.
    if (it.qty - quita > 0) out.push({ ...it, qty: it.qty - quita });
  }
  return out;
}

/**
 * Añade a la bolsa lo que ha salido del caldero, apilándolo por nombre igual
 * que hace el resto de la app (`devolver` en `lib/inventario.ts`, `addItems` en
 * `/api/dm/character`). Sin esto, cada poción preparada sería una fila suelta.
 */
export function anadirProducto(items: Item[], nombre: string): Item[] {
  const idx = items.findIndex((i) => norm(i.name) === norm(nombre));
  if (idx >= 0) {
    const next = [...items];
    next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
    return next;
  }
  return [...items, { id: crypto.randomUUID(), name: nombre, qty: 1 }];
}
