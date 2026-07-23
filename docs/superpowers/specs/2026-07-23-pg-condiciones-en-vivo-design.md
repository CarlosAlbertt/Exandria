# Diseño — PG actuales y condiciones en vivo

Fecha: 2026-07-23 · Rama prevista: `pg-condiciones-vivo` · **Sin migración.**

## Problema

La ficha muestra **PG máximos** (`d.maxHp`, `CharacterSheet.tsx:523`) pero no los
**actuales**: en combate, el daño y la curación se llevan a mano, fuera de la
app. Tampoco hay condiciones (envenenado, derribado, aturdido…), que en las 2024
cambian lo que puedes hacer en tu turno. Es el hueco que más se nota en cada
pelea: la herramienta acompaña la ficha pero no el combate.

El backlog lo pedía como «PG actuales y condiciones **en vivo**». «En vivo» es
literal: el panel del DM (`useParty`) ya se refresca solo, pero la ficha del
propio jugador carga una vez y no se entera de que el DM le ha pegado.

## Decisiones del usuario

Preguntadas antes de diseñar:

1. **Alcance**: PG actuales **+ condiciones** (las 15 de 2024 + agotamiento por
   niveles). Fuera del alcance, a propósito: dados de golpe que se gastan,
   salvaciones de muerte a 0 PG. Eso es «el combate entero de la ficha», otra
   tanda.
2. **Quién edita**: **jugador y DM, ambos**. El jugador se apunta su daño/cura y
   sus condiciones en su ficha (guardado optimista, patrón de O1); el DM hace lo
   mismo sobre cualquier ficha desde Panel DM › Grupo (vía `/api/dm/character`).
3. **En vivo de verdad**: cuando el DM te aplica algo, tu ficha abierta lo
   refleja **sin recargar**. `CharacterSheet` en modo `self` se suscribe a su
   propia fila.

## Modelo de datos — sin migración

Todo vive en `characters.play_state` (jsonb), la columna de la Fase O. **Cuatro
claves nuevas**, todas fusionan sobre el jsonb, **ninguna toca `usos`** (O1):

```ts
export type PlayState = {
  usos?: Record<string, number>;   // O1, intacto
  hp?: number;                     // PG actuales; ausente ⇒ maxHp (ficha nueva = a tope)
  tempHp?: number;                 // PG temporales; se restan antes que hp, no exceden el daño
  conds?: string[];                // slugs de condición activa: ["envenenado","derribado"]
  agotamiento?: number;            // 0–6 (aparte: tiene niveles, no on/off)
  [otros: string]: unknown;
};
```

Se guarda el **PG actual absoluto**, no el daño acumulado: es lo que el jugador
lee y edita, y no depende del máximo (que cambia al subir de nivel). Si `hp`
falta, `pgActuales` devuelve `maxHp` — una ficha recién creada está a tope sin
escribir nada. Es la misma filosofía «ausente = valor por defecto» de O1.

`PlayState` ya está declarado en `lib/recursos.ts`; se **amplía ahí** con las
claves nuevas para no partir el tipo en dos módulos.

## Arquitectura

### 1. Capa pura (`lib/estado.ts`, nuevo)

Mismo molde que `lib/recursos.ts` / `lib/derive.ts`: sin React ni Supabase, todo
funciones puras sobre `PlayState`.

**Datos** (mecánicas 2024 = hechos; textos de efecto = **redacción propia**,
igual que `EFECTOS` en `lib/weather.ts`):

```ts
export type Condicion = { slug: string; name: string; icon: string; regla: string };
export const CONDICIONES: Condicion[];   // las 15 de 2024
export const AGOTAMIENTO: string[];       // 6 niveles, regla de cada uno
```

Las 15: cegado, hechizado, ensordecido, asustado, apresado (grappled),
incapacitado, invisible, paralizado, petrificado, envenenado, derribado,
restringido (restrained), aturdido, inconsciente — y **agotamiento** aparte
(0–6). Cada condición con su icono FA y un resumen de regla en prosa propia,
corto (lo que hace en la mesa, no la cita del libro).

Agotamiento 2024: cada nivel resta **−2 acumulativo a toda prueba de d20** y
**−1,5 m de velocidad**; a **nivel 6, mueres**. Redacción propia.

**Funciones** (todas devuelven un `PlayState` nuevo, fusionado, sin tocar `usos`):

| Función | Qué hace |
|---|---|
| `pgActuales(play, maxHp)` | `play.hp ?? maxHp`, acotado a `[0, maxHp]` |
| `pgTemp(play)` | `play.tempHp ?? 0`, nunca negativo |
| `aplicarDaño(play, n, maxHp)` | come `tempHp` primero, luego `hp`; suelo 0 |
| `curar(play, n, maxHp)` | sube `hp`; techo `maxHp`; no toca `tempHp` |
| `setTemp(play, n)` | fija `tempHp` al valor dado (suelo 0). Nota: en RAW los temporales no se acumulan (te quedas con la mayor fuente); esa decisión es de la mesa, la función solo fija el número que el jugador escribe |
| `alternarCondicion(play, slug)` | añade/quita el slug de `conds` |
| `setAgotamiento(play, n)` | fija `agotamiento` acotado a `[0, 6]` |

Regla de daño con temporales (RAW 2024): el daño se resta **primero** de los
temporales; lo que sobre, del actual. La curación **no** repone temporales.

**Verificación** (`scripts/check-estado.ts`, patrón `check-clases.ts`): que toda
condición de `CONDICIONES` tenga regla no vacía y slug único; que los 6 niveles
de agotamiento existan; que `aplicarDaño`/`curar` respeten los topes 0 y maxHp;
que el daño consuma tempHp antes que hp y nunca lo deje negativo; que `hp`
ausente signifique maxHp; y que **ninguna** función escriba en `usos` ni en otras
claves de O1/O2.

### 2. UI de la ficha (`components/personaje/EstadoVivo.tsx`, nuevo)

Mismo contrato que `PozosClase.tsx`: `{ play, maxHp, onChange, readOnly }`.

- **Barra de PG**: `actual / máx` grande, barra cuyo color va de verde a rojo
  según el ratio; escudito con los PG temporales si `tempHp > 0`. A 0 PG, la
  barra se marca «inconsciente» (sin automatizar salvaciones de muerte —
  fuera de alcance). Controles: campo numérico + botones **−daño** / **+cura**
  (llaman a `aplicarDaño`/`curar`) y un campo para **fijar PG temporales**.
- **Condiciones**: rejilla de chapas pulsables — el patrón visual de los puntos
  de `PozosClase` (activa = rellena en color de alarma, inactiva = contorno). Un
  toque alterna. Tooltip de cada chapa = su `regla`.
- **Agotamiento**: fila 0–6 pulsable; debajo, el efecto del nivel actual escrito.
- `readOnly` desactiva todos los controles (para vistas de solo lectura).

Se monta en `CharacterSheet` junto al bloque de PG máx (~línea 523) y reutiliza
el `onPlayStateChange` existente (`CharacterSheet.tsx:325`) — guardado optimista
gratis, en modo `self` (→ `saveCharacter`) y en modo DM (→ `/api/dm/character`).
El `Derived` de «PG máx» se deja; la barra de actuales lo complementa.

### 3. Panel del DM (`app/dm/GrupoPanel.tsx`)

Bajo cada jugador, el mismo `EstadoVivo` en modo escritura, persistiendo por
`/api/dm/character` (patrón ya cableado para los pozos de O1). El `Stat` de «PG
máx» (`GrupoPanel.tsx:295` y `:313`) pasa a mostrar `actual / máx`. `/api/dm/
character` **ya** fusiona `patch` sobre `play_state` (operación de O1), así que
no necesita cambios de servidor.

### 4. En vivo — la ficha del jugador se suscribe

Hoy `CharacterSheet` (modo `self`) carga la fila una vez y no escucha. Se añade
una suscripción a `postgres_changes` de **su propia fila**
(`filter: user_id=eq.<uid>`) — `characters` **ya está en la publicación
realtime** (`schema_v4.sql:37`), sin migración.

Al llegar un `UPDATE`, se refrescan **solo** los campos de estado vivo desde la
fila (`play_state`, `gold`, `level`, `hp_rolls`…), **no** el build entero (que el
jugador podría estar editando en `/crear`).

**Trampa cuidada** (la lección del HANDOFF: no pisar lo que el usuario edita): se
guarda en un ref el último `play_state` que **este** cliente escribió; si el eco
que llega es igual, se ignora. Así un daño que te apuntas tú no rebota y no pisa
un segundo toque rápido. Canal con nombre único por montaje (React remonta 2×,
convención del repo).

## Qué NO entra (YAGNI)

- Salvaciones de muerte y estabilización a 0 PG.
- Dados de golpe gastables en el descanso corto.
- Automatizar el efecto mecánico de las condiciones sobre las tiradas (p. ej.
  que «envenenado» aplique desventaja solo): aquí es un marcador con su regla a
  la vista, la mesa lo aplica. Igual que `ClimaEfectos`.
- Condiciones con duración/temporizador ligado al reloj de campaña.

## Verificación

`npx tsc --noEmit` + `npx next build` limpios · `scripts/check-estado.ts` en
verde · `check-clases.ts` (116) y `check-lore.ts` (69) siguen verdes (no se tocan
sus dominios). **No probable en vivo sin sesión**: prueba del usuario anotada al
cerrar — aplicarse daño y ver que persiste al recargar; que el DM aplique daño
desde su panel y el jugador lo vea sin recargar; activar «envenenado» y verlo en
ambos lados.
