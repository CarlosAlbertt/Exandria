# El inventario, rediseñado — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sacar el inventario de la ficha a su propia pantalla, con el muñeco de papel como protagonista y las vitales (CA, impacto, daño) cambiando en vivo al equiparte.

**Architecture:** Una capa pura nueva (`lib/inventario.ts` + su script) que deduce categoría, icono y hueco destino de cada objeto; un hook de carga/guardado (`lib/useInventarioVivo.ts`) calcado de `useFichaViva`; tres componentes en `components/inventario/`; y `app/inventario/page.tsx`, que hoy es un redirect, montándolos. `components/Paperdoll.tsx` **se reutiliza**, no se reescribe.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 · Supabase. **Sin migración.**

---

## Antes de empezar

**Spec:** `docs/superpowers/specs/2026-07-28-inventario-ui-design.md`. Léelo entero: contiene las decisiones tomadas con el usuario y las cosas que NO entran.

**Convenciones del repo:**
- Rama: `inventario-ui` (ya existe, con el spec commiteado). Un commit por tarea.
- Trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`; autor `CarlosAlbertt`.
- Mensajes con backticks → `git commit -F -` con heredoc, y **usa el Bash tool**: el shell por defecto es PowerShell.
- **Nunca `git add -A`.** Cada tarea dice qué añadir.
- Textos de cara al usuario en **español**.
- `AGENTS.md`: este Next.js 16 tiene cambios rompedores. Ante dudas de API, lee `node_modules/next/dist/docs/`, no tires de memoria.

**Cinco cosas que este proyecto ya ha pagado caras. No las repitas:**

1. **Una regla dentro de un componente escapa al gate.** Los `scripts/check-*.ts` solo cubren funciones puras. En la losa anterior se coló **cuatro veces**. Si tu trabajo tiene un umbral, un tope o una fórmula, va a `lib/` con su script.
2. **Un `var(--color-x)` sin definir invalida la declaración entera, en silencio.** Ni error de build ni aviso: el color simplemente no sale. Pasó con `--color-gold` en seis sitios.
3. **Un error tragado disfraza el fallo.** `const { data } = await …` sin mirar `error` convirtió «falta una columna» en «no tienes personaje».
4. **`tsc` no ve un enlace muerto.** Al borrar `/tablero` quedó un botón que no llevaba a ningún sitio. Al mover rutas o secciones, **grep de referencias**.
5. **No confundas dos estados distintos.** `loadActiveCharacter` devuelve `null` tanto si no hay ficha como si la consulta falló.

---

## Estructura de archivos

| Archivo | Responsabilidad | Acción |
|---|---|---|
| `lib/inventario.ts` | **Puro**: `categoriaDe`, `CATEGORIAS`, `huecosDe`, `huecoDestino`, `agrupaPorCategoria`. | Crear |
| `scripts/check-inventario.ts` | Verifica lo anterior. El gate pasa de 20 a **21**. | Crear |
| `lib/derive.ts` | **Exportar** `ARMOR_LOOKUP` y `SHIELD_NAME` (hoy privados). | Modificar |
| `data/equipment.ts` | Borrar el comentario de sincronía de la línea 11. | Modificar |
| `app/globals.css` | Definir `--color-verdant`. | Modificar |
| `lib/useInventarioVivo.ts` | Carga la ficha activa, expone `items`/`equipment` y los persiste. | Crear |
| `components/inventario/BolsaAgrupada.tsx` | Lista agrupada por categoría + buscador. | Crear |
| `components/inventario/DetalleObjeto.tsx` | Detalle en el sitio: notas, equipar, soltar. | Crear |
| `components/inventario/VitalesEquipo.tsx` | CA · Impacto · Daño + `acSource` + barra de huecos. | Crear |
| `app/inventario/page.tsx` | Deja de redirigir; monta la pantalla. | Reescribir |
| `components/CharacterSheet.tsx` | Pierde la sección de inventario; gana el resumen. | Modificar |

**`components/Paperdoll.tsx` NO se reescribe.** Ya hace lo que hace falta: `.pd-grid` es `64px 1fr 64px` con el retrato ocupando la columna central (filas 1–5) y los huecos cayendo a ambos lados por colocación automática. Ya trae los accesorios dinámicos y el aviso de accesorios «de sobra». Solo gana props opcionales.

---

### Task 1: La capa pura y su script

**Files:** Crear `scripts/check-inventario.ts`, `lib/inventario.ts`. Modificar `lib/derive.ts`, `data/equipment.ts`, `app/globals.css`.

- [ ] **Step 1: Exportar lo que hoy es privado**

En `lib/derive.ts`, línea 43 y 49, añade `export`:

```ts
export const ARMOR_LOOKUP: Record<string, { base: number; kind: ArmorKind }> = {
```
```ts
export const SHIELD_NAME = "Escudo";
```

No cambies nada más de ese archivo. Comprueba que `ArmorKind` también esté exportado; si no lo está, expórtalo igual.

En `data/equipment.ts`, borra el comentario de la línea 11 (`// Mantener estos nombres en sincronía con ARMOR_LOOKUP en lib/derive.ts...`) y pon en su lugar:

```ts
  // Los nombres de armadura viven en ARMOR_LOOKUP (lib/derive.ts) y se leen de ahí:
  // esta lista es solo el catálogo que se ofrece al añadir.
```

- [ ] **Step 2: Definir el token de color**

En `app/globals.css`, dentro del bloque `@theme`, justo después de `--color-ember: #ef6a3d;`, añade:

```css
  --color-verdant: #5fbf7a;
```

Va aquí y no se reutiliza `--color-primitivo` (#6cc24a) porque ese es el **acento de la clase primitiva**: atar el color de los consumibles al de una clase es crear dos cosas que hay que mantener sincronizadas.

- [ ] **Step 3: Escribir el script de comprobación (que fallará)**

Crea `scripts/check-inventario.ts`:

```ts
// Comprobación manual del inventario. Uso: npx tsx scripts/check-inventario.ts
import { categoriaDe, CATEGORIAS, huecosDe, huecoDestino, agrupaPorCategoria } from "../lib/inventario";
import { CATALOG } from "../data/equipment";
import { ARMAS } from "../data/weapons";
import { ARMOR_LOOKUP } from "../lib/derive";
import type { Item } from "../lib/character";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}
const item = (name: string, qty = 1): Item => ({ id: name, name, qty });

// --- categoriaDe ---
check("un arma del catálogo es Armas", categoriaDe("Espada larga") === "Armas");
check("una armadura es Armaduras", categoriaDe("Coraza") === "Armaduras");
check("el escudo es Armaduras", categoriaDe("Escudo") === "Armaduras");
check("una poción es Consumibles", categoriaDe("Poción de curación") === "Consumibles");
check("una soga es Aventura", categoriaDe("Soga de cáñamo (15 m)") === "Aventura");
check("unas ganzúas son Herramientas", categoriaDe("Herramientas de ladrón") === "Herramientas");
check("ignora mayúsculas", categoriaDe("ESPADA LARGA") === "Armas");
check("ignora tildes", categoriaDe("Pocion de curacion") === "Consumibles");
check("recorta espacios", categoriaDe("  Daga  ") === "Armas");
check("un nombre inventado es Otro", categoriaDe("Carta del gremio") === "Otro");
check("cadena vacía es Otro", categoriaDe("") === "Otro");

// La decisión de diseño más importante: SOLO coincidencia exacta. Adivinar por
// trozos pintaría de verde una "Poción de veneno".
check("no adivina por subcadena", categoriaDe("Poción de curación mayor") === "Otro");
check("no adivina por prefijo", categoriaDe("Espada larga rúnica") === "Otro");

// Ningún nombre real puede caer en Otro: si el catálogo crece y esto se rompe,
// es que falta engancharlo.
check("ningún arma cae en Otro", Object.keys(ARMAS).every((n) => categoriaDe(n) === "Armas"));
check("ninguna armadura cae en Otro", Object.keys(ARMOR_LOOKUP).every((n) => categoriaDe(n) === "Armaduras"));
check("ningún objeto del CATALOG cae en Otro",
  Object.values(CATALOG).flat().every((n) => categoriaDe(n) !== "Otro"));

// --- CATEGORIAS (icono y color de cada una) ---
check("hay 6 categorías", CATEGORIAS.length === 6);
check("toda categoría tiene icono y color", CATEGORIAS.every((c) => c.icon.length > 0 && c.color.length > 0));
check("los colores son variables del tema", CATEGORIAS.every((c) => c.color.startsWith("var(--color-")));
check("categoriaDe siempre devuelve una categoría conocida",
  ["Espada larga", "Coraza", "Antorcha", "Antídoto", "Kit de sanador", "xyz"]
    .every((n) => CATEGORIAS.some((c) => c.id === categoriaDe(n))));

// --- huecosDe ---
check("mod 0 da 20 huecos", huecosDe(0) === 20);
check("mod +3 da 26", huecosDe(3) === 26);
check("mod -1 no baja del suelo de 10", huecosDe(-1) === 18);
check("un mod absurdamente negativo se queda en 10", huecosDe(-99) === 10);

// --- huecoDestino ---
check("un arma va a la principal", huecoDestino("Espada larga", {}) === "arma_principal");
check("con la principal ocupada, va a la secundaria",
  huecoDestino("Daga", { arma_principal: item("Espada larga") }) === "arma_secundaria");
check("con las dos ocupadas, no hay destino",
  huecoDestino("Daga", { arma_principal: item("Espada larga"), arma_secundaria: item("Escudo") }) === null);
check("el escudo va a la secundaria", huecoDestino("Escudo", {}) === "arma_secundaria");
check("una armadura de cuerpo va al torso", huecoDestino("Coraza", {}) === "torso");
check("un objeto desconocido no tiene destino", huecoDestino("Carta del gremio", {}) === null);

// --- agrupaPorCategoria ---
const bolsa = [item("Espada larga"), item("Daga", 2), item("Poción de curación", 3), item("Carta del gremio")];
const grupos = agrupaPorCategoria(bolsa);
check("agrupa sin perder objetos", grupos.reduce((s, g) => s + g.items.length, 0) === bolsa.length);
check("no crea grupos vacíos", grupos.every((g) => g.items.length > 0));
check("respeta el orden de CATEGORIAS",
  grupos.map((g) => CATEGORIAS.findIndex((c) => c.id === g.cat)).every((n, i, a) => i === 0 || a[i - 1] < n));
check("agrupa las dos armas juntas",
  (grupos.find((g) => g.cat === "Armas")?.items.length ?? 0) === 2);
check("una bolsa vacía no da grupos", agrupaPorCategoria([]).length === 0);

console.log(failures === 0 ? "\nTodo en verde" : `\n${failures} fallo(s)`);
process.exit(failures === 0 ? 0 : 1);
```

- [ ] **Step 4: Ejecutarlo y verificar que falla**

Run: `npx tsx scripts/check-inventario.ts`
Esperado: **FALLA** con `Cannot find module '../lib/inventario'`.

- [ ] **Step 5: Escribir `lib/inventario.ts`**

```ts
// Capa pura del inventario: sin React, sin Supabase, sin estado.
// Verificada por scripts/check-inventario.ts.

import { CATALOG } from "@/data/equipment";
import { ARMAS } from "@/data/weapons";
import { ARMOR_LOOKUP, SHIELD_NAME } from "@/lib/derive";
import type { Item } from "@/lib/character";

export type CategoriaId = "Armas" | "Armaduras" | "Aventura" | "Consumibles" | "Herramientas" | "Otro";

export type Categoria = {
  id: CategoriaId;
  icon: string;   // Font Awesome, con el prefijo "fa-"
  color: string;  // var() del tema: si no está definida en globals.css NO se ve, y sin error
};

// El orden manda: es el de los grupos en la bolsa. "Otro" siempre al final.
export const CATEGORIAS: Categoria[] = [
  { id: "Armas",        icon: "fa-khanda",        color: "var(--color-ember)" },
  { id: "Armaduras",    icon: "fa-shield-halved", color: "var(--color-arcane)" },
  { id: "Aventura",     icon: "fa-hiking",        color: "var(--color-bronze)" },
  { id: "Consumibles",  icon: "fa-flask",         color: "var(--color-verdant)" },
  { id: "Herramientas", icon: "fa-screwdriver-wrench", color: "var(--color-violet)" },
  { id: "Otro",         icon: "fa-cube",          color: "var(--color-dim)" },
];

// Normaliza para comparar: sin mayúsculas, sin tildes, sin espacios de sobra.
function norm(s: string): string {
  return s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

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
 * A qué hueco va un objeto al pulsar «Equipar». `null` = la app no lo sabe y
 * hay que preguntárselo al jugador.
 *
 * Devuelve `null` para casi toda la armadura por una razón del juego, no por
 * pereza: el muñeco tiene huecos de cabeza, antebrazos, manos y pies, y en
 * D&D 2024 esas piezas NO dan CA, así que el catálogo no las trae.
 */
export function huecoDestino(nombre: string, equipo: Record<string, Item>): string | null {
  const n = norm(nombre);
  if (n === norm(SHIELD_NAME)) return equipo.arma_secundaria ? null : "arma_secundaria";
  if (Object.keys(ARMAS).some((a) => norm(a) === n)) {
    if (!equipo.arma_principal) return "arma_principal";
    if (!equipo.arma_secundaria) return "arma_secundaria";
    return null;
  }
  if (Object.keys(ARMOR_LOOKUP).some((a) => norm(a) === n)) return equipo.torso ? null : "torso";
  return null;
}

export type Grupo = { cat: CategoriaId; items: Item[] };

/** Agrupa la bolsa por categoría, en el orden de CATEGORIAS y sin grupos vacíos. */
export function agrupaPorCategoria(items: Item[]): Grupo[] {
  return CATEGORIAS
    .map((c) => ({ cat: c.id, items: items.filter((i) => categoriaDe(i.name) === c.id) }))
    .filter((g) => g.items.length > 0);
}
```

- [ ] **Step 6: Ejecutar el script y verificar que pasa**

Run: `npx tsx scripts/check-inventario.ts`
Esperado: todo `OK` y `Todo en verde`, exit 0. **Cuenta las líneas con `grep -c "^OK"` y reporta el número real.** No calcules el total esperado y lo des por bueno: en la losa anterior un subagente afirmó un conteo que no había mirado.

- [ ] **Step 7: Comprobar que no queda ninguna variable CSS sin definir**

Run: `grep -o "var(--color-[a-z-]*)" lib/inventario.ts | sort -u`
Para cada una, comprueba que está en `app/globals.css`. Esperado: las seis existen (incluida la recién añadida `--color-verdant`). **Si alguna falta, no sale el color y no hay ningún error que lo avise.**

- [ ] **Step 8: Gate y commit**

Run: `npx tsc --noEmit` (sin salida) y `npx next build` (`✓ Compiled successfully`).
Run los 20 scripts previos para descartar regresión — en especial `check-derive`, que cubre la CA y cuyo archivo has tocado.

```bash
git add lib/inventario.ts scripts/check-inventario.ts lib/derive.ts data/equipment.ts app/globals.css
git commit -F - <<'EOF'
feat(inventario): capa pura de categorias, huecos y destino de equipo

categoriaDe deduce la categoria de un objeto del nombre, por
coincidencia exacta salvo mayusculas y tildes. No adivina por trozos del
nombre: una "Pocion de curacion mayor" sale como Otro antes que
arriesgarse a pintar de verde una "Pocion de veneno".

El indice se arma leyendo ARMAS, ARMOR_LOOKUP y CATALOG, sin copiar
ninguna lista. Para eso ARMOR_LOOKUP y SHIELD_NAME dejan de ser privados
en derive.ts, y se borra el comentario de equipment.ts que pedia
mantener dos listas sincronizadas a mano.

huecoDestino devuelve null para casi toda la armadura, y es una regla
del juego y no pereza: el muneco tiene huecos de cabeza, manos y pies, y
en 2024 esas piezas no dan CA.

Se define --color-verdant como token propio en vez de reutilizar
--color-primitivo, que es el acento de una clase. Una variable que no
existe no da error de build: el color simplemente no sale.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

### Task 2: El hook que carga y guarda la bolsa

**Files:** Crear `lib/useInventarioVivo.ts`.

> Esta es la tarea de riesgo. `/inventario` va a ser una pantalla independiente y necesita cargar la ficha y **escribir `items` y `equipment`**, que son columnas de `characters` (no de `play_state`).

- [ ] **Step 1: Averiguar cómo persiste hoy la hoja, y reportarlo**

Antes de escribir nada, lee `components/CharacterSheet.tsx` y responde por escrito:
1. ¿Dónde y cuándo se guardan `items` y `equipment`? (¿un `useEffect` con dependencias? ¿debounce? ¿al cambiar?) Da número de línea.
2. ¿Qué distingue `saveMode: "self"` de `"dm"` en esa ruta concreta?
3. ¿Se guarda algo si `targetUserId` es `null` (sin sesión → `localStorage`)?

**Reporta las tres respuestas antes de seguir.** No supongas: el patrón que encuentres es el que hay que replicar exactamente, porque si las dos pantallas guardan distinto, la última en escribir pisa a la otra.

- [ ] **Step 2: Escribir el hook replicando ese patrón**

Crea `lib/useInventarioVivo.ts`, con el molde de `lib/useFichaViva.ts` (léelo primero: resuelve ya la carga tolerante, el realtime de la fila y el guard anti-eco).

Requisitos, todos obligatorios:
- Carga con `loadActiveCharacter` y **distingue los dos estados**: no hay ficha ≠ la consulta falló. `loadActiveCharacter` devuelve `null` en ambos casos, así que la pantalla debe decir «no tienes un personaje en juego» y **no afirmar** que no se pudo cargar. Ese error exacto ya se cometió el 22 de julio.
- Expone `{ characterId, character, items, equipment, mods, derived, ready, error, setItems, setEquipment }`.
- Persiste con el mismo camino que hayas encontrado en el Step 1: `saveCharacter(characterId, patch)` para `self`, `POST /api/dm/character` para `dm`.
- **Mira siempre el `error` que devuelven.** Nada de `const { data } = await …`. Si falla el guardado, el hook lo expone en `error` para que la pantalla lo pinte.
- Se suscribe a su fila de `characters` para que el DM entregando botín se vea sin recargar.

- [ ] **Step 3: Gate**

Run: `npx tsc --noEmit` y `npx next build`. Ambos limpios.

- [ ] **Step 4: Commit**

```bash
git add lib/useInventarioVivo.ts
git commit -F - <<'EOF'
feat(inventario): hook de carga y guardado de la bolsa

Calcado de useFichaViva: carga tolerante, realtime sobre la propia fila
y guardado por el mismo camino que la hoja (saveCharacter para uno
mismo, /api/dm/character para el DM), para que las dos pantallas no
escriban distinto y se pisen.

Distingue no tener ficha de que la consulta falle, que loadActiveCharacter
devuelve null en los dos casos. Afirmar "no se ha podido cargar" a quien
simplemente no tiene personaje es el bug del 22 de julio con otra cara.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

### Task 3: La bolsa agrupada

**Files:** Crear `components/inventario/BolsaAgrupada.tsx`.

- [ ] **Step 1: Escribir el componente**

```tsx
"use client";

import { useMemo, useState } from "react";
import { agrupaPorCategoria, CATEGORIAS, categoriaDe, type CategoriaId } from "@/lib/inventario";
import type { Item } from "@/lib/character";

type Props = {
  items: Item[];
  /** Objeto abierto en el detalle, para resaltarlo. */
  seleccionado?: string | null;
  /** Si falta, la lista es de solo lectura (panel del DM). */
  onSelect?: (item: Item) => void;
};

const meta = (cat: CategoriaId) => CATEGORIAS.find((c) => c.id === cat)!;

// La bolsa: lo que llevas GUARDADO. Lo que llevas puesto está en el muñeco y
// no aparece aquí — equipar saca el objeto de la bolsa (CharacterSheet.tsx,
// removeOne), así que no hace falta ninguna chapa de "equipada".
export default function BolsaAgrupada({ items, seleccionado = null, onSelect }: Props) {
  const [q, setQ] = useState("");

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((i) => i.name.toLowerCase().includes(t));
  }, [items, q]);

  const grupos = useMemo(() => agrupaPorCategoria(filtrados), [filtrados]);

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar en la bolsa…"
        className="w-full bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors mb-3"
        style={{ color: "var(--color-warm)" }}
      />

      {items.length === 0 ? (
        <p className="font-ui text-[13px] text-center py-6" style={{ color: "var(--color-dim)" }}>
          La bolsa está vacía.
        </p>
      ) : grupos.length === 0 ? (
        <p className="font-ui text-[13px] text-center py-6" style={{ color: "var(--color-dim)" }}>
          Nada coincide con «{q.trim()}».
        </p>
      ) : (
        grupos.map((g) => {
          const m = meta(g.cat);
          return (
            <div key={g.cat}>
              <p className="font-ui text-[10px] uppercase tracking-[.16em] mt-4 mb-2 flex items-center gap-2" style={{ color: "var(--color-dim)" }}>
                <i className={`fas ${m.icon}`} style={{ color: m.color }} />
                {g.cat} · {g.items.length}
                <span className="flex-1 h-px" style={{ background: "var(--color-line)" }} />
              </p>
              <div className="space-y-1.5">
                {g.items.map((it) => (
                  <div
                    key={it.id}
                    onClick={onSelect ? () => onSelect(it) : undefined}
                    className={`panel-raised px-3 py-2 flex items-center gap-3 ${onSelect ? "cursor-pointer" : ""}`}
                    style={seleccionado === it.id ? { borderColor: "var(--color-bronze)", boxShadow: "0 0 0 1px var(--color-bronze)" } : undefined}
                  >
                    <span className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: "var(--color-night)" }}>
                      <i className={`fas ${it.doc ? "fa-scroll" : meta(categoriaDe(it.name)).icon} text-[13px]`}
                         style={{ color: it.doc ? "var(--color-arcane)" : meta(categoriaDe(it.name)).color }} />
                    </span>
                    <span className="font-ui text-[13px] font-semibold flex-1 min-w-0" style={{ color: "var(--color-warm)" }}>
                      {it.name}
                    </span>
                    {it.qty > 1 && (
                      <span className="font-ui text-[12px] font-bold" style={{ color: "var(--color-bronze-bright)" }}>×{it.qty}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
```

- [ ] **Step 2: Gate y commit**

Run: `npx tsc --noEmit`, `npx next build`, y `npx eslint components/inventario/BolsaAgrupada.tsx` (sin avisos).

```bash
git add components/inventario/BolsaAgrupada.tsx
git commit -F - <<'EOF'
feat(inventario): la bolsa se agrupa por categoria y se puede buscar

Cada objeto trae icono y color de su categoria, deducidos del nombre. Los
grupos llevan su recuento y no se pintan si estan vacios.

Sin chapa de "equipada": lo que llevas puesto no esta en la bolsa, porque
equipar saca el objeto de ella. Marcar un estado que no existe solo
confunde.

Los nombres largos en espanol caben enteros, que es la razon de que sea
lista y no rejilla de casillas.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

> ## ⚠️ CAMBIO DE ALCANCE (2026-07-28, tras la Task 2) — afecta a las Tasks 4, 6 y 7
>
> Al implementar el hook se descubrió que **en `app/personaje/page.tsx:19` la hoja
> propia de un jugador es `readOnly`**, a propósito y comentado: hoy **un jugador no
> puede tocar su propio inventario**. Este plan daba por hecho que sí.
>
> **Decisión del usuario**: el jugador **equipa y escribe notas**; añadir, soltar y
> cambiar cantidades siguen siendo **solo del DM**. El DM controla qué posees, tú
> decides qué llevas puesto.
>
> Por tanto hacen falta **dos permisos**, no uno:
> - `puedeEquipar` — el dueño de la ficha o el DM.
> - `puedeEditarContenido` — **solo el DM**.
>
> Y el **formulario de añadir** (input libre + chips de `CATALOG`), que hoy vive en la
> hoja detrás de `!readOnly` y por eso solo ve el DM, **se muda a `/inventario`**: si no,
> al vaciar la sección de la hoja (Task 7) el DM se queda sin forma de dar objetos.
> El DM llega por **`/inventario?user=<id>`**, igual que ya hace con `/personaje?user=`.
>
> La base no lo impide: la policy `chars: actualizar lo propio` (schema_v14) ya deja a un
> jugador escribir su fila. Era una decisión de producto, no de seguridad.

### Task 4: El detalle del objeto

**Files:** Crear `components/inventario/DetalleObjeto.tsx`.

- [ ] **Step 1: Escribir el componente**

```tsx
"use client";

import { useState } from "react";
import { huecoDestino, categoriaDe, CATEGORIAS } from "@/lib/inventario";
import { ARMOR_SLOTS, WEAPON_SLOTS } from "@/data/equipmentSlots";
import type { Item } from "@/lib/character";

type Props = {
  item: Item;
  equipment: Record<string, Item>;
  onEquipar: (item: Item, slotId: string) => void;
  onSoltar: (item: Item) => void;
  onNotas: (item: Item, notas: string) => void;
  onCerrar: () => void;
};

// El detalle se abre EN EL SITIO, empujando la lista. Nada de modal: en el
// móvil de un jugador taparía la mesa y obligaría a cerrarlo para seguir.
export default function DetalleObjeto({ item, equipment, onEquipar, onSoltar, onNotas, onCerrar }: Props) {
  const destino = huecoDestino(item.name, equipment);
  const [eligiendo, setEligiendo] = useState(false);
  const cat = categoriaDe(item.name);
  const meta = CATEGORIAS.find((c) => c.id === cat)!;
  const huecos = [...WEAPON_SLOTS, ...ARMOR_SLOTS];

  return (
    <div className="panel-raised p-4 mt-3" style={{ borderColor: "var(--color-bronze)" }}>
      <div className="flex items-start gap-3 mb-3">
        <span className="w-9 h-9 rounded-lg grid place-items-center shrink-0" style={{ background: "var(--color-night)" }}>
          <i className={`fas ${meta.icon}`} style={{ color: meta.color }} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-ui text-[14px] font-bold" style={{ color: "var(--color-parch)" }}>{item.name}</p>
          <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
            {cat}{item.qty > 1 ? ` · llevas ${item.qty}` : ""}
          </p>
        </div>
        <button className="btn-ghost !py-1 !px-2 text-[12px]" onClick={onCerrar} title="Cerrar">
          <i className="fas fa-xmark" />
        </button>
      </div>

      <input
        value={item.notes ?? ""}
        onChange={(e) => onNotas(item, e.target.value)}
        placeholder="Notas sobre este objeto…"
        className="w-full bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[12px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
        style={{ color: "var(--color-muted)" }}
      />

      <div className="flex flex-wrap gap-2 mt-3">
        {destino && (
          <button className="btn-gold !py-1.5 !px-3 text-[12px]" onClick={() => onEquipar(item, destino)}>
            <i className="fas fa-hand-fist mr-1.5" />Equipar
          </button>
        )}
        {!destino && (
          <button className="btn-ghost !py-1.5 !px-3 text-[12px]" onClick={() => setEligiendo((v) => !v)}>
            <i className="fas fa-hand-pointer mr-1.5" />Equipar en…
          </button>
        )}
        <button
          className="btn-ghost !py-1.5 !px-3 text-[12px] ml-auto"
          style={{ color: "var(--color-ember)" }}
          onClick={() => onSoltar(item)}
        >
          <i className="fas fa-trash mr-1.5" />Soltar {item.qty > 1 ? "uno" : ""}
        </button>
      </div>

      {eligiendo && (
        <div className="mt-3">
          {/* La app no sabe dónde va este objeto: lo elige el jugador. En 2024
              los huecos de cabeza, manos y pies no dan CA, así que el catálogo
              no trae piezas para ellos y son para describir tu pinta. */}
          <p className="font-ui text-[11px] mb-2" style={{ color: "var(--color-dim)" }}>¿En qué hueco?</p>
          <div className="flex flex-wrap gap-1.5">
            {huecos.map((s) => (
              <button
                key={s.id}
                className="chip"
                onClick={() => { onEquipar(item, s.id); setEligiendo(false); }}
              >
                <i className={`fas ${s.icon} mr-1.5`} />{s.label}
                {equipment[s.id] && <span style={{ color: "var(--color-dim)" }}> (ocupado)</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Gate y commit**

Run: `npx tsc --noEmit`, `npx next build`, `npx eslint components/inventario/DetalleObjeto.tsx`.

```bash
git add components/inventario/DetalleObjeto.tsx
git commit -F - <<'EOF'
feat(inventario): detalle del objeto, en el sitio y no en un modal

Se abre empujando la lista. Un modal en el movil de un jugador tapa la
mesa y obliga a cerrarlo para seguir jugando, y media mesa juega en
movil.

Las notas se mudan aqui: dejan de ocupar una caja vacia en cada fila de
la bolsa, que era la mitad del alto de la lista.

Equipar coloca el objeto en el hueco que le toca. Cuando la app no lo
sabe -toda la armadura que no es de cuerpo- no adivina: ensena los huecos
y elige el jugador.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

### Task 5: Las vitales

**Files:** Crear `components/inventario/VitalesEquipo.tsx`.

> Esto es lo que hace que el rediseño se note: **`derive.ts` ya calcula la CA desde los huecos de equipo y ya devuelve `acSource`** con el porqué en texto. Hoy no se enseña en ningún sitio. No se calcula nada nuevo aquí.

- [ ] **Step 1: Confirmar qué devuelve `derive`**

Lee `lib/derive.ts` y anota los nombres exactos de los campos de su tipo de retorno para la CA (`ac`, `acSource`) y para el ataque. **Si el campo del impacto o del daño no existe con ese nombre, no lo inventes**: reporta qué hay y usa solo lo que exista. Pintar un número que no se calcula sería peor que no pintarlo.

- [ ] **Step 2: Escribir el componente**

```tsx
"use client";

import { huecosDe } from "@/lib/inventario";

type Props = {
  ac: number;
  acSource: string;
  modFuerza: number;
  usados: number;
  /** Pares extra a mostrar junto a la CA (p. ej. impacto y daño del arma equipada). */
  extras?: { label: string; value: string }[];
};

export default function VitalesEquipo({ ac, acSource, modFuerza, usados, extras = [] }: Props) {
  const cap = huecosDe(modFuerza);
  const pct = Math.min(100, Math.round((usados / cap) * 100));
  const color = pct >= 100 ? "var(--color-ember)" : pct >= 80 ? "var(--color-marcial)" : "var(--color-bronze)";

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <div className="panel-raised flex-1 py-2 text-center">
          <p className="font-display font-extrabold text-[22px] leading-none" style={{ color: "var(--color-bronze-bright)" }}>{ac}</p>
          <p className="font-ui text-[9px] uppercase tracking-[.14em] mt-1" style={{ color: "var(--color-dim)" }}>CA</p>
        </div>
        {extras.map((e) => (
          <div key={e.label} className="panel-raised flex-1 py-2 text-center">
            <p className="font-display font-extrabold text-[22px] leading-none" style={{ color: "var(--color-bronze-bright)" }}>{e.value}</p>
            <p className="font-ui text-[9px] uppercase tracking-[.14em] mt-1" style={{ color: "var(--color-dim)" }}>{e.label}</p>
          </div>
        ))}
      </div>

      {/* El porqué de la CA, que derive ya calcula y hasta hoy no se enseñaba. */}
      <p className="font-ui text-[11px] italic text-center mt-2" style={{ color: "var(--color-dim)" }}>{acSource}</p>

      <div className="mt-3">
        <div className="flex justify-between font-ui text-[11px]">
          <span style={{ color: "var(--color-dim)" }}>Huecos</span>
          <span style={{ color }}>{usados} / {cap}</span>
        </div>
        <div className="h-[7px] rounded-full mt-1 overflow-hidden border" style={{ background: "var(--color-night)", borderColor: "var(--color-line)" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: color }} />
        </div>
        {/* De dónde sale el tope: hoy un jugador ve "24" y no sabe por qué. */}
        <p className="font-ui text-[10px] mt-1" style={{ color: "var(--color-dim)" }}>
          20 + 2 × mod. Fuerza ({modFuerza >= 0 ? `+${modFuerza}` : modFuerza})
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Gate y commit**

Run: `npx tsc --noEmit`, `npx next build`, `npx eslint components/inventario/VitalesEquipo.tsx`.

```bash
git add components/inventario/VitalesEquipo.tsx
git commit -F - <<'EOF'
feat(inventario): las vitales del equipo, con el porque de la CA

derive.ts ya calculaba la CA a partir de los huecos de equipo y ya
devolvia acSource, el porque en texto ("Coraza + DES (max 2)"), y no se
ensenaba en ningun sitio: un jugador se ponia una coraza y no veia pasar
nada.

La barra de huecos sustituye al numero suelto y pasa a ambar al 80 % y a
rojo al llegar. Debajo dice de donde sale el tope, que hoy un jugador ve
"24" y no sabe por que son 24 ni como subirlo.

Cero calculos nuevos: todo esto ya estaba, solo faltaba pintarlo.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

### Task 6: La pantalla `/inventario`

**Files:** Reescribir `app/inventario/page.tsx`. Modificar `components/Paperdoll.tsx` (solo props opcionales).

- [ ] **Step 1: Dar a `Paperdoll` una prop opcional para el pie**

En `components/Paperdoll.tsx`, añade a `Props`:

```ts
  /** Contenido bajo el muñeco (vitales). Opcional: la hoja no lo pasa. */
  pie?: React.ReactNode;
```

y píntalo justo antes del `</div>` que cierra el `panel`:

```tsx
      {pie}
```

**No cambies nada más de ese archivo.** Ya coloca los huecos a ambos lados del retrato (`.pd-grid` es `64px 1fr 64px` con `.pd-figure` en la columna central), ya genera los accesorios dinámicos y ya avisa de los que no caben. Su montaje actual en la hoja debe seguir compilando sin tocarse: por eso la prop es opcional.

- [ ] **Step 2: Escribir la pantalla**

Reescribe `app/inventario/page.tsx` montando: `Paperdoll` con `VitalesEquipo` como `pie`, `BolsaAgrupada`, y `DetalleObjeto` bajo la bolsa cuando hay objeto seleccionado. Usa `useInventarioVivo` (Task 2).

Requisitos:
- **Dos columnas en `lg:`, apilado en móvil**, con el muñeco arriba: `grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-5 items-start`.
- Distingue con honestidad los cuatro estados, como hace `/combate`: cargando · error de carga · **no tienes personaje** · todo bien. No afirmes que falló la carga a quien simplemente no tiene ficha.
- Equipar reutiliza la lógica que ya existe en la hoja: sacar el objeto de la bolsa (`removeOne`) y meterlo en el hueco; si el hueco estaba ocupado, el anterior vuelve a la bolsa (`addBack`). **Esos dos helpers están en `components/CharacterSheet.tsx:49-66` y no están exportados**: muévelos a `lib/inventario.ts` como `quitarUno(items, id)` y `devolver(items, item)`, exportados, y haz que la hoja los importe de ahí. Añade comprobaciones para los dos en `scripts/check-inventario.ts` (que quitar el último borra la entrada, que quitar uno de tres deja dos, y que devolver algo del mismo nombre sube la cantidad en vez de duplicar la fila).
- Cabecera con el nombre del personaje y un enlace de vuelta a `/personaje`.

- [ ] **Step 3: Gate**

Run: `npx tsc --noEmit`, `npx next build`, `npx tsx scripts/check-inventario.ts` (reporta el conteo real), y los otros 20 scripts.
Run: `npx eslint app/inventario/page.tsx components/Paperdoll.tsx`.

- [ ] **Step 4: Verificar en el navegador**

Arranca la vista previa y comprueba la consola y el aspecto en las dos anchuras. Es una pantalla nueva: **no la des por buena sin verla**.
- `preview_start`, navega a `/inventario`.
- `read_console_messages` — sin errores.
- `resize_window` a `mobile` y a `desktop`: el muñeco se estrecha, no se rompe, y **la página no scrollea en horizontal**.
- Captura de pantalla en ambas.

- [ ] **Step 5: Commit**

```bash
git add app/inventario/page.tsx components/Paperdoll.tsx lib/inventario.ts scripts/check-inventario.ts components/CharacterSheet.tsx
git commit -F - <<'EOF'
feat(inventario): /inventario deja de redirigir y es la pantalla

Muneco arriba con las vitales al pie, bolsa agrupada al lado, y el
detalle del objeto abriendose bajo la lista. Dos columnas en portatil y
apilado en movil, porque el DM juega en portatil y los jugadores en el
movil.

Paperdoll no se reescribe: ya colocaba los huecos a ambos lados del
retrato y ya generaba los accesorios dinamicos. Solo gana una prop
opcional para el pie, asi que su montaje en la hoja sigue igual.

quitarUno y devolver suben de CharacterSheet a lib/inventario, donde el
gate los ve: eran helpers de inventario viviendo en un componente de 897
lineas.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

### Task 7: La ficha se queda con el resumen

**Files:** Crear `components/inventario/ResumenEquipo.tsx`. Modificar `components/CharacterSheet.tsx`.

- [ ] **Step 1: El resumen**

Crea `components/inventario/ResumenEquipo.tsx`: las chapas de lo equipado (nombre + icono de categoría), `VitalesEquipo` reutilizado, y un `<Link href="/inventario">` con «Abrir el inventario». Sin botones de edición: es un resumen.

- [ ] **Step 2: Quitar la sección de inventario de la hoja**

En `components/CharacterSheet.tsx`, borra la `<section>` de INVENTARIO (hoy en las líneas ~739-843: cabecera con `used`/`cap`, aviso de `pickingSlot`, input de personalizado, chips de `CATALOG`, y las filas de objetos) y monta `<ResumenEquipo …/>` en su lugar.

Con ella se quedan sin uso `custom`, `cat`, `addItem`, `changeQty`, `setNotes`, `onItemClick`, `pickingSlot`, `equipInto` y el import de `CATALOG`. **Bórralos solo si de verdad no los usa nadie más** — `onSlotClick` y `Paperdoll` se quedan, y `equipInto` lo usa `onItemClick`. Comprueba uno por uno con grep antes de borrar.

- [ ] **Step 3: Grep de referencias muertas**

`tsc` no ve un enlace roto: una ruta no es un símbolo. Ya pasó al borrar `/tablero`.

```bash
grep -rn "pickingSlot\|Elige un objeto para equipar" --include=*.tsx . | grep -v node_modules
grep -rn "inventario" --include=*.tsx app components | grep -v node_modules | grep -v "components/inventario"
```

Esperado: ninguna referencia a la mecánica de dos pasos que acabas de quitar, y ningún texto que siga diciendo «pulsa un hueco y luego el objeto».

- [ ] **Step 4: Gate**

`npx tsc --noEmit`, `npx next build`, los 21 scripts (en especial **`check-ficha` (11)**, que cubre la carga de la ficha), y `npx eslint` sobre los archivos tocados.

- [ ] **Step 5: Verificar en el navegador**

`/personaje` entera, con el resumen y sin la sección vieja; el enlace lleva a `/inventario`; y `Panel DM › Grupo` sigue pintando la ficha de un jugador sin romperse.

- [ ] **Step 6: Commit**

```bash
git add components/inventario/ResumenEquipo.tsx components/CharacterSheet.tsx
git commit -F - <<'EOF'
docs y feat(inventario): la ficha se queda con el resumen

/personaje conserva lo que se mira en mitad de un turno -que llevo puesto
y cuanta CA tengo- y manda el resto a /inventario. Gestionar la bolsa es
otra tarea y otro momento.

Se va con ello el modo de equipar en dos pasos: ya no hay que pulsar un
hueco y luego el objeto, porque ahora se equipa desde el detalle.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

### Task 8: El panel del DM y la documentación

**Files:** Modificar `app/dm/GrupoPanel.tsx` (o donde monte el inventario del jugador), `HANDOFF.md`, y el vault.

- [ ] **Step 1: El DM ve la bolsa agrupada, en lectura**

Localiza dónde el Panel DM › Grupo pinta el inventario de cada jugador y sustitúyelo por `<BolsaAgrupada items={…} />` **sin `onSelect`** — sin esa prop la lista no es pulsable y no hay botones. Para dar o quitar cosas el DM ya tiene «entregar» en su panel.

- [ ] **Step 2: HANDOFF y vault**

Sección `## RESUELTO (2026-07-28): el inventario, rediseñado 🎒` en `HANDOFF.md`, con el molde de las demás: qué se hizo, las trampas cazadas, qué queda fuera, la verificación y **la prueba del usuario** (cópiala del spec). Actualiza «Son 20» a «Son 21» en la sección de scripts y añade `check-inventario` a la tabla con su recuento real.

En el vault: `Componentes.md` y `Rutas.md` con `/inventario` y los nuevos componentes; entrada nueva en `Historial de desarrollo.md`.

- [ ] **Step 3: Commit**

```bash
git add HANDOFF.md app/dm/GrupoPanel.tsx
git commit -F - <<'EOF'
docs(inventario): HANDOFF y vault con el rediseno del inventario

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Qué NO entra (del spec, a propósito)

Peso, rareza y sintonización · arte por objeto (iconos y color, no ilustraciones) · arrastrar y soltar · ampliar `CATALOG` con yelmos, guantes y botas (es contenido, va al backlog) · tocar `/crear` o el reparto de botín · reordenar la bolsa a mano o marcar favoritos.

**Que lo equipado no cuente para los huecos es la regla actual y no se toca.** Está documentado en el spec para que nadie lo «arregle» creyendo que es un descuido: cambiarlo sería tocar mecánica, no interfaz.

## Autorrevisión (hecha al escribir el plan)

| Sección del spec | Tarea |
|---|---|
| `categoriaDe`, 6 categorías, coincidencia exacta | Task 1 |
| Exportar `ARMOR_LOOKUP`/`SHIELD_NAME`, borrar el comentario de sincronía | Task 1 |
| Definir `--color-verdant` | Task 1 |
| `huecosDe` y el `20 + 2×FUE` explicado | Tasks 1 y 5 |
| `huecoDestino` y el selector para lo desconocido | Tasks 1 y 4 |
| Bolsa agrupada con buscador, sin chapa de equipada | Task 3 |
| Detalle en el sitio, notas dentro | Task 4 |
| Vitales con `acSource` y barra de huecos | Task 5 |
| Pantalla `/inventario` responsive | Task 6 |
| Resumen en la ficha | Task 7 |
| Modo lectura del DM | Task 8 |
| Verificación y prueba del usuario | Tasks 1, 6, 7, 8 |

**Consistencia de tipos:** `CategoriaId` (Task 1) se usa en `BolsaAgrupada` (Task 3) y `DetalleObjeto` (Task 4). `huecoDestino(nombre, equipo)` devuelve `string | null` en Task 1 y así se consume en Task 4. `VitalesEquipo` toma `{ ac, acSource, modFuerza, usados, extras }` en Task 5 y se monta con esas props en Tasks 6 y 7. `quitarUno`/`devolver` se crean en Task 6 y sus comprobaciones se añaden ahí mismo.

**Dos huecos que el plan deja abiertos a propósito, con instrucción de reportar en vez de suponer:** cómo persiste hoy la hoja `items`/`equipment` (Task 2, Step 1) y qué campos exactos devuelve `derive` para el impacto y el daño (Task 5, Step 1). En los dos casos, inventarse la respuesta es peor que preguntar.
