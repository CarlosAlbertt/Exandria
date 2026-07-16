# `/crear` — una escena por paso · Plan de implementación

> **Para trabajadores agénticos:** SUB-SKILL REQUERIDA: usa
> superpowers:subagent-driven-development (recomendado) o
> superpowers:executing-plans para implementar este plan tarea a tarea. Los pasos
> usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** Rediseñar `/crear` para que cada paso sea su propia escena a
pantalla completa, retirando el círculo de invocación a una barra de runas, y
arreglar el error al crear un segundo personaje.

**Arquitectura:** `app/crear/page.tsx` se queda con estado, validación, gate y
guardado, y delega el pintado a una escena por paso en `components/crear/steps/`.
`RuneBar` navega; `ArtPanel` pinta retrato o silueta. La lógica de estado
(`stepDone`, gate, `base` como fuente de verdad) **no se toca**.

**Stack:** Next 16 (App Router, Turbopack) · React 19 · Tailwind v4 · TypeScript.
Sin framework de tests: los gates son `npx tsc --noEmit`, `npm run build` y
`npx tsx scripts/check-*.ts`. La lógica pura se verifica con un `check-*.ts`; la
UI, por inspección del DOM en el navegador.

**Diseño:** `docs/superpowers/specs/2026-07-16-crear-escenas-por-paso-design.md`

**Convenciones del repo:**
- Commits en español, acaban en `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Autor git: `CarlosAlbertt <CarlosAlbertt@users.noreply.github.com>` (Vercel
  bloquea otros emails). Trabajo directo en `master`.
- **`npm run lint` está roto repo-wide de antes** (`react-hooks/set-state-in-effect`
  en ~7 archivos). No es de este trabajo; **no arreglarlo de paso**.

---

## Estructura de archivos

| Archivo | Responsabilidad | Tarea |
|---|---|---|
| `lib/statRolls.ts` | + `deriveAssign` (pura). | 1 |
| `scripts/check-statrolls.ts` | + 4 comprobaciones de `deriveAssign`. | 1 |
| `components/crear/RuneBar.tsx` | **Nuevo.** Las 6 runas: estado + gate + `onGo`. | 2 |
| `components/crear/ArtPanel.tsx` | **Nuevo.** Retrato vertical o silueta rúnica. | 2 |
| `components/crear/steps/SpeciesScene.tsx` | **Nuevo.** Escena 0: acordeón + arte + detalle + linaje. | 3 |
| `components/crear/steps/BackgroundScene.tsx` | **Nuevo.** Escena 2: lista + detalle. | 3 |
| `components/crear/steps/ClassScene.tsx` | **Nuevo.** Escena 1: flechas + arte + detalle + subclase + tira de 13. | 4 |
| `components/crear/OptionRail.tsx` | Se queda (especies + trasfondos). Pierde su uso en clases. | 3 |
| `app/crear/page.tsx` | Monta `RuneBar` + escenas. Pierde el círculo. | 5 |
| `components/crear/InvocationCircle.tsx` | **Se borra.** | 5 |
| `components/crear/Medallion.tsx` | **Se borra** (la silueta se muda a `ArtPanel`). | 5 |
| `components/crear/DetailPanel.tsx` | **Se borra** (su contenido vive en las escenas). | 5 |
| `components/crear/steps/AbilitiesStep.tsx` | Estilos a lo ancho (6) + tirada única (7). | 6, 7 |
| `app/globals.css` | Fuera `.crear-grid/.crear-left/.inv-*/.medallion*`; entran `.rune-bar/.rune/.art-*/.scene-*/.cls-*`. | 2, 5 |

---

### Task 1: `deriveAssign` — reconstruir la asignación desde `base`

Hoy `assign` no se guarda en ningún sitio. Al volver a `/crear` con una tirada
hecha, `assign` está vacío → `stepDone[3]` es `false` → el gate te bloquea en
Aptitudes y te obliga a reasignar los 6 valores aunque la ficha esté completa.
`base` ya guarda las puntuaciones finales, así que se puede reconstruir. Sin
migración.

**Archivos:**
- Modificar: `lib/statRolls.ts` (añadir al final)
- Test: `scripts/check-statrolls.ts:2` (import) y al final (comprobaciones)

- [ ] **Paso 1: Escribir las comprobaciones que fallan**

En `scripts/check-statrolls.ts`, cambia la línea 2 del import:

```ts
import { dropLowest, STANDARD_ARRAY, ASSIGN_EMPTY, isAssignComplete, deriveAssign } from "../lib/statRolls";
```

Y añade antes del `console.log` final (línea 32):

```ts
// deriveAssign: reconstruye la asignación comparando `base` con los 6 valores.
check("deriveAssign reparte normal",
  JSON.stringify(deriveAssign({ fue: 13, des: 14, con: 12, int: 10, sab: 15, car: 8 }, [15, 14, 13, 12, 10, 8]))
  === JSON.stringify({ fue: 2, des: 1, con: 3, int: 4, sab: 0, car: 5 }));

// Valores repetidos: dos 13 son DOS índices distintos, no el mismo.
check("deriveAssign con valores repetidos usa índices distintos", (() => {
  const a = deriveAssign({ fue: 13, des: 13, con: 12, int: 12, sab: 10, car: 8 }, [13, 13, 12, 12, 10, 8]);
  return isAssignComplete(a) && new Set(Object.values(a)).size === 6;
})());

check("deriveAssign sin tirada (point-buy) = vacío",
  JSON.stringify(deriveAssign({ fue: 13, des: 14, con: 12, int: 10, sab: 15, car: 8 }, []))
  === JSON.stringify(ASSIGN_EMPTY));

// Si no cuadra (ficha vieja, valores editados a mano) NO inventa: devuelve vacío
// y el jugador reasigna como hoy.
check("deriveAssign que no cuadra = vacío",
  JSON.stringify(deriveAssign({ fue: 18, des: 14, con: 12, int: 10, sab: 15, car: 8 }, [15, 14, 13, 12, 10, 8]))
  === JSON.stringify(ASSIGN_EMPTY));
```

- [ ] **Paso 2: Ejecutar para verificar que falla**

Ejecuta: `npx tsx scripts/check-statrolls.ts`
Esperado: FALLA al compilar — `"deriveAssign" is not exported by "lib/statRolls.ts"`.

- [ ] **Paso 3: Implementar**

Añade al final de `lib/statRolls.ts`:

```ts
// Reconstruye qué índice de `scores` fue a cada aptitud. `base` ya es la
// puntuación SIN el bonus de trasfondo (ese vive aparte en `bonus`), así que
// empareja por valor directo, consumiendo cada índice una sola vez: los valores
// se repiten y dos 13 son dos índices distintos.
//
// Existe porque `assign` no se persiste: `base` es la fuente de verdad y de ella
// se deriva. Si no cuadra (ficha vieja, valores editados a mano, o `scores`
// vacío en point-buy) devuelve ASSIGN_EMPTY: nunca inventa una asignación.
export function deriveAssign(base: Record<AbilityKey, number>, scores: number[]): Assign {
  if (!scores.length) return { ...ASSIGN_EMPTY };
  const out: Assign = { ...ASSIGN_EMPTY };
  const used = new Set<number>();
  for (const k of Object.keys(ASSIGN_EMPTY) as AbilityKey[]) {
    const idx = scores.findIndex((v, i) => !used.has(i) && v === base[k]);
    if (idx === -1) return { ...ASSIGN_EMPTY };
    used.add(idx);
    out[k] = idx;
  }
  return out;
}
```

- [ ] **Paso 4: Ejecutar para verificar que pasa**

Ejecuta: `npx tsx scripts/check-statrolls.ts`
Esperado: `Todas las comprobaciones pasaron.` y salida 0. Deben verse las 4
líneas `OK   deriveAssign …`.

- [ ] **Paso 5: Commit**

```bash
git add lib/statRolls.ts scripts/check-statrolls.ts
git commit -m "feat(crear): deriva la asignación de aptitudes desde base

assign no se persiste, así que al volver a /crear con una tirada hecha
el gate obligaba a reasignar los 6 valores. base ya guarda las
puntuaciones: se reconstruye de ahí, sin migración. Si no cuadra
devuelve vacío en vez de inventar.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `RuneBar` y `ArtPanel` + su CSS

Las dos primitivas de la escena. Todavía sin consumidor: `tsc` y `build` pasan
igual.

**Archivos:**
- Crear: `components/crear/RuneBar.tsx`
- Crear: `components/crear/ArtPanel.tsx`
- Modificar: `app/globals.css` (añadir al final)

- [ ] **Paso 1: Crear `components/crear/RuneBar.tsx`**

```tsx
"use client";

// Barra de runas: las 6 runas SON los pasos y la navegación. Sustituye al
// círculo de invocación (retirado el 2026-07-16: repartía mal el espacio).
// Encendida = paso completo · resaltada = actual · apagada y deshabilitada =
// aún no alcanzable. `maxStep` es el último paso alcanzable (gate de page.tsx).
const GLYPHS = ["✦", "⚔", "◈", "⬢", "✧", "❖"];

export default function RuneBar({
  steps,
  current,
  maxStep,
  onGo,
}: {
  steps: readonly string[];
  current: number;
  maxStep: number;
  onGo: (step: number) => void;
}) {
  return (
    <nav className="rune-bar" aria-label="Pasos del creador">
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "now" : "";
        return (
          <button
            key={label}
            type="button"
            className={`rune ${state}`}
            disabled={i > maxStep}
            onClick={() => onGo(i)}
            title={label}
            aria-current={i === current ? "step" : undefined}
          >
            <span className="rune-glyph" aria-hidden="true">{GLYPHS[i] ?? "•"}</span>
            <span className="rune-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
```

- [ ] **Paso 2: Crear `components/crear/ArtPanel.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";

// Panel de arte vertical (el arte de clase es 659×1025). Si hay imagen, el
// retrato; si no, la SILUETA RÚNICA — nunca un hueco vacío. Hereda la silueta
// del antiguo Medallion, pero sin recortar en círculo.
//
// Hoy: public/classes tiene 11 de 13 (faltan bardo y paladin) y public/species
// está vacío. El panel se reserva igualmente: en cuanto se suelte el .jpg
// aparece solo, sin tocar código.
export default function ArtPanel({
  src,
  alt,
  tint,
}: {
  src?: string | null;
  alt?: string | null;
  tint?: string | null;
}) {
  const [failed, setFailed] = useState(false);

  // Al cambiar de clase/especie cambia `src`. Sin este reset, un fallo de carga
  // anterior dejaría `failed` en true para siempre y una imagen nueva y válida
  // mostraría la silueta en lugar del arte real.
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImg = !!src && !failed;

  return (
    <div className="art-panel">
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src as string} alt={alt ?? ""} onError={() => setFailed(true)} />
      ) : (
        <div
          className="art-silo"
          style={tint ? ({ ["--tint" as string]: tint } as React.CSSProperties) : undefined}
        />
      )}
    </div>
  );
}
```

- [ ] **Paso 3: Añadir el CSS al final de `app/globals.css`**

```css
/* ============ Creador — escenas por paso (2026-07-16) ============ */

/* Barra de runas: navegación y progreso. Sustituye al círculo. */
.rune-bar { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin: 0 0 22px; }
.rune {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  min-width: 78px; padding: 8px 10px;
  border-radius: 10px;
  background: var(--color-raised);
  color: var(--color-dim);
  border: 1px solid var(--color-line);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}
.rune-glyph { font-size: 18px; font-weight: 800; line-height: 1; }
.rune-label { font-family: var(--font-ui); font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
.rune:hover:not(:disabled) { border-color: var(--color-bronze); }
.rune:disabled { cursor: not-allowed; opacity: 0.45; }
.rune.done {
  background: var(--color-bronze); color: var(--color-night);
  border-color: var(--color-bronze-bright);
  box-shadow: 0 0 12px rgba(201, 163, 92, 0.7);
}
.rune.now {
  color: var(--color-bronze-bright);
  border-color: var(--color-bronze-bright);
  box-shadow: 0 0 14px rgba(201, 163, 92, 0.5);
}

/* Panel de arte: retrato vertical (659×1025) o silueta. */
.art-panel {
  width: 260px; flex: none;
  aspect-ratio: 659 / 1025;
  border-radius: 12px; overflow: hidden;
  border: 2px solid color-mix(in srgb, var(--color-bronze) 60%, transparent);
  box-shadow: 0 0 26px rgba(200, 162, 74, 0.25), inset 0 0 22px rgba(0, 0, 0, 0.6);
  background: radial-gradient(circle at 50% 32%, var(--color-raised), var(--color-night) 72%);
  display: grid; place-items: center;
}
.art-panel img { width: 100%; height: 100%; object-fit: cover; }
.art-silo {
  width: 30%; height: 52%;
  border-radius: 40% 40% 12% 12%;
  background: linear-gradient(180deg, var(--color-warm), var(--tint, var(--color-arcane)));
  box-shadow: 0 0 22px rgba(233, 220, 195, 0.4);
  opacity: 0.6;
  position: relative;
}
.art-silo::before {
  content: "";
  position: absolute;
  left: 50%; top: -19%;
  width: 52%; aspect-ratio: 1;
  margin-left: -26%;
  border-radius: 50%;
  background: var(--color-warm);
  box-shadow: 0 0 14px rgba(233, 220, 195, 0.55);
}
@media (max-width: 900px) { .art-panel { width: 200px; } }
```

- [ ] **Paso 4: Verificar que compila**

Ejecuta: `npx tsc --noEmit`
Esperado: sin salida (éxito). Los dos componentes aún no tienen consumidor; es
lo esperado y no es error.

- [ ] **Paso 5: Commit**

```bash
git add components/crear/RuneBar.tsx components/crear/ArtPanel.tsx app/globals.css
git commit -m "feat(crear): barra de runas y panel de arte

Las dos primitivas de las escenas nuevas. RuneBar sustituye la
navegación del círculo con el mismo gate; ArtPanel muestra el retrato
vertical (659x1025) o la silueta, sin recortar en círculo.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Escenas de Especie y Trasfondo

**Archivos:**
- Crear: `components/crear/steps/SpeciesScene.tsx`
- Crear: `components/crear/steps/BackgroundScene.tsx`
- Modificar: `app/globals.css` (medidas del carril + rejilla de escena)

- [ ] **Paso 1: Crear `components/crear/steps/SpeciesScene.tsx`**

```tsx
"use client";

import type { Species } from "@/data/species";
import { REGIONS } from "@/data/species";
import OptionRail, { type RailOption } from "@/components/crear/OptionRail";
import ArtPanel from "@/components/crear/ArtPanel";

// Escena 0 — Especie: acordeón por región | retrato | detalle + linaje.
// El acordeón se queda (36 especies en 7 regiones) pero más grande y legible.
// El retrato se reserva aunque public/species esté vacío hoy: va a haber arte.
export default function SpeciesScene({
  options,
  species,
  selected,
  lineage,
  onPick,
  onLineage,
}: {
  options: RailOption[];
  species?: Species;
  selected: string | null;
  lineage: string | null;
  onPick: (slug: string) => void;
  onLineage: (name: string) => void;
}) {
  const region = species ? REGIONS.find((r) => r.key === species.region)?.label : null;

  return (
    <div className="scene-3col">
      <OptionRail
        title="Especies de Exandria"
        options={options}
        selected={selected}
        onPick={onPick}
        searchPlaceholder="Buscar especie…"
      />

      <ArtPanel src={species?.image ?? null} alt={species?.name ?? null} />

      <div className="scene-detail">
        {!species ? (
          <p className="font-ui text-[13px]" style={{ color: "var(--color-dim)" }}>
            Elige una especie en la lista.
          </p>
        ) : (
          <>
            <p className="eyebrow mb-1">{region}{species.homebrew ? " · a criterio del DM" : ""}</p>
            <h2 className="font-display text-3xl font-extrabold mb-1" style={{ color: "var(--color-bronze-bright)" }}>
              {species.name}
            </h2>
            <p className="font-ui text-[13px] italic mb-3" style={{ color: "var(--color-muted)" }}>{species.tagline}</p>
            <p className="font-ui text-[14px] leading-relaxed mb-3" style={{ color: "var(--color-warm)" }}>{species.blurb}</p>

            <p className="eyebrow mb-1">Origen</p>
            <p className="font-ui text-[13px] leading-relaxed mb-4" style={{ color: "var(--color-muted)" }}>{species.origin}</p>

            <div className="flex gap-6 mb-4">
              <div><p className="eyebrow !text-[9px]">Tamaño</p><p className="font-display font-extrabold" style={{ color: "var(--color-parch)" }}>{species.size}</p></div>
              <div><p className="eyebrow !text-[9px]">Velocidad</p><p className="font-display font-extrabold" style={{ color: "var(--color-parch)" }}>{species.speed} m</p></div>
            </div>

            <p className="eyebrow mb-1.5">Rasgos</p>
            <ul className="space-y-1 mb-4">
              {species.traits.map((t) => (
                <li key={t} className="font-ui text-[13px] leading-snug" style={{ color: "var(--color-warm)" }}>
                  <span style={{ color: "var(--color-bronze)" }}>◆ </span>{t}
                </li>
              ))}
            </ul>

            {species.lineages && (
              <>
                <p className="eyebrow mb-1.5">Linaje *</p>
                {species.lineages.map((l) => (
                  <button
                    key={l.name}
                    type="button"
                    className={`pick-row${lineage === l.name ? " sel" : ""}`}
                    onClick={() => onLineage(l.name)}
                    aria-pressed={lineage === l.name}
                  >
                    <span className="pick-row-name">{l.name}{l.homebrew ? " · DM" : ""}</span>
                    <span className="pick-row-sub">{l.perk}</span>
                  </button>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Paso 2: Crear `components/crear/steps/BackgroundScene.tsx`**

```tsx
"use client";

import type { Background } from "@/data/backgrounds";
import { ABILITIES } from "@/data/rules";
import OptionRail, { type RailOption } from "@/components/crear/OptionRail";

// Escena 2 — Trasfondo: lista | detalle. Sin panel de arte: backgrounds.ts no
// tiene campo `image` ni está previsto. Los 16 van en lista plana (no tienen
// grupo), así que OptionRail no muestra acordeón.
export default function BackgroundScene({
  options,
  bg,
  selected,
  onPick,
}: {
  options: RailOption[];
  bg?: Background;
  selected: string | null;
  onPick: (slug: string) => void;
}) {
  return (
    <div className="scene-2col">
      <OptionRail
        title="Trasfondos"
        options={options}
        selected={selected}
        onPick={onPick}
        searchPlaceholder="Buscar trasfondo…"
      />

      <div className="scene-detail">
        {!bg ? (
          <p className="font-ui text-[13px]" style={{ color: "var(--color-dim)" }}>
            Elige un trasfondo en la lista.
          </p>
        ) : (
          <>
            <h2 className="font-display text-3xl font-extrabold mb-2" style={{ color: "var(--color-bronze-bright)" }}>
              {bg.name}
            </h2>
            <p className="font-ui text-[14px] leading-relaxed mb-4" style={{ color: "var(--color-warm)" }}>{bg.blurb}</p>

            <div className="scene-boxes">
              <div className="panel p-4">
                <p className="eyebrow mb-1.5">Dote</p>
                <p className="font-ui text-[13px] mb-3" style={{ color: "var(--color-warm)" }}>{bg.feat}</p>
                <p className="eyebrow mb-1.5">Herramienta</p>
                <p className="font-ui text-[13px]" style={{ color: "var(--color-warm)" }}>{bg.tool}</p>
              </div>
              <div className="panel p-4">
                <p className="eyebrow mb-1.5">Pericias (fijas)</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {bg.skills.map((s) => <span key={s} className="chip" data-on>{s}</span>)}
                </div>
                <p className="eyebrow mb-1.5">Puedes repartir +3 entre</p>
                <div className="flex flex-wrap gap-2">
                  {bg.abilities.map((k) => (
                    <span key={k} className="chip">{ABILITIES.find((a) => a.key === k)?.name ?? k}</span>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Paso 3: Añadir el CSS al final de `app/globals.css`**

```css
/* Rejillas de escena. El carril y el arte son fijos; el detalle se lleva el resto. */
.scene-3col { display: grid; grid-template-columns: 300px 260px 1fr; gap: 20px; align-items: start; }
.scene-2col { display: grid; grid-template-columns: 300px 1fr; gap: 20px; align-items: start; }
@media (max-width: 900px) {
  .scene-3col, .scene-2col { grid-template-columns: 1fr; }
}
.scene-detail { min-width: 0; }
.scene-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 720px) { .scene-boxes { grid-template-columns: 1fr; } }

/* Fila de sub-elección (linaje / subclase) dentro del detalle. */
.pick-row {
  display: block; width: 100%; text-align: left;
  padding: 9px 12px; margin-bottom: 6px;
  border-radius: 9px;
  border: 1px solid var(--color-line);
  background: transparent;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.pick-row:hover { background: var(--color-raised); border-color: color-mix(in srgb, var(--color-bronze) 50%, transparent); }
.pick-row.sel { background: var(--color-raised); border-color: var(--color-bronze); }
.pick-row-name { display: block; font-family: var(--font-ui); font-size: 13px; font-weight: 700; color: var(--color-warm); }
.pick-row-sub { display: block; font-family: var(--font-ui); font-size: 11px; color: var(--color-dim); }

/* El carril crece: hoy filas de ~30px y nombre a 12px, ilegible en 280px. */
.rail { border-left: 0; padding: 0; background: transparent; }
.rail-opt { padding: 8px; gap: 11px; }
.rail-thumb { width: 38px; height: 38px; border-radius: 8px; }
.rail-thumb .ph { font-size: 13px; }
.rail-name { font-size: 14px; }
.rail-sub { font-size: 11px; }
.rail-acc { font-size: 11px; padding: 8px 6px; }
.rail-search { font-size: 13px; padding: 9px 12px; }
```

> Nota: `.rail` pierde el `border-left` y el fondo porque ya no es una columna
> pegada al borde, sino una zona más de la escena. La regla `@media (max-width:
> 860px)` que le ponía `border-top` queda sin efecto útil; se limpia en la Tarea 5
> junto con el resto del CSS muerto.

- [ ] **Paso 4: Verificar que compila**

Ejecuta: `npx tsc --noEmit`
Esperado: sin salida. Aún sin consumidor.

- [ ] **Paso 5: Commit**

```bash
git add components/crear/steps/SpeciesScene.tsx components/crear/steps/BackgroundScene.tsx app/globals.css
git commit -m "feat(crear): escenas de especie y trasfondo

Especie: acordeón por región (más grande y legible) + retrato + detalle
con origen, rasgos y linaje, todo a la vez. Trasfondo: lista + detalle
en dos bloques, sin panel de arte (no hay ni se prevé).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Escena de Clase — flechas + tira de 13

Fuera el acordeón y el buscador: aquí se navega con flechas, una clase cada vez.
La tira de 13 miniaturas dice dónde estás y deja saltar de un clic (sin ella, de
Bárbaro a Cazador de Sangre son 12 clics a ciegas).

**Archivos:**
- Crear: `components/crear/steps/ClassScene.tsx`
- Modificar: `app/globals.css`

- [ ] **Paso 1: Crear `components/crear/steps/ClassScene.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { CLASSES, GROUP_LABEL, type CharClass } from "@/data/classes";
import { ABILITIES } from "@/data/rules";
import ArtPanel from "@/components/crear/ArtPanel";

// Escena 1 — Clase. Navegación por FLECHAS (una clase cada vez, con su arte
// grande) + tira de las 13 abajo para saltar. Sin acordeón ni buscador: es lo
// que el carril hacía y lo que se pidió retirar aquí.
//
// El orden de recorrido es por grupo (Marcial · Arcano · Divino · Primigenio),
// el mismo criterio que usaba el carril, para que las flechas pasen por los
// grupos en orden en vez de saltar de uno a otro.
const GROUP_ORDER = Object.keys(GROUP_LABEL) as (keyof typeof GROUP_LABEL)[];
const ORDERED: CharClass[] = [...CLASSES].sort(
  (a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group)
);

function abbr(key: string) {
  return ABILITIES.find((a) => a.key === key)?.abbr ?? key.toUpperCase();
}

// Miniatura de la tira: cae al rombo si no hay .jpg (bardo y paladin hoy).
function Thumb({ cls, on, onClick }: { cls: CharClass; on: boolean; onClick: () => void }) {
  const [failed, setFailed] = useState(false);
  return (
    <button type="button" className={`cls-thumb${on ? " on" : ""}`} onClick={onClick} title={cls.name} aria-pressed={on}>
      {failed ? (
        <span className="ph">◆</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/classes/${cls.slug}.jpg`} alt={cls.name} onError={() => setFailed(true)} />
      )}
      <span className="cls-thumb-nm">{cls.name}</span>
    </button>
  );
}

export default function ClassScene({
  cls,
  subclass,
  onPick,
  onSubclass,
}: {
  cls?: CharClass;
  subclass: string | null;
  onPick: (slug: string) => void;
  onSubclass: (name: string) => void;
}) {
  // Sin clase elegida arrancamos en la primera: la escena SIEMPRE enseña una
  // clase (es un pase de arte, no una lista vacía). No selecciona nada por su
  // cuenta — el gate sigue pidiendo que el jugador pulse.
  const idx = useMemo(() => {
    const i = ORDERED.findIndex((c) => c.slug === cls?.slug);
    return i === -1 ? 0 : i;
  }, [cls?.slug]);

  const shown = ORDERED[idx];
  const go = (delta: number) => {
    const next = (idx + delta + ORDERED.length) % ORDERED.length;
    onPick(ORDERED[next].slug);
  };

  return (
    <div>
      <div className="cls-stage">
        <button type="button" className="cls-arrow" onClick={() => go(-1)} aria-label="Clase anterior">◀</button>

        <ArtPanel src={`/classes/${shown.slug}.jpg`} alt={shown.name} />

        <div className="scene-detail">
          <p className="eyebrow mb-1">{GROUP_LABEL[shown.group]} · Clase {idx + 1} de {ORDERED.length}</p>
          <h2 className="font-display text-3xl font-extrabold mb-1" style={{ color: "var(--color-bronze-bright)" }}>
            {shown.name}
          </h2>
          <p className="font-ui text-[13px] italic mb-3" style={{ color: "var(--color-muted)" }}>{shown.tagline}</p>
          <p className="font-ui text-[14px] leading-relaxed mb-4" style={{ color: "var(--color-warm)" }}>{shown.blurb}</p>

          <div className="flex gap-6 mb-4 flex-wrap">
            <div><p className="eyebrow !text-[9px]">Dado de golpe</p><p className="font-display font-extrabold" style={{ color: "var(--color-parch)" }}>d{shown.hitDie}</p></div>
            <div><p className="eyebrow !text-[9px]">Aptitud principal</p><p className="font-display font-extrabold" style={{ color: "var(--color-parch)" }}>{shown.primary.map(abbr).join(" / ")}</p></div>
            <div><p className="eyebrow !text-[9px]">Salvaciones</p><p className="font-display font-extrabold" style={{ color: "var(--color-parch)" }}>{shown.saves.map(abbr).join(" / ")}</p></div>
            <div><p className="eyebrow !text-[9px]">Pericias</p><p className="font-display font-extrabold" style={{ color: "var(--color-parch)" }}>{shown.skillCount} a elegir</p></div>
          </div>

          {/* La subclase solo es elegible de la clase YA seleccionada: si estás
              hojeando con las flechas sin haber pulsado, no hay qué elegir. */}
          {cls?.slug === shown.slug ? (
            <>
              <p className="eyebrow mb-1.5">{shown.subclassLabel} *</p>
              {shown.subclasses.map((sc) => (
                <button
                  key={sc.name}
                  type="button"
                  className={`pick-row${subclass === sc.name ? " sel" : ""}`}
                  onClick={() => onSubclass(sc.name)}
                  aria-pressed={subclass === sc.name}
                >
                  <span className="pick-row-name">{sc.name}</span>
                  <span className="pick-row-sub">{sc.blurb}</span>
                </button>
              ))}
            </>
          ) : (
            <button type="button" className="btn-gold" onClick={() => onPick(shown.slug)}>
              Elegir {shown.name}
            </button>
          )}
        </div>

        <button type="button" className="cls-arrow" onClick={() => go(1)} aria-label="Clase siguiente">▶</button>
      </div>

      <div className="cls-strip">
        {ORDERED.map((c) => (
          <Thumb key={c.slug} cls={c} on={c.slug === shown.slug} onClick={() => onPick(c.slug)} />
        ))}
      </div>
    </div>
  );
}
```

> **Ojo con `onPick`**: en `page.tsx` es `pickClass`, que hace
> `set({ cls: slug, subclass: null, skills: [] })`. Hojear con las flechas
> **cambia la clase elegida y limpia subclase y pericias**. Es el comportamiento
> correcto (elegir clase nueva invalida su subclase), y es lo que ya pasaba al
> pulsar en el carril.

- [ ] **Paso 2: Añadir el CSS al final de `app/globals.css`**

```css
/* Escena de clase: flechas + arte + detalle, y tira de las 13 debajo. */
.cls-stage { display: flex; gap: 16px; align-items: stretch; }
.cls-arrow {
  width: 44px; flex: none;
  display: grid; place-items: center;
  font-size: 22px; color: var(--color-bronze);
  background: rgba(201, 163, 92, 0.07);
  border: 1px solid color-mix(in srgb, var(--color-bronze) 35%, transparent);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.cls-arrow:hover { background: rgba(201, 163, 92, 0.18); }
.cls-strip { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 18px; }
.cls-thumb {
  width: 56px; height: 56px; flex: none;
  border-radius: 9px; overflow: hidden;
  background: var(--color-night);
  border: 1px solid var(--color-line);
  display: grid; place-items: center;
  cursor: pointer;
  position: relative;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.cls-thumb:hover { border-color: var(--color-bronze); }
.cls-thumb.on { border-color: var(--color-bronze-bright); box-shadow: 0 0 12px rgba(201, 163, 92, 0.75); }
.cls-thumb img { width: 100%; height: 100%; object-fit: cover; }
.cls-thumb .ph { font-size: 18px; color: var(--color-dim); }
.cls-thumb-nm {
  position: absolute; bottom: 0; left: 0; right: 0;
  font-family: var(--font-ui); font-size: 7px; font-weight: 700;
  text-align: center; padding: 1px 0;
  background: rgba(0, 0, 0, 0.75); color: var(--color-warm);
}
@media (max-width: 900px) {
  .cls-stage { flex-wrap: wrap; }
  .cls-arrow { width: 100%; height: 40px; }
}
```

- [ ] **Paso 3: Verificar que compila**

Ejecuta: `npx tsc --noEmit`
Esperado: sin salida.

- [ ] **Paso 4: Commit**

```bash
git add components/crear/steps/ClassScene.tsx app/globals.css
git commit -m "feat(crear): la clase se hojea con flechas

Fuera el acordeón y el buscador en clases: una clase cada vez con su
arte grande, flechas atrás/adelante y una tira de las 13 para saltar y
ver cuánto queda. El orden de recorrido sigue los grupos.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Montar las escenas en `page.tsx` y retirar el círculo

**Archivos:**
- Modificar: `app/crear/page.tsx`
- Borrar: `components/crear/InvocationCircle.tsx`, `components/crear/Medallion.tsx`, `components/crear/DetailPanel.tsx`
- Modificar: `app/globals.css` (borrar CSS muerto)

- [ ] **Paso 1: Cambiar los imports de `page.tsx` (líneas 11-15)**

Sustituye:

```tsx
import InvocationCircle from "@/components/crear/InvocationCircle";
import OptionRail, { type RailOption } from "@/components/crear/OptionRail";
import Medallion from "@/components/crear/Medallion";
import DetailPanel from "@/components/crear/DetailPanel";
import AbilitiesStep from "@/components/crear/steps/AbilitiesStep";
```

por:

```tsx
import RuneBar from "@/components/crear/RuneBar";
import { type RailOption } from "@/components/crear/OptionRail";
import SpeciesScene from "@/components/crear/steps/SpeciesScene";
import ClassScene from "@/components/crear/steps/ClassScene";
import BackgroundScene from "@/components/crear/steps/BackgroundScene";
import AbilitiesStep from "@/components/crear/steps/AbilitiesStep";
```

- [ ] **Paso 2: Borrar el código muerto de `page.tsx`**

Borra estos bloques, que ya no tienen consumidor:

1. `classOptions` (líneas ~61-66) y la constante `GROUP_ORDER` de su línea 61 —
   `ClassScene` calcula su propio orden. **Deja `speciesOptions` y
   `backgroundOptions`**, que siguen usándose.
2. `speciesOptionsUI` y `classOptionsUI` (líneas ~148-157): la sub-elección ya no
   va anidada en el carril, va en el detalle de cada escena.
3. Las funciones `LineagePicker` y `SubclassPicker` (líneas ~397-452): sus
   equivalentes viven ahora en `SpeciesScene` y `ClassScene` con `.pick-row`.
4. `medallionSrc` y `medallionCaption` (líneas ~272-282).

- [ ] **Paso 3: Sustituir el bloque de render (líneas ~285-368)**

De `<main …>` hasta el cierre del `</div>` de la rejilla, deja:

```tsx
    <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-10">
      <header className="text-center mb-6">
        <p className="eyebrow mb-3">Forja de héroes · Reglas 2024</p>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text">Crea tu personaje</h1>
      </header>

      <div className="mb-6 max-w-md mx-auto">
        <label className="tome-region" htmlFor="hero-name">Nombre de tu héroe *</label>
        <input
          id="hero-name"
          value={b.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Ej.: Vex'ahlia, Grog, Percival…"
          maxLength={40}
          className="w-full rounded-lg px-3 py-2 font-display text-lg font-bold outline-none"
          style={{ background: "rgba(120,80,35,0.10)", color: "var(--paper-ink)", border: `1px solid ${b.name.trim() ? "var(--paper-line)" : "var(--color-ember)"}` }}
        />
      </div>

      <RuneBar steps={STEPS} current={b.step} maxStep={maxStep} onGo={go} />

      {b.step === 0 && (
        <SpeciesScene
          options={speciesOptions}
          species={species}
          selected={b.species}
          lineage={b.lineage}
          onPick={pickSpecies}
          onLineage={(name) => set({ lineage: name })}
        />
      )}

      {b.step === 1 && (
        <ClassScene
          cls={cls}
          subclass={b.subclass}
          onPick={pickClass}
          onSubclass={(name) => set({ subclass: name })}
        />
      )}

      {b.step === 2 && (
        <BackgroundScene options={backgroundOptions} bg={bg} selected={b.background} onPick={pickBackground} />
      )}

      {b.step === 3 && (
        <AbilitiesStep
          userId={userId}
          method={b.statMethod}
          rolled={b.rolled}
          assign={b.assign}
          base={b.base}
          bonus={b.bonus}
          canBonus={canBonus}
          onMethod={(m) => set({ statMethod: m, rolled: [], assign: { ...ASSIGN_EMPTY } })}
          onRolled={(scores) => set({ rolled: scores, assign: { ...ASSIGN_EMPTY } })}
          onAssign={(a) => set({ assign: a })}
          onBase={(k, v) => set({ base: { ...b.base, [k]: v } })}
          onBonus={(k, v) => set({ bonus: { ...b.bonus, [k]: v } })}
        />
      )}

      {b.step === 4 && <StepSkills b={b} set={set} cls={cls} bgSkills={bgSkills} classPool={classPool} />}

      {b.step === 5 && (
        <StepSummary b={b} set={set} finalScores={finalScores} hp={hp} allSkills={allSkills} onCopy={copySheet} onReset={reset} onCreate={onCreate} />
      )}
```

Los botones Atrás/Siguiente y el cierre de `</main>` se quedan **tal cual** (líneas
~370-390).

- [ ] **Paso 4: Borrar los tres componentes retirados**

```bash
git rm components/crear/InvocationCircle.tsx components/crear/Medallion.tsx components/crear/DetailPanel.tsx
```

- [ ] **Paso 5: Borrar el CSS muerto de `app/globals.css`**

Borra estos bloques (referencias por el estado del archivo antes de la Tarea 2):
- `.medallion`, `.medallion img`, `.medallion-silo`, `.medallion-silo::before`,
  `.medallion-cap` (líneas ~513-558).
- `.inv-scene`, `.inv-scene::after`, `.inv-circle`, `.inv-ring-outer`,
  `.inv-ring-inner`, `@keyframes inv-spin`, `.inv-medal-slot`, `.inv-rune` y sus
  variantes, y el `@media (prefers-reduced-motion)` que solo apagaba los aros
  (líneas ~561-614).
- `.crear-grid`, `.crear-left` y sus dos `@media (max-width: 860px)` (líneas ~680-688).
- El `@media (max-width: 860px) { .rail { border-left: 0; border-top: … } }`
  (línea ~618): `.rail` ya no tiene `border-left` que quitar.

- [ ] **Paso 6: Verificar que no queda ninguna referencia**

Ejecuta:
```bash
grep -rn "InvocationCircle\|Medallion\|DetailPanel\|crear-grid\|crear-left\|inv-circle\|inv-rune\|medallion" app/ components/ lib/ || echo "LIMPIO"
```
Esperado: `LIMPIO`.

- [ ] **Paso 7: Verificar que compila y construye**

Ejecuta: `npx tsc --noEmit && npm run build`
Esperado: `tsc` sin salida; el build termina sin errores.

- [ ] **Paso 8: Commit**

```bash
git add -A app/crear/page.tsx app/globals.css components/crear/
git commit -m "feat(crear): una escena por paso, fuera el círculo

El círculo repartía mal el espacio: 300px perdidos en una columna de
824px mientras el carril se ahogaba a 280px. La navegación pasa a la
barra de runas con el mismo gate y cada paso se pinta en su escena.
La página deja de topar en 1152px. Se retiran InvocationCircle,
Medallion y DetailPanel, cuyo contenido vive ahora en las escenas.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Pasos 3-5 a lo ancho

Hoy caen en el carril de 280px: las tarjetas de método miden **75px de ancho por
425 de alto** y los títulos se parten en 2-3 líneas. Ya no están en el carril
(Tarea 5), pero hay que darles la maqueta ancha.

**Archivos:**
- Modificar: `components/crear/steps/AbilitiesStep.tsx`
- Modificar: `app/crear/page.tsx` (`StepSkills` y `StepSummary`)

- [ ] **Paso 1: Centrar la cabecera del selector de método**

En `AbilitiesStep.tsx`, en el bloque `if (!method)` (línea ~131), cambia el `<h2>`
y el `<p>` de aviso por:

```tsx
        <h2 className="font-display text-2xl font-bold mb-2 text-center" style={{ color: "var(--color-parch)" }}>
          ¿Cómo obtienes tus aptitudes?
        </h2>
        <p className="font-ui text-[12px] font-bold mb-6 text-center" style={{ color: "var(--color-ember)" }}>
          <i className="fas fa-triangle-exclamation mr-1.5" />
          Solo puedes elegir una vez: la tirada no se puede repetir.
        </p>
```

Y la rejilla de tarjetas (línea ~142) — de `grid sm:grid-cols-3 gap-4` a:

```tsx
        <div className="grid sm:grid-cols-3 gap-5 max-w-5xl mx-auto">
```

- [ ] **Paso 2: Centrar los chips de estado del reparto**

En el bloque final de `AbilitiesStep.tsx` (línea ~216), cambia:

```tsx
      <div className="flex flex-wrap gap-3 mb-6 justify-center">
```

- [ ] **Paso 3: `StepSkills` a dos bloques**

En `page.tsx`, dentro de `StepSkills`, sustituye desde `{bgSkills.length > 0 && (`
hasta el cierre del último `</div>` del pool de clase por:

```tsx
      <div className="scene-boxes">
        <div className="panel p-5">
          <p className="eyebrow mb-2">Del trasfondo (fijas)</p>
          {bgSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {bgSkills.map((s) => <span key={s} className="chip" data-on><i className="fas fa-lock text-[9px] mr-1" />{s}</span>)}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--color-dim)" }}>—</p>
          )}
        </div>

        <div className="panel p-5">
          <p className="eyebrow mb-2">De la clase ({cls.name})</p>
          <div className="flex flex-wrap gap-2">
            {classPool.map((s) => {
              const on = b.skills.includes(s);
              const ab = SKILLS.find((x) => x.name === s)?.ability;
              return (
                <button key={s} className="chip" data-on={on} onClick={() => toggle(s)}
                  disabled={!on && b.skills.length >= need}
                  style={{ opacity: !on && b.skills.length >= need ? 0.4 : 1 }}>
                  {s} <span className="opacity-60">{ABILITIES.find((a) => a.key === ab)?.abbr}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
```

- [ ] **Paso 4: `StepSummary` a dos columnas**

En `page.tsx`, en `StepSummary`, envuelve el `<div className="panel p-6">` de la
ficha y el `<div className="panel p-6 mt-5">` de la historia en una rejilla.
Sustituye `<div className="panel p-6">` por:

```tsx
      <div className="scene-boxes">
      <div className="panel p-6">
```

y `<div className="panel p-6 mt-5">` por:

```tsx
      <div className="panel p-6">
```

añadiendo `</div>` de cierre de la rejilla justo antes de
`<div className="flex flex-wrap gap-3 mt-5">` (los botones se quedan debajo, a lo
ancho). La rejilla de las 6 aptitudes pasa de `grid-cols-3 sm:grid-cols-6` a
`grid-cols-6` — a esta anchura ya caben las seis.

- [ ] **Paso 5: Verificar que compila y construye**

Ejecuta: `npx tsc --noEmit && npm run build`
Esperado: `tsc` sin salida; build sin errores.

- [ ] **Paso 6: Commit**

```bash
git add components/crear/steps/AbilitiesStep.tsx app/crear/page.tsx
git commit -m "feat(crear): aptitudes, pericias y ficha a lo ancho

Las tres tarjetas de método medían 75px de ancho con el título partido
en tres líneas. Pericias pasa a dos bloques y la Ficha enseña el héroe
y su historia en paralelo.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Tirada única — reusar en vez de fallar

**El bug**: `reset()` («Empezar de nuevo») pone `statMethod: null` **solo en el
cliente**; la fila de `stat_rolls` sigue en la BD. Al volver a Aptitudes reaparece
el selector, cualquier elección hace `insert` → choca con la PK → `AbilitiesStep`
pinta el mensaje crudo de Postgres. Con 4d6 es peor: se lanzan los **seis dados
antes** del insert.

**El bloqueo del servidor es correcto y no se toca.** Lo que cambia es el cliente.

**Archivos:**
- Modificar: `app/crear/page.tsx` (`reset`, efecto de `loadStatRoll`)
- Modificar: `components/crear/steps/AbilitiesStep.tsx`

- [ ] **Paso 1: `reset()` conserva la tirada**

En `page.tsx`, sustituye `reset` (línea ~187) por:

```tsx
  // «Empezar de nuevo» rehace el personaje, NO la tirada: `stat_rolls` es
  // inmutable en la BD (PK sin policy de update) y solo el DM puede borrarla.
  // Si limpiásemos statMethod/rolled aquí, el selector reaparecería y el insert
  // chocaría con la PK. La tirada es del jugador, no del personaje.
  function reset() {
    setB((p) => ({
      name: "", species: null, lineage: null, cls: null, subclass: null, background: null,
      base: { ...EMPTY_SCORES }, bonus: { ...NO_BONUS }, skills: [], lore: "", step: 0,
      statMethod: p.statMethod, rolled: p.rolled, assign: { ...ASSIGN_EMPTY },
    }));
  }
```

> `assign` sí se limpia: `base` vuelve a `EMPTY_SCORES`, así que la asignación
> anterior ya no describe nada. El jugador reasigna sus mismos 6 valores.

- [ ] **Paso 2: Derivar `assign` al cargar la tirada**

En `page.tsx`, cambia el import de `lib/statRolls` (línea 20) para añadir
`deriveAssign`:

```tsx
import { ASSIGN_EMPTY, deriveAssign, isAssignComplete, loadStatRoll, type Assign, type StatMethod } from "@/lib/statRolls";
```

Y sustituye el efecto de la Fase K (líneas ~122-129) por:

```tsx
  // Fase K: si el jugador YA tiene tirada registrada, el método queda fijado.
  // `assign` no se persiste: se deriva de `base` (la fuente de verdad), o si no
  // cuadra queda vacío y el jugador reasigna.
  useEffect(() => {
    if (!userId) return;
    loadStatRoll(userId).then((row) => {
      if (!row) return;
      setB((p) => ({
        ...p,
        statMethod: row.method,
        rolled: row.scores ?? [],
        assign: isAssignComplete(p.assign) ? p.assign : deriveAssign(p.base, row.scores ?? []),
      }));
    });
  }, [userId]);
```

> **Orden**: este efecto puede llegar antes que la carga de la nube
> (`loadCharacter`), en cuyo caso `p.base` aún es `EMPTY_SCORES` y `deriveAssign`
> devuelve vacío. Se cubre en el Paso 3 con un efecto que reintenta cuando `base`
> ya está cargado.

- [ ] **Paso 3: Reintentar la derivación cuando llegue `base`**

Añade en `page.tsx`, justo después del efecto anterior:

```tsx
  // La ficha (`base`) y la tirada (`rolled`) llegan de dos consultas distintas y
  // en cualquier orden. Cuando ya están las dos y `assign` sigue vacío, se
  // deriva. Solo rellena huecos: nunca pisa una asignación del jugador.
  useEffect(() => {
    if (!b.rolled.length || isAssignComplete(b.assign)) return;
    const derived = deriveAssign(b.base, b.rolled);
    if (isAssignComplete(derived)) setB((p) => ({ ...p, assign: derived }));
  }, [b.rolled, b.base, b.assign]);
```

- [ ] **Paso 4: Traducir el error de la BD en `AbilitiesStep`**

Añade en `AbilitiesStep.tsx`, después de los imports:

```tsx
// El insert en `stat_rolls` choca con la PK si ya hay tirada. No debería
// llegarse aquí (el selector no se muestra si hay método fijado), pero si pasa,
// nada de texto de Postgres.
function humanError(msg: string): string {
  if (/duplicate key|stat_rolls_pkey/i.test(msg)) {
    return "Ya tienes una tirada registrada y no se puede repetir. Pide al DM que te la resetee en Panel DM › Grupo.";
  }
  return msg;
}
```

Y sustituye las 4 llamadas `setError(err)` (líneas ~78, ~91, ~103 y la del
`pickDados`) por `setError(humanError(err))`.

- [ ] **Paso 5: Comprobar la tirada antes de lanzar los dados**

Hoy `pickDados` lanza los **seis dados** y hace el insert **después**: si ya hay
fila, tiras seis veces para nada. No se puede reservar la fila antes de tirar
(`stat_rolls.scores` es `not null` y los valores aún no existen), pero sí se puede
**comprobar** que no la hay.

Añade `loadStatRoll` al import de `@/lib/statRolls` en `AbilitiesStep.tsx`
(línea 9) y sustituye `pickDados` (línea ~64) por:

```tsx
  async function pickDados() {
    if (!userId || busy) return;
    setBusy(true);
    setError(null);
    // Comprobamos ANTES de tirar: `scores` es not null, así que la fila no se
    // puede reservar sin valores, pero sí evitamos que el jugador lance seis
    // dados para que el insert falle al final. No es una garantía (la de verdad
    // es la PK, en el servidor): es cortesía.
    const existing = await loadStatRoll(userId);
    if (existing) {
      setError(humanError("duplicate key"));
      setBusy(false);
      return;
    }
    onMethod("dados");
    const scores: number[] = [];
    for (let i = 0; i < 6; i++) {
      setProgress(i + 1);
      const r = await rollVisual("4d6", { label: `Aptitud ${i + 1} de 6` });
      const dice = r ? r.rolls : (rollFallback("4d6")?.rolls ?? []);
      scores.push(dropLowest(dice));
    }
    onRolled(scores);
    const err = await saveStatRoll(userId, "dados", scores);
    if (err) setError(humanError(err));
    setProgress(0);
    setBusy(false);
  }
```

> El bloqueo real sigue siendo la **PK en el servidor**; esta comprobación es solo
> para no hacer tirar en balde. Con el Paso 6 no debería llegarse aquí nunca.

- [ ] **Paso 6: No enseñar el selector si ya hay tirada**

En `AbilitiesStep.tsx`, el bloque `if (!method)` ya cubre esto: `page.tsx` fija
`statMethod` desde `loadStatRoll` al montar, así que con fila existente nunca se
entra en el selector. Lo que falta es **decirlo** en el bloque del reparto. Añade
justo después del `<p className="text-sm mb-4">` de la línea ~209:

```tsx
      {userId && (
        <p className="font-ui text-[12px] mb-4" style={{ color: "var(--color-dim)" }}>
          <i className="fas fa-lock mr-1.5" style={{ color: "var(--color-bronze)" }} />
          Tu tirada quedó registrada y no se puede repetir. Pide al DM que te la
          resetee en Panel DM › Grupo si quieres volver a tirar.
        </p>
      )}
```

- [ ] **Paso 7: Verificar que compila, construye y los checks pasan**

Ejecuta:
```bash
npx tsc --noEmit && npm run build && npx tsx scripts/check-statrolls.ts && npx tsx scripts/check-dice.ts && npx tsx scripts/check-dicebox.ts
```
Esperado: `tsc` sin salida; build sin errores; los tres checks acaban en
`Todas las comprobaciones pasaron.`

- [ ] **Paso 8: Commit**

```bash
git add app/crear/page.tsx components/crear/steps/AbilitiesStep.tsx
git commit -m "fix(crear): reusar la tirada al rehacer el personaje

«Empezar de nuevo» limpiaba statMethod solo en cliente: el selector
reaparecía y el insert chocaba con la PK de stat_rolls, soltando el
error crudo de Postgres. Ahora la tirada sobrevive al reset (es del
jugador, no del personaje), assign se deriva de base al cargar, y si
algún error de la BD llega igual se traduce.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Verificación en el navegador y documentación

**Archivos:**
- Modificar temporalmente: `proxy.ts` (**revertir al acabar**)
- Modificar: `HANDOFF.md`
- Modificar: `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria\50 Funcionalidades\Creador de personaje (círculo).md`
- Modificar: `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria\00 Meta\Pendientes.md`

- [ ] **Paso 1: Excluir `crear` del matcher del proxy**

`/crear` está detrás del auth-proxy y redirige a `/login`. En `proxy.ts:13`,
cambia `|dice-box|` por `|dice-box|crear|`. **Esto se revierte en el Paso 5.**

- [ ] **Paso 2: Arrancar el dev server y llegar al paso Aptitudes**

Arranca el dev server (`preview_start` con `exandria-dev`, nunca `npm run dev`
por Bash) y abre `http://localhost:3000/crear`.

**El screenshot del navegador se cuelga con WebGL** (dice-box). Usa
`javascript_tool`, que funciona siempre.

Sin sesión, el gate se salta sembrando el borrador de localStorage:

```js
localStorage.setItem('taldorei.build.v1', JSON.stringify({
  name:'Test', species:'orco', lineage:null, cls:'clerigo',
  subclass:'Dominio de la Vida', background:'acolito',
  base:{fue:8,des:8,con:8,int:8,sab:8,car:8},
  bonus:{fue:0,des:0,con:0,int:0,sab:0,car:0},
  skills:[], lore:'', step:3, statMethod:null, rolled:[],
  assign:{fue:null,des:null,con:null,int:null,sab:null,car:null}
}));
location.href='/crear';
```

- [ ] **Paso 3: Medir contra los números de antes**

```js
(()=>{const cards=[...document.querySelectorAll('.pick-card')].map(c=>{
  const b=c.getBoundingClientRect(); const h=c.querySelector('h4')||c.querySelector('h3');
  const r=document.createRange(); r.selectNodeContents(h);
  return {n:h.textContent, w:Math.round(b.width), titleLines:r.getClientRects().length};});
return JSON.stringify({cards, hOverflow: document.documentElement.scrollWidth>document.documentElement.clientWidth});})()
```

Esperado: cada tarjeta con `w` **≥ 320** (antes: 75) y `titleLines` **= 1**
(antes: 2 y 3). `hOverflow` **false**.

- [ ] **Paso 4: Comprobar el resto**

```js
(()=>{const runes=[...document.querySelectorAll('.rune')];
return JSON.stringify({
  runeCount: runes.length,
  disabled: runes.map(r=>r.disabled),
  current: document.querySelector('.rune[aria-current]')?.textContent,
  artPanels: document.querySelectorAll('.art-panel').length,
  strip: document.querySelectorAll('.cls-thumb').length,
});})()
```

Comprueba, navegando por las runas:
- `runeCount` = 6 y, **entrando de cero** (con `localStorage.clear()` y recarga),
  solo la 1ª habilitada — el gate sigue vivo.
- En el paso Clase: `artPanels` = 1, `strip` = 13, las flechas cambian de clase, y
  el arte de Clérigo carga de verdad
  (`document.querySelector('.art-panel img').naturalWidth` = **659**).
- A 375px de ancho (`resize_window` a mobile): `hOverflow` sigue **false**.

- [ ] **Paso 5: Revertir `proxy.ts`**

Deshaz el Paso 1 y confirma:

```bash
git diff --stat proxy.ts
```
Esperado: **sin salida** (`proxy.ts` intacto). Si `next-env.d.ts` sale modificado,
lo regenera el dev server: `git checkout next-env.d.ts`.

- [ ] **Paso 6: Actualizar HANDOFF.md**

Añade un milestone `## RESUELTO (2026-07-16): Creador — una escena por paso`
**encima** del de `2026-07-15: Creador — Círculo de invocación`, y en ese marca que
el círculo **se retiró el 2026-07-16** (si no, el HANDOFF describe una UI que ya no
existe). Recoge: el círculo → barra de runas; escena por paso; clases con flechas +
tira; el panel de arte de 260px y que `public/species/` sigue vacío y faltan
`bardo.jpg`/`paladin.jpg`; la tirada se reusa al rehacer el personaje; `assign` se
deriva de `base`; sin migración. Anota que **el falso positivo de las runas
recortadas no existía** (medido a 375/900/1280).

- [ ] **Paso 7: Actualizar el vault**

- `50 Funcionalidades/Creador de personaje (círculo).md`: **renómbralo** a
  `Creador de personaje.md` (ya no hay círculo) y reescribe «La escena» y «El
  carril» con las escenas nuevas. Busca enlaces entrantes con
  `grep -rn "Creador de personaje (círculo)" "C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria"`
  y arréglalos.
- `00 Meta/Pendientes.md`: en «Prueba en vivo del creador nuevo», añade que
  además falta probar **rehacer el personaje con tirada ya hecha** (que ya no dé
  error y conserve los valores).

- [ ] **Paso 8: Commit**

```bash
git add HANDOFF.md
git commit -m "docs(crear): registra las escenas por paso y el fix de la tirada

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Paso 9: Push**

```bash
git push origin master
```

Si Vercel no despliega: `git commit --allow-empty -m "chore: fuerza el despliegue"`
y push (el webhook se duerme). **El `builtAt` de `/api/version` engaña — mira
`commit`**: `curl https://exandria.vercel.app/api/version`.

---

## Qué NO hace este plan

- **No toca la lógica de estado ni de validación**: `stepDone`, el gate, `maxStep`,
  el borrador en localStorage sin sesión, la nube con sesión. `base` sigue siendo
  la fuente de verdad de las puntuaciones.
- **No toca `saveCharacter` ni la hoja** (`/personaje`).
- **Sin migración**: nada de `schema_v14`.
- **No arregla `npm run lint`**, roto repo-wide de antes.
- **No sube arte.** Las 36 especies y Bardo/Paladín van con silueta hasta que el
  usuario suelte los `.jpg`. A 260px canta bastante más que en la miniatura de
  30px de hoy.

## Lo que solo puede probar el usuario

No hay contraseña de ninguna cuenta en el entorno de desarrollo:

- El paso de **dados con sesión** (4d6 ×6 con el overlay BG3).
- Que **no deja repetir** la tirada, y que rehacer el personaje ya **no da error**.
- **«Resetear aptitudes»** en Panel DM › Grupo.
