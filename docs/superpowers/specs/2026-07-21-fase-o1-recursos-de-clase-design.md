# Diseño — Fase O1: recursos de clase que se gastan y se recuperan

Fecha: 2026-07-21 · Rama prevista: `fase-o1-recursos` · **Migración `schema_v20.sql`.**

## Problema

La ficha muestra los rasgos de clase como texto y los pozos de usos como chapas
**estáticas** (`resourceChips` en `components/CharacterSheet.tsx:619`): «Furias
3» y ya. No se puede gastar una furia, ni ver cuántas te quedan, ni que el
descanso las devuelva. Hoy eso se lleva a mano en la mesa.

Es el hueco mecánico que más clases afecta: bárbaro, monje, guerrero, pícaro,
bardo, clérigo, paladín y brujo tienen todos algún pozo que gestionar.

## Decisiones del usuario

Preguntadas antes de diseñar:

1. **Gastarlas y recuperarlas**, no solo consultarlas: contador por recurso, el
   descanso las restaura, y la lista de rasgos sigue a la vista.
2. **La Fase O se parte en dos**: **O1** (este spec) son los recursos de clase;
   **O2** serán los conjuros, por tramos, empezando por trucos y niveles 1–3.

O1 va primero a propósito: no depende de cargar el SRD, beneficia a las clases
que hoy no tienen nada mecánico, y deja probado el motor de gasto y recarga
sobre el que se apoyará O2.

## Arquitectura

### 1. Marcar qué es un pozo (`data/classdata/types.ts` + 14 archivos)

Hoy `resources` mezcla dos cosas distintas:

| Ejemplo | Qué es |
|---|---|
| `Furias: [2,2,3,…]` | **pozo**: se gasta y se recupera |
| `Daño de furia: ["+2",…]` | **referencia**: se consulta al usar el rasgo |
| `Puntos de foco: [0,2,3,…]` | pozo |
| `Dado de Artes Marciales: ["1d6",…]` | referencia |

El tipo gana un campo opcional; lo que no lo declare sigue siendo referencia:

```ts
export type ClassResource = {
  name: string;
  values: (number | string)[];
  /** Solo los POZOS: se gastan con un toque y se recargan al descansar. */
  spend?: { key: string; recharge: "corto" | "largo" };
};
```

`key` es un identificador estable (`"furias"`, `"puntos-de-foco"`) que es lo que
se guarda en la ficha — así renombrar la etiqueta visible no pierde el estado.

Hay que repasar los 14 archivos de `data/classdata/` y marcar los pozos con su
descanso de recarga. Son **mecánicas de las 2024**: hechos, no invención.

**Regla de alcance**: solo se marcan pozos de **clase base**. Si un rasgo de
**subclase** tiene pozo propio, se anota en el informe y se deja para una pasada
posterior — mezclarlo aquí ensancha la tarea sin necesidad.

### 2. Qué se guarda (`schema_v20.sql`)

Una columna nueva, no dos: se lee y se escribe siempre junta.

```sql
alter table public.characters add column if not exists play_state jsonb not null default '{}'::jsonb;
```

```jsonc
{
  "usos": { "furias": 1, "puntos-de-foco": 3 }   // GASTADOS, no restantes
}
```

Se guarda lo **gastado**, no lo restante: el máximo depende del nivel, y si el
personaje sube de nivel con el máximo guardado se quedaría desfasado. Guardando
lo gastado, subir de nivel da usos nuevos gratis, que es lo correcto.

O2 añadirá las claves `huecos`, `pacto` y `preparados` a este mismo objeto, sin
otra migración.

La migración es **idempotente** y **solo añade** (no reestructura como la v14).

### 3. Resolución pura (`lib/recursos.ts`, nuevo)

Mismo espíritu que `lib/derive.ts` y `lib/gameClock.ts`: sin React ni Supabase.

```ts
export type Pozo = {
  key: string;
  name: string;
  max: number;
  gastados: number;
  quedan: number;
  recharge: "corto" | "largo";
  /** columnas de referencia de esa clase, ya resueltas al nivel (p. ej. "+2") */
};

export function pozosDe(clsSlug: string, level: number, play: PlayState): Pozo[];
export function referenciasDe(clsSlug: string, level: number): { name: string; value: string }[];
export function gastar(play: PlayState, key: string, max: number): PlayState;
export function devolver(play: PlayState, key: string): PlayState;
export function recargar(play: PlayState, cls: string, level: number, tipo: "corto" | "largo"): PlayState;
```

Un pozo con `max === 0` a ese nivel **no se lista** (el monje no tiene foco a
nivel 1). `gastar` nunca pasa del máximo; `devolver` nunca baja de cero.

### 4. La ficha (`components/CharacterSheet.tsx`)

La sección «Rasgos de clase» que ya existe gana, **encima** de la lista de
rasgos:

- **Una fila por pozo** con puntos pulsables: `●●●○ Furias · 3 de 4`. Un toque
  gasta; un toque en un punto ya gastado lo devuelve. Debajo, en pequeño, con
  qué descanso recarga.
- **Las referencias** en una línea aparte («Daño de furia +2 · Dado de Artes
  Marciales 1d6»), que es justo lo que se mira al usar el rasgo.

Los `resourceChips` estáticos actuales **se retiran**: los sustituyen los
contadores y la línea de referencias.

Persistencia con `saveCharacter` (sesión del jugador, RLS de propietario), con
mutación optimista como el resto de la hoja.

### 5. El descanso recarga de verdad (`app/api/descanso/route.ts`)

El endpoint ya carga la ficha con `service_role` y mueve el reloj. Se le añade
el paso que falta, en la misma transacción lógica:

- **corto** → recarga los pozos `recharge: "corto"`;
- **largo** → recarga **todos**.

La respuesta devuelve el `play_state` nuevo para que la ficha se refresque sin
recargar la página. `lib/descanso.ts` (el cliente) propaga ese dato.

### 6. El DM (`app/api/dm/character/route.ts` + Panel DM › Grupo)

El endpoint gana la operación `setUses` (`{ key, gastados }`), en la línea de
`setLevel`/`addXp`/`unlockLore` que ya tiene. En Panel DM › Grupo, bajo cada
jugador, sus pozos con el mismo control: devolver una furia, vaciar el foco.

## Verificación

`scripts/check-clases.ts` (nuevo, patrón de `check-clima.ts`):

- todo pozo declarado existe como columna de `resources` en su clase;
- toda columna `values` tiene exactamente 20 entradas (niveles 1–20);
- los pozos son numéricos y **nunca decrecen** al subir de nivel;
- un pozo con máximo 0 a un nivel dado no se lista (monje nv1 sin foco);
- `gastar` no pasa del máximo y `devolver` no baja de cero;
- `recargar("corto")` deja intactos los pozos de descanso largo, y
  `recargar("largo")` los vacía todos;
- muestra concreta: bárbaro nv1 → 2 furias; nv12 → 5; monje nv2 → 2 de foco.

Gate del proyecto: `tsc --noEmit` + `next build`. Prueba en navegador.

## Fuera de alcance

- **Los conjuros** (Fase O2), incluidos los huecos de pacto del brujo.
- **PG actuales y condiciones** (backlog aparte).
- **Pozos de subclase**: se anotan, no se implementan.
- No se toca el creador de personaje ni `derive.ts`.

## Riesgos

- **Repasar 14 archivos de clase** es el grueso del trabajo y es donde se pueden
  colar errores de datos. Lo cubre el script de comprobación, que valida forma y
  coherencia de todas las columnas, no solo de las que se marquen.
- **Subir de nivel con usos gastados**: resuelto guardando lo gastado en vez de
  lo restante, pero conviene comprobarlo en la prueba en vivo.
- **`play_state` compartido con O2**: si O2 llega antes de que O1 esté probado en
  mesa, las dos features escriben el mismo jsonb. Se mitiga con claves separadas
  (`usos` vs `huecos`) y escrituras que fusionan en vez de reemplazar.
