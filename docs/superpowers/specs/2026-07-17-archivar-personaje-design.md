# Diseño — Archivar personaje

**Fecha**: 2026-07-17 · **Rama**: `master` (trabajo directo)
**Migración**: `schema_v14.sql` (**reestructura dos tablas con datos reales**)

## Qué es

El jugador **retira** su personaje: deja de jugarlo y lo ve solo en gris. No se
borra. El **DM lo conserva** y puede **devolverlo a juego**, o **borrarlo de
verdad** si hace falta hueco.

Petición del usuario: *«una opción de "borrar personaje", pero que no lo borre,
que solo se lo oculte al usuario que lo ha solicitado; que el máster tenga
acceso a él y pueda devolverlo a la jugabilidad si lo decide, por si quiere
volver a jugarlo»*.

## Decisiones tomadas

| Decisión | Elección | Por qué |
|---|---|---|
| ¿Puede crear otro tras archivar? | **Sí** | Es el caso de uso: archivas a Vex, te haces a Grog, y el DM puede devolverte a Vex. |
| ¿Varios activos a la vez? | **No: uno activo** | Toda la app asume «un personaje por jugador» (`/personaje`, `useParty`, Panel DM, API del DM por `user_id`). Varios activos es otro proyecto. |
| Límite | **3 por jugador** (1 activo + 2 archivados) | Del usuario. |
| Al llegar al límite | **Bloqueado**; el DM borra para hacer sitio | El jugador no recupera el botón de destruir. Mismo reparto de poder que «Resetear aptitudes». |
| Tiradas de aptitudes | **Una por personaje**: nuevo personaje, nueva tirada | Del usuario. **Ver el aviso de abajo.** |
| ¿Qué ve el jugador de sus archivados? | **Lista en gris, sin acciones**, con contador | Esconderlos del todo hace incomprensible el mensaje de límite. |

### Aviso: esto relaja la Fase K a propósito

La Fase K (2026-07-15) existe para que **nadie repita su tirada**: `stat_rolls`
tiene `user_id` como PK y no tiene policy de UPDATE, así que el bloqueo es del
servidor. Con «nuevo personaje, nueva tirada», el camino para repetir pasa a ser
*archivar → crear otro → volver a tirar*.

**Está acotado, no abierto**: el límite de 3 son **3 tiradas por jugador**, y a
partir de ahí hace falta que el DM borre un archivado. Pero el freno deja de ser
el servidor y **pasa a ser el DM**. Decisión explícita del usuario, tomada
sabiendo el coste. Mesa de amigos.

## Modelo de datos

```sql
-- characters
  id          uuid primary key default gen_random_uuid()   -- NUEVO
  user_id     uuid not null references auth.users(id) on delete cascade  -- ya no es PK
  archived_at timestamptz                                  -- NUEVO: null = en juego
  -- el resto de columnas, igual

-- stat_rolls
  character_id uuid primary key references public.characters(id) on delete cascade  -- antes: user_id
  user_id      uuid not null references auth.users(id) on delete cascade  -- se conserva para la RLS
  method, scores, rolled_at  -- igual
```

`stat_rolls.user_id` **se conserva** aunque la PK pase a `character_id`: las
policies lo necesitan para `user_id = auth.uid()` sin tener que unir con
`characters` en cada comprobación.

### Las tres garantías, en la base de datos

Ninguna se confía al cliente.

1. **Uno activo por jugador** — índice único parcial:
   ```sql
   create unique index if not exists characters_un_activo
     on public.characters (user_id) where archived_at is null;
   ```
2. **Máximo 3 por jugador** — trigger `before insert` que cuenta y lanza un
   error en español. No vale hacerlo en el cliente: es la clase de límite que se
   salta cualquiera con la consola.
3. **Solo el DM desarchiva** — **trigger**, no RLS. La RLS actual de `characters`
   es `for all to authenticated using (user_id = auth.uid())`: el jugador puede
   escribir **cualquier** campo de su fila, y **`with check` no puede
   distinguir** archivar de desarchivar porque no ve el valor viejo. El trigger
   sí:
   ```sql
   -- Rechaza que archived_at pase de no-nulo a nulo si no eres el DM.
   -- El jugador puede hacer el viaje de ida, no el de vuelta.
   create or replace function public.guard_unarchive() returns trigger
   language plpgsql security definer set search_path = public as $$
   begin
     if old.archived_at is not null and new.archived_at is null
        and not public.is_dm() then
       raise exception 'Solo el DM puede devolver un personaje a juego';
     end if;
     return new;
   end $$;
   ```
   Mismo espíritu que `stat_rolls`: movimiento de ida libre, vuelta solo del DM.

**Borrado real**: solo el DM. Hoy la policy `for all` deja al jugador borrar su
propia fila. Hay que **partirla**: el jugador conserva `select`/`insert`/`update`
sobre lo suyo, pero el `delete` pasa a `using (public.is_dm())`.

## La migración es la parte peligrosa

`schema_v13` creaba una tabla **nueva y vacía**. `schema_v14` **reestructura dos
tablas con datos reales en producción**. Si sale a medias, no es «la feature
nueva no va»: es «se han movido las fichas».

Requisitos:
- **Una sola transacción** e **idempotente** (el repo ya lo hace así).
- Orden: añadir `id` a `characters` y rellenarlo → mover la PK → añadir
  `character_id` a `stat_rolls` y rellenarlo con el único personaje de cada
  jugador (`join` por `user_id`) → mover esa PK → índices, triggers y policies.
- **Las tiradas huérfanas** (un `stat_rolls` cuyo jugador no tenga fila en
  `characters`) no pueden quedarse con `character_id` nulo: la PK lo prohíbe.
  **Se borran.** Una tirada sin personaje al que pertenecer no significa nada, y
  con el modelo nuevo el jugador saca tirada nueva al crear su personaje de todas
  formas. El plan **cuenta cuántas hay antes de borrar** y se lo enseña al
  usuario, pero la decisión ya está tomada: no se conservan.

**El código y la migración aterrizan juntos.** Ejecutar v14 con el código actual
desplegado **rompe producción**: `saveCharacter` hace `upsert` sobre `user_id`, y
un `upsert` necesita un índice único que case con su target; el índice nuevo es
**parcial** (`where archived_at is null`), así que el upsert actual falla y los
jugadores dejan de poder guardar la ficha.

## Radio de impacto: 11 archivos

`useParty` no lo usa solo el Panel DM. **Todo lo que lista al grupo tiene que
filtrar archivados**, o los muertos reaparecen en la iniciativa:

- `lib/character.ts` — `loadCharacter` (activo del jugador), `saveCharacter`
  (upsert → deja de poder ir por `user_id`), `useParty` (solo activos).
- `app/api/dm/character/route.ts` — direcciona por `user_id`; pasa a `id`, o
  resuelve el activo del jugador.
- `app/dm/GrupoPanel.tsx` — restaurar y borrar de verdad, junto a «Resetear
  aptitudes».
- `app/dm/{BaulPanel,DadosPanel,EncuentrosPanel}.tsx`,
  `components/{CharacterSheet,DicePanel,InitiativeTracker}.tsx`,
  `lib/{useChronicle,useInitiative}.ts` — consumidores de `useParty`.
- `app/crear/page.tsx` — crear otro; bloqueo al llegar a 3.

## Dónde vive cada cosa

- **Archivar** → `/personaje`. Con confirmación explícita: aunque sea
  reversible, para el jugador solo lo es **a través del DM**.
- **Lista de archivados** → `/personaje`, en gris, sin acciones, contador
  «2 de 3».
- **Crear otro** → `/crear`. Con 3, **bloquea al entrar**, no al final (la
  lección del bug de la tirada: no dejes que el jugador haga todo el trabajo
  para negárselo al final).
- **Restaurar** y **borrar de verdad** → Panel DM › Grupo.
  **Restaurar exige que el jugador no tenga otro activo.** La UI debe decirlo y
  ofrecer archivar el activo primero — no dejar que choque contra el índice
  único y suelte un error de Postgres.

## No-objetivos

- **Varios personajes activos a la vez.**
- **Que el jugador borre de verdad.** Es del DM.
- Cambiar el reparto de aptitudes, la hoja o el creador más allá de lo que exija
  el modelo nuevo.
- Arreglar `npm run lint`, roto repo-wide de antes.
- Retroactividad: no se inventan personajes archivados que no existían.

## Verificación

- `npx tsc --noEmit`, `npm run build`, `npx tsx scripts/check-*.ts`.
- **`scripts/check-archive.ts` nuevo**: reglas puras del límite y del estado
  (contar activos, ¿puede crear otro?, ¿puede restaurar?).
- Navegador: arrancar el dev server **después** de excluir `crear` del matcher
  de `proxy.ts`, y **revertir** (si se edita el proxy con el server ya en
  marcha, no lo recoge y `/crear` sigue redirigiendo a `/login`).
- **Solo el usuario puede probar** (no hay credenciales en desarrollo): archivar
  con sesión, el bloqueo del límite, y restaurar/borrar como DM.
- **La migración la ejecuta el usuario**, y el plan debe darle: qué mirar antes,
  el SQL, y cómo comprobar que quedó bien.

## Riesgos

- **La migración toca datos reales.** Es el riesgo principal de toda la feature.
- **`useParty` sin filtrar** haría reaparecer archivados en iniciativa, dados y
  crónica. Es el fallo más probable: son 8 consumidores y basta olvidar uno.
- **Desincronía código/migración**: si se ejecuta v14 antes de desplegar,
  `saveCharacter` deja de guardar. Hay que coordinar el momento.
