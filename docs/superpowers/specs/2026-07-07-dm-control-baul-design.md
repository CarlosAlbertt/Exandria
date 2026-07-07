# Diseño — Control del DM: hoja bloqueada, dados de PG y "Baúl del Dungeon Master"

Fecha: 2026-07-07
Estado: aprobado para plan de implementación
Rama: `dm-control-baul`

## Objetivo

1. **Restringir la edición** de la hoja `/personaje`: los jugadores la ven en
   **solo lectura**; solo el DM edita las hojas.
2. **Achicar** el retrato de identidad de la hoja (más compacta).
3. **Dados de PG**: tirar la vida por nivel (dado de clase + CON), nivel 1 = máx.
4. **El Baúl del Dungeon Master**: el DM guarda objetos (mágicos o no) y oro y
   los entrega a uno o varios jugadores.

## Decisiones (brainstorming)

- Hoja del jugador = **solo lectura total**. El DM edita las hojas de los
  jugadores vía **`/personaje?user=<id>`** (impersonación DM-only) desde Panel DM › Grupo.
- **Escritura entre usuarios** (DM sobre la hoja de un jugador, y entrega del
  baúl) = **API con `service_role`** (`/api/dm/character`), que verifica que quien
  llama es DM. **Sin cambios de RLS** (la política actual solo permite escribir la
  fila propia; el `service_role` la salta). Lectura de hojas ajenas ya está
  permitida (política "chars: leer autenticados").
- **Baúl** = JSON en `app_config` (key `dm_stash`); el DM ya escribe `app_config`
  (editor de mapa), así que se guarda ahí sin migración de tabla.
- **Oro** = un **tipo de entrada** dentro del baúl (no un campo aparte).
- **Dados de PG**: nivel 1 = dado de clase al máximo + CON (regla 2024). Cada
  nivel nuevo: botón "Tirar PG" lanza `d<dado> + mód CON` (mín 1), se acumula y se
  **guarda la tirada por nivel**. Migración `schema_v9` añade `hp_rolls jsonb`.

## No-objetivos (YAGNI)

- No editar varias hojas a la vez (una cada vez).
- El baúl no calcula efectos mecánicos de los objetos (siguen siendo texto libre).
- No cambiar las políticas RLS (se usa `service_role` para escrituras del DM).
- No tocar el creador `/crear` (la creación por el jugador sigue permitida).

---

## 1. Migración `supabase/schema_v9.sql`

```sql
-- v9: tiradas de PG por nivel.
alter table public.characters add column if not exists hp_rolls jsonb not null default '{}'::jsonb;
```

`hp_rolls`: mapa `nivel(str) → dado bruto tirado` (2..20). El nivel 1 no se guarda
(siempre máximo). Guardar el dado bruto (sin CON) permite recalcular PG si cambia
CON. Ejemplo: `{ "2": 5, "3": 8 }`.

`lib/character.ts`: `CharacterData` gana **`hp_rolls: Record<string, number>`**
(se usa el nombre de columna tal cual como propiedad, sin mapeo, igual que el resto
de campos); `FIELDS` incluye `hp_rolls`.

> **PENDIENTE del usuario:** ejecutar `schema_v9.sql` en Supabase.

## 2. Reglas de PG con dados (`data/leveling.ts`)

```ts
/** Tira un dado de PG (1..hitDie). */
export function rollHitDie(hitDie: number): number {
  return 1 + Math.floor(Math.random() * hitDie);
}
/** PG máx a partir de las tiradas guardadas. Nivel 1 = máx dado + CON.
 *  Niveles 2..N: si hay tirada guardada usa (tirada + CON); si no, media (dado/2+1 + CON). */
export function maxHpFromRolls(hitDie: number, level: number, conMod: number, rolls: Record<string, number>): number {
  const l = Math.max(1, Math.min(20, level));
  let hp = hitDie + conMod; // nivel 1
  for (let lv = 2; lv <= l; lv++) {
    const raw = rolls[String(lv)];
    const perLevel = (typeof raw === "number" ? raw : Math.floor(hitDie / 2) + 1) + conMod;
    hp += perLevel;
  }
  return Math.max(1, hp);
}
```

La función `maxHp` existente se mantiene (usada como media pura donde no haya
tiradas); `LevelPanel`/hoja pasan a `maxHpFromRolls`.

## 3. Componente de hoja reutilizable (`components/CharacterSheet.tsx`)

Se extrae la UI/estado de `app/personaje/page.tsx` a `CharacterSheet` para poder
renderizarla en dos modos. Props:

```ts
type CharacterSheetProps = {
  targetUserId: string | null;   // de quién es la hoja (null = build local sin sesión)
  readOnly: boolean;             // true → sin controles de edición ni autoguardado
  saveMode: "self" | "dm";       // "self": saveCharacter propio; "dm": API /api/dm/character
};
```

- `readOnly` oculta/deshabilita: steppers de nivel, reparto ASI, botón Tirar PG,
  stepper de oro, añadir/±/notas de objetos, equipar/retirar, CA editable. Todo se
  muestra en modo lectura (valores fijos, sin botones).
- Carga: por `targetUserId` (lectura permitida por RLS a cualquier autenticado) o
  `localStorage` si no hay sesión.
- Guardado: `saveMode === "self"` → `saveCharacter(userId, patch)` (fila propia);
  `saveMode === "dm"` → `POST /api/dm/character` con `{ userId: targetUserId, patch }`.
  En `readOnly` no guarda.

### Panel de nivel/PG (`components/LevelPanel.tsx`, ampliado)
- Añade sección **PG por nivel**: nivel 1 = máx (fijo); niveles 2..actual, cada
  uno con su tirada o botón **"Tirar PG"** (`rollHitDie`) si falta. Al tirar,
  `onRollHp(level, value)` guarda en `hp_rolls`. PG máx via `maxHpFromRolls`.
- `readOnly` → sin botones de tirar; muestra las tiradas guardadas y el total.

## 4. Página `/personaje` (`app/personaje/page.tsx`)

- Lee `?user=` de la URL (con `useSearchParams`). 
- Si hay `?user=` **y** el rol es `dm` → edita esa hoja: `targetUserId=<id>`,
  `readOnly=false`, `saveMode="dm"`. (Si un jugador pone `?user=` de otro, se
  ignora: `readOnly=true` y solo su propia hoja.)
- Si no hay `?user=`: es la hoja propia. `readOnly = (role !== "dm")` (el jugador
  la ve en solo lectura; un DM vería la suya editable). `saveMode="self"`.
- Renderiza `<CharacterSheet .../>`.
- **Imagen más pequeña**: el `PortraitFrame` de identidad pasa de `lg` a un tamaño
  compacto (~80px, `size="sm"` con override o un nuevo `size="md"`). El muñeco
  conserva su figura.

## 5. API `app/api/dm/character/route.ts` (`service_role`)

- `POST { userId, patch }`. Verifica sesión servidor con `getSessionProfile()`;
  si `role !== "dm"` → 403.
- Con cliente `service_role`, aplica `patch` a `characters` de `userId`:
  - Campos directos (`level`, `gold`, `asi`, `equipment`, `items`, `hp_rolls`, `ac`
    si se persiste) → merge/replace según venga.
  - Modo **append** para entrega del baúl (**en el servidor**, para evitar
    carreras): el patch puede indicar `{ addItems?: Item[], addGold?: number }` →
    el servidor lee la fila del `userId`, apila objetos por nombre y suma oro, y
    guarda.
- Sigue el patrón de `app/api/admin/users/route.ts` (service_role + verificación DM).

## 6. Baúl del DM (`app/dm/BaulPanel.tsx` + pestaña en `DmDashboard`)

- Nueva pestaña **"Baúl"** (`fa-treasure-chest` o `fa-box-archive`) en
  `app/dm/DmDashboard.tsx` (tipo `Tab` += `"baul"`).
- **Almacén** en `app_config` key `dm_stash`: `StashEntry[]` con
  `{ id, name, type: "magico"|"normal"|"oro", qty, notes }`. Carga/guarda como el
  editor de mapa (hook tipo `useAppConfig`/lectura directa; se sigue el patrón
  existente de `app_config`).
- **Añadir entrada**: form (nombre, tipo con chips mágico/normal/oro, cantidad,
  notas). Para `type:"oro"`, `qty` = monedas.
- **Lista** de entradas con editar/borrar.
- **Entregar**: en cada entrada, seleccionar **jugador(es)** (checkboxes de la
  party via `useParty`, excluyendo al DM) y botón **"Entregar"**:
  - `type:"oro"` → `POST /api/dm/character { userId, patch:{ addGold: qty } }` por jugador.
  - objeto → `POST /api/dm/character { userId, patch:{ addItems:[{name, qty, notes}] } }`.
  - Opción **"quitar del baúl al entregar"** (checkbox); si no, la entrada se
    conserva.
- Realtime de `characters` refleja la entrega en la hoja del jugador al instante.

## 7. Acceso del DM a las hojas (Panel DM › Grupo)

- En `app/dm/GrupoPanel.tsx`, cada jugador gana un botón **"Editar hoja"** →
  enlace a `/personaje?user=<user_id>`. (La vista de solo lectura del grupo se
  mantiene.)

## 8. Piezas / archivos

- Crear: `components/CharacterSheet.tsx`, `app/api/dm/character/route.ts`,
  `app/dm/BaulPanel.tsx`, `supabase/schema_v9.sql`.
- Modificar: `app/personaje/page.tsx` (usa CharacterSheet + `?user=` + imagen
  pequeña), `components/LevelPanel.tsx` (PG por nivel con dados),
  `data/leveling.ts` (`rollHitDie`, `maxHpFromRolls`), `lib/character.ts`
  (`hp_rolls` + tipos + helper de entrega si aplica), `app/dm/DmDashboard.tsx`
  (pestaña Baúl), `app/dm/GrupoPanel.tsx` (botón Editar hoja).
- Reutiliza: `Paperdoll`, `PortraitFrame`, `useParty`, `getSessionProfile`,
  patrón `app_config` y `service_role`.

## 9. Verificación

- `npx tsc --noEmit`, `npm run build`, `npm run lint` (sin errores nuevos).
- Preview (:3100): `/personaje` de jugador = solo lectura (sin botones);
  `/personaje?user=<id>` como DM = editable; tirar PG cambia el total;
  imagen compacta; pestaña Baúl añade/edita entradas y "Entregar" a jugador(es).
- Sin credenciales Supabase, la parte de nube (API, entrega real, Realtime) no se
  prueba en vivo; se verifica con build + preview del render + análisis. El rol se
  puede forzar en pruebas locales según el `SessionProvider`.

## 10. Fases (para el plan)

1. `schema_v9` + `lib/character.ts` (`hp_rolls`).
2. `data/leveling.ts` (`rollHitDie`, `maxHpFromRolls`).
3. `LevelPanel` — sección de PG por nivel con dados + `readOnly`.
4. `components/CharacterSheet.tsx` — extraer de `/personaje` con `readOnly`/`saveMode`.
5. `app/api/dm/character/route.ts` (service_role, verificación DM, patch/append).
6. `/personaje` — `?user=`, permisos, imagen pequeña, usa CharacterSheet.
7. `BaulPanel` + pestaña en `DmDashboard` + botón "Editar hoja" en `GrupoPanel`.
8. Verificación + `HANDOFF.md`.
