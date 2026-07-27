# Diseño — El tablero como pantalla de combate

Fecha: 2026-07-26 · Rama prevista: `tablero-combate` · **Sin migración.**

## Contexto — dónde se juega el combate

Las cinco losas de jugabilidad (G1 estado, G2 turno + ataque, G3 tablero, G4
targeting, O2 conjuros) fueron aterrizando **en la hoja de personaje**, porque era
donde ya vivía la ficha. El resultado es que `/personaje` hace dos trabajos que no
se parecen: **consultar tu ficha** (aptitudes, equipo, historia) y **jugar el
combate** (PG, turno, atacar, lanzar). Y `/tablero`, que debería ser la pantalla
de combate, solo enseña la rejilla: para pegar hay que irse a otra página.

Petición del usuario: **`/personaje` queda para inventario y stats**, y `/tablero`
pasa a ser la pantalla de combate donde se usan las habilidades.

No hay reglas nuevas: G1–G4 y O2 ya están. Esto es **composición y mudanza**, más
un refactor acotado para no duplicar la parte delicada.

## Decisiones (preguntadas antes de escribir el spec)

- **Corte limpio.** `/personaje` pierde del todo lo de combate. Queda ficha pura.
- **El DM tiene la misma pantalla** en Panel DM › Tablero, con sus mandos encima.
- **Reparto de la pantalla** (maqueta validada en el navegador): iniciativa arriba;
  tablero grande a la izquierda; a la derecha **estado y turno siempre visibles** y
  las acciones **en pestañas**; tira de últimas tiradas abajo.
- **El objetivo es compartido** entre Ataques y Conjuros, y vive en la cabecera de
  la zona de pestañas.
- **`/tablero` funciona sin combate activo**: si no, tras el corte limpio no
  habría dónde curarse ni preparar conjuros entre escenas.

## El problema de fondo, y el único refactor que se propone

Hoy `/tablero` (`app/tablero/page.tsx`, 43 líneas) no sabe nada del personaje: solo
lee `useBattle`. Todo lo necesario para jugar —cargar la ficha activa, derivarla,
suscribirse a sus cambios, limpiar el turno cuando te toca, y **persistir
`play_state`**— vive dentro de `components/CharacterSheet.tsx`, que ya pasa de las
750 líneas.

Copiar eso a `/tablero` sería duplicar **la parte más delicada de la app**: es la
misma carga que en 2026-07-22 hizo desaparecer fichas por un error tragado, y la
que obligó a escribir `selectTolerante` y la `schema_v21`.

**Se extrae a un hook, `lib/useFichaViva.ts`, sin cambiar comportamiento**, y lo
usan las dos pantallas. `CharacterSheet` adelgaza; `/tablero` no duplica nada.

```ts
export type FichaViva = {
  ready: boolean;
  characterId: string | null;
  /** La ficha tal y como se cargó (especie, clase, trasfondo, aptitudes, equipo…). */
  character: CharacterData | null;
  level: number;
  items: Item[];
  play: PlayState;
  derived: ReturnType<typeof derive>;   // PG máx, CA, mods, salvaciones, CD/ataque de conjuro
  mechanics: ClassMechanics | null;     // caster, weapons, resources…
  onPlayStateChange: (next: PlayState) => void;
  error: string | null;                 // el error de carga, NO tragado
};

export function useFichaViva(targetUserId: string | null, saveMode: "self" | "dm"): FichaViva;
```

> **Quién manda sobre qué, para que no haya dos dueños del mismo dato**: el hook
> es **la única fuente de `play_state`** (lo lee, lo escucha en vivo y lo escribe
> por `onPlayStateChange`), y expone `character`/`items`/`level` **solo de
> lectura**, que es lo que el tablero necesita (las armas del inventario y el
> nivel). El **build editable** —nivel, oro, ASI, equipo, objetos— sigue siendo
> estado local de `CharacterSheet`, sembrado desde `character` en la carga y
> guardado con su *debounce* de siempre. Es decir: el tablero **lee** el
> inventario, la ficha lo **edita**. No se comparte estado editable entre las dos
> pantallas.

Qué se mueve dentro (tal cual está hoy, sin tocar la lógica):

- La **carga** por `loadActiveCharacter` con su `selectTolerante`, el fallback a
  `localStorage` sin sesión, y el error **propagado**, no descartado.
- El **`derive`** desde el objeto crudo (`charForDerive`).
- La **suscripción realtime** a la propia fila de `characters`, con su guard
  anti-eco.
- El **reset del turno**: suscripción a la fila de `initiative`; al pasar a
  `active`, `limpiarTurno`.
- La **persistencia** de `play_state`: `self` → `saveCharacter`; `dm` → POST
  `/api/dm/character`; sin sesión → `localStorage`. Optimista, como ahora.

Lo que **NO** entra en el hook (se queda en `CharacterSheet`, porque solo la ficha
lo usa): el guardado con *debounce* del build (nivel, oro, ASI, equipo, objetos),
la lista de huecos de personaje (`listCharacters`), archivar/retirar, y el flujo de
«ficha a medio crear».

## La pantalla — `app/tablero/page.tsx`

De arriba abajo (en escritorio; en móvil se apila en este mismo orden):

1. **Iniciativa**: `InitiativeTracker`, la tira con el orden y de quién es el turno.
2. **Tablero** (izquierda, ~2/3): `BattleBoard` tal cual, con su arrastre y su
   medición de distancia. Sin combate activo o sin `schema_v22`, en su lugar va el
   aviso que ya existe.
3. **`PanelCombate`** (derecha, ~1/3): ver abajo.
4. **Tira de tiradas** (abajo, ancho completo): las últimas del feed, en versión
   estrecha, para ver el resultado sin cambiar de página.

`/tablero` **ya no exige combate activo**: sin rejilla, el panel derecho sigue
entero (curarte, preparar conjuros, gastar un pozo) con un aviso de que no hay
combate. La rejilla es lo único que depende de `board.active`.

## `components/tablero/PanelCombate.tsx` (nuevo)

Es una **composición**, no lógica nueva. Dueño de dos estados locales: la pestaña
abierta y el **objetivo** seleccionado.

- **Siempre visible**: `EstadoVivo` (PG, temporales, salvaciones de muerte,
  condiciones, agotamiento) y `EconomiaTurno` (acción/adicional/reacción +
  movimiento).
- **Cabecera de acciones**: el **desplegable de objetivo**, alimentado por
  `useBattle` (fichas del tablero, muertas filtradas) con la distancia en vivo
  desde tu ficha. Uno solo, compartido por las dos pestañas que lo usan.
- **Pestañas**:
  - **⚔ Ataques** → `Ataques` (armas del inventario; alcance, ventaja y crítico de
    G4 sin cambios).
  - **✦ Conjuros** → `Conjuros` (huecos, preparados, lanzar, preparar). Solo si la
    clase es conjuradora; si no, la pestaña no se pinta.
  - **◈ Rasgos** → `PozosClase` (furias, foco, canalizar…). Si la clase no tiene
    pozos, la pestaña no se pinta.

## Cambios en los componentes existentes

- **`Ataques.tsx`**: deja de tener su propio `useState` de objetivo y su
  `<select>`; **recibe `objetivo` y `distancia` por props**. Toda la lógica de G4
  (bloqueo de alcance, ventaja combinada, crítico por 20 natural o proximidad,
  daño doblado) **se queda igual**. También deja de llamar a `useBattle`/`useParty`
  por su cuenta: los recibe ya resueltos, lo que de paso elimina el motivo por el
  que hubo que partirlo en dos para no abrir canales realtime de más.
- **`Conjuros.tsx`**: recibe el objetivo y lo **nombra en el anuncio** («Lanza Bola
  de Fuego (nivel 3) → Goblin · salvación de DES CD 15»). **Sin reglas nuevas por
  conjuro**: resolver el efecto de cada conjuro quedó fuera de O2 a propósito y
  sigue fuera. El objetivo aquí es información para la mesa, no una regla aplicada.
- **`CharacterSheet.tsx`**: se le quitan los montajes de `EstadoVivo`,
  `EconomiaTurno`, `Ataques`, `Conjuros`, `PozosClase` e `InitiativeTracker`, y
  pasa a consumir `useFichaViva` en lugar de cargar y persistir por su cuenta.
  Queda: nivel/ASI/XP, aptitudes, **salvaciones y pericias con sus botones de
  tirar** (incluido el fallo automático de G4, que es de la ficha), CA y sensatez,
  equipo y `Paperdoll`, inventario, rasgos de clase, historia, retratos y el bloque
  de personajes/retirada.
- **`app/dm/TableroPanel.tsx`**: monta la misma pantalla y **encima** sus mandos de
  siempre (iniciar/pausar combate, fondo, cols/filas, poblar desde iniciativa,
  añadir/borrar PNJ, vaciar). El DM mueve todas las fichas, como ahora.
- **`app/dm/GrupoPanel.tsx`**: **no se toca.** Ahí el DM sigue viendo y ajustando
  el estado de cada jugador (es su panel de control del grupo, no una pantalla de
  juego).

## Qué NO entra (a propósito)

- **Reglas nuevas.** Ni resolución de efectos de conjuro, ni comparar la tirada con
  la CA, ni salvación de concentración por daño. Nada de eso cambia aquí.
- **Rediseñar `BattleBoard`**: se reutiliza tal cual (arrastre, distancia,
  selección).
- **Tocar `GrupoPanel`** ni el resto del Panel DM.
- **Mover las tiradas de pericia y salvación** fuera de la ficha: son de la ficha.
- Cualquier limpieza de `CharacterSheet` que no sea consecuencia directa de extraer
  el hook y quitar los montajes.

## Riesgo principal, y cómo se acota

Tocar la carga de la ficha es **exactamente** donde estuvo el bug del 2026-07-22
(un `const { data } = await …` que se tragó el error y convirtió «falta una
columna» en «no tienes personaje»). Por eso:

- El hook se extrae **sin cambiar comportamiento**: mismo `selectTolerante`, mismo
  fallback, y el error se sigue **propagando** (`error` en el valor devuelto), no
  descartando.
- `/personaje` tiene que seguir funcionando **igual** después del refactor; es
  parte de la verificación, no un efecto colateral aceptable.
- `scripts/check-ficha.ts` (11 comprobaciones, escrito justo para ese bug) entra en
  el gate de cada tarea que toque la carga.

## Verificación (el gate real; no hay tests)

Esto es composición y mudanza, así que **no hay capa pura nueva** que verificar con
un script propio: el gate son los que ya existen más el build.

- `npx tsc --noEmit` + `npx next build` limpios.
- **`check-ficha` (11)** en verde — el que cubre la carga tolerante de la ficha.
- Sin regresión: `check-conjuros`, `check-spells`, `check-targeting` (49),
  `check-estado` (36), `check-turno`, `check-ataque`, `check-tablero`,
  `check-clases` (116), `check-lore` (69), `check-clima`.
- **No probado en vivo** (sin sesión ni fichas del tablero en dev).
  **Pruebas del usuario**: entrar en `/tablero` sin combate y ver estado, turno y
  las tres pestañas; iniciar el combate desde el DM y ver aparecer la rejilla sin
  recargar; elegir objetivo y atacar desde el tablero (que gaste la acción y salga
  en la tira de tiradas); cambiar a Conjuros y lanzar uno con el mismo objetivo
  puesto; comprobar que `/personaje` sigue enseñando la ficha entera y **ya no**
  tiene ataques ni conjuros; que el DM ve la misma pantalla con sus mandos; y que
  al recargar la página no se pierde nada de `play_state`.
