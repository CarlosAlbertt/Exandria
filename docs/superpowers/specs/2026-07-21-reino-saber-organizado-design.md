# Diseño — `/reino`: el saber organizado por lugar, color y categoría

Fecha: 2026-07-21 · Rama prevista: `reino-saber-organizado` · **Sin migración.**

## Problema

`components/SaberSection.tsx` (112 líneas) agrupa las entradas del saber en una
lista plana por ámbito (`Continentes`, `Regiones`, `Panteón`, `Erudito · X`,
`Secretos`, `Por descubrir`), todas las tarjetas del mismo color y nada plegable.
Con la tanda de lore de Marquet, Issylra y los Dientes Rotos el dataset ha
crecido y la página se lee mal: no se distingue de qué tierra habla cada cosa, no
hay forma de plegar lo que no interesa, y la Calamidad —el acontecimiento que
explica el mundo entero— no tiene sitio propio.

## Decisiones del usuario

Preguntadas antes de diseñar:

1. **Eje principal**: por lugar y luego por categoría. Cada lugar con su color.
2. **Mostrar/ocultar**: las dos cosas. Acordeones para todo el mundo *y* un
   control del DM que revela u oculta categorías enteras de golpe.
3. **La Calamidad**: mixta — un relato corrido abierto a todos, y debajo el
   detalle con candado según pericia o descubrimiento.

## Enfoque elegido

De tres opciones (etiquetar en los datos / derivar en el componente / partir los
datos en módulos por lugar) se elige **etiquetar en los datos**: `SaberEntry`
gana `place` y `category`, calculados una sola vez al construir `SABER`. La UI
solo agrupa y pinta, y el `place` queda disponible para otros consumidores (la
tirada de saber de `/lugar`, el reparto del DM). Partir los datos en módulos por
lugar se descarta porque obligaría a mover `pantheon.ts`, `taldorei.ts`,
`history.ts` y `loreTiers.ts`, que son fuentes compartidas con otras páginas.

## Arquitectura

### 1. Modelo de datos (`data/saber.ts`)

`SaberEntry` gana dos campos derivados:

```ts
export type SaberPlace =
  | "Exandria" | "Tal'Dorei" | "Marquet" | "Issylra" | "Wildemount" | "Dientes Rotos";

export type SaberCategory =
  | "Geografía" | "Historia" | "Fe" | "Potencias" | "Vida y lenguas" | "Cosmos" | "Secretos";
```

**`place`** — «Exandria» es el cajón de lo que no pertenece a ningún continente:
panteón, eras, cronología, lunas, planos, la Calamidad. El resto se deriva del
origen de la entrada:

| Origen del id | `place` |
|---|---|
| `cont:<X>:*` | `X` |
| `cl:<cont>:*` | ese continente |
| `reg:*`, `fac:*` | Tal'Dorei |
| `wmreg:*`, `wmfac:*`, `lang:*`, `vida:*` | Wildemount |
| `dei:*`, `hist:*`, `crono:*`, `luna:*`, `plano:*`, `cal:*` | Exandria |
| `LORE_TIERS` curadas | Tal'Dorei salvo las de tema mundial, que van a Exandria |

**`category`** — transversal al ámbito:

| Entrada | `category` |
|---|---|
| ámbito `secreto` | Secretos |
| erudito Historia, `hist:*`, `crono:*` | Historia |
| deidades, erudito Religión | Fe |
| `oculto` de facciones y potencias | Potencias |
| `lang:*`, `vida:*` | Vida y lenguas |
| `luna:*`, `plano:*`, erudito Arcanos | Cosmos |
| resto (continentes, regiones, erudito Naturaleza) | Geografía |

**Color por lugar** (variables ya usadas en `WORLD_COLOR`), exportado como
`PLACE_ACCENT` desde `data/saber.ts` — precedente: `Region.accent` vive en
`data/taldorei.ts`, los acentos son datos en este proyecto:

| Lugar | Color |
|---|---|
| Exandria | `var(--color-gold)` |
| Tal'Dorei | `var(--color-bronze-bright)` |
| Marquet | `var(--color-ember)` |
| Issylra | `var(--color-arcane)` |
| Wildemount | `var(--color-violet)` |
| Dientes Rotos | `var(--color-primitivo)` |

El color tiñe el borde y el título del bloque de lugar, la chapa de categoría y
el punto de cada tarjeta.

### 2. Cambio de regla en `lib/saber.ts`

Hoy `ctx.revealed` solo abre entradas de ámbito `secreto`. Para que el revelado
en bloque funcione sobre cualquier categoría, `revealed` pasa a abrir
**cualquier** entrada, en la misma comprobación temprana que `unlocked`:

```ts
if (ctx.unlocked.includes(entry.id)) return true;
if (ctx.revealed.includes(entry.id)) return true;
```

El comportamiento de los secretos no cambia (siguen cerrados hasta que el DM los
revela); solo deja de estar limitado a ellos. El `case "secreto"` del switch se
queda como estaba, aunque a partir de ahora sea inalcanzable por la vía normal:
documenta la intención y protege si alguien reordena las comprobaciones.

### 3. Componentes (`components/reino/`)

`components/SaberSection.tsx` se retira y se parte en cuatro piezas con una
responsabilidad cada una:

- **`SaberBrowser.tsx`** — orquestador y **único con estado**: carga la ficha,
  compone el `SaberCtx`, calcula contadores, reparte las entradas por lugar y
  guarda qué bloques están abiertos.
- **`SaberPlace.tsx`** — bloque plegable de un lugar. Cabecera con color, nombre,
  «sabes N de M» y flecha; dentro, sus categorías. Botones DM de revelar/ocultar
  el bloque entero.
- **`SaberCategory.tsx`** — subgrupo plegable dentro de un lugar. Chapa de
  categoría, contador y botones DM de revelar/ocultar esa categoría.
- **`SaberCard.tsx`** — la tarjeta: tema, título, texto o candado con el motivo,
  y el interruptor del DM.

**Estado inicial de los acordeones**: para el jugador, abiertos el lugar de su
personaje y Exandria; el resto plegados. Para el DM, todo plegado. No se
persiste: se recalcula en cada visita.

**Bloque de un lugar del que no se sabe nada**: se lista igual, plegado, y en vez
de tarjetas muestra una línea — «De estas tierras no sabes nada todavía · N
cosas por descubrir». Mantiene el principio vigente (un candado con el título
puesto ya spoilea) y deja a la vista el mapa de lo que falta por llenar.

**Barra de filtros**: «solo lo que sé» (ahora también para el jugador, hoy es
DM-only), «plegar todo / desplegar todo» y el contador global que ya existe.

### 4. La Calamidad (`data/calamidad.ts` + `components/reino/CalamidadSection.tsx`)

Va **antes** del navegador del saber y sustituye al bloque «Lo que todo el mundo
sabe» de `app/reino/page.tsx`.

**`CALAMIDAD_RELATO`** — cinco actos abiertos a todos, con título y cuerpo,
redacción propia: la Fundación · la Era de los Arcanos · Vespin Chloras y Ghor
Dranas · los dos siglos de guerra · la Divergencia.

**`CALAMIDAD_LORE`** — ~12 entradas nuevas con `place: "Exandria"` y el mismo
tipo que `data/continentes.ts` (`ContinentLoreEntry`), reutilizado: Aeor y las
ciudades voladoras (Arcanos) · el Ritual de Siembra (Arcanos) · Ghor Dranas
(Historia) · el asalto a Vasselheim (Historia) · los Vestigios de la Divergencia
(Historia) · la Puerta Divina (Religión) · Sarenrae borrada de los registros
(Religión) · Ioun herida y el Alma de Cobalto (Religión) · el Trono del
Archicorazón, orcos y centauros (Historia) · cómo cambió el mapa (Naturaleza) ·
lo que se perdió para siempre (Arcanos) · dos secretos para el DM. Entran en
`SABER` con ids `cal:<id>`.

`CalamidadSection` pinta el relato en una banda ancha de lectura (sin tarjetas) y
debajo un bloque **«El detalle»** que reutiliza `SaberCategory` con las entradas
de Historia y Cosmos del lugar Exandria. No es un componente nuevo.

`HISTORIA_BREVE` sale de `/reino` (la absorbe el relato) pero **no se borra** de
`data/loreTiers.ts`: la usa el narrador IA.

### 5. Revelado en bloque (`lib/useLoreRevealed.ts`)

Gana `revealMany(ids)` y `hideMany(ids)` con la misma mutación optimista que el
`toggle` actual (`app_config` no dispara realtime para quien escribe — ver la
memoria del proyecto). Sin migración: todo sigue en `app_config.lore_revealed`.

Dos niveles de control del DM:

1. **Por tarjeta** — el interruptor que ya existe, ahora en cualquier entrada.
2. **Por categoría y por lugar** — «Revelar todo» / «Ocultar todo» en la cabecera
   correspondiente, actuando sobre las entradas de ese grupo.

**Alcance**: el revelado afecta a **todo el grupo**. Lo que se enseña a un
jugador concreto sigue yendo por `lore_unlocked` desde Panel DM › Grupo. Los dos
mecanismos no se mezclan.

## Verificación

`scripts/check-lore.ts` se amplía (hoy: 35 comprobaciones en verde):

- toda entrada de `SABER` tiene `place` y `category` válidos;
- todo lugar de `SaberPlace` tiene color en `PLACE_ACCENT` y al menos una entrada;
- `revealed` abre entradas de cualquier ámbito, y una entrada que no está en la
  lista sigue cerrada;
- los ids que junta «revelar todo» de una categoría son exactamente los de esa
  categoría en ese lugar (ni uno de otro lugar);
- el relato de la Calamidad tiene sus cinco actos y ninguno vacío;
- todo `poi` citado en `CALAMIDAD_LORE` existe en `WORLD_POIS`.

Gate del proyecto: `tsc --noEmit` + `next build` limpios. Sin tests unitarios en
el repo; el script de comprobación es el equivalente.

## Fuera de alcance

- Sin migración de Supabase.
- No se persiste qué acordeones quedaron abiertos.
- El revelado en bloque no es por jugador.
- No se toca `ReinoRegions`, ni la tirada de saber de `/lugar`, ni el calendario.
- No se reescribe la lore existente: solo se etiqueta y se añade la Calamidad.

## Riesgos

- **Página cliente pesada**: `SABER` ya pasa de 300 entradas y ahora se agrupa
  dos veces. Se calcula con `useMemo` sobre el `ctx`, que cambia poco.
- **Reparto de `place` incompleto**: si una entrada nueva no encaja en ninguna
  regla, cae en «Exandria» por defecto y el script de comprobación no lo
  detectaría. Mitigación: el reparto es exhaustivo por prefijo de id y el script
  comprueba que ningún lugar se quede vacío; una entrada mal colocada aparece,
  como mucho, en el cajón general.
