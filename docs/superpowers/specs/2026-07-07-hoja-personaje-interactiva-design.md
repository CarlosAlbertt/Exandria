# Diseño — Hoja de personaje interactiva (`/personaje`)

Fecha: 2026-07-07
Estado: aprobado para plan de implementación
Rama: `personaje-hoja-interactiva`

## Objetivo

Convertir la creación de personaje en algo jugable: un botón **"Crear personaje"**
que finaliza la ficha y abre una **hoja interactiva** en `/personaje` con nivel y
mejoras de característica (ASI), aptitudes, PG, oro, inventario de objetos
personalizados y un **panel de equipo tipo muñeco** (paperdoll) con huecos de
armadura, armas y accesorios dinámicos.

## Decisiones (brainstorming)

- **Ubicación:** página nueva `/personaje` (hub). "Crear personaje" en el capítulo
  Ficha de `/crear` finaliza y navega allí. `/inventario` **redirige** a `/personaje`.
- **Nivel/ASI:** reglas 2024 por clase. Nivel 1-20; +2 a repartir por hito (cap 20).
- **Datos:** objetos enriquecidos `{ name, qty, notes }`, `equipment` (mapa
  hueco→objeto), `gold` entero. Migración Supabase `schema_v8`.
- **Paperdoll:** layout anatómico (retrato central + huecos por su sitio).
- **Accesorios dinámicos por modificador:** collar 1 fijo; **anillos = 2×mód INT**;
  **colgantes = 1×mód SAB**; **amuletos = 1×mód CAR** (mín. 0). Recalcula en vivo.

## No-objetivos (YAGNI)

- No calcular CA/ataques/daño desde los objetos (son texto libre). CA = campo manual.
- No dotes (feats) en las ASI: solo +2 a repartir.
- No tocar el tomo `/crear` salvo añadir el botón "Crear personaje".
- No multiclase.

---

## 1. Modelo de datos (`supabase/schema_v8.sql`)

Añadir columnas a `public.characters` (idempotente, `add column if not exists`):

```sql
alter table public.characters add column if not exists level int not null default 1;
alter table public.characters add column if not exists gold int not null default 0;
alter table public.characters add column if not exists asi jsonb not null default '{}'::jsonb;
alter table public.characters add column if not exists equipment jsonb not null default '{}'::jsonb;
alter table public.characters add column if not exists items jsonb not null default '[]'::jsonb;
```

- `level`: 1-20.
- `gold`: entero ≥ 0.
- `asi`: `{ "<nivelHito>": { fue?:number, ... } }` — reparto acumulado por hito.
- `equipment`: `{ "<slotId>": Item }` (slotIds en §4).
- `items`: `Item[]` (inventario enriquecido).

`Item` (TS):
```ts
export type Item = { id: string; name: string; qty: number; notes?: string };
```

Retrocompatibilidad: `lib/character.ts` mapea el antiguo `inventory: string[]` a
`items` si `items` está vacío y `inventory` tiene datos (una sola vez, al cargar).
`inventory` (text[]) se conserva en el schema; deja de escribirse.

`CharacterData` (en `lib/character.ts`) gana: `level`, `gold`, `asi`, `equipment`,
`items`. `FIELDS` incluye las nuevas columnas.

> **PENDIENTE del usuario:** ejecutar `schema_v8.sql` en Supabase (como las
> migraciones previas). Sin ejecutarla, la nube ignora las columnas nuevas; el
> `localStorage` funciona igual.

## 2. Reglas de nivel/ASI/PG (`data/leveling.ts`)

```ts
import type { AbilityKey } from "./rules";

/** Niveles de mejora de característica por slug de clase (2024). */
export const ASI_LEVELS: Record<string, number[]> = {
  guerrero: [4, 6, 8, 12, 14, 16, 19],
  picaro: [4, 8, 10, 12, 16, 19],
  // resto: estándar
};
export const DEFAULT_ASI_LEVELS = [4, 8, 12, 16, 19];

export function asiLevelsFor(clsSlug: string | null | undefined): number[] {
  return (clsSlug && ASI_LEVELS[clsSlug]) || DEFAULT_ASI_LEVELS;
}
/** Hitos ya alcanzados a un nivel dado. */
export function reachedAsiLevels(clsSlug: string | null | undefined, level: number): number[] {
  return asiLevelsFor(clsSlug).filter((l) => l <= level);
}
/** Competencia 2024: 2 + floor((nivel-1)/4). */
export function proficiencyBonus(level: number): number {
  return 2 + Math.floor((Math.max(1, Math.min(20, level)) - 1) / 4);
}
/** PG: nivel 1 = dado + mod CON; niveles siguientes = media del dado + mod CON. */
export function maxHp(hitDie: number, level: number, conMod: number): number {
  const first = hitDie + conMod;
  const avgPerLevel = Math.floor(hitDie / 2) + 1 + conMod; // media redondeada arriba
  return Math.max(1, first + Math.max(0, level - 1) * avgPerLevel);
}

/** Config de huecos de accesorio dinámicos. count = max(min, mult*mod). */
export const ACCESSORY_SLOTS: { type: string; label: string; stat: AbilityKey; mult: number; min: number }[] = [
  { type: "anillo", label: "Anillo", stat: "int", mult: 2, min: 0 },
  { type: "colgante", label: "Colgante", stat: "sab", mult: 1, min: 0 },
  { type: "amuleto", label: "Amuleto", stat: "car", mult: 1, min: 0 },
];
/** Collar fijo: 1. */
export const FIXED_ACCESSORY = { type: "collar", label: "Collar", count: 1 };

export function accessoryCount(mult: number, mod: number, min: number): number {
  return Math.max(min, mult * mod);
}
```

- Total ASI a repartir = `reachedAsiLevels(cls, level).length * 2` puntos; cada
  aptitud tope 20 (base+trasfondo+ASI). El `asi` guarda el reparto; la UI valida
  que la suma no exceda los puntos disponibles ni el tope 20.
- Al **bajar** de nivel, los hitos perdidos se retiran del `asi` (recorte).

## 3. Huecos de equipo (`data/leveling.ts` o `data/equipmentSlots.ts`)

Huecos fijos (1 c/u):
`cabeza, torso, antebrazos, manos, piernas, pies` (armadura) ·
`arma_principal, arma_secundaria` (armas) · `collar` (accesorio fijo).

Huecos dinámicos: para cada `ACCESSORY_SLOTS[i]`, `count = accessoryCount(...)`
huecos con id `"<type>_<n>"` (p. ej. `anillo_1`, `anillo_2`).

```ts
export const ARMOR_SLOTS = [
  { id: "cabeza", label: "Cabeza", icon: "fa-helmet-battle" },
  { id: "torso", label: "Torso", icon: "fa-shirt" },
  { id: "antebrazos", label: "Antebrazos", icon: "fa-hand-fist" },
  { id: "manos", label: "Manos", icon: "fa-mitten" },
  { id: "piernas", label: "Piernas", icon: "fa-person" },
  { id: "pies", label: "Pies", icon: "fa-boot" },
];
export const WEAPON_SLOTS = [
  { id: "arma_principal", label: "Principal", icon: "fa-sword" },
  { id: "arma_secundaria", label: "Secundaria", icon: "fa-shield" },
];
```

(Los nombres de icono se verifican contra los disponibles en Font Awesome 6.5.1
Free al implementar; si alguno es Pro, se usa un equivalente Free.)

## 4. Página `/personaje` (`app/personaje/page.tsx`)

Client component. Carga/guarda con el patrón de `/inventario` (nube con sesión,
`localStorage` sin ella), añadiendo los campos nuevos. Autoguardado con debounce.

Paneles (secciones apiladas, responsivas):

1. **Identidad** — `PortraitFrame` (retrato de especie), nombre, especie·linaje ·
   clase·subclase · trasfondo · nivel actual.
2. **Nivel y mejoras** (`components/LevelPanel.tsx`) — stepper de nivel 1-20;
   muestra competencia y PG derivados; por cada hito alcanzado, un bloque de
   reparto **+2** entre aptitudes (steppers con tope 20 y control del total).
3. **Aptitudes** — 6 cajas: total = base + trasfondo + ASI, con modificador. Solo
   lectura (el reparto se hace en el panel de nivel; el base/trasfondo viene del
   creador).
4. **Derivados** — PG (editable el actual, máximo calculado), competencia,
   iniciativa (`fmtMod(mod DES)`), velocidad (de la especie), **CA** editable
   (por defecto 10 + mod DES).
5. **Oro** — entero editable (stepper + input).
6. **Inventario** — objetos `Item`; añadir personalizado (nombre) + catálogo
   (`data/equipment.ts`), cantidad ajustable, notas; capacidad `20 + 2×mod FUE`
   (regla actual). Botón **Equipar** por objeto → elige hueco compatible libre.
7. **Equipo** (`components/Paperdoll.tsx`) — muñeco: retrato central; armadura por
   su sitio; armas; accesorios (collar + dinámicos). Clic en hueco ocupado =
   retirar (vuelve al inventario). Huecos "de sobra" (si bajó el modificador y hay
   objetos equipados que ya no caben) se marcan y permiten retirar.

## 5. Botón "Crear personaje" (`app/crear/page.tsx`)

En el capítulo **Ficha** (`StepSummary`), añadir botón **"Crear personaje"** que:
- Garantiza `level: 1` si no existe, hace `saveCharacter` (o guarda build en
  `localStorage`) y **navega a `/personaje`** (`useRouter().push`).
- Se habilita cuando la ficha está completa (mismos requisitos que hoy: nombre,
  especie+linaje, clase+subclase, trasfondo, aptitudes, pericias).
- Convive con "Copiar hoja".

## 6. Redirección `/inventario` → `/personaje`

`app/inventario/page.tsx` pasa a redirigir (client `redirect`/`useRouter`) a
`/personaje`. El enlace del `StepSummary` "Ir al inventario" cambia a "Ir a la
ficha" → `/personaje`. La lógica de inventario vive ahora en `/personaje`.

## 7. Componentes / archivos

- `app/personaje/page.tsx` — hub + estado + carga/guardado.
- `components/LevelPanel.tsx` — nivel + reparto ASI.
- `components/Paperdoll.tsx` — muñeco de equipo (huecos fijos + dinámicos).
- `data/leveling.ts` — ASI, PG, competencia, config de huecos de accesorio.
- `data/equipmentSlots.ts` — definiciones de huecos de armadura/armas (o dentro de
  `leveling.ts`; se decide en el plan según tamaño).
- Modificar: `lib/character.ts` (tipos + FIELDS + retrocompat), `app/crear/page.tsx`
  (botón), `app/inventario/page.tsx` (redirect), `supabase/schema_v8.sql` (nuevo).
- Reutiliza: `PortraitFrame`, `data/rules.ts`, `data/equipment.ts`, `getSpecies`,
  `getClass`, `getBackground`.

## 8. Persistencia e interacción

- Estado local `useState`; autoguardado con debounce (patrón de `/crear` y
  `/inventario`): nube si `userId` y `cloud.current`, si no `localStorage`.
- Equipar/retirar y mover objetos actualiza `items` + `equipment` juntos de forma
  optimista.
- El panel del DM (`useParty`) seguirá viendo la ficha; opcionalmente mostrará
  nivel/oro/equipo (mejora menor, no bloqueante — fuera de alcance salvo que sea
  trivial al tocar `FIELDS`).

## 9. Verificación

- `npx tsc --noEmit` limpio; `npm run build` limpio; `npm run lint` sin errores nuevos.
- Preview (dev server en :3100, el del usuario sigue en :3000): `/personaje`
  (crear desde `/crear` → navega; subir nivel revela hitos ASI y reparte +2; oro;
  añadir/equipar objeto; huecos de accesorio cambian al variar INT/SAB/CAR; móvil).
- Sin credenciales Supabase no se prueba la nube; se verifica con `localStorage` +
  build + análisis (como sesiones previas).

## 10. Fases (para el plan)

1. `schema_v8.sql` + `lib/character.ts` (tipos, FIELDS, retrocompat `inventory`→`items`).
2. `data/leveling.ts` + `data/equipmentSlots.ts` (reglas y huecos, con funciones puras).
3. `components/LevelPanel.tsx` (nivel + ASI).
4. `components/Paperdoll.tsx` (muñeco + huecos dinámicos).
5. `app/personaje/page.tsx` (hub: identidad, aptitudes, derivados, oro, inventario,
   integra LevelPanel y Paperdoll).
6. Botón "Crear personaje" en `/crear` + redirect de `/inventario` + enlaces.
7. Verificación + `HANDOFF.md`.
