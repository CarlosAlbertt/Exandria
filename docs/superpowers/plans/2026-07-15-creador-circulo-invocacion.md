# Creador «Círculo de invocación» (+ Fase K) — Plan de implementación

> **Para trabajadores agénticos:** SUB-SKILL REQUERIDA: usa
> superpowers:subagent-driven-development (recomendado) o
> superpowers:executing-plans para ejecutar tarea a tarea. Los pasos usan
> checkbox (`- [ ]`). Convención del repo: subagente **implementador** +
> **revisor** por tarea; commits en español; **no hacer push** (lo hace el
> controlador al final).

**Goal:** Sustituir la escena del creador (`/crear`) —hoy un **tomo**— por un
**círculo de invocación**, e integrar la **Fase K**: aptitudes por 4d6 de
tirada única (con los dados 3D), array estándar o point-buy, bloqueadas en
servidor.

**Architecture:** La lógica de estado/validación de `app/crear/page.tsx` se
**conserva** (borrador en localStorage sin sesión, nube con sesión, `stepDone`,
gate de pasos). Cambia la **presentación**: un `InvocationCircle` (aros +
runas = pasos/navegación) con un `Medallion` central (arte real si existe,
silueta rúnica generativa si no) y un `OptionRail` a la derecha; un componente
por paso. Para Fase K, `base` **sigue siendo la fuente de verdad** de las
puntuaciones (así `finalScores`, `saveCharacter` y la hoja no cambian); solo
cambia **cómo se rellena**: steppers (point-buy) o asignando los 6 valores de
`stat_rolls`.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
Supabase (tabla `stat_rolls`, `schema_v13` **ya ejecutada**) · `@3d-dice/dice-box`
vía `rollVisual` (Fase A).

**Diseño:** `docs/superpowers/specs/2026-07-15-creador-circulo-invocacion-design.md`

---

## Estructura de archivos

- **Crear** `lib/statRolls.ts` — reglas puras de Fase K (`dropLowest`,
  `STANDARD_ARRAY`, `ASSIGN_EMPTY`) + cliente de `stat_rolls`
  (`loadStatRoll`, `saveStatRoll`).
- **Crear** `scripts/check-statrolls.ts` — comprobaciones puras (estilo
  `scripts/check-dice.ts`).
- **Crear** `components/crear/Medallion.tsx` — medallón: imagen si existe,
  silueta rúnica generativa si no.
- **Crear** `components/crear/InvocationCircle.tsx` — aros + 6 runas
  (navegación/progreso) + slot central.
- **Crear** `components/crear/OptionRail.tsx` — carril de opciones
  (miniatura + nombre + subtítulo, con grupos y sub-lista).
- **Crear** `components/crear/steps/AbilitiesStep.tsx` — paso de Aptitudes
  (Fase K). El resto de pasos se quedan como funciones de render dentro de
  `page.tsx` (ya existen: `RazasIndex`, etc.) y solo se re-encajan.
- **Modificar** `app/crear/page.tsx` — estado (campos de Fase K), validación
  del paso 3, y sustituir `CharacterBook` por `InvocationCircle`+`OptionRail`.
- **Modificar** `app/globals.css` — estilos del círculo, runas y medallón.
- **Modificar** `app/dm/GrupoPanel.tsx` — botón «Resetear tirada de aptitudes».
- **Borrar** `components/CharacterBook.tsx` (tras quedar sin consumidores).

---

## Task 1: Reglas puras de Fase K (`lib/statRolls.ts`)

**Files:**
- Create: `lib/statRolls.ts`
- Test: `scripts/check-statrolls.ts`

- [ ] **Step 1: Escribir el script de comprobación (falla primero)**

Create `scripts/check-statrolls.ts`:
```ts
// Comprobación manual de lib/statRolls.ts. Uso: npx tsx scripts/check-statrolls.ts
import { dropLowest, STANDARD_ARRAY, ASSIGN_EMPTY, isAssignComplete } from "../lib/statRolls";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// dropLowest: suma los 3 mayores de 4 dados.
check("dropLowest([4,3,2,1]) = 9", dropLowest([4, 3, 2, 1]) === 9);
check("dropLowest([6,6,6,1]) = 18", dropLowest([6, 6, 6, 1]) === 18);
check("dropLowest([1,1,1,1]) = 3", dropLowest([1, 1, 1, 1]) === 3);
check("dropLowest ignora el orden", dropLowest([1, 6, 3, 5]) === dropLowest([6, 5, 3, 1]));
check("dropLowest con menos de 4 dados = suma", dropLowest([5, 5]) === 10);

// STANDARD_ARRAY 2024
check("STANDARD_ARRAY = [15,14,13,12,10,8]", JSON.stringify(STANDARD_ARRAY) === "[15,14,13,12,10,8]");
check("STANDARD_ARRAY tiene 6 valores", STANDARD_ARRAY.length === 6);

// ASSIGN_EMPTY: 6 aptitudes sin asignar
check("ASSIGN_EMPTY tiene las 6 aptitudes a null",
  JSON.stringify(ASSIGN_EMPTY) === JSON.stringify({ fue: null, des: null, con: null, int: null, sab: null, car: null }));

// isAssignComplete
check("isAssignComplete(vacío) = false", isAssignComplete(ASSIGN_EMPTY) === false);
check("isAssignComplete(completo) = true",
  isAssignComplete({ fue: 0, des: 1, con: 2, int: 3, sab: 4, car: 5 }) === true);
check("isAssignComplete(uno a null) = false",
  isAssignComplete({ fue: 0, des: 1, con: 2, int: 3, sab: 4, car: null }) === false);

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} fallaron.`);
process.exit(failures === 0 ? 0 : 1);
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx tsx scripts/check-statrolls.ts`
Expected: FALLA (el módulo `lib/statRolls.ts` no existe).

- [ ] **Step 3: Implementar `lib/statRolls.ts`**

Lee antes `lib/dice.ts` y `lib/useDiceFeed.ts` para copiar el estilo
(comentarios en español, `supabaseConfigured`, `createClient`).

Create `lib/statRolls.ts`:
```ts
"use client";

// Fase K — aptitudes de tirada única.
// El jugador elige UN método una sola vez; el resultado se guarda en la tabla
// `stat_rolls` (schema_v13), que es inmutable: user_id es PK (una fila = una
// tirada) y no hay policy de UPDATE. Solo el DM puede borrar la fila
// (= resetear la tirada). Ver el diseño en docs/superpowers/specs/.
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import type { AbilityKey } from "@/data/rules";

export type StatMethod = "dados" | "array" | "pointbuy";

// Fila de `stat_rolls`. `scores` son los 6 valores SIN asignar (la asignación
// a FUE/DES/… vive en `characters.base`). Vacío para point-buy.
export type StatRoll = { user_id: string; method: StatMethod; scores: number[]; rolled_at: string };

// Array estándar de D&D 2024.
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

// Asignación aptitud -> índice dentro de `scores` (null = sin asignar).
export type Assign = Record<AbilityKey, number | null>;
export const ASSIGN_EMPTY: Assign = { fue: null, des: null, con: null, int: null, sab: null, car: null };

// 4d6 descartando el menor: suma los 3 dados más altos. Con menos de 4 dados
// devuelve la suma tal cual (no hay nada que descartar).
export function dropLowest(dice: number[]): number {
  if (dice.length < 4) return dice.reduce((a, b) => a + b, 0);
  const sorted = [...dice].sort((a, b) => b - a);
  return sorted.slice(0, 3).reduce((a, b) => a + b, 0);
}

// ¿Están las 6 aptitudes asignadas?
export function isAssignComplete(assign: Assign): boolean {
  return (Object.keys(ASSIGN_EMPTY) as AbilityKey[]).every((k) => assign[k] !== null);
}

// Lee la tirada del jugador. null = todavía no ha elegido método.
export async function loadStatRoll(userId: string): Promise<StatRoll | null> {
  if (!supabaseConfigured) return null;
  const { data } = await createClient()
    .from("stat_rolls")
    .select("user_id, method, scores, rolled_at")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as StatRoll) ?? null;
}

// Registra el método+valores. Falla si ya existe fila (PK) — eso es justo lo
// que impide repetir la tirada. Devuelve el mensaje de error o null.
export async function saveStatRoll(userId: string, method: StatMethod, scores: number[]): Promise<string | null> {
  if (!supabaseConfigured) return "Supabase no configurado";
  const { error } = await createClient().from("stat_rolls").insert({ user_id: userId, method, scores });
  return error?.message ?? null;
}
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npx tsx scripts/check-statrolls.ts && npx tsc --noEmit`
Expected: todas OK, exit 0; tsc limpio.

Nota: `scripts/check-statrolls.ts` importa `lib/statRolls.ts`, que lleva
`"use client"` e importa el cliente de Supabase. Si `tsx` falla al resolver
`@/lib/supabase/client` en Node, **mueve las funciones puras**
(`dropLowest`, `STANDARD_ARRAY`, `Assign`, `ASSIGN_EMPTY`, `isAssignComplete`)
a `lib/statRules.ts` (sin `"use client"`, sin imports de Supabase) y deja en
`lib/statRolls.ts` solo el cliente (`loadStatRoll`/`saveStatRoll`), que
re-exporta las puras. Ajusta el import del script a `../lib/statRules`.
Reporta cuál de las dos formas quedó.

- [ ] **Step 5: Commit**

```bash
git add lib/statRolls.ts scripts/check-statrolls.ts
git commit -m "feat(crear): reglas y cliente de la tirada única de aptitudes (Fase K)"
```

---

## Task 2: Medallón (`components/crear/Medallion.tsx`)

El corazón visual: muestra el **arte real** si existe; si no, una **silueta
rúnica generativa** (no un hueco vacío).

**Files:**
- Create: `components/crear/Medallion.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Leer el componente existente de retrato**

Lee `components/PortraitFrame.tsx` (33 líneas) para **reutilizar su forma de
resolver la imagen y su fallback**. No dupliques su lógica: si ya resuelve
`src` con fallback, apóyate en ella; si no, replica el patrón mínimo.
Reporta qué hace exactamente.

- [ ] **Step 2: Añadir estilos del medallón a `app/globals.css`**

Añade al final:
```css
/* Creador — medallón del círculo de invocación */
.medallion {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid color-mix(in srgb, var(--color-bronze) 70%, transparent);
  box-shadow: 0 0 26px rgba(200, 162, 74, 0.4), inset 0 0 22px rgba(0, 0, 0, 0.7);
  background: radial-gradient(circle at 50% 32%, #3a2f4d, #15111d 72%);
  display: grid;
  place-items: center;
}
.medallion img { width: 100%; height: 100%; object-fit: cover; }
/* Silueta rúnica: se usa cuando no hay imagen (36 especies hoy sin arte) */
.medallion-silo {
  width: 26%;
  height: 58%;
  border-radius: 40% 40% 12% 12%;
  background: linear-gradient(180deg, var(--color-warm), var(--tint, var(--color-arcane)));
  box-shadow: 0 0 22px rgba(233, 220, 195, 0.45);
  position: relative;
}
.medallion-silo::before {
  content: "";
  position: absolute;
  left: 50%;
  top: -22%;
  width: 52%;
  aspect-ratio: 1;
  margin-left: -26%;
  border-radius: 50%;
  background: var(--color-warm);
  box-shadow: 0 0 14px rgba(233, 220, 195, 0.6);
}
.medallion-cap {
  position: absolute;
  bottom: 6%;
  left: 0; right: 0;
  text-align: center;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: var(--color-warm);
  opacity: 0.8;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.9);
}
```

- [ ] **Step 3: Escribir el componente**

Create `components/crear/Medallion.tsx`:
```tsx
"use client";

import { useState } from "react";

// Medallón central del círculo de invocación.
// `src`: ruta de la imagen (p. ej. "/classes/mago.jpg"). Si no hay src, o la
// imagen falla al cargar, cae a una SILUETA RÚNICA generativa tintada con
// `tint` — no un hueco vacío (hoy las 36 especies no tienen arte).
export default function Medallion({
  src,
  caption,
  tint,
}: {
  src?: string | null;
  caption?: string | null;
  tint?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const showImg = !!src && !failed;

  return (
    <div className="medallion">
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src as string} alt={caption ?? ""} onError={() => setFailed(true)} />
      ) : (
        <div
          className="medallion-silo"
          style={tint ? ({ ["--tint" as string]: tint } as React.CSSProperties) : undefined}
        />
      )}
      {caption && <div className="medallion-cap">{caption}</div>}
    </div>
  );
}
```

Nota: se usa `<img>` y no `next/image` porque la fuente puede ser una URL de
Supabase Storage en el futuro (Fase H) y aquí el tamaño es fijo por CSS; el
repo ya tiene avisos `@next/next/no-img-element` en otros sitios, por eso el
`eslint-disable-next-line`.

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: limpio.

- [ ] **Step 5: Commit**

```bash
git add components/crear/Medallion.tsx app/globals.css
git commit -m "feat(crear): medallón con arte real o silueta rúnica de reserva"
```

---

## Task 3: Círculo de invocación (`components/crear/InvocationCircle.tsx`)

**Files:**
- Create: `components/crear/InvocationCircle.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Estilos en `app/globals.css`**

Añade al final:
```css
/* Creador — círculo de invocación */
.inv-scene { position: relative; display: grid; place-items: center; padding: 20px; min-height: 340px; }
.inv-scene::after {
  content: "";
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 50% 50%, rgba(124, 107, 216, 0.13), transparent 65%);
  pointer-events: none;
}
.inv-circle { position: relative; width: min(74vw, 300px); aspect-ratio: 1; }
.inv-ring-outer, .inv-ring-inner { position: absolute; border-radius: 50%; }
.inv-ring-outer {
  inset: 0;
  border: 2px solid color-mix(in srgb, var(--color-bronze) 50%, transparent);
  box-shadow: 0 0 30px rgba(200, 162, 74, 0.3), inset 0 0 26px rgba(200, 162, 74, 0.12);
  animation: inv-spin 60s linear infinite;
}
.inv-ring-inner {
  inset: 12%;
  border: 1px dashed color-mix(in srgb, var(--color-arcane) 65%, transparent);
  box-shadow: 0 0 20px rgba(124, 107, 216, 0.35);
  animation: inv-spin 40s linear infinite reverse;
}
@keyframes inv-spin { to { transform: rotate(360deg); } }
.inv-medal-slot { position: absolute; inset: 22%; }
/* Runas = pasos. Se colocan por ángulo con --a (grados) y --r (radio). */
.inv-rune {
  position: absolute;
  left: 50%; top: 50%;
  width: 30px; height: 30px;
  margin: -15px 0 0 -15px;
  transform: rotate(var(--a)) translate(var(--r)) rotate(calc(-1 * var(--a)));
  border-radius: 7px;
  display: grid; place-items: center;
  font-size: 12px; font-weight: 800;
  background: var(--color-raised);
  color: var(--color-dim);
  border: 1px solid var(--color-line);
  cursor: pointer;
  transition: box-shadow 0.2s, color 0.2s, background 0.2s;
}
.inv-rune:disabled { cursor: not-allowed; opacity: 0.5; }
.inv-rune.done {
  background: var(--color-bronze);
  color: var(--color-night);
  border-color: var(--color-bronze-bright);
  box-shadow: 0 0 12px rgba(200, 162, 74, 0.7);
}
.inv-rune.now {
  color: var(--color-bronze-bright);
  border-color: var(--color-bronze-bright);
  box-shadow: 0 0 14px rgba(200, 162, 74, 0.5);
}
@media (prefers-reduced-motion: reduce) {
  .inv-ring-outer, .inv-ring-inner { animation: none; }
}
```

- [ ] **Step 2: Escribir el componente**

Create `components/crear/InvocationCircle.tsx`:
```tsx
"use client";

// Círculo de invocación: dos aros + 6 runas (una por paso) + slot central.
// Las runas SON la navegación y el progreso: encendida = paso completo,
// resaltada = paso actual, apagada = pendiente. `maxStep` es el último paso
// alcanzable (gate de `page.tsx`): más allá, la runa se deshabilita.
const GLYPHS = ["✦", "⚔", "◈", "⬢", "✧", "❖"];

export default function InvocationCircle({
  steps,
  current,
  maxStep,
  onGo,
  children,
}: {
  steps: readonly string[];
  current: number;
  maxStep: number;
  onGo: (step: number) => void;
  children: React.ReactNode; // el medallón (o la arena de dados)
}) {
  return (
    <div className="inv-scene">
      <div className="inv-circle">
        <div className="inv-ring-outer" />
        <div className="inv-ring-inner" />
        <div className="inv-medal-slot">{children}</div>

        {steps.map((label, i) => {
          const angle = (360 / steps.length) * i - 90; // arranca arriba
          const state = i < current ? "done" : i === current ? "now" : "";
          return (
            <button
              key={label}
              type="button"
              className={`inv-rune ${state}`}
              style={{ ["--a" as string]: `${angle}deg`, ["--r" as string]: "min(37vw, 150px)" } as React.CSSProperties}
              disabled={i > maxStep}
              onClick={() => onGo(i)}
              title={label}
              aria-label={label}
              aria-current={i === current ? "step" : undefined}
            >
              {GLYPHS[i] ?? "•"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: limpio.

- [ ] **Step 4: Commit**

```bash
git add components/crear/InvocationCircle.tsx app/globals.css
git commit -m "feat(crear): círculo de invocación con runas como pasos"
```

---

## Task 4: Carril de opciones (`components/crear/OptionRail.tsx`)

**Files:**
- Create: `components/crear/OptionRail.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Estilos en `app/globals.css`**

```css
/* Creador — carril de opciones */
.rail { background: var(--color-panel); border-left: 1px solid var(--color-line); padding: 12px; overflow-y: auto; }
@media (max-width: 860px) { .rail { border-left: 0; border-top: 1px solid var(--color-line); } }
.rail-group { font-size: 10px; font-weight: 800; letter-spacing: 0.1em; color: var(--color-bronze); margin: 10px 0 6px; }
.rail-opt {
  display: flex; align-items: center; gap: 9px;
  width: 100%; text-align: left;
  padding: 6px; margin-bottom: 5px;
  border-radius: 9px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
}
.rail-opt:hover { background: var(--color-raised); }
.rail-opt.sel { background: var(--color-raised); border-color: color-mix(in srgb, var(--color-bronze) 50%, transparent); }
.rail-thumb {
  width: 30px; height: 30px; flex: none;
  border-radius: 7px; overflow: hidden;
  background: var(--color-night);
  border: 1px solid color-mix(in srgb, var(--color-bronze) 35%, transparent);
  display: grid; place-items: center;
}
.rail-thumb img { width: 100%; height: 100%; object-fit: cover; }
.rail-thumb .ph { font-size: 10px; color: var(--color-dim); }
.rail-name { font-size: 12px; font-weight: 700; color: var(--color-warm); }
.rail-sub { font-size: 9px; color: var(--color-dim); }
```

- [ ] **Step 2: Escribir el componente**

Create `components/crear/OptionRail.tsx`:
```tsx
"use client";

import { useState } from "react";

export type RailOption = {
  slug: string;
  name: string;
  sub?: string;
  img?: string | null; // ruta de miniatura; si falta, se ve el rombo de reserva
  group?: string;      // para agrupar (p. ej. región de la especie)
};

function Thumb({ img, name }: { img?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!img || failed) return <div className="rail-thumb"><span className="ph">◆</span></div>;
  return (
    <div className="rail-thumb">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={name} onError={() => setFailed(true)} />
    </div>
  );
}

// Carril de opciones del paso actual. Agrupa por `group` si alguna opción lo
// trae (mantiene el orden de aparición de los grupos).
export default function OptionRail({
  title,
  options,
  selected,
  onPick,
}: {
  title: string;
  options: RailOption[];
  selected: string | null;
  onPick: (slug: string) => void;
}) {
  const groups: { name: string | null; items: RailOption[] }[] = [];
  for (const o of options) {
    const g = o.group ?? null;
    const last = groups[groups.length - 1];
    if (last && last.name === g) last.items.push(o);
    else groups.push({ name: g, items: [o] });
  }

  return (
    <div className="rail">
      <div className="rail-group" style={{ marginTop: 0 }}>{title}</div>
      {groups.map((g, gi) => (
        <div key={g.name ?? `g${gi}`}>
          {g.name && <div className="rail-group">{g.name}</div>}
          {g.items.map((o) => (
            <button
              key={o.slug}
              type="button"
              className={`rail-opt${selected === o.slug ? " sel" : ""}`}
              onClick={() => onPick(o.slug)}
              aria-pressed={selected === o.slug}
            >
              <Thumb img={o.img} name={o.name} />
              <span>
                <span className="rail-name">{o.name}</span>
                {o.sub && <><br /><span className="rail-sub">{o.sub}</span></>}
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: limpio.

- [ ] **Step 4: Commit**

```bash
git add components/crear/OptionRail.tsx app/globals.css
git commit -m "feat(crear): carril de opciones con miniaturas y grupos"
```

---

## Task 5: Estado de Fase K en `app/crear/page.tsx`

Solo el **estado y la validación**. La UI del paso llega en la Task 6.

**Files:**
- Modify: `app/crear/page.tsx`

- [ ] **Step 1: Ampliar el tipo `Build`**

Lee `app/crear/page.tsx` (615 líneas). En el tipo `Build` (línea ~18) añade
tres campos, conservando los demás:
```ts
  statMethod: import("@/lib/statRolls").StatMethod | null;
  rolled: number[];                                  // los 6 valores (dados/array); vacío en point-buy
  assign: import("@/lib/statRolls").Assign;          // aptitud -> índice en `rolled`
```
Mejor aún, importa los tipos arriba en vez de usar `import(...)` inline:
```ts
import { ASSIGN_EMPTY, isAssignComplete, loadStatRoll, type Assign, type StatMethod } from "@/lib/statRolls";
```
y declara los campos como `statMethod: StatMethod | null; rolled: number[]; assign: Assign;`.

- [ ] **Step 2: Inicializar los campos nuevos**

En el `useState<Build>` inicial (línea ~53) y en `reset()` (línea ~139), añade
a ambos objetos:
```ts
statMethod: null, rolled: [], assign: { ...ASSIGN_EMPTY },
```

- [ ] **Step 3: Cargar la tirada existente desde `stat_rolls`**

Tras el `useEffect` que carga el personaje de la nube (~línea 101), añade:
```ts
  // Fase K: si el jugador YA tiene tirada registrada, el método queda fijado.
  useEffect(() => {
    if (!userId) return;
    loadStatRoll(userId).then((row) => {
      if (!row) return;
      setB((p) => ({ ...p, statMethod: row.method, rolled: row.scores ?? [] }));
    });
  }, [userId]);
```

- [ ] **Step 4: Validación del paso 3 (Aptitudes)**

En `stepDone` (línea ~172), sustituye SOLO el elemento de índice 3
(hoy `pointsSpent <= POINT_BUY_BUDGET && bonusTotal(b.bonus) === 3`) por:
```ts
    // Aptitudes: point-buy valida presupuesto; dados/array exigen asignar los
    // 6 valores. En ambos casos hay que repartir los +3 del trasfondo.
    (b.statMethod === "pointbuy"
      ? pointsSpent <= POINT_BUY_BUDGET
      : b.statMethod !== null && isAssignComplete(b.assign)) && bonusTotal(b.bonus) === 3,
```

- [ ] **Step 5: Aviso de lo que falta en el paso 3**

En `missing` (línea ~192), sustituye la rama `b.step === 3` por:
```ts
      : b.step === 3
      ? (!b.statMethod
          ? "Elige cómo obtienes tus aptitudes"
          : b.statMethod !== "pointbuy" && !isAssignComplete(b.assign)
          ? "Asigna los 6 valores a tus aptitudes"
          : bonusTotal(b.bonus) !== 3
          ? "Reparte los +3 del trasfondo"
          : null)
```

- [ ] **Step 6: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: limpio. La UI del paso 3 sigue siendo la vieja (point-buy) — se
sustituye en la Task 6; puede que el paso 3 quede bloqueado hasta entonces
porque `statMethod` es `null`. **Es esperado**; no lo arregles aquí.

- [ ] **Step 7: Commit**

```bash
git add app/crear/page.tsx
git commit -m "feat(crear): estado y validación de la tirada única de aptitudes"
```

---

## Task 6: Paso de Aptitudes (`components/crear/steps/AbilitiesStep.tsx`)

**Files:**
- Create: `components/crear/steps/AbilitiesStep.tsx`
- Modify: `app/crear/page.tsx`

- [ ] **Step 1: Escribir el componente**

Lee primero, en `app/crear/page.tsx`, el capítulo de aptitudes actual
(~líneas 420-480): reutiliza sus steppers de point-buy y el reparto de bonus
(`setBase`, `setBonus`, `POINT_BUY_*`, clase CSS `stat-btn`) — **no reinventes
el point-buy, muévelo**.

Create `components/crear/steps/AbilitiesStep.tsx` con esta interfaz y lógica:
```tsx
"use client";

import { useState } from "react";
import { ABILITIES, abilityMod, fmtMod, POINT_BUY_COST, POINT_BUY_BUDGET, POINT_BUY_MIN, POINT_BUY_MAX, type AbilityKey } from "@/data/rules";
import { STANDARD_ARRAY, dropLowest, isAssignComplete, saveStatRoll, type Assign, type StatMethod } from "@/lib/statRolls";
import { rollVisual } from "@/lib/diceBox";
import { roll as rollFallback } from "@/lib/dice";

// Paso de Aptitudes (Fase K). El método se elige UNA vez: al confirmarlo se
// inserta en `stat_rolls` (inmutable). `locked` = ya hay fila en la BD.
export default function AbilitiesStep({
  userId, method, rolled, assign, base, bonus, canBonus,
  onMethod, onRolled, onAssign, onBase, onBonus,
}: {
  userId?: string;
  method: StatMethod | null;
  rolled: number[];
  assign: Assign;
  base: Record<AbilityKey, number>;
  bonus: Record<AbilityKey, number>;
  canBonus: boolean;
  onMethod: (m: StatMethod) => void;
  onRolled: (scores: number[]) => void;
  onAssign: (a: Assign) => void;
  onBase: (k: AbilityKey, v: number) => void;
  onBonus: (k: AbilityKey, v: number) => void;
}) { /* ver pasos siguientes */ }
```

Comportamiento requerido:

1. **Sin método elegido** → tres tarjetas: **Tirar 4d6**, **Array estándar**,
   **Compra de puntos**. Aviso visible: *«Solo puedes elegir una vez: la
   tirada no se puede repetir.»* Si no hay `userId`, **deshabilita "Tirar
   4d6"** con la nota *«Los dados necesitan sesión iniciada»* (así no se puede
   burlar el bloqueo en modo local).
2. **"Tirar 4d6"** → seis tiradas seguidas. Para cada una:
   ```ts
   const r = await rollVisual("4d6", { label: `Aptitud ${i + 1} de 6` });
   const dice = r ? r.rolls : (rollFallback("4d6")?.rolls ?? []);
   scores.push(dropLowest(dice));
   ```
   (usa el fallback aleatorio si `rollVisual` devuelve `null` — sin WebGL o con
   `prefers-reduced-motion`). Al acabar las 6: `onRolled(scores)` y
   `await saveStatRoll(userId, "dados", scores)`; si `saveStatRoll` devuelve
   error, muéstralo (significa que ya había fila = ya tiraste).
3. **"Array estándar"** → `onRolled(STANDARD_ARRAY)` +
   `saveStatRoll(userId, "array", STANDARD_ARRAY)`.
4. **"Compra de puntos"** → `onMethod("pointbuy")` +
   `saveStatRoll(userId, "pointbuy", [])`.
5. **Con método `dados`/`array`** → rejilla de las 6 aptitudes; cada una con un
   `<select>` de los valores de `rolled` **no usados** por otra aptitud (el
   valor propio sí aparece). Elegir escribe `onAssign` (índice) **y**
   `onBase(k, rolled[idx])` para que `base` siga siendo la fuente de verdad.
6. **Con método `pointbuy`** → los steppers actuales (`onBase`), con el
   contador `restantes = POINT_BUY_BUDGET - pointsSpent`.
7. **Siempre** → el reparto de los **+3 del trasfondo** (`onBonus`, máx +2 por
   aptitud, total exacto 3) y el total final con su modificador
   (`abilityMod`/`fmtMod`), igual que hoy.

- [ ] **Step 2: Encajarlo en `page.tsx`**

En `app/crear/page.tsx`, sustituye el capítulo de aptitudes por
`<AbilitiesStep ... />`, pasando `userId`, `b.statMethod`, `b.rolled`,
`b.assign`, `b.base`, `b.bonus`, `canBonus`, y los callbacks que hacen `set({...})`.
`onRolled` debe fijar también el método:
```tsx
onRolled={(scores) => set({ rolled: scores, assign: { ...ASSIGN_EMPTY } })}
onMethod={(m) => set({ statMethod: m, rolled: [], assign: { ...ASSIGN_EMPTY } })}
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npm run build && npx tsx scripts/check-statrolls.ts`
Expected: limpio.

- [ ] **Step 4: Commit**

```bash
git add components/crear/steps/AbilitiesStep.tsx app/crear/page.tsx
git commit -m "feat(crear): aptitudes por dados 4d6, array o point-buy con bloqueo"
```

---

## Task 7: Sustituir el tomo por el círculo en `app/crear/page.tsx`

**Files:**
- Modify: `app/crear/page.tsx`
- Delete: `components/CharacterBook.tsx`

- [ ] **Step 1: Cambiar la escena**

En `app/crear/page.tsx`:
- Quita los imports de `CharacterBook` y el tipo `Chapter`, y la constante
  `CHAPTERS`, `activeKey`, `unlockedKeys` si quedan sin uso.
- Importa:
  ```tsx
  import InvocationCircle from "@/components/crear/InvocationCircle";
  import OptionRail, { type RailOption } from "@/components/crear/OptionRail";
  import Medallion from "@/components/crear/Medallion";
  ```
- Estructura del render: una rejilla de dos columnas
  (`grid-template-columns: 1fr 280px`, una sola columna en <860px):
  ```tsx
  <div className="grid gap-0" style={{ gridTemplateColumns: "1fr 280px" }}>
    <InvocationCircle steps={STEPS} current={b.step} maxStep={maxStep} onGo={go}>
      {/* medallón según el paso */}
    </InvocationCircle>
    {/* carril del paso, o el panel del paso cuando no es una lista */}
  </div>
  ```
  Usa una media query en `app/globals.css` (clase propia, p. ej. `.crear-grid`)
  en vez de estilos inline para el responsive.

- [ ] **Step 2: Medallón por paso**

- Paso 0 (Especie): `<Medallion caption={species?.name ?? null} tint={null} />`
  (sin `src`: hoy no hay arte de especies; en cuanto exista
  `public/species/<slug>.jpg`, pásalo como `src`).
- Paso 1 (Clase): `<Medallion src={b.cls ? `/classes/${b.cls}.jpg` : null} caption={cls?.name ?? null} />`
  (los slugs de `data/classes.ts` coinciden con los archivos de
  `public/classes/`; `bardo` y `paladin` **no existen** y caerán a la silueta
  — eso es correcto y esperado).
- Pasos 2-5: `<Medallion caption={...} />` con el nombre de lo elegido.

- [ ] **Step 3: Carriles por paso**

- Paso 0: opciones desde `REGIONS`/`regionSpecies()` con `group` = región.
- Paso 1: `CLASSES` con `img: /classes/<slug>.jpg` y `sub` = `GROUP_LABEL`.
- Paso 2: `BACKGROUNDS`.
- Pasos 3-5: no son listas → en la columna derecha va el panel del paso
  (`AbilitiesStep`, pericias, ficha), no el `OptionRail`.

Conserva `pickSpecies` / `pickClass` / `pickBackground` tal cual (ya resetean
lo dependiente).

- [ ] **Step 4: Borrar el tomo**

```bash
grep -rn "CharacterBook" --include=*.tsx --include=*.ts . | grep -v node_modules
```
Si no quedan consumidores: `git rm components/CharacterBook.tsx`.
Si queda alguno, **para y repórtalo** (no lo borres a la fuerza).

- [ ] **Step 5: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: limpio.

- [ ] **Step 6: Commit**

```bash
git add -A app/crear/page.tsx app/globals.css components/
git commit -m "feat(crear): el círculo de invocación sustituye al tomo"
```

---

## Task 8: Reset de la tirada por el DM

**Files:**
- Modify: `app/dm/GrupoPanel.tsx`

- [ ] **Step 1: Leer el panel**

Lee `app/dm/GrupoPanel.tsx` para seguir su patrón de acciones por jugador
(botones de nivel/XP ya existentes) y cómo obtiene `user_id`.

- [ ] **Step 2: Añadir la acción**

La policy de `stat_rolls` permite `delete` al DM directamente por RLS
(`is_dm()`), así que **no hace falta endpoint**: usa el cliente de Supabase.
Añade por jugador un botón «Resetear tirada de aptitudes» con confirmación:
```tsx
async function resetStatRoll(uid: string) {
  if (!confirm("¿Resetear la tirada de aptitudes de este jugador? Podrá volver a elegir método y tirar.")) return;
  const { error } = await createClient().from("stat_rolls").delete().eq("user_id", uid);
  if (error) alert(error.message);
}
```
Importa `createClient` de `@/lib/supabase/client` si no está ya.

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: limpio.

- [ ] **Step 4: Commit**

```bash
git add app/dm/GrupoPanel.tsx
git commit -m "feat(dm): resetear la tirada de aptitudes de un jugador"
```

---

## Task 9: Verificación integral

**Files:** ninguno.

- [ ] **Step 1: Comprobaciones y build**

Run: `npx tsx scripts/check-statrolls.ts && npx tsx scripts/check-dice.ts && npx tsx scripts/check-dicebox.ts && npx tsc --noEmit && npm run build`
Expected: todo limpio.

- [ ] **Step 2: Verificación visual (sin sesión)**

`/crear` funciona **sin sesión** (borrador en `localStorage`), así que se
puede abrir en el navegador y comprobar de verdad:
- El círculo con las 6 runas; las posteriores al primer paso incompleto están
  deshabilitadas; pulsar una alcanzable navega.
- Paso Clase: el medallón muestra el **arte real** (p. ej. Mago) y el carril
  las miniaturas; **Paladín/Bardo caen a la silueta** (no hay `.jpg`).
- Paso Especie: silueta + carril agrupado por región.
- Aptitudes sin sesión: "Tirar 4d6" **deshabilitado**; array y point-buy
  funcionan; asignar los 6 valores desbloquea el paso.
- Responsive: a <860px el carril pasa debajo y no se rompe.

- [ ] **Step 3: Actualizar HANDOFF y vault**

- `HANDOFF.md`: sección `## RESUELTO (2026-07-15): Creador — círculo de
  invocación + Fase K` (escena, medallón y regla de arte, Fase K con
  `stat_rolls`, reset del DM, retirada de `CharacterBook`).
- Vault: `00 Meta/Historial de desarrollo.md` (hito) y
  `00 Meta/Pendientes.md` (Fase K hecha; `schema_v13` ya ejecutada).

- [ ] **Step 4: Commit**

```bash
git add HANDOFF.md
git commit -m "docs(crear): registra el círculo de invocación y la Fase K"
```

---

## Self-review (cobertura del spec)

- ✅ Círculo con runas = pasos/navegación, respetando el gate → Task 3, 7.
- ✅ Medallón: arte real / silueta rúnica generativa → Task 2, 7.
- ✅ Carril con miniaturas y grupos por región → Task 4, 7.
- ✅ Los 6 pasos y su reparto de escena → Task 7 (y Task 6 para Aptitudes).
- ✅ Fase K: 3 vías, tirada única, bloqueo por PK/RLS, reset del DM, sin sesión
  solo array/point-buy → Tasks 1, 5, 6, 8.
- ✅ Lógica de estado/validación conservada; `base` sigue siendo la fuente de
  verdad → Tasks 5, 6.
- ✅ `page.tsx` partido por responsabilidad; `CharacterBook` retirado →
  Tasks 2-4, 6, 7.
- ✅ Verificación con checks + build + **navegador real** (sin sesión) → Task 9.
- ✅ `prefers-reduced-motion` en aros y dados → Task 3 (CSS), Task 6 (fallback).

## Decisiones cerradas (no reabrir)
- `schema_v13` **ya está ejecutada** por el usuario: no hay que crear la tabla.
- **No hay endpoint** para el reset del DM: la RLS ya le da `delete`.
- Los dados exigen **sesión**; sin ella solo array/point-buy (si no, el
  bloqueo sería burlable).
- `base` sigue siendo la fuente de verdad de las puntuaciones → `finalScores`,
  `saveCharacter` y la hoja **no se tocan**.
