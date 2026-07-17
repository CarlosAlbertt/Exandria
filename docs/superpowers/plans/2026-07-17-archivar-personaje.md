# Archivar personaje · Plan de implementación

> **Para trabajadores agénticos:** SUB-SKILL REQUERIDA: usa
> superpowers:subagent-driven-development (recomendado) o
> superpowers:executing-plans para implementar este plan tarea a tarea. Los pasos
> usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** El jugador retira su personaje y deja de jugarlo (lo ve en gris);
el DM lo conserva, puede devolverlo a juego, y puede borrarlo de verdad.

**Arquitectura:** `characters` pasa de una fila por jugador (`user_id` PK) a
varias (`id` PK, `user_id` FK, `archived_at`). Tres garantías **en la base de
datos**: uno activo (índice único parcial), máximo 3 (trigger), y solo el DM
desarchiva (trigger). `stat_rolls` pasa a llevar `character_id` como PK.

**Stack:** Next 16 (App Router, Turbopack) · React 19 · Tailwind v4 · TypeScript
· Supabase (Postgres + RLS + Realtime). Sin framework de tests: los gates son
`npx tsc --noEmit`, `npm run build` y los `scripts/check-*.ts` con `npx tsx`.

**Diseño:** `docs/superpowers/specs/2026-07-17-archivar-personaje-design.md`

**Convenciones del repo:**
- Commits en español, acaban en `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Autor git: `CarlosAlbertt <CarlosAlbertt@users.noreply.github.com>` (Vercel
  bloquea otros emails). Trabajo directo en `master`.
- **`npm run lint` está roto repo-wide de antes** (`react-hooks/set-state-in-effect`
  en ~7 archivos). No es de este trabajo; **no arreglarlo de paso**.
- Datos mecánicos de D&D = hechos; descripciones = redacción propia en español.

---

## ⚠️ Lee esto antes de la Tarea 1

**No hay base de datos en desarrollo.** No hay credenciales de Supabase en el
entorno. Eso significa:

- **La migración no se puede ejecutar ni probar aquí.** Se escribe, se revisa
  leyéndola, y **la ejecuta el usuario** en su Supabase.
- **El código y la migración tienen que aterrizar juntos.** Ejecutar `v14` con el
  código actual desplegado **rompe producción**: `saveCharacter` hace `upsert`
  sobre `user_id` y el índice único nuevo es **parcial**, así que el upsert falla
  y los jugadores dejan de poder guardar la ficha. **No se hace `push` hasta que
  todo el plan esté hecho**, y entonces se coordina con el usuario (Tarea 8).

**El flujo de «hacerse otro», que el plan asume en todas partes:** `/crear`
**edita tu personaje activo**. Para hacerte otro, primero lo **archivas** desde
`/personaje`; entonces `/crear` no encuentra activo y **crea uno nuevo**. Si ya
tienes 3 en total, te bloquea y el DM tiene que borrar uno.

---

## Estructura de archivos

| Archivo | Responsabilidad | Tarea |
|---|---|---|
| `supabase/schema_v14.sql` | **Nuevo.** La migración. | 1 |
| `lib/archive.ts` | **Nuevo.** Reglas puras: quién es el activo, ¿puede crear?, ¿puede restaurar? | 2 |
| `scripts/check-archive.ts` | **Nuevo.** Verifica `lib/archive.ts`. | 2 |
| `lib/character.ts` | API nueva: `loadActiveCharacter`, `createCharacter`, `saveCharacter(id)`, `archiveCharacter`, `listCharacters`; `useParty` solo activos. | 3 |
| 8 consumidores de `useParty` | Sin cambios si `useParty` filtra bien. **Verificar uno por uno.** | 3 |
| `app/crear/page.tsx` | Edita el activo; crea si no hay; bloquea al llegar a 3. | 4 |
| `components/CharacterSheet.tsx` | Botón «Retirar personaje» + lista de archivados. | 5 |
| `app/api/dm/character/route.ts` | **Solo** acotar las escrituras al activo (bug latente del XP). | 6 |
| `app/dm/GrupoPanel.tsx` | UI del DM: restaurar y borrar de verdad. | 7 |
| `HANDOFF.md` + vault | Documentación y coordinación de la migración. | 8 |

---

### Task 1: `schema_v14.sql` — la migración

**Esta tarea es la más peligrosa del plan.** Reestructura dos tablas con datos
reales en producción. `schema_v13` creaba una tabla nueva y vacía; esta no.

**Archivos:**
- Crear: `supabase/schema_v14.sql`

- [ ] **Paso 1: Leer las migraciones existentes para seguir su estilo**

Lee `supabase/schema_v13.sql` y `supabase/schema_v4.sql` (la que creó
`characters`). Fíjate en: cabecera comentada, idempotencia (`if not exists`,
`drop policy if exists`), y comentarios en español explicando el porqué.

Comprueba también `supabase/schema.sql` líneas 17-23: ahí vive `public.is_dm()`,
que vas a usar.

- [ ] **Paso 2: Escribir `supabase/schema_v14.sql`**

```sql
-- ============================================================================
-- Exandria — esquema v14 (ejecutar DESPUÉS de v1..v13)
-- ARCHIVAR PERSONAJE: el jugador retira su personaje (deja de jugarlo y lo ve
-- en gris); el DM lo conserva, puede devolverlo a juego o borrarlo de verdad.
--
-- OJO: a diferencia de v13 (que creaba una tabla nueva y vacía), esta migración
-- REESTRUCTURA dos tablas CON DATOS. Va entera en una transacción: o entra todo
-- o no entra nada. Es idempotente: se puede reejecutar sin romper nada.
--
-- Modelo: antes una fila por jugador (characters.user_id era PK). Ahora varias:
-- `id` es la PK y `user_id` una FK. `archived_at IS NULL` = en juego.
-- ============================================================================

begin;

-- 1. CHARACTERS: de una fila por jugador a varias ----------------------------
alter table public.characters add column if not exists id uuid default gen_random_uuid();
alter table public.characters add column if not exists archived_at timestamptz;

-- Rellena `id` en las filas que existían antes de esta migración.
update public.characters set id = gen_random_uuid() where id is null;
alter table public.characters alter column id set not null;

-- Mueve la PK de user_id a id. El nombre `characters_pkey` es el que Postgres
-- pone por defecto; el `if exists` cubre el caso de reejecución.
alter table public.characters drop constraint if exists characters_pkey;
alter table public.characters add constraint characters_pkey primary key (id);

-- user_id deja de ser PK pero sigue siendo obligatoria y con su FK.
alter table public.characters alter column user_id set not null;

-- UNO ACTIVO POR JUGADOR. Índice parcial: solo mira las filas en juego, así que
-- puedes tener varios archivados pero jamás dos activos, ni con la consola.
create unique index if not exists characters_un_activo
  on public.characters (user_id) where archived_at is null;

-- 2. STAT_ROLLS: la tirada pasa a ser POR PERSONAJE --------------------------
-- Decisión del usuario (2026-07-17): «nuevo personaje, nueva tirada». Relaja a
-- propósito el bloqueo de la Fase K: el freno deja de ser el servidor y pasa a
-- ser el DM, acotado por el límite de 3 personajes. Ver el spec.
alter table public.stat_rolls add column if not exists character_id uuid;

-- Rellena character_id con el (único) personaje de cada jugador. Antes de esta
-- migración solo podía haber uno, así que el join es inequívoco.
update public.stat_rolls sr
   set character_id = c.id
  from public.characters c
 where c.user_id = sr.user_id
   and sr.character_id is null;

-- Tiradas huérfanas (jugador sin ninguna fila en characters): SE BORRAN. Una
-- tirada sin personaje al que pertenecer no significa nada, y con el modelo
-- nuevo el jugador saca tirada al crear su personaje de todas formas.
delete from public.stat_rolls where character_id is null;

alter table public.stat_rolls alter column character_id set not null;
alter table public.stat_rolls drop constraint if exists stat_rolls_character_id_fkey;
alter table public.stat_rolls add constraint stat_rolls_character_id_fkey
  foreign key (character_id) references public.characters(id) on delete cascade;

alter table public.stat_rolls drop constraint if exists stat_rolls_pkey;
alter table public.stat_rolls add constraint stat_rolls_pkey primary key (character_id);

-- user_id se CONSERVA aunque ya no sea PK: las policies lo usan para
-- `user_id = auth.uid()` sin tener que unir con characters en cada comprobación.

-- 3. LÍMITE DE 3 POR JUGADOR ------------------------------------------------
-- En el cliente no vale: se lo salta cualquiera con la consola.
create or replace function public.guard_limite_personajes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.characters where user_id = new.user_id) >= 3 then
    raise exception 'Ya tienes 3 personajes. Pide al DM que borre uno para hacer sitio.';
  end if;
  return new;
end $$;

drop trigger if exists characters_limite on public.characters;
create trigger characters_limite before insert on public.characters
  for each row execute function public.guard_limite_personajes();

-- 4. SOLO EL DM DESARCHIVA ---------------------------------------------------
-- Va en un TRIGGER y no en la RLS porque `with check` no ve el valor viejo: no
-- puede distinguir «archivar» de «desarchivar». El jugador puede hacer el viaje
-- de ida, no el de vuelta. Mismo espíritu que stat_rolls.
create or replace function public.guard_desarchivar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.archived_at is not null and new.archived_at is null
     and not public.is_dm() then
    raise exception 'Solo el DM puede devolver un personaje a juego.';
  end if;
  return new;
end $$;

drop trigger if exists characters_desarchivar on public.characters;
create trigger characters_desarchivar before update on public.characters
  for each row execute function public.guard_desarchivar();

-- 5. BORRAR DE VERDAD: SOLO EL DM -------------------------------------------
-- La policy `for all` de v4 dejaba al jugador borrar su propia fila. Se parte:
-- conserva select/insert/update sobre lo suyo, pero el delete pasa al DM.
drop policy if exists "chars: gestionar lo propio" on public.characters;

create policy "chars: leer lo propio o el DM" on public.characters
  for select to authenticated using (true);  -- igual que v4: el grupo se ve

drop policy if exists "chars: insertar lo propio" on public.characters;
create policy "chars: insertar lo propio" on public.characters
  for insert to authenticated with check (user_id = auth.uid() or public.is_dm());

drop policy if exists "chars: actualizar lo propio" on public.characters;
create policy "chars: actualizar lo propio" on public.characters
  for update to authenticated using (user_id = auth.uid() or public.is_dm())
  with check (user_id = auth.uid() or public.is_dm());

drop policy if exists "chars: el DM borra" on public.characters;
create policy "chars: el DM borra" on public.characters
  for delete to authenticated using (public.is_dm());

-- 6. STAT_ROLLS: policies al día --------------------------------------------
drop policy if exists "aptitudes: insertar lo propio" on public.stat_rolls;
create policy "aptitudes: insertar lo propio" on public.stat_rolls
  for insert to authenticated with check (user_id = auth.uid() or public.is_dm());
-- Sigue SIN policy de UPDATE: una tirada por personaje, inmutable.

commit;
```

> **Sobre la policy de select**: v4 ya la tenía como `using (true)` (todos los
> autenticados leen todas las fichas: el grupo se ve entre sí). **No se cambia**
> — que el jugador pueda leer sus propios archivados es justo lo que pide el
> diseño, y el DM los necesita. La `drop policy` de la vieja
> `"chars: gestionar lo propio"` es lo que obliga a redeclarar el select.

- [ ] **Paso 3: Verificar la sintaxis sin base de datos**

No hay Supabase en desarrollo, así que **no se puede ejecutar**. Lo que sí se
puede es comprobar que el SQL no tiene erratas evidentes. Ejecuta:

```bash
grep -c "begin;\|commit;" supabase/schema_v14.sql
```
Esperado: `2` (una de cada).

Y **léelo entero de arriba abajo** buscando: que cada `create policy` tenga su
`drop policy if exists` delante, que los `$$` estén balanceados, y que no haya
ningún `drop table` ni `truncate` (no debe haber ninguno: esta migración **no
borra ninguna tabla**).

- [ ] **Paso 4: Commit**

```bash
git add supabase/schema_v14.sql
git commit -m "feat(bd): schema_v14 — archivar personaje

characters pasa de una fila por jugador a varias: id como PK, user_id
como FK y archived_at. Tres garantías en la BD: uno activo (índice
único parcial), máximo 3 (trigger) y solo el DM desarchiva (trigger,
porque la RLS no ve el valor viejo). stat_rolls pasa a character_id.

No ejecutar todavía: rompe el código actual hasta que aterrice el resto
del plan.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `lib/archive.ts` — las reglas, puras y verificadas

Las reglas del límite y del estado, sin React ni Supabase, para poder
verificarlas de verdad. TDD: comprobación primero.

**Archivos:**
- Crear: `lib/archive.ts`
- Crear: `scripts/check-archive.ts`

- [ ] **Paso 1: Escribir las comprobaciones que fallan**

Crea `scripts/check-archive.ts`:

```ts
// Comprobación manual de lib/archive.ts. Uso: npx tsx scripts/check-archive.ts
import { MAX_CHARACTERS, activeOf, archivedOf, canCreate, canRestore, type CharSlot } from "../lib/archive";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const activo: CharSlot = { id: "a", archived_at: null };
const arch1: CharSlot = { id: "b", archived_at: "2026-07-17T10:00:00Z" };
const arch2: CharSlot = { id: "c", archived_at: "2026-07-17T11:00:00Z" };

check("MAX_CHARACTERS = 3", MAX_CHARACTERS === 3);

// activeOf: el que no tiene archived_at
check("activeOf encuentra el activo", activeOf([arch1, activo, arch2])?.id === "a");
check("activeOf sin activo = null", activeOf([arch1, arch2]) === null);
check("activeOf sin personajes = null", activeOf([]) === null);

// archivedOf: los demás
check("archivedOf devuelve solo archivados", archivedOf([arch1, activo, arch2]).length === 2);
check("archivedOf sin archivados = vacío", archivedOf([activo]).length === 0);

// canCreate: solo si NO hay activo y quedan huecos. /crear EDITA el activo, así
// que con activo no se crea nada nuevo.
check("canCreate con activo = false", canCreate([activo]) === false);
check("canCreate sin activo y 0 = true", canCreate([]) === true);
check("canCreate sin activo y 2 archivados = true", canCreate([arch1, arch2]) === true);
check("canCreate sin activo y 3 archivados = false (límite)",
  canCreate([arch1, arch2, { id: "d", archived_at: "2026-07-17T12:00:00Z" }]) === false);

// canRestore: el DM solo puede devolver a juego si el jugador NO tiene activo
// (si no, chocaría contra el índice único parcial).
check("canRestore sin activo = true", canRestore([arch1, arch2]) === true);
check("canRestore con activo = false", canRestore([activo, arch1]) === false);

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} fallaron.`);
process.exit(failures === 0 ? 0 : 1);
```

- [ ] **Paso 2: Ejecutar para verificar que falla**

Ejecuta: `npx tsx scripts/check-archive.ts`
Esperado: FALLA — `lib/archive.ts` no existe (`Cannot find module '../lib/archive'`).

- [ ] **Paso 3: Implementar `lib/archive.ts`**

```ts
// Reglas de archivado, puras: sin React ni Supabase, para poder verificarlas
// con scripts/check-archive.ts. La BD las vuelve a garantizar por su cuenta
// (índice único parcial + triggers); esto es para que la UI sepa qué ofrecer y
// no deje al jugador chocar contra un error de Postgres.

// Un jugador tiene como mucho 3 personajes: 1 activo + 2 archivados.
export const MAX_CHARACTERS = 3;

// Lo mínimo para decidir: `archived_at` null = en juego.
export type CharSlot = { id: string; archived_at: string | null };

// Genéricas en `T`: quien llame con filas más ricas (nombre, clase, nivel —
// como `listCharacters`) recupera ESAS filas, no un CharSlot pelado. Sin esto,
// la UI tendría que hacer casts para pintar el nombre de un archivado.

// El personaje en juego, o null. La BD garantiza que hay como mucho uno
// (índice único parcial sobre user_id where archived_at is null).
export function activeOf<T extends CharSlot>(chars: T[]): T | null {
  return chars.find((c) => c.archived_at === null) ?? null;
}

export function archivedOf<T extends CharSlot>(chars: T[]): T[] {
  return chars.filter((c) => c.archived_at !== null);
}

// ¿Se puede crear uno nuevo? Solo si NO hay activo (porque /crear EDITA el
// activo cuando lo hay: para hacerte otro, primero archivas) y queda hueco.
export function canCreate(chars: CharSlot[]): boolean {
  return activeOf(chars) === null && chars.length < MAX_CHARACTERS;
}

// ¿Puede el DM devolver uno a juego? Solo si el jugador no tiene ya un activo:
// si lo tiene, el insert chocaría contra el índice único parcial. La UI del DM
// debe ofrecer archivar el activo primero en vez de dejar que reviente.
export function canRestore(chars: CharSlot[]): boolean {
  return activeOf(chars) === null;
}
```

- [ ] **Paso 4: Ejecutar para verificar que pasa**

Ejecuta: `npx tsx scripts/check-archive.ts`
Esperado: `Todas las comprobaciones pasaron.` y salida 0 (13 líneas `OK`).

- [ ] **Paso 5: `tsc` limpio**

Ejecuta: `npx tsc --noEmit`
Esperado: sin salida.

- [ ] **Paso 6: Commit**

```bash
git add lib/archive.ts scripts/check-archive.ts
git commit -m "feat(archivo): reglas puras de archivado

Quién es el activo, cuántos quedan, si se puede crear otro y si el DM
puede restaurar. Puras y verificadas por check-archive.ts. La BD las
garantiza por su cuenta; esto es para que la UI no deje al jugador
chocar contra un error de Postgres.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: `lib/character.ts` — API nueva y `useParty` solo activos

**El fallo más probable de toda la feature está aquí**: si `useParty` no filtra,
los personajes archivados reaparecen en la iniciativa, en los dados, en la
crónica y en la calculadora de encuentros. Son 8 consumidores.

**Archivos:**
- Modificar: `lib/character.ts`
- Verificar (sin tocar, salvo que rompan): `app/dm/{GrupoPanel,BaulPanel,DadosPanel,EncuentrosPanel}.tsx`, `components/{CharacterSheet,DicePanel,InitiativeTracker}.tsx`, `lib/{useChronicle,useInitiative}.ts`

- [ ] **Paso 1: Reescribir la API de `lib/character.ts`**

Sustituye `loadCharacter` y `saveCharacter` (líneas 58-74) por:

```ts
// La ficha activa del jugador, con su id. null si no tiene ninguna en juego
// (p. ej. acaba de archivar la suya y aún no se ha hecho otra).
export async function loadActiveCharacter(userId: string): Promise<(Partial<CharacterData> & { id: string }) | null> {
  if (!supabaseConfigured || !userId) return null;
  const { data } = await createClient()
    .from("characters")
    .select(`id, ${FIELDS}`)
    .eq("user_id", userId)
    .is("archived_at", null)
    .maybeSingle();
  if (!data) return null;
  const row = data as Partial<CharacterData> & { id: string };
  if ((!row.items || row.items.length === 0) && Array.isArray(row.inventory) && row.inventory.length) {
    row.items = row.inventory.map((name, i) => ({ id: `legacy-${i}`, name, qty: 1 }));
  }
  return row;
}

// Todos los personajes del jugador (activo + archivados), para la lista de
// /personaje y para las reglas de lib/archive.ts.
export async function listCharacters(userId: string): Promise<(CharSlot & { name: string; cls: string | null; level: number })[]> {
  if (!supabaseConfigured || !userId) return [];
  const { data } = await createClient()
    .from("characters")
    .select("id, archived_at, name, cls, level")
    .eq("user_id", userId)
    .order("archived_at", { ascending: true, nullsFirst: true });
  return (data ?? []) as (CharSlot & { name: string; cls: string | null; level: number })[];
}

// Crea un personaje nuevo y devuelve su id, o un mensaje de error.
// El trigger de la BD rechaza el cuarto y el índice único el segundo activo:
// aquí no se comprueba nada, se traduce lo que diga la BD.
export async function createCharacter(userId: string): Promise<{ id: string } | { error: string }> {
  if (!supabaseConfigured || !userId) return { error: "Supabase no configurado" };
  const { data, error } = await createClient()
    .from("characters")
    .insert({ user_id: userId })
    .select("id")
    .single();
  if (error) return { error: humanDbError(error.message) };
  return { id: (data as { id: string }).id };
}

// Guarda la ficha POR ID. Ya no puede ser un upsert por user_id: el índice
// único nuevo es PARCIAL (where archived_at is null) y un upsert necesita un
// índice único que case con su target.
export async function saveCharacter(characterId: string, patch: Partial<CharacterData>) {
  if (!supabaseConfigured || !characterId) return;
  await createClient()
    .from("characters")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", characterId);
}

// Retira un personaje del juego. El viaje de vuelta lo hace solo el DM (lo
// garantiza un trigger, no el cliente).
export async function archiveCharacter(characterId: string): Promise<string | null> {
  if (!supabaseConfigured || !characterId) return "Supabase no configurado";
  const { error } = await createClient()
    .from("characters")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", characterId);
  return error ? humanDbError(error.message) : null;
}

// Los errores de los triggers y del índice único llegan como texto de Postgres.
// Nada de eso se le enseña al jugador tal cual.
function humanDbError(msg: string): string {
  if (/characters_un_activo/i.test(msg)) return "Ya tienes un personaje en juego. Retíralo antes de crear otro.";
  if (/3 personajes/i.test(msg)) return "Ya tienes 3 personajes. Pide al DM que borre uno para hacer sitio.";
  if (/Solo el DM puede devolver/i.test(msg)) return "Solo el DM puede devolver un personaje a juego.";
  return msg;
}
```

Añade el import de `CharSlot` arriba del archivo:

```ts
import type { CharSlot } from "@/lib/archive";
```

- [ ] **Paso 2: `useParty` — solo activos**

En `useParty` (línea ~90), cambia la consulta de `characters`:

```ts
        // Solo los que están EN JUEGO: sin este filtro, los archivados
        // reaparecerían en la iniciativa, los dados y la crónica.
        supabase.from("characters").select(`user_id, ${FIELDS}`).is("archived_at", null),
```

- [ ] **Paso 3: Comprobar los 8 consumidores uno por uno**

`useParty` devuelve `PartyMember[]` con la misma forma que antes, así que en
principio ninguno cambia. **Verifícalo leyendo cada uno**, no lo supongas:

```bash
grep -rn "useParty\|loadCharacter\|saveCharacter" app/ components/ lib/
```

Para cada resultado, comprueba si usa `loadCharacter`/`saveCharacter` con la
firma vieja (`userId`). **Si alguno lo hace, `tsc` lo cantará** en el paso 4 —
arréglalo pasándole el id del personaje activo.

- [ ] **Paso 4: Verificar**

```bash
npx tsc --noEmit
```
Esperado: **fallará** en los archivos que llamen a `loadCharacter`/`saveCharacter`
con la firma vieja. **Eso es la lista de trabajo**: arregla cada uno. Los de
`/crear` y `/personaje` se tratan en las Tareas 4 y 5 — si `tsc` los señala aquí,
haz el arreglo mínimo para que compile y deja la funcionalidad para su tarea.

Cuando `tsc` esté limpio:
```bash
npm run build && npx tsx scripts/check-archive.ts
```

- [ ] **Paso 5: Commit**

```bash
git add lib/character.ts
git commit -m "feat(archivo): la ficha se direcciona por id, no por jugador

loadActiveCharacter/createCharacter/saveCharacter(id)/archiveCharacter/
listCharacters. saveCharacter deja de ser un upsert por user_id: el
índice único nuevo es parcial y no sirve como target de conflicto.
useParty filtra archivados — sin eso reaparecerían en la iniciativa.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: `/crear` — edita el activo, crea si no hay, bloquea a los 3

**Archivos:**
- Modificar: `app/crear/page.tsx`

- [ ] **Paso 1: Leer `app/crear/page.tsx` entera**

Fíjate en: el `useEffect` que hace `loadCharacter(userId)` (~línea 104), el
`useEffect` de guardado con debounce de 900ms (~línea 132), y `onCreate`
(~línea 206).

- [ ] **Paso 2: Estado nuevo — el id del personaje que se está editando**

Añade junto a los demás `useState`:

```tsx
  // El personaje que /crear está editando. null = el jugador no tiene ninguno
  // en juego (acaba de archivar, o es nuevo): se creará al primer guardado.
  const [charId, setCharId] = useState<string | null>(null);
  // Todos sus personajes: para saber si puede crear otro (límite de 3).
  const [slots, setSlots] = useState<CharSlot[]>([]);
  const [limitError, setLimitError] = useState<string | null>(null);
```

Imports nuevos:
```tsx
import { loadActiveCharacter, createCharacter, saveCharacter, listCharacters } from "@/lib/character";
import { canCreate, type CharSlot } from "@/lib/archive";
```

- [ ] **Paso 3: Cargar el activo y los huecos**

Sustituye el `useEffect` de `loadCharacter` por:

```tsx
  useEffect(() => {
    if (!loaded || !userId || cloudLoaded.current) return;
    cloudLoaded.current = true;
    listCharacters(userId).then(setSlots);
    loadActiveCharacter(userId).then((row) => {
      if (!row) return;
      setCharId(row.id);
      setB((p) => ({
        ...p,
        name: row.name ?? p.name,
        species: row.species ?? p.species,
        lineage: row.lineage ?? p.lineage,
        cls: row.cls ?? p.cls,
        subclass: row.subclass ?? p.subclass,
        background: row.background ?? p.background,
        base: row.base && Object.keys(row.base).length ? row.base : p.base,
        bonus: row.bonus && Object.keys(row.bonus).length ? row.bonus : p.bonus,
        skills: Array.isArray(row.skills) ? row.skills : p.skills,
        lore: row.lore ?? p.lore,
      }));
    });
  }, [loaded, userId]);
```

- [ ] **Paso 4: Guardar — crear la fila la primera vez**

Sustituye el `useEffect` de guardado por:

```tsx
  // Guardado con debounce. La primera vez que hay algo que guardar y no existe
  // fila, se crea: es el mismo momento en que antes el upsert la creaba sola.
  useEffect(() => {
    if (!loaded || !userId || !cloudLoaded.current) return;
    const t = setTimeout(async () => {
      const patch = {
        name: b.name, species: b.species, lineage: b.lineage, cls: b.cls, subclass: b.subclass,
        background: b.background, base: b.base, bonus: b.bonus, skills: b.skills, lore: b.lore,
      };
      let id = charId;
      if (!id) {
        const res = await createCharacter(userId);
        if ("error" in res) { setLimitError(res.error); return; }
        id = res.id;
        setCharId(id);
        listCharacters(userId).then(setSlots);
      }
      saveCharacter(id, patch);
    }, 900);
    return () => clearTimeout(t);
  }, [loaded, userId, charId, b.name, b.species, b.lineage, b.cls, b.subclass, b.background, b.base, b.bonus, b.skills, b.lore]);
```

- [ ] **Paso 5: `onCreate` por id**

En `onCreate`, cambia `saveCharacter(userId, { level: 1 })` por:

```tsx
    if (charId) saveCharacter(charId, { level: 1 });
```

- [ ] **Paso 6: Bloquear al llegar al límite**

Justo después del `<header>` del `<main>`, antes del input de nombre:

```tsx
      {userId && !charId && slots.length > 0 && !canCreate(slots) && (
        <div className="panel p-6 max-w-xl mx-auto text-center mb-6">
          <p className="font-display text-xl font-bold mb-2" style={{ color: "var(--color-ember)" }}>
            <i className="fas fa-triangle-exclamation mr-2" />Has llegado al límite
          </p>
          <p className="font-ui text-[13px]" style={{ color: "var(--color-muted)" }}>
            Tienes 3 personajes y ninguno en juego. Pide al DM que borre uno en
            Panel DM › Grupo para hacer sitio.
          </p>
        </div>
      )}
      {limitError && (
        <p className="font-ui text-[12px] font-bold text-center mb-4" style={{ color: "var(--color-ember)" }}>
          <i className="fas fa-circle-exclamation mr-1.5" />{limitError}
        </p>
      )}
```

> Se bloquea **al entrar**, no al final. Es la lección del bug de la tirada: no
> dejes que el jugador haga todo el trabajo para negárselo al final.

- [ ] **Paso 7: Verificar**

```bash
npx tsc --noEmit && npm run build && npx tsx scripts/check-archive.ts
```
Esperado: `tsc` sin salida, build sin errores, checks en verde.

- [ ] **Paso 8: Commit**

```bash
git add app/crear/page.tsx
git commit -m "feat(archivo): /crear edita el activo y bloquea al llegar a 3

El creador edita tu personaje en juego; si no tienes ninguno (acabas de
archivar), crea uno al primer guardado. Con 3 y ninguno activo, avisa
al entrar en vez de dejarte llegar al final y fallar.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: `/personaje` — retirar el personaje y ver los archivados

**Archivos:**
- Modificar: `components/CharacterSheet.tsx`

- [ ] **Paso 1: Entender los modos de la hoja — OJO, es contraintuitivo**

`CharacterSheet({ targetUserId, readOnly, saveMode })` (línea 70). Cómo la monta
`app/personaje/page.tsx`:
- Línea 16 — el DM editando a otro: `readOnly={false} saveMode="dm"`.
- Línea 19 — tu propia ficha: `readOnly={role !== "dm"} saveMode="self"`.

**Es decir: la ficha propia de un jugador ES `readOnly`.** Es el bloqueo del DM
de 2026-07-07 (el jugador ve su ficha pero no la edita; el DM reparte nivel, oro
y objetos). Así que **NO condiciones el botón a `!readOnly`: lo esconderías de
todos los jugadores y no podría archivar nadie.**

El patrón correcto ya está en el archivo, línea 275:
```tsx
// El dueño puede tirar PG aunque la ficha sea de solo lectura (el DM vía ?user= no está en readOnly).
const canRollHp = !readOnly || saveMode === "self";
```
Retirar es lo mismo: **una acción del dueño, no una edición de la ficha**. La
condición es `saveMode === "self" && !!targetUserId`:
- Jugador en su ficha → `saveMode="self"` ✅ (aunque sea `readOnly`)
- DM en la suya → `saveMode="self"` ✅ (es su personaje, puede retirarlo)
- DM editando a otro con `?user=` → `saveMode="dm"` ❌ (para eso tiene su panel,
  Tarea 7)
- Sin sesión (`targetUserId` null) → ❌ (modo localStorage, no hay nada que
  archivar)

- [ ] **Paso 2: Cargar los huecos y el id del activo**

`CharacterSheet` trabaja hoy por `targetUserId` y llama a `loadCharacter`
(línea 100) y `saveCharacter` (líneas 163 y 281). La Tarea 3 ya cambió esas
firmas, así que este archivo **ya estará roto y arreglado a lo mínimo** por
`tsc`. Aquí se completa.

Cambia el import de la línea 5:
```tsx
import { loadActiveCharacter, saveCharacter, listCharacters, archiveCharacter, type Item, type CharacterData } from "@/lib/character";
import { archivedOf, MAX_CHARACTERS, type CharSlot } from "@/lib/archive";
```

Añade el estado (junto a los demás `useState`):
```tsx
  // El id del personaje que muestra la hoja: saveCharacter va por id desde
  // schema_v14, y retirar también.
  const [charId, setCharId] = useState<string | null>(null);
  const [slots, setSlots] = useState<(CharSlot & { name: string })[]>([]);
  const [archiveError, setArchiveError] = useState<string | null>(null);
```

En el efecto de carga (línea ~100), `loadActiveCharacter` ya devuelve el `id`:
```tsx
        const row = await loadActiveCharacter(targetUserId);
        if (row) setCharId(row.id);
```

Y carga los huecos solo en modo `self`:
```tsx
  useEffect(() => {
    if (saveMode !== "self" || !targetUserId) return;
    listCharacters(targetUserId).then(setSlots);
  }, [saveMode, targetUserId]);
```

- [ ] **Paso 3: El bloque de retirada y la lista**

Añádelo al final del JSX de la hoja, con la condición del Paso 1:

```tsx
      {saveMode === "self" && targetUserId && (
        <div className="panel p-6 mt-5">
          <p className="eyebrow mb-2">Personajes</p>
          <p className="font-ui text-[13px] mb-4" style={{ color: "var(--color-muted)" }}>
            Tienes {slots.length} de {MAX_CHARACTERS}. Solo puedes jugar uno a la vez.
          </p>

          {archivedOf(slots).length > 0 && (
            <div className="mb-4">
              <p className="eyebrow mb-2">Retirados</p>
              {archivedOf(slots).map((c) => (
                <div key={c.id} className="pick-row" style={{ opacity: 0.5, cursor: "default" }}>
                  <span className="pick-row-name">{c.name || "Sin nombre"}</span>
                  <span className="pick-row-sub">Retirado. Solo el DM puede devolverlo a juego.</span>
                </div>
              ))}
            </div>
          )}

          {charId && (
            <button
              className="btn-ghost"
              onClick={async () => {
                if (!confirm("¿Retirar a este personaje del juego? Dejarás de verlo y solo el DM podrá devolverlo.")) return;
                const err = await archiveCharacter(charId);
                if (err) { setArchiveError(err); return; }
                // A /crear: sin activo, es donde se hace el siguiente.
                window.location.href = "/crear";
              }}
            >
              <i className="fas fa-box-archive mr-2" />Retirar personaje
            </button>
          )}
          {archiveError && (
            <p className="font-ui text-[12px] font-bold mt-3" style={{ color: "var(--color-ember)" }}>
              <i className="fas fa-circle-exclamation mr-1.5" />{archiveError}
            </p>
          )}
        </div>
      )}
```

> **La confirmación no es opcional.** Aunque archivar sea reversible, para el
> jugador solo lo es **a través del DM**: en la práctica es un adiós.

> **Navegación**: se usa `window.location.href` y no `useRouter` porque
> `CharacterSheet.tsx` **no importa `next/navigation`** hoy, y una recarga
> completa aquí es lo que queremos: el estado de la hoja recién archivada debe
> desaparecer del todo.

> **`.pick-row` con `cursor: default`**: es una clase pensada para botones
> (linaje/subclase). Aquí se usa sobre un `<div>` **sin `onClick`**, solo por el
> aspecto. Si eso te chirría, un `<div className="panel p-3">` propio también
> vale — pero **no lo hagas clicable**: el jugador no puede tocar sus archivados.

- [ ] **Paso 4: Verificar**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Paso 5: Commit**

```bash
git add components/CharacterSheet.tsx
git commit -m "feat(archivo): retirar personaje desde la hoja

Botón con confirmación (para el jugador es un adiós: solo el DM puede
devolverlo) y lista de retirados en gris con el contador. Solo sobre la
ficha propia: el DM tiene sus acciones en su panel.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: API del DM — acotar al activo y añadir las acciones

**Bug latente que arregla esta tarea**: la API hace
`.update(update).eq("user_id", userId)`. Con varias filas por jugador, **dar XP
se lo daría a los tres personajes a la vez**.

**Archivos:**
- Modificar: `app/api/dm/character/route.ts`

- [ ] **Paso 1: Acotar todas las escrituras al personaje activo**

En `route.ts`, la lectura (línea 35) y la escritura (línea 54) van por
`user_id`. Añade `.is("archived_at", null)` a ambas:

```ts
    const { data: row } = await admin.from("characters")
      .select("items, gold, xp, level")
      .eq("user_id", userId).is("archived_at", null).maybeSingle();
```

```ts
  // Solo el personaje EN JUEGO. Sin este filtro, dar XP se lo daría también a
  // los archivados: hay varias filas por jugador desde schema_v14.
  const { error } = await admin.from("characters")
    .update(update).eq("user_id", userId).is("archived_at", null);
```

- [ ] **Paso 2: NO añadas restore/destroy aquí. Van sin endpoint.**

**Esta tarea NO añade acciones nuevas a la API.** La versión anterior de este plan
mandaba hacer `restore`/`destroy` aquí con `service_role`, y **estaba mal**. Lo
detectó la revisión de la Tarea 1:

- `service_role` **salta la RLS, pero NO los triggers**: un `BEFORE UPDATE`
  dispara con cualquier rol.
- Con `service_role` la petición **no lleva JWT de usuario**, así que
  `auth.uid()` es `null` dentro del trigger → `public.is_dm()` da **`false`** →
  `guard_desarchivar` **rechaza al DM de verdad**, con el mensaje pensado para
  bloquear a los jugadores. El botón «Devolver a juego» **no funcionaría nunca**,
  y `tsc` y `build` no dirían ni mu.

**El camino correcto es la sesión autenticada del DM**, que es lo que
`schema_v14` ya prepara: la policy `"chars: actualizar lo propio"` lleva
`or public.is_dm()`, y la de delete es `using (public.is_dm())`. Con su propia
sesión, la RLS le deja y el trigger ve su `auth.uid()` real.

**Y hay precedente en el repo**: «Resetear aptitudes» del Panel DM **no tiene
endpoint** — la RLS ya lo cubre (ver `HANDOFF.md`, milestone de la Fase K).
Restaurar y borrar siguen ese mismo patrón, **desde el cliente, en la Tarea 7**.

Así que en esta tarea **solo haces el Paso 1** (acotar al activo). No toques nada
más de este archivo.

- [ ] **Paso 3: Verificar**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Paso 4: Commit**

```bash
git add app/api/dm/character/route.ts
git commit -m "fix(archivo): la API del DM solo toca al personaje en juego

Bug latente: update .eq(user_id) le habría dado el XP a los tres
personajes del jugador a la vez, porque desde schema_v14 hay varias
filas por jugador. Se acota al que está en juego.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Panel DM › Grupo — restaurar y borrar

**Archivos:**
- Modificar: `app/dm/GrupoPanel.tsx`

- [ ] **Paso 1: Leer `app/dm/GrupoPanel.tsx`**

Localiza el botón **«Resetear aptitudes»**: es el mismo tipo de poder y el sitio
donde van las acciones nuevas. Fíjate en cómo llama a la API o a Supabase.

- [ ] **Paso 2: Cargar los archivados de cada jugador**

`useParty` solo trae activos (Tarea 3), así que el panel necesita los archivados
aparte:

```tsx
  const [archivados, setArchivados] = useState<Record<string, { id: string; name: string }[]>>({});
  useEffect(() => {
    const supabase = createClient();
    supabase.from("characters").select("id, user_id, name, archived_at")
      .not("archived_at", "is", null)
      .then(({ data }) => {
        const by: Record<string, { id: string; name: string }[]> = {};
        for (const c of (data ?? []) as { id: string; user_id: string; name: string }[]) {
          (by[c.user_id] ??= []).push({ id: c.id, name: c.name });
        }
        setArchivados(by);
      });
  }, []);
```

- [ ] **Paso 3: La UI, por jugador**

Junto a «Resetear aptitudes» de cada jugador:

```tsx
  {(archivados[m.user_id] ?? []).length > 0 && (
    <div className="mt-3">
      <p className="eyebrow mb-1.5">Retirados</p>
      {(archivados[m.user_id] ?? []).map((c) => (
        <div key={c.id} className="flex items-center gap-2 mb-1.5">
          <span className="font-ui text-[12px]" style={{ color: "var(--color-muted)" }}>{c.name || "Sin nombre"}</span>
          <button className="btn-ghost !py-1 !text-[11px]" onClick={() => dmAction("restore", c.id)}>
            <i className="fas fa-rotate-left mr-1" />Devolver a juego
          </button>
          <button className="btn-ghost !py-1 !text-[11px]" style={{ color: "var(--color-ember)" }}
            onClick={() => { if (confirm(`¿Borrar a "${c.name}" para siempre? Esto NO se puede deshacer.`)) dmAction("destroy", c.id); }}>
            <i className="fas fa-trash mr-1" />Borrar
          </button>
        </div>
      ))}
    </div>
  )}
```

Con el helper. **Va por la sesión del DM, sin endpoint** — como «Resetear
aptitudes», que ya funciona así porque la RLS lo cubre:

```tsx
  // Restaurar y borrar van con la SESIÓN del DM, no por la API con service_role.
  // Motivo (lo cazó la revisión de schema_v14): service_role salta la RLS pero
  // NO los triggers, y sin JWT `auth.uid()` es null → `is_dm()` da false →
  // `guard_desarchivar` rechazaría al propio DM. Con su sesión, la policy
  // («chars: actualizar lo propio», que lleva `or is_dm()`) le deja y el trigger
  // ve su auth.uid() real. Mismo patrón que «Resetear aptitudes».
  async function dmAction(action: "restore" | "destroy", characterId: string, userId: string) {
    const supabase = createClient();
    setDmError(null);

    if (action === "restore") {
      // El índice único parcial impide dos activos. Se comprueba antes para dar
      // un mensaje decente en vez de soltar el error de Postgres.
      const { data: activo } = await supabase.from("characters")
        .select("id").eq("user_id", userId).is("archived_at", null).maybeSingle();
      if (activo) {
        setDmError("Ese jugador ya tiene un personaje en juego. Retíralo antes de devolver este.");
        return;
      }
      const { error } = await supabase.from("characters").update({ archived_at: null }).eq("id", characterId);
      if (error) { setDmError(error.message); return; }
    } else {
      // La FK de stat_rolls es `on delete cascade`: la tirada se va con él.
      const { error } = await supabase.from("characters").delete().eq("id", characterId);
      if (error) { setDmError(error.message); return; }
    }
    location.reload();
  }
```

Con `const [dmError, setDmError] = useState<string | null>(null);` y su
`{dmError && <p …>{dmError}</p>}` en el JSX.

Las llamadas del Paso 3 pasan a `dmAction("restore", c.id, m.user_id)` y
`dmAction("destroy", c.id, m.user_id)`.

> El `confirm` del borrado **dice el nombre y dice que no se puede deshacer**.
> Es la única acción irreversible de toda la feature.

- [ ] **Paso 4: Verificar**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Paso 5: Commit**

```bash
git add app/dm/GrupoPanel.tsx
git commit -m "feat(archivo): el DM devuelve a juego y borra

Junto a «Resetear aptitudes», que es el mismo tipo de poder. Devolver
avisa si el jugador ya tiene otro en juego en vez de chocar contra el
índice único. Borrar dice el nombre y que no se deshace.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Verificación, documentación y la migración coordinada

- [ ] **Paso 1: Gates**

```bash
npx tsc --noEmit && npm run build && npx tsx scripts/check-archive.ts && npx tsx scripts/check-statrolls.ts && npx tsx scripts/check-dice.ts && npx tsx scripts/check-dicebox.ts
```
Todos limpios.

- [ ] **Paso 2: Los 8 consumidores, uno por uno**

**Este es el fallo más probable de la feature.** Lee cada uno y confirma que no
puede enseñar un archivado:

```bash
grep -rn "useParty" app/ components/ lib/
```

Para cada uno (`GrupoPanel`, `BaulPanel`, `DadosPanel`, `EncuentrosPanel`,
`CharacterSheet`, `DicePanel`, `InitiativeTracker`, `useChronicle`,
`useInitiative`): confirma que **todo lo que lista al grupo sale de `useParty`**
(que ya filtra) y **no de una consulta propia a `characters`**. Si alguno
consulta la tabla por su cuenta, **añádele el filtro** `.is("archived_at", null)`.

```bash
grep -rn 'from("characters")' app/ components/ lib/
```
Cada resultado debe: filtrar por `archived_at`, o ir por `id`, o ser
explícitamente la consulta de archivados del Panel DM.

- [ ] **Paso 3: Navegador**

El dev server debe arrancarse **DESPUÉS** de excluir `crear` del matcher de
`proxy.ts` (`|dice-box|crear|`) — si se edita con el server en marcha, no lo
recoge y `/crear` sigue redirigiendo a `/login`. **Revertir `proxy.ts` al
terminar** y comprobarlo con `git diff --stat proxy.ts` (debe salir vacío).

Sin base de datos, `/crear` solo se puede ver en modo localStorage: comprueba que
**no se rompe** (sin `userId` no hay archivado ni límite; el bloque del límite va
dentro de `{userId && ...}`).

**El screenshot se cuelga con WebGL** (dice-box): usa `javascript_tool`.

- [ ] **Paso 4: HANDOFF.md**

Añade un milestone `## RESUELTO (2026-07-17): Archivar personaje` **encima** del
de las escenas por paso. Recoge: el modelo nuevo (id PK, archived_at, uno activo,
máximo 3), las tres garantías en la BD y **por qué el desarchivado va en trigger
y no en RLS**, que **`stat_rolls` pasa a `character_id`** y que eso **relaja la
Fase K a propósito** (el freno pasa del servidor al DM, acotado por el límite de
3 — decisión explícita del usuario), el bug latente de la API del DM que se
arregló de paso, y que **`schema_v14` reestructura tablas con datos**.

Actualiza también la sección «Migraciones Supabase» con `schema_v14`.

- [ ] **Paso 5: Vault**

- `50 Funcionalidades/Archivar personaje.md` **nuevo**, enlazado desde
  `[[Hoja interactiva]]`, `[[Panel DM]]` y `[[Modelo de datos]]`.
- `20 Arquitectura/Migraciones.md`: añadir v14 y **avisar de que no es como las
  anteriores** (reestructura datos).
- `50 Funcionalidades/Creador de personaje.md`: la sección de la Fase K dice hoy
  que la tirada es **del jugador**. **Ya no es cierto**: pasa a ser por
  personaje. Corrígelo y explica por qué cambió.
- `00 Meta/Pendientes.md`: la prueba en vivo (archivar, límite, restaurar,
  borrar).
- Quitar del backlog (`00 Meta/Backlog e ideas.md` y `HANDOFF.md`) la entrada
  «Archivar personaje», que pasa a estar hecha.

- [ ] **Paso 6: Commit de la documentación**

```bash
git add HANDOFF.md
git commit -m "docs(archivo): registra archivar personaje y el cambio de la Fase K

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Paso 7: PARAR. La migración la ejecuta el usuario.**

**No hagas `push` sin coordinar.** Preséntale al usuario:

1. **Qué mirar antes** — cuántas filas hay en `characters` y en `stat_rolls`, y
   cuántas tiradas huérfanas se van a borrar:
   ```sql
   select count(*) from public.characters;
   select count(*) from public.stat_rolls;
   select count(*) from public.stat_rolls sr
     where not exists (select 1 from public.characters c where c.user_id = sr.user_id);
   ```
2. **El SQL**: `supabase/schema_v14.sql`, entero, de una vez.
3. **Cómo comprobar que quedó bien**:
   ```sql
   -- Cada jugador, como mucho un activo (debe salir vacío):
   select user_id, count(*) from public.characters
    where archived_at is null group by user_id having count(*) > 1;
   -- Ninguna tirada sin personaje (debe salir 0):
   select count(*) from public.stat_rolls where character_id is null;
   -- Nadie con más de 3 (debe salir vacío):
   select user_id, count(*) from public.characters group by user_id having count(*) > 3;
   ```
4. **El orden**: el usuario ejecuta el SQL **y entonces** se hace el `push`. Al
   revés rompe producción; a la vez, hay una ventana de segundos en que el
   código viejo habla con el esquema nuevo — **avísale de que lo haga cuando no
   haya nadie jugando**.

---

## Qué NO hace este plan

- **Varios personajes activos a la vez.**
- **Que el jugador borre de verdad.** Es del DM.
- **Retroactividad**: no se inventan archivados que no existían.
- **No arregla `npm run lint`**, roto repo-wide de antes.
- **No toca** el reparto de aptitudes, el creador ni la hoja más allá de lo que
  exige el modelo nuevo.

## Lo que solo puede probar el usuario

No hay credenciales de Supabase en desarrollo, así que **nada de esto se puede
probar aquí**: archivar, el límite de 3, restaurar, borrar, y que el XP del DM
solo le llegue al activo. Es más de lo habitual — esta feature es casi toda
base de datos.
