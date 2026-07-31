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

## 4. Lo que falta por decidir

1. **Qué hace cada una de las 25.** Es lo que el usuario va a dictar. Por cada
   pericia hace falta saber: **contra qué se tira** (CD fija, CD del DM, o
   tirada enfrentada), **qué pasa al fallar** (nada, algo malo, o un solo
   intento) y **quién resuelve** (la app sola, como `SaberRoll`, o texto que
   guía al DM en la mesa).
2. **Visto bueno al reparto por clase** de §2.3.
3. **En las dobles, ¿quién elige la aptitud?** ¿El jugador al tirar, o el DM
   según la situación?
4. **¿Las 7 nuevas entran en `SaberRoll`** («¿Qué sé de esto?» en `/lugar`), o
   ese sitio se queda con Historia/Arcanos/Religión?
