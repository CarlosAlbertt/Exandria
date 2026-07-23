# Diseño — G1: Estado del combatiente (PG, muerte y condiciones)

Fecha: 2026-07-23 · Rama prevista: `g1-estado-combatiente` · **Sin migración.**

## Contexto — la capa de jugabilidad 2024

Esto no es un ítem suelto de backlog: es la **primera losa de la jugabilidad de
combate 2024**. La app ya acompaña la ficha (creación, nivel, pozos de clase) y
tiene las piezas de mesa (iniciativa `schema_v11`/`useInitiative`, dados 3D con
petición del DM, `lib/derive.ts` para CA/salvaciones/PG máx, descansos que mueven
el reloj). Lo que falta es que la ficha sepa **el estado en combate**: si estás
vivo, sangrando o fuera; cuánto aguantas; qué te limita el turno.

El plan de jugabilidad se descompone en losas independientes; esta es la base y
no depende de ninguna:

| Losa | Qué es | Depende de |
|---|---|---|
| **G1 (este spec)** | PG actuales, temporales, salvaciones de muerte, condiciones + agotamiento | nada |
| G2 — Economía de turno | acción/adicional/reacción/movimiento por turno, ligado a la iniciativa | G1 + iniciativa |
| G3 — Tablero (Fase I) | VTT ligero con tokens y posiciones | G1 |
| O2 — Conjuros | preparar y gastar huecos | play_state |

## Decisiones del usuario

1. **Alcance de G1**: PG actuales + temporales + **salvaciones de muerte** (con
   estabilizar y caer) + las 15 condiciones de 2024 + agotamiento por niveles.
   Los **dados de golpe** gastables se dejan para la losa del descanso completo.
2. **Quién edita**: **jugador y DM**, ambos. El jugador en su ficha (guardado
   optimista, patrón O1); el DM sobre cualquiera desde Panel DM › Grupo (vía
   `/api/dm/character`, que ya fusiona `play_state`).
3. **En vivo**: la ficha del jugador (`self`) se suscribe a su fila y refleja lo
   que el DM le aplique sin recargar.
4. **Salvaciones de muerte a mano**: seis casillas pulsables (3 éxitos / 3
   fallos), sin acoplar al motor de dados. El jugador tira su d20 donde quiera y
   marca.

## Modelo de datos — sin migración

Todo en `characters.play_state` (jsonb), la columna de la Fase O. **Claves
nuevas**, todas fusionan, **ninguna toca `usos`** (O1):

```ts
export type PlayState = {
  usos?: Record<string, number>;   // O1, intacto
  hp?: number;                     // PG actuales; ausente ⇒ maxHp (ficha nueva = a tope)
  tempHp?: number;                 // PG temporales; se restan antes que hp, no exceden el daño
  muerte?: { ok: number; fail: number };  // salvaciones de muerte, 0–3 cada una
  conds?: string[];                // condiciones activas: ["envenenado","derribado"]
  agotamiento?: number;            // 0–6 (aparte: tiene niveles, no on/off)
  [otros: string]: unknown;
};
```

Se guarda el **PG actual absoluto**, no el daño: es lo que se lee y edita, y no
depende del máximo (que sube con el nivel). `hp` ausente ⇒ `maxHp` (ficha recién
creada, a tope, sin escribir nada). `muerte` solo existe mientras estás a 0 PG;
se borra al levantarte. Misma filosofía «ausente = por defecto» de O1.

`PlayState` ya vive en `lib/recursos.ts`; se **amplía ahí**, no se parte en dos.

## Arquitectura

### 1. Capa pura (`lib/estado.ts`, nuevo)

Molde de `lib/recursos.ts` / `lib/derive.ts`: sin React ni Supabase, funciones
puras sobre `PlayState`. Mecánicas 2024 = hechos; textos de efecto = **redacción
propia** (patrón `EFECTOS` de `lib/weather.ts`).

**Datos:**

```ts
export type Condicion = { slug: string; name: string; icon: string; regla: string };
export const CONDICIONES: Condicion[];   // las 15 de 2024
export const AGOTAMIENTO: string[];       // regla de cada nivel 1–6
```

Las 15: cegado, hechizado, ensordecido, asustado, apresado (grappled),
incapacitado, invisible, paralizado, petrificado, envenenado, derribado,
restringido (restrained), aturdido, inconsciente. Agotamiento aparte: cada nivel
**−2 acumulativo a toda prueba de d20** y **−1,5 m de velocidad**; a **nivel 6,
muerte** (regla 2024, redacción propia).

**Funciones** (devuelven `PlayState` nuevo, fusionado, sin tocar `usos`):

| Función | Qué hace |
|---|---|
| `pgActuales(play, maxHp)` | `play.hp ?? maxHp`, acotado a `[0, maxHp]` |
| `pgTemp(play)` | `play.tempHp ?? 0`, nunca negativo |
| `estaAbajo(play, maxHp)` | ¿PG actuales == 0? (está a 0, tirando salvaciones) |
| `aplicarDaño(play, n, maxHp)` | come `tempHp`, luego `hp`, suelo 0. **Si ya estaba a 0**: marca 1 fallo de muerte (2 si `critico`); ver firma abajo |
| `curar(play, n, maxHp)` | sube `hp` (techo maxHp); **borra `muerte`** (curarse te levanta); no toca `tempHp` |
| `setTemp(play, n)` | fija `tempHp` (suelo 0). RAW: no se acumulan; eso lo decide la mesa, la función fija el número escrito |
| `marcarMuerte(play, tipo)` | `tipo: "ok"\|"fail"`, suma 1 a ese contador, tope 3 |
| `desmarcarMuerte(play, tipo)` | resta 1 (deshacer un toque), suelo 0 |
| `resultadoMuerte(play)` | `"estable" \| "muerto" \| "tirando" \| null` — 3 ok ⇒ estable, 3 fail ⇒ muerto |
| `alternarCondicion(play, slug)` | añade/quita el slug de `conds` |
| `setAgotamiento(play, n)` | fija `agotamiento` acotado a `[0, 6]` |

`aplicarDaño(play, n, maxHp, critico = false)`: regla 2024 — el daño se resta
**primero** de los temporales; lo que sobre, del actual. Si el objetivo **ya
estaba a 0 PG**, no baja de 0 pero **marca un fallo de muerte** (dos si el golpe
fue crítico). La curación de cualquier cantidad te levanta con esos PG y **limpia
`muerte`**.

**Verificación** (`scripts/check-estado.ts`, patrón `check-clases.ts`): toda
condición con regla no vacía y slug único; los 6 niveles de agotamiento; daño que
consume tempHp antes que hp y nunca deja negativo; `hp` ausente = maxHp; curar
borra `muerte`; daño a 0 PG marca fallo (crítico = 2); `resultadoMuerte` a 3/3;
`marcarMuerte` topa en 3; y que **ninguna** función escriba en `usos` ni en otras
claves de O1/O2.

### 2. UI de la ficha (`components/personaje/EstadoVivo.tsx`, nuevo)

Contrato de `PozosClase.tsx`: `{ play, maxHp, onChange, readOnly }`.

- **Barra de PG**: `actual / máx` grande, barra verde→roja según el ratio;
  escudito con `tempHp` si > 0. Controles: campo numérico + **−daño** / **+cura**,
  y un campo para fijar PG temporales.
- **A 0 PG**, la barra se marca **caído** y aparece el bloque de **salvaciones de
  muerte**: tres casillas de éxito (verde) y tres de fallo (rojo), pulsables como
  los puntos de los pozos. `resultadoMuerte` pinta el veredicto: «Estable» a 3
  éxitos, «Ha caído» a 3 fallos. Curarse (botón +cura) levanta y limpia.
- **Condiciones**: rejilla de chapas pulsables (patrón de los puntos: activa =
  rellena en color de alarma, inactiva = contorno). Toque alterna. Tooltip =
  `regla`.
- **Agotamiento**: fila 0–6 pulsable; debajo, el efecto del nivel actual escrito.
- `readOnly` desactiva todos los controles.

Se monta en `CharacterSheet` junto al bloque de PG máx (~línea 523), reutilizando
`onPlayStateChange` (`CharacterSheet.tsx:325`) — guardado optimista en `self` (→
`saveCharacter`) y en modo DM (→ `/api/dm/character`). El `Derived` «PG máx» se
mantiene; la barra lo complementa.

### 3. Panel del DM (`app/dm/GrupoPanel.tsx`)

Bajo cada jugador, el mismo `EstadoVivo` en modo escritura vía `/api/dm/character`
(patrón O1). El `Stat` «PG máx» (`GrupoPanel.tsx:295` y `:313`) pasa a `actual /
máx`. `/api/dm/character` **ya fusiona** `patch` sobre `play_state`; sin cambio de
servidor.

### 4. En vivo — la ficha del jugador se suscribe

`CharacterSheet` (modo `self`) carga hoy la fila una vez. Se añade suscripción a
`postgres_changes` de **su fila** (`filter: user_id=eq.<uid>`) — `characters` ya
está en la publicación realtime (`schema_v4.sql:37`), sin migración. Al llegar un
`UPDATE`, se refrescan **solo** los campos de estado vivo (`play_state`, `gold`,
`level`, `hp_rolls`…), **no** el build entero (editable en `/crear`).

**Trampa cuidada** (lección del HANDOFF, no pisar lo que el usuario edita): un ref
guarda el último `play_state` que **este** cliente escribió; si el eco que llega
es igual, se ignora — un daño que te apuntas tú no rebota. Canal con nombre único
por montaje (React remonta 2×, convención del repo).

## Qué NO entra en G1 (YAGNI)

- **Dados de golpe** gastables en el descanso corto → losa del descanso completo.
- **Economía de turno** (acción/adicional/reacción/movimiento) → G2.
- **Automatizar el efecto** de las condiciones sobre las tiradas (que
  «envenenado» aplique desventaja solo): aquí son marcadores con su regla a la
  vista; la mesa los aplica, igual que `ClimaEfectos`.
- Duraciones de condición ligadas al reloj.
- Tirar las salvaciones de muerte con el motor de dados 3D (se marcan a mano).

## Verificación

`npx tsc --noEmit` + `npx next build` limpios · `scripts/check-estado.ts` verde ·
`check-clases.ts` (116) y `check-lore.ts` (69) siguen verdes (no se tocan sus
dominios). **No probable en vivo sin sesión**: prueba del usuario al cerrar —
aplicarse daño hasta 0 y ver aparecer las salvaciones; marcar 3 fallos → «ha
caído»; curarse → se limpia; que el DM aplique daño desde su panel y el jugador
lo vea sin recargar; activar «envenenado» y verlo en ambos lados.
