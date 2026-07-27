# Objetivos múltiples — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Romper la suposición de «un solo objetivo»: varios ataques por acción (eligiendo objetivo entre golpe y golpe), el ataque de acción adicional con dos armas ligeras, y los conjuros de varias instancias con sus objetivos declarados antes.

**Architecture:** Primero la capa pura y los datos (derivar cuántos ataques da la clase, contar los gastados en `play_state.turno`, marcar qué armas son ligeras y cuántas instancias tiene cada conjuro), verificados con los scripts de siempre. Después la UI: `Ataques` resuelve golpe a golpe, `Conjuros` declara N objetivos antes de lanzar, y `PanelCombate` les da lo que necesitan. **Sin migración.**

**Tech Stack:** TypeScript · Next.js 16 (App Router) · React 19 · Supabase. No hay framework de test: el gate son `npx tsx scripts/check-*.ts`, `npx tsc --noEmit` y `npx next build`.

**Spec:** `docs/superpowers/specs/2026-07-26-objetivos-multiples-design.md`

**Rama:** `objetivos-multiples` (creada; el spec ya está mergeado a `master`). Trabajar desde `C:\Users\carlo\Downloads\dnd-campaign-app`. Si `git` dice «not a git repository», usar `git -C "C:\Users\carlo\Downloads\dnd-campaign-app"`. Los heredoc de commit necesitan el **bash tool** (el shell por defecto es PowerShell). **Nunca `git add -A`.**

---

## File Structure

- **Modify** `lib/recursos.ts` — `PlayState.turno` gana `ataquesUsados?: number`.
- **Modify** `lib/turno.ts` — `turnoDe` devuelve también `ataquesUsados`; nuevas `gastarAtaque` y `ataquesRestantes`.
- **Modify** `lib/ataque.ts` — nueva `ataquesPorAccion(clsSlug, level)`.
- **Modify** `data/weapons.ts` — `Arma` gana `ligera?: boolean`; se marcan las cuatro ligeras.
- **Modify** `data/spells.ts` — `Spell` gana `instancias?: number`; Rayo Abrasador y Proyectil Mágico a 3, y el daño pasa a ser **por instancia**.
- **Modify** `scripts/check-turno.ts`, `scripts/check-ataque.ts`, `scripts/check-spells.ts` — comprobaciones nuevas.
- **Modify** `components/personaje/Ataques.tsx` — N ataques secuenciales + botón «Otra mano»; `Objetivo` gana `id`.
- **Modify** `components/personaje/Conjuros.tsx` — declarar N objetivos antes de lanzar.
- **Modify** `components/tablero/PanelCombate.tsx` — calcula los ataques y pasa la lista de objetivos.
- **Modify** `HANDOFF.md` + vault — documentación (Tarea 6).

---

## Task 1: Capa pura — ataques por acción y contador

**Files:**
- Modify: `lib/recursos.ts`
- Modify: `scripts/check-turno.ts`
- Modify: `scripts/check-ataque.ts`
- Modify: `lib/turno.ts`
- Modify: `lib/ataque.ts`

- [ ] **Step 1: Añade la clave al tipo `PlayState`**

En `lib/recursos.ts`, dentro del objeto `turno?: { … }`, añade una línea después de `movGastado?: number;`:

```ts
    ataquesUsados?: number; // ataques ya gastados de la acción de Atacar (multiataque)
```

- [ ] **Step 2: Amplía `scripts/check-turno.ts` (el test que falla)**

En `scripts/check-turno.ts`, cambia la línea del import:

```ts
import { turnoDe, gastar, devolver, alternarRecurso, mover, movRestante, limpiarTurno } from "../lib/turno";
```

por:

```ts
import { turnoDe, gastar, devolver, alternarRecurso, mover, movRestante, limpiarTurno, gastarAtaque, ataquesRestantes } from "../lib/turno";
```

Y ANTES de la línea `if (failures) {` del final, añade:

```ts
// --- Multiataque: contador de ataques de la acción de Atacar ---------------
check("turno ausente: 0 ataques usados", turnoDe(vacio).ataquesUsados === 0);
check("gastarAtaque suma uno", turnoDe(gastarAtaque(vacio, 2)).ataquesUsados === 1);
check("gastarAtaque respeta el tope", turnoDe(gastarAtaque(gastarAtaque(gastarAtaque(vacio, 2), 2), 2)).ataquesUsados === 2);
check("ataquesRestantes con 2 y ninguno usado", ataquesRestantes(vacio, 2) === 2);
check("ataquesRestantes tras gastar uno", ataquesRestantes(gastarAtaque(vacio, 2), 2) === 1);
check("ataquesRestantes nunca es negativo", ataquesRestantes({ turno: { ataquesUsados: 9 } }, 2) === 0);
check("gastarAtaque no toca la accion", turnoDe(gastarAtaque(vacio, 2)).accion === false);
check("gastar accion no toca los ataques", turnoDe(gastar(vacio, "accion")).ataquesUsados === 0);
check("limpiarTurno borra tambien los ataques", turnoDe(limpiarTurno({ turno: { ataquesUsados: 2, accion: true } })).ataquesUsados === 0);
check("gastarAtaque no toca usos ni hp", (() => {
  const r = gastarAtaque({ usos: { furias: 1 }, hp: 7 }, 2);
  return JSON.stringify(r.usos) === JSON.stringify({ furias: 1 }) && r.hp === 7;
})());
```

- [ ] **Step 3: Amplía `scripts/check-ataque.ts` (el otro test que falla)**

En `scripts/check-ataque.ts`, cambia la línea del import:

```ts
import { ataqueDe } from "../lib/ataque";
```

por:

```ts
import { ataqueDe, ataquesPorAccion } from "../lib/ataque";
```

Y ANTES de la línea `if (failures) {` del final, añade:

```ts
// --- Ataques por acción de Atacar -----------------------------------------
// El guerrero tiene columna propia: 1 hasta nv4, 2 desde nv5, 3 desde nv11, 4 a nv20.
check("guerrero nv1: 1 ataque", ataquesPorAccion("guerrero", 1) === 1);
check("guerrero nv4: 1 ataque", ataquesPorAccion("guerrero", 4) === 1);
check("guerrero nv5: 2 ataques", ataquesPorAccion("guerrero", 5) === 2);
check("guerrero nv10: 2 ataques", ataquesPorAccion("guerrero", 10) === 2);
check("guerrero nv11: 3 ataques", ataquesPorAccion("guerrero", 11) === 3);
check("guerrero nv19: 3 ataques", ataquesPorAccion("guerrero", 19) === 3);
check("guerrero nv20: 4 ataques", ataquesPorAccion("guerrero", 20) === 4);

// Las otras cinco clases con «Ataque Extra» a nivel 5: 1 antes, 2 desde nv5.
for (const c of ["barbaro", "explorador", "cazador-de-sangre", "paladin", "monje"]) {
  check(`${c} nv4: 1 ataque`, ataquesPorAccion(c, 4) === 1);
  check(`${c} nv5: 2 ataques`, ataquesPorAccion(c, 5) === 2);
  check(`${c} nv20: 2 ataques`, ataquesPorAccion(c, 20) === 2);
}

// Pícaro y bardo NO tienen Ataque Extra en 2024: siempre 1. Esta comprobación
// existe para que nadie les regale un ataque que la clase no tiene.
for (const c of ["picaro", "bardo"]) {
  check(`${c} nv5: sigue con 1 ataque`, ataquesPorAccion(c, 5) === 1);
  check(`${c} nv20: sigue con 1 ataque`, ataquesPorAccion(c, 20) === 1);
}

check("clase desconocida: 1 ataque", ataquesPorAccion("no-existe", 20) === 1);
check("nivel fuera de rango se acota por arriba", ataquesPorAccion("guerrero", 99) === 4);
check("nivel fuera de rango se acota por abajo", ataquesPorAccion("guerrero", 0) === 1);
```

- [ ] **Step 4: Ejecuta los dos scripts y comprueba que FALLAN**

Run: `npx tsx scripts/check-turno.ts; npx tsx scripts/check-ataque.ts`
Expected: los dos fallan al importar (`gastarAtaque`/`ataquesRestantes`/`ataquesPorAccion` no existen todavía).

- [ ] **Step 5: Implementa en `lib/turno.ts`**

Sustituye la función `turnoDe` entera por:

```ts
/** Lee la economía del turno; ausente ⇒ todo libre, contadores a 0. */
export function turnoDe(play: PlayState): { accion: boolean; adicional: boolean; reaccion: boolean; movGastado: number; ataquesUsados: number } {
  const t = play.turno ?? {};
  return {
    accion: !!t.accion,
    adicional: !!t.adicional,
    reaccion: !!t.reaccion,
    movGastado: Math.max(0, Math.floor(t.movGastado ?? 0)),
    ataquesUsados: Math.max(0, Math.floor(t.ataquesUsados ?? 0)),
  };
}
```

Y añade al FINAL del archivo, antes de `limpiarTurno` o después (da igual, pero mantén `limpiarTurno` el último para no romper la lectura):

```ts
/**
 * Marca un ataque más de los que da la acción de Atacar (tope `max`).
 * Ojo: NO gasta la acción — la acción de Atacar se paga una vez, en el primer
 * golpe, y de ahí salen todos los ataques del turno.
 */
export function gastarAtaque(play: PlayState, max: number): PlayState {
  return conTurno(play, { ataquesUsados: Math.min(max, turnoDe(play).ataquesUsados + 1) });
}

/** Ataques que quedan de la acción de Atacar este turno. */
export function ataquesRestantes(play: PlayState, max: number): number {
  return Math.max(0, max - turnoDe(play).ataquesUsados);
}
```

- [ ] **Step 6: Implementa en `lib/ataque.ts`**

Añade el import al principio del archivo, debajo del import de `Arma`:

```ts
import { getMechanics } from "@/data/classdata";
```

Y añade al FINAL del archivo:

```ts
// Nombre EXACTO de la columna del guerrero y del rasgo que dan multiataque.
const COLUMNA_ATAQUES = "Ataques por acción de Atacar";
const RASGO_ATAQUE_EXTRA = /^ataques? extra$/i;

/**
 * Cuántos ataques da la acción de Atacar a esa clase y nivel. Los datos YA
 * existen, no se inventa nada:
 *  1. El guerrero tiene su propia columna de progresión (1/2/3/4) ⇒ se lee.
 *  2. Si no, ¿tiene el rasgo «Ataque Extra» a un nivel ya alcanzado? ⇒ 2.
 *     (bárbaro, explorador, cazador de sangre, paladín y monje, todos a nv5)
 *  3. Si no ⇒ 1.
 *
 * Pícaro y bardo caen en el caso 3 y es CORRECTO: en 2024 no tienen Ataque
 * Extra. El escalado del pícaro es el Ataque Furtivo, una vez por turno.
 */
export function ataquesPorAccion(clsSlug: string, level: number): number {
  const m = getMechanics(clsSlug);
  if (!m) return 1;
  const i = Math.max(0, Math.min(19, Math.floor(level) - 1));
  const col = m.resources?.find((r) => r.name === COLUMNA_ATAQUES);
  if (col) return Math.max(1, Number(col.values[i]) || 1);
  const nivel = Math.max(1, Math.floor(level));
  const extra = m.features.some((f) => RASGO_ATAQUE_EXTRA.test(f.name) && f.level <= nivel);
  return extra ? 2 : 1;
}
```

> **Por qué el regex lleva `s?`**: el guerrero tiene además «Dos Ataques Extra»
> (nv11) y «Tres Ataques Extra» (nv20), pero su **columna manda** y se lee antes,
> así que nunca llega al regex. El `s?` cubre solo un posible «Ataques Extra» en
> singular/plural de otra clase; los «Dos/Tres…» no casan porque el patrón está
> anclado con `^` y `$`.

- [ ] **Step 7: Ejecuta los dos scripts y comprueba que PASAN**

Run: `npx tsx scripts/check-turno.ts && npx tsx scripts/check-ataque.ts`
Expected: los dos terminan en `Todo en verde`. Si alguno falla, corrige la **implementación**, nunca las comprobaciones. Si un valor esperado no cuadra con los datos reales, **para y reporta BLOCKED** con el valor real — puede que la columna del guerrero no sea la que dice el plan.

- [ ] **Step 8: Tipos y regresión**

Run: `npx tsc --noEmit && npx tsx scripts/check-estado.ts && npx tsx scripts/check-targeting.ts`
Expected: `tsc` limpio y los dos scripts en verde.

- [ ] **Step 9: Commit**

```bash
git add lib/recursos.ts lib/turno.ts lib/ataque.ts scripts/check-turno.ts scripts/check-ataque.ts
git commit -F - <<'EOF'
feat(objetivos): ataques por acción y contador de ataques

ataquesPorAccion deriva cuántos golpes da la acción de Atacar de datos que ya
existían: la columna del guerrero (1/2/3/4) y el rasgo «Ataque Extra» de
bárbaro, explorador, cazador de sangre, paladín y monje. Pícaro y bardo se
quedan en 1, que es lo correcto en 2024, y hay comprobaciones que lo fijan.

El contador va en play_state.turno.ataquesUsados, así que sin migración, y
limpiarTurno lo borra con el resto al empezar tu turno.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 2: Datos — armas ligeras e instancias de conjuro

**Files:**
- Modify: `scripts/check-ataque.ts`
- Modify: `scripts/check-spells.ts`
- Modify: `data/weapons.ts`
- Modify: `data/spells.ts`

- [ ] **Step 1: Amplía `scripts/check-ataque.ts` con las armas ligeras**

Añade ANTES de la línea `if (failures) {`:

```ts
// --- Armas ligeras (luchar con dos armas) ---------------------------------
// Solo estas cuatro son ligeras en el catálogo.
for (const n of ["Daga", "Espada corta", "Hacha de mano", "Cimitarra"]) {
  check(`${n} es ligera`, ARMAS[n].ligera === true);
}
// TRAMPA CLÁSICA: la «Ballesta ligera» se llama así pero NO tiene la propiedad
// ligera (sus propiedades son cargar, dos manos y munición).
check("la Ballesta ligera NO es ligera", !ARMAS["Ballesta ligera"].ligera);
for (const n of ["Espada larga", "Maza", "Bastón", "Lanza", "Martillo de guerra", "Arco corto", "Arco largo"]) {
  check(`${n} no es ligera`, !ARMAS[n].ligera);
}
// Para luchar con dos armas hacen falta ligeras CUERPO A CUERPO.
check("todas las ligeras del catálogo son cuerpo a cuerpo", Object.values(ARMAS).filter((a) => a.ligera).every((a) => a.alcance === "cuerpo"));
```

- [ ] **Step 2: Amplía `scripts/check-spells.ts` con las instancias**

Añade ANTES de la línea `if (failures) {`:

```ts
// --- Instancias (conjuros que golpean varias veces) -----------------------
check("Rayo Abrasador tiene 3 instancias", SPELLS["rayo-abrasador"].instancias === 3);
check("Proyectil Mágico tiene 3 instancias", SPELLS["proyectil-magico"].instancias === 3);
// El daño es SIEMPRE por instancia: un dardo, no los tres juntos.
check("Proyectil Mágico: daño de UN dardo", SPELLS["proyectil-magico"].damage?.dice === "1d4+1");
check("Rayo Abrasador: daño de UN rayo", SPELLS["rayo-abrasador"].damage?.dice === "2d6");
// Si está, es un entero ≥ 2 (poner 1 sería ruido).
check("instancias, cuando está, es un entero ≥2", todos.every((s) => s.instancias === undefined || (Number.isInteger(s.instancias) && s.instancias >= 2)));
// Un conjuro de área NO se modela con instancias (eso es la losa siguiente).
check("Bola de Fuego no usa instancias", SPELLS["bola-de-fuego"].instancias === undefined);
```

- [ ] **Step 3: Ejecuta los dos scripts y comprueba que FALLAN**

Run: `npx tsx scripts/check-ataque.ts; npx tsx scripts/check-spells.ts`
Expected: fallan (la propiedad `ligera` y el campo `instancias` no existen aún; `tsx` puede quejarse de tipos o las comprobaciones salir en FAIL — cualquiera de las dos vale como «falla»).

- [ ] **Step 4: Añade `ligera` a `data/weapons.ts`**

En el tipo `Arma`, después de la línea de `sutil`, añade:

```ts
  ligera?: boolean;        // light: permite el ataque de acción adicional con dos armas
```

Y marca las cuatro armas ligeras añadiendo `ligera: true` a sus entradas (deja el resto **sin tocar**):

```ts
  "Daga": { nombre: "Daga", categoria: "sencilla", dado: "1d4", tipo: "perforante", alcance: "cuerpo", sutil: true, ligera: true },
  "Espada corta": { nombre: "Espada corta", categoria: "marcial", dado: "1d6", tipo: "perforante", alcance: "cuerpo", sutil: true, ligera: true },
  "Hacha de mano": { nombre: "Hacha de mano", categoria: "sencilla", dado: "1d6", tipo: "cortante", alcance: "cuerpo", ligera: true },
  "Cimitarra": { nombre: "Cimitarra", categoria: "marcial", dado: "1d6", tipo: "cortante", alcance: "cuerpo", sutil: true, ligera: true },
```

> **NO marques la «Ballesta ligera».** Se llama así, pero sus propiedades reales
> son cargar, dos manos y munición: no es un arma ligera y no sirve para luchar
> con dos armas.

- [ ] **Step 5: Añade `instancias` a `data/spells.ts`**

En el tipo `Spell`, después del bloque de comentario de `damage` y su declaración, añade:

```ts
  /**
   * Cuántas veces golpea el conjuro con una sola lanzada: 3 rayos del Rayo
   * Abrasador, 3 dardos del Proyectil Mágico. Ausente ⇒ 1. Cada instancia
   * puede ir a un objetivo distinto y se resuelve por separado.
   */
  instancias?: number;
```

Sustituye el comentario del campo `damage` (el que habla de «los dados que se
tiran DE UNA VEZ» y pone Proyectil Mágico como ejemplo de agregado) por este,
porque con `instancias` la regla cambia y el viejo se quedaría mintiendo:

```ts
  /**
   * Daño base al nivel mínimo del conjuro, SIEMPRE por instancia: lo que tira
   * UN rayo o UN dardo, no la suma. Los conjuros de varias instancias lo
   * declaran en `instancias` y se tira una vez por cada una.
   */
```

Y actualiza las dos entradas:

```ts
  "proyectil-magico": {
    id: "proyectil-magico", name: "Proyectil Mágico", level: 1, school: "Evocación",
    classes: ["hechicero", "mago"],
    time: "1 acción", range: "36 m", components: "V, S", duration: "Instantáneo",
    desc: "Tres dardos de fuerza que **siempre aciertan**: no hay tirada de ataque ni salvación. Cada dardo hace 1d4+1 y puedes repartirlos entre varios objetivos.",
    damage: { dice: "1d4+1", type: "fuerza" }, instancias: 3,
  },
```

```ts
  "rayo-abrasador": {
    id: "rayo-abrasador", name: "Rayo Abrasador", level: 2, school: "Evocación",
    classes: ["hechicero", "mago"],
    time: "1 acción", range: "36 m", components: "V, S", duration: "Instantáneo",
    desc: "Lanzas tres rayos de fuego, cada uno con su propia tirada de ataque; puedes repartirlos o concentrarlos en un solo blanco. Cada rayo hace 2d6.",
    attack: true, damage: { dice: "2d6", type: "fuego" }, instancias: 3,
  },
```

- [ ] **Step 6: Ejecuta los dos scripts y comprueba que PASAN**

Run: `npx tsx scripts/check-ataque.ts && npx tsx scripts/check-spells.ts`
Expected: los dos terminan en `Todo en verde`.

- [ ] **Step 7: Tipos y regresión**

Run: `npx tsc --noEmit && npx tsx scripts/check-conjuros.ts && npx tsx scripts/check-targeting.ts`
Expected: `tsc` limpio y los dos scripts en verde.

- [ ] **Step 8: Commit**

```bash
git add data/weapons.ts data/spells.ts scripts/check-ataque.ts scripts/check-spells.ts
git commit -F - <<'EOF'
feat(objetivos): armas ligeras e instancias de conjuro

Arma gana `ligera` (Daga, Espada corta, Hacha de mano y Cimitarra), que es lo
que exige luchar con dos armas. La Ballesta ligera NO la lleva pese al nombre:
sus propiedades son cargar, dos manos y munición, y hay una comprobación que
lo fija para que nadie la marque por error.

Spell gana `instancias` (Rayo Abrasador y Proyectil Mágico, 3). Con eso el
daño pasa a ser SIEMPRE por instancia —Proyectil Mágico baja de 3d4+3 a
1d4+1 por dardo— y se arregla la incoherencia de O2, donde el mismo campo
significaba una cosa en un conjuro y otra en el otro.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 3: `Ataques.tsx` — varios golpes y la otra mano

**Files:**
- Modify: `components/personaje/Ataques.tsx`

- [ ] **Step 1: Sustituye TODO el contenido de `components/personaje/Ataques.tsx` por**

```tsx
"use client";
import { useState } from "react";
import { armaDe, type Arma } from "@/data/weapons";
import { ataqueDe, type Ataque } from "@/lib/ataque";
import { gastar, gastarAtaque, ataquesRestantes, turnoDe } from "@/lib/turno";
import { ventajaDe } from "@/lib/estado";
import { ventajaAtacante, combinar, enAlcance, critProximidad, formulaDaño } from "@/lib/targeting";
import { publishRoll } from "@/lib/useDiceFeed";
import { critState } from "@/lib/dice";
import { fmtMod } from "@/data/rules";
import type { PlayState } from "@/lib/recursos";

/** El objetivo elegido en el tablero, ya resuelto por el padre. */
export type Objetivo = {
  /** id de la ficha del tablero, para distinguir objetivos repetidos por nombre. */
  id: number;
  label: string;
  /** Distancia en metros desde la ficha propia, o null si no se puede medir. */
  distancia: number | null;
  /** Condiciones del objetivo si es un jugador legible; PNJ ⇒ vacío. */
  conds: string[];
};

/** Cómo se paga el ataque: con la acción de Atacar, o con la acción adicional. */
type Modo = "accion" | "adicional";

// Lista de ataques con las armas del inventario que existen en la tabla ARMAS.
// Tira impacto (d20 + mod, con la ventaja combinada de G1 + la del objetivo) y
// daño (dado + mod, doblado en crítico).
//
// MULTIATAQUE: la acción de Atacar da N golpes (`maxAtaques`). El PRIMERO paga
// la acción; los siguientes solo gastan ataque. Se resuelven UNO A UNO para
// poder cambiar de objetivo entre golpe y golpe — si el primero cae, rediriges.
//
// OTRA MANO: con un arma ligera cuerpo a cuerpo se puede atacar además con la
// ACCIÓN ADICIONAL (luchar con dos armas). Ese golpe NO suma el modificador de
// característica al daño, salvo estilo de combate — y los estilos no están
// modelados, así que se aplica la regla base: mejor quedarse corto que pasarse.
//
// El OBJETIVO lo elige el padre (PanelCombate) y lo comparte con los conjuros.
export default function Ataques({
  play, items, abilities, prof, classWeapons, sessionId, objetivo, maxAtaques = 1, onChange, readOnly = false,
}: {
  play: PlayState;
  items: { name: string }[];
  abilities: { fue: number; des: number };
  prof: number;
  classWeapons: string[];
  sessionId: string | null;
  objetivo?: Objetivo | null;
  /** Ataques que da la acción de Atacar (de ataquesPorAccion). */
  maxAtaques?: number;
  onChange: (next: PlayState) => void;
  readOnly?: boolean;
}) {
  const [err, setErr] = useState<string | null>(null);

  const armas = items.map((it) => armaDe(it.name)).filter((a): a is Arma => !!a);
  // Únicas por nombre (no listar dos veces la misma arma apilada).
  const vistas = new Set<string>();
  const lista = armas.filter((a) => (vistas.has(a.nombre) ? false : (vistas.add(a.nombre), true)));
  if (lista.length === 0) return null;

  const t = turnoDe(play);
  const restantes = ataquesRestantes(play, maxAtaques);
  const puedeAtacar = !!sessionId && !readOnly;
  const distancia = objetivo?.distancia ?? null;
  const condsObjetivo = objetivo?.conds ?? [];
  // Luchar con dos armas exige una arma LIGERA cuerpo a cuerpo EN CADA MANO, así
  // que se cuentan sobre `armas` (sin deduplicar): dos dagas valen, una no.
  const hayDosLigeras = armas.filter((a) => a.ligera && a.alcance === "cuerpo").length >= 2;

  async function atacar(arma: Arma, atk: Ataque, modo: Modo) {
    if (!sessionId || readOnly) return;
    setErr(null);

    // Economía: ¿queda con qué pagar este golpe?
    if (modo === "accion" && restantes <= 0) {
      setErr("No te quedan ataques este turno.");
      return;
    }
    if (modo === "adicional" && t.adicional) {
      setErr("Ya has gastado la acción adicional.");
      return;
    }

    // Alcance (bloqueo duro): solo cuando hay distancia medida.
    if (distancia !== null && !enAlcance(arma, distancia)) {
      setErr(`Fuera de alcance (${distancia} m).`);
      return;
    }

    // Ventaja combinada: la propia (G1) + la del objetivo (si hay distancia).
    const advObjetivo = distancia !== null ? ventajaAtacante(condsObjetivo, distancia) : { adv: false, dis: false };
    const adv = combinar(ventajaDe(play, "ataque"), advObjetivo);

    const etiquetaObj = objetivo ? ` → ${objetivo.label}` : "";
    const cual = modo === "adicional"
      ? " (otra mano)"
      : maxAtaques > 1 ? ` (${t.ataquesUsados + 1} de ${maxAtaques})` : "";
    const { error, result } = await publishRoll(
      sessionId, "attack", `Ataque: ${arma.nombre}${etiquetaObj}${cual}`, "1d20",
      { mod: atk.modImpacto, adv: adv ?? undefined },
    );
    if (error) { setErr(error); return; }

    // Crítico: 20 natural o proximidad (≤1,5 m vs paralizado/inconsciente).
    const critNat = !!result && critState(result.formula, result.rolls) === "crit";
    const critProx = distancia !== null && critProximidad(condsObjetivo, distancia);
    const crit = critNat || critProx;

    // El golpe de la otra mano no suma el modificador al daño (regla base).
    const modDaño = modo === "adicional" ? 0 : atk.modDaño;
    const { error: e2 } = await publishRoll(
      sessionId, "custom", `Daño: ${arma.nombre}${crit ? " (crítico)" : ""}${modo === "adicional" ? " (otra mano)" : ""}`,
      formulaDaño(arma.dado, modDaño, crit),
    );
    if (e2) { setErr(e2); return; }

    // Gasto: la acción de Atacar se paga UNA vez, en el primer golpe.
    let next = play;
    if (modo === "adicional") {
      next = gastar(next, "adicional");
    } else {
      if (turnoDe(next).ataquesUsados === 0) next = gastar(next, "accion");
      next = gastarAtaque(next, maxAtaques);
    }
    onChange(next);
  }

  return (
    <div className="mb-4">
      {maxAtaques > 1 && (
        <p className="font-ui text-[11px] mb-2" style={{ color: restantes > 0 ? "var(--color-bronze-bright)" : "var(--color-dim)" }}>
          <i className="fas fa-khanda mr-1.5" />
          {restantes > 0 ? `Ataque ${t.ataquesUsados + 1} de ${maxAtaques}` : "Sin ataques este turno"}
          <span style={{ color: "var(--color-dim)" }}> · cambia de objetivo entre golpe y golpe</span>
        </p>
      )}

      <div className="space-y-1.5">
        {lista.map((arma) => {
          const atk = ataqueDe(arma, abilities, prof, classWeapons);
          const esLigera = !!arma.ligera && arma.alcance === "cuerpo";
          return (
            <div key={arma.nombre} className="panel-raised px-3 py-2 flex items-center justify-between gap-2">
              <div>
                <p className="font-ui text-[13px] font-bold" style={{ color: "var(--color-parch)" }}>{arma.nombre}</p>
                <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
                  impacto {fmtMod(atk.modImpacto)} · daño {arma.dado}{atk.modDaño !== 0 ? fmtMod(atk.modDaño) : ""} {arma.tipo}
                  {!atk.competente && " · no competente"}
                  {esLigera && " · ligera"}
                </p>
              </div>
              {puedeAtacar && (
                <span className="shrink-0 flex items-center gap-1.5">
                  <button
                    className="btn-gold !py-1 !px-3 text-[12px] disabled:opacity-40"
                    disabled={restantes <= 0}
                    title={restantes <= 0 ? "No te quedan ataques este turno" : "Atacar (gasta un ataque de la acción)"}
                    onClick={() => atacar(arma, atk, "accion")}
                  >
                    <i className="fas fa-khanda mr-1.5" />Atacar
                  </button>
                  {esLigera && hayDosLigeras && (
                    <button
                      className="panel-raised !py-1 !px-2 text-[11px] font-ui disabled:opacity-40"
                      style={{ color: "var(--color-muted)" }}
                      disabled={t.adicional}
                      title={t.adicional ? "Ya has gastado la acción adicional" : "Atacar con la otra mano: gasta la acción adicional y no suma el modificador al daño"}
                      onClick={() => atacar(arma, atk, "adicional")}
                    >
                      Otra mano
                    </button>
                  )}
                </span>
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

- [ ] **Step 2: Verifica tipos**

Run: `npx tsc --noEmit`
Expected: **fallará** en `components/tablero/PanelCombate.tsx`, porque el `Objetivo` que construye ya no cuadra (ahora lleva `id`). Es lo esperado: se arregla en la Tarea 5. Si falla en OTRO sitio distinto de `PanelCombate.tsx`, léelo y arréglalo.

> Si prefieres dejar el árbol compilando entre tareas, puedes hacer la Tarea 5
> justo después de esta y commitear las dos juntas — pero el plan las separa para
> que cada commit cuente una sola cosa.

- [ ] **Step 3: Commit**

```bash
git add components/personaje/Ataques.tsx
git commit -F - <<'EOF'
feat(objetivos): varios golpes por acción y ataque con la otra mano

La acción de Atacar da N golpes: el primero paga la acción y los siguientes
solo gastan ataque, resolviéndose uno a uno para poder cambiar de objetivo
entre golpe y golpe. Marcador «Ataque 1 de 2» y botón apagado al agotarlos.

Con un arma ligera cuerpo a cuerpo aparece «Otra mano», que gasta la acción
adicional en vez de un ataque. Ese golpe no suma el modificador al daño: es la
regla base, y los estilos de combate no están modelados, así que se prefiere
quedarse corto a pasarse.

Objetivo gana `id` para distinguir fichas con el mismo nombre.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 4: `Conjuros.tsx` — declarar N objetivos antes de lanzar

**Files:**
- Modify: `components/personaje/Conjuros.tsx`

- [ ] **Step 1: Añade la prop y el estado de declaración**

En `components/personaje/Conjuros.tsx`:

En la lista de props del tipo, después de `objetivo?: Objetivo | null;` añade:

```tsx
  /** Todas las fichas a las que se puede apuntar (para los conjuros de varias instancias). */
  objetivosDisponibles?: Objetivo[];
```

Y en la desestructuración de argumentos añade `objetivosDisponibles = [],` justo después de `objetivo,`.

Junto a los otros `useState` (donde está `nivelPara`), añade:

```tsx
  // Conjuro de varias instancias cuyos objetivos se están declarando: qué
  // conjuro, con qué nivel de hueco, y un objetivo (id de ficha) por instancia.
  const [declarando, setDeclarando] = useState<{ spellId: string; nivel: number; targets: (number | null)[] } | null>(null);
```

- [ ] **Step 2: Haz que `lanzar` acepte los objetivos declarados**

Cambia la firma de `lanzar`:

```tsx
  async function lanzar(spell: Spell, nivelUsado: number) {
```

por:

```tsx
  async function lanzar(spell: Spell, nivelUsado: number, targets?: (number | null)[]) {
```

Dentro, sustituye este bloque (el anuncio y las tiradas, del paso 1 al 3):

```tsx
    // 1. Anuncio (con la CD si el conjuro pide salvación).
    const cd = spell.save ? ` · salvación de ${spell.save.toUpperCase()} CD ${spellDc}` : "";
    const haciaObjetivo = objetivo ? ` → ${objetivo.label}` : "";
    const { error: e0 } = await publishNote(sessionId, `Lanza ${etiqueta}${haciaObjetivo}${cd}`);
    if (e0) { setErr(e0); return; }

    // 2. Tirada de ataque de conjuro, si la tiene.
    if (spell.attack) {
      const { error } = await publishRoll(sessionId, "attack", `Conjuro: ${spell.name}`, "1d20", { mod: spellAttack });
      if (error) { setErr(error); return; }
    }
    // 3. Daño y/o curación, si los trae.
    if (spell.damage) {
      const { error } = await publishRoll(sessionId, "custom", `Daño: ${spell.name} (${spell.damage.type})`, spell.damage.dice);
      if (error) { setErr(error); return; }
    }
    if (spell.heal) {
      const { error } = await publishRoll(sessionId, "custom", `Curación: ${spell.name}`, spell.heal);
      if (error) { setErr(error); return; }
    }
```

por:

```tsx
    // 1. Anuncio (con la CD si el conjuro pide salvación).
    const cd = spell.save ? ` · salvación de ${spell.save.toUpperCase()} CD ${spellDc}` : "";
    const haciaObjetivo = objetivo ? ` → ${objetivo.label}` : "";
    const { error: e0 } = await publishNote(sessionId, `Lanza ${etiqueta}${haciaObjetivo}${cd}`);
    if (e0) { setErr(e0); return; }

    // 2-3. Tiradas: una tanda por INSTANCIA (3 rayos, 3 dardos…). Cada
    // instancia puede ir a un objetivo distinto, declarado antes de lanzar.
    const n = Math.max(1, spell.instancias ?? 1);
    for (let i = 0; i < n; i++) {
      const t = targets?.[i] ?? null;
      const nombreObj = t !== null ? objetivosDisponibles.find((o) => o.id === t)?.label : undefined;
      const haciaEsta = nombreObj ? ` → ${nombreObj}` : "";
      const cual = n > 1 ? ` (${i + 1} de ${n})` : "";

      if (spell.attack) {
        const { error } = await publishRoll(sessionId, "attack", `Conjuro: ${spell.name}${haciaEsta}${cual}`, "1d20", { mod: spellAttack });
        if (error) { setErr(error); return; }
      }
      if (spell.damage) {
        const { error } = await publishRoll(sessionId, "custom", `Daño: ${spell.name} (${spell.damage.type})${haciaEsta}${cual}`, spell.damage.dice);
        if (error) { setErr(error); return; }
      }
      if (spell.heal) {
        const { error } = await publishRoll(sessionId, "custom", `Curación: ${spell.name}${haciaEsta}${cual}`, spell.heal);
        if (error) { setErr(error); return; }
      }
    }
```

Y al final de `lanzar`, junto a `setNivelPara(null);`, añade:

```tsx
    setDeclarando(null);
```

- [ ] **Step 3: Haz que los conjuros de varias instancias abran la declaración**

Dentro de `BotonesLanzar`, sustituye la rama del truco y la del botón único para que, cuando el conjuro tenga varias instancias, en vez de lanzar directamente abra la declaración. Sustituye la función `BotonesLanzar` **entera** por:

```tsx
  function BotonesLanzar({ spell }: { spell: Spell }) {
    if (!puedeLanzar) return null;
    const n = Math.max(1, spell.instancias ?? 1);
    // Empezar a lanzar: con varias instancias hay que declarar objetivos antes.
    const arranca = (nivel: number) => {
      if (n > 1) setDeclarando({ spellId: spell.id, nivel, targets: Array(n).fill(null) });
      else void lanzar(spell, nivel);
    };
    // Trucos: directo, sin hueco.
    if (spell.level === 0) {
      return <button className="btn-gold !py-1 !px-3 text-[12px]" onClick={() => arranca(0)}>Lanzar</button>;
    }
    const opciones = nivelesPara(spell);
    return (
      <span className="flex items-center gap-1.5">
        {spell.ritual && (
          <button
            className="panel-raised !py-1 !px-2 text-[11px] font-ui"
            style={{ color: "var(--color-muted)" }}
            title="Lanzar como ritual: tarda 10 minutos más, pero no gasta hueco"
            onClick={() => arranca(0)}
          >
            Ritual
          </button>
        )}
        {opciones.length === 0 ? (
          <span className="font-ui text-[11px] italic" style={{ color: "var(--color-dim)" }}>sin huecos</span>
        ) : nivelPara === spell.id ? (
          <span className="flex items-center gap-1">
            {opciones.map((h) => (
              <button key={h.nivel} className="btn-gold !py-1 !px-2 text-[11px]" title={`Gastar un hueco de nivel ${h.nivel}`} onClick={() => { setNivelPara(null); arranca(h.nivel); }}>
                nv{h.nivel}
              </button>
            ))}
            <button className="font-ui text-[11px] px-1" style={{ color: "var(--color-dim)" }} onClick={() => setNivelPara(null)}>✕</button>
          </span>
        ) : (
          <button
            className="btn-gold !py-1 !px-3 text-[12px]"
            title={opciones.length > 1 ? "Elegir el nivel del hueco (subir de nivel el conjuro)" : `Gastar un hueco de nivel ${opciones[0].nivel}`}
            onClick={() => (opciones.length > 1 ? setNivelPara(spell.id) : arranca(opciones[0].nivel))}
          >
            Lanzar
          </button>
        )}
      </span>
    );
  }
```

- [ ] **Step 4: Pinta el selector de objetivos por instancia**

Dentro de `FilaConjuro`, justo ANTES del `</div>` que cierra el contenedor exterior (el `<div className="panel-raised px-3 py-2 flex items-start justify-between gap-2">`), no cabe bien porque es un flex de dos columnas. En su lugar, **envuelve** el contenido de `FilaConjuro`: sustituye la función `FilaConjuro` **entera** por:

```tsx
  function FilaConjuro({ spell }: { spell: Spell }) {
    const declara = declarando?.spellId === spell.id ? declarando : null;
    const n = Math.max(1, spell.instancias ?? 1);
    return (
      <div className="panel-raised px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-ui text-[13px] font-bold" style={{ color: "var(--color-parch)" }}>
              {spell.name}
              {n > 1 && <span className="font-ui text-[10px] ml-1.5 px-1.5 py-0.5 rounded" style={{ background: "var(--color-arcane)", color: "var(--color-night)" }}>×{n}</span>}
              {spell.concentration && <i className="fas fa-brain ml-1.5 text-[10px]" style={{ color: "var(--color-arcane-bright)" }} title="Concentración" />}
              {spell.ritual && <i className="fas fa-book ml-1.5 text-[10px]" style={{ color: "var(--color-muted)" }} title="Ritual" />}
            </p>
            <p className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }}>
              {spell.level === 0 ? "Truco" : `Nivel ${spell.level}`} · {spell.school} · {spell.time} · {spell.range}
            </p>
            <p className="font-ui text-[11px] mt-0.5" style={{ color: "var(--color-muted)" }}>{spell.desc}</p>
          </div>
          <span className="shrink-0 flex flex-col items-end gap-1">
            <BotonesLanzar spell={spell} />
            {!readOnly && (
              <button className="font-ui text-[10px]" style={{ color: "var(--color-dim)" }} title="Quitar de los preparados" onClick={() => onChange(despreparar(play, spell.id))}>
                quitar
              </button>
            )}
          </span>
        </div>

        {/* Declaración de objetivos: uno por instancia, antes de resolver. */}
        {declara && (
          <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--color-line)" }}>
            <p className="font-ui text-[11px] mb-1.5" style={{ color: "var(--color-dim)" }}>
              Elige a quién va cada una (puedes repetir objetivo):
            </p>
            <div className="space-y-1">
              {declara.targets.map((valor, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="font-ui text-[11px] w-12 shrink-0" style={{ color: "var(--color-muted)" }}>{i + 1} de {n}</span>
                  <select
                    className="flex-1 font-ui text-[11px] bg-transparent"
                    style={{ color: "var(--color-parch)" }}
                    value={valor ?? ""}
                    onChange={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);
                      setDeclarando((d) => (d ? { ...d, targets: d.targets.map((x, j) => (j === i ? v : x)) } : d));
                    }}
                  >
                    <option value="">Sin objetivo</option>
                    {objetivosDisponibles.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}{o.distancia !== null ? ` · ${o.distancia} m` : ""}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button className="btn-gold !py-1 !px-3 text-[12px]" onClick={() => void lanzar(spell, declara.nivel, declara.targets)}>
                Lanzar
              </button>
              <button className="font-ui text-[11px]" style={{ color: "var(--color-dim)" }} onClick={() => setDeclarando(null)}>
                cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
```

- [ ] **Step 5: Verifica tipos**

Run: `npx tsc --noEmit`
Expected: sigue fallando **solo** en `components/tablero/PanelCombate.tsx` (por el `id` del `Objetivo` de la Tarea 3 y la prop nueva). Se cierra en la Tarea 5.

- [ ] **Step 6: Commit**

```bash
git add components/personaje/Conjuros.tsx
git commit -F - <<'EOF'
feat(objetivos): los conjuros de varias instancias declaran sus objetivos

Rayo Abrasador y Proyectil Mágico abren un selector con un objetivo por
instancia antes de resolver: se gasta UN hueco y se publican las N tandas de
tiradas, cada una etiquetada con su objetivo y su «2 de 3». Se pueden repartir
o concentrar en el mismo blanco, que es lo que dicen los conjuros. Una chapa
×3 en el nombre avisa de que golpea varias veces.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 5: `PanelCombate.tsx` — cablearlo todo

**Files:**
- Modify: `components/tablero/PanelCombate.tsx`

- [ ] **Step 1: Añade el import de `ataquesPorAccion`**

`PanelCombate` no importa nada de `lib/ataque` todavía. Añade una línea nueva
junto a los otros imports de `@/lib/` (por ejemplo, debajo del de `lib/tablero`):

```tsx
import { ataquesPorAccion } from "@/lib/ataque";
```

- [ ] **Step 2: Dale `id` a los objetivos y construye la lista**

Sustituye este bloque:

```tsx
  const objetivo: Objetivo | null = token
    ? { label: token.label, distancia: distanciaA(token), conds: condsDe(token) }
    : null;
```

por:

```tsx
  const comoObjetivo = (t: Token): Objetivo => ({
    id: t.id,
    label: t.label,
    distancia: distanciaA(t),
    conds: condsDe(t),
  });
  const objetivo: Objetivo | null = token ? comoObjetivo(token) : null;
  // Todas las fichas apuntables, para los conjuros que golpean varias veces.
  const objetivosDisponibles: Objetivo[] = objetivos.map(comoObjetivo);
  // Cuántos golpes da la acción de Atacar a esta clase y nivel.
  const maxAtaques = clsSlug ? ataquesPorAccion(clsSlug, level) : 1;
```

- [ ] **Step 3: Pasa las props nuevas**

En el montaje de `<Ataques …>`, añade la línea `maxAtaques={maxAtaques}` (después de `objetivo={objetivo}`):

```tsx
            objetivo={objetivo}
            maxAtaques={maxAtaques}
```

En el montaje de `<Conjuros …>`, añade la línea `objetivosDisponibles={objetivosDisponibles}` (después de `objetivo={objetivo}`):

```tsx
            objetivo={objetivo}
            objetivosDisponibles={objetivosDisponibles}
```

- [ ] **Step 4: Verifica tipos y build**

Run: `npx tsc --noEmit && npx next build`
Expected: **ahora sí, los dos limpios** (las tareas 3 y 4 dejaban el árbol roto a propósito). Si `tsc` se queja en `app/dm/GrupoPanel.tsx`, es porque allí también se montan `Ataques`/`Conjuros`: las props nuevas son **opcionales**, así que no debería — pero si pasa, léelo y **no** cambies la forma pública; lo normal es que no haya que tocar ese archivo.

- [ ] **Step 5: Regresión completa de las capas puras**

Run: `npx tsx scripts/check-ataque.ts && npx tsx scripts/check-turno.ts && npx tsx scripts/check-spells.ts && npx tsx scripts/check-conjuros.ts && npx tsx scripts/check-targeting.ts && npx tsx scripts/check-estado.ts`
Expected: los seis en `Todo en verde`.

- [ ] **Step 6: Commit**

```bash
git add components/tablero/PanelCombate.tsx
git commit -F - <<'EOF'
feat(objetivos): PanelCombate reparte los ataques y la lista de objetivos

Calcula cuántos golpes da la acción de Atacar con ataquesPorAccion y se lo
pasa a Ataques; y construye la lista de fichas apuntables (con su id y su
distancia) para que los conjuros de varias instancias puedan declarar un
objetivo por cada una. El día que entren las áreas, la geometría solo tiene
que producir esta misma lista.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 6: Gate final + documentación

**Files:**
- Modify: `HANDOFF.md`
- Modify: vault Obsidian (`C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria`)

- [ ] **Step 1: Gate completo — los once scripts**

Run: `for s in ficha spells conjuros targeting estado turno ataque tablero clases lore clima; do printf "%-10s " "$s:"; npx tsx scripts/check-$s.ts 2>&1 | tail -1; done`
Expected: los once terminan en `Todo en verde` (check-clima imprime `Todo OK`).

- [ ] **Step 2: Gate completo — tipos y build**

Run: `npx tsc --noEmit && npx next build`
Expected: ambos limpios.

- [ ] **Step 3: Actualiza `HANDOFF.md`**

- En «Lo último» de la cabecera, añade la entrada **13** (2026-07-26): objetivos múltiples — varios golpes por acción eligiendo objetivo entre golpe y golpe, ataque de acción adicional con dos armas ligeras, y conjuros de varias instancias con objetivos declarados. Sin migración.
- Añade una sección `## RESUELTO (2026-07-26): objetivos múltiples 🎯🎯` con el molde de las demás: rama `objetivos-multiples`, sin migración, `ataquesPorAccion` (y de dónde salen los datos), el contador en `play_state.turno`, la propiedad `ligera` (con el aviso de la Ballesta ligera), `instancias` y que el daño pasa a ser siempre por instancia (arreglando la incoherencia de O2), qué queda fuera (**áreas**, Ráfaga de Golpes, estilos de combate, conjuros de varios objetivos sin tirada) y las **pruebas del usuario** copiadas del final del spec.
- En «Siguiente sugerido», apunta que la continuación natural es la losa de **áreas** (esfera/cono/línea sobre la rejilla), que ya tiene el modelo de lista preparado.

- [ ] **Step 4: Actualiza el vault**

En `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria`:
- `00 Meta/Historial de desarrollo.md`: callout `> [!success] Objetivos múltiples (2026-07-26)` ARRIBA del de la pantalla de combate, contando las tres formas que entran, la que no (áreas) y por qué el modelo de lista las deja entrar sin rehacer nada.
- `30 Componentes/Componentes clave.md`: actualiza `Ataques` (varios golpes, otra mano) y `Conjuros` (instancias).
- `40 Datos del juego/`: si hay nota de armas o conjuros, anota `ligera` e `instancias`.

- [ ] **Step 5: Commit de la documentación**

```bash
git add HANDOFF.md
git commit -F - <<'EOF'
docs(objetivos): HANDOFF y vault con los objetivos múltiples

Varios golpes por acción eligiendo objetivo entre golpe y golpe, ataque de
acción adicional con dos armas ligeras, y conjuros de varias instancias con
sus objetivos declarados antes de resolver. Sin migración. Las áreas quedan
para la losa siguiente y encajan sin rehacer nada.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

- [ ] **Step 6: Merge a `master` y push** (tras las pruebas en vivo del usuario, o cuando él lo decida)

```bash
git checkout master && git merge --no-ff objetivos-multiples && git push origin master
```

---

## Notas de verificación en vivo (del usuario)

Sin sesión ni fichas del tablero en dev, nada de esto se prueba desde aquí. Tras desplegar:

- **Guerrero nv5**: pegar, cambiar de objetivo en el desplegable, pegar otra vez. Ver «Ataque 1 de 2» → «2 de 2» → botón apagado. «Siguiente turno» lo reinicia.
- **Guerrero nv4**: sigue con un solo ataque (no debe salir el marcador).
- **Pícaro con dos dagas**: usar «Otra mano», ver que gasta la **adicional** (no un ataque) y que el daño va **sin** modificador.
- **Pícaro**: comprobar que NO tiene un segundo ataque de la acción (no lo da la clase).
- **Mago**: lanzar **Rayo Abrasador** repartiendo los tres rayos entre dos enemigos ⇒ tres tandas de tiradas etiquetadas «(1 de 3)», «(2 de 3)»… y **un solo hueco** gastado.
- **Proyectil Mágico**: tres dardos de **1d4+1** cada uno, no una tirada de 3d4+3.
- Que el resto siga igual: alcance, ventaja por condición y crítico no han cambiado.
