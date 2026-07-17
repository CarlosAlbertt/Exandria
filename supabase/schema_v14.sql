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

-- Rellena `id` en las filas que existían antes de esta migración. En una
-- reejecución ya está poblada (NOT NULL de más abajo) y esto no toca nada.
update public.characters set id = gen_random_uuid() where id is null;
alter table public.characters alter column id set not null;

-- Mueve la PK de user_id a id. El nombre `characters_pkey` es el que Postgres
-- pone por defecto (creada en schema_v4.sql como `user_id uuid primary key`);
-- el `if exists` cubre la reejecución.
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
-- migración user_id era PK de characters, así que solo podía haber uno y el
-- join es inequívoco. En una reejecución ya está poblada y esto no toca nada.
update public.stat_rolls sr
   set character_id = c.id
  from public.characters c
 where c.user_id = sr.user_id
   and sr.character_id is null;

-- Tiradas huérfanas (jugador sin ninguna fila en characters): SE BORRAN. Una
-- tirada sin personaje al que pertenecer no significa nada, y con el modelo
-- nuevo el jugador saca tirada al crear su personaje de todas formas.
-- (El usuario cuenta cuántas son ANTES de ejecutar esto: ver el paso de
-- coordinación del plan — la decisión de no conservarlas ya está tomada.)
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
--
-- SECURITY DEFINER no cambia a qué usuario responde auth.uid(): PostgREST la
-- resuelve a partir del JWT de la petición y vive en un ajuste de sesión
-- (current_setting), no en el rol con el que se ejecuta la función. Que
-- is_dm() sea también security definer es solo para poder leer `profiles` sin
-- recursión de RLS (igual que en schema.sql, línea 17-23); no cambia de quién
-- mira el rol, así que el DM correcto sigue siendo el que hizo la petición.
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

-- La policy de select de v4 se llamaba "chars: leer autenticados" (using
-- true). Se renombra aquí, pero hay que tirar AMBOS nombres — el viejo y el
-- nuevo — para que la migración sea idempotente y no queden dos policies de
-- select conviviendo (una reejecución, si no, dejaría las dos activas).
drop policy if exists "chars: leer autenticados" on public.characters;
drop policy if exists "chars: leer lo propio o el DM" on public.characters;
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
