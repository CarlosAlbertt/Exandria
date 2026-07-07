# Diseño — C4: Nivel / XP por el DM

Fecha: 2026-07-07
Estado: aprobado para plan de implementación
Rama: `dm-nivel-xp`

## Objetivo

Que el DM gestione la progresión de los jugadores (**XP** y **nivel**) desde su
panel, individualmente o para todo el grupo, con una **excepción** al bloqueo de
la hoja: el jugador puede **tirar su propia vida (PG)** al subir de nivel.

## Decisiones (brainstorming)

- **Ambas mecánicas:** se guarda XP y nivel. Dar XP puede subir el nivel al cruzar
  umbral; el DM también puede **forzar** el nivel (hito) sin tocar XP.
- **Ámbito:** control por jugador **y** acciones de grupo (subir nivel / dar XP a
  todos), desde la pestaña **Grupo** del panel DM.
- **Al subir de nivel:** el nivel sube automáticamente (lo dispara el DM); **no**
  se auto-tira PG. **El jugador tira su propia vida.**
- **Excepción de permisos:** la hoja del jugador sigue en solo lectura **salvo**
  el botón de tirar PG de niveles alcanzados sin tirada. ASI las reparte el DM.

## No-objetivos (YAGNI)

- El jugador no reparte ASI ni edita nada más (solo tira su PG).
- Sin XP automática por encuentro/monstruo (el DM da XP a mano).
- No se cambia el modelo de nivel/ASI existente (`level`, `asi`, `hp_rolls`).

---

## 1. Datos (`supabase/schema_v10.sql`)

```sql
-- v10: puntos de experiencia.
alter table public.characters add column if not exists xp int not null default 0;
```

`lib/character.ts`: `CharacterData` gana `xp: number`; `FIELDS` incluye `xp`.

> **PENDIENTE del usuario:** ejecutar `schema_v10.sql` en Supabase.

## 2. Tabla de XP y nivel (`data/leveling.ts`)

Tabla oficial 2024 (índice = nivel, valor = XP acumulada mínima):

```ts
/** XP mínima acumulada para cada nivel (1..20), D&D 2024. */
export const XP_THRESHOLDS = [
  0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
]; // XP_THRESHOLDS[nivel] → XP mínima; índice 0 sin usar

/** Nivel (1..20) derivado de la XP. */
export function levelFromXp(xp: number): number {
  let lvl = 1;
  for (let l = 2; l <= 20; l++) if (xp >= XP_THRESHOLDS[l]) lvl = l;
  return lvl;
}

/** XP para el siguiente nivel (o la del 20 si ya es 20). Para la barra. */
export function xpForNext(level: number): number {
  return XP_THRESHOLDS[Math.min(20, level + 1)] ?? XP_THRESHOLDS[20];
}
```

## 3. Progresión (reglas)

- **Dar XP** (`addXp` en la API): `newXp = xp + n`; `newLevel = max(level, levelFromXp(newXp))`.
  Guarda `xp` y `level`. (Nunca baja el nivel al dar XP.)
- **Forzar nivel** (`setLevel` en la API): fija `level` (acotado 1..20) sin tocar
  `xp`. Sirve para hitos y para corregir. (El nivel puede quedar por encima del
  que implica la XP: es el caso "ambas".)
- **Subida de nivel automática**: al subir `level`, los nuevos niveles quedan
  **sin tirada de PG** (`hp_rolls` no los tiene) → `maxHpFromRolls` usa la media
  como provisional hasta que el jugador tire (ver §4). No hay auto-tirada.

## 4. Excepción de permisos: el jugador tira su vida

- `components/LevelPanel.tsx`: nueva prop `canRollHp?: boolean`. Los botones
  **"Tirar"** de PG por nivel se muestran cuando **`!readOnly || canRollHp`**
  (los demás controles siguen bajo `!readOnly`). Solo aparecen para niveles
  alcanzados (2..level) **sin** tirada guardada; una vez tirado, queda fijo.
- `components/CharacterSheet.tsx`:
  - `canRollHp = !readOnly || saveMode === "self"` — es decir, el **dueño** de la
    hoja (sesión propia) puede tirar aunque esté en solo lectura; el DM (no
    readOnly) también.
  - `onRollHp(lv, val)` actualiza `hpRolls` y **persiste solo `hp_rolls`** de
    inmediato, **saltándose** el gate de `readOnly`:
    - `saveMode === "self"` → `saveCharacter(targetUserId, { hp_rolls: nuevo })`.
    - `saveMode === "dm"` → `POST /api/dm/character { userId, patch: { hp_rolls } }`.
  - El resto de `persistSheet` (nivel, oro, asi, items, equipo) sigue **no-op en
    readOnly** (el jugador no cambia nada más). Pasa `canRollHp` a `LevelPanel`.
- RLS: el jugador escribe su **propia** fila (`hp_rolls`) → permitido por la
  política "chars: gestionar lo propio". Sin service_role para este caso.

## 5. API `app/api/dm/character/route.ts` (ampliar)

Añadir a los modos existentes (`addItems`/`addGold`/patch directo):
- `setLevel?: number` → `update.level = clamp(1,20, setLevel)`.
- `addXp?: number` → lee `xp, level` de la fila; `newXp = (xp??0)+addXp`;
  `newLevel = max(level??1, levelFromXp(newXp))`; `update.xp = newXp`,
  `update.level = newLevel`. (Importa `levelFromXp` de `@/data/leveling`.)

Mantiene la verificación de rol DM y el `service_role`. (El cálculo en servidor
evita carreras al dar XP a varios a la vez.)

## 6. Panel DM › Grupo (`app/dm/GrupoPanel.tsx`)

Por cada miembro (además del botón "Editar hoja" ya existente):
- Muestra **Nivel N** y **XP** (`xp`), con barra `xp` vs `xpForNext(level)`.
- **Nivel −/+**: `POST /api/dm/character { userId, patch: { setLevel: level±1 } }`
  (optimista; realtime confirma).
- **Dar XP**: input numérico + botón → `patch: { addXp: n }`.

Acciones de grupo (cabecera del panel):
- **"Subir nivel a todos"** → por cada jugador `setLevel: level+1`.
- **"Dar XP a todos"** → input + `addXp: n` por jugador.

Reusa `useParty()` (ya excluye al DM) y las llamadas a la API. Estilo del panel
existente (`panel`, `panel-raised`, `stat-btn`, `btn-gold`, `btn-ghost`, `chip`).

## 7. Hoja del jugador (`CharacterSheet` / `LevelPanel`)

- Muestra **nivel + barra de XP** (`xp / xpForNext(level)`), solo lectura.
- El único control activo para el jugador es **"Tirar"** PG (§4).
- La barra de XP se añade en `LevelPanel` (nueva prop `xp: number`), junto a
  nivel/PG/competencia, mostrando `xp / xpForNext(level)`.

## 8. Verificación

- `npx tsc --noEmit`, `npm run build`, `npm run lint` (sin errores nuevos).
- Preview (:3100): hoja de jugador muestra nivel + barra XP y **solo** el botón
  Tirar; tirar PG cambia el total y persiste. (El control del DM en Grupo y la API
  requieren sesión DM real; se validan por build + análisis, como en milestones
  anteriores sin credenciales.)

## 9. Fases (para el plan)

1. `schema_v10` + `lib/character.ts` (`xp`).
2. `data/leveling.ts` (`XP_THRESHOLDS`, `levelFromXp`, `xpForNext`).
3. API `/api/dm/character` — `setLevel` + `addXp`.
4. `LevelPanel` — `canRollHp` + barra de XP (`xp`/`xpForNext`).
5. `CharacterSheet` — `canRollHp`, persistir solo `hp_rolls` del dueño saltando
   readOnly, pasar `xp`/`canRollHp` a `LevelPanel`.
6. `GrupoPanel` — nivel ±, dar XP, acciones de grupo.
7. Verificación + `HANDOFF.md`.
