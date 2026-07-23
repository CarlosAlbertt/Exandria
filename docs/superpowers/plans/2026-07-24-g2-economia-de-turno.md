# G2 — Economía de turno y ataque desde la ficha — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la hoja lleve la economía del turno de combate 2024 (acción, adicional, reacción, movimiento) que se limpia sola al tocarte el turno, y que puedas atacar desde la ficha con la característica correcta, la competencia derivada y la ventaja de tus condiciones (G1).

**Architecture:** Dos capas puras nuevas (`lib/turno.ts` para la economía sobre `PlayState`, `lib/ataque.ts` para el cálculo de un ataque) más una tabla de datos de armas (`data/weapons.ts`); dos componentes (`EconomiaTurno`, `Ataques`) montados en la hoja y en el panel del DM; y una suscripción a la propia fila de iniciativa que limpia el turno al pasar a activo. Todo el estado va en `characters.play_state` — **sin migración**.

**Tech Stack:** Next.js 16 · React 19 · TypeScript · Supabase (Postgres + Realtime). Sin framework de tests: el gate es `npx tsc --noEmit` + `npx next build`, y lo puro se verifica con scripts (`scripts/check-turno.ts`, `scripts/check-ataque.ts`), patrón de `scripts/check-estado.ts`.

**Spec:** `docs/superpowers/specs/2026-07-24-g2-economia-de-turno-design.md`

**Rama:** `g2-economia-turno` (ya creada, parte de `master`; el spec ya está commiteado en ella).

---

## Sobre los tests en este repo

No hay framework de tests. El ciclo TDD se hace con un **script de comprobación**
que imprime `OK`/`FAIL` por aserción y sale con código ≠ 0 si algo falla, como
`scripts/check-estado.ts`. «Ver el test fallar» = ejecutarlo y ver `FAIL` (o error
de import) antes de implementar; «pasar» = todo en `OK`.

Cada tarea acaba en commit. Autor `CarlosAlbertt`; trailer
`Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Para mensajes con
backticks, `git commit -F -` con heredoc. **Nunca `git add -A` a ciegas**: añadir
solo los archivos tocados.

Datos verificados del código (no re-descubrir):
- `derive(c)` (`lib/derive.ts`) devuelve `abilities: Record<"fue"|"des"|..., { score, mod }>`, `prof: number`, `maxHp: number`.
- Las claves de característica son `fue des con int sab car` (`data/rules.ts`).
- `getMechanics(slug)` (`data/classdata/index.ts`) devuelve `{ weapons: string[], ... } | null`; `weapons` trae `"sencillas"` y/o `"marciales"`.
- Los objetos del inventario son `Item[]` con `.name` (`lib/character.ts`).
- La velocidad sale de `getSpecies(slug)?.speed` (número en metros).
- `publishRoll(userId, kind, label, formula, opts?)` (`lib/useDiceFeed.ts`): `RollKind = "ability"|"save"|"skill"|"attack"|"custom"|"requested"`; `D20_KINDS = ["ability","save","skill","attack"]`; `opts.adv: "adv"|"dis"`. **No añadir kinds**: el impacto usa `"attack"` (ya en D20_KINDS), el daño usa `"custom"` con fórmula.
- `ventajaDe(play, tipo)` (`lib/estado.ts`) acepta `tipo: "ataque"|"prueba"|"salvez"`.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `lib/recursos.ts` (modificar) | `PlayState` gana la clave `turno`. |
| `data/weapons.ts` (crear) | Tabla `ARMAS` (stats 2024 de las 12 del catálogo) + `armaDe`. |
| `lib/turno.ts` (crear) | Economía de turno pura sobre `PlayState`. |
| `scripts/check-turno.ts` (crear) | Comprobación de `lib/turno.ts`. |
| `lib/ataque.ts` (crear) | Cálculo puro de un ataque (característica, impacto, daño, competencia). |
| `scripts/check-ataque.ts` (crear) | Comprobación de `lib/ataque.ts`. |
| `components/personaje/EconomiaTurno.tsx` (crear) | UI de la economía de turno. |
| `components/personaje/Ataques.tsx` (crear) | UI de la lista de ataques. |
| `components/CharacterSheet.tsx` (modificar) | Montar ambos componentes + suscripción de reset por turno. |
| `app/dm/GrupoPanel.tsx` (modificar) | Montar ambos componentes bajo cada jugador. |

---

## Task 1: `PlayState` gana la clave `turno`

**Files:**
- Modify: `lib/recursos.ts` (el tipo `PlayState`)

- [ ] **Step 1: Añadir la clave `turno` al tipo**

En `lib/recursos.ts`, dentro de `export type PlayState = { ... }`, añadir el campo
`turno` **justo antes** de la línea `[otros: string]: unknown;`:

```ts
  /** Economía del turno de combate actual (G2); ausente ⇒ turno fresco. */
  turno?: {
    accion?: boolean;      // acción gastada
    adicional?: boolean;   // acción adicional gastada
    reaccion?: boolean;    // reacción gastada
    movGastado?: number;   // metros ya movidos este turno
  };
```

- [ ] **Step 2: Verificar que compila**

Run: `cd /c/Users/carlo/Downloads/dnd-campaign-app && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
cd /c/Users/carlo/Downloads/dnd-campaign-app && git add lib/recursos.ts && git commit -F - <<'EOF'
feat(turno): PlayState gana la clave turno

accion/adicional/reaccion/movGastado como economia del turno de combate, en el
mismo jsonb de la Fase O. Sin migracion.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 2: Tabla de armas (`data/weapons.ts`)

**Files:**
- Create: `data/weapons.ts`

- [ ] **Step 1: Crear el archivo con la tabla y el lector**

```ts
// Estadísticas de combate de las armas del catálogo (data/equipment.ts).
// Son datos mecánicos de las 2024 (hechos), no prosa: dado, tipo, alcance y
// propiedades. Keyed por el nombre EXACTO de CATALOG.Armas.

export type Arma = {
  nombre: string;
  categoria: "sencilla" | "marcial";
  dado: string;            // "1d8" (formato de lib/dice.ts)
  tipo: "cortante" | "perforante" | "contundente";
  alcance: "cuerpo" | "distancia";
  sutil?: boolean;         // finesse: elige la mejor de Fue/Des
  versatil?: string;       // dado a dos manos (informativo en G2)
};

export const ARMAS: Record<string, Arma> = {
  "Daga": { nombre: "Daga", categoria: "sencilla", dado: "1d4", tipo: "perforante", alcance: "cuerpo", sutil: true },
  "Espada corta": { nombre: "Espada corta", categoria: "marcial", dado: "1d6", tipo: "perforante", alcance: "cuerpo", sutil: true },
  "Espada larga": { nombre: "Espada larga", categoria: "marcial", dado: "1d8", tipo: "cortante", alcance: "cuerpo", versatil: "1d10" },
  "Hacha de mano": { nombre: "Hacha de mano", categoria: "sencilla", dado: "1d6", tipo: "cortante", alcance: "cuerpo" },
  "Maza": { nombre: "Maza", categoria: "sencilla", dado: "1d6", tipo: "contundente", alcance: "cuerpo" },
  "Bastón": { nombre: "Bastón", categoria: "sencilla", dado: "1d6", tipo: "contundente", alcance: "cuerpo", versatil: "1d8" },
  "Arco corto": { nombre: "Arco corto", categoria: "sencilla", dado: "1d6", tipo: "perforante", alcance: "distancia" },
  "Arco largo": { nombre: "Arco largo", categoria: "marcial", dado: "1d8", tipo: "perforante", alcance: "distancia" },
  "Ballesta ligera": { nombre: "Ballesta ligera", categoria: "sencilla", dado: "1d8", tipo: "perforante", alcance: "distancia" },
  "Lanza": { nombre: "Lanza", categoria: "sencilla", dado: "1d6", tipo: "perforante", alcance: "cuerpo", versatil: "1d8" },
  "Martillo de guerra": { nombre: "Martillo de guerra", categoria: "marcial", dado: "1d8", tipo: "contundente", alcance: "cuerpo", versatil: "1d10" },
  "Cimitarra": { nombre: "Cimitarra", categoria: "marcial", dado: "1d6", tipo: "cortante", alcance: "cuerpo", sutil: true },
};

/** El arma de ese nombre, o null si el objeto no es un arma del catálogo. */
export function armaDe(nombre: string): Arma | null {
  return ARMAS[nombre] ?? null;
}
```

- [ ] **Step 2: Verificar que compila**

Run: `cd /c/Users/carlo/Downloads/dnd-campaign-app && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
cd /c/Users/carlo/Downloads/dnd-campaign-app && git add data/weapons.ts && git commit -F - <<'EOF'
feat(armas): tabla de estadisticas de las 12 armas del catalogo

Dado, tipo, alcance y propiedades (sutil, versatil) de cada arma de CATALOG.Armas,
stats 2024. armaDe(nombre) devuelve el arma o null.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 3: Economía de turno pura (`lib/turno.ts`)

**Files:**
- Create: `lib/turno.ts`

- [ ] **Step 1: Crear el módulo**

```ts
// Economía del turno de combate 2024, PURO (sin React ni Supabase). Molde de
// lib/recursos.ts / lib/estado.ts. Fusiona play_state, no toca usos/hp/conds.
import type { PlayState } from "@/lib/recursos";

export type Recurso = "accion" | "adicional" | "reaccion";

/** Lee la economía del turno; ausente ⇒ todo libre, movGastado 0. */
export function turnoDe(play: PlayState): { accion: boolean; adicional: boolean; reaccion: boolean; movGastado: number } {
  const t = play.turno ?? {};
  return {
    accion: !!t.accion,
    adicional: !!t.adicional,
    reaccion: !!t.reaccion,
    movGastado: Math.max(0, Math.floor(t.movGastado ?? 0)),
  };
}

function conTurno(play: PlayState, cambio: Partial<NonNullable<PlayState["turno"]>>): PlayState {
  return { ...play, turno: { ...(play.turno ?? {}), ...cambio } };
}

/** Marca un recurso como gastado. */
export function gastar(play: PlayState, r: Recurso): PlayState {
  return conTurno(play, { [r]: true });
}

/** Desmarca un recurso (deshacer). */
export function devolver(play: PlayState, r: Recurso): PlayState {
  return conTurno(play, { [r]: false });
}

/** Invierte el estado de un recurso (toque manual en la UI). */
export function alternarRecurso(play: PlayState, r: Recurso): PlayState {
  return conTurno(play, { [r]: !turnoDe(play)[r] });
}

/** Avanza (o retrocede, con `metros` negativo) el movimiento, en [0, velocidad]. */
export function mover(play: PlayState, metros: number, velocidad: number): PlayState {
  const actual = turnoDe(play).movGastado;
  const next = Math.max(0, Math.min(velocidad, actual + metros));
  return conTurno(play, { movGastado: next });
}

/** Metros que quedan por mover este turno. */
export function movRestante(play: PlayState, velocidad: number): number {
  return Math.max(0, velocidad - turnoDe(play).movGastado);
}

/** Limpia el turno (empieza tu turno): borra la clave `turno`. */
export function limpiarTurno(play: PlayState): PlayState {
  const next = { ...play };
  delete next.turno;
  return next;
}
```

- [ ] **Step 2: Verificar que compila**

Run: `cd /c/Users/carlo/Downloads/dnd-campaign-app && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
cd /c/Users/carlo/Downloads/dnd-campaign-app && git add lib/turno.ts && git commit -F - <<'EOF'
feat(turno): capa pura de la economia de turno

turnoDe, gastar, devolver, alternarRecurso, mover (topado a velocidad),
movRestante y limpiarTurno. Fusiona play_state sin tocar usos/hp/conds.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 4: Script `check-turno`

**Files:**
- Create: `scripts/check-turno.ts`

- [ ] **Step 1: Crear el script**

```ts
// Comprobación de la economía de turno. Uso: npx tsx scripts/check-turno.ts
import { turnoDe, gastar, devolver, alternarRecurso, mover, movRestante, limpiarTurno } from "../lib/turno";
import type { PlayState } from "../lib/recursos";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const vacio: PlayState = {};

// Turno ausente ⇒ todo libre.
const t0 = turnoDe(vacio);
check("turno ausente: accion libre", t0.accion === false);
check("turno ausente: movGastado 0", t0.movGastado === 0);

// Gastar / devolver / alternar.
check("gastar accion", turnoDe(gastar(vacio, "accion")).accion === true);
check("devolver accion", turnoDe(devolver(gastar(vacio, "accion"), "accion")).accion === false);
check("alternar reaccion dos veces vuelve al inicio", turnoDe(alternarRecurso(alternarRecurso(vacio, "reaccion"), "reaccion")).reaccion === false);
check("gastar adicional no toca accion", turnoDe(gastar(vacio, "adicional")).accion === false);

// Movimiento.
check("mover avanza", turnoDe(mover(vacio, 3, 9)).movGastado === 3);
check("mover topa en velocidad", turnoDe(mover(vacio, 99, 9)).movGastado === 9);
check("mover no baja de 0", turnoDe(mover(vacio, -5, 9)).movGastado === 0);
check("movRestante correcto", movRestante(mover(vacio, 3, 9), 9) === 6);

// limpiarTurno borra la clave y no toca lo demás.
const sucio: PlayState = { usos: { furias: 1 }, hp: 12, conds: ["envenenado"], turno: { accion: true, movGastado: 6 } };
const limpio = limpiarTurno(sucio);
check("limpiarTurno borra la clave turno", limpio.turno === undefined);
check("limpiarTurno no toca usos", JSON.stringify(limpio.usos) === JSON.stringify({ furias: 1 }));
check("limpiarTurno no toca hp", limpio.hp === 12);
check("limpiarTurno no toca conds", JSON.stringify(limpio.conds) === JSON.stringify(["envenenado"]));

// gastar no toca usos/hp.
const g = gastar({ usos: { foco: 2 }, hp: 5 }, "accion");
check("gastar no toca usos", JSON.stringify(g.usos) === JSON.stringify({ foco: 2 }));
check("gastar no toca hp", g.hp === 5);

if (failures) { console.log(`\n${failures} FALLos`); process.exit(1); }
console.log("\nTodo en verde");
```

- [ ] **Step 2: Ejecutar y ver todo en verde**

Run: `cd /c/Users/carlo/Downloads/dnd-campaign-app && npx tsx scripts/check-turno.ts`
Expected: solo `OK` y `Todo en verde`, salida 0. Si algo sale `FAIL`, corregir `lib/turno.ts` (no el script salvo aserción mal planteada) y repetir.

- [ ] **Step 3: Commit**

```bash
cd /c/Users/carlo/Downloads/dnd-campaign-app && git add scripts/check-turno.ts && git commit -F - <<'EOF'
test(turno): comprobacion de la economia de turno

Gastar/devolver/alternar cada recurso, mover topado a velocidad y con suelo 0,
movRestante, y que limpiarTurno borre la clave sin tocar usos/hp/conds.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 5: Cálculo de ataque puro (`lib/ataque.ts`)

**Files:**
- Create: `lib/ataque.ts`

- [ ] **Step 1: Crear el módulo**

```ts
// Cálculo PURO de un ataque con arma (2024). Traduce un arma + la ficha derivada
// en los números de la tirada: característica usada, modificador de impacto,
// competencia y dado/modificador de daño. Sin React ni Supabase.
import type { Arma } from "@/data/weapons";

export type Ataque = {
  caracteristica: "fue" | "des";
  modImpacto: number;   // mod de característica + (competencia si aplica)
  competente: boolean;
  dadoDaño: string;     // el dado del arma, p. ej. "1d8"
  modDaño: number;      // el mod de la característica usada
};

/**
 * `abilities`: los MODS de característica (de derive.ts, campo `.mod`).
 * `prof`: bono de competencia. `classWeapons`: `getMechanics(cls).weapons`
 * ("sencillas"/"marciales"). Reglas 2024: distancia⇒Des, cuerpo sin sutil⇒Fue,
 * sutil⇒la mejor de Fue/Des; competente si la categoría del arma está entre las
 * de la clase; impacto = mod + (prof si competente); daño = dado + mod.
 */
export function ataqueDe(
  arma: Arma,
  abilities: { fue: number; des: number },
  prof: number,
  classWeapons: string[],
): Ataque {
  let caracteristica: "fue" | "des";
  if (arma.alcance === "distancia") caracteristica = "des";
  else if (arma.sutil) caracteristica = abilities.des >= abilities.fue ? "des" : "fue";
  else caracteristica = "fue";

  const mod = abilities[caracteristica];
  const competente = arma.categoria === "sencilla"
    ? classWeapons.includes("sencillas")
    : classWeapons.includes("marciales");

  return {
    caracteristica,
    modImpacto: mod + (competente ? prof : 0),
    competente,
    dadoDaño: arma.dado,
    modDaño: mod,
  };
}
```

- [ ] **Step 2: Verificar que compila**

Run: `cd /c/Users/carlo/Downloads/dnd-campaign-app && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
cd /c/Users/carlo/Downloads/dnd-campaign-app && git add lib/ataque.ts && git commit -F - <<'EOF'
feat(ataque): calculo puro de un ataque con arma

ataqueDe elige la caracteristica (cuerpo=Fue, distancia=Des, sutil=la mejor),
deriva la competencia de la categoria del arma y las armas de la clase, y calcula
impacto (mod + competencia) y dano (dado + mod).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 6: Script `check-ataque`

**Files:**
- Create: `scripts/check-ataque.ts`

- [ ] **Step 1: Crear el script**

```ts
// Comprobación del cálculo de ataque. Uso: npx tsx scripts/check-ataque.ts
import { ataqueDe } from "../lib/ataque";
import { ARMAS } from "../data/weapons";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const guerrero = ["sencillas", "marciales"];
const mago = ["sencillas"];
// Fue 3, Des 1 (mods), prof 2.
const fuerte = { fue: 3, des: 1 };
// Fue 0, Des 4.
const agil = { fue: 0, des: 4 };

// Espada larga (marcial, cuerpo, no sutil) ⇒ Fue; competente para guerrero.
const el = ataqueDe(ARMAS["Espada larga"], fuerte, 2, guerrero);
check("espada larga usa Fue", el.caracteristica === "fue");
check("espada larga competente para guerrero", el.competente === true);
check("espada larga impacto = 3 + 2", el.modImpacto === 5);
check("espada larga daño = 1d8", el.dadoDaño === "1d8");
check("espada larga modDaño = 3", el.modDaño === 3);

// Espada larga para el mago ⇒ marcial, NO competente.
const elMago = ataqueDe(ARMAS["Espada larga"], fuerte, 2, mago);
check("espada larga NO competente para mago", elMago.competente === false);
check("espada larga sin competencia: impacto = 3 (sin prof)", elMago.modImpacto === 3);

// Arco corto (sencilla, distancia) ⇒ Des; competente para el mago (sencillas).
const arco = ataqueDe(ARMAS["Arco corto"], agil, 2, mago);
check("arco corto usa Des", arco.caracteristica === "des");
check("arco corto competente para mago (sencilla)", arco.competente === true);
check("arco corto impacto = 4 + 2", arco.modImpacto === 6);

// Daga (sutil) con Des > Fue ⇒ elige Des.
const daga = ataqueDe(ARMAS["Daga"], agil, 2, mago);
check("daga sutil elige Des (mejor)", daga.caracteristica === "des");
check("daga modDaño = 4", daga.modDaño === 4);

// Daga (sutil) con Fue > Des ⇒ elige Fue.
const dagaFuerte = ataqueDe(ARMAS["Daga"], fuerte, 2, mago);
check("daga sutil elige Fue cuando es mejor", dagaFuerte.caracteristica === "fue");

if (failures) { console.log(`\n${failures} FALLos`); process.exit(1); }
console.log("\nTodo en verde");
```

- [ ] **Step 2: Ejecutar y ver todo en verde**

Run: `cd /c/Users/carlo/Downloads/dnd-campaign-app && npx tsx scripts/check-ataque.ts`
Expected: solo `OK` y `Todo en verde`. Si algo falla, corregir `lib/ataque.ts` y repetir.

- [ ] **Step 3: Commit**

```bash
cd /c/Users/carlo/Downloads/dnd-campaign-app && git add scripts/check-ataque.ts && git commit -F - <<'EOF'
test(ataque): comprobacion del calculo de ataque

Espada larga (Fue, competente para guerrero, no para mago), arco corto (Des,
sencilla), daga sutil (elige la mejor de Fue/Des), y que el impacto sume la
competencia solo cuando aplica.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 7: Componente `EconomiaTurno`

**Files:**
- Create: `components/personaje/EconomiaTurno.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
"use client";
import { turnoDe, alternarRecurso, mover, movRestante, type Recurso } from "@/lib/turno";
import type { PlayState } from "@/lib/recursos";

// Economía del turno de combate: acción, adicional, reacción (chapas pulsables)
// y movimiento (contador en metros). Mismo contrato que EstadoVivo/PozosClase.
const RECURSOS: { key: Recurso; label: string; icon: string }[] = [
  { key: "accion", label: "Acción", icon: "bolt" },
  { key: "adicional", label: "Adicional", icon: "wand-sparkles" },
  { key: "reaccion", label: "Reacción", icon: "reply" },
];

export default function EconomiaTurno({
  play, velocidad, onChange, readOnly = false,
}: {
  play: PlayState;
  velocidad: number;
  onChange: (next: PlayState) => void;
  readOnly?: boolean;
}) {
  const t = turnoDe(play);
  const restante = movRestante(play, velocidad);

  return (
    <div className="mb-4">
      <p className="font-ui text-[12px] font-bold mb-1.5" style={{ color: "var(--color-parch)" }}>Turno</p>
      <div className="flex gap-1.5 flex-wrap mb-2">
        {RECURSOS.map((r) => {
          const gastada = t[r.key];
          return (
            <button
              key={r.key} disabled={readOnly}
              onClick={() => onChange(alternarRecurso(play, r.key))}
              title={gastada ? "Gastada — toca para recuperar" : "Libre — toca para gastar"}
              className="font-ui text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors disabled:cursor-default flex items-center gap-1.5"
              style={{
                color: gastada ? "var(--color-dim)" : "var(--color-ink)",
                background: gastada ? "transparent" : "var(--color-primitivo)",
                border: `1px solid var(--color-${gastada ? "line" : "primitivo"})`,
              }}
            >
              <i className={`fas fa-${r.icon}`} />{r.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-ui text-[12px]" style={{ color: "var(--color-warm)" }}>
          <i className="fas fa-shoe-prints mr-1.5" style={{ color: "var(--color-primitivo)" }} />
          Movimiento: <strong style={{ color: "var(--color-parch)" }}>{restante}</strong> / {velocidad} m
        </span>
        {!readOnly && (
          <span className="flex gap-1">
            <button className="btn-ghost !py-0.5 !px-2 text-[12px]" onClick={() => onChange(mover(play, 1.5, velocidad))} title="Mover 1,5 m">−1,5</button>
            <button className="btn-ghost !py-0.5 !px-2 text-[12px]" onClick={() => onChange(mover(play, -1.5, velocidad))} title="Deshacer 1,5 m">+1,5</button>
          </span>
        )}
      </div>
    </div>
  );
}
```

> Nota: el botón «−1,5» **gasta** movimiento (avanza `movGastado`, baja el
> restante); «+1,5» lo devuelve. Las etiquetas son desde la vista del jugador
> («me quedan menos / más»).

- [ ] **Step 2: Verificar compila y construye**

Run: `cd /c/Users/carlo/Downloads/dnd-campaign-app && npx tsc --noEmit && npx next build`
Expected: ambos limpios.

- [ ] **Step 3: Commit**

```bash
cd /c/Users/carlo/Downloads/dnd-campaign-app && git add components/personaje/EconomiaTurno.tsx && git commit -F - <<'EOF'
feat(turno): componente EconomiaTurno

Chapas pulsables de accion/adicional/reaccion y contador de movimiento en metros
con -/+ de 1,5 m. Mismo contrato que EstadoVivo.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 8: Componente `Ataques`

**Files:**
- Create: `components/personaje/Ataques.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
"use client";
import { useState } from "react";
import { armaDe } from "@/data/weapons";
import { ataqueDe } from "@/lib/ataque";
import { gastar, turnoDe } from "@/lib/turno";
import { ventajaDe } from "@/lib/estado";
import { publishRoll } from "@/lib/useDiceFeed";
import { fmtMod } from "@/data/rules";
import type { PlayState } from "@/lib/recursos";

// Lista de ataques con las armas del inventario que existen en la tabla ARMAS.
// Cada una tira impacto (d20 + mod, con la ventaja de G1) y daño (dado + mod), y
// marca la acción gastada. Sin sesión no hay tirada (solo se listan los números).
// `items` solo necesita `.name` (se desacopla de Item para que el panel DM pueda
// pasarle el inventario del jugador sin castear al tipo completo).
export default function Ataques({
  play, items, abilities, prof, classWeapons, sessionId, onChange, readOnly = false,
}: {
  play: PlayState;
  items: { name: string }[];
  abilities: { fue: number; des: number };
  prof: number;
  classWeapons: string[];
  sessionId: string | null;
  onChange: (next: PlayState) => void;
  readOnly?: boolean;
}) {
  const [err, setErr] = useState<string | null>(null);
  const armas = items.map((it) => armaDe(it.name)).filter((a): a is NonNullable<typeof a> => !!a);
  // Únicas por nombre (no listar dos veces la misma arma apilada).
  const vistas = new Set<string>();
  const lista = armas.filter((a) => (vistas.has(a.nombre) ? false : (vistas.add(a.nombre), true)));
  if (lista.length === 0) return null;

  const accionGastada = turnoDe(play).accion;

  async function atacar(nombre: string, modImpacto: number, dadoDaño: string, modDaño: number) {
    if (!sessionId || readOnly) return;
    setErr(null);
    const { error } = await publishRoll(sessionId, "attack", `Ataque: ${nombre}`, "1d20", { mod: modImpacto, adv: ventajaDe(play, "ataque") ?? undefined });
    if (error) { setErr(error); return; }
    const formulaDaño = `${dadoDaño}${modDaño >= 0 ? "+" : ""}${modDaño}`;
    const { error: e2 } = await publishRoll(sessionId, "custom", `Daño: ${nombre}`, formulaDaño);
    if (e2) { setErr(e2); return; }
    onChange(gastar(play, "accion"));
  }

  return (
    <div className="mb-4">
      <p className="font-ui text-[12px] font-bold mb-1.5" style={{ color: "var(--color-parch)" }}>Ataques</p>
      <div className="space-y-1.5">
        {lista.map((arma) => {
          const atk = ataqueDe(arma, abilities, prof, classWeapons);
          return (
            <div key={arma.nombre} className="panel-raised px-3 py-2 flex items-center justify-between gap-2">
              <div>
                <p className="font-ui text-[13px] font-bold" style={{ color: "var(--color-parch)" }}>{arma.nombre}</p>
                <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
                  impacto {fmtMod(atk.modImpacto)} · daño {arma.dado}{atk.modDaño !== 0 ? fmtMod(atk.modDaño) : ""} {arma.tipo}
                  {!atk.competente && " · no competente"}
                </p>
              </div>
              {sessionId && !readOnly && (
                <button
                  className="btn-gold !py-1 !px-3 text-[12px]"
                  title={accionGastada ? "Ya gastaste la acción (desmárcala en el turno para volver a atacar)" : "Atacar (gasta la acción)"}
                  onClick={() => atacar(arma.nombre, atk.modImpacto, atk.dadoDaño, atk.modDaño)}
                >
                  <i className="fas fa-khanda mr-1.5" />Atacar
                </button>
              )}
            </div>
          );
        })}
      </div>
      {err && <p className="text-[12px] mt-1 italic" style={{ color: "var(--color-ember)" }}>{err}</p>}
    </div>
  );
}
```

> Nota: el botón de atacar no se **deshabilita** cuando la acción está gastada (a
> propósito: el DM puede permitir un segundo ataque, y Extra Attack está fuera de
> alcance); el `title` avisa. Marcar/desmarcar la acción se hace en `EconomiaTurno`.

- [ ] **Step 2: Verificar compila y construye**

Run: `cd /c/Users/carlo/Downloads/dnd-campaign-app && npx tsc --noEmit && npx next build`
Expected: ambos limpios.

- [ ] **Step 3: Commit**

```bash
cd /c/Users/carlo/Downloads/dnd-campaign-app && git add components/personaje/Ataques.tsx && git commit -F - <<'EOF'
feat(ataque): componente Ataques

Lista las armas del inventario que existen en ARMAS. Cada una muestra impacto y
dano calculados por ataqueDe y, con sesion, un boton que tira impacto (con la
ventaja de G1) y dano, y gasta la accion.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 9: Montar ambos componentes en la hoja

**Files:**
- Modify: `components/CharacterSheet.tsx` (imports; sección «Estado de combate» ~donde se montó `EstadoVivo`)

- [ ] **Step 1: Importar los componentes y `getSpecies` (si no está)**

En los imports de `components/CharacterSheet.tsx`, junto a `import EstadoVivo from "@/components/personaje/EstadoVivo"`:

```tsx
import EconomiaTurno from "@/components/personaje/EconomiaTurno";
import Ataques from "@/components/personaje/Ataques";
```

`getSpecies` ya está importado (se usa para `species.speed` en la sección de
derivados). `getMechanics` ya está importado (`data/classdata`). Verificar que
existen esos imports; si `getMechanics` no estuviera, añadir
`import { getMechanics } from "@/data/classdata";` — pero **ya está** (se usa para
los rasgos de clase).

- [ ] **Step 2: Montar los componentes en la sección «Estado de combate»**

Localizar la sección que monta `<EstadoVivo ... />` (la de eyebrow «Estado de
combate»). Dentro de esa `<section>`, **después** del `<EstadoVivo .../>`, añadir:

```tsx
            <EconomiaTurno
              play={playState}
              velocidad={species?.speed ?? 9}
              onChange={onPlayStateChange}
              readOnly={readOnly && saveMode !== "self"}
            />
            <Ataques
              play={playState}
              items={items}
              abilities={{ fue: d.abilities.fue.mod, des: d.abilities.des.mod }}
              prof={d.prof}
              classWeapons={getMechanics(build.cls)?.weapons ?? []}
              sessionId={isOwner ? session!.id : null}
              onChange={onPlayStateChange}
              readOnly={readOnly && saveMode !== "self"}
            />
```

`species`, `d`, `items`, `build`, `isOwner`, `session`, `playState`,
`onPlayStateChange`, `readOnly`, `saveMode` ya están todos en alcance en el render
(los usa `EstadoVivo` y el resto de la hoja).

- [ ] **Step 3: Verificar compila y construye**

Run: `cd /c/Users/carlo/Downloads/dnd-campaign-app && npx tsc --noEmit && npx next build`
Expected: ambos limpios.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/carlo/Downloads/dnd-campaign-app && git add components/CharacterSheet.tsx && git commit -F - <<'EOF'
feat(turno): la hoja muestra la economia de turno y los ataques

EconomiaTurno y Ataques bajo EstadoVivo en la seccion de combate. La velocidad
sale de la especie, la competencia de armas de la clase, y el ataque tira desde
la ficha del dueno con sesion.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 10: Reset automático al tocarte el turno

**Files:**
- Modify: `components/CharacterSheet.tsx` (un `useRef` + un `useEffect` de suscripción a `initiative`)

- [ ] **Step 1: Añadir el ref del `active` previo**

Junto al `lastWrittenPlay` ref que ya existe (añadido en G1), añadir:

```tsx
  // `active` previo de mi fila de iniciativa: el turno se limpia solo en la
  // transición false→true (empieza mi turno), no en cada evento.
  const prevActive = useRef(false);
```

- [ ] **Step 2: Añadir el `useEffect` de suscripción a la propia fila de iniciativa**

Después del `useEffect` de suscripción a `characters` que se añadió en G1 (el que
limpia el estado en vivo), añadir:

```tsx
  // Reset del turno: al pasar mi fila de iniciativa a `active` (empieza mi
  // turno), limpiar la economía del turno. `initiative` ya está en la
  // publicación realtime (schema_v11). Solo la ficha propia.
  useEffect(() => {
    if (saveMode !== "self" || !targetUserId) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`sheet_ini_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "initiative", filter: `user_id=eq.${targetUserId}` },
        (payload) => {
          const active = !!(payload.new as { active?: boolean }).active;
          if (active && !prevActive.current) {
            // Empieza mi turno: limpiar la economía. Se usa el play_state más
            // reciente vía el setter funcional para no depender de un cierre viejo.
            setPlayState((prev) => {
              const next = limpiarTurno(prev);
              lastWrittenPlay.current = JSON.stringify(next);
              if (characterId) void saveCharacter(characterId, { play_state: next });
              return next;
            });
          }
          prevActive.current = active;
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [saveMode, targetUserId, characterId]);
```

- [ ] **Step 3: Importar `limpiarTurno`**

En los imports, añadir:

```tsx
import { limpiarTurno } from "@/lib/turno";
```

- [ ] **Step 4: Verificar compila y construye**

Run: `cd /c/Users/carlo/Downloads/dnd-campaign-app && npx tsc --noEmit && npx next build`
Expected: ambos limpios.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/carlo/Downloads/dnd-campaign-app && git add components/CharacterSheet.tsx && git commit -F - <<'EOF'
feat(turno): el turno se limpia solo al tocarte en la iniciativa

La hoja (self) se suscribe a su fila de initiative; en la transicion a active
(empieza tu turno) limpia la economia via saveCharacter. Un ref guarda el active
previo para disparar solo en el flanco. initiative ya publica realtime.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 11: Montar ambos componentes en el panel del DM

**Files:**
- Modify: `app/dm/GrupoPanel.tsx` (imports; bajo la sección «Estado de combate» que montó `EstadoVivo` en G1)

- [ ] **Step 1: Importar lo necesario**

Junto a `import EstadoVivo from "@/components/personaje/EstadoVivo"`:

```tsx
import EconomiaTurno from "@/components/personaje/EconomiaTurno";
import Ataques from "@/components/personaje/Ataques";
import { getMechanics } from "@/data/classdata";
```

`getSpecies` ya está importado en `GrupoPanel.tsx` (para el nombre de especie);
verificar y, si no estuviera, añadir `import { getSpecies } from "@/data/species";`
— pero **ya está** (línea de imports de datos).

- [ ] **Step 2: Montar bajo el `EstadoVivo` del DM**

Localizar el `<EstadoVivo ... onChange={(next) => dmPatch(c.user_id, { play_state: next })} />`
añadido en G1. Justo **después**, añadir:

```tsx
                <EconomiaTurno
                  play={(c.play_state as PlayState) ?? {}}
                  velocidad={getSpecies(c.species ?? "")?.speed ?? 9}
                  onChange={(next) => dmPatch(c.user_id, { play_state: next })}
                />
                <Ataques
                  play={(c.play_state as PlayState) ?? {}}
                  items={Array.isArray(c.inventory) ? (c.inventory as unknown as { name: string }[]) : []}
                  abilities={{ fue: d.abilities.fue.mod, des: d.abilities.des.mod }}
                  prof={d.prof}
                  classWeapons={getMechanics(c.cls)?.weapons ?? []}
                  sessionId={null}
                  onChange={(next) => dmPatch(c.user_id, { play_state: next })}
                />
```

`sessionId={null}` a propósito: el DM ajusta la economía pero **no dispara**
tiradas de ataque en nombre del jugador (sin sesión, `Ataques` solo lista los
números). `c.species`, `c.cls`, `c.inventory`, `d` ya están en alcance en el bucle
(igual que el `EstadoVivo` y `PozosClase` del DM).

> **Comprobar el nombre del campo de inventario**: el `EstadoVivo`/`PozosClase` del
> DM usan `c.play_state`; el inventario del jugador en `useParty` es `c.inventory`
> (array de objetos con `.name`). Si al compilar `c.inventory` no existiera en el
> tipo de `party`, mirar cómo lo lee el bloque de inventario del propio
> `GrupoPanel` (hay un `c.inventory.map(...)` en la ficha desplegada) y usar el
> mismo acceso. `Ataques` solo necesita objetos con `.name`.

- [ ] **Step 3: Verificar compila y construye**

Run: `cd /c/Users/carlo/Downloads/dnd-campaign-app && npx tsc --noEmit && npx next build`
Expected: ambos limpios. Si `c.inventory` da error de tipo, ajustar el acceso como
indica la nota (el bloque de inventario existente de `GrupoPanel` es la referencia).

- [ ] **Step 4: Commit**

```bash
cd /c/Users/carlo/Downloads/dnd-campaign-app && git add app/dm/GrupoPanel.tsx && git commit -F - <<'EOF'
feat(turno): el DM ve la economia de turno y los ataques del grupo

EconomiaTurno y Ataques bajo el EstadoVivo de cada jugador, en modo escritura via
dmPatch. Sin sesion: el DM ajusta la economia pero no dispara ataques en nombre
del jugador (solo lista los numeros).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 12: Gate final, HANDOFF y merge

**Files:**
- Modify: `HANDOFF.md`

- [ ] **Step 1: Correr todos los gates**

Run: `cd /c/Users/carlo/Downloads/dnd-campaign-app && npx tsc --noEmit && npx next build && npx tsx scripts/check-turno.ts && npx tsx scripts/check-ataque.ts && npx tsx scripts/check-estado.ts && npx tsx scripts/check-clases.ts && npx tsx scripts/check-lore.ts`
Expected: build limpio; `Todo en verde` en check-turno, check-ataque y check-estado; check-clases (116) y check-lore (69) sin regresión.

- [ ] **Step 2: Añadir la sección RESUELTO al HANDOFF**

Al principio de las secciones RESUELTO de `HANDOFF.md` (antes de la de G1 del
2026-07-23), añadir:

```markdown
## RESUELTO (2026-07-24): G2 — economía de turno y ataque desde la ficha ⚔️⏱️
Rama `g2-economia-turno`. **Sin migración.** Spec y plan en
`docs/superpowers/{specs,plans}/2026-07-24-g2-economia-de-turno*`. Segunda losa
de la jugabilidad 2024, sobre G1.

- **`data/weapons.ts`**: stats 2024 de las 12 armas del catálogo (dado, tipo,
  alcance, sutil, versátil). `armaDe(nombre)`.
- **`lib/turno.ts`** (puro): economía del turno sobre `play_state.turno` —
  acción/adicional/reacción (booleanos) + movimiento en metros. `limpiarTurno`
  borra la clave. No toca `usos`/`hp`/`conds`.
- **`lib/ataque.ts`** (puro): `ataqueDe(arma, abilities, prof, classWeapons)` —
  elige la característica (cuerpo→Fue, distancia→Des, sutil→la mejor), deriva la
  competencia de `classdata.weapons` × la categoría del arma, y calcula impacto
  (mod + competencia) y daño (dado + mod).
- **`EconomiaTurno.tsx`** (chapas de acción/adicional/reacción + contador de
  movimiento) y **`Ataques.tsx`** (lista las armas del inventario que existen en
  `ARMAS`; botón que tira impacto con la ventaja de G1 y daño, y gasta la acción).
  Montados en la hoja y en Panel DM › Grupo.
- **Reset automático**: la hoja `self` se suscribe a su fila de `initiative`; al
  pasar a `active` (empieza tu turno) limpia el turno. `initiative` ya publica.
- **Ataque = kinds existentes**: impacto con `"attack"` (ya en `D20_KINDS`, anima
  como d20 y aplica adv), daño con `"custom"` (fórmula). Sin `RollKind` nuevos.
- Verificado: `tsc` + `next build` limpios · **`check-turno` y `check-ataque` en
  verde** · check-estado (35), check-clases (116), check-lore (69) sin regresión.
  **No probado en vivo sin sesión.** Prueba del usuario: atacar y ver que gasta la
  acción; «Siguiente turno» hasta que te toque y ver la economía limpia sin
  recargar; arma competente vs no competente en el impacto; envenenado ⇒ 2d20 la
  peor en el ataque.
```

- [ ] **Step 3: Commit del HANDOFF**

```bash
cd /c/Users/carlo/Downloads/dnd-campaign-app && git add HANDOFF.md && git commit -F - <<'EOF'
docs(handoff): G2 economia de turno y ataque desde la ficha

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

- [ ] **Step 4: Merge a master y push** (tras revisión del usuario)

```bash
cd /c/Users/carlo/Downloads/dnd-campaign-app && git checkout master && git merge --no-ff g2-economia-turno -m "merge: G2 economia de turno y ataque desde la ficha

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" && git push origin master && git branch -d g2-economia-turno
```

Actualizar el vault de Obsidian (`00 Meta/Historial de desarrollo.md`) con una
entrada de G2, en paralelo.

---

## Notas para quien ejecute

- **Convención de contenido**: las stats de armas son **hechos** 2024. No hay
  prosa que redactar aquí.
- **No probar en el navegador con sesión** no es posible en dev (sin
  credenciales); el gate real es `tsc` + `build` + los scripts.
- Ante dudas de API de Next 16, leer `node_modules/next/dist/docs/`
  (`AGENTS.md`), no tirar de memoria.
- **Ojo con `git add`**: solo los archivos de cada tarea, nunca `-A`.
