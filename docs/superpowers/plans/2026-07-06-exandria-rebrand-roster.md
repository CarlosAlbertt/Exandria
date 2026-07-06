# Exandria: rebrand + roster + tomo de creación — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reencuadrar la app de Tal'Dorei a Exandria (mundo), ampliar el roster a ~36 especies + Cazador de Sangre, y rediseñar `/crear` como un tomo (libro doble página, giro 3D, índices) con huecos de imagen.

**Architecture:** Next.js 16 (App Router) + React 19 + Tailwind v4. El contenido vive en `data/*.ts` (fuente de verdad). La UI de `/crear` se refactoriza a una carcasa `CharacterBook` que pinta capítulos en páginas izquierda/derecha; la lógica de estado/validación actual se conserva. Rebrand = solo strings de cara al usuario.

**Tech Stack:** TypeScript, React 19 (client components), Tailwind CSS v4 (`@theme` tokens en `app/globals.css`), Font Awesome (ya cargado en `layout.tsx`).

---

## Notas para el ejecutor (leer antes de empezar)

- **Next 16 rompe cosas.** `AGENTS.md` obliga: ante cualquier duda de API de Next, lee `node_modules/next/dist/docs/` antes de escribir. No asumas APIs de tu memoria.
- **No hay test runner** (el proyecto solo tiene `next`, `eslint`, `tsc`). Esto es un proyecto de contenido + UI; los "tests" de este plan son **puertas de verificación**: `npx tsc --noEmit`, `npm run build`, `npm run lint` y verificación visual con las herramientas `preview_*`. No instales Jest/Vitest.
- **Commits:** autor ya configurado (`CarlosAlbertt <CarlosAlbertt@users.noreply.github.com>`). Cada commit termina con la línea `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Vercel bloquea otros emails.
- **Rama:** trabaja en `exandria-rebrand-roster` (ya creada).
- **Fuente de verdad del roster:** la tabla de `docs/superpowers/specs/2026-07-06-exandria-rebrand-roster-design.md` §3. Los datos mecánicos son hechos (fuentes oficiales 2024/MPMM/MOoT/EGtW/WBtW/Tal'Dorei Reborn); `blurb`/`origin`/`perk` son resúmenes propios (herramienta de fans, ver convención en `README.md`).
- **Verificación por defecto (repetir al final de cada tarea salvo que se indique otra):**
  - `npx tsc --noEmit` → sin errores.
  - `npm run lint` → sin errores nuevos.
  - Al tocar UI: `npm run build` limpio + preview (ver Tarea de arranque de preview).

---

## Tarea 0: Preparar preview

**Files:** Crear `.claude/launch.json`

- [ ] **Step 1: Crear config de dev server**

Crear `.claude/launch.json`:

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "exandria-dev", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev"], "port": 3000 }
  ]
}
```

- [ ] **Step 2: Arrancar y comprobar base**

`preview_start` con `name: "exandria-dev"`. Luego `preview_snapshot` de `/` para confirmar que la app arranca (aunque salga el aviso de Supabase sin configurar; es esperado en dev sin `.env.local`).

- [ ] **Step 3: Commit**

```bash
git add .claude/launch.json
git commit -m "chore: config de preview para dev server

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

# FASE 1 — Rebrand de texto + `/reino` a mundo

## Tarea 1: Metadatos y marca globales

**Files:**
- Modify: `app/layout.tsx:10-17`
- Modify: `components/SiteNav.tsx` (leer primero)
- Modify: `components/SiteFooter.tsx` (leer primero)
- Modify: `components/Emblem.tsx` (leer primero)
- Modify: `app/page.tsx` (leer primero)
- Modify: `app/login/page.tsx` (leer primero)

- [ ] **Step 1: Metadata de `app/layout.tsx`**

Sustituir el objeto `metadata` (líneas 10-17) por:

```tsx
export const metadata: Metadata = {
  title: {
    default: "Exandria — Compañero de Campaña",
    template: "%s · Exandria",
  },
  description:
    "Compañero de campaña multijugador para D&D en el mundo de Exandria: creador de personaje, lore, mapa y narración en vivo. Campaña ambientada en Tal'Dorei.",
};
```

- [ ] **Step 2: Marca en Nav/Footer/Emblem/Home/Login**

Leer cada archivo y reemplazar el **texto visible** de marca/título de "Tal'Dorei" por "Exandria" manteniendo el encuadre "campaña en Tal'Dorei" donde tenga sentido. Regla: el marco general = Exandria (mundo); Tal'Dorei se menciona como la región de la campaña, no como el nombre del producto. No tocar rutas, clases, ni identificadores.

Buscar candidatos: `git grep -n "Tal.Dorei" -- components/SiteNav.tsx components/SiteFooter.tsx components/Emblem.tsx app/page.tsx app/login/page.tsx`

- [ ] **Step 3: Verificar**

`npx tsc --noEmit` limpio. `preview_start` (o reload), `preview_snapshot` de `/` y `/login`: la marca dice Exandria. `preview_screenshot` de `/`.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx components/SiteNav.tsx components/SiteFooter.tsx components/Emblem.tsx app/page.tsx app/login/page.tsx
git commit -m "rebrand: marca y metadatos a Exandria (campaña en Tal'Dorei)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Tarea 2: `/reino` — de continente a mundo

**Files:**
- Modify: `app/reino/page.tsx:6-27`

- [ ] **Step 1: Título y metadata**

En `app/reino/page.tsx`:
- Metadata (línea 6-9): `title: "El Mundo"`, `description: "Historia, continentes, panteón, calendario y cosmología de Exandria. La campaña transcurre en Tal'Dorei."`.
- Cabecera (línea 18-19): `eyebrow` → `"Compendio del mundo"`; `<h1>` → `El Mundo de Exandria`.
- Intro (línea 20): en vez de `CONTINENT.intro` (intro de Tal'Dorei), usar un texto de mundo. Añadir a `data/cosmology.ts` una constante `WORLD_INTRO` (string) con 2-3 frases sobre Exandria y que la campaña arranca en Tal'Dorei; importarla y usarla aquí.
- Cabecera de historia (línea 25-26): `Una historia de Tal'Dorei` → `Una historia de Exandria`.

- [ ] **Step 2: Añadir `WORLD_INTRO` a cosmología**

En `data/cosmology.ts`, añadir y exportar:

```ts
export const WORLD_INTRO =
  "Exandria es un mundo forjado y roto muchas veces por dioses, primordiales y mortales. Sus continentes —Tal'Dorei, Wildemount, Issylra, Marquet— y sus mares guardan imperios caídos, magia antigua y heridas que aún no cicatrizan. Vuestra campaña comienza en Tal'Dorei, la tierra salvaje del oeste.";
```

Ajustar el texto si `data/taldorei.ts` `CONTINENT.intro` ya cubre parte; mantener este a nivel mundo.

- [ ] **Step 3: Verificar**

`npx tsc --noEmit` limpio. Reload; `preview_snapshot` de `/reino`: h1 = "El Mundo de Exandria", intro de mundo, secciones (panteón/calendario/estaciones/lunas/planos) intactas. Las regiones de Tal'Dorei (`ReinoRegions`) siguen abajo. `preview_screenshot`.

- [ ] **Step 4: Commit**

```bash
git add app/reino/page.tsx data/cosmology.ts
git commit -m "rebrand: /reino reencuadrado al mundo de Exandria

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Tarea 3: Prompts de IA y docs

**Files:**
- Modify: `data/loreText.ts` (leer primero)
- Modify: `app/api/ia/route.ts` (leer primero)
- Modify: `README.md`, `HANDOFF.md`, `GUIA-ARRANQUE.md`

- [ ] **Step 1: Prompt del narrador**

En `data/loreText.ts` y `app/api/ia/route.ts`, ajustar el/los string(s) de sistema para que el narrador entienda que el **mundo es Exandria** y la **campaña transcurre en Tal'Dorei**. No cambiar la estructura de secciones ni la lógica de selección de lore. `git grep -n "Tal.Dorei" -- data/loreText.ts app/api/ia/route.ts`.

- [ ] **Step 2: Docs**

- `README.md`: título `# Exandria — Compañero de Campaña`; primer párrafo → mundo de Exandria, campaña en Tal'Dorei. Añadir sección "Imágenes de personaje" (ver Fase 2, Tarea 6, Step 4 — mantener coherente).
- `HANDOFF.md`: actualizar título y marcar el milestone en curso (se cerrará en Fase 7).
- `GUIA-ARRANQUE.md`: título → Exandria (el flujo técnico no cambia).

- [ ] **Step 3: Verificar**

`npx tsc --noEmit` limpio. (Los prompts no se pueden probar sin IA; revisar por lectura.)

- [ ] **Step 4: Commit**

```bash
git add data/loreText.ts app/api/ia/route.ts README.md HANDOFF.md GUIA-ARRANQUE.md
git commit -m "rebrand: prompts de IA y documentación a Exandria

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

# FASE 2 — PortraitFrame + convención de imágenes

## Tarea 4: Componente `PortraitFrame`

**Files:**
- Create: `components/PortraitFrame.tsx`
- Modify: `app/globals.css` (añadir clases del marco)

- [ ] **Step 1: Crear el componente**

Crear `components/PortraitFrame.tsx`:

```tsx
"use client";

import { useState } from "react";

type Props = {
  src?: string;
  alt: string;
  size?: "sm" | "lg";
  /** icono Font Awesome de fallback, p. ej. "fa-dragon" */
  icon?: string;
};

/**
 * Marco de retrato. Si `src` existe y carga, muestra la imagen enmarcada.
 * Si no hay `src` o falla la carga, muestra un placeholder estilizado
 * (marco de bronce + icono/inicial). Pensado para que el usuario suelte
 * los .jpg más tarde sin romper el layout (igual que los mapas de pueblo).
 */
export default function PortraitFrame({ src, alt, size = "sm", icon }: Props) {
  const [failed, setFailed] = useState(false);
  const showImg = src && !failed;
  return (
    <div className={`portrait-frame portrait-${size}`} title={alt}>
      {showImg ? (
        <img src={src} alt={alt} onError={() => setFailed(true)} loading="lazy" />
      ) : (
        <span className="portrait-ph" aria-label={alt}>
          <i className={`fas ${icon ?? "fa-image"}`} />
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: CSS del marco**

Añadir al final de `app/globals.css`:

```css
/* Marco de retrato (creador de personaje) */
.portrait-frame {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--color-bronze) 55%, var(--color-line));
  background: color-mix(in srgb, var(--color-bronze-deep) 20%, var(--color-night));
  display: flex; align-items: center; justify-content: center;
  flex: none;
}
.portrait-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
.portrait-sm { width: 44px; height: 44px; }
.portrait-lg { width: 100%; aspect-ratio: 4 / 3; }
.portrait-ph { color: color-mix(in srgb, var(--color-bronze) 60%, transparent); font-size: 18px; }
.portrait-lg .portrait-ph { font-size: 34px; }
```

- [ ] **Step 3: Verificar tipos y build**

`npx tsc --noEmit` limpio. `npm run build` limpio.

- [ ] **Step 4: Commit**

```bash
git add components/PortraitFrame.tsx app/globals.css
git commit -m "feat: componente PortraitFrame con placeholder para retratos

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Tarea 5: Convención de carpetas de imagen

**Files:**
- Create: `public/species/.gitkeep`, `public/species/lineages/.gitkeep`, `public/classes/.gitkeep`
- Modify: `README.md`

- [ ] **Step 1: Crear carpetas y documentar**

Crear los tres `.gitkeep`. En `README.md`, sección nueva "Imágenes de personaje":

```md
## Imágenes de personaje

Los retratos son opcionales; sin ellos se ve un marco con icono. Para añadirlos,
suelta los .jpg (o .png/.webp) en:

- `public/species/<slug>.jpg` — retrato de especie (slug = campo `slug` en `data/species.ts`).
- `public/species/lineages/<slug-linaje>.jpg` — retrato de linaje.
- `public/classes/<slug>.jpg` — retrato de clase (slug en `data/classes.ts`).
```

- [ ] **Step 2: Commit**

```bash
git add public/species public/classes README.md
git commit -m "chore: convención de carpetas de imágenes de personaje

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

# FASE 3 — Modelo de datos + roster de especies

## Tarea 6: Extender el type `Species` y `REGIONS`

**Files:**
- Modify: `data/species.ts:4-15` (type) y cabecera

- [ ] **Step 1: Nuevo type y regiones**

Sustituir el bloque `export type Species = {...}` por:

```ts
export type RegionKey =
  | "universal" | "taldorei" | "wildemount"
  | "marquet" | "issylra" | "underdark" | "oceans";

export type Lineage = { name: string; perk: string; image?: string; homebrew?: boolean };

export type Species = {
  slug: string;
  name: string;
  region: RegionKey;
  origin: string;
  size: string;
  speed: number;
  traits: string[];
  lineages?: Lineage[];
  tagline: string;
  blurb: string;
  image?: string;   // /species/<slug>.jpg
  homebrew?: boolean;
};

export const REGIONS: { key: RegionKey; label: string; blurb: string }[] = [
  { key: "universal", label: "Universales", blurb: "Sus pueblos se extienden por toda Exandria." },
  { key: "taldorei", label: "Tal'Dorei", blurb: "El continente clásico y salvaje del oeste." },
  { key: "wildemount", label: "Wildemount", blurb: "El continente dividido entre el Imperio y la Dinastía Kryn." },
  { key: "marquet", label: "Marquet", blurb: "Contrastes y arena; ciudades verticales y oasis." },
  { key: "issylra", label: "Issylra y las Ashari", blurb: "El continente sagrado y las fronteras elementales." },
  { key: "underdark", label: "Infraoscuridad y fronteras planares", blurb: "Culturas de las profundidades y de otros planos." },
  { key: "oceans", label: "Los océanos", blurb: "Lucidian, Ozmit y Los Dientes Destrozados." },
];

export function regionSpecies(key: RegionKey) {
  return SPECIES.filter((s) => s.region === key);
}
```

- [ ] **Step 2: Actualizar las 10 especies existentes**

A cada objeto existente en `SPECIES` añadir `region` y `origin` según la tabla del spec §3 (Elfo/Enano/Centauro… → `taldorei`; Humano/Mediano/Tiefling → `universal`; Dracónido/Orco/Gnomo → `wildemount`; Aasimar/Goliat → `issylra`). Reemplazar menciones de "Tal'Dorei" en los `blurb` que impliquen que la especie es exclusiva del continente (p. ej. Humano `blurb` → hablar de Exandria). Ejemplo Humano:

```ts
{
  slug: "humano",
  name: "Humano",
  region: "universal",
  origin: "La raza más numerosa: fundaron la República de Tal'Dorei, el Imperio Dwendaliano de Wildemount y Othanzia en Issylra.",
  size: "Mediano",
  speed: 9,
  tagline: "Ambición y adaptabilidad.",
  blurb: "Versátiles y resueltos, los humanos pueblan cada rincón de Exandria. Su vida corta los empuja a dejar huella pronto, para bien o para mal.",
  traits: ["Hábil: competencia en una pericia a elección", "Versátil: una dote de origen", "Ingenioso: Inspiración Heroica tras descanso largo"],
  lineages: [
    { name: "Humano Estándar", perk: "+1 a todas las características (variante clásica)." },
    { name: "Humano Variante", perk: "+1 a dos características, una pericia y una dote (variante clásica)." },
  ],
},
```

- [ ] **Step 3: Verificar tipos**

`npx tsc --noEmit`. Esperado: errores en los objetos a los que aún falte `region`/`origin`. Corregir hasta que compile.

- [ ] **Step 4: Commit**

```bash
git add data/species.ts
git commit -m "feat: type Species con region/origin/image y REGIONS

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Tarea 7: Añadir el roster nuevo (por región)

**Files:**
- Modify: `data/species.ts` (array `SPECIES`)

Añadir las especies que faltan siguiendo el **patrón exacto** del ejemplo Humano y la tabla del spec §3 (tamaño, velocidad, linajes, rasgos mecánicos). Un commit por región para trocear. Marcar `homebrew: true` donde el spec lo indique (Sangre Bestial y sus linajes) y añadir el badge textual en `origin`/`perk` no es necesario (la UI lo pone).

- [ ] **Step 1: Tal'Dorei** — añadir Centauro, Hombre Lagarto, Hada, Sátiro, Hobgoblin. Ejemplo Centauro:

```ts
{
  slug: "centauro",
  name: "Centauro",
  region: "taldorei",
  origin: "Nómadas de las Llanuras Divisorias; astrólogos y guardianes de las fronteras naturales.",
  size: "Mediano",
  speed: 12,
  tagline: "Casco, arco y cielo estrellado.",
  blurb: "Mitad persona, mitad caballo. Pueblos orgullosos que miden el horizonte y protegen sus tierras de los monstruos.",
  traits: ["Carga: embestir para daño extra", "Cascos: ataque natural sin armas", "Complexión Equina: cuentas como mayor para carga", "Superviviente: competencia en una pericia de naturaleza"],
},
```

Verificar `tsc`; commit `feat: roster Tal'Dorei (centauro, lagarto, hada, sátiro, hobgoblin)`.

- [ ] **Step 2: Wildemount** — Goblin, Osgo, Minotauro, Firbolg, Kenku (Dracónido/Orco/Gnomo ya existen; solo reasignar `region`/`origin` en Tarea 6). `tsc`; commit.

- [ ] **Step 3: Marquet** — Aarakocra, Replicante, Liebrén, Tabaxi, Yuan-ti. `tsc`; commit.

- [ ] **Step 4: Issylra/Ashari** — Genasí (con 4 linajes elementales). Aasimar/Goliat ya existen (reasignar región). `tsc`; commit.

- [ ] **Step 5: Underdark/Planar** — Duergar, Svirfneblin, Kobold, Eladrin (4 estaciones), Shadar-kai, Gith (2 linajes), y **Sangre Bestial** con `homebrew: true` y 6 linajes también `homebrew: true`. Ejemplo Sangre Bestial:

```ts
{
  slug: "sangre-bestial",
  name: "Sangre Bestial",
  region: "underdark",
  homebrew: true,
  origin: "Portadores de un instinto bestial reprimido; muchos surgen de la Orden de los Cazadores de Sangre o de los bosques oscuros.",
  size: "Mediano",
  speed: 9,
  tagline: "La bestia que aúlla dentro.",
  blurb: "Linaje tocado por la licantropía, arma y maldición a la vez. Su bestia interior define sus dones. Contenido no oficial: a criterio del DM.",
  traits: ["Instinto Bestial: sentidos y reflejos afilados", "Forma Parcial: rasgos de tu bestia bajo tensión"],
  lineages: [
    { name: "Hombre Oso", perk: "Fuerte, estoico y territorial.", homebrew: true },
    { name: "Hombre Jabalí", perk: "Temerario, tenaz, imposible de derribar.", homebrew: true },
    { name: "Hombre Rata", perk: "Superviviente urbano, escurridizo y letal.", homebrew: true },
    { name: "Hombre Tigre", perk: "Ágil cazador solitario de la selva.", homebrew: true },
    { name: "Hombre Lobo (lunar)", perk: "Salvaje, ligado a Catha y Ruidus.", homebrew: true },
    { name: "Hombre Lobo (canino)", perk: "Gregario, astuto y leal a su manada.", homebrew: true },
  ],
},
```

`tsc`; commit `feat: roster Infraoscuridad y planar (+ Sangre Bestial homebrew)`.

- [ ] **Step 6: Océanos** — Elfo Marino, Tritón, Tortoga. `tsc`; commit.

- [ ] **Step 7: Verificación global del roster**

`npx tsc --noEmit` limpio. Comprobar en Node que no hay slugs duplicados:

Run: `node -e "const {SPECIES}=require('esbuild-register')||{};" ` — si no hay esbuild, usar una comprobación simple: `git grep -n "slug:" data/species.ts | wc -l` y revisar a ojo que cada slug es único y en kebab-case. `npm run build` limpio.

---

# FASE 4 — Clases: enriquecer + Cazador de Sangre

## Tarea 8: `image` en clases + Cazador de Sangre

**Files:**
- Modify: `data/classes.ts:6-21` (type) y array `CLASSES`

- [ ] **Step 1: Añadir `image?` al type**

En `data/classes.ts`, añadir a `CharClass` la propiedad `image?: string;` (tras `blurb`).

- [ ] **Step 2: Añadir Cazador de Sangre**

Añadir al final del array `CLASSES` (antes del `];`):

```ts
{
  slug: "cazador-de-sangre", name: "Cazador de Sangre", group: "marcial", hitDie: 10,
  primary: ["fue", "des"], saves: ["fue", "int"], skillCount: 3,
  skillList: ["Acrobacias", "Arcanos", "Atletismo", "Historia", "Investigación", "Intimidación", "Perspicacia", "Religión", "Supervivencia"],
  subclassLabel: "Orden sanguínea",
  subclasses: [
    { name: "Orden del Cuervo Sanguíneo", blurb: "Marca a la presa con un vínculo de sangre que castiga y persigue." },
    { name: "Orden del Sabueso Profano", blurb: "Rastreador implacable; ataca la mente y el miedo del enemigo." },
    { name: "Orden del Jinete Carmesí", blurb: "Alquimia de sangre y mutágenos que potencian el cuerpo." },
    { name: "Orden del Alma Lupina", blurb: "Abraza a la bestia interior con una hibridación controlada." },
  ],
  tagline: "Magia de sangre para cazar lo que la teme.",
  blurb: "Guerreros que sacrifican su propia vitalidad por ritos de sangre (hemocratía) para dar caza a lo sobrenatural. Clase de Matt Mercer, propia de Exandria.",
},
```

Nota: verificar los nombres de pericia contra `data/rules.ts` `SKILLS` (deben coincidir exacto); ajustar `skillList` si algún nombre difiere.

- [ ] **Step 3: Enriquecer las 12 clases**

Pasada de texto: mejorar `blurb`/`subclasses[].blurb` donde sean escuetos, sin cambiar `hitDie`/`primary`/`saves`/`skillCount`/número de subclases. Cambio opcional de calidad; no inventar mecánica.

- [ ] **Step 4: Verificar**

`npx tsc --noEmit` limpio. `npm run lint` limpio.

- [ ] **Step 5: Commit**

```bash
git add data/classes.ts
git commit -m "feat: Cazador de Sangre + image en clases; pulido de blurbs

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

# FASE 5 — Carcasa del tomo `CharacterBook`

## Tarea 9: CSS del tomo (libro, lomo, páginas, giro 3D)

**Files:**
- Modify: `app/globals.css` (añadir bloque del tomo)

- [ ] **Step 1: Tokens y clases del tomo**

Añadir al final de `app/globals.css`. Páginas en pergamino claro sobre el fondo oscuro de la app:

```css
/* ===== Tomo del creador de personaje ===== */
:root {
  --paper: #ece0c2;
  --paper-edge: #d8c69c;
  --paper-ink: #4a3a1e;
  --paper-ink-soft: #6f5a34;
  --paper-line: rgba(120, 90, 40, 0.30);
}
.tome {
  position: relative;
  display: flex;
  perspective: 2200px;
  border-radius: 8px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
}
.tome-page {
  flex: 1 1 0;
  min-width: 0;
  background: linear-gradient(135deg, var(--paper), var(--paper-edge));
  color: var(--paper-ink);
  padding: clamp(14px, 2.2vw, 28px);
  box-shadow: inset 0 0 40px rgba(120, 80, 30, 0.22);
  min-height: 60vh;
}
.tome-page.left { border-radius: 6px 0 0 6px; }
.tome-page.right { border-radius: 0 6px 6px 0; transform-origin: left center; }
.tome-spine {
  width: 14px; flex: none;
  background: linear-gradient(90deg, rgba(70,45,18,.6), rgba(120,80,35,.06), rgba(70,45,18,.6));
}
/* Giro 3D: la página derecha rota sobre el lomo al pasar de capítulo */
.tome-page.right.turning { animation: page-turn 0.5s ease-in-out; }
@keyframes page-turn {
  0%   { transform: rotateY(0deg); }
  50%  { transform: rotateY(-105deg); filter: brightness(0.85); }
  100% { transform: rotateY(0deg); }
}
/* Pestañas de capítulo al canto */
.tome-tabs { position: absolute; right: -12px; top: 22px; display: flex; flex-direction: column; gap: 6px; z-index: 5; }
.tome-tab {
  background: color-mix(in srgb, var(--color-bronze-deep) 60%, var(--color-night));
  color: var(--color-bronze-bright);
  font: 700 12px/1 var(--font-ui, inherit);
  padding: 7px 10px; border: 1px solid var(--color-bronze-deep);
  border-radius: 0 7px 7px 0; cursor: pointer; white-space: nowrap;
  box-shadow: 2px 2px 5px rgba(0,0,0,.4);
}
.tome-tab[data-active="true"] { background: var(--color-bronze); color: var(--color-ink); transform: translateX(-4px); }
.tome-tab[data-locked="true"] { opacity: 0.45; cursor: not-allowed; }
@media (max-width: 860px) {
  .tome { perspective: none; }
  .tome-spine { display: none; }
  .tome-page.left.mobile-hidden, .tome-page.right.mobile-hidden { display: none; }
  .tome-tabs { position: static; flex-direction: row; flex-wrap: wrap; margin-bottom: 10px; }
  .tome-tab { border-radius: 7px; }
}
@media (prefers-reduced-motion: reduce) {
  .tome-page.right.turning { animation: none; }
}
```

- [ ] **Step 2: Verificar build**

`npm run build` limpio (CSS válido para Tailwind v4).

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: estilos del tomo (páginas de pergamino, lomo, giro 3D, pestañas)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Tarea 10: Componente `CharacterBook`

**Files:**
- Create: `components/CharacterBook.tsx`

- [ ] **Step 1: Crear la carcasa**

Carcasa presentacional: recibe capítulos y qué contenido va en cada página; gestiona pestañas, giro 3D y responsive. No conoce la lógica de personaje.

```tsx
"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

export type Chapter = {
  key: string;
  label: string;
  /** contenido de la página izquierda (índice/opciones o panel único) */
  left: ReactNode;
  /** contenido de la página derecha (detalle); si falta, izquierda ocupa todo */
  right?: ReactNode;
};

type Props = {
  chapters: Chapter[];
  activeKey: string;
  /** capítulos alcanzables; el resto salen bloqueados */
  unlockedKeys: string[];
  onSelect: (key: string) => void;
  /** en móvil, si true muestra la página derecha (detalle) en vez de la izquierda */
  mobileShowRight?: boolean;
};

export default function CharacterBook({ chapters, activeKey, unlockedKeys, onSelect, mobileShowRight }: Props) {
  const [turning, setTurning] = useState(false);
  const prev = useRef(activeKey);

  useEffect(() => {
    if (prev.current !== activeKey) {
      prev.current = activeKey;
      setTurning(true);
      const t = setTimeout(() => setTurning(false), 520);
      return () => clearTimeout(t);
    }
  }, [activeKey]);

  const ch = chapters.find((c) => c.key === activeKey) ?? chapters[0];
  const hasRight = !!ch.right;

  return (
    <div className="tome">
      <div className="tome-tabs" role="tablist" aria-label="Capítulos">
        {chapters.map((c) => {
          const locked = !unlockedKeys.includes(c.key);
          return (
            <button
              key={c.key}
              role="tab"
              className="tome-tab"
              data-active={c.key === activeKey}
              data-locked={locked}
              disabled={locked}
              aria-selected={c.key === activeKey}
              onClick={() => !locked && onSelect(c.key)}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className={`tome-page left ${mobileShowRight && hasRight ? "mobile-hidden" : ""}`}>
        {ch.left}
      </div>
      {hasRight && <div className="tome-spine" />}
      {hasRight && (
        <div className={`tome-page right ${turning ? "turning" : ""} ${mobileShowRight ? "" : "mobile-hidden"}`}>
          {ch.right}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar**

`npx tsc --noEmit` limpio. `npm run build` limpio.

- [ ] **Step 3: Commit**

```bash
git add components/CharacterBook.tsx
git commit -m "feat: carcasa CharacterBook (pestañas, giro 3D, responsive)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

# FASE 6 — Migrar `/crear` al tomo

## Tarea 11: Refactor de `/crear` a capítulos

**Files:**
- Modify: `app/crear/page.tsx` (envolver en `CharacterBook`, mapear pasos→capítulos)

Conservar TODO el estado y validación existentes (`Build`, `stepDone`, `maxStep`, `missing`, guardado local/Supabase). Solo cambia la presentación: en vez de `STEPS` + barra de progreso + grid + hoja lateral, se pinta un `CharacterBook`.

- [ ] **Step 1: Mapear pasos a capítulos**

Definir el orden de capítulos y el mapeo con los pasos actuales:

```tsx
const CHAPTERS = [
  { key: "razas", label: "Razas", step: 0 },
  { key: "clases", label: "Clases", step: 1 },
  { key: "trasfondos", label: "Trasfondos", step: 2 },
  { key: "aptitudes", label: "Aptitudes", step: 3 },
  { key: "pericias", label: "Pericias", step: 4 },
  { key: "ficha", label: "Ficha", step: 5 },
] as const;
```

`activeKey` = capítulo cuyo `step === b.step`. `unlockedKeys` = capítulos con `step <= maxStep`. `onSelect(key)` → `go(step)` (reutiliza el `go` existente que respeta `maxStep`).

- [ ] **Step 2: Capítulos de selección (Razas/Clases/Trasfondos)**

`left` = índice de opciones; `right` = detalle de la selección. Para **Razas**, la página izquierda recorre `REGIONS` y por cada una `regionSpecies(key)`:

```tsx
function RazasIndex({ b, set }: { b: Build; set: (p: Partial<Build>) => void }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-3" style={{ color: "var(--paper-ink)" }}>✦ Razas de Exandria</h2>
      {REGIONS.map((r) => {
        const list = regionSpecies(r.key);
        if (!list.length) return null;
        return (
          <div key={r.key} className="mb-3">
            <p className="tome-region">{r.label}</p>
            {list.map((s) => (
              <button key={s.slug} className="tome-opt" data-sel={b.species === s.slug}
                onClick={() => set({ species: s.slug, lineage: null })}>
                <PortraitFrame src={`/species/${s.slug}.jpg`} alt={s.name} size="sm" icon="fa-dragon" />
                <span className="tome-opt-txt">
                  <span className="tome-opt-name">{s.name}{s.homebrew && <span className="tome-dm">DM</span>}</span>
                  <span className="tome-opt-tag">{s.tagline}</span>
                </span>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
```

Añadir a `app/globals.css` las clases de índice del tomo:

```css
.tome-region { font: 700 10px/1.4 var(--font-ui, inherit); letter-spacing: 1px; text-transform: uppercase; color: var(--paper-ink-soft); margin: 10px 0 4px; }
.tome-opt { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 6px 8px; border-radius: 7px; background: transparent; border: 1px solid transparent; cursor: pointer; }
.tome-opt:hover { background: rgba(120,80,35,.10); }
.tome-opt[data-sel="true"] { background: rgba(185,138,62,.28); border-color: rgba(120,80,35,.5); }
.tome-opt-txt { display: flex; flex-direction: column; min-width: 0; }
.tome-opt-name { font: 600 14px/1.2 var(--font-display, inherit); color: var(--paper-ink); }
.tome-opt-tag { font-size: 11.5px; color: var(--paper-ink-soft); }
.tome-dm { font-size: 8px; font-weight: 800; margin-left: 6px; padding: 1px 5px; border: 1px solid var(--paper-ink-soft); border-radius: 8px; vertical-align: middle; }
.tome-detail-name { font: 800 20px/1.1 var(--font-display, inherit); color: var(--paper-ink); margin: 10px 0 4px; }
```

- [ ] **Step 3: Detalle de Raza (página derecha)**

```tsx
function RazaDetalle({ b, set }: { b: Build; set: (p: Partial<Build>) => void }) {
  const s = b.species ? getSpecies(b.species) : undefined;
  if (!s) return <p className="tome-opt-tag">Elige una raza en la página izquierda.</p>;
  return (
    <div>
      <PortraitFrame src={`/species/${s.slug}.jpg`} alt={s.name} size="lg" icon="fa-dragon" />
      <p className="tome-detail-name">{s.name}</p>
      <p className="tome-region">{REGIONS.find((r) => r.key === s.region)?.label}{s.homebrew ? " · a criterio del DM" : ""}</p>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--paper-ink)" }}>{s.blurb}</p>
      <p style={{ fontSize: 13, fontStyle: "italic", color: "var(--paper-ink-soft)", margin: "8px 0" }}>{s.origin}</p>
      <p className="tome-region">Rasgos</p>
      <ul>{s.traits.map((t) => <li key={t} style={{ fontSize: 13, color: "var(--paper-ink)", margin: "3px 0" }}>◆ {t}</li>)}</ul>
      {s.lineages && (
        <>
          <p className="tome-region">Linaje <span style={{ color: "var(--color-ember)" }}>*</span></p>
          {s.lineages.map((l) => (
            <button key={l.name} className="tome-opt" data-sel={b.lineage === l.name} onClick={() => set({ lineage: l.name })}>
              <PortraitFrame src={`/species/lineages/${slugify(l.name)}.jpg`} alt={l.name} size="sm" icon="fa-star" />
              <span className="tome-opt-txt">
                <span className="tome-opt-name">{l.name}{l.homebrew && <span className="tome-dm">DM</span>}</span>
                <span className="tome-opt-tag">{l.perk}</span>
              </span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}
```

Añadir helper `slugify` en `app/crear/page.tsx` (o en `data/rules.ts` si se prefiere compartir):

```tsx
function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
```

Replicar el mismo patrón índice+detalle para **Clases** (usa `CLASSES`, `getClass`, `GROUP_LABEL`, `subclasses`, imagen `/classes/${slug}.jpg`) y **Trasfondos** (usa `BACKGROUNDS`; sin imagen, `right` puede mostrar los facts actuales).

- [ ] **Step 4: Capítulos sin selección (Aptitudes/Pericias/Ficha)**

Reusar los componentes actuales `StepAbilities`, `StepSkills` y una fusión de `StepSummary`+`LiveSheet` como capítulo **Ficha**. Para estos, el `Chapter.left` contiene el componente y se deja `right` sin definir (la página izquierda ocupa el ancho; en el tomo, cuando no hay `right`, no se pinta lomo ni página derecha). Mantener botones Copiar hoja / Reiniciar en "Ficha".

- [ ] **Step 5: Ensamblar `CharacterBook` en el render**

Sustituir el bloque de render (barra `STEPS` + `grid lg:grid-cols` + aside `LiveSheet`) por:

```tsx
const activeKey = CHAPTERS.find((c) => c.step === b.step)?.key ?? "razas";
const unlockedKeys = CHAPTERS.filter((c) => c.step <= maxStep).map((c) => c.key);
const chapters = [
  { key: "razas", label: "Razas", left: <RazasIndex b={b} set={set} />, right: <RazaDetalle b={b} set={set} /> },
  { key: "clases", label: "Clases", left: <ClasesIndex b={b} set={set} />, right: <ClaseDetalle b={b} set={set} /> },
  { key: "trasfondos", label: "Trasfondos", left: <TrasfondosIndex b={b} set={set} />, right: <TrasfondoDetalle b={b} set={set} /> },
  { key: "aptitudes", label: "Aptitudes", left: <StepAbilities b={b} set={set} pointsSpent={pointsSpent} finalScores={finalScores} /> },
  { key: "pericias", label: "Pericias", left: <StepSkills b={b} set={set} cls={cls} bgSkills={bgSkills} classPool={classPool} /> },
  { key: "ficha", label: "Ficha", left: <FichaChapter b={b} set={set} finalScores={finalScores} hp={hp} allSkills={allSkills} onCopy={copySheet} onReset={reset} /> },
];
```

Añadir estado `const [mobileShowRight, setMobileShowRight] = useState(false)` para el marcapáginas móvil (un botón "Ver detalle / Ver lista" visible solo en `max-width:860px`). Conservar el aviso `missing` y los botones Atrás/Siguiente debajo del tomo (reutilizan `go`).

- [ ] **Step 6: Verificar (crítico)**

`npx tsc --noEmit` limpio. `npm run build` limpio. `preview_start`/reload; en `/crear`:
- `preview_snapshot`: pestañas Razas·Clases·Trasfondos·Aptitudes·Pericias·Ficha; capítulos posteriores bloqueados hasta completar.
- `preview_click` en una raza (izquierda) → `preview_snapshot` confirma detalle a la derecha con placeholder de imagen, rasgos y linajes.
- Seleccionar linaje, avanzar a Clases (comprobar giro), elegir clase+subclase, trasfondo, repartir aptitudes, pericias, y Ficha muestra la hoja + copiar.
- `preview_resize` preset `mobile`: cae a página única + marcapáginas.
- `preview_console_logs` level `error`: sin errores.
- `preview_screenshot` de escritorio y móvil.

- [ ] **Step 7: Commit**

```bash
git add app/crear/page.tsx app/globals.css
git commit -m "feat: /crear como tomo (capítulos, índice+detalle, imágenes, giro 3D)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

# FASE 7 — Verificación final y handoff

## Tarea 12: Verificación integral y docs

**Files:**
- Modify: `HANDOFF.md`

- [ ] **Step 1: Puertas finales**

`npx tsc --noEmit` limpio. `npm run lint` limpio. `npm run build` limpio.

- [ ] **Step 2: Repaso visual**

Preview de `/` (marca Exandria), `/reino` (mundo), `/crear` (tomo completo). `preview_console_logs` sin errores. Screenshots de cada una.

- [ ] **Step 3: Actualizar HANDOFF**

En `HANDOFF.md`: mover el milestone de "Siguiente pendiente pactado" a "RESUELTO"; describir el rebrand a Exandria, el roster de ~36 especies + Cazador de Sangre, y el tomo de `/crear`. Anotar como PENDIENTE: subir los .jpg reales de retratos a `public/species|classes`, y el backlog previo (dados/iniciativa).

- [ ] **Step 4: Commit + push**

```bash
git add HANDOFF.md
git commit -m "docs: HANDOFF actualizado tras rebrand Exandria + roster + tomo

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push -u origin exandria-rebrand-roster
```

(El push solo si el usuario lo pide; si no, dejar los commits en local.)

---

## Cobertura del spec (autorrevisión)

- §1 Rebrand texto → Tareas 1, 3. §2 `/reino` → Tarea 2. §3 datos+roster → Tareas 6, 7. §4 clases+Cazador de Sangre → Tarea 8. §5 tomo/PortraitFrame/CharacterBook/`/crear` → Tareas 4, 9, 10, 11. §6 convención imágenes → Tarea 5. §7 verificación → Tareas dispersas + Tarea 12. §8 fases → estructura de este plan.
- Consistencia de tipos: `Species.region: RegionKey`, `regionSpecies()`, `REGIONS`, `Lineage`, `CharClass.image?`, `Chapter`/`CharacterBook` props usadas igual en Tareas 6, 7, 8, 10, 11.
- Homebrew: `homebrew` en especie y linaje (Tarea 6 type, Tarea 7 datos, Tarea 11 badge UI).
</content>
