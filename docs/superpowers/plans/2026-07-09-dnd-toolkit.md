# Plan — Kit D&D completo: datos de clase, ficha automática, dados e iniciativa, crónica y utilidades DM

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir la app en un compañero de mesa completo: datos mecánicos
canónicos de las 13 clases (12 del PHB 2024 + Cazador de Sangre de Critical
Role), cálculo automático de ficha (PG, CA, modificadores, salvaciones,
pericias), tiradas de dados compartidas + iniciativa en vivo, crónica de la
campaña (sesiones, misiones, PNJs) y utilidades del DM (calculadora de
encuentros, notas privadas).

**Architecture:** Datos estáticos en `data/classdata/` (un archivo por clase,
tipos compartidos); motor de derivación puro en `lib/derive.ts` consumido por
`/personaje` y el panel DM; tiempo real vía el patrón existente de Supabase
Realtime (canal único por montaje); persistencia con migraciones encadenadas
(`schema_v11.sql`, `schema_v12.sql`) con RLS + `is_dm()` como las anteriores.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4,
Supabase (Auth+Postgres+Realtime). ⚠️ `AGENTS.md`: este Next 16 tiene cambios
rompedores — ante dudas de API leer `node_modules/next/dist/docs/`.

---

## Contexto del repo (verificado en `ace8b38`)

- `data/rules.ts` — `AbilityKey = "fue"|"des"|"con"|"int"|"sab"|"car"`,
  `ABILITIES`, `SKILLS` (18, nombre ES + aptitud), `abilityMod()`, `fmtMod()`,
  point-buy 2024.
- `data/classes.ts` — 13 clases (slugs: `barbaro, bardo, brujo, clerigo,
  druida, explorador, guerrero, hechicero, mago, monje, paladin, picaro,
  cazador-de-sangre`), 4 subclases por clase, `hitDie`, `group`. Presentación,
  no mecánica.
- `data/leveling.ts` — `proficiencyBonus(level)`, `maxHp(hitDie, level,
  conMod)` (media por defecto), `ASI_LEVELS` por clase, tabla XP 2024.
- `lib/character.ts` — `CharacterData` (base, bonus, skills, items, equipment,
  asi, hp_rolls, level, xp, gold…), `loadCharacter`, `saveCharacter`,
  `useParty`.
- `app/personaje/` — hoja interactiva; el DM edita vía `?user=<id>` con la API
  service_role (`app/api/`). `components/CharacterSheet.tsx`,
  `LevelPanel`, `Paperdoll`.
- `app/dm/DmDashboard.tsx` — pestañas Narración/Grupo/Regiones/Mapa/Usuarios.
- `supabase/schema*.sql` v1→v10; RLS con `is_dm()`; Realtime habilitado por
  tabla con `alter publication supabase_realtime add table …`.
- Hooks realtime: canal `nombre_${Math.random().toString(36).slice(2)}` (React
  monta 2×) — copiar patrón de `lib/useGroupAction.ts`.
- Convención: mecánica y nombres = hechos; descripciones = resúmenes propios
  en español (NUNCA copiar texto de reglas; parafrasear siempre).
- Commits en español, autor `CarlosAlbertt
  <CarlosAlbertt@users.noreply.github.com>`, coautoría Claude según HANDOFF.

Verificación estándar de cada tarea: `npx tsc --noEmit` y, si toca UI,
`npm run build`. Sin framework de tests en el repo: cada tarea de lógica pura
añade un script de comprobación desechable con `npx tsx` cuando se indica.

---

## FASE 1 — Datos mecánicos de las 13 clases

### Task 1: Tipos + primera clase (Bárbaro) como referencia

**Files:**
- Create: `data/classdata/types.ts`
- Create: `data/classdata/barbaro.ts`
- Create: `data/classdata/index.ts`

- [ ] **Step 1: Tipos compartidos**

```ts
// data/classdata/types.ts
// Datos mecánicos por clase (D&D 2024 + Cazador de Sangre de Critical Role).
// Hechos de juego: dados, competencias, progresión. Descripciones: resúmenes
// propios en español.
import type { AbilityKey } from "@/data/rules";

export type CasterKind = "full" | "half" | "pact" | "none";

export type ClassFeature = {
  level: number;
  name: string;        // nombre canónico traducido (p. ej. "Furia")
  blurb: string;       // 1-2 frases PROPIAS en español
  subclass?: boolean;  // true si la otorga la subclase
};

export type ClassMechanics = {
  slug: string;                     // igual que data/classes.ts
  primaryAbility: AbilityKey[];     // p. ej. ["fue"]
  saves: [AbilityKey, AbilityKey];
  skillChoices: { pick: number; from: string[] }; // nombres de SKILLS (ES)
  armor: string[];                  // "ligera" | "media" | "pesada" | "escudos"
  weapons: string[];                // "sencillas" | "marciales" | lista concreta
  startingGold: number;             // opción B de equipo (solo oro)
  startingEquipment: string[];      // opción A, nombres en español
  caster: CasterKind;
  spellAbility?: AbilityKey;        // si caster !== "none"
  features: ClassFeature[];         // niveles 1-20, orden ascendente
  /** columnas extra de la tabla de progresión, por nivel 1-20 */
  resources?: { name: string; values: (number | string)[] }[];
};
```

- [ ] **Step 2: Bárbaro completo** (datos ya extraídos de
  dndbeyond.com/classes/2190875-barbarian; blurbs = redacción propia)

```ts
// data/classdata/barbaro.ts
import type { ClassMechanics } from "./types";

export const BARBARO: ClassMechanics = {
  slug: "barbaro",
  primaryAbility: ["fue"],
  saves: ["fue", "con"],
  skillChoices: { pick: 2, from: ["Trato con Animales", "Atletismo", "Intimidación", "Naturaleza", "Percepción", "Supervivencia"] },
  armor: ["ligera", "media", "escudos"],
  weapons: ["sencillas", "marciales"],
  startingGold: 75,
  startingEquipment: ["Gran hacha", "4 hachas de mano", "Pack de explorador", "15 po"],
  caster: "none",
  features: [
    { level: 1, name: "Furia", blurb: "Canaliza ira primal: ventaja en pruebas y salvaciones de Fuerza, daño extra y resistencia a daño contundente, cortante y perforante." },
    { level: 1, name: "Defensa sin Armadura", blurb: "Sin armadura, la CA es 10 + mod. DES + mod. CON (los escudos siguen valiendo)." },
    { level: 1, name: "Maestría con Armas", blurb: "Usa la propiedad de maestría de 2 armas a tu elección." },
    { level: 2, name: "Sentir el Peligro", blurb: "Ventaja en salvaciones de Destreza salvo que estés incapacitado." },
    { level: 2, name: "Ataque Temerario", blurb: "Ventaja en tus ataques con Fuerza a cambio de que te ataquen con ventaja hasta tu próximo turno." },
    { level: 3, name: "Subclase de Bárbaro", blurb: "Elige tu senda primal.", subclass: true },
    { level: 3, name: "Conocimiento Primal", blurb: "Ganas una pericia de la lista de clase; en furia, ciertas pruebas de habilidad usan Fuerza." },
    { level: 4, name: "Mejora de Característica", blurb: "+2 puntos de característica (o dote)." },
    { level: 5, name: "Ataque Extra", blurb: "Atacas dos veces con la acción de Ataque." },
    { level: 5, name: "Movimiento Rápido", blurb: "+3 m de velocidad sin armadura pesada." },
    { level: 6, name: "Rasgo de subclase", blurb: "Mejora de tu senda.", subclass: true },
    { level: 7, name: "Instinto Salvaje", blurb: "Ventaja en iniciativa; en furia no te sorprenden." },
    { level: 8, name: "Mejora de Característica", blurb: "+2 puntos de característica (o dote)." },
    { level: 9, name: "Golpe Brutal", blurb: "Renuncia a la ventaja del Ataque Temerario para infligir 1d10 extra y un efecto de golpe demoledor." },
    { level: 10, name: "Rasgo de subclase", blurb: "Mejora de tu senda.", subclass: true },
    { level: 11, name: "Furia Implacable", blurb: "Si caes a 0 PG en furia, salvación de CON para quedarte a 1." },
    { level: 12, name: "Mejora de Característica", blurb: "+2 puntos de característica (o dote)." },
    { level: 13, name: "Golpe Brutal Mejorado", blurb: "El dado extra sube y añade nuevos efectos de golpe." },
    { level: 14, name: "Rasgo de subclase", blurb: "Culminación de tu senda.", subclass: true },
    { level: 15, name: "Furia Persistente", blurb: "La furia dura 10 minutos sin mantenerla; recuperas usos al tirar iniciativa." },
    { level: 16, name: "Mejora de Característica", blurb: "+2 puntos de característica (o dote)." },
    { level: 17, name: "Golpe Brutal Mejorado", blurb: "El dado extra sube de nuevo (2d10) y apilas dos efectos." },
    { level: 18, name: "Fuerza Indómita", blurb: "Una prueba de Fuerza nunca baja de tu puntuación de Fuerza." },
    { level: 19, name: "Don Épico", blurb: "Elige un don épico (recomendado: Don de la Fuerza Irresistible)." },
    { level: 20, name: "Campeón Primal", blurb: "+4 a Fuerza y Constitución (máximo 25)." },
  ],
  resources: [
    { name: "Furias", values: [2,2,3,3,3,4,4,4,4,4,4,5,5,5,5,5,6,6,6,6] },
    { name: "Daño de furia", values: ["+2","+2","+2","+2","+2","+2","+2","+2","+3","+3","+3","+3","+3","+3","+3","+4","+4","+4","+4","+4"] },
    { name: "Maestría", values: [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4] },
  ],
};
```

- [ ] **Step 3: Índice**

```ts
// data/classdata/index.ts
import type { ClassMechanics } from "./types";
import { BARBARO } from "./barbaro";

export const CLASS_MECHANICS: Record<string, ClassMechanics> = {
  barbaro: BARBARO,
};
export function getMechanics(slug: string | null | undefined): ClassMechanics | null {
  return (slug && CLASS_MECHANICS[slug]) || null;
}
export type { ClassMechanics, ClassFeature, CasterKind } from "./types";
```

- [ ] **Step 4: Verificar** — `npx tsc --noEmit` limpio.

- [ ] **Step 5: Commit** — `feat: datos mecánicos de clase — tipos + bárbaro`

### Task 2: Las 12 clases restantes desde D&D Beyond

**Files:**
- Create: `data/classdata/{bardo,brujo,clerigo,druida,explorador,guerrero,hechicero,mago,monje,paladin,picaro,cazador-de-sangre}.ts`
- Modify: `data/classdata/index.ts` (registrar todas)

**SOLO estas fuentes (PHB 2024 + Critical Role). Ninguna otra clase:**

| Clase (slug) | URL |
|---|---|
| bardo | https://www.dndbeyond.com/classes/2190876-bard |
| clerigo | https://www.dndbeyond.com/classes/2190877-cleric |
| druida | https://www.dndbeyond.com/classes/2190878-druid |
| guerrero | https://www.dndbeyond.com/classes/2190879-fighter |
| monje | https://www.dndbeyond.com/classes/2190880-monk |
| paladin | https://www.dndbeyond.com/classes/2190881-paladin |
| explorador | https://www.dndbeyond.com/classes/2190882-ranger |
| picaro | https://www.dndbeyond.com/classes/2190883-rogue |
| hechicero | https://www.dndbeyond.com/classes/2190884-sorcerer |
| brujo | https://www.dndbeyond.com/classes/2190885-warlock |
| mago | https://www.dndbeyond.com/classes/2190886-wizard |
| cazador-de-sangre | https://www.dndbeyond.com/classes/357975-blood-hunter |

- [ ] **Step 1..12: Por cada clase** (una a una, commit cada 3-4):
  1. `WebFetch` de la URL con este prompt (extrae HECHOS, no texto):
     «Extract mechanical facts only: hit die, primary ability, saving throw
     proficiencies, skill choices (number + list), armor training, weapon
     proficiencies, starting equipment options A/B, the level 1-20 progression
     table (feature names per level and every resource column such as spell
     slots per level, cantrips known, ki/focus points, sneak attack dice, rage
     count, invocations, sorcery points), and subclass choice level. Do not
     reproduce descriptive text.»
  2. Volcar a `data/classdata/<slug>.ts` con el modelo `ClassMechanics`:
     nombres de rasgos traducidos al español (usa las traducciones ya
     asentadas en `data/classes.ts` si existen), `blurb` de redacción PROPIA
     (1-2 frases), columnas de recursos en `resources` (p. ej. "Espacios de
     conjuro nv1..nv9" para lanzadores completos; "Puntos de hechicería";
     "Dado de ataque furtivo"; "Invocaciones"; "Puntos de foco").
  3. `caster`: bardo/clerigo/druida/hechicero/mago = `full`;
     paladin/explorador = `half`; brujo = `pact`; resto `none`
     (cazador-de-sangre = `none`, su magia va como rasgos). `spellAbility`:
     car (bardo/hechicero/brujo/paladin), sab (clerigo/druida/explorador),
     int (mago).
  4. Registrar en `index.ts`.
- [ ] **Comprobación cruzada**: el `hitDie` de cada archivo debe coincidir con
  `data/classes.ts` (d12 bárbaro; d10 guerrero/paladin/explorador/cazador;
  d6 hechicero/mago; d8 resto). Si D&D Beyond da otro valor, manda D&D Beyond
  y se corrige `classes.ts` en el mismo commit (anotarlo en el mensaje).
- [ ] **Verificar**: `npx tsc --noEmit`; script rápido
  `npx tsx -e "import('./data/classdata/index.ts').then(m => console.log(Object.keys(m.CLASS_MECHANICS).length))"`
  → `13`.
- [ ] **Commit(s)**: `feat: datos mecánicos — <clases>`

### Task 3: Espacios de conjuro compartidos

**Files:**
- Create: `data/classdata/spellSlots.ts`

- [ ] **Step 1**: tabla estándar 2024 de lanzador completo (niveles 1-20 ×
  espacios nv1-nv9), mitad (paladin/explorador) y pacto (brujo: espacios +
  nivel de espacio). Son hechos de juego, transcribir de las tablas obtenidas
  en Task 2.

```ts
// data/classdata/spellSlots.ts
export const FULL_CASTER_SLOTS: number[][] = [
  // índice = nivel-1; valores = espacios de nv1..nv9
  [2,0,0,0,0,0,0,0,0], [3,0,0,0,0,0,0,0,0], [4,2,0,0,0,0,0,0,0],
  // … completar 4-20 con la tabla extraída del PHB 2024 en Task 2
];
export const HALF_CASTER_SLOTS: number[][] = [ /* 1-20, nv1..nv5 */ ];
export const PACT_SLOTS: { count: number; slotLevel: number }[] = [ /* 1-20 */ ];
export function slotsFor(caster: "full" | "half" | "pact", level: number) { /* … */ }
```

- [ ] **Verificar** `npx tsc --noEmit`; sanity: full nivel 20 = 4/3/3/3/3/2/2/1/1.
- [ ] **Commit**: `feat: tablas de espacios de conjuro (full/half/pact)`

---

## FASE 2 — Motor de ficha derivada (PG, CA, salvaciones, pericias)

### Task 4: `lib/derive.ts` (lógica pura)

**Files:**
- Create: `lib/derive.ts`
- Test: `scripts/check-derive.ts` (desechable, `npx tsx`)

- [ ] **Step 1: Implementación**

```ts
// lib/derive.ts — Cálculos derivados de la ficha (sin React, sin Supabase).
import { abilityMod, SKILLS, type AbilityKey } from "@/data/rules";
import { proficiencyBonus, maxHp } from "@/data/leveling";
import { getMechanics } from "@/data/classdata";
import type { CharacterData } from "@/lib/character";

export type Derived = {
  abilities: Record<AbilityKey, { score: number; mod: number }>;
  prof: number;
  maxHp: number;
  ac: number; acSource: string;          // "Armadura (cuero) + DES" | "Defensa sin armadura" | "10 + DES"
  initiative: number;
  saves: Record<AbilityKey, { mod: number; proficient: boolean }>;
  skills: { name: string; ability: AbilityKey; mod: number; proficient: boolean }[];
  passivePerception: number;
  spellDc?: number; spellAttack?: number; // si la clase lanza conjuros
};

export function totalScore(c: Partial<CharacterData>, k: AbilityKey): number {
  const base = c.base?.[k] ?? 10;
  const bonus = c.bonus?.[k] ?? 0;
  const asi = Object.values(c.asi ?? {}).reduce((s, lvl) => s + (lvl?.[k] ?? 0), 0);
  return base + bonus + asi;
}

export function derive(c: Partial<CharacterData>): Derived { /* …ver pasos… */ }
```

Reglas de cálculo:
- **Aptitudes**: `totalScore` (base + bonus trasfondo + ASI acumulado, patrón
  ya usado en `components/CharacterSheet.tsx` — extraer allí la duplicación).
- **PG máx**: usar `maxHp()` de `leveling.ts` pero respetando `hp_rolls`
  (dados tirados sustituyen a la media en su nivel — replicar la lógica del
  `LevelPanel` actual; extraerla aquí para una sola fuente de verdad).
- **CA**: buscar en `c.equipment` la pieza de armadura/escudo (por tipo de
  hueco de `data/equipmentSlots.ts` y nombre en `data/equipment.ts`);
  armadura ligera = base+DES, media = base+DES(máx 2), pesada = base;
  sin armadura → si clase es `barbaro` 10+DES+CON, `monje` 10+DES+SAB,
  resto 10+DES. Escudo +2. Devolver `acSource` explicativo.
- **Salvaciones**: mod + prof si la aptitud está en `mechanics.saves`.
- **Pericias**: mod + prof si `c.skills` contiene el nombre.
- **CD de conjuros**: 8 + prof + mod(spellAbility); ataque = prof + mod.

- [ ] **Step 2: Script de comprobación**

```ts
// scripts/check-derive.ts — ejecutar con: npx tsx scripts/check-derive.ts
import { derive } from "../lib/derive";
const c = { cls: "barbaro", level: 5, base: { fue: 15, des: 14, con: 14, int: 8, sab: 10, car: 10 }, bonus: { fue: 2, des: 0, con: 1, int: 0, sab: 0, car: 0 }, asi: { "4": { fue: 2 } }, skills: ["Atletismo"], equipment: {}, hp_rolls: {} };
const d = derive(c as never);
console.assert(d.abilities.fue.score === 19 && d.abilities.fue.mod === 4, "FUE 19/+4");
console.assert(d.prof === 3, "prof +3 a nivel 5");
console.assert(d.ac === 10 + 2 + 2, "CA sin armadura bárbaro 14 (DES+2, CON+2)");
console.assert(d.saves.fue.proficient && !d.saves.int.proficient, "salvaciones");
console.log("OK", d.maxHp, d.ac, d.acSource);
```

- [ ] **Step 3**: `npx tsx scripts/check-derive.ts` → todos los assert pasan.
- [ ] **Step 4**: borrar el script o dejarlo en `scripts/` (decisión: dejarlo;
  añade cero peso al bundle).
- [ ] **Step 5: Commit** — `feat: lib/derive — ficha derivada (PG, CA, salvaciones, pericias)`

### Task 5: Integrar en la hoja `/personaje` y en el panel DM › Grupo

**Files:**
- Modify: `components/CharacterSheet.tsx` (usar `derive()`; eliminar cálculos duplicados)
- Modify: `app/dm/GrupoPanel.tsx` (mostrar CA, PG máx, salvaciones, CD)

- [ ] **Step 1**: en `CharacterSheet`, reemplazar los cálculos locales de
  mods/PG por `const d = useMemo(() => derive(char), [char])`. Añadir bloque
  de combate: CA (con `acSource` como tooltip/subtítulo), iniciativa,
  percepción pasiva, CD de conjuros si aplica.
- [ ] **Step 2**: bloque "Rasgos de clase" en la hoja: lista de
  `getMechanics(cls).features.filter(f => f.level <= level)` agrupada por
  nivel, con los `blurb`. Los de subclase solo si `subclass` elegida.
- [ ] **Step 3**: recursos de la tabla (`resources`) del nivel actual como
  chips (p. ej. «Furias 3 · Daño +2»). Lanzadores: espacios de conjuro del
  nivel vía `slotsFor()`.
- [ ] **Step 4**: `GrupoPanel` del DM muestra CA/PG/CD calculados por
  `derive()` para cada miembro (ya recibe las fichas por `useParty`).
- [ ] **Step 5**: `npm run build` limpio; probar en dev la hoja con un
  personaje bárbaro y uno lanzador.
- [ ] **Step 6: Commit** — `feat: hoja y panel DM con ficha derivada y rasgos de clase`

---

## FASE 3 — Dados e iniciativa en vivo (pendiente pactado en HANDOFF)

### Task 6: Migración `schema_v11.sql`

**Files:**
- Create: `supabase/schema_v11.sql`

- [ ] **Step 1**:

```sql
-- v11: tiradas de dados compartidas + iniciativa en vivo.
create table if not exists dice_rolls (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'custom',        -- 'ability'|'save'|'skill'|'attack'|'custom'|'requested'
  label text not null default '',              -- "Percepción", "Salvación CON"…
  formula text not null,                       -- "1d20+5"
  rolls int[] not null,                        -- dados individuales
  total int not null,
  private boolean not null default false,      -- solo DM la ve
  request_id bigint,                           -- si responde a una petición
  created_at timestamptz not null default now()
);
create table if not exists roll_requests (
  id bigint generated always as identity primary key,
  target uuid,                                 -- null = todo el grupo
  label text not null,                         -- "Tirad Percepción CD 14"
  formula text not null default '1d20',
  open boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists initiative (
  user_id uuid primary key references auth.users(id) on delete cascade,
  value int,                                   -- null = sin tirar
  is_npc boolean not null default false,
  npc_name text,
  active boolean not null default false,       -- turno actual
  updated_at timestamptz not null default now()
);
alter table dice_rolls enable row level security;
alter table roll_requests enable row level security;
alter table initiative enable row level security;
-- lectura: todos los autenticados (menos privadas, solo dueño o DM)
create policy "rolls read" on dice_rolls for select using (auth.uid() is not null and (not private or user_id = auth.uid() or is_dm()));
create policy "rolls insert propio" on dice_rolls for insert with check (user_id = auth.uid());
create policy "requests read" on roll_requests for select using (auth.uid() is not null);
create policy "requests dm" on roll_requests for all using (is_dm()) with check (is_dm());
create policy "initiative read" on initiative for select using (auth.uid() is not null);
create policy "initiative own" on initiative for insert with check (user_id = auth.uid() or is_dm());
create policy "initiative update" on initiative for update using (user_id = auth.uid() or is_dm());
create policy "initiative dm delete" on initiative for delete using (is_dm());
alter publication supabase_realtime add table dice_rolls, roll_requests, initiative;
```

(Ajustar nombres de policies al estilo exacto de `schema_v10.sql` — revisarlo
antes de ejecutar.)

- [ ] **Step 2**: anotar en `HANDOFF.md` y en el vault (`Pendientes`) que
  v11 queda pendiente de ejecutar en Supabase por el usuario.
- [ ] **Step 3: Commit** — `feat: schema_v11 — dados, peticiones de tirada e iniciativa`

### Task 7: Motor de dados + hook realtime

**Files:**
- Create: `lib/dice.ts` (parser/roller puro)
- Create: `lib/useDice.ts` (realtime, patrón `useGroupAction`)
- Test: `scripts/check-dice.ts`

- [ ] **Step 1**:

```ts
// lib/dice.ts — parser "XdY+Z" y tirada con desglose. Sin dependencias.
export type RollResult = { formula: string; rolls: number[]; modifier: number; total: number };
const RE = /^(\d{1,2})d(\d{1,3})([+-]\d{1,3})?$/i;
export function parseFormula(f: string): { n: number; die: number; mod: number } | null { /* RE */ }
export function roll(f: string): RollResult | null {
  const p = parseFormula(f.replaceAll(" ", ""));
  if (!p || p.n < 1 || p.n > 20) return null;
  const rolls = Array.from({ length: p.n }, () => 1 + Math.floor(Math.random() * p.die));
  return { formula: f, rolls, modifier: p.mod, total: rolls.reduce((a, b) => a + b, 0) + p.mod };
}
export function d20Check(mod: number, adv?: "adv" | "dis"): RollResult { /* 2d20 keep high/low */ }
```

- [ ] **Step 2**: `lib/useDice.ts`: hook que carga últimas 50 tiradas
  (`dice_rolls` order desc), se suscribe a INSERT, expone
  `rollAndPublish(kind, label, formula, priv)` (tira en cliente, inserta fila)
  y `useRollRequests()` para las peticiones abiertas. `useInitiative()`:
  lista ordenada desc por `value`, suscripción a `initiative`, helpers
  `setMyInitiative(v)`, DM: `addNpc(name, v)`, `setActive(userId)`, `clearAll()`.
- [ ] **Step 3**: `npx tsx scripts/check-dice.ts` con asserts de parse
  (`"2d6+3"` ok, `"d20"` null, `"100d6"` null, totales en rango).
- [ ] **Step 4: Commit** — `feat: motor de dados y hooks realtime`

### Task 8: UI — panel de dados del jugador + iniciativa + DM

**Files:**
- Create: `components/DicePanel.tsx` (jugador: botones de salvación/pericia desde `derive()`, fórmula libre, feed en vivo)
- Create: `components/InitiativeTracker.tsx` (lista compartida, turno activo resaltado)
- Create: `app/dm/DadosPanel.tsx` (pestaña DM: pedir tiradas al grupo/individuo, ver privadas, iniciativa con PNJs, avanzar turno)
- Modify: `app/dm/DmDashboard.tsx` (nueva pestaña "Dados")
- Modify: `app/personaje/…` o `components/CharacterSheet.tsx` (botón 🎲 junto a cada salvación/pericia → `rollAndPublish` con el mod derivado)

- [ ] **Step 1**: `DicePanel` — feed (autor, etiqueta, desglose `[14, 3] + 5 = 22`,
  hora), tirador rápido (d4…d100), fórmula libre validada por `parseFormula`.
  Peticiones abiertas del DM aparecen arriba con botón «Tirar» que responde
  con `request_id`.
- [ ] **Step 2**: `InitiativeTracker` — visible para todos (en `/personaje` o
  como flotante durante combate); jugador tira su iniciativa (usa
  `d.initiative` de derive); DM añade PNJs, marca turno activo, limpia ronda.
- [ ] **Step 3**: pestaña DM con todo lo anterior + toggle de tirada privada.
- [ ] **Step 4**: `npm run build`; prueba en dev: tirada visible en dos
  sesiones (dos navegadores), petición del DM llega al jugador.
- [ ] **Step 5: Commit** — `feat: dados compartidos e iniciativa en vivo (jugador + DM)`

---

## FASE 4 — Crónica de la campaña (historia, misiones, PNJs)

### Task 9: Migración `schema_v12.sql`

**Files:**
- Create: `supabase/schema_v12.sql`

- [ ] **Step 1**:

```sql
-- v12: crónica de campaña — sesiones, misiones y PNJs conocidos.
create table if not exists journal_entries (
  id bigint generated always as identity primary key,
  session_no int,                        -- nº de sesión (opcional)
  title text not null,
  body text not null default '',         -- markdown ligero
  game_date text,                        -- fecha exandriana "12 de Sydenstar, 836 PD"
  visible boolean not null default false,-- el DM publica cuando quiere
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists quests (
  id bigint generated always as identity primary key,
  title text not null,
  body text not null default '',
  status text not null default 'activa', -- 'activa'|'completada'|'fallida'|'oculta'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists npcs_met (
  id bigint generated always as identity primary key,
  name text not null,
  role text not null default '',         -- "Tabernera de Emon"
  notes text not null default '',        -- lo que el grupo sabe
  region text,                           -- slug de región (opcional)
  visible boolean not null default true,
  created_at timestamptz not null default now()
);
alter table journal_entries enable row level security;
alter table quests enable row level security;
alter table npcs_met enable row level security;
create policy "journal read" on journal_entries for select using (auth.uid() is not null and (visible or is_dm()));
create policy "journal dm" on journal_entries for all using (is_dm()) with check (is_dm());
create policy "quests read" on quests for select using (auth.uid() is not null and (status <> 'oculta' or is_dm()));
create policy "quests dm" on quests for all using (is_dm()) with check (is_dm());
create policy "npcs read" on npcs_met for select using (auth.uid() is not null and (visible or is_dm()));
create policy "npcs dm" on npcs_met for all using (is_dm()) with check (is_dm());
alter publication supabase_realtime add table journal_entries, quests, npcs_met;
-- fecha de campaña editable por el DM (reutiliza app_config de schema_v5)
insert into app_config (key, value) values ('campaign_date', '1 de Horisal, 836 PD') on conflict (key) do nothing;
```

(Verificar la forma exacta de `app_config` en `schema_v5.sql` antes de usar
`key/value`; adaptar el insert a sus columnas reales.)

- [ ] **Step 2**: anotar migración pendiente en HANDOFF + vault.
- [ ] **Step 3: Commit** — `feat: schema_v12 — crónica de campaña`

### Task 10: Página `/cronica` (jugadores) 

**Files:**
- Create: `app/cronica/page.tsx` + `app/cronica/CronicaView.tsx`
- Create: `lib/useChronicle.ts` (hook realtime de las 3 tablas, patrón habitual)
- Modify: `components/SiteNav.tsx` (enlace "Crónica")

- [ ] **Step 1**: hook `useChronicle()` → `{ entries, quests, npcs }` con
  suscripción realtime (solo filas visibles llegan por RLS).
- [ ] **Step 2**: vista con 3 secciones: **Diario** (entradas ordenadas por
  sesión, con fecha exandriana como eyebrow), **Misiones** (activas arriba,
  completadas colapsadas), **Personajes conocidos** (tarjetas por región).
  Fecha de campaña actual en la cabecera (leer `app_config.campaign_date`,
  mismo mecanismo que `ollama_host` en el panel de IA).
- [ ] **Step 3**: `npm run build`; vista vacía elegante si no hay entradas.
- [ ] **Step 4: Commit** — `feat: /cronica — diario, misiones y PNJs para el grupo`

### Task 11: Editor del DM (pestaña "Crónica")

**Files:**
- Create: `app/dm/CronicaPanel.tsx`
- Modify: `app/dm/DmDashboard.tsx` (pestaña)

- [ ] **Step 1**: CRUD de entradas de diario (borrador → publicar con
  `visible`), misiones (cambiar estado), PNJs (visible/oculto). Campo de
  fecha de campaña (escribe `app_config.campaign_date`) con las festividades
  de `data/cosmology.ts` sugeridas si la fecha coincide.
- [ ] **Step 2**: escritura vía cliente normal (RLS `is_dm()` ya autoriza al
  DM autenticado; NO hace falta la API service_role aquí).
- [ ] **Step 3**: `npm run build`; crear entrada en dev, verla publicada en
  `/cronica` en otra sesión.
- [ ] **Step 4: Commit** — `feat: panel DM de crónica (diario, misiones, PNJs, fecha)`

---

## FASE 5 — Utilidades extra del DM

### Task 12: Calculadora de encuentros + notas privadas

**Files:**
- Create: `data/encounters.ts` (presupuesto XP por nivel y dificultad, tabla DMG 2024 — hechos de juego)
- Create: `app/dm/EncuentrosPanel.tsx`
- Modify: `app/dm/DmDashboard.tsx` (sub-pestaña dentro de "Dados" o pestaña propia "Mesa")

- [ ] **Step 1**: `data/encounters.ts` — tabla XP de presupuesto por PJ y
  dificultad (baja/moderada/alta, DMG 2024) + XP por CR de monstruo (CR 0 →
  10 XP … CR 30 → 155.000 XP; tabla estándar).
- [ ] **Step 2**: panel: composición del grupo se autolee de `useParty()`
  (niveles reales); el DM añade monstruos por CR y cantidad → el panel dice
  presupuesto usado y dificultad resultante; botón «Repartir XP» que reutiliza
  la API `addXp` existente para todo el grupo (XP total / nº de PJs).
- [ ] **Step 3**: notas privadas del DM por región y por jugador: columna
  `dm_notes text` — **decisión**: guardar en `app_config` como JSON
  (`dm_notes`) para evitar otra migración; solo lo lee/escribe el DM.
- [ ] **Step 4**: `npm run build` + prueba en dev.
- [ ] **Step 5: Commit** — `feat: calculadora de encuentros y notas del DM`

---

## Cierre

- [ ] Actualizar `HANDOFF.md`: nuevas migraciones v11-v12 pendientes de
  ejecutar, nuevas rutas (`/cronica`), pestañas DM nuevas, y el estado de la
  spec de lore (`docs/wildemount-lore-spec.md`) si no se ha ejecutado aún.
- [ ] Actualizar vault Obsidian: `00 Meta/Historial de desarrollo.md` (nuevo
  milestone) y `00 Meta/Pendientes.md` (migraciones v11/v12).
- [ ] `npm run build` final limpio + push.

## Fuera de alcance (NO hacer)

- Clases fuera de PHB 2024 + Cazador de Sangre (nada de Artificer, Gunslinger,
  Monster Hunter, Pugilist ni clases de terceros).
- Compendio de conjuros completo (solo espacios/CD; las listas de conjuros
  conocidos son una fase futura).
- Bestiario de monstruos con statblocks (la calculadora usa CR+XP, no fichas).
- Automatización de combate (daño automático, condiciones): solo tiradas e
  iniciativa.
