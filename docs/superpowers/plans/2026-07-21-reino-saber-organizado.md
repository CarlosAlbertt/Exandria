# `/reino`: el saber organizado por lugar, color y categoría — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganizar `/reino` para que el saber se agrupe por lugar (con color propio) y dentro por categoría, en bloques plegables, con una sección propia para Exandria y la Calamidad y un control del DM que revela u oculta categorías enteras.

**Architecture:** `SaberEntry` gana dos campos derivados (`place`, `category`) calculados al construir `SABER` en `data/saber.ts`; la UI solo agrupa y pinta. `components/SaberSection.tsx` se parte en cuatro componentes con una responsabilidad cada uno bajo `components/reino/`. La Calamidad vive en `data/calamidad.ts` (relato abierto + entradas gateadas) y se pinta antes del navegador del saber. Sin migración: el revelado en bloque sigue en `app_config.lore_revealed`.

**Tech Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · TypeScript · Supabase Realtime.

**Spec:** `docs/superpowers/specs/2026-07-21-reino-saber-organizado-design.md`

**Rama:** `reino-saber-organizado`, partiendo de `master`.

---

## Sobre los tests en este repo

No hay framework de tests. El gate real del proyecto es `tsc --noEmit` +
`next build`, y las piezas puras se verifican con un script de comprobaciones
(`scripts/check-clima.ts`, `scripts/check-lore.ts`). El ciclo TDD de este plan
es, por tanto: **añadir la comprobación a `scripts/check-lore.ts` → verla fallar
→ implementar → verla pasar → commit**. `scripts/check-lore.ts` ya existe con 35
comprobaciones en verde; se amplía, no se reescribe.

Comando: `npx tsx scripts/check-lore.ts`

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `data/saber.ts` (modificar) | Añade `place`/`category` a cada entrada y exporta `PLACES`, `PLACE_ACCENT`, `CATEGORIES`. Sigue siendo la única fuente de `SABER`. |
| `lib/saber.ts` (modificar) | `revealed` abre cualquier entrada, no solo secretos. |
| `lib/useLoreRevealed.ts` (modificar) | `revealMany` / `hideMany` optimistas. |
| `data/calamidad.ts` (crear) | El relato de cinco actos + las entradas gateadas de la Calamidad. |
| `components/reino/SaberCard.tsx` (crear) | Una tarjeta de saber. |
| `components/reino/SaberCategory.tsx` (crear) | Subgrupo plegable + botones DM de bloque. |
| `components/reino/SaberPlace.tsx` (crear) | Bloque plegable de un lugar, con su color. |
| `components/reino/SaberBrowser.tsx` (crear) | Orquestador: ctx, agrupación, contadores, estado de los acordeones. |
| `components/reino/CalamidadSection.tsx` (crear) | Relato abierto + «El detalle». |
| `components/SaberSection.tsx` (borrar) | Sustituido por los cuatro de arriba. |
| `app/reino/page.tsx` (modificar) | Monta `CalamidadSection` + `SaberBrowser`. |
| `scripts/check-lore.ts` (modificar) | Comprobaciones nuevas. |

---

### Task 1: `place`, `category` y colores en el modelo del saber

**Files:**
- Modify: `data/saber.ts`
- Modify: `scripts/check-lore.ts`

- [ ] **Step 1: Escribir las comprobaciones que fallan**

Añadir al final de `scripts/check-lore.ts`, justo antes del bloque
`console.log(failures ? ...)`:

```ts
// --- Reparto por lugar y categoría -----------------------------------------
import { PLACES, PLACE_ACCENT, CATEGORIES } from "../data/saber";

const lugaresValidos = new Set<string>(PLACES);
const categoriasValidas = new Set<string>(CATEGORIES);
check("toda entrada tiene un lugar válido", SABER.every((e) => lugaresValidos.has(e.place)));
check("toda entrada tiene una categoría válida", SABER.every((e) => categoriasValidas.has(e.category)));
check("todo lugar tiene color", PLACES.every((p) => !!PLACE_ACCENT[p]));
check("ningún lugar se queda vacío", PLACES.every((p) => SABER.some((e) => e.place === p)));

for (const cont of ["Marquet", "Issylra", "Dientes Rotos"]) {
  const suyas = SABER.filter((e) => e.id.startsWith(`cl:${cont.toLowerCase().replace(/ /g, "-")}:`));
  check(`${cont}: su lore va a su lugar`, suyas.length > 0 && suyas.every((e) => e.place === cont));
}
check("las deidades van a Exandria", SABER.filter((e) => e.id.startsWith("dei:")).every((e) => e.place === "Exandria" && e.category === "Fe"));
check("las facciones de Tal'Dorei van a Potencias", SABER.filter((e) => e.id.startsWith("fac:")).every((e) => e.place === "Tal'Dorei" && e.category === "Potencias"));
check("lo de Wildemount va a Wildemount", SABER.filter((e) => e.id.startsWith("wmreg:") || e.id.startsWith("wmfac:")).every((e) => e.place === "Wildemount"));
check("los secretos van a la categoría Secretos", SABER.filter((e) => e.scope.kind === "secreto").every((e) => e.category === "Secretos"));
```

Mover el `import` al bloque de imports de arriba del archivo (TypeScript no
admite imports a media altura).

- [ ] **Step 2: Verla fallar**

Run: `npx tsx scripts/check-lore.ts`
Expected: error de compilación — `PLACES`, `PLACE_ACCENT` y `CATEGORIES` no
existen en `data/saber.ts`.

- [ ] **Step 3: Implementar en `data/saber.ts`**

Añadir tras el bloque de `SaberScope` los tipos y las tablas:

```ts
export const PLACES = ["Exandria", "Tal'Dorei", "Marquet", "Issylra", "Wildemount", "Dientes Rotos"] as const;
export type SaberPlace = (typeof PLACES)[number];

export const CATEGORIES = ["Geografía", "Historia", "Fe", "Potencias", "Vida y lenguas", "Cosmos", "Secretos"] as const;
export type SaberCategory = (typeof CATEGORIES)[number];

// Color por LUGAR (no por categoría): de un vistazo sabes de qué tierra hablas.
// Mismas variables que WORLD_COLOR; los acentos son datos en este proyecto
// (precedente: Region.accent en data/taldorei.ts).
export const PLACE_ACCENT: Record<SaberPlace, string> = {
  "Exandria": "var(--color-gold)",
  "Tal'Dorei": "var(--color-bronze-bright)",
  "Marquet": "var(--color-ember)",
  "Issylra": "var(--color-arcane)",
  "Wildemount": "var(--color-violet)",
  "Dientes Rotos": "var(--color-primitivo)",
};

export const PLACE_ICON: Record<SaberPlace, string> = {
  "Exandria": "fa-globe",
  "Tal'Dorei": "fa-tree",
  "Marquet": "fa-sun",
  "Issylra": "fa-snowflake",
  "Wildemount": "fa-mountain",
  "Dientes Rotos": "fa-water",
};
```

Añadir los dos campos al tipo `SaberEntry`:

```ts
export type SaberEntry = {
  id: string;
  scope: SaberScope;
  depth: "basico" | "profundo";
  topic: string;
  title: string;
  text: string;
  poi?: string;
  /** tierra a la que pertenece; "Exandria" = lo que no es de ningún continente */
  place: SaberPlace;
  /** eje transversal al ámbito, para agrupar dentro de cada lugar */
  category: SaberCategory;
};
```

Añadir el reparto, justo antes de la construcción de `SABER`:

```ts
// El lugar sale del ORIGEN de la entrada (su prefijo de id o su ámbito). Lo que
// no es de ningún continente —panteón, eras, lunas, planos, la Calamidad— cae
// en "Exandria", que hace de cajón del mundo.
function placeOf(e: Omit<SaberEntry, "place" | "category">): SaberPlace {
  if (e.scope.kind === "continente" && (PLACES as readonly string[]).includes(e.scope.continent)) {
    return e.scope.continent as SaberPlace;
  }
  if (e.id.startsWith("reg:") || e.id.startsWith("fac:")) return "Tal'Dorei";
  if (e.id.startsWith("wm") || e.id.startsWith("lang:") || e.id.startsWith("vida:")) return "Wildemount";
  if (e.id.startsWith("cl:")) {
    const found = PLACES.find((p) => e.id.startsWith(`cl:${slugKey(p)}:`));
    if (found) return found;
  }
  return "Exandria";
}

// La categoría cruza el ámbito: un secreto de Marquet es "Secretos" de Marquet.
function categoryOf(e: Omit<SaberEntry, "place" | "category">): SaberCategory {
  if (e.scope.kind === "secreto") return "Secretos";
  if (e.scope.kind === "deidad") return "Fe";
  if (e.id.startsWith("lang:") || e.id.startsWith("vida:")) return "Vida y lenguas";
  if (e.id.startsWith("luna:") || e.id.startsWith("plano:")) return "Cosmos";
  if (e.id.startsWith("hist:") || e.id.startsWith("crono:")) return "Historia";
  if (e.scope.kind === "erudito") {
    if (e.scope.skill === "Historia") return "Historia";
    if (e.scope.skill === "Religión") return "Fe";
    if (e.scope.skill === "Arcanos") return "Cosmos";
    return "Geografía"; // Naturaleza
  }
  if (e.scope.kind === "oculto") {
    return e.topic.startsWith("Lenguas") || e.topic.startsWith("Vida") ? "Vida y lenguas" : "Potencias";
  }
  return "Geografía";
}

function tag(entries: Omit<SaberEntry, "place" | "category">[]): SaberEntry[] {
  return entries.map((e) => ({ ...e, place: placeOf(e), category: categoryOf(e) }));
}
```

Envolver la construcción de `SABER`:

```ts
export const SABER: SaberEntry[] = tag([
  ...continentEntries(),
  ...regionEntries(),
  ...deityEntries(),
  ...factionEntries(),
  ...wildemountEntries(),
  ...continentLoreEntries(),
  ...historyEntries(),
  ...moonEntries(),
  ...planeEntries(),
  ...curatedEntries(),
]);
```

Cambiar el tipo de retorno de las funciones generadoras de `SaberEntry[]` a
`Omit<SaberEntry, "place" | "category">[]` (son nueve: `continentEntries`,
`regionEntries`, `deityEntries`, `factionEntries`, `wildemountEntries`,
`continentLoreEntries`, `historyEntries`, `moonEntries`, `planeEntries`,
`curatedEntries`).

- [ ] **Step 4: Verla pasar**

Run: `npx tsx scripts/check-lore.ts`
Expected: las 35 de antes en verde + las 9 nuevas. `Todo en verde`.

Run: `npx tsc --noEmit`
Expected: sin salida.

- [ ] **Step 5: Commit**

```bash
git add data/saber.ts scripts/check-lore.ts
git commit -m "feat(saber): cada entrada sabe de qué lugar y categoría es"
```

---

### Task 2: `revealed` abre cualquier entrada

**Files:**
- Modify: `lib/saber.ts:48-68`
- Modify: `scripts/check-lore.ts`

- [ ] **Step 1: Escribir las comprobaciones que fallan**

Añadir a `scripts/check-lore.ts`:

```ts
// --- El DM puede poner a la vista cualquier cosa, no solo secretos ----------
const unaHistoria = SABER.find((e) => e.scope.kind === "erudito" && e.scope.skill === "Historia")!;
check("revealed abre también lo erudito", !knows(unaHistoria, base) && knows(unaHistoria, { ...base, revealed: [unaHistoria.id] }));
const unaOculta = SABER.find((e) => e.scope.kind === "oculto")!;
check("revealed abre también lo oculto", !knows(unaOculta, base) && knows(unaOculta, { ...base, revealed: [unaOculta.id] }));
check("revelar una cosa no abre las demás", !knows(unaOculta, { ...base, revealed: [unaHistoria.id] }));
```

- [ ] **Step 2: Verla fallar**

Run: `npx tsx scripts/check-lore.ts`
Expected: `FAIL revealed abre también lo erudito` y `FAIL revealed abre también lo oculto`.

- [ ] **Step 3: Implementar**

En `lib/saber.ts`, dentro de `knows`, añadir la comprobación temprana bajo la de
`unlocked`:

```ts
export function knows(entry: SaberEntry, ctx: SaberCtx): boolean {
  if (ctx.isDm) return true;
  if (ctx.unlocked.includes(entry.id)) return true;
  // Lo que el DM ha puesto a la vista del grupo abre CUALQUIER entrada, no solo
  // los secretos: es lo que permite revelar una categoría entera de golpe.
  if (ctx.revealed.includes(entry.id)) return true;
  ...
```

Actualizar el comentario de cabecera de la función (la lista de reglas) y dejar
el `case "secreto"` como está — a partir de ahora es inalcanzable por la vía
normal, pero documenta la intención y protege si alguien reordena.

- [ ] **Step 4: Verla pasar**

Run: `npx tsx scripts/check-lore.ts`
Expected: `Todo en verde`, incluida la comprobación previa «los secretos solo si
el DM los revela», que sigue valiendo.

- [ ] **Step 5: Commit**

```bash
git add lib/saber.ts scripts/check-lore.ts
git commit -m "feat(saber): el DM puede revelar cualquier entrada, no solo secretos"
```

---

### Task 3: revelado en bloque en el hook

**Files:**
- Modify: `lib/useLoreRevealed.ts`

No lleva comprobación de script: es un hook de React con Supabase dentro, y
`scripts/check-lore.ts` solo cubre lo puro. Lo cubre `tsc` y la prueba en vivo.

- [ ] **Step 1: Implementar**

Sustituir el bloque del `toggle` por:

```ts
  // Optimista: refleja el cambio al instante y persiste en paralelo.
  const toggle = (id: string) => setRevealed((prev) => {
    const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    void persist(next);
    return next;
  });

  // Revelado en BLOQUE (una categoría, un lugar entero). Afecta a todo el
  // grupo; lo individual va por `lore_unlocked` desde Panel DM › Grupo.
  const revealMany = (ids: string[]) => setRevealed((prev) => {
    const next = [...new Set([...prev, ...ids])];
    void persist(next);
    return next;
  });

  const hideMany = (ids: string[]) => setRevealed((prev) => {
    const quitar = new Set(ids);
    const next = prev.filter((x) => !quitar.has(x));
    void persist(next);
    return next;
  });

  return { revealed, ready, toggle, revealMany, hideMany };
```

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit`
Expected: sin salida.

- [ ] **Step 3: Commit**

```bash
git add lib/useLoreRevealed.ts
git commit -m "feat(saber): revelar u ocultar lore en bloque"
```

---

### Task 4: la Calamidad — datos

**Files:**
- Create: `data/calamidad.ts`
- Modify: `data/saber.ts`
- Modify: `scripts/check-lore.ts`

- [ ] **Step 1: Escribir las comprobaciones que fallan**

Añadir a `scripts/check-lore.ts` (y el import arriba):

```ts
import { CALAMIDAD_RELATO, CALAMIDAD_LORE } from "../data/calamidad";

check("el relato tiene cinco actos", CALAMIDAD_RELATO.length === 5);
check("ningún acto vacío", CALAMIDAD_RELATO.every((a) => a.title.trim() && a.body.trim()));
const cal = SABER.filter((e) => e.id.startsWith("cal:"));
check("la lore de la Calamidad entra en el saber", cal.length === CALAMIDAD_LORE.length && cal.length >= 12);
check("toda la Calamidad va al lugar Exandria", cal.every((e) => e.place === "Exandria"));
check("la Calamidad no se sabe por origen", cal.filter((e) => e.scope.kind !== "continente").every((e) => !knows(e, { ...base, originContinent: "Tal'Dorei" })));
const poisCal = CALAMIDAD_LORE.filter((e) => e.poi && !nombresPoi.has(e.poi)).map((e) => e.poi);
check(`los poi de la Calamidad existen (${poisCal.join(", ") || "ninguno huérfano"})`, poisCal.length === 0);
```

- [ ] **Step 2: Verla fallar**

Run: `npx tsx scripts/check-lore.ts`
Expected: error de compilación — `data/calamidad.ts` no existe.

- [ ] **Step 3: Crear `data/calamidad.ts`**

Reutiliza el tipo de `data/continentes.ts`, que ya expresa exactamente lo que
hace falta (`tier` + `skill` + `poi`):

```ts
// La Calamidad: el acontecimiento que explica el mapa actual de Exandria.
// Dos capas, según lo decidido en el spec del 2026-07-21:
//   - CALAMIDAD_RELATO: relato corrido, ABIERTO a todo el mundo. Es lo que
//     cualquiera ha oído contar; sustituye a HISTORIA_BREVE en /reino.
//   - CALAMIDAD_LORE: el detalle, con candado por pericia o descubrimiento.
// Redacción propia; nombres y hechos de la ambientación. Fans, no oficial.

import type { ContinentLoreEntry } from "@/data/continentes";

export type Acto = { title: string; body: string };

export const CALAMIDAD_RELATO: Acto[] = [ /* cinco actos, ver más abajo */ ];

export const CALAMIDAD_LORE: ContinentLoreEntry[] = [ /* doce entradas, ver más abajo */ ];
```

**Los cinco actos** (`continent` no aplica al relato; es prosa suelta):

1. `La Fundación` — los dioses hicieron el mundo y se lo encontraron ocupado por
   los primordiales, titanes de fuego, tierra, agua y aire. Los que se pusieron a
   defender a los recién creados fueron los Primarios; los que vieron mejor
   negocio del otro lado, los Traidores. Ganaron los primeros, y los Traidores
   acabaron encerrados fuera del mundo.
2. `La Era de los Arcanos` — siglos de magia sin freno. Ciudades enteras
   volando: Avalir, Aeor, Zemniaz, Kethesk. Una maga destruyó al dios de la
   muerte y ocupó su lugar — así nació la Matriarca Cuervo. A alguien le pareció
   que aquello se podía repetir.
3. `Vespin Chloras` — el archimago que soltó a los Traidores buscando ese mismo
   poder. Levantaron Ghor Dranas en Xhorhas y trabajaron en silencio hasta que
   asaltaron Vasselheim por sorpresa: veinte días de batalla y el mundo entero en
   guerra.
4. `Dos siglos de guerra` — Lolth cayó la primera y sus drow huyeron bajo tierra.
   Corellon le sacó un ojo a Gruumsh y de aquella sangre salieron orcos y
   centauros. Domunas reventó en pedazos. Gruumsh quemó Marquet y hundió una
   ciudad entera. Los mortales empezaron a fabricar armas para matar dioses, y
   los dioses hicieron una tregua para derribar Aeor. El cielo estuvo cargado de
   ceniza más de cien años.
5. `La Divergencia` — Ghor Dranas cayó, los Traidores fueron desterrados y los
   Primarios decidieron marcharse también, levantando la Puerta Divina a su
   espalda. Ese es el año 0. Sobrevivió un tercio de la gente. En pie quedó
   Vasselheim, y poco más.

Cada acto: `{ title: "La Fundación", body: "…" }` con 3-5 frases de prosa propia.

**Las doce entradas** de `CALAMIDAD_LORE`, todas con `continent: "Exandria"` e
`id` sin prefijo (el prefijo `cal:` lo pone `saber.ts`):

| `id` | `tier` / `skill` | `topic` | `title` | Contenido |
|---|---|---|---|---|
| `ritual-siembra` | erudito · Arcanos | Arcanos · La Calamidad | El Ritual de Siembra | Una maga destruyó al dios de la muerte y ocupó su puesto. Demostró que un mortal podía matar a un dios y quedarse con el sitio; de ahí salió todo lo demás. |
| `vespin-chloras` | erudito · Historia | Historia · La Calamidad | Vespin Chloras | El archimago que rompió las prisiones planarias de los Traidores buscando ese mismo poder. |
| `ghor-dranas` | erudito · Historia | Historia · La Calamidad | Ghor Dranas | El reino que los Traidores levantaron en Xhorhas en las horas siguientes a su liberación. Sobre sus ruinas se alza hoy Rosohna. |
| `asalto-vasselheim` | erudito · Historia | Historia · La Calamidad | El asalto a Vasselheim | Veinte días de batalla. La ciudad aguantó con ayuda de los Primarios, y aquello destapó el juego: el mundo entero fue a la guerra. `poi: "Vasselheim"` |
| `ciudades-voladoras` | erudito · Arcanos | Arcanos · La Calamidad | Las ciudades que volaban | Avalir, Aeor, Zemniaz, Kethesk. Ninguna sobrevivió. Aeor fue la última y llegó a fabricar armas para matar dioses; los dioses pactaron una tregua para derribarla, unos cincuenta años antes del final. |
| `trono-archicorazon` | erudito · Historia | Historia · La Calamidad | El Trono del Archicorazón | Donde Corellon le sacó el ojo a Gruumsh. De la sangre derramada salieron los primeros orcos, y de los señores de los caballos caídos allí, los centauros. |
| `vestigios` | erudito · Historia | Historia · La Calamidad | Los Vestigios de la Divergencia | Armas y reliquias forjadas por dioses y archimagos para la guerra. Duermen hasta que dan con la mano adecuada, y entonces despiertan por partes. |
| `puerta-divina` | erudito · Religión | Religión · La Calamidad | La Puerta Divina | La barrera que los propios Primarios levantaron para no volver a pisar el mundo. Desde entonces un dios solo puede obrar a través de quien le reza. |
| `sarenrae` | erudito · Religión | Religión · La Calamidad | El nombre que se borró | Sarenrae creyó que hasta lo corrupto podía redimirse, y Asmodeus la engañó y aniquiló a sus fieles de un golpe. Los sacerdotes borraron su nombre de los registros; ocho siglos después empieza a volver. |
| `ioun` | erudito · Religión | Religión · La Calamidad | La herida de Ioun | Tharizdun la hirió casi de muerte y su templo se hundió bajo tierra. Su culto nunca se recuperó del todo; el Alma de Cobalto nació para seguir su trabajo. |
| `mapa-roto` | erudito · Naturaleza | Naturaleza · La Calamidad | Cómo cambió el mapa | El puente de tierra entre Tal'Dorei y Wildemount se hundió y dejó el Canal de Cizalla. La Costa del Serrallo se la tragó el mar y la jungla. Las Sierras de Alabastro se llenaron de piedrablanca. Xhorhas dejó de ser bosque. |
| `lo-perdido` | erudito · Arcanos | Arcanos · La Calamidad | Lo que se perdió para siempre | Sobrevivió un tercio de la gente y casi ningún archivo. Parte se destruyó sola; parte la quemaron a propósito, para que nadie volviera a construir lo que llevó a aquello. |

Y **dos secretos** (`tier: "secreto"`, `topic: "Secretos · La Calamidad"`):

| `id` | `title` | Contenido |
|---|---|---|
| `aeor` | Aeor sigue ahí | La ciudad no fue aniquilada: cayó. Está bajo el hielo de Eiselcross, con sus armas dentro y cosas que aún se mueven por sus pasillos. |
| `alyxian` | El campeón que no murió | Alyxian frenó la lanza de Gruumsh y no llegó a morir: acabó en un lugar que no es del todo este mundo, y siguió allí siglos después. |

- [ ] **Step 4: Enchufarla en `data/saber.ts`**

En el import de `continentes`, añadir la Calamidad:

```ts
import { CONTINENT_LORE, type ContinentLoreEntry } from "@/data/continentes";
import { CALAMIDAD_LORE } from "@/data/calamidad";
```

Añadir la función generadora junto a `continentLoreEntries`:

```ts
// La Calamidad no es de ningún continente: su `place` cae en "Exandria" por
// defecto, que es justo lo que se quiere.
function calamidadEntries(): Omit<SaberEntry, "place" | "category">[] {
  return CALAMIDAD_LORE.map((e) => ({
    id: `cal:${e.id}`,
    scope: scopeOfContinentLore(e),
    depth: "profundo" as const,
    topic: e.topic,
    title: e.title,
    text: e.text,
    poi: e.poi,
  }));
}
```

Y añadirla a `SABER`, tras `continentLoreEntries()`:

```ts
  ...continentLoreEntries(),
  ...calamidadEntries(),
```

- [ ] **Step 5: Verla pasar**

Run: `npx tsx scripts/check-lore.ts`
Expected: `Todo en verde` con las 6 comprobaciones nuevas.

Run: `npx tsc --noEmit`
Expected: sin salida.

- [ ] **Step 6: Commit**

```bash
git add data/calamidad.ts data/saber.ts scripts/check-lore.ts
git commit -m "feat(lore): Exandria y la Calamidad, relato abierto y detalle gateado"
```

---

### Task 5: `SaberCard`

**Files:**
- Create: `components/reino/SaberCard.tsx`

- [ ] **Step 1: Implementar**

```tsx
"use client";
import type { SaberEntry } from "@/data/saber";
import { lockReason } from "@/lib/saber";

// Una tarjeta de saber: lo que sabes, o el motivo por el que no. El punto de
// color es el del LUGAR al que pertenece (lo pasa el bloque padre).
export default function SaberCard({
  entry, open, accent, isDm, revealed, onToggle,
}: {
  entry: SaberEntry;
  open: boolean;
  accent: string;
  isDm: boolean;
  revealed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="panel-raised p-4" style={{ borderLeft: `3px solid ${accent}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-ui text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--color-dim)" }}>
            {entry.topic}
          </p>
          <p className="font-display font-extrabold text-[15px]" style={{ color: "var(--color-parch)" }}>
            {entry.title}
          </p>
        </div>
        {isDm && (
          <button
            onClick={onToggle}
            title={revealed ? "Ocultar al grupo" : "Revelar al grupo"}
            className="btn-ghost !py-1 !px-2 text-[11px] shrink-0"
            style={{ color: revealed ? "var(--color-primitivo)" : "var(--color-dim)" }}
          >
            <i className={`fas ${revealed ? "fa-eye" : "fa-eye-slash"} mr-1`} />
            {revealed ? "Visible" : "Oculto"}
          </button>
        )}
      </div>
      {open ? (
        <p className="prose-lore !text-[14px] !mb-0 mt-2 whitespace-pre-wrap">{entry.text}</p>
      ) : (
        <p className="font-ui text-[12px] italic mt-2 flex items-start gap-1.5" style={{ color: "var(--color-dim)" }}>
          <i className="fas fa-lock mt-0.5" />
          {lockReason(entry)}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit`
Expected: sin salida.

- [ ] **Step 3: Commit**

```bash
git add components/reino/SaberCard.tsx
git commit -m "feat(reino): tarjeta de saber con acento del lugar"
```

---

### Task 6: `SaberCategory`

**Files:**
- Create: `components/reino/SaberCategory.tsx`

- [ ] **Step 1: Implementar**

```tsx
"use client";
import { useState } from "react";
import type { SaberEntry } from "@/data/saber";
import { knows, type SaberCtx } from "@/lib/saber";
import SaberCard from "./SaberCard";

// Subgrupo plegable dentro de un lugar. El DM tiene aquí el revelado en BLOQUE:
// actúa sobre las entradas de esta categoría EN ESTE LUGAR, no en todo el mundo.
export default function SaberCategory({
  category, entries, ctx, accent, revealed, onToggle, onRevealMany, onHideMany, defaultOpen = false,
}: {
  category: string;
  entries: SaberEntry[];
  ctx: SaberCtx;
  accent: string;
  revealed: string[];
  onToggle: (id: string) => void;
  onRevealMany: (ids: string[]) => void;
  onHideMany: (ids: string[]) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const sabidas = entries.filter((e) => knows(e, ctx)).length;
  const ids = entries.map((e) => e.id);
  const todasVisibles = ids.every((id) => revealed.includes(id));

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 font-ui text-[12px] font-bold uppercase tracking-wide"
          style={{ color: accent }}
        >
          <i className={`fas fa-chevron-${open ? "down" : "right"} text-[10px]`} />
          {category}
          <span className="font-normal normal-case" style={{ color: "var(--color-dim)" }}>
            {sabidas}/{entries.length}
          </span>
        </button>
        {ctx.isDm && (
          <button
            onClick={() => (todasVisibles ? onHideMany(ids) : onRevealMany(ids))}
            className="btn-ghost !py-0.5 !px-2 text-[10px]"
          >
            <i className={`fas ${todasVisibles ? "fa-eye-slash" : "fa-eye"} mr-1`} />
            {todasVisibles ? "Ocultar todo" : "Revelar todo"}
          </button>
        )}
      </div>

      {open && (
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {entries.map((e) => (
            <SaberCard
              key={e.id}
              entry={e}
              open={knows(e, ctx)}
              accent={accent}
              isDm={ctx.isDm}
              revealed={revealed.includes(e.id)}
              onToggle={() => onToggle(e.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit`
Expected: sin salida.

- [ ] **Step 3: Commit**

```bash
git add components/reino/SaberCategory.tsx
git commit -m "feat(reino): categoria plegable con revelado en bloque"
```

---

### Task 7: `SaberPlace` y `SaberBrowser`

**Files:**
- Create: `components/reino/SaberPlace.tsx`
- Create: `components/reino/SaberBrowser.tsx`

- [ ] **Step 1: Implementar `SaberPlace`**

```tsx
"use client";
import type { SaberEntry, SaberPlace as Place } from "@/data/saber";
import { CATEGORIES, PLACE_ACCENT, PLACE_ICON } from "@/data/saber";
import { knows, type SaberCtx } from "@/lib/saber";
import SaberCategory from "./SaberCategory";

// Bloque de un LUGAR, teñido con su color. Si no sabes nada de esta tierra, el
// bloque sale igual pero sin tarjetas: un candado con el título puesto ya
// spoilea, así que solo se dice CUÁNTO falta, no el qué.
export default function SaberPlace({
  place, entries, ctx, open, onOpenChange, revealed, onToggle, onRevealMany, onHideMany,
}: {
  place: Place;
  entries: SaberEntry[];
  ctx: SaberCtx;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  revealed: string[];
  onToggle: (id: string) => void;
  onRevealMany: (ids: string[]) => void;
  onHideMany: (ids: string[]) => void;
}) {
  const accent = PLACE_ACCENT[place];
  const sabidas = entries.filter((e) => knows(e, ctx)).length;
  const listadas = entries.filter((e) => ctx.isDm || knows(e, ctx));
  const ids = entries.map((e) => e.id);
  const vacio = listadas.length === 0;

  return (
    <div className="mb-6 panel p-5" style={{ borderTop: `2px solid ${accent}` }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={() => onOpenChange(!open)} className="flex items-center gap-3 min-w-0">
          <i className={`fas ${PLACE_ICON[place]}`} style={{ color: accent }} />
          <span className="font-display text-lg font-extrabold" style={{ color: "var(--color-parch)" }}>{place}</span>
          <span className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>
            sabes {sabidas} de {entries.length}
          </span>
          <i className={`fas fa-chevron-${open ? "up" : "down"} text-[11px]`} style={{ color: "var(--color-dim)" }} />
        </button>
        {ctx.isDm && (
          <div className="flex gap-2">
            <button onClick={() => onRevealMany(ids)} className="btn-ghost !py-0.5 !px-2 text-[10px]">
              <i className="fas fa-eye mr-1" />Revelar el bloque
            </button>
            <button onClick={() => onHideMany(ids)} className="btn-ghost !py-0.5 !px-2 text-[10px]">
              <i className="fas fa-eye-slash mr-1" />Ocultarlo
            </button>
          </div>
        )}
      </div>

      {open && (
        <div className="mt-4">
          {vacio ? (
            <p className="font-ui text-[12px] italic" style={{ color: "var(--color-dim)" }}>
              <i className="fas fa-lock mr-1.5" />
              De estas tierras no sabes nada todavía · {entries.length} cosas por descubrir
            </p>
          ) : (
            CATEGORIES.map((c) => {
              const suyas = listadas.filter((e) => e.category === c);
              if (!suyas.length) return null;
              return (
                <SaberCategory
                  key={c}
                  category={c}
                  entries={suyas}
                  ctx={ctx}
                  accent={accent}
                  revealed={revealed}
                  onToggle={onToggle}
                  onRevealMany={onRevealMany}
                  onHideMany={onHideMany}
                  defaultOpen
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Implementar `SaberBrowser`**

```tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { loadActiveCharacter } from "@/lib/character";
import { useLoreRevealed } from "@/lib/useLoreRevealed";
import { SABER, PLACES, type SaberPlace } from "@/data/saber";
import { knows, EMPTY_CTX, type SaberCtx } from "@/lib/saber";
import SaberPlaceBlock from "./SaberPlace";

// "Saber del mundo": lo que TU personaje sabe, ordenado por tierra y, dentro,
// por categoría. De salida conoces lo básico de los continentes, el tuyo a
// fondo, tu región y tu deidad; las pericias abren la capa erudita. Lo demás se
// descubre jugando (tomos, misiones, el DM, o una tirada in situ).
export default function SaberBrowser() {
  const session = useSession();
  const isDm = session?.role === "dm";
  const { revealed, toggle, revealMany, hideMany } = useLoreRevealed();
  const [ctx, setCtx] = useState<SaberCtx>({ ...EMPTY_CTX });
  const [onlyKnown, setOnlyKnown] = useState(false);
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let on = true;
    (async () => {
      if (!session?.id) return;
      const c = isDm ? null : await loadActiveCharacter(session.id);
      if (!on) return;
      setCtx({
        isDm,
        originContinent: c?.origin_continent ?? null,
        originRegion: c?.origin_region ?? null,
        deity: c?.deity ?? null,
        cls: c?.cls ?? null,
        skills: c?.skills ?? [],
        unlocked: Array.isArray(c?.lore_unlocked) ? c!.lore_unlocked : [],
        revealed: [],
      });
      // Al entrar se abren tu tierra y Exandria; el resto, plegado. El DM entra
      // con todo cerrado (si no, la página es un muro).
      setAbiertos(isDm ? {} : { "Exandria": true, ...(c?.origin_continent ? { [c.origin_continent]: true } : {}) });
    })();
    return () => { on = false; };
  }, [session?.id, isDm]);

  const full: SaberCtx = useMemo(() => ({ ...ctx, isDm, revealed }), [ctx, isDm, revealed]);

  const porLugar = useMemo(() => {
    const m = new Map<SaberPlace, typeof SABER>();
    for (const p of PLACES) m.set(p, []);
    for (const e of SABER) {
      if (onlyKnown && !knows(e, full)) continue;
      m.get(e.place)!.push(e);
    }
    return m;
  }, [full, onlyKnown]);

  const known = SABER.filter((e) => knows(e, full)).length;
  const porDescubrir = SABER.length - known;

  return (
    <section className="mb-20 reveal">
      <h2 className="font-display text-2xl font-bold mb-3 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
        <i className="fas fa-book-skull text-[var(--color-arcane)]" /> Saber del mundo
      </h2>
      <p className="prose-lore !text-[15px] mb-4 max-w-2xl">
        Sabes lo que tu personaje sabría: algo de los continentes, tu tierra y tu fe. Lo demás se gana
        leyendo, viajando y jugando.
      </p>

      <div className="flex items-center gap-3 flex-wrap mb-6">
        <span className="font-ui text-[12px]" style={{ color: "var(--color-dim)" }}>
          Sabes <strong style={{ color: "var(--color-bronze-bright)" }}>{known}</strong> cosas
          {porDescubrir > 0 && <> · te quedan <strong style={{ color: "var(--color-arcane)" }}>{porDescubrir}</strong> por descubrir</>}
        </span>
        <button onClick={() => setOnlyKnown((v) => !v)} className="btn-ghost !py-1 !px-2.5 text-[11px]">
          <i className={`fas ${onlyKnown ? "fa-eye" : "fa-filter"} mr-1`} />{onlyKnown ? "Ver todo" : "Solo lo que sé"}
        </button>
        <button onClick={() => setAbiertos(Object.fromEntries(PLACES.map((p) => [p, true])))} className="btn-ghost !py-1 !px-2.5 text-[11px]">
          <i className="fas fa-angles-down mr-1" />Desplegar todo
        </button>
        <button onClick={() => setAbiertos({})} className="btn-ghost !py-1 !px-2.5 text-[11px]">
          <i className="fas fa-angles-up mr-1" />Plegar todo
        </button>
      </div>

      {PLACES.map((p) => (
        <SaberPlaceBlock
          key={p}
          place={p}
          entries={porLugar.get(p) ?? []}
          ctx={full}
          open={!!abiertos[p]}
          onOpenChange={(v) => setAbiertos((prev) => ({ ...prev, [p]: v }))}
          revealed={revealed}
          onToggle={toggle}
          onRevealMany={revealMany}
          onHideMany={hideMany}
        />
      ))}
    </section>
  );
}
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit`
Expected: sin salida.

- [ ] **Step 4: Commit**

```bash
git add components/reino/SaberPlace.tsx components/reino/SaberBrowser.tsx
git commit -m "feat(reino): navegador del saber por lugar y categoria"
```

---

### Task 8: la sección de la Calamidad y el montaje de la página

**Files:**
- Create: `components/reino/CalamidadSection.tsx`
- Modify: `app/reino/page.tsx`
- Delete: `components/SaberSection.tsx`

- [ ] **Step 1: Implementar `CalamidadSection`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { loadActiveCharacter } from "@/lib/character";
import { useLoreRevealed } from "@/lib/useLoreRevealed";
import { CALAMIDAD_RELATO } from "@/data/calamidad";
import { SABER, PLACE_ACCENT } from "@/data/saber";
import { knows, EMPTY_CTX, type SaberCtx } from "@/lib/saber";
import SaberCategory from "./SaberCategory";

// Exandria y la Calamidad. El relato lo sabe cualquiera —es lo que se cuenta en
// las tabernas—; el detalle se gana con pericia o descubriéndolo.
export default function CalamidadSection() {
  const session = useSession();
  const isDm = session?.role === "dm";
  const { revealed, toggle, revealMany, hideMany } = useLoreRevealed();
  const [ctx, setCtx] = useState<SaberCtx>({ ...EMPTY_CTX });

  useEffect(() => {
    let on = true;
    (async () => {
      if (!session?.id) return;
      const c = isDm ? null : await loadActiveCharacter(session.id);
      if (!on) return;
      setCtx({
        isDm,
        originContinent: c?.origin_continent ?? null,
        originRegion: c?.origin_region ?? null,
        deity: c?.deity ?? null,
        cls: c?.cls ?? null,
        skills: c?.skills ?? [],
        unlocked: Array.isArray(c?.lore_unlocked) ? c!.lore_unlocked : [],
        revealed: [],
      });
    })();
    return () => { on = false; };
  }, [session?.id, isDm]);

  const full: SaberCtx = { ...ctx, isDm, revealed };
  const accent = PLACE_ACCENT["Exandria"];
  const detalle = SABER.filter((e) => e.id.startsWith("cal:") && (isDm || knows(e, full)));

  return (
    <section className="mb-20">
      <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: "var(--color-parch)" }}>
        <i className="fas fa-hourglass-half" style={{ color: accent }} /> Exandria y la Calamidad
      </h2>

      <div className="panel p-6 max-w-3xl space-y-5" style={{ borderTop: `2px solid ${accent}` }}>
        {CALAMIDAD_RELATO.map((a) => (
          <div key={a.title}>
            <p className="font-display font-extrabold text-[15px] mb-1" style={{ color: accent }}>{a.title}</p>
            <p className="prose-lore !text-[15px] !mb-0">{a.body}</p>
          </div>
        ))}
        <p className="font-ui text-[12px] pt-2 italic" style={{ color: "var(--color-dim)" }}>
          <i className="fas fa-circle-info mr-1.5" />
          Esto lo sabe cualquiera. El detalle —quién hizo qué, y qué se perdió— se estudia o se descubre.
        </p>
      </div>

      {detalle.length > 0 && (
        <div className="mt-6 panel p-5" style={{ borderTop: `2px solid ${accent}` }}>
          <p className="eyebrow mb-3" style={{ color: accent }}>El detalle</p>
          <SaberCategory
            category="La Calamidad"
            entries={detalle}
            ctx={full}
            accent={accent}
            revealed={revealed}
            onToggle={toggle}
            onRevealMany={revealMany}
            onHideMany={hideMany}
            defaultOpen
          />
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Montar la página**

En `app/reino/page.tsx`: quitar el import de `HISTORIA_BREVE` y el de
`SaberSection`; añadir `CalamidadSection` y `SaberBrowser`; borrar el bloque
`<section>` de «Lo que todo el mundo sabe» entero y sustituirlo:

```tsx
import ReinoRegions from "@/components/ReinoRegions";
import SaberBrowser from "@/components/reino/SaberBrowser";
import CalamidadSection from "@/components/reino/CalamidadSection";
import CalendarWheel from "@/components/reino/CalendarWheel";
```

```tsx
      {/* EXANDRIA Y LA CALAMIDAD — relato abierto + detalle gateado */}
      <CalamidadSection />

      {/* SABER DEL MUNDO — por lugar y categoría */}
      <SaberBrowser />
```

Actualizar el comentario de cabecera del archivo para que describa el orden
nuevo. `HISTORIA_BREVE` **no se borra** de `data/loreTiers.ts`: la usa el
narrador IA.

- [ ] **Step 3: Borrar el componente viejo**

```bash
git rm components/SaberSection.tsx
```

Comprobar que no queda ningún consumidor:

Run: `grep -rn "SaberSection" app components lib data --include=*.tsx --include=*.ts`
Expected: sin resultados.

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit`
Expected: sin salida.

Run: `npx next build`
Expected: build limpio, con `/reino` en la lista de rutas.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(reino): seccion de la Calamidad y pagina remontada"
```

---

### Task 9: gate final, documentación y merge

**Files:**
- Modify: `HANDOFF.md`

- [ ] **Step 1: Pasar el gate completo**

Run: `npx tsx scripts/check-lore.ts`
Expected: `Todo en verde` (35 previas + ~18 nuevas).

Run: `npx tsc --noEmit`
Expected: sin salida.

Run: `npx next build`
Expected: build limpio.

- [ ] **Step 2: Prueba en vivo**

Levantar el preview y comprobar en el navegador: los seis bloques de lugar
aparecen con su color; el bloque de tu tierra y el de Exandria vienen abiertos;
plegar/desplegar funciona; el relato de la Calamidad se ve entero sin sesión de
DM; y un lugar del que no sabes nada muestra la línea de «N cosas por descubrir»
sin listar títulos.

- [ ] **Step 3: Documentar**

Añadir a `HANDOFF.md`, encima del bloque RESUELTO más reciente, una sección
`## RESUELTO (2026-07-21): /reino organizado por lugar y categoría 🎨` con: el
reparto `place`/`category`, la tabla de colores, el cambio de regla de
`revealed`, los cuatro componentes nuevos, `data/calamidad.ts`, y la
verificación. Actualizar también el bloque «ARRANQUE RÁPIDO» de arriba.

- [ ] **Step 4: Commit y merge**

```bash
git add HANDOFF.md
git commit -m "docs(handoff): /reino organizado por lugar y categoria"
git checkout master
git merge --no-ff reino-saber-organizado
git push origin master
```

---

## Autorrevisión del plan

**Cobertura del spec:**

| Requisito del spec | Task |
|---|---|
| `place` / `category` / `PLACE_ACCENT` | 1 |
| `revealed` abre cualquier entrada | 2 |
| `revealMany` / `hideMany` | 3 |
| `CALAMIDAD_RELATO` + `CALAMIDAD_LORE` | 4 |
| `SaberCard` | 5 |
| `SaberCategory` + botones DM de bloque | 6 |
| `SaberPlace` + `SaberBrowser` + acordeones + bloque vacío + barra de filtros | 7 |
| `CalamidadSection` + página + retirada de `SaberSection` | 8 |
| Verificación y documentación | 9 |

**Consistencia de tipos:** `SaberEntry` gana `place: SaberPlace` y
`category: SaberCategory` en la Task 1 y así se usa en 5, 6, 7 y 8. Las
generadoras devuelven `Omit<SaberEntry, "place" | "category">[]` desde la Task 1,
y `calamidadEntries` (Task 4) sigue la misma firma. `useLoreRevealed` devuelve
`{ revealed, ready, toggle, revealMany, hideMany }` en la Task 3 y se consume con
esos mismos nombres en 7 y 8. `SaberPlace` es a la vez el nombre del tipo y del
componente: en `SaberBrowser` se importa el componente como `SaberPlaceBlock`
para evitar la colisión.

**Nota de estilo:** `scopeOfContinentLore` (ya existente en `data/saber.ts`) se
reutiliza en la Task 4 sin cambios; `ContinentLoreEntry` se reutiliza como tipo
de `CALAMIDAD_LORE`, con `continent: "Exandria"`, que no es un continente real
pero sí un `place` válido — el campo solo se usa para el ámbito `continente`, que
ninguna entrada de la Calamidad tiene.
