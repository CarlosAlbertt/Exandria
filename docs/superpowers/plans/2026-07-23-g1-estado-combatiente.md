# G1 — Estado del combatiente — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la ficha lleve el estado de combate 2024 — PG actuales, temporales, salvaciones de muerte, condiciones y agotamiento — editable por jugador y DM, en vivo, y que las condiciones apliquen ventaja/desventaja de verdad a las tiradas de salvación y pericia.

**Architecture:** Una capa pura nueva (`lib/estado.ts`) resuelve PG, muerte, condiciones y el resolvedor de ventaja/desventaja sobre `PlayState`; un componente (`EstadoVivo.tsx`) la pinta con el contrato de `PozosClase`; se monta en la hoja y en el panel del DM; los botones de tirada de la hoja pasan el `adv` calculado; y la hoja del jugador se suscribe a su fila para verlo en vivo. Todo el estado va en `characters.play_state` (jsonb) — **sin migración**.

**Tech Stack:** Next.js 16 · React 19 · TypeScript · Supabase (Postgres + Realtime). Sin framework de tests: el gate es `npx tsc --noEmit` + `npx next build`, y lo puro se verifica con un script (`scripts/check-estado.ts`), patrón de `scripts/check-clases.ts`.

**Spec:** `docs/superpowers/specs/2026-07-23-g1-estado-combatiente-design.md`

**Rama:** `g1-estado-combatiente` (ya creada, parte de `master`; el spec ya está commiteado en ella).

---

## Sobre los tests en este repo

No hay framework de tests. El ciclo TDD se hace con un **script de comprobación**
(`scripts/check-estado.ts`) que imprime `OK`/`FAIL` por aserción y sale con
código ≠ 0 si algo falla, igual que `check-clases.ts`. «Ver el test fallar» =
ejecutar el script y ver `FAIL` (o un error de import) antes de implementar;
«pasar» = verlo todo en `OK`.

Cada tarea acaba en commit. Autor `CarlosAlbertt`; trailer
`Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Para mensajes con
backticks, `git commit -F -` con heredoc (bash ejecuta los backticks si no).
**Nunca `git add -A` a ciegas**: añadir solo los archivos tocados.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `lib/recursos.ts` (modificar) | Ampliar el tipo `PlayState` con `hp`/`tempHp`/`muerte`/`conds`/`agotamiento`. |
| `lib/estado.ts` (crear) | Capa pura: datos de condiciones/agotamiento + funciones de PG, muerte, condiciones y el resolvedor `ventajaDe`. |
| `scripts/check-estado.ts` (crear) | Comprobación de la capa pura. |
| `components/personaje/EstadoVivo.tsx` (crear) | UI: barra de PG, salvaciones de muerte, condiciones, agotamiento. Contrato de `PozosClase`. |
| `components/CharacterSheet.tsx` (modificar) | Montar `EstadoVivo`; pasar `adv` a los botones de salvación/pericia; suscribir la fila propia en vivo. |
| `app/dm/GrupoPanel.tsx` (modificar) | Montar `EstadoVivo` bajo cada jugador; el `Stat` «PG máx» pasa a `actual / máx`. |

Orden de tareas: primero el tipo y la capa pura (con su script), luego la UI, luego los tres puntos de montaje/cableado. Cada una compila y verifica sola.

---

## Task 1: Ampliar el tipo `PlayState`

**Files:**
- Modify: `lib/recursos.ts:9-13`

- [ ] **Step 1: Ampliar el tipo**

En `lib/recursos.ts`, reemplazar el bloque del tipo `PlayState` (líneas 9-13):

```ts
/** Estado de juego de la ficha. La Fase O2 añadirá `huecos`/`preparados`. */
export type PlayState = {
  usos?: Record<string, number>;
  /** PG actuales; ausente ⇒ el máximo (una ficha nueva está a tope). */
  hp?: number;
  /** PG temporales; se restan antes que `hp` y no exceden el daño recibido. */
  tempHp?: number;
  /** Salvaciones de muerte a 0 PG; presente solo mientras estás a 0. */
  muerte?: { ok: number; fail: number };
  /** Slugs de condición activa: ["envenenado", "derribado"]. */
  conds?: string[];
  /** Nivel de agotamiento 0–6. */
  agotamiento?: number;
  [otros: string]: unknown;
};
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores (el tipo se amplía con campos opcionales; nada existente se rompe).

- [ ] **Step 3: Commit**

```bash
git add lib/recursos.ts
git commit -F - <<'EOF'
feat(estado): PlayState gana los campos de combate

hp, tempHp, muerte, conds y agotamiento como claves opcionales del mismo jsonb
de la Fase O. Sin migracion: characters.play_state ya existe.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 2: Datos de condiciones y agotamiento (`lib/estado.ts`)

**Files:**
- Create: `lib/estado.ts`

- [ ] **Step 1: Crear el módulo con los datos**

Crear `lib/estado.ts`. Textos de regla = **redacción propia** (convención del repo, patrón `EFECTOS` de `lib/weather.ts`):

```ts
// Estado de combate 2024, PURO (sin React ni Supabase). Mismo espíritu que
// lib/recursos.ts / lib/derive.ts. Las mecánicas son hechos de las 2024; los
// textos de efecto son resúmenes propios, nunca prosa de los libros.
import type { PlayState } from "@/lib/recursos";

/** Sobre qué tiradas PROPIAS impone (des)ventaja una condición. */
export type TipoTirada = "ataque" | "prueba" | "salvez";

export type Condicion = {
  slug: string;
  name: string;
  icon: string;      // Font Awesome, sin el prefijo "fa-"
  regla: string;     // resumen propio del efecto
  desventaja?: TipoTirada[]; // desventaja en tus propias tiradas de estos tipos
};

// Las 15 condiciones de 2024. `desventaja` solo recoge lo EXACTO sin más
// contexto (ver el spec): lo que la RAW acota a una característica, o lo que da
// ventaja al atacante, no se modela aquí.
export const CONDICIONES: Condicion[] = [
  { slug: "cegado", name: "Cegado", icon: "eye-slash",
    regla: "No ves: fallas cualquier prueba que dependa de la vista. Atacar es con desventaja y quien te ataca lo hace con ventaja." },
  { slug: "hechizado", name: "Hechizado", icon: "heart",
    regla: "No puedes atacar a quien te hechizó ni elegirlo como objetivo de efectos dañinos. Esa criatura te influye con ventaja en tratos sociales." },
  { slug: "ensordecido", name: "Ensordecido", icon: "ear-deaf",
    regla: "No oyes: fallas cualquier prueba que dependa del oído." },
  { slug: "asustado", name: "Asustado", icon: "face-fearful",
    regla: "Mientras veas la fuente del miedo, tiras con desventaja las pruebas y los ataques, y no puedes acercarte a ella por tu voluntad.",
    desventaja: ["ataque", "prueba"] },
  { slug: "apresado", name: "Apresado", icon: "hand-back-fist",
    regla: "Tu velocidad es 0 y no te beneficias de bonificadores a ella. Termina si quien te apresa queda incapacitado o te sacan de su alcance." },
  { slug: "incapacitado", name: "Incapacitado", icon: "ban",
    regla: "No puedes realizar acciones, acciones adicionales ni reacciones. Se rompe tu concentración." },
  { slug: "invisible", name: "Invisible", icon: "ghost",
    regla: "No te ven sin ayuda mágica o un sentido especial. Atacas con ventaja y quien te ataca lo hace con desventaja." },
  { slug: "paralizado", name: "Paralizado", icon: "person-falling",
    regla: "Estás incapacitado, no te mueves ni hablas. Fallas las salvaciones de Fuerza y Destreza. Un ataque a menos de 1,5 m es crítico si acierta." },
  { slug: "petrificado", name: "Petrificado", icon: "gem",
    regla: "Te has vuelto piedra: incapacitado, sin moverte ni hablar, con resistencia a todo el daño e inmune a veneno y enfermedad. Fallas las salvaciones de Fuerza y Destreza." },
  { slug: "envenenado", name: "Envenenado", icon: "flask-vial",
    regla: "Tiras con desventaja las tiradas de ataque y las pruebas de característica.",
    desventaja: ["ataque", "prueba"] },
  { slug: "derribado", name: "Derribado", icon: "person-falling-burst",
    regla: "Solo puedes arrastrarte o gastar la mitad de tu velocidad en levantarte. Atacas con desventaja; quien te ataca a menos de 1,5 m lo hace con ventaja, y a distancia con desventaja.",
    desventaja: ["ataque"] },
  { slug: "restringido", name: "Restringido", icon: "link",
    regla: "Tu velocidad es 0. Atacas con desventaja y quien te ataca lo hace con ventaja. Salvas Destreza con desventaja.",
    desventaja: ["ataque"] },
  { slug: "aturdido", name: "Aturdido", icon: "star",
    regla: "Estás incapacitado, no te mueves y hablas con dificultad. Fallas las salvaciones de Fuerza y Destreza. Quien te ataca lo hace con ventaja." },
  { slug: "inconsciente", name: "Inconsciente", icon: "bed",
    regla: "Estás incapacitado, tirado y sin saber qué pasa. Sueltas lo que llevas. Fallas las salvaciones de Fuerza y Destreza; quien te ataca lo hace con ventaja, y a menos de 1,5 m es crítico si acierta." },
];

// Agotamiento 2024: cada nivel resta -2 acumulativo a las pruebas de d20 y
// -1,5 m de velocidad; a nivel 6, mueres. Índice 0 = "sin agotamiento".
export const AGOTAMIENTO: string[] = [
  "Sin agotamiento.",
  "Nivel 1: -2 a las pruebas de d20 y -1,5 m de velocidad.",
  "Nivel 2: -4 a las pruebas de d20 y -3 m de velocidad.",
  "Nivel 3: -6 a las pruebas de d20 y -4,5 m de velocidad.",
  "Nivel 4: -8 a las pruebas de d20 y -6 m de velocidad.",
  "Nivel 5: -10 a las pruebas de d20 y -7,5 m de velocidad.",
  "Nivel 6: mueres.",
];
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add lib/estado.ts
git commit -F - <<'EOF'
feat(estado): datos de las 15 condiciones y del agotamiento 2024

Redaccion propia del efecto de cada condicion. El campo desventaja solo recoge
lo exacto sin mas contexto (envenenado, asustado, derribado, restringido en
ataque); lo que la RAW acota a una caracteristica o da ventaja al atacante no se
modela aqui.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 3: Funciones puras de PG y muerte

**Files:**
- Modify: `lib/estado.ts`

- [ ] **Step 1: Añadir las funciones de PG y muerte al final de `lib/estado.ts`**

```ts
// --- PG ----------------------------------------------------------------------

/** PG actuales; `hp` ausente ⇒ el máximo. Siempre en [0, maxHp]. */
export function pgActuales(play: PlayState, maxHp: number): number {
  const hp = typeof play.hp === "number" ? play.hp : maxHp;
  return Math.max(0, Math.min(maxHp, Math.floor(hp)));
}

/** PG temporales, nunca negativos. */
export function pgTemp(play: PlayState): number {
  return Math.max(0, Math.floor(play.tempHp ?? 0));
}

/** ¿Está a 0 PG (caído, tirando salvaciones)? */
export function estaAbajo(play: PlayState, maxHp: number): boolean {
  return pgActuales(play, maxHp) === 0;
}

/**
 * Aplica daño: come primero los temporales, luego los actuales, suelo 0.
 * Si YA estaba a 0 PG, no baja de 0 pero marca un fallo de muerte (dos si el
 * golpe fue crítico).
 */
export function aplicarDaño(play: PlayState, n: number, maxHp: number, critico = false): PlayState {
  const dmg = Math.max(0, Math.floor(n));
  if (estaAbajo(play, maxHp)) {
    const fails = critico ? 2 : 1;
    let next = play;
    for (let i = 0; i < fails; i++) next = marcarMuerte(next, "fail");
    return next;
  }
  const temp = pgTemp(play);
  const usadoTemp = Math.min(temp, dmg);
  const resto = dmg - usadoTemp;
  const hp = pgActuales(play, maxHp) - resto;
  return { ...play, tempHp: temp - usadoTemp, hp: Math.max(0, hp) };
}

/** Cura: sube los PG (techo maxHp). Levanta (borra `muerte`). No toca temporales. */
export function curar(play: PlayState, n: number, maxHp: number): PlayState {
  const cura = Math.max(0, Math.floor(n));
  const hp = Math.min(maxHp, pgActuales(play, maxHp) + cura);
  const next = { ...play, hp };
  delete next.muerte;
  return next;
}

/** Fija los PG temporales al valor dado (suelo 0). */
export function setTemp(play: PlayState, n: number): PlayState {
  return { ...play, tempHp: Math.max(0, Math.floor(n)) };
}

// --- Salvaciones de muerte ---------------------------------------------------

function muerteDe(play: PlayState): { ok: number; fail: number } {
  return { ok: play.muerte?.ok ?? 0, fail: play.muerte?.fail ?? 0 };
}

/** Marca un éxito o un fallo de salvación de muerte (tope 3). */
export function marcarMuerte(play: PlayState, tipo: "ok" | "fail"): PlayState {
  const m = muerteDe(play);
  m[tipo] = Math.min(3, m[tipo] + 1);
  return { ...play, muerte: m };
}

/** Desmarca un éxito o fallo (deshacer un toque, suelo 0). */
export function desmarcarMuerte(play: PlayState, tipo: "ok" | "fail"): PlayState {
  const m = muerteDe(play);
  m[tipo] = Math.max(0, m[tipo] - 1);
  return { ...play, muerte: m };
}

/** Veredicto de las salvaciones de muerte. `null` si no estás tirando. */
export function resultadoMuerte(play: PlayState): "estable" | "muerto" | "tirando" | null {
  if (!play.muerte) return null;
  const { ok, fail } = muerteDe(play);
  if (fail >= 3) return "muerto";
  if (ok >= 3) return "estable";
  return "tirando";
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add lib/estado.ts
git commit -F - <<'EOF'
feat(estado): funciones puras de PG y salvaciones de muerte

Se guarda el PG actual absoluto; ausente = maximo. El dano come temporales
primero; a 0 PG marca fallo de muerte (dos si critico). Curar levanta y limpia
las salvaciones. Todas fusionan play_state sin tocar usos.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 4: Condiciones, agotamiento y el resolvedor de ventaja

**Files:**
- Modify: `lib/estado.ts`

- [ ] **Step 1: Añadir al final de `lib/estado.ts`**

```ts
// --- Condiciones y agotamiento -----------------------------------------------

/** Activa/desactiva una condición por su slug. */
export function alternarCondicion(play: PlayState, slug: string): PlayState {
  const conds = play.conds ?? [];
  const next = conds.includes(slug) ? conds.filter((c) => c !== slug) : [...conds, slug];
  return { ...play, conds: next };
}

/** Fija el nivel de agotamiento, acotado a [0, 6]. */
export function setAgotamiento(play: PlayState, n: number): PlayState {
  return { ...play, agotamiento: Math.max(0, Math.min(6, Math.floor(n))) };
}

// --- Resolvedor de ventaja/desventaja ---------------------------------------

/**
 * Dada la lista de condiciones activas, resuelve la (des)ventaja sobre un tipo
 * de tirada PROPIA, con la regla de anulación 2024: si hay al menos una fuente
 * de ventaja Y una de desventaja, tiras un solo d20 (`null`).
 *
 * En G1 casi todo son desventajas de condición; se escribe con las dos caras
 * para que G2/G3 (esquivar, ayuda, cobertura) sumen fuentes sin reescribirlo.
 * No muta `play`: es una consulta.
 */
export function ventajaDe(play: PlayState, tipo: TipoTirada): "adv" | "dis" | null {
  const activas = new Set(play.conds ?? []);
  let hayVent = false;
  let hayDesv = false;
  for (const c of CONDICIONES) {
    if (!activas.has(c.slug)) continue;
    if (c.desventaja?.includes(tipo)) hayDesv = true;
    // (ninguna condición de G1 da ventaja propia; el gancho queda para G2/G3)
  }
  if (hayVent && hayDesv) return null;
  if (hayDesv) return "dis";
  if (hayVent) return "adv";
  return null;
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add lib/estado.ts
git commit -F - <<'EOF'
feat(estado): condiciones, agotamiento y el resolvedor de ventaja

alternarCondicion / setAgotamiento fusionan play_state. ventajaDe resuelve la
(des)ventaja sobre una tirada propia con la regla de anulacion 2024 (ventaja y
desventaja a la vez = un solo d20). Escrito con las dos caras para que G2/G3
sumen fuentes sin reescribirlo.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 5: Script de comprobación de la capa pura

**Files:**
- Create: `scripts/check-estado.ts`

- [ ] **Step 1: Escribir el script (verlo fallar por import inexistente antes de esta tarea no aplica: el módulo ya existe; el «fallo» es cualquier aserción en rojo)**

Crear `scripts/check-estado.ts`:

```ts
// Comprobación manual del estado de combate. Uso: npx tsx scripts/check-estado.ts
import {
  CONDICIONES, AGOTAMIENTO,
  pgActuales, pgTemp, estaAbajo, aplicarDaño, curar, setTemp,
  marcarMuerte, desmarcarMuerte, resultadoMuerte,
  alternarCondicion, setAgotamiento, ventajaDe,
} from "../lib/estado";
import type { PlayState } from "../lib/recursos";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// --- Datos ---
check("hay 15 condiciones", CONDICIONES.length === 15);
check("slugs de condición únicos", new Set(CONDICIONES.map((c) => c.slug)).size === 15);
check("toda condición tiene regla no vacía", CONDICIONES.every((c) => c.regla.trim().length > 0));
check("agotamiento tiene 7 entradas (0–6)", AGOTAMIENTO.length === 7);
check("nivel 6 de agotamiento es la muerte", /muer/i.test(AGOTAMIENTO[6]));

// --- PG ---
const vacio: PlayState = {};
check("hp ausente = maxHp", pgActuales(vacio, 20) === 20);
check("hp se acota al máximo", pgActuales({ hp: 999 }, 20) === 20);
check("hp no baja de 0", pgActuales({ hp: -5 }, 20) === 0);
check("pgTemp por defecto 0", pgTemp(vacio) === 0);

const dañado = aplicarDaño({ hp: 20 }, 7, 20);
check("daño baja los PG", pgActuales(dañado, 20) === 13);
check("daño no marca muerte si aún tienes PG", !dañado.muerte);

const conTemp = aplicarDaño({ hp: 20, tempHp: 5 }, 7, 20);
check("el daño come temporales primero", pgTemp(conTemp) === 0 && pgActuales(conTemp, 20) === 18);

const alSuelo = aplicarDaño({ hp: 3 }, 50, 20);
check("el daño masivo deja los PG en 0, no negativos", pgActuales(alSuelo, 20) === 0);

check("no toca usos", JSON.stringify(aplicarDaño({ hp: 20, usos: { furias: 1 } }, 5, 20).usos) === JSON.stringify({ furias: 1 }));

// --- Muerte ---
const abajo: PlayState = { hp: 0 };
check("estaAbajo a 0 PG", estaAbajo(abajo, 20));
const golpeAbajo = aplicarDaño(abajo, 4, 20);
check("daño a 0 PG marca un fallo de muerte", golpeAbajo.muerte?.fail === 1);
const critAbajo = aplicarDaño(abajo, 4, 20, true);
check("daño crítico a 0 PG marca dos fallos", critAbajo.muerte?.fail === 2);

let m: PlayState = { hp: 0, muerte: { ok: 0, fail: 0 } };
m = marcarMuerte(marcarMuerte(marcarMuerte(m, "fail"), "fail"), "fail");
check("tres fallos = muerto", resultadoMuerte(m) === "muerto");
check("marcarMuerte topa en 3", marcarMuerte(m, "fail").muerte?.fail === 3);
let s: PlayState = { hp: 0, muerte: { ok: 2, fail: 1 } };
s = marcarMuerte(s, "ok");
check("tres éxitos = estable", resultadoMuerte(s) === "estable");
check("desmarcar resta", desmarcarMuerte({ hp: 0, muerte: { ok: 1, fail: 0 } }, "ok").muerte?.ok === 0);
check("sin muerte, resultado null", resultadoMuerte({ hp: 5 }) === null);

const levantado = curar({ hp: 0, muerte: { ok: 1, fail: 2 } }, 3, 20);
check("curar sube los PG", pgActuales(levantado, 20) === 3);
check("curar borra las salvaciones de muerte", !levantado.muerte);

check("setTemp fija los temporales", pgTemp(setTemp(vacio, 8)) === 8);
check("setTemp no baja de 0", pgTemp(setTemp(vacio, -3)) === 0);

// --- Condiciones y agotamiento ---
const env = alternarCondicion(vacio, "envenenado");
check("alternar añade la condición", env.conds?.includes("envenenado") === true);
check("alternar de nuevo la quita", alternarCondicion(env, "envenenado").conds?.includes("envenenado") === false);
check("setAgotamiento acota a 6", setAgotamiento(vacio, 9).agotamiento === 6);
check("setAgotamiento acota a 0", setAgotamiento(vacio, -1).agotamiento === 0);

// --- Resolvedor de ventaja ---
check("envenenado ⇒ desventaja en ataque", ventajaDe(env, "ataque") === "dis");
check("envenenado ⇒ desventaja en prueba", ventajaDe(env, "prueba") === "dis");
check("envenenado NO afecta a salvaciones", ventajaDe(env, "salvez") === null);
check("sin condiciones ⇒ null", ventajaDe(vacio, "prueba") === null);
check("derribado ⇒ desventaja solo en ataque", ventajaDe(alternarCondicion(vacio, "derribado"), "ataque") === "dis" && ventajaDe(alternarCondicion(vacio, "derribado"), "prueba") === null);

if (failures) { console.log(`\n${failures} FALLos`); process.exit(1); }
console.log("\nTodo en verde");
```

- [ ] **Step 2: Ejecutar el script y ver todo en verde**

Run: `npx tsx scripts/check-estado.ts`
Expected: solo líneas `OK` y `Todo en verde`, salida 0. Si alguna sale `FAIL`, corregir `lib/estado.ts` (no el script salvo que la aserción esté mal planteada) y repetir.

- [ ] **Step 3: Commit**

```bash
git add scripts/check-estado.ts
git commit -F - <<'EOF'
test(estado): comprobacion de la capa pura de combate

Datos (15 condiciones, agotamiento 0-6), PG (ausente=max, temporales primero,
suelo 0, no toca usos), salvaciones de muerte (fallo a 0 PG, critico=2, veredicto
3/3, curar limpia) y el resolvedor de ventaja (envenenado en ataque/prueba pero
no salvacion, derribado solo ataque, anulacion).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 6: Componente `EstadoVivo`

**Files:**
- Create: `components/personaje/EstadoVivo.tsx`

- [ ] **Step 1: Crear el componente**

Contrato de `PozosClase` (`play`, `onChange`, `readOnly`) más `maxHp`. Reutiliza el patrón visual de los puntos pulsables de `PozosClase.tsx`.

```tsx
"use client";
import { useState } from "react";
import {
  CONDICIONES, AGOTAMIENTO,
  pgActuales, pgTemp, estaAbajo, aplicarDaño, curar, setTemp,
  marcarMuerte, desmarcarMuerte, resultadoMuerte,
  alternarCondicion, setAgotamiento,
} from "@/lib/estado";
import type { PlayState } from "@/lib/recursos";

// Estado de combate de la ficha: PG actuales/temporales, salvaciones de muerte,
// condiciones y agotamiento. Puro de estado: recibe `play` y emite el siguiente
// por `onChange` (guardado optimista, mismo contrato que PozosClase).
export default function EstadoVivo({
  play, maxHp, onChange, readOnly = false,
}: {
  play: PlayState;
  maxHp: number;
  onChange: (next: PlayState) => void;
  readOnly?: boolean;
}) {
  const [dmg, setDmg] = useState("");
  const hp = pgActuales(play, maxHp);
  const temp = pgTemp(play);
  const abajo = estaAbajo(play, maxHp);
  const ratio = maxHp > 0 ? hp / maxHp : 0;
  const veredicto = resultadoMuerte(play);
  const nivelAgot = play.agotamiento ?? 0;

  const num = () => Math.max(0, Math.floor(Number(dmg) || 0));
  const barColor = ratio > 0.5 ? "var(--color-primitivo)" : ratio > 0.25 ? "var(--color-divino)" : "var(--color-ember)";

  return (
    <div className="mb-4 space-y-4">
      {/* --- PG --- */}
      <div>
        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          <p className="font-ui text-[13px] font-bold" style={{ color: "var(--color-parch)" }}>
            <i className="fas fa-heart mr-1.5" style={{ color: "var(--color-ember)" }} />Puntos de golpe
          </p>
          <p className="font-display text-lg font-extrabold" style={{ color: abajo ? "var(--color-ember)" : "var(--color-parch)" }}>
            {hp} <span className="text-[13px]" style={{ color: "var(--color-dim)" }}>/ {maxHp}</span>
            {temp > 0 && <span className="ml-2 text-[13px]" style={{ color: "var(--color-arcane)" }}><i className="fas fa-shield-halved mr-1" />{temp}</span>}
          </p>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--color-night)" }}>
          <div className="h-full transition-all" style={{ width: `${Math.round(ratio * 100)}%`, background: barColor }} />
        </div>
        {abajo && <p className="font-ui text-[12px] italic mt-1" style={{ color: "var(--color-ember)" }}><i className="fas fa-skull mr-1.5" />Caído — tira salvaciones de muerte.</p>}

        {!readOnly && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <input
              type="number" value={dmg} onChange={(e) => setDmg(e.target.value)} placeholder="0"
              className="w-16 text-center bg-[var(--color-night)] rounded-lg px-2 py-1 font-ui text-sm outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]"
            />
            <button className="btn-ghost !py-1 !px-3 text-[12px]" onClick={() => { onChange(aplicarDaño(play, num(), maxHp)); setDmg(""); }}>
              <i className="fas fa-heart-crack mr-1.5" style={{ color: "var(--color-ember)" }} />Daño
            </button>
            <button className="btn-ghost !py-1 !px-3 text-[12px]" onClick={() => { onChange(curar(play, num(), maxHp)); setDmg(""); }}>
              <i className="fas fa-heart-circle-plus mr-1.5" style={{ color: "var(--color-primitivo)" }} />Curar
            </button>
            <button className="btn-ghost !py-1 !px-3 text-[12px]" onClick={() => { onChange(setTemp(play, num())); setDmg(""); }}>
              <i className="fas fa-shield-halved mr-1.5" style={{ color: "var(--color-arcane)" }} />Temp.
            </button>
          </div>
        )}
      </div>

      {/* --- Salvaciones de muerte (solo a 0 PG) --- */}
      {abajo && (
        <div>
          <p className="font-ui text-[12px] font-bold mb-1.5" style={{ color: "var(--color-parch)" }}>Salvaciones de muerte</p>
          <div className="flex items-center gap-4 flex-wrap">
            <MuerteFila label="Éxitos" tipo="ok" color="var(--color-primitivo)" n={play.muerte?.ok ?? 0} play={play} onChange={onChange} readOnly={readOnly} />
            <MuerteFila label="Fallos" tipo="fail" color="var(--color-ember)" n={play.muerte?.fail ?? 0} play={play} onChange={onChange} readOnly={readOnly} />
          </div>
          {veredicto === "estable" && <p className="font-ui text-[12px] mt-1.5" style={{ color: "var(--color-primitivo)" }}>Estable.</p>}
          {veredicto === "muerto" && <p className="font-ui text-[12px] mt-1.5" style={{ color: "var(--color-ember)" }}>Ha caído.</p>}
        </div>
      )}

      {/* --- Condiciones --- */}
      <div>
        <p className="font-ui text-[12px] font-bold mb-1.5" style={{ color: "var(--color-parch)" }}>Condiciones</p>
        <div className="flex gap-1.5 flex-wrap">
          {CONDICIONES.map((c) => {
            const activa = (play.conds ?? []).includes(c.slug);
            return (
              <button
                key={c.slug} disabled={readOnly} title={c.regla}
                onClick={() => onChange(alternarCondicion(play, c.slug))}
                className="font-ui text-[11px] font-bold px-2 py-1 rounded-full transition-colors disabled:cursor-default flex items-center gap-1.5"
                style={{
                  color: activa ? "var(--color-ink)" : "var(--color-muted)",
                  background: activa ? "var(--color-ember)" : "transparent",
                  border: `1px solid var(--color-${activa ? "ember" : "line"})`,
                }}
              >
                <i className={`fas fa-${c.icon}`} />{c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- Agotamiento --- */}
      <div>
        <p className="font-ui text-[12px] font-bold mb-1.5" style={{ color: "var(--color-parch)" }}>Agotamiento</p>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n} disabled={readOnly}
              onClick={() => onChange(setAgotamiento(play, n))}
              className="w-7 h-7 rounded-md font-ui text-[12px] font-bold transition-colors disabled:cursor-default"
              style={{
                color: n <= nivelAgot && n > 0 ? "var(--color-ink)" : "var(--color-muted)",
                background: n <= nivelAgot && n > 0 ? "var(--color-ember)" : "transparent",
                border: `1px solid var(--color-${n === nivelAgot ? "bronze" : "line"})`,
              }}
            >{n}</button>
          ))}
        </div>
        <p className="font-ui text-[12px] italic mt-1" style={{ color: nivelAgot === 6 ? "var(--color-ember)" : "var(--color-dim)" }}>{AGOTAMIENTO[nivelAgot]}</p>
      </div>
    </div>
  );
}

// Una fila de 3 casillas pulsables de salvación de muerte (éxitos o fallos).
function MuerteFila({
  label, tipo, color, n, play, onChange, readOnly,
}: {
  label: string; tipo: "ok" | "fail"; color: string; n: number;
  play: PlayState; onChange: (p: PlayState) => void; readOnly: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>{label}</span>
      {[0, 1, 2].map((i) => {
        const marcado = i < n;
        return (
          <button
            key={i} disabled={readOnly}
            onClick={() => onChange(marcado ? desmarcarMuerte(play, tipo) : marcarMuerte(play, tipo))}
            className="w-5 h-5 rounded-full transition-colors disabled:cursor-default"
            style={{ background: marcado ? color : "transparent", border: `2px solid ${color}` }}
          />
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add components/personaje/EstadoVivo.tsx
git commit -F - <<'EOF'
feat(estado): componente EstadoVivo (PG, muerte, condiciones, agotamiento)

Barra de PG con boton de dano/curar/temporales, salvaciones de muerte que
aparecen a 0 PG, condiciones como chapas pulsables con la regla en el tooltip y
agotamiento 0-6. Mismo contrato que PozosClase: play + onChange + readOnly.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 7: Montar `EstadoVivo` en la hoja y cablear la (des)ventaja

**Files:**
- Modify: `components/CharacterSheet.tsx` (import ~línea 22; montaje junto al bloque de PG máx ~523; botones de salvación :578 y pericia :613)

- [ ] **Step 1: Importar `EstadoVivo` y `ventajaDe`**

Junto a los demás imports de `components/CharacterSheet.tsx` (cerca de la línea 21-23, donde se importa `PozosClase`/`publishRoll`/`PlayState`), añadir:

```tsx
import EstadoVivo from "@/components/personaje/EstadoVivo";
import { ventajaDe } from "@/lib/estado";
```

(Si `PozosClase` no está importado aún porque está en otra sección, buscar el import existente de `@/components/personaje/PozosClase` y poner el nuevo al lado; y el de `ventajaDe` junto al `import type { PlayState } from "@/lib/recursos"`.)

- [ ] **Step 2: Montar `EstadoVivo` bajo el bloque de estadísticas derivadas**

En el JSX, localizar el `<Derived icon="fa-heart" label="PG máx" value={d.maxHp} ... />` (~línea 523). Inmediatamente **después del contenedor** que agrupa esos `Derived` (el bloque de PG máx/Competencia/Velocidad), insertar:

```tsx
          <EstadoVivo
            play={playState}
            maxHp={d.maxHp}
            onChange={onPlayStateChange}
            readOnly={readOnly && saveMode !== "self"}
          />
```

`readOnly` sigue la misma lógica que `canRollHp`: el dueño puede editar su estado aunque la ficha llegue como `readOnly` por `?user=` (saveMode "self"). El DM editando la ficha de otro (`saveMode "dm"`) no está en `readOnly`, así que puede editar.

- [ ] **Step 3: Pasar la (des)ventaja al botón de salvación**

En el `onClick` del botón de tirar salvación (~línea 577-580), añadir `adv` a las opciones de `publishRoll`:

```tsx
                        onClick={async () => {
                          const { error } = await publishRoll(session!.id, "save", `Salvación de ${a.name}`, "1d20", { mod: sv.mod, adv: ventajaDe(playState, "salvez") ?? undefined });
                          setRollErr(error);
                        }}
```

- [ ] **Step 4: Pasar la (des)ventaja al botón de pericia**

En el `onClick` del botón de tirar pericia (~línea 612-615):

```tsx
                        onClick={async () => {
                          const { error } = await publishRoll(session!.id, "skill", s.name, "1d20", { mod: s.mod, adv: ventajaDe(playState, "prueba") ?? undefined });
                          setRollErr(error);
                        }}
```

- [ ] **Step 5: Verificar que compila y construye**

Run: `npx tsc --noEmit && npx next build`
Expected: ambos limpios.

- [ ] **Step 6: Commit**

```bash
git add components/CharacterSheet.tsx
git commit -F - <<'EOF'
feat(estado): la hoja muestra el estado de combate y las condiciones muerden

Monta EstadoVivo bajo las estadisticas derivadas. Los botones de salvacion y
pericia pasan el adv que resuelve ventajaDe(playState, ...): con envenenado o
asustado se tiran 2d20 y se queda la peor, y el feed ya rotula (desventaja).
publishRoll ya aceptaba opts.adv, asi que la cadena de dados no se toca.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 8: Montar `EstadoVivo` en el panel del DM

**Files:**
- Modify: `app/dm/GrupoPanel.tsx` (import ~línea 14; `Stat` de PG máx :295 y :313; montaje bajo cada jugador cerca del `PozosClase` :322)

- [ ] **Step 1: Importar `EstadoVivo` y las funciones de PG**

Junto al import de `PozosClase` (`app/dm/GrupoPanel.tsx:14`):

```tsx
import EstadoVivo from "@/components/personaje/EstadoVivo";
import { pgActuales } from "@/lib/estado";
```

- [ ] **Step 2: El `Stat` «PG máx» pasa a `actual / máx`**

Hay dos `Stat` de PG máx (líneas 295 y 313). En **ambos**, cambiar el `value` para mostrar los actuales sobre el máximo. Reemplazar:

```tsx
              <Stat icon="fa-heart" label="PG máx" value={d.maxHp} color="var(--color-ember)" />
```

por (en los dos sitios):

```tsx
              <Stat icon="fa-heart" label="PG" value={`${pgActuales((c.play_state as PlayState) ?? {}, d.maxHp)} / ${d.maxHp}`} color="var(--color-ember)" />
```

(`c` es el personaje del jugador en el bucle y `d = derive(...)` ya está en alcance en ese punto — es el mismo `d` que usa el `Stat` original.)

- [ ] **Step 3: Montar `EstadoVivo` bajo cada jugador**

Localizar el `<PozosClase ... />` (~línea 322-327). Justo **antes** de él (para que el estado de combate quede encima de los pozos de clase), insertar:

```tsx
                    <EstadoVivo
                      play={(c.play_state as PlayState) ?? {}}
                      maxHp={d.maxHp}
                      onChange={(next) => dmPatch(c.user_id, { play_state: next })}
                    />
```

`dmPatch` (ya definido en `GrupoPanel.tsx:19`) manda `play_state` completo; el `next` que emite `EstadoVivo` se construye desde `c.play_state` (que `useParty` mantiene fresco por Realtime) y conserva **todas** las claves — `usos` de O1 incluido —, así que el reemplazo directo no pisa nada. Es el mismo trato que ya hace la hoja en modo DM (`onPlayStateChange`).

- [ ] **Step 4: Verificar que compila y construye**

Run: `npx tsc --noEmit && npx next build`
Expected: ambos limpios.

- [ ] **Step 5: Commit**

```bash
git add app/dm/GrupoPanel.tsx
git commit -F - <<'EOF'
feat(estado): el DM ve y edita el estado de combate del grupo

Bajo cada jugador, EstadoVivo en modo escritura via dmPatch (play_state
completo, construido desde el snapshot fresco de useParty, conserva usos). El
Stat de PG pasa a mostrar actual / maximo.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 9: La hoja del jugador se suscribe a su fila (en vivo)

**Files:**
- Modify: `components/CharacterSheet.tsx` (import del cliente; un `useEffect` nuevo; un `useRef` para el guard anti-eco)

- [ ] **Step 1: Importar el cliente y `useRef`**

En `components/CharacterSheet.tsx`, añadir `useRef` a la importación de React existente, y el cliente de Supabase:

```tsx
import { createClient } from "@/lib/supabase/client";
```

(`useRef` se añade a la línea `import { useState, useEffect, ... } from "react"` ya presente.)

- [ ] **Step 2: Ref que recuerda la última escritura propia (guard anti-eco)**

Cerca de los `useState` del componente (p. ej. junto a `const [playState, setPlayState] = useState<PlayState>({})`, ~línea 88), añadir:

```tsx
  // Última play_state que ESTE cliente escribió: para ignorar el eco de Realtime
  // de la propia escritura y no pisar un segundo toque rápido del jugador.
  const lastWrittenPlay = useRef<string | null>(null);
```

Y en `onPlayStateChange` (~línea 325), registrar lo que se escribe **al principio** de la función:

```tsx
  const onPlayStateChange = (next: PlayState) => {
    lastWrittenPlay.current = JSON.stringify(next);
    setPlayState(next);
    // ... (resto igual)
```

- [ ] **Step 3: `useEffect` de suscripción a la fila propia**

Añadir un `useEffect` nuevo (después del efecto de carga que depende de `[targetUserId]`, ~línea 185). Solo se suscribe en modo `self` con sesión (la ficha del propio jugador):

```tsx
  // En vivo: si el DM (u otra pestaña) cambia mi ficha, reflejar el estado de
  // combate sin recargar. Solo la ficha propia (self). `characters` ya está en
  // la publicación realtime (schema_v4). Se refresca SOLO el estado de juego,
  // no el build (que podría estarse editando en /crear).
  useEffect(() => {
    if (saveMode !== "self" || !targetUserId) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`sheet_rt_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "characters", filter: `user_id=eq.${targetUserId}` },
        (payload) => {
          const row = payload.new as { play_state?: PlayState; gold?: number };
          if (row.play_state && typeof row.play_state === "object") {
            // Ignora el eco de mi propia escritura.
            if (JSON.stringify(row.play_state) !== lastWrittenPlay.current) {
              setPlayState(row.play_state as PlayState);
            }
          }
          if (typeof row.gold === "number") setGold(row.gold);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [saveMode, targetUserId]);
```

- [ ] **Step 4: Verificar que compila y construye**

Run: `npx tsc --noEmit && npx next build`
Expected: ambos limpios.

- [ ] **Step 5: Commit**

```bash
git add components/CharacterSheet.tsx
git commit -F - <<'EOF'
feat(estado): la ficha del jugador refleja los cambios del DM en vivo

CharacterSheet (self) se suscribe a postgres_changes de su fila (characters ya
publica). Al llegar un UPDATE refresca play_state y gold, no el build. Un ref
guarda la ultima escritura propia para ignorar su eco y no pisar un segundo
toque rapido. Canal con nombre unico por montaje.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 10: Gate final y actualizar el HANDOFF

**Files:**
- Modify: `HANDOFF.md`

- [ ] **Step 1: Correr todos los gates juntos**

Run: `npx tsc --noEmit && npx next build && npx tsx scripts/check-estado.ts && npx tsx scripts/check-clases.ts && npx tsx scripts/check-lore.ts`
Expected: build limpio, `Todo en verde` en check-estado, y check-clases (116) / check-lore (69) sin regresiones.

- [ ] **Step 2: Añadir la sección RESUELTO al HANDOFF**

Al principio de las secciones RESUELTO de `HANDOFF.md` (antes de la del 2026-07-23 de los dorados), añadir:

```markdown
## RESUELTO (2026-07-23): G1 — estado del combatiente ⚔️❤️
Rama `g1-estado-combatiente`. **Sin migración.** Spec y plan en
`docs/superpowers/{specs,plans}/2026-07-23-g1-estado-combatiente*`. Primera losa
de la jugabilidad de combate 2024 (siguen G2 economía de turno, G3 tablero, O2
conjuros).

- **`lib/estado.ts`** (puro): PG actuales/temporales, salvaciones de muerte,
  condiciones (15 de 2024) y agotamiento (0–6), todo sobre `play_state` sin
  tocar `usos`. Se guarda el PG absoluto; ausente = máximo. Daño come temporales
  primero; a 0 PG marca fallo de muerte (2 si crítico); curar levanta y limpia.
- **La app aplica la regla**: `ventajaDe(conds, tipo)` resuelve (des)ventaja con
  la anulación 2024, y los botones de salvación y pericia de la hoja pasan ese
  `adv` a `publishRoll` (que ya lo aceptaba). Envenenado/asustado ⇒ 2d20 la peor.
  Acotado con honestidad: fallo automático de salvación y ventaja para el
  atacante necesitan otro combatiente → G3; la salvación de Des de «restringido»
  se omite hasta que el botón pase la característica.
- **`EstadoVivo.tsx`**: barra de PG con daño/curar/temporales, salvaciones de
  muerte a 0 PG, condiciones como chapas con la regla en el tooltip, agotamiento.
  Montado en la hoja y en Panel DM › Grupo (que además muestra PG actual/máx).
- **En vivo**: la hoja `self` se suscribe a su fila; el DM te pega y lo ves sin
  recargar, con guard anti-eco para no pisar lo que estás editando.
- Verificado: `tsc` + `next build` limpios · **`scripts/check-estado.ts` en
  verde** · check-clases (116) y check-lore (69) sin regresión. **No probado en
  vivo sin sesión.** Prueba del usuario: bajar a 0 PG y ver las salvaciones;
  3 fallos ⇒ «ha caído»; curar limpia; que el DM aplique daño y el jugador lo vea
  sin recargar; activar envenenado, tirar una pericia y ver 2d20 con la peor.
```

- [ ] **Step 3: Commit del HANDOFF**

```bash
git add HANDOFF.md
git commit -F - <<'EOF'
docs(handoff): G1 estado del combatiente

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

- [ ] **Step 4: Merge a master y push** (tras revisión del usuario)

```bash
git checkout master
git merge --no-ff g1-estado-combatiente -m "merge: G1 estado del combatiente (PG, muerte, condiciones, ventaja)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin master
git branch -d g1-estado-combatiente
```

Actualizar el vault de Obsidian (`00 Meta/Historial de desarrollo.md`) con una entrada de G1, en paralelo.

---

## Notas para quien ejecute

- **Convención de contenido**: los textos de regla de las condiciones y del
  agotamiento son **redacción propia**, resúmenes de la mecánica 2024, nunca
  prosa de los libros. Es una herramienta de fans no oficial.
- **No probar en el navegador con sesión** no es posible en el entorno de dev (no
  hay credenciales); el gate real es `tsc` + `build` + los scripts. Las pruebas
  en vivo las hace el usuario y se anotan en el HANDOFF.
- Ante dudas de API de Next 16, leer `node_modules/next/dist/docs/`, no tirar de
  memoria (`AGENTS.md`).
- **Ojo con `git add`**: añadir solo los archivos de cada tarea, nunca `-A` a
  ciegas.
```
