# Fase O1 — Recursos de clase — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que los pozos de usos de clase (furias, puntos de foco, canalizar divinidad, segundo aliento…) se gasten con un toque en la hoja y los restaure el descanso.

**Architecture:** Los pozos ya existen como columnas de la tabla de progresión en `data/classdata/`; lo que falta es (1) marcar cuáles son gastables y con qué descanso recargan, (2) una capa pura que resuelva «cuántos me quedan» y (3) estado persistido en una columna jsonb nueva, `characters.play_state`, que la Fase O2 reutilizará para los conjuros.

**Tech Stack:** Next.js 16 · React 19 · TypeScript · Supabase (Postgres + RLS).

**Spec:** `docs/superpowers/specs/2026-07-21-fase-o1-recursos-de-clase-design.md`

**Rama:** `fase-o1-recursos`, partiendo de `master`.

---

## Sobre los tests en este repo

No hay framework de tests. El gate es `npx tsc --noEmit` + `npx next build`, y lo
puro se verifica con un script (`scripts/check-clima.ts`, `check-lore.ts`).
Ciclo: **comprobación → verla fallar → implementar → verla pasar → commit**.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `data/classdata/types.ts` (modificar) | `ClassResource.spend` marca los pozos. |
| `data/classdata/*.ts` (modificar, 9) | Marcar los pozos de cada clase. |
| `lib/recursos.ts` (crear) | Resolución PURA: máximos por nivel, gastar, devolver, recargar. |
| `supabase/schema_v20.sql` (crear) | `characters.play_state jsonb`. |
| `lib/character.ts` (modificar) | `play_state` en el tipo y en el SELECT. |
| `components/personaje/PozosClase.tsx` (crear) | Los contadores pulsables. |
| `components/CharacterSheet.tsx` (modificar) | Monta los contadores, retira las chapas estáticas. |
| `app/api/descanso/route.ts` (modificar) | El descanso recarga. |
| `app/api/dm/character/route.ts` (modificar) | Operación `setUses`. |
| `app/dm/GrupoPanel.tsx` (modificar) | El DM ve y ajusta los pozos. |
| `scripts/check-clases.ts` (crear) | Comprobaciones. |

---

### Task 1: marcar los pozos en los datos

**Files:** Modify `data/classdata/types.ts` · Modify 9 archivos de clase · Create `scripts/check-clases.ts`

- [ ] **Step 1: Escribir el script de comprobación (falla)**

Crear `scripts/check-clases.ts` con el patrón de `scripts/check-clima.ts` (helper
`check(label, cond)`, contador `failures`, `process.exit`):

```ts
// Comprobación manual de los pozos de clase. Uso: npx tsx scripts/check-clases.ts
import { CLASS_MECHANICS } from "../data/classdata";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const clases = Object.values(CLASS_MECHANICS);
check("hay 14 clases con mecánicas", clases.length === 14);

for (const c of clases) {
  for (const r of c.resources ?? []) {
    check(`${c.slug} · ${r.name}: 20 niveles`, r.values.length === 20);
    if (!r.spend) continue;
    check(`${c.slug} · ${r.name}: el pozo es numérico`, r.values.every((v) => typeof v === "number"));
    const nums = r.values as number[];
    check(`${c.slug} · ${r.name}: nunca decrece al subir`, nums.every((v, i) => i === 0 || v >= nums[i - 1]));
    check(`${c.slug} · ${r.name}: recarga declarada`, r.spend.recharge === "corto" || r.spend.recharge === "largo");
    check(`${c.slug} · ${r.name}: key en kebab-case`, /^[a-z0-9-]+$/.test(r.spend.key));
  }
  const keys = (c.resources ?? []).filter((r) => r.spend).map((r) => r.spend!.key);
  check(`${c.slug}: sin keys de pozo repetidas`, new Set(keys).size === keys.length);
}

const todasLasKeys = clases.flatMap((c) => (c.resources ?? []).filter((r) => r.spend).map((r) => r.spend!.key));
check("hay al menos 12 pozos marcados en total", todasLasKeys.length >= 12);

console.log(failures ? `\n${failures} comprobación(es) fallida(s)` : "\nTodo en verde");
process.exit(failures ? 1 : 0);
```

**Comprueba antes** cómo se llama el export agregado de `data/classdata/index.ts`
(puede ser `CLASS_MECHANICS`, `MECHANICS` u otro) y ajusta el import. **No
inventes el nombre**: ábrelo y míralo.

- [ ] **Step 2: Verla fallar**

Run: `npx tsx scripts/check-clases.ts`
Expected: falla en «hay al menos 12 pozos marcados» (aún no hay ninguno).

- [ ] **Step 3: El tipo**

En `data/classdata/types.ts`, sustituir el tipo inline de `resources` por uno con
nombre y añadir `spend`:

```ts
export type ClassResource = {
  name: string;
  values: (number | string)[];
  /**
   * Solo los POZOS: columnas que se gastan y se recargan al descansar. Las que
   * no lo declaran son de REFERENCIA (daño de furia, dado de artes marciales):
   * se consultan al usar el rasgo, no se gastan.
   */
  spend?: { key: string; recharge: "corto" | "largo" };
};
```

Y en `ClassMechanics`: `resources?: ClassResource[];`

- [ ] **Step 4: Marcar los pozos**

Añadir `spend` a **estas columnas exactas**, y **solo** a estas. El resto de
columnas se quedan como están (son referencia o cuentas de «conocidos»).

| Archivo | Columna | `key` | `recharge` |
|---|---|---|---|
| `barbaro.ts` | Furias | `furias` | `largo` |
| `clerigo.ts` | Usos de Canalizar Divinidad | `canalizar-divinidad` | `corto` |
| `druida.ts` | Usos de Forma Salvaje | `forma-salvaje` | `corto` |
| `explorador.ts` | Usos de Enemigo Predilecto | `enemigo-predilecto` | `largo` |
| `guerrero.ts` | Usos de Segundo Aliento | `segundo-aliento` | `corto` |
| `guerrero.ts` | Usos de Acción Sorpresiva | `accion-sorpresiva` | `corto` |
| `guerrero.ts` | Usos de Indomable | `indomable` | `largo` |
| `hechicero.ts` | Puntos de hechicería | `puntos-de-hechiceria` | `largo` |
| `monje.ts` | Puntos de foco | `puntos-de-foco` | `corto` |
| `paladin.ts` | Usos de Canalizar Divinidad | `canalizar-divinidad` | `corto` |
| `paladin.ts` | Reserva de Imposición de Manos | `imposicion-de-manos` | `largo` |

**NO marcar** (son referencia o cuentas de conocidos, no pozos): `Daño de furia`,
`Maestría`, `Dado de Artes Marciales`, `Dado de ataque furtivo`, `Dado de
Inspiración Bárdica`, `Dado de hemocraft`, `Trucos`, `Conjuros preparados`,
`Invocaciones`, `Maldiciones de sangre conocidas`, `RD máximo de Forma Salvaje`,
`Ataques por acción de Atacar`, `Maestría con Armas`.

**Si al abrir un archivo la columna se llama distinto de lo que dice la tabla**,
no la renombres ni inventes: usa el nombre real y **dilo en el informe**.

**Clases que se quedan sin pozo en O1** — anótalo en el informe, no lo
implementes: **bardo** (los usos de Inspiración Bárdica salen del modificador de
Carisma, no de una columna), **mago** (Recuperación Arcana), **pícaro**,
**brujo** y **cazador de sangre**. Necesitan pozos derivados de característica o
de fórmula, y eso es una pasada aparte.

- [ ] **Step 5: Verla pasar**

Run: `npx tsx scripts/check-clases.ts` → `Todo en verde`, con 11 pozos marcados.

> Si el check «al menos 12 pozos» falla por uno, **no marques un pozo de más para
> que pase**: baja el umbral a 11 y dilo. La cifra la fijan los datos.

Run: `npx tsc --noEmit` → sin salida.

- [ ] **Step 6: Commit**

```bash
git add data/classdata scripts/check-clases.ts
git commit -m "feat(clases): marcar que columnas son pozos de usos y como recargan"
```

---

### Task 2: `lib/recursos.ts`, la capa pura

**Files:** Create `lib/recursos.ts` · Modify `scripts/check-clases.ts`

- [ ] **Step 1: Escribir las comprobaciones (fallan)**

Añadir a `scripts/check-clases.ts`:

```ts
import { pozosDe, referenciasDe, gastar, devolver, recargar, type PlayState } from "../lib/recursos";

const VACIO: PlayState = {};

const barb1 = pozosDe("barbaro", 1, VACIO);
check("bárbaro nv1 tiene 2 furias", barb1.length === 1 && barb1[0].max === 2 && barb1[0].quedan === 2);
const barb12 = pozosDe("barbaro", 12, VACIO);
check("bárbaro nv12 tiene 5 furias", barb12[0].max === 5);

const monje1 = pozosDe("monje", 1, VACIO);
check("monje nv1 no lista el foco (max 0)", monje1.length === 0);
const monje2 = pozosDe("monje", 2, VACIO);
check("monje nv2 tiene 2 de foco", monje2.length === 1 && monje2[0].max === 2);

check("el pícaro no tiene pozos", pozosDe("picaro", 5, VACIO).length === 0);
check("el bárbaro tiene referencias que consultar", referenciasDe("barbaro", 5).some((r) => r.name.includes("Daño")));

let p: PlayState = gastar(VACIO, "furias", 2);
check("gastar descuenta", pozosDe("barbaro", 1, p)[0].quedan === 1);
p = gastar(p, "furias", 2);
p = gastar(p, "furias", 2);
check("gastar no pasa del máximo", pozosDe("barbaro", 1, p)[0].quedan === 0 && p.usos!["furias"] === 2);
p = devolver(p, "furias");
check("devolver recupera uno", pozosDe("barbaro", 1, p)[0].quedan === 1);
p = devolver(devolver(devolver(p, "furias"), "furias"), "furias");
check("devolver no baja de cero", (p.usos?.["furias"] ?? 0) === 0);

// El guerrero mezcla pozos de corto y de largo: buen caso para la recarga.
let g: PlayState = gastar(gastar(VACIO, "segundo-aliento", 2), "indomable", 1);
const gCorto = recargar(g, "guerrero", 9, "corto");
check("el descanso corto solo recarga lo suyo", (gCorto.usos?.["segundo-aliento"] ?? 0) === 0 && gCorto.usos?.["indomable"] === 1);
const gLargo = recargar(g, "guerrero", 9, "largo");
check("el descanso largo lo recarga todo", (gLargo.usos?.["segundo-aliento"] ?? 0) === 0 && (gLargo.usos?.["indomable"] ?? 0) === 0);

// O2 escribirá `huecos` en el mismo jsonb: recargar no debe pisarlo.
const conO2 = recargar({ usos: { furias: 1 }, huecos: { "1": 2 } } as PlayState, "barbaro", 5, "largo");
check("recargar no toca las claves de otras fases", JSON.stringify((conO2 as Record<string, unknown>).huecos) === '{"1":2}');
```

- [ ] **Step 2: Verla fallar**

Run: `npx tsx scripts/check-clases.ts` → error de compilación, `lib/recursos.ts` no existe.

- [ ] **Step 3: Implementar**

```ts
// Resolución PURA de los pozos de usos de clase. Sin React ni Supabase, mismo
// espíritu que lib/derive.ts y lib/gameClock.ts.
//
// Se guarda lo GASTADO, no lo restante: el máximo depende del nivel, así que si
// el personaje sube de nivel los usos nuevos le llegan solos.

import { CLASS_MECHANICS } from "@/data/classdata";

/** Estado de juego de la ficha. La Fase O2 añadirá `huecos`/`preparados`. */
export type PlayState = {
  usos?: Record<string, number>;
  [otros: string]: unknown;
};

export type Pozo = {
  key: string;
  name: string;
  max: number;
  gastados: number;
  quedan: number;
  recharge: "corto" | "largo";
};

function mecanicas(clsSlug: string) {
  return CLASS_MECHANICS[clsSlug];
}

/** Pozos de esa clase a ese nivel. Los que aún valen 0 NO se listan. */
export function pozosDe(clsSlug: string, level: number, play: PlayState): Pozo[] {
  const m = mecanicas(clsSlug);
  if (!m?.resources) return [];
  const i = Math.max(0, Math.min(19, Math.floor(level) - 1));
  const out: Pozo[] = [];
  for (const r of m.resources) {
    if (!r.spend) continue;
    const max = Number(r.values[i]) || 0;
    if (max <= 0) continue;
    const gastados = Math.min(max, Math.max(0, play.usos?.[r.spend.key] ?? 0));
    out.push({ key: r.spend.key, name: r.name, max, gastados, quedan: max - gastados, recharge: r.spend.recharge });
  }
  return out;
}

/** Columnas de referencia (daño de furia, dado de artes marciales…) al nivel. */
export function referenciasDe(clsSlug: string, level: number): { name: string; value: string }[] {
  const m = mecanicas(clsSlug);
  if (!m?.resources) return [];
  const i = Math.max(0, Math.min(19, Math.floor(level) - 1));
  return m.resources
    .filter((r) => !r.spend)
    .map((r) => ({ name: r.name, value: String(r.values[i]) }))
    .filter((r) => r.value && r.value !== "0" && r.value !== "—");
}

export function gastar(play: PlayState, key: string, max: number): PlayState {
  const usos = { ...(play.usos ?? {}) };
  usos[key] = Math.min(max, (usos[key] ?? 0) + 1);
  return { ...play, usos };
}

export function devolver(play: PlayState, key: string): PlayState {
  const usos = { ...(play.usos ?? {}) };
  usos[key] = Math.max(0, (usos[key] ?? 0) - 1);
  return { ...play, usos };
}

/** Descansar: corto recarga solo los suyos; largo, todos. Nunca toca otras claves. */
export function recargar(play: PlayState, clsSlug: string, level: number, tipo: "corto" | "largo"): PlayState {
  const usos = { ...(play.usos ?? {}) };
  for (const p of pozosDe(clsSlug, level, play)) {
    if (tipo === "largo" || p.recharge === "corto") usos[p.key] = 0;
  }
  return { ...play, usos };
}
```

**Comprueba** el nombre y la forma reales del export agregado de
`data/classdata/index.ts` antes de usar `CLASS_MECHANICS[clsSlug]`: si es un
array en vez de un `Record`, adapta `mecanicas()` con un `.find()`. **No lo
adivines.**

- [ ] **Step 4: Verla pasar**

Run: `npx tsx scripts/check-clases.ts` → `Todo en verde`.
Run: `npx tsc --noEmit` → sin salida.

- [ ] **Step 5: Commit**

```bash
git add lib/recursos.ts scripts/check-clases.ts
git commit -m "feat(clases): capa pura de pozos, gastar, devolver y recargar"
```

---

### Task 3: la migración y el tipo de la ficha

**Files:** Create `supabase/schema_v20.sql` · Modify `lib/character.ts`

- [ ] **Step 1: La migración**

`supabase/schema_v20.sql`:

```sql
-- Fase O1: estado de juego de la ficha (usos de pozos de clase). La Fase O2
-- reutilizará esta MISMA columna para los huecos de conjuro y los preparados,
-- con claves distintas dentro del jsonb — no hará falta otra migración.
-- Idempotente y SOLO AÑADE: no reestructura nada (a diferencia de la v14).
alter table public.characters
  add column if not exists play_state jsonb not null default '{}'::jsonb;
```

No hacen falta cambios de RLS ni de Realtime: `characters` ya los tiene y la
columna viaja con la fila.

- [ ] **Step 2: El tipo y el SELECT**

En `lib/character.ts`:
- añadir `play_state: Record<string, unknown>;` a `CharacterData`;
- añadir `, play_state` a la lista de columnas del SELECT (línea ~71);
- donde se construya una ficha vacía, `play_state: {}`.

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit` → sin salida.
Run: `npx next build` → build limpio.

- [ ] **Step 4: Commit**

```bash
git add supabase/schema_v20.sql lib/character.ts
git commit -m "feat(clases): migracion v20, play_state en la ficha"
```

---

### Task 4: los contadores en la hoja

**Files:** Create `components/personaje/PozosClase.tsx` · Modify `components/CharacterSheet.tsx`

- [ ] **Step 1: `PozosClase.tsx`**

```tsx
"use client";
import { pozosDe, referenciasDe, gastar, devolver, type PlayState } from "@/lib/recursos";

// Los pozos de usos de la clase, con puntos pulsables. Un toque gasta; un toque
// en un punto ya gastado lo devuelve (para deshacer un error de mesa sin tener
// que llamar al DM).
export default function PozosClase({
  clsSlug, level, play, onChange, readOnly = false,
}: {
  clsSlug: string;
  level: number;
  play: PlayState;
  onChange: (next: PlayState) => void;
  readOnly?: boolean;
}) {
  const pozos = pozosDe(clsSlug, level, play);
  const refs = referenciasDe(clsSlug, level);
  if (!pozos.length && !refs.length) return null;

  return (
    <div className="mb-4 space-y-3">
      {pozos.map((p) => (
        <div key={p.key}>
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <p className="font-ui text-[13px] font-bold" style={{ color: "var(--color-parch)" }}>{p.name}</p>
            <p className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>
              {p.quedan} de {p.max} · recarga con descanso {p.recharge}
            </p>
          </div>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {Array.from({ length: p.max }, (_, i) => {
              const usado = i < p.gastados;
              return (
                <button
                  key={i}
                  disabled={readOnly}
                  onClick={() => onChange(usado ? devolver(play, p.key) : gastar(play, p.key, p.max))}
                  title={usado ? "Devolver un uso" : "Gastar un uso"}
                  className="w-5 h-5 rounded-full transition-colors disabled:cursor-default"
                  style={{
                    background: usado ? "transparent" : "var(--color-bronze)",
                    border: `2px solid var(--color-bronze${usado ? "-deep" : ""})`,
                  }}
                />
              );
            })}
          </div>
        </div>
      ))}

      {refs.length > 0 && (
        <p className="font-ui text-[12px]" style={{ color: "var(--color-muted)" }}>
          {refs.map((r) => `${r.name} ${r.value}`).join(" · ")}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Montarlo en la hoja**

En `components/CharacterSheet.tsx`, sección «Rasgos de clase» (~línea 606):

- **Retirar** el bloque de `resourceChips` (las chapas estáticas), **dejando** el
  de `spellSlotChips` como está — los conjuros son la Fase O2.
- En su lugar, montar `<PozosClase … />` con el `play_state` de la ficha y un
  `onChange` que guarde con `saveCharacter` de forma **optimista** (refleja el
  cambio al instante y persiste en paralelo), como el resto de la hoja.
- En la hoja de **solo lectura** (la que ve el DM en Grupo), pasar `readOnly`.

**Lee el componente antes de tocarlo** para ver cómo obtiene la ficha y cómo
guarda los demás campos; **sigue ese patrón**, no introduzcas uno nuevo.

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit` → sin salida.
Run: `npx next build` → build limpio.

- [ ] **Step 4: Commit**

```bash
git add components/personaje/PozosClase.tsx components/CharacterSheet.tsx
git commit -m "feat(clases): contadores de usos pulsables en la hoja"
```

---

### Task 5: el descanso recarga

**Files:** Modify `app/api/descanso/route.ts` · Modify `lib/descanso.ts`

- [ ] **Step 1: Implementar**

En `app/api/descanso/route.ts`, donde ya se carga la ficha con `admin`:

- ampliar el `select` a `id, gold, cls, level, play_state`;
- tras cobrar el oro y antes de responder, calcular
  `recargar(play_state, cls, level, kind)` con `lib/recursos.ts` y escribirlo en
  el mismo `update` de la ficha;
- devolver `play_state` en la respuesta JSON.

En `lib/descanso.ts` (el cliente), propagar ese `play_state` al llamante para que
la hoja se refresque sin recargar la página.

**Cuidado**: `recargar` necesita el slug de clase y el nivel. Si la ficha no
tiene clase (personaje a medio crear), **no falles**: deja `play_state` como
estaba y sigue con el descanso normal.

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit` → sin salida.
Run: `npx next build` → build limpio.

- [ ] **Step 3: Commit**

```bash
git add app/api/descanso/route.ts lib/descanso.ts
git commit -m "feat(clases): el descanso recarga los pozos de usos"
```

---

### Task 6: el DM ajusta los pozos

**Files:** Modify `app/api/dm/character/route.ts` · Modify `app/dm/GrupoPanel.tsx`

- [ ] **Step 1: La operación en el endpoint**

En `app/api/dm/character/route.ts`, junto a `setLevel`/`addXp`/`unlockLore`,
añadir `setUses`:

```ts
  // El DM ajusta un pozo a mano: devolver una furia, vaciar el foco.
  if (setUses && typeof setUses.key === "string") {
    const prev = ((row?.play_state as { usos?: Record<string, number> }) ?? {}).usos ?? {};
    update.play_state = { ...(row?.play_state as object ?? {}), usos: { ...prev, [setUses.key]: Math.max(0, Math.floor(setUses.gastados)) } };
  }
```

Declararlo en el destructuring y en el tipo del `patch`, y **añadir `play_state`
al `select` de la fila previa** (si no, se pisaría el resto del jsonb).

- [ ] **Step 2: La UI del DM**

En `app/dm/GrupoPanel.tsx`, bajo cada jugador, montar `PozosClase` con su ficha y
un `onChange` que llame a `/api/dm/character` con `setUses`. **Lee el panel antes
de tocarlo** y sigue el patrón con el que ya llama a ese endpoint para el resto
de operaciones.

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit` → sin salida.
Run: `npx next build` → build limpio.

- [ ] **Step 4: Commit**

```bash
git add app/api/dm/character/route.ts app/dm/GrupoPanel.tsx
git commit -m "feat(clases): el DM ve y ajusta los pozos del grupo"
```

---

### Task 7: gate final, documentación y merge

**Files:** Modify `HANDOFF.md`

- [ ] **Step 1: Gate completo**

Run: `npx tsx scripts/check-clases.ts` → `Todo en verde`.
Run: `npx tsx scripts/check-lore.ts` → `Todo en verde` (69, no debería haberse tocado).
Run: `npx tsc --noEmit` → sin salida.
Run: `npx next build` → build limpio.

- [ ] **Step 2: Documentar**

En `HANDOFF.md`: sección `## RESUELTO (2026-07-21): Fase O1 — recursos de clase ⚔️`
con el modelo de datos, la tabla de pozos marcados, las clases que se quedan sin
pozo y por qué, y la verificación. **Actualizar el bloque de arranque rápido con
el aviso de que `schema_v20.sql` está PENDIENTE de ejecutar**, que es la primera
migración nueva desde que el usuario las puso todas al día.

- [ ] **Step 3: Commit y merge**

```bash
git add HANDOFF.md
git commit -m "docs(handoff): fase O1, recursos de clase"
git checkout master
git merge --no-ff fase-o1-recursos
git push origin master
```

---

## Autorrevisión del plan

**Cobertura del spec:**

| Requisito | Task |
|---|---|
| `ClassResource.spend` y marcado de pozos | 1 |
| `lib/recursos.ts` puro | 2 |
| `schema_v20.sql` + `play_state` | 3 |
| Contadores en la hoja, chapas estáticas fuera | 4 |
| El descanso recarga (corto vs largo) | 5 |
| `setUses` + Panel DM › Grupo | 6 |
| `scripts/check-clases.ts` | 1 y 2 |
| Documentación y migración avisada | 7 |

**Consistencia de tipos:** `PlayState` y `Pozo` se definen en la Task 2 y se
consumen con esos nombres en 4, 5 y 6. `spend: { key, recharge }` se define en la
Task 1 y lo lee `pozosDe` en la 2. `PozosClase` recibe
`{ clsSlug, level, play, onChange, readOnly? }` en la Task 4 y así lo llaman la
hoja (4) y el panel del DM (6).

**Tres verificaciones que el implementador DEBE hacer antes de escribir**: el
nombre real del export agregado de `data/classdata/index.ts` (Tasks 1 y 2), el
nombre real de cada columna a marcar (Task 1), y el patrón de guardado que ya usa
`CharacterSheet` (Task 4). El plan lo avisa en los tres sitios.
