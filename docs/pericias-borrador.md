# Pericias — borrador de trabajo

Documento vivo. Recoge lo **decidido** con el usuario y lo que **falta**, para
que la sesión que implemente esto no tenga que redescubrirlo. Cuando esté
completo se convierte en spec en `docs/superpowers/specs/`.

Última actualización: **2026-07-31**.

---

## 1. Las 25 pericias

Las **18 de siempre** (D&D 2024) ya existen en `data/rules.ts` como
`{ name, ability }` — nombre y aptitud, **sin una línea de qué hacen**. Las **7
nuevas** son homebrew de esta campaña y aún no existen en el código.

| # | Pericia | Aptitud | Origen |
|---|---|---|---|
| 1 | Atletismo | FUE | 2024 |
| 2 | Acrobacias | DES | 2024 |
| 3 | Juego de Manos | DES | 2024 |
| 4 | Sigilo | DES | 2024 |
| 5 | Arcanos | INT | 2024 |
| 6 | Historia | INT | 2024 |
| 7 | Investigación | INT | 2024 |
| 8 | Naturaleza | INT | 2024 |
| 9 | Religión | INT | 2024 |
| 10 | Medicina | SAB | 2024 |
| 11 | Percepción | SAB | 2024 |
| 12 | Perspicacia | SAB | 2024 |
| 13 | Supervivencia | SAB | 2024 |
| 14 | Trato con Animales | SAB | 2024 |
| 15 | Engaño | CAR | 2024 |
| 16 | Interpretación | CAR | 2024 |
| 17 | Intimidación | CAR | 2024 |
| 18 | Persuasión | CAR | 2024 |
| 19 | **Alquimia** | INT | **nueva** |
| 20 | **Forja** | **SAB** – FUE | **nueva, doble** |
| 21 | **Cocina** | SAB | **nueva** |
| 22 | **Cristalografía Arcana** | INT | **nueva** |
| 23 | **Tatuaje Rúnico** | **DES** – INT | **nueva, doble** |
| 24 | **Extracción de Componentes** | **DES** – INT | **nueva, doble** |
| 25 | **Destilación Exandriana** | SAB | **nueva** |

Constitución no tiene ninguna, igual que en 2024.

Las tres ⚙️ que **ya tienen mecánica de verdad** son Arcanos, Historia y
Religión: `components/lugar/SaberRoll.tsx` las tira en `/lugar` contra una CD y
el éxito desbloquea saber. Es el precedente de lo que se va a construir.

---

## 2. Reglas decididas

### 2.1 Aptitud doble = dos tiradas posibles

Cuando una pericia lleva dos aptitudes (`SAB – FUE`), **la primera es la
primaria**:

- Se puede tirar **con cualquiera de las dos**, según lo que pida la situación.
- **La competencia solo suma en la primaria.** Con la secundaria se tira a
  aptitud pelada.
- La ficha enseña **los dos números**.

Ejemplo con Forja (SAB–FUE), SAB 16 (+3), FUE 14 (+2), competencia +3 y la
pericia aprendida: **Forja (SAB) +6** · **Forja (FUE) +2**.

Quién elige cuál en cada tirada: **pendiente** (ver §4).

### 2.2 Cómo se consiguen: cupo de oficio aparte

Las 7 nuevas **no compiten** con las pericias normales de clase:

- Cada clase mantiene su `pick` actual para las 18 de siempre.
- **A nivel 1**: una elección **de oficio**, restringida a las nuevas que su
  clase tenga en lista.
- **A nivel 7**: una **segunda** elección de oficio, igual de restringida.

O sea: dos cupos independientes, y el de oficio se abre en dos tandas.

### 2.3 Reparto por clase (PROPUESTO — falta el visto bueno)

| Pericia | Clases |
|---|---|
| Alquimia | Mago · Druida · Cazador de Sangre · Bardo |
| Forja | Guerrero · Paladín · Bárbaro · Clérigo |
| Cocina | Bárbaro · Explorador · Druida · Monje · Bardo |
| Cristalografía Arcana | Mago · Hechicero · Brujo · Cazador de Sangre · Bardo |
| Tatuaje Rúnico | Mago · Brujo · Hechicero · Monje · Cazador de Sangre |
| Extracción de Componentes | Explorador · Druida · Pícaro · Cazador de Sangre · Mago |
| Destilación Exandriana | Bardo · Pícaro · Explorador · Druida · Bárbaro |

Criterio: Cristalografía a los arcanos porque el residuum es cosa de Exandria;
Extracción de Componentes a quien despieza bichos; Forja a quien va con metal
encima. El **Bardo** se lleva cinco de siete porque ya tiene las 18 (toca de
todo) y el **Cazador de Sangre** cuatro, por lo mismo.

---

## 2.5 ESTADO: el andamio ya está construido (2026-07-31)

Todo lo de §2 está **implementado y en el gate**. Lo único que falta es el
contenido de §5: qué hace cada pericia.

- `data/rules.ts` — el tipo `Skill` admite `ability2` y `oficio`; entran las 7;
  helpers `OFICIOS`, `SKILLS_2024` y `esOficio(name)`.
- `data/leveling.ts` — `OFICIO_LEVELS = [1, 7]` y `oficioPicks(level)`, con el
  mismo patrón de hitos que `reachedAsiLevels`.
- `data/classes.ts` — cada clase declara sus `oficios`.
- `lib/derive.ts` — cada pericia trae `oficio`, y las dobles además `ability2` y
  **`mod2` sin competencia**.
- El creador (`SkillsScene`) tiene un tercer bloque con cupo propio; el cupo del
  nivel 7 se elige en `LevelPanel`, junto a los hitos de ASI.
- La ficha separa **Pericias** de **Oficios** y en las dobles pinta las dos
  tiradas, con la aptitud en el nombre de la tirada publicada.
- **`scripts/check-pericias.ts` es el gate 26**, con tres pruebas de mutación
  pasadas: invertir el par de aptitudes de una doble, dejar una clase con un
  solo oficio, y colar un oficio en un `skillList`.

**Un cambio de comportamiento que conviene saber**: la ficha **ya guarda
`skills`**. Hasta ahora las trataba como solo lectura porque solo se elegían en
el creador; con la elección del nivel 7 eso deja de ser cierto.

**Y una corrección al reparto de §2.3**: Clérigo, Guerrero y Paladín se quedaban
con **un solo oficio**, así que a nivel 7 tendrían un cupo sin nada que elegir.
Se les dio un segundo (Clérigo: Destilación Exandriana; Guerrero y Paladín:
Cocina) y **el gate ahora exige mínimo dos por clase**.

---

## 3. Lo que hay que tocar (y lo que no)

- **`data/rules.ts`** — el tipo `Skill` pasa de `{ name, ability }` a admitir
  una **aptitud secundaria opcional**, y entran las 7 nuevas.
- **`lib/derive.ts:131`** — hoy calcula **un** número por pericia
  (`abilities[s.ability].mod + (proficient ? prof : 0)`). Tiene que dar **dos**
  cuando hay secundaria, con competencia **solo** en la primaria. Es la fuente
  única que comparten la hoja y el panel del DM: se toca una vez y se nota en
  las dos.
- **`data/classdata/<clase>.ts`** (13 archivos) — una lista nueva de oficios por
  clase, aparte de `skillChoices`.
- **`components/crear/steps/SkillsScene.tsx`** — el segundo cupo, restringido.
- **El subir de nivel** — la segunda elección de oficio a nivel 7. El patrón que
  ya existe para esto es `reachedAsiLevels` / `asiPoints` en `data/leveling.ts`,
  que resuelve exactamente el mismo problema para los ASI.
- **`components/CharacterSheet.tsx`** — pintar dos números en las de doble.

**Sin migración.** `characters.skills` ya es `string[]`
(`lib/character.ts:31,52`): las de oficio caben en el mismo array y el cupo se
controla **por pertenencia al conjunto de oficios**, no por una columna nueva.

**El gate tendrá que verlo.** Hoy ningún `scripts/check-*.ts` valida `SKILLS`
(solo `check-lore` la roza). Es exactamente el patrón que ya salió caro dos
veces —`check-clases` sin mirar subclases, `check-especies` sin existir—, así
que esta tanda necesita su propio check con prueba de mutación: que toda pericia
de una lista de clase exista, que las aptitudes sean claves válidas, que las
dobles tengan primaria distinta de secundaria, y que ninguna clase ofrezca un
oficio que no esté en las 7.

---

## 4. Asunciones tomadas para poder avanzar

El usuario pidió seguir sin preguntar más. Estas cuatro se dieron por buenas y
**todas son reversibles**:

1. **El reparto por clase de §2.3** (con la corrección de §2.5).
2. **En las dobles elige el jugador** al tirar: la ficha ofrece las dos tiradas
   y él pulsa la que toque. Si se prefiere que lo mande el DM, es cambiar quién
   pulsa, no el dato.
3. **`SaberRoll` no cambia**: «¿Qué sé de esto?» sigue con Historia, Arcanos y
   Religión. Las 7 nuevas no entran ahí de momento.
4. **No se inventó el texto de ninguna pericia.** El andamio está entero y el
   hueco está en §5.

---

## 5. EL HUECO: qué hace cada pericia

Esto es lo único que falta, y lo dicta el usuario. **No se rellena a ojo.**

Por cada pericia hacen falta cuatro cosas:

- **Cubre** — qué situaciones caen bajo ella.
- **Contra qué** — CD fija (¿cuál?), CD que pone el DM, o tirada enfrentada
  (¿contra qué pericia?).
- **Al fallar** — no pasa nada, pasa algo concreto, o un solo intento.
- **Quién resuelve** — la app sola (como `SaberRoll`, que tira, compara y
  desbloquea) o texto que guía al DM en la mesa.

Cuando llegue el contenido, la forma natural de guardarlo es un
`data/pericias.ts` indexado por nombre de pericia, separado de `data/rules.ts`
(que son hechos mecánicos del reglamento) igual que `data/classdata/` está
separado de `data/classes.ts`. **Y tendrá que entrar en el gate**: una pericia
sin entrada, o una entrada con un nombre que no existe en `SKILLS`, tiene que
hacer fallar `check-pericias`.

### Plantilla

```
1  Atletismo (FUE) —
2  Acrobacias (DES) —
3  Juego de Manos (DES) —
4  Sigilo (DES) —
5  Arcanos (INT) —
6  Historia (INT) —
7  Investigación (INT) —
8  Naturaleza (INT) —
9  Religión (INT) —
10 Medicina (SAB) —
11 Percepción (SAB) —
12 Perspicacia (SAB) —
13 Supervivencia (SAB) —
14 Trato con Animales (SAB) —
15 Engaño (CAR) —
16 Interpretación (CAR) —
17 Intimidación (CAR) —
18 Persuasión (CAR) —
19 Alquimia (INT) —
20 Forja (SAB–FUE) —
21 Cocina (SAB) —
22 Cristalografía Arcana (INT) —
23 Tatuaje Rúnico (DES–INT) —
24 Extracción de Componentes (DES–INT) —
25 Destilación Exandriana (SAB) —
```
