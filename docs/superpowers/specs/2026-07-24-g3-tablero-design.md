# Diseño — G3: Tablero de batalla (VTT ligero)

Fecha: 2026-07-24 · Rama prevista: `g3-tablero` · **Migración `schema_v22`.**

## Contexto — tercera losa de la jugabilidad 2024

G1 (estado del combatiente) y G2 (economía de turno + ataque) están en `master`.
G3 pone el **tablero**: una rejilla con fichas (tokens) de cada combatiente, que
el DM coloca y mueve, cada jugador mueve la suya, y todos ven **en vivo**. Con
**medición de distancia** (casillas × 1,5 m), que conecta con el movimiento y el
alcance de G2.

Es la primera losa con **estado compartido de verdad** (no per-personaje): un
tablero con fichas que se mueven mucho quiere realtime fiable, así que va en
**tablas nuevas** (`schema_v22`), no en `app_config` (cuyo realtime no dispara
para quien escribe). Decisiones del usuario (preguntadas antes de implementar):
tabla nueva; rejilla en blanco con **fondo opcional** por URL; **el DM mueve
todas las fichas y cada jugador la suya**; **sí** medición de distancia.

Lo que G1/G2 dejaron documentado para «cuando haya tablero» (fallo automático de
salvación por estar paralizado, ventaja para tu atacante, crítico automático,
alcance real del arma) necesita además un **modelo de objetivo** (quién ataca a
quién). G3 entrega el tablero y la distancia; el targeting es una losa posterior
(**G4**). Ver «Qué NO entra».

## Almacenamiento — `schema_v22` (dos tablas, realtime)

```sql
-- Fichas del tablero. Una por combatiente (jugador o PNJ).
create table if not exists public.battle_tokens (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,  -- null = PNJ
  label text not null,
  x real not null default 50,   -- posición en % [0,100] del ancho del tablero
  y real not null default 50,   -- posición en % [0,100] del alto
  color text not null default '#c9a35c',
  icon text,                     -- Font Awesome sin prefijo, opcional
  dead boolean not null default false,
  updated_at timestamptz default now()
);
alter table public.battle_tokens enable row level security;
create policy "tokens: leer" on public.battle_tokens
  for select to authenticated using (true);
-- Mover: el DM cualquiera; el jugador solo la suya.
create policy "tokens: mover propia o DM" on public.battle_tokens
  for update to authenticated using (public.is_dm() or user_id = auth.uid())
  with check (public.is_dm() or user_id = auth.uid());
-- Crear/borrar: solo el DM.
create policy "tokens: crear DM" on public.battle_tokens
  for insert to authenticated with check (public.is_dm());
create policy "tokens: borrar DM" on public.battle_tokens
  for delete to authenticated using (public.is_dm());
alter publication supabase_realtime add table public.battle_tokens;

-- Configuración del tablero. Fila única (id = 1).
create table if not exists public.battle_board (
  id int primary key default 1,
  bg_url text,
  cols int not null default 20,
  rows int not null default 12,
  active boolean not null default false,   -- ¿combate en curso? (muestra el tablero a los jugadores)
  updated_at timestamptz default now(),
  constraint battle_board_singleton check (id = 1)
);
alter table public.battle_board enable row level security;
create policy "board: leer" on public.battle_board
  for select to authenticated using (true);
create policy "board: editar DM" on public.battle_board
  for all to authenticated using (public.is_dm()) with check (public.is_dm());
alter publication supabase_realtime add table public.battle_board;
insert into public.battle_board (id) values (1) on conflict do nothing;
```

`is_dm()` ya existe (`schema.sql`). Posición en **%** para ser independiente de la
resolución del tablero. **Es la primera migración pendiente desde la v21**: el
código degrada con elegancia si las tablas faltan (ver el hook), y el HANDOFF la
marca PENDIENTE.

## Arquitectura

### 1. Capa pura de geometría (`lib/tablero.ts`, nuevo)

Sin React ni Supabase. Convierte posiciones en % a casillas y mide distancia.

```ts
export type Pos = { x: number; y: number };  // en % [0,100]

/** La casilla (columna, fila) en la que cae una posición. */
export function celda(p: Pos, cols: number, rows: number): { cx: number; cy: number };

/**
 * Distancia entre dos posiciones, en metros. Regla 2024 simplificada: cada
 * casilla (incl. diagonal) es 1,5 m → distancia = Chebyshev(casillas) × 1,5.
 */
export function distanciaMetros(a: Pos, b: Pos, cols: number, rows: number): number;
```

`celda`: `cx = clamp(floor(x/100 * cols), 0, cols-1)`, igual con `cy`.
`distanciaMetros`: `max(|cxA−cxB|, |cyA−cyB|) × 1.5`.

**Verificación** (`scripts/check-tablero.ts`): la casilla de una posición conocida;
misma casilla ⇒ 0 m; una casilla en diagonal ⇒ 1,5 m (Chebyshev, no 3); tres
casillas en recta ⇒ 4,5 m; clamp de posiciones fuera de [0,100].

### 2. Hook y mutaciones (`lib/useBattle.ts`, nuevo)

Molde de `lib/useInitiative.ts` (recarga entera ante cualquier cambio; canal con
sufijo aleatorio por montaje). Se suscribe a **ambas** tablas.

```ts
export type Token = { id: number; user_id: string | null; label: string; x: number; y: number; color: string; icon: string | null; dead: boolean };
export type Board = { bg_url: string | null; cols: number; rows: number; active: boolean };

export function useBattle(): { tokens: Token[]; board: Board; ready: boolean; missing: boolean };
```

- **Degrada** si las tablas faltan (migración sin ejecutar): la consulta falla con
  `42P01` (relación inexistente) → `ready = true`, `tokens = []`, `board` por
  defecto (`{ bg_url: null, cols: 20, rows: 12, active: false }`), y **`missing =
  true`** para que la UI avise al DM de ejecutar `schema_v22`. Nunca revienta.
- Mutaciones (funciones sueltas, como `useInitiative`):
  - `moveToken(id, x, y)` — `update` de x/y (RLS: DM o dueño).
  - `addNpcToken(label, opts?)` — `insert` (RLS: DM).
  - `addPlayerToken(userId, label)` — `insert` con `user_id` (RLS: DM).
  - `removeToken(id)` / `clearTokens()` — `delete` (RLS: DM).
  - `setBoard(patch)` — `update` de la fila 1 (RLS: DM).
  - `poblarDesdeIniciativa(rows, nombres)` — borra los tokens y crea uno por fila
    de iniciativa: jugadores con su `user_id` y nombre, PNJ con `user_id` null.

### 3. Tablero visual (`components/tablero/BattleBoard.tsx`, nuevo)

El componente compartido (jugador y DM). Props:

```ts
{
  tokens: Token[];
  board: Board;
  canMove: (t: Token) => boolean;   // el jugador: su ficha; el DM: todas
  onMove: (id: number, x: number, y: number) => void;
  onSelect?: (id: number | null) => void;
}
```

- Contenedor con `aspect-ratio = cols/rows`, fondo `bg_url` (`object-cover`) o el
  oscuro del tema; rejilla de líneas `cols`×`rows` con un `<svg>` o gradientes CSS.
- Cada token: círculo posicionado por `left: x%`, `top: y%` (centrado con
  `translate(-50%,-50%)`), con su color, inicial o icono, y atenuado si `dead`.
- **Arrastre** (solo si `canMove(t)`): `pointer` events; en `move`, calcular la
  posición como `%` respecto al `getBoundingClientRect()` del contenedor, acotar a
  [0,100], y `onMove(id, x, y)` (optimista: se ve al instante, persiste en
  paralelo). Se usa la misma idea que `components/PinDragMap.tsx`.
- **Selección + distancia**: al tocar una ficha (sin arrastrar) se **selecciona**;
  entonces cada otra ficha muestra su **distancia en metros** (`distanciaMetros`)
  como etiqueta. Tocar el fondo deselecciona.

### 4. Vista del jugador (`app/tablero/page.tsx`, nueva)

Página `/tablero` (autenticada; el matcher de `proxy.ts` ya cubre todas las rutas).
`useBattle` + `useSession`. `BattleBoard` con `canMove = (t) => t.user_id ===
session.id`. Si `board.active` es `false` o no hay tokens, estado vacío amable
(«No hay combate en curso»). Si `missing` y eres DM, aviso de ejecutar la
migración. Enlace en `SiteNav` («Tablero»).

### 5. Panel del DM (`app/dm/TableroPanel.tsx`, nuevo + pestaña en `DmDashboard`)

Nueva pestaña **«Tablero»** (`fa-chess-board`) en `DmDashboard` (añadir a `Tab` y
al array de botones). El panel:
- **Config del tablero**: campo URL de fondo, `cols`/`rows` (número), y un toggle
  **«Combate en curso»** (`board.active`) que decide si los jugadores ven el
  tablero. `setBoard`.
- **Fichas**: botón **«Poblar desde iniciativa»** (`poblarDesdeIniciativa` con
  `useInitiative().rows` + los nombres de `useParty`), añadir un **PNJ** a mano
  (nombre + color), y **borrar** una ficha o **vaciar** todas.
- `BattleBoard` con `canMove = () => true` (el DM mueve todas).

`poblarDesdeIniciativa` resuelve el nombre del jugador desde `useParty` (como hace
`InitiativeTracker`); una fila de iniciativa de PNJ (`is_npc`) crea un token sin
`user_id`.

### 6. Navegación (`components/SiteNav.tsx`)

Añadir `{ href: "/tablero", label: "Tablero" }` a `NAV_LINKS` (tras «Mapa»).

## Qué NO entra en G3 (YAGNI / futuras losas)

- **Targeting** (elegir objetivo de un ataque) y con él: fallo automático de
  salvación por estar incapacitado, **ventaja para tu atacante** por cegado/
  derribado/restringido, y **crítico automático** — todo eso necesita saber quién
  ataca a quién → **G4**. G3 da posición y distancia; el resto lo juzga la mesa
  con esa información delante.
- **Alcance del arma** que bloquee el ataque si no llegas: la distancia se
  **muestra**, no impone. Atar el botón de ataque de G2 al alcance es de G4.
- **Rejilla con terreno, muros, línea de visión, áreas de efecto**: fuera.
- **Tamaño de ficha** (grande/enorme ocupa varias casillas): todas 1×1.
- **Zoom/paneo** del tablero: el tablero cabe en pantalla (aspect-ratio), sin zoom.

## Verificación

`npx tsc --noEmit` + `npx next build` limpios · `scripts/check-tablero.ts` en
verde · check-turno, check-ataque, check-estado (35), check-clases (116),
check-lore (69) sin regresión. **No probable en vivo sin sesión ni migración**
(las tablas no existen en dev): el hook degrada (`missing`), así que la app
**compila y arranca** sin `schema_v22`; el DM la ejecuta y prueba. **Prueba del
usuario** (tras `schema_v22`): activar el combate, poblar desde iniciativa, mover
una ficha como DM y verla moverse en la vista del jugador sin recargar; como
jugador mover la propia y no poder mover otra; seleccionar dos fichas y ver la
distancia en metros.
