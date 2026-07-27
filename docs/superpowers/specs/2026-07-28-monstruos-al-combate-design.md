# Diseño — Los monstruos del bestiario entran al combate

Fecha: 2026-07-28 · Rama prevista: `monstruos-al-combate` · **Migración `schema_v23`.**

## Contexto

Con el tablero retirado, `/combate` se apoya en la iniciativa: una fila por
combatiente. Pero los PNJ solo tienen **un nombre escrito a mano** (`npc_name`),
así que:

- El DM teclea «Goblin» y lleva **la vida de los monstruos en papel**.
- La app no sabe qué es ese goblin: ni sus PG, ni su CA, ni su modificador de
  iniciativa, aunque **los tenga en el bestiario**.
- **Las reglas de G4 no funcionan contra monstruos**: `condsDe` devuelve `[]` para
  los PNJ porque no hay dónde guardarles condiciones, de modo que un goblin
  derribado **no da ventaja** al que le pega. La regla existe y no se aplica.

Esta losa hace que un combatiente PNJ **sepa qué monstruo es**.

## Lo que ya existe y no se rehace

- **`data/bestiary/`**: 124 monstruos (CR 0 a 1/2) con `initiative` (modificador),
  `hp`, `ac`, `traits`, `actions`… `searchMonsters(q, {cr, type})` y
  `getMonster(slug)` ya están.
- **`lib/useBestiary.ts`**: devuelve `{ monsters, discovered, ready }`, sobre
  `app_config` (`custom_monsters` y `bestiary_discovered`). **Incluye los
  monstruos personalizados del DM** y ya lleva un **descubrimiento de grupo**:
  los jugadores solo ven en `/bestiario` lo descubierto.
- **`initiative`** (schema_v11): `id, user_id, is_npc, npc_name, value, active`,
  con RLS y realtime.
- **`InitiativeTracker`**: pinta las filas, marca el turno, y ya tiene la sección
  de mandos del DM donde vive el «añadir PNJ».

## Migración — `schema_v23`

`initiative` gana cuatro columnas, todas opcionales para no tocar las filas de
jugador que ya existan:

```sql
alter table public.initiative add column if not exists monster_slug text;
alter table public.initiative add column if not exists hp int;
alter table public.initiative add column if not exists hp_max int;
alter table public.initiative add column if not exists conds text[] not null default '{}';
```

- **`monster_slug`**: qué monstruo es. `null` en jugadores y en los PNJ escritos a
  mano (que siguen siendo posibles).
- **`hp` / `hp_max`**: **solo para PNJ.** Los jugadores siguen llevando sus PG en
  `characters.play_state` — **una sola fuente de verdad por combatiente**, nunca
  dos.
- **`conds`**: **solo para PNJ**, por el mismo motivo. Las de los jugadores siguen
  en `play_state`.

Idempotente y solo añade, como todas. **RLS**: las políticas de `initiative` ya
existen (el DM escribe, todos leen) y no cambian.

## Añadir monstruos — el selector del DM

En la sección de mandos del DM de `InitiativeTracker`, junto al «añadir PNJ» de
toda la vida (que **se queda**, para lo que no esté en el bestiario):

- **Buscador** sobre `useBestiary().monsters` (incluye los personalizados).
- **Cantidad** (1 por defecto).
- **Interruptor «iniciativa individual»** (apagado por defecto).
- Botón **Añadir**.

**Cómo se tira la iniciativa** (la duda que planteó el usuario):

- Los monstruos se añaden **por tandas**: un monstruo y una cantidad.
- **Cada tanda tira su propia iniciativa** con el modificador de ESE monstruo. Por
  eso, si añades «4 goblins» y luego «1 ogro», son **dos tandas** y el ogro tiene
  su iniciativa aparte **automáticamente**: un jefe nunca comparte turno con sus
  esbirros.
- **Dentro de una tanda** de bichos idénticos, por defecto **una sola tirada** y
  van juntos (lista corta, que es como se juega). Con el interruptor de
  **iniciativa individual**, cada uno tira la suya y quedan desperdigados.

Cada fila creada lleva: `is_npc = true`, `npc_name` = el nombre numerado
(«Goblin 1», «Goblin 2»… o «Goblin» a secas si solo hay uno), `monster_slug`,
`value` = la iniciativa tirada, y `hp = hp_max = monster.hp`.

**Añadir un monstruo lo marca como descubierto** en el bestiario (misma clave
`bestiary_discovered` de `app_config`): si os lo habéis peleado, lo habéis visto,
y los jugadores pueden consultarlo en `/bestiario`.

## Qué se ve en la lista de combate

- **El DM ve los PG exactos** del monstruo (`11/13`) y puede **aplicarle daño o
  curarle** desde su fila, igual que hace con su propio estado.
- **Los jugadores ven el estado en palabras, no el número.** Mantiene la tensión
  sin que nadie calcule «le quedan 3». Función pura `saludDe(hp, hpMax)`:

  | Proporción | Palabra |
  |---|---|
  | 100 % | intacto |
  | ≥ 50 % | herido |
  | ≥ 25 % | malherido |
  | > 0 | al borde |
  | 0 | fuera de combate |

- **Las condiciones del monstruo sí se ven** por todos: son información pública en
  la mesa (se ve que el goblin está en el suelo) y hacen falta para entender la
  ventaja.
- El DM puede **marcar condiciones** en la fila del monstruo.

## Lo que esto arregla de paso

Con `conds` en la fila, `condsDe` de `/combate` deja de devolver `[]` para los
PNJ, y **las reglas de G4 empiezan a funcionar contra monstruos**: un goblin
**derribado** da ventaja al que le pega con un arma de cuerpo y desventaja al que
le dispara; uno **paralizado** o **inconsciente** da crítico automático en cuerpo
a cuerpo. Hasta ahora eso solo pasaba entre jugadores.

## Qué NO entra (a propósito)

- **Que la app resuelva los ataques del monstruo** (sus `actions` con sus tiradas):
  el DM las lee del bestiario y las tira a mano, como hasta ahora. Otra losa.
- **Conocimiento por jugador**: el descubrimiento es **de grupo**, como ya era. No
  se modela «este PJ sabe más que aquel» sobre un monstruo.
- **CA visible para los jugadores**: la app nunca ha comparado la CA y sigue sin
  hacerlo; el DM la ve en el bestiario.
- **Iniciativa automática de los jugadores**: cada uno sigue tirando la suya.
- **Borrar filas de monstruos una a una** más allá del «vaciar» que ya existe:
  entra un botón de quitar por fila, que es trivial, pero nada de gestión de
  encuentros guardados.

## Verificación (el gate real; no hay tests)

- **`lib/combate.ts`** (nuevo, puro): `saludDe(hp, hpMax)` y
  `nombresNumerados(nombre, n)`. Verificado por **`scripts/check-combate.ts`**:
  los cinco tramos de salud con sus bordes exactos (100 %, justo 50 %, justo
  25 %, 1 PG, 0), `hpMax` 0 o negativo sin romper, y que numerar con n=1 no añada
  el « 1».
- `npx tsc --noEmit` + `npx next build` limpios.
- Sin regresión: los 10 scripts de siempre (`check-ficha` 11, `check-spells`,
  `check-conjuros`, `check-targeting`, `check-estado`, `check-turno`,
  `check-ataque`, `check-clases` 116, `check-lore` 69, `check-clima`). El gate
  pasa a **11** con el nuevo.
- **No probado en vivo.** **Pruebas del usuario** (tras ejecutar `schema_v23`):
  añadir 4 goblins ⇒ salen «Goblin 1..4» compartiendo iniciativa; añadir un ogro
  aparte ⇒ tiene la suya; con «iniciativa individual», los 4 goblins salen
  desperdigados; el DM baja PG a un goblin y **el jugador ve «malherido»**, no el
  número; marcarle **derribado** y atacarle con un arma de cuerpo ⇒ **ventaja**, y
  con un arco ⇒ **desventaja**; y que el goblin aparezca **descubierto** en
  `/bestiario` para los jugadores.
