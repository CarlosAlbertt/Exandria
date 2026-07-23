# Diseño — G1: Estado del combatiente (PG, muerte y condiciones)

Fecha: 2026-07-23 · Rama prevista: `g1-estado-combatiente` · **Sin migración.**

## Contexto — la capa de jugabilidad 2024

Esto no es un ítem suelto de backlog: es la **primera losa de la jugabilidad de
combate 2024**. La app está pensada para **jugar en casa, autodidacta**: la app
**aplica** las reglas, no solo las recuerda. La app ya acompaña la ficha
(creación, nivel, pozos de clase) y tiene las piezas de mesa (iniciativa
`schema_v11`/`useInitiative`, dados 3D con petición del DM, `lib/derive.ts` para
CA/salvaciones/PG máx, descansos que mueven el reloj). Lo que falta es que la
ficha sepa **el estado en combate**: si estás vivo, sangrando o fuera; cuánto
aguantas; qué te limita el turno — **y que ese estado muerda las tiradas de
verdad** (una condición de desventaja hace tirar 2d20 y quedarse la peor).

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
5. **Las condiciones muerden la tirada**: el resolvedor de ventaja/desventaja por
   condición entra en G1 y se cablea a los botones de salvación y pericia de la
   ficha. Lo que necesita a otro combatiente (fallo automático de salvación por
   estar paralizado, ventaja para tu atacante) se documenta y aterriza en **G3
   (tablero)**, donde existen atacante y objetivo.

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
// Sobre qué tiradas PROPIAS impone desventaja esta condición (regla 2024).
// "ataque" = tiradas de ataque; "prueba" = pruebas de característica (incluye
// pericias); "salvez" = salvaciones. Solo las que afectan a MIS tiradas; lo que
// da ventaja a mi atacante NO se modela aquí (va a G3).
export type TipoTirada = "ataque" | "prueba" | "salvez";
export type Condicion = {
  slug: string;
  name: string;
  icon: string;
  regla: string;                  // resumen en prosa propia
  desventaja?: TipoTirada[];      // tiradas propias con desventaja
};
export const CONDICIONES: Condicion[];   // las 15 de 2024
export const AGOTAMIENTO: string[];       // regla de cada nivel 1–6
```

Las 15: cegado, hechizado, ensordecido, asustado, apresado (grappled),
incapacitado, invisible, paralizado, petrificado, envenenado, derribado,
restringido (restrained), aturdido, inconsciente. Agotamiento aparte: cada nivel
**−2 acumulativo a toda prueba de d20** y **−1,5 m de velocidad**; a **nivel 6,
muerte** (regla 2024, redacción propia).

Mapa de `desventaja` sobre **tus propias** tiradas (2024):

| Condición | Desventaja en |
|---|---|
| Envenenado | ataque, prueba |
| Asustado | ataque, prueba |
| Derribado (prone) | ataque |
| Restringido (restrained) | ataque |
| Cegado, ensordecido, apresado… | — sobre tus tiradas (su efecto es de contexto o de atacante) |

> **Precisión, no sobre-aplicación**: en una app que *impone* reglas, aplicar de
> más es peor que no aplicar. Por eso el mapa solo incluye lo que es **exacto sin
> más contexto**. Casos que la RAW acota a una característica concreta se
> **omiten** en G1 en vez de aproximarse:
> - «restringido» da desventaja a las salvaciones de **Destreza** (no a todas):
>   como el botón de salvación no le pasa al resolvedor qué característica es, la
>   salvación de restringido **no se aplica aún** — se aplica cuando el botón
>   pase la característica (mejora futura). Sí se aplica su desventaja en ataque,
>   que es incondicional.
> - El **fallo automático** de salvaciones de Fue/Des por paralizado/aturdido/
>   inconsciente/petrificado no es «desventaja»: es no tirar. Queda fuera del
>   resolvedor de ventaja (ver «Qué NO entra»).

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
| `ventajaDe(play, tipo)` | **el resolvedor**: dada la lista de condiciones activas y el tipo de tirada, devuelve `"adv" \| "dis" \| null` |

`aplicarDaño(play, n, maxHp, critico = false)`: regla 2024 — el daño se resta
**primero** de los temporales; lo que sobre, del actual. Si el objetivo **ya
estaba a 0 PG**, no baja de 0 pero **marca un fallo de muerte** (dos si el golpe
fue crítico). La curación de cualquier cantidad te levanta con esos PG y **limpia
`muerte`**.

`ventajaDe(play, tipo: TipoTirada): "adv" | "dis" | null` — recorre `conds`,
junta la ventaja y la desventaja que cada condición activa impone sobre ese tipo,
y aplica la **regla de anulación 2024**: si hay al menos una fuente de ventaja
**y** al menos una de desventaja, tiras un solo d20 (`null`); si solo hay
desventaja, `"dis"`; si solo ventaja, `"adv"`; si nada, `null`. En G1 casi todo
son desventajas (las condiciones que dan ventaja propia son raras), pero el
resolvedor se escribe con las dos caras para que G2/G3 (esquivar, ayuda, cobertura)
le sumen fuentes sin reescribirlo. **No modifica `play`** (es una consulta, no una
mutación), pero vive aquí por cohesión con `CONDICIONES`.

**Verificación** (`scripts/check-estado.ts`, patrón `check-clases.ts`): toda
condición con regla no vacía y slug único; los 6 niveles de agotamiento; daño que
consume tempHp antes que hp y nunca deja negativo; `hp` ausente = maxHp; curar
borra `muerte`; daño a 0 PG marca fallo (crítico = 2); `resultadoMuerte` a 3/3;
`marcarMuerte` topa en 3; **el resolvedor**: envenenado ⇒ `dis` en ataque y
prueba pero `null` en salvación; sin condiciones ⇒ `null`; ventaja + desventaja
simultáneas ⇒ `null` (anulación); y que **ninguna** función escriba en `usos` ni
en otras claves de O1/O2.

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

### 3. Las condiciones muerden la tirada (`CharacterSheet.tsx`)

La ficha ya tira salvaciones y pericias: cada una con un botón de d20 que llama a
`publishRoll(session.id, "save"|"skill", label, "1d20", { mod })`
(`CharacterSheet.tsx:578` y `:613`). `publishRoll` **ya acepta** `opts.adv:
"adv"|"dis"` y lo propaga tanto al tablero físico (`rollVisual` → tira 2 dados)
como al fallback (`d20Check`). **No se toca la cadena de dados**: solo se calcula
el `adv` y se pasa.

- Botón de **salvación** → `adv: ventajaDe(playState, "salvez")`.
- Botón de **pericia** → `adv: ventajaDe(playState, "prueba")` (una pericia es una
  prueba de característica).
- Cuando `ventajaDe` da `"dis"`, `publishRoll` tira 2d20 y se queda la peor, y el
  feed ya rotula « (desventaja)» (viene de `d20Check`/`d20FromDice`). El jugador
  ve por qué sin que la mesa tenga que recordar la regla.

Efecto secundario bienvenido: la etiqueta del feed ya distingue ventaja/
desventaja, así que la prueba visual es inmediata.

> Los **ataques** todavía no se tiran desde la ficha (no hay lista de armas con
> botón de ataque en G1). El tipo `"ataque"` queda cableado en el resolvedor y en
> los datos para cuando G2/G3 añadan la tirada de ataque; hoy solo salvación y
> pericia lo consumen.

### 4. Panel del DM (`app/dm/GrupoPanel.tsx`)

Bajo cada jugador, el mismo `EstadoVivo` en modo escritura vía `/api/dm/character`
(patrón O1). El `Stat` «PG máx» (`GrupoPanel.tsx:295` y `:313`) pasa a `actual /
máx`. `/api/dm/character` **ya fusiona** `patch` sobre `play_state`; sin cambio de
servidor.

### 5. En vivo — la ficha del jugador se suscribe

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

**Sí entra**: la desventaja/ventaja de tus condiciones sobre **tus** salvaciones
y pericias, aplicada de verdad (2d20 la peor) — es el punto de la app autodidacta.

Fuera de G1:

- **Dados de golpe** gastables en el descanso corto → losa del descanso completo.
- **Economía de turno** (acción/adicional/reacción/movimiento) → G2.
- **Tirada de ataque desde la ficha** (lista de armas con botón de ataque): no
  existe aún, así que el tipo `"ataque"` queda cableado pero sin consumidor → G2.
- **Efectos que necesitan a otro combatiente** → G3 (tablero), donde hay atacante
  y objetivo: el **fallo automático** de salvaciones de Fue/Des por paralizado/
  aturdido/inconsciente/petrificado, y la **ventaja para tu atacante** por estar
  cegado/derribado/restringido. En G1 esas condiciones existen como marcador con
  su regla escrita; su efecto mecánico llega con el tablero.
- **Desventaja acotada a una característica** (la salvación de Des de
  «restringido»): omitida hasta que el botón de salvación pase la característica
  al resolvedor — mejor no aplicar que aplicar de más.
- **Agotamiento como modificador de tirada** (−2 por nivel): en G1 el agotamiento
  es marcador + texto; restarlo a las tiradas es aparte (el −2 es un modificador,
  no ventaja, y tocaría `derive.ts`/los botones).
- Duraciones de condición ligadas al reloj.
- Tirar las salvaciones de muerte con el motor de dados 3D (se marcan a mano).

## Verificación

`npx tsc --noEmit` + `npx next build` limpios · `scripts/check-estado.ts` verde ·
`check-clases.ts` (116) y `check-lore.ts` (69) siguen verdes (no se tocan sus
dominios). **No probable en vivo sin sesión**: prueba del usuario al cerrar —
aplicarse daño hasta 0 y ver aparecer las salvaciones; marcar 3 fallos → «ha
caído»; curarse → se limpia; que el DM aplique daño desde su panel y el jugador
lo vea sin recargar; activar «envenenado», tirar una pericia y ver que salen 2d20
con la peor y el rótulo « (desventaja)».
