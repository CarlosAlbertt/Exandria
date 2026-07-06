# Hoja de personaje interactiva — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir `/personaje`, una hoja de personaje interactiva (nivel + ASI 2024, aptitudes, PG, oro, inventario de objetos enriquecidos y muñeco de equipo con huecos dinámicos), y un botón "Crear personaje" que finaliza el creador y navega allí.

**Architecture:** Next.js 16 (App Router) + React 19 + TS + Tailwind v4 + Supabase. Lógica pura de reglas en `data/leveling.ts` y `data/equipmentSlots.ts`. Componentes `LevelPanel` y `Paperdoll`. Página hub `app/personaje/page.tsx` que orquesta el estado y reutiliza el patrón de carga/guardado de `app/inventario/page.tsx`. Migración `schema_v8`.

**Tech Stack:** TypeScript, React 19 client components, Tailwind v4 tokens en `app/globals.css`, Supabase (`lib/supabase`, `lib/character.ts`), Font Awesome 6.5.1 Free.

---

## Notas para el ejecutor (leer antes de empezar)

- **Rama:** `personaje-hoja-interactiva` (ya creada). No cambies de rama.
- **Next 16 rompe cosas** (`AGENTS.md`): ante dudas de API de Next lee `node_modules/next/dist/docs/`. Para navegación programática usa `useRouter` de `next/navigation` (App Router), no `next/router`.
- **Sin test runner** (solo `next`/`eslint`/`tsc`). Verificación = puertas: `npx tsc --noEmit`, `npm run build`, `npm run lint` (no introducir errores nuevos; el repo tiene ~22 pre-existentes en `lib/*`), y preview visual con `preview_*` en el server de dev del puerto **3100** (el del usuario está en 3000; no lo toques).
- **Commits:** autor ya configurado. Cada commit termina con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Al hacer `git add`, **añade solo los archivos de la tarea** (no `git add -A`: evita commitear `next-env.d.ts` autogenerado).
- **Fuente de verdad:** `docs/superpowers/specs/2026-07-07-hoja-personaje-interactiva-design.md`.
- **Patrón de referencia de UI y de carga/guardado:** `app/inventario/page.tsx` (cómo carga de nube/localStorage y autoguarda) y `app/crear/page.tsx` (estado del build). Sigue su estilo (clases `panel`, `panel-raised`, `chip`, `btn-gold`, `btn-ghost`, `eyebrow`, tokens `var(--color-*)`).

---

## Task 1: Migración schema_v8 + tipos en lib/character.ts

**Files:**
- Create: `supabase/schema_v8.sql`
- Modify: `lib/character.ts`

- [ ] **Step 1: Crear la migración**

`supabase/schema_v8.sql`:

```sql
-- v8: hoja interactiva — nivel, oro, ASI, equipo e inventario enriquecido.
alter table public.characters add column if not exists level int not null default 1;
alter table public.characters add column if not exists gold int not null default 0;
alter table public.characters add column if not exists asi jsonb not null default '{}'::jsonb;
alter table public.characters add column if not exists equipment jsonb not null default '{}'::jsonb;
alter table public.characters add column if not exists items jsonb not null default '[]'::jsonb;
```

- [ ] **Step 2: Extender tipos y FIELDS en `lib/character.ts`**

Añadir el tipo `Item`, ampliar `CharacterData`, e incluir las columnas nuevas en `FIELDS`. Sustituir el bloque de tipos y `FIELDS` por:

```ts
export type Item = { id: string; name: string; qty: number; notes?: string };

export type Asi = Record<string, Partial<Record<AbilityKey, number>>>;

export type CharacterData = {
  name: string;
  species: string | null;
  lineage: string | null;
  cls: string | null;
  subclass: string | null;
  background: string | null;
  base: Record<AbilityKey, number>;
  bonus: Record<AbilityKey, number>;
  skills: string[];
  inventory: string[];        // legado (text[]); ya no se escribe
  items: Item[];              // inventario enriquecido
  equipment: Record<string, Item>;
  asi: Asi;
  level: number;
  gold: number;
  lore: string;
};

const FIELDS =
  "name, species, lineage, cls, subclass, background, base, bonus, skills, inventory, items, equipment, asi, level, gold, lore";
```

- [ ] **Step 3: Retrocompatibilidad inventory→items en `loadCharacter`**

Sustituir el cuerpo de `loadCharacter` para migrar el inventario antiguo cuando `items` esté vacío:

```ts
export async function loadCharacter(userId: string): Promise<Partial<CharacterData> | null> {
  if (!supabaseConfigured || !userId) return null;
  const { data } = await createClient().from("characters").select(FIELDS).eq("user_id", userId).maybeSingle();
  if (!data) return null;
  const row = data as Partial<CharacterData>;
  // Legado: si no hay items pero sí inventory (text[]), conviértelo.
  if ((!row.items || row.items.length === 0) && Array.isArray(row.inventory) && row.inventory.length) {
    row.items = row.inventory.map((name, i) => ({ id: `legacy-${i}`, name, qty: 1 }));
  }
  return row;
}
```

Asegúrate de que `AbilityKey` sigue importado arriba (`import type { AbilityKey } from "@/data/rules";`).

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit`
Expected: exit 0 (el resto del código que usa `CharacterData` sigue compilando; los campos nuevos son opcionales en los usos actuales porque se leen como `Partial`).
Si algún consumidor (p. ej. `app/dm/GrupoPanel.tsx`) rompe por el tipo, ábrelo y ajústalo mínimamente (no cambies su comportamiento).

- [ ] **Step 5: Commit**

```bash
git add supabase/schema_v8.sql lib/character.ts
git commit -m "feat: schema_v8 (nivel/oro/asi/equipo/items) + tipos de character

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Reglas de nivel/ASI (`data/leveling.ts`)

**Files:**
- Create: `data/leveling.ts`

- [ ] **Step 1: Crear el módulo con funciones puras**

`data/leveling.ts`:

```ts
// Reglas de progresión (D&D 2024): niveles de mejora de característica (ASI),
// competencia, PG, y config de huecos de accesorio dinámicos.
import type { AbilityKey } from "./rules";

/** Niveles de ASI por slug de clase (los que difieren del estándar). */
export const ASI_LEVELS: Record<string, number[]> = {
  guerrero: [4, 6, 8, 12, 14, 16, 19],
  picaro: [4, 8, 10, 12, 16, 19],
};
export const DEFAULT_ASI_LEVELS = [4, 8, 12, 16, 19];

export function asiLevelsFor(clsSlug: string | null | undefined): number[] {
  return (clsSlug && ASI_LEVELS[clsSlug]) || DEFAULT_ASI_LEVELS;
}

/** Hitos de ASI ya alcanzados a un nivel dado. */
export function reachedAsiLevels(clsSlug: string | null | undefined, level: number): number[] {
  return asiLevelsFor(clsSlug).filter((l) => l <= level);
}

/** Puntos de ASI totales disponibles (2 por hito alcanzado). */
export function asiPoints(clsSlug: string | null | undefined, level: number): number {
  return reachedAsiLevels(clsSlug, level).length * 2;
}

/** Competencia 2024: 2 + floor((nivel-1)/4). Nivel se acota a 1..20. */
export function proficiencyBonus(level: number): number {
  const l = Math.max(1, Math.min(20, level));
  return 2 + Math.floor((l - 1) / 4);
}

/** PG máximo: nivel 1 = dado + modCon; siguientes = (dado/2 + 1 + modCon) c/u. */
export function maxHp(hitDie: number, level: number, conMod: number): number {
  const l = Math.max(1, Math.min(20, level));
  const first = hitDie + conMod;
  const perLevel = Math.floor(hitDie / 2) + 1 + conMod;
  return Math.max(1, first + (l - 1) * perLevel);
}

/** Config de huecos de accesorio dinámicos. count = max(min, mult*mod). */
export const ACCESSORY_SLOTS: { type: string; label: string; stat: AbilityKey; mult: number; min: number }[] = [
  { type: "anillo", label: "Anillo", stat: "int", mult: 2, min: 0 },
  { type: "colgante", label: "Colgante", stat: "sab", mult: 1, min: 0 },
  { type: "amuleto", label: "Amuleto", stat: "car", mult: 1, min: 0 },
];

/** Accesorio fijo: 1 collar. */
export const FIXED_ACCESSORY = { type: "collar", label: "Collar", count: 1 };

export function accessoryCount(mult: number, mod: number, min: number): number {
  return Math.max(min, mult * mod);
}
```

- [ ] **Step 2: Verificar valores en una comprobación rápida (Node)**

Run:
```bash
node -e "const L=require('esbuild')?0:0" 2>/dev/null; echo "skip"
```
(No hay runtime TS directo; en su lugar verifica por lectura que: `proficiencyBonus(1)=2`, `(5)=3`, `(9)=4`; `maxHp(10,1,2)=12`, `maxHp(10,2,2)=20`; `accessoryCount(2,3,0)=6`, `accessoryCount(1,-1,0)=0`.) Luego:

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add data/leveling.ts
git commit -m "feat: reglas de nivel/ASI/PG y config de huecos de accesorio

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Definiciones de huecos de equipo (`data/equipmentSlots.ts`)

**Files:**
- Create: `data/equipmentSlots.ts`

- [ ] **Step 1: Crear el módulo**

Antes de fijar los iconos, comprueba que existen en Font Awesome 6.5.1 **Free** (sólido). Si alguno es Pro, sustitúyelo por un equivalente Free (p. ej. casco → `fa-hat-cowboy` no; usa `fa-chess-rook` o `fa-shield-halved` como genérico). Iconos seguros en Free sólido: `fa-shield-halved`, `fa-shirt`, `fa-hand-fist`, `fa-mitten`, `fa-person`, `fa-boot` (verificar), `fa-khanda`, `fa-gem`, `fa-ring`, `fa-hat-wizard`. Usa los que existan; el objetivo es que rendericen, no la exactitud del dibujo.

`data/equipmentSlots.ts`:

```ts
// Huecos fijos del muñeco de equipo. Los accesorios dinámicos se generan
// en runtime a partir de data/leveling.ts (ACCESSORY_SLOTS + FIXED_ACCESSORY).
export type SlotDef = { id: string; label: string; icon: string; kind: "armadura" | "arma" };

export const ARMOR_SLOTS: SlotDef[] = [
  { id: "cabeza", label: "Cabeza", icon: "fa-chess-rook", kind: "armadura" },
  { id: "torso", label: "Torso", icon: "fa-shirt", kind: "armadura" },
  { id: "antebrazos", label: "Antebrazos", icon: "fa-hand-fist", kind: "armadura" },
  { id: "manos", label: "Manos", icon: "fa-mitten", kind: "armadura" },
  { id: "piernas", label: "Piernas", icon: "fa-person", kind: "armadura" },
  { id: "pies", label: "Pies", icon: "fa-shoe-prints", kind: "armadura" },
];

export const WEAPON_SLOTS: SlotDef[] = [
  { id: "arma_principal", label: "Principal", icon: "fa-khanda", kind: "arma" },
  { id: "arma_secundaria", label: "Secundaria", icon: "fa-shield-halved", kind: "arma" },
];
```

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add data/equipmentSlots.ts
git commit -m "feat: definiciones de huecos de armadura y armas del muñeco

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Componente LevelPanel (`components/LevelPanel.tsx`)

**Files:**
- Create: `components/LevelPanel.tsx`

Componente controlado: recibe nivel, clase, aptitudes base+trasfondo, el reparto `asi`, y callbacks. Muestra el stepper de nivel, competencia/PG derivados, y por cada hito alcanzado un bloque de reparto **+2** entre aptitudes (con tope 20 sobre el total y control de que no se repartan más de 2 por hito).

- [ ] **Step 1: Crear el componente**

```tsx
"use client";

import { ABILITIES, AbilityKey, abilityMod, fmtMod } from "@/data/rules";
import { reachedAsiLevels, proficiencyBonus, maxHp } from "@/data/leveling";
import type { Asi } from "@/lib/character";

type Props = {
  level: number;
  onLevel: (n: number) => void;
  clsSlug: string | null;
  hitDie: number;
  /** base + trasfondo (sin ASI) por aptitud */
  preAsi: Record<AbilityKey, number>;
  asi: Asi;
  onAsi: (levelKey: string, key: AbilityKey, delta: number) => void;
};

/** Suma del reparto ASI de un hito. */
function sumAsi(a: Partial<Record<AbilityKey, number>> | undefined): number {
  if (!a) return 0;
  return (Object.values(a) as number[]).reduce((s, v) => s + (v ?? 0), 0);
}

/** Total ASI acumulado por aptitud a lo largo de todos los hitos. */
export function asiTotals(asi: Asi): Record<AbilityKey, number> {
  const out = { fue: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 } as Record<AbilityKey, number>;
  for (const lvl of Object.keys(asi)) {
    for (const k of Object.keys(asi[lvl]) as AbilityKey[]) out[k] += asi[lvl][k] ?? 0;
  }
  return out;
}

export default function LevelPanel({ level, onLevel, clsSlug, hitDie, preAsi, asi, onAsi }: Props) {
  const hitos = reachedAsiLevels(clsSlug, level);
  const totals = asiTotals(asi);
  const conTotal = preAsi.con + totals.con;
  const hp = maxHp(hitDie, level, abilityMod(conTotal));
  const prof = proficiencyBonus(level);

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <p className="eyebrow">Nivel</p>
          <button className="stat-btn" onClick={() => onLevel(Math.max(1, level - 1))} disabled={level <= 1}>−</button>
          <span className="font-display text-2xl font-extrabold w-10 text-center" style={{ color: "var(--color-arcane-bright)" }}>{level}</span>
          <button className="stat-btn" onClick={() => onLevel(Math.min(20, level + 1))} disabled={level >= 20}>+</button>
        </div>
        <div className="flex gap-5">
          <div className="text-center"><p className="eyebrow !text-[9px]">PG máx</p><p className="font-display font-extrabold" style={{ color: "var(--color-ember)" }}>{hp}</p></div>
          <div className="text-center"><p className="eyebrow !text-[9px]">Comp.</p><p className="font-display font-extrabold" style={{ color: "var(--color-bronze)" }}>{fmtMod(prof)}</p></div>
        </div>
      </div>

      {hitos.length === 0 ? (
        <p className="font-ui text-[13px]" style={{ color: "var(--color-dim)" }}>Aún sin mejoras de característica (primera en el nivel {reachedAsiLevels(clsSlug, 20)[0] ?? 4}).</p>
      ) : (
        <div className="space-y-3">
          {hitos.map((lv) => {
            const spent = sumAsi(asi[String(lv)]);
            return (
              <div key={lv} className="panel-raised p-3">
                <p className="eyebrow mb-2">Mejora de nivel {lv} · <span style={{ color: spent === 2 ? "var(--color-primitivo)" : "var(--color-ember)" }}>{spent}/2</span></p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ABILITIES.map((a) => {
                    const cur = asi[String(lv)]?.[a.key] ?? 0;
                    const total = preAsi[a.key] + totals[a.key];
                    const canInc = spent < 2 && total < 20;
                    return (
                      <div key={a.key} className="flex items-center gap-1.5">
                        <span className="font-ui text-[11px] font-bold w-8" style={{ color: "var(--color-muted)" }}>{a.abbr}</span>
                        <button className="stat-btn !w-7 !h-7" onClick={() => onAsi(String(lv), a.key, -1)} disabled={cur <= 0}>−</button>
                        <span className="font-ui font-bold w-5 text-center" style={{ color: "var(--color-bronze-bright)" }}>+{cur}</span>
                        <button className="stat-btn !w-7 !h-7" onClick={() => onAsi(String(lv), a.key, +1)} disabled={!canInc}>+</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/LevelPanel.tsx
git commit -m "feat: LevelPanel (nivel + reparto de mejoras ASI, PG/competencia)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Componente Paperdoll (`components/Paperdoll.tsx`)

**Files:**
- Create: `components/Paperdoll.tsx`
- Modify: `app/globals.css` (estilos del muñeco)

Muñeco anatómico (layout A). Recibe el mapa de equipo, los modificadores de aptitud (para huecos dinámicos), el retrato y callbacks de equipar/retirar. Un hueco vacío muestra icono+etiqueta; ocupado muestra el nombre del objeto y permite retirar.

- [ ] **Step 1: CSS del muñeco (append a `app/globals.css`)**

Lee el final de `app/globals.css` y añade al final:

```css
/* ===== Muñeco de equipo (paperdoll) ===== */
.pd-slot {
  background: var(--color-raised); border: 1px solid var(--color-line);
  border-radius: 8px; min-height: 54px; padding: 6px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; cursor: pointer; color: var(--color-bronze);
}
.pd-slot[data-filled="true"] { border-color: color-mix(in srgb, var(--color-bronze) 45%, var(--color-line)); color: var(--color-warm); }
.pd-slot[data-over="true"] { border-color: var(--color-ember); color: var(--color-ember); }
.pd-slot .pd-ic { font-size: 18px; }
.pd-slot .pd-lb { font-size: 9px; text-transform: uppercase; letter-spacing: .3px; color: var(--color-dim); margin-top: 2px; }
.pd-slot .pd-nm { font-size: 12px; font-weight: 600; line-height: 1.15; }
.pd-grid { display: grid; grid-template-columns: 64px 1fr 64px; grid-auto-rows: 54px; gap: 8px; align-items: stretch; }
.pd-figure { grid-column: 2; grid-row: 1 / 5; border-radius: 10px; overflow: hidden; }
.pd-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 8px; margin-top: 10px; }
```

- [ ] **Step 2: Crear el componente**

```tsx
"use client";

import PortraitFrame from "@/components/PortraitFrame";
import { AbilityKey } from "@/data/rules";
import { ARMOR_SLOTS, WEAPON_SLOTS } from "@/data/equipmentSlots";
import { ACCESSORY_SLOTS, FIXED_ACCESSORY, accessoryCount } from "@/data/leveling";
import type { Item } from "@/lib/character";

type Props = {
  equipment: Record<string, Item>;
  mods: Record<AbilityKey, number>;
  portrait?: string;
  portraitAlt: string;
  onSlotClick: (slotId: string) => void; // vacío = intentar equipar; lleno = retirar
};

/** Genera los ids de hueco de accesorio según los modificadores actuales. */
export function accessorySlotIds(mods: Record<AbilityKey, number>): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [{ id: FIXED_ACCESSORY.type, label: FIXED_ACCESSORY.label }];
  for (const a of ACCESSORY_SLOTS) {
    const n = accessoryCount(a.mult, mods[a.stat], a.min);
    for (let i = 1; i <= n; i++) out.push({ id: `${a.type}_${i}`, label: `${a.label} ${n > 1 ? i : ""}`.trim() });
  }
  return out;
}

function Slot({ id, label, icon, item, over, onClick }: { id: string; label: string; icon?: string; item?: Item; over?: boolean; onClick: () => void }) {
  return (
    <button className="pd-slot" data-filled={!!item} data-over={over} onClick={onClick} title={item ? `${item.name} — clic para retirar` : label}>
      {item ? (
        <span className="pd-nm">{item.name}</span>
      ) : (
        <>
          <i className={`fas ${icon ?? "fa-plus"} pd-ic`} />
          <span className="pd-lb">{label}</span>
        </>
      )}
    </button>
  );
}

export default function Paperdoll({ equipment, mods, portrait, portraitAlt, onSlotClick }: Props) {
  const accIds = accessorySlotIds(mods);
  // Huecos "de sobra": objetos equipados en accesorios dinámicos que ya no existen.
  const validIds = new Set([
    ...ARMOR_SLOTS.map((s) => s.id), ...WEAPON_SLOTS.map((s) => s.id), ...accIds.map((a) => a.id),
  ]);
  const overflow = Object.keys(equipment).filter((k) => !validIds.has(k));

  return (
    <div className="panel p-5">
      <p className="eyebrow mb-3">Equipo</p>
      <div className="pd-grid">
        {/* columna izquierda: cabeza, torso, antebrazos, manos */}
        <Slot id="cabeza" label="Cabeza" icon={ARMOR_SLOTS[0].icon} item={equipment.cabeza} onClick={() => onSlotClick("cabeza")} />
        <div className="pd-figure"><PortraitFrame src={portrait} alt={portraitAlt} size="lg" icon="fa-user" /></div>
        <Slot id="torso" label="Torso" icon={ARMOR_SLOTS[1].icon} item={equipment.torso} onClick={() => onSlotClick("torso")} />
        <Slot id="antebrazos" label="Antebrazos" icon={ARMOR_SLOTS[2].icon} item={equipment.antebrazos} onClick={() => onSlotClick("antebrazos")} />
        <Slot id="manos" label="Manos" icon={ARMOR_SLOTS[3].icon} item={equipment.manos} onClick={() => onSlotClick("manos")} />
        <Slot id="piernas" label="Piernas" icon={ARMOR_SLOTS[4].icon} item={equipment.piernas} onClick={() => onSlotClick("piernas")} />
        <Slot id="pies" label="Pies" icon={ARMOR_SLOTS[5].icon} item={equipment.pies} onClick={() => onSlotClick("pies")} />
      </div>

      <p className="eyebrow mt-4 mb-2">Armas</p>
      <div className="pd-row">
        {WEAPON_SLOTS.map((s) => (
          <Slot key={s.id} id={s.id} label={s.label} icon={s.icon} item={equipment[s.id]} onClick={() => onSlotClick(s.id)} />
        ))}
      </div>

      <p className="eyebrow mt-4 mb-2">Accesorios</p>
      <div className="pd-row">
        {accIds.map((a) => (
          <Slot key={a.id} id={a.id} label={a.label} icon="fa-gem" item={equipment[a.id]} onClick={() => onSlotClick(a.id)} />
        ))}
        {overflow.map((k) => (
          <Slot key={k} id={k} label="De sobra" item={equipment[k]} over onClick={() => onSlotClick(k)} />
        ))}
      </div>
      {overflow.length > 0 && (
        <p className="text-[12px] mt-2 italic" style={{ color: "var(--color-ember)" }}>Hay accesorios equipados que ya no caben (bajó el modificador). Clic para retirarlos.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit` → exit 0.
Run: `npm run build` → exit 0.

- [ ] **Step 4: Commit**

```bash
git add components/Paperdoll.tsx app/globals.css
git commit -m "feat: Paperdoll (muñeco de equipo, huecos fijos + accesorios dinámicos)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Página /personaje (`app/personaje/page.tsx`)

**Files:**
- Create: `app/personaje/page.tsx`

Hub que orquesta todo. Estado local con carga (nube/localStorage) y autoguardado con debounce, **siguiendo el patrón de `app/inventario/page.tsx`** (lee ese archivo y replica el flujo de `loadCharacter`/`saveCharacter` + `cloud.current`). Debe:

1. Cargar `CharacterData` (nombre, especie, linaje, cls, subclass, background, base, bonus, level, gold, asi, items, equipment). Fallback a `localStorage` (`taldorei.build.v1` para el build; para los campos nuevos usa una clave `taldorei.sheet.v1`).
2. Calcular: `preAsi[k] = base[k] + bonus[k]`; `asiTotals(asi)`; `finalScores[k] = preAsi[k] + asiTotals[k]`; `mods[k] = abilityMod(finalScores[k])`; `hitDie` de `getClass(cls)`; `hp = maxHp(...)`; `prof = proficiencyBonus(level)`.
3. Renderizar paneles: **Identidad** (PortraitFrame `/species/<slug>.jpg`, nombre, especie·linaje·clase·subclase·trasfondo, nivel), **LevelPanel**, **Aptitudes** (6 cajas con `finalScores`+mod, solo lectura), **Derivados** (PG máx, competencia, iniciativa=`fmtMod(mods.des)`, velocidad de la especie, CA editable con estado propio, por defecto `10 + mods.des`), **Oro** (stepper+input), **Inventario** (objetos `Item`: añadir personalizado + catálogo `data/equipment.ts`, cantidad ±, notas opcional, capacidad `20 + 2*mods.fue` con la regla actual, botón **Equipar**), **Paperdoll**.
4. Estado vacío: si no hay `species`/`cls` (como en `/inventario`), mostrar CTA "Crear personaje" → `/crear`.

Lógica de equipar/retirar (defínela en el componente):

```ts
// items: Item[]; equipment: Record<string, Item>
const equipInto = (slotId: string, item: Item) => {
  setEquipment((eq) => {
    const next = { ...eq };
    // devuelve al inventario lo que hubiera en el hueco
    if (next[slotId]) setItems((it) => [...it, next[slotId]]);
    next[slotId] = { ...item, qty: 1 };
    return next;
  });
  setItems((it) => removeOne(it, item.id)); // baja 1 de cantidad o elimina si llega a 0
};
const unequip = (slotId: string) => {
  setEquipment((eq) => {
    const it = eq[slotId]; if (!it) return eq;
    setItems((prev) => addBack(prev, it)); // suma al inventario (apila por nombre)
    const next = { ...eq }; delete next[slotId]; return next;
  });
};
// onSlotClick(slotId): si equipment[slotId] existe → unequip; si no → abrir selector de objeto del inventario para ese hueco.
```

Helpers `removeOne(items, id)` y `addBack(items, item)` (apila por nombre; genera `id` con `crypto.randomUUID()` para objetos nuevos). El "selector de objeto para el hueco" puede ser un estado `pickingSlot: string|null` que, cuando está activo, resalta el inventario y al pulsar un objeto llama `equipInto(pickingSlot, item)`.

Autoguardado (debounce ~700ms) que persiste `{ level, gold, asi, items, equipment }` (y CA si decides guardarla; si no, CA es sólo de sesión — decláralo). Reusa `saveCharacter(userId, {...})`.

- [ ] **Step 1: Implementar la página** siguiendo lo anterior y el patrón de `app/inventario/page.tsx`. Usa las clases del tema (`panel`, `panel-raised`, `chip`, `btn-gold`, `btn-ghost`, `eyebrow`, `stat-btn`) y `PortraitFrame`, `LevelPanel`, `Paperdoll`.

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit` → exit 0.
Run: `npm run build` → exit 0.

- [ ] **Step 3: Verificación visual (controlador)**

Con el dev server en :3100: navegar a `/personaje`, comprobar identidad, subir nivel (aparecen hitos ASI y reparte +2, PG/competencia cambian), editar oro, añadir un objeto personalizado, equiparlo en un hueco (desaparece del inventario y aparece en el muñeco), retirarlo (vuelve), y que al cambiar INT/SAB/CAR (vía ASI) cambian los huecos de anillo/colgante/amuleto. Móvil. `preview_console_logs` sin errores.

- [ ] **Step 4: Commit**

```bash
git add app/personaje/page.tsx
git commit -m "feat: página /personaje (hoja interactiva: nivel, oro, inventario, equipo)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Botón "Crear personaje" + redirect de /inventario

**Files:**
- Modify: `app/crear/page.tsx` (componente `StepSummary`)
- Modify: `app/inventario/page.tsx`

- [ ] **Step 1: Botón en el capítulo Ficha**

En `app/crear/page.tsx`, importar `useRouter` de `next/navigation` en el componente principal y pasarlo (o usarlo dentro de `StepSummary` declarando `"use client"` ya presente). En `StepSummary`, junto a "Copiar hoja", añadir:

```tsx
<button className="btn-gold" onClick={() => { onCreate(); }}>
  <i className="fas fa-user-plus mr-2" />Crear personaje
</button>
```

`onCreate` (definido en `CrearPage` y pasado a `StepSummary`): asegura `level:1` en el guardado y navega:

```tsx
const router = useRouter();
const onCreate = () => {
  if (userId) saveCharacter(userId, { level: 1 });
  else localStorage.setItem("taldorei.sheet.v1", JSON.stringify({ level: 1 }));
  router.push("/personaje");
};
```

Cambiar el enlace existente "Ir al inventario" de `StepSummary` a "Ir a la ficha" → `/personaje`.

- [ ] **Step 2: Redirect de `/inventario`**

Sustituir `app/inventario/page.tsx` por una redirección a `/personaje` (client):

```tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InventarioRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/personaje"); }, [router]);
  return null;
}
```

(La lógica de inventario ya vive en `/personaje`.)

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit` → exit 0.
Run: `npm run build` → exit 0.
Visual (:3100): completar el creador, pulsar "Crear personaje" → navega a `/personaje`; visitar `/inventario` → redirige a `/personaje`.

- [ ] **Step 4: Commit**

```bash
git add app/crear/page.tsx app/inventario/page.tsx
git commit -m "feat: botón Crear personaje (→/personaje) y redirect de /inventario

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Verificación final + HANDOFF

**Files:**
- Modify: `HANDOFF.md`

- [ ] **Step 1: Puertas finales**

Run: `npx tsc --noEmit` → exit 0.
Run: `npm run lint` → sin errores nuevos (comparar con baseline ~22 en `lib/*`).
Run: `npm run build` → exit 0, `/personaje` en la lista de rutas.

- [ ] **Step 2: Repaso visual** (:3100): flujo completo crear→ficha, nivel/ASI, oro, inventario, equipar/retirar, huecos dinámicos, móvil. Screenshots. `preview_console_logs` sin errores.

- [ ] **Step 3: HANDOFF**

En `HANDOFF.md`, añadir bajo "RESUELTO" el nuevo bloque: hoja interactiva `/personaje` (nivel+ASI 2024, oro, inventario enriquecido, muñeco de equipo con huecos dinámicos), botón Crear personaje, redirect `/inventario`. Anotar **PENDIENTE del usuario: ejecutar `supabase/schema_v8.sql`**. Mantener el backlog (dados/iniciativa).

- [ ] **Step 4: Commit**

```bash
git add HANDOFF.md
git commit -m "docs: HANDOFF — hoja de personaje interactiva

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Cobertura del spec (autorrevisión)

- §1 datos/schema_v8 → Task 1. §2 leveling → Task 2. §3 huecos → Task 3 (fijos) + Task 2 (dinámicos). §4 página/paneles → Tasks 4, 5, 6. §5 botón Crear → Task 7. §6 redirect inventario → Task 7. §7 archivos → Tasks 1-7. §8 persistencia → Task 6. §9 verificación → Tasks + Task 8. §10 fases → estructura.
- Consistencia de tipos: `Item`, `Asi`, `CharacterData` (Task 1) usados igual en `LevelPanel`/`Paperdoll`/página; `accessoryCount`/`ACCESSORY_SLOTS`/`FIXED_ACCESSORY` (Task 2) usados en `Paperdoll` (Task 5); `ARMOR_SLOTS`/`WEAPON_SLOTS` (Task 3) en `Paperdoll`; `asiTotals` exportado en `LevelPanel` y reusado en la página.
```
