# Fase A — Dados 3D con física (tablero virtual) — Plan de implementación

> **Para trabajadores agénticos:** SUB-SKILL REQUERIDA: usa
> superpowers:subagent-driven-development (recomendado) o
> superpowers:executing-plans para ejecutar tarea a tarea. Los pasos usan
> checkbox (`- [ ]`). Convención del repo: un subagente **implementador** +
> un **revisor** Sonnet por tarea.

**Goal:** Que cuando alguien tire dados, rueden físicamente por la pantalla y
el resultado del feed en vivo salga de esa física, sin romper ninguna tirada
actual (hoja, dados rápidos, fórmula libre, iniciativa, peticiones) y con
fallback intacto sin WebGL / con `prefers-reduced-motion`.

**Architecture:** Todas las tiradas ya pasan por `publishRoll` en
`lib/useDiceFeed.ts` (6 puntos de llamada en 3 componentes). Añadimos un
**singleton imperativo** `lib/diceBox.ts` que envuelve `@3d-dice/dice-box`
(WebGL/BabylonJS + física, assets locales en `public/dice-box/`). Un
componente overlay `DiceBoard` montado en `app/layout.tsx` inicializa el
singleton. `publishRoll` intenta animar con `rollVisual()` → si obtiene los
valores físicos construye el `RollResult` a partir de ellos y publica con
`publishRollResult()`; si el singleton no está soportado/listo, cae al
`roll()`/`d20Check()` actual. El motor `lib/dice.ts` sigue **validando la
fórmula** (lista blanca de dados) y aporta helpers puros y testeables que
convierten caras físicas en `RollResult`.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript ·
`@3d-dice/dice-box` (única dependencia nueva) · Supabase Realtime (feed
existente) · localStorage (color de dado + toggle de sonido, sin migración).

---

## Estructura de archivos

- **Crear** `lib/diceBox.ts` — singleton del tablero físico: `isDiceBoxSupported()`,
  `initDiceBox(selector)`, `rollVisual(...)`, `getDiceColor()/setDiceColor()`,
  `getDiceSound()/setDiceSound()`. Client-only, guardado contra SSR.
- **Crear** `components/DiceBoard.tsx` — overlay transparente a pantalla
  completa que monta el contenedor del canvas e inicializa el singleton.
- **Crear** `scripts/copy-dice-assets.mjs` — copia los assets de dice-box de
  `node_modules` a `public/dice-box/assets` (postinstall + refresco manual).
- **Crear** `scripts/check-dicebox.ts` — comprobaciones puras de los helpers
  de `lib/dice.ts` (estilo `scripts/check-dice.ts`).
- **Modificar** `lib/dice.ts` — helpers puros `rollFromDice`, `d20FromDice`,
  `critState`.
- **Modificar** `lib/useDiceFeed.ts` — extraer `publishRollResult`; `publishRoll`
  orquesta visual + fallback.
- **Modificar** `components/DicePanel.tsx` — efectos crítico/pifia + animación
  de entrada en el feed, selector de color de dado, toggle de sonido, toast de
  tirada ajena (A2).
- **Modificar** `app/layout.tsx` — montar `<DiceBoard />` dentro de
  `SessionProvider` (junto a `EpicOverlay`).
- **Modificar** `app/globals.css` — clases de animación (flash dorado, tinte
  rojo, aparición de entrada del feed).
- **Modificar** `package.json` — dependencia + script `postinstall` y
  `copy-dice-assets`.
- **Modificar** `.gitignore` — **no** ignorar `public/dice-box/` (los assets se
  commitean para build fiable en Vercel y funcionamiento offline).

---

## Task 0: Instalar dependencia y assets locales

**Files:**
- Modify: `package.json`
- Create: `scripts/copy-dice-assets.mjs`
- Create (commit): `public/dice-box/assets/**` (copiados por el script)

- [ ] **Step 1: Instalar la dependencia**

Run:
```bash
npm install @3d-dice/dice-box
```
Expected: `@3d-dice/dice-box` aparece en `dependencies` de `package.json`.

- [ ] **Step 2: Localizar los assets del paquete**

Run:
```bash
ls node_modules/@3d-dice/dice-box/dist/assets
```
Expected: contiene `ammo/`, `models/`, `themes/` (carpeta de assets que
dice-box carga en runtime vía `assetPath`).

- [ ] **Step 3: Escribir el script de copia**

Create `scripts/copy-dice-assets.mjs`:
```js
// Copia los assets de @3d-dice/dice-box a public/dice-box/assets para que la
// app los sirva localmente (offline, compatible con Vercel). Se ejecuta en
// postinstall y puede lanzarse a mano: node scripts/copy-dice-assets.mjs
import { cp, rm, mkdir, access } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url)) + "/..";
const src = `${root}/node_modules/@3d-dice/dice-box/dist/assets`;
const dest = `${root}/public/dice-box/assets`;

try {
  await access(src);
} catch {
  console.warn("[copy-dice-assets] assets de dice-box no encontrados; se omite.");
  process.exit(0);
}

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await cp(src, dest, { recursive: true });
console.log(`[copy-dice-assets] assets copiados a ${dest}`);
```

- [ ] **Step 4: Añadir scripts a package.json**

Modify `package.json` `scripts` (añadir estas dos claves, conservar las demás):
```json
"copy-dice-assets": "node scripts/copy-dice-assets.mjs",
"postinstall": "node scripts/copy-dice-assets.mjs"
```

- [ ] **Step 5: Ejecutar la copia y verificar**

Run:
```bash
npm run copy-dice-assets && ls public/dice-box/assets
```
Expected: imprime `assets copiados a …` y lista `ammo/ models/ themes/`.

- [ ] **Step 6: Asegurar que .gitignore NO ignora public/dice-box**

Confirma que `.gitignore` no contiene una regla que excluya `public/` ni
`public/dice-box`. (Estado actual: solo ignora `node_modules`, `.next`,
`.env*.local`, `tsconfig.tsbuildinfo`, `.superpowers/`. No hay que tocar nada,
solo verificarlo.)

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json scripts/copy-dice-assets.mjs public/dice-box
git commit -m "feat(dados): añade @3d-dice/dice-box y copia sus assets a public/"
```

---

## Task 1: Helpers puros en lib/dice.ts (caras físicas → RollResult)

Estos helpers son la costura entre la física y el feed: dice-box da el valor
de cada dado; nosotros construimos el `RollResult` para que **el total del
feed sea exactamente la suma de los dados que se vieron**. Espejan la
semántica de `roll()`/`d20Check()` (mismo string de fórmula, misma elección
adv/dis) pero tomando las caras de fuera en vez de `Math.random`.

**Files:**
- Modify: `lib/dice.ts` (añadir al final, tras `fmtRoll`)
- Test: `scripts/check-dicebox.ts`

- [ ] **Step 1: Escribir el script de comprobación (falla primero)**

Create `scripts/check-dicebox.ts`:
```ts
// Comprobación manual de los helpers físicos de lib/dice.ts.
// Uso: npx tsx scripts/check-dicebox.ts
import { rollFromDice, d20FromDice, critState } from "../lib/dice";

let failures = 0;
function check(label: string, condition: boolean) {
  if (condition) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

// rollFromDice: total = suma de caras + modificador; conserva las caras dadas.
{
  const r = rollFromDice("2d6+3", [4, 5], 3);
  check("rollFromDice([4,5],+3): total 12", r.total === 12);
  check("rollFromDice conserva rolls [4,5]", JSON.stringify(r.rolls) === "[4,5]");
  check("rollFromDice modifier 3", r.modifier === 3);
  check("rollFromDice formula intacta", r.formula === "2d6+3");
}
{
  const r = rollFromDice("1d100", [77], 0);
  check("rollFromDice sin modificador: total = cara", r.total === 77 && r.modifier === 0);
}

// d20FromDice: normal usa la única cara; adv toma max; dis toma min.
{
  const r = d20FromDice([13], 5);
  check("d20FromDice([13],+5) normal: total 18, 1 dado", r.total === 18 && r.rolls.length === 1);
  check("d20FromDice normal: formula 1d20+5", r.formula === "1d20+5");
}
{
  const r = d20FromDice([18, 5], 3, "adv");
  check("d20FromDice([18,5],+3,adv): total = max+mod = 21", r.total === 21);
  check("d20FromDice adv: formula con (ventaja)", r.formula === "1d20+3 (ventaja)");
  check("d20FromDice adv: conserva ambos dados", JSON.stringify(r.rolls) === "[18,5]");
}
{
  const r = d20FromDice([18, 5], 0, "dis");
  check("d20FromDice([18,5],0,dis): total = min = 5", r.total === 5);
  check("d20FromDice dis: formula con (desventaja)", r.formula === "1d20+0 (desventaja)");
}
{
  const r = d20FromDice([7], -2);
  check("d20FromDice([7],-2): total 5, formula 1d20-2", r.total === 5 && r.formula === "1d20-2");
}

// critState: crítico si la cara elegida del d20 es 20; pifia si es 1.
check("critState ventaja elige max: [20,3] -> crit", critState("1d20+3 (ventaja)", [20, 3]) === "crit");
check("critState desventaja elige min: [20,1] -> fumble", critState("1d20+0 (desventaja)", [20, 1]) === "fumble");
check("critState desventaja: [20,3] descarta el 20 -> null", critState("1d20+3 (desventaja)", [20, 3]) === null);
check("critState normal [1] -> fumble", critState("1d20-2", [1]) === "fumble");
check("critState dado rápido d20 [20] -> crit", critState("1d20", [20]) === "crit");
check("critState no-d20 [6] -> null", critState("2d6+3", [4, 2]) === null);

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} fallaron.`);
process.exit(failures === 0 ? 0 : 1);
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx tsx scripts/check-dicebox.ts`
Expected: FALLA al importar (`rollFromDice`/`d20FromDice`/`critState` no
existen todavía en `lib/dice.ts`).

- [ ] **Step 3: Implementar los helpers en lib/dice.ts**

Añadir al final de `lib/dice.ts` (tras `fmtRoll`):
```ts
// --- Puente con los dados físicos (dice-box) --------------------------------
// dice-box calcula el valor de cada dado por física; estos helpers construyen
// el mismo RollResult que roll()/d20Check() pero tomando esas caras, para que
// el total del feed sea exactamente la suma de los dados que se vieron rodar.

// Fórmula libre / dado rápido: `dice` son las N caras de NdX; total = suma+mod.
export function rollFromDice(formula: string, dice: number[], mod: number): RollResult {
  const total = dice.reduce((a, b) => a + b, 0) + mod;
  return { formula: formula.trim(), rolls: dice, modifier: mod, total };
}

// Chequeo d20: dice = [a] normal, [a,b] con ventaja/desventaja. La fórmula
// resultante coincide con la de d20Check (incluye " (ventaja)"/" (desventaja)").
export function d20FromDice(dice: number[], mod: number, adv?: "adv" | "dis"): RollResult {
  const picked = adv === "adv" ? Math.max(...dice) : adv === "dis" ? Math.min(...dice) : dice[0];
  const total = picked + mod;
  const suffix = adv === "adv" ? " (ventaja)" : adv === "dis" ? " (desventaja)" : "";
  const sign = mod < 0 ? "-" : "+";
  const formula = `1d20${sign}${Math.abs(mod)}${suffix}`;
  return { formula, rolls: dice, modifier: mod, total };
}

// Estado crítico de una tirada d20, para efectos visuales del feed. Solo
// aplica a tiradas de un d20 (chequeo o fórmula que empieza por 1d20/2d20).
// La cara "elegida" se deduce de la fórmula: (ventaja)=max, (desventaja)=min,
// resto=primer dado. Crítico si la elegida es 20; pifia si es 1.
export function critState(formula: string, rolls: number[]): "crit" | "fumble" | null {
  const isD20 = /^1d20|^2d20|^1d20|\bd20\b/i.test(formula) && /d20/i.test(formula);
  if (!isD20 || rolls.length === 0) return null;
  const picked = /\(ventaja\)/.test(formula)
    ? Math.max(...rolls)
    : /\(desventaja\)/.test(formula)
      ? Math.min(...rolls)
      : rolls[0];
  if (picked === 20) return "crit";
  if (picked === 1) return "fumble";
  return null;
}
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npx tsx scripts/check-dicebox.ts`
Expected: todas OK, exit 0.

- [ ] **Step 5: Commit**

```bash
git add lib/dice.ts scripts/check-dicebox.ts
git commit -m "feat(dados): helpers puros para construir RollResult desde caras físicas"
```

---

## Task 2: Singleton del tablero físico (`lib/diceBox.ts`)

Envuelve dice-box detrás de una API imperativa que `publishRoll` pueda llamar
sin ser un hook. Lazy-init disparado por `DiceBoard` (Task 3). Si no hay
soporte (SSR, sin WebGL, `prefers-reduced-motion`), todo es no-op y
`rollVisual` devuelve `null` para que el llamador caiga al fallback.

**Files:**
- Create: `lib/diceBox.ts`

- [ ] **Step 1: Escribir el módulo**

Create `lib/diceBox.ts`:
```ts
// Singleton imperativo del tablero de dados físico (@3d-dice/dice-box).
// No es un hook: publishRoll (lib/useDiceFeed) lo llama directamente. Guardado
// contra SSR y contra la ausencia de WebGL / prefers-reduced-motion, en cuyo
// caso rollVisual() devuelve null y el llamador usa el fallback aleatorio.
import { parseFormula, rollFromDice, d20FromDice, type RollResult } from "@/lib/dice";

const COLOR_KEY = "exandria:diceColor";
const SOUND_KEY = "exandria:diceSound";
const DEFAULT_COLOR = "#c8a24a"; // bronce, coherente con --color-bronze

// dice-box no publica tipos; describimos lo mínimo que usamos.
type DieRoll = { value: number };
type RollGroup = { value: number; rolls: DieRoll[] };
type DiceBoxInstance = {
  init: () => Promise<unknown>;
  roll: (notation: string, opts?: { theme?: string; themeColor?: string }) => Promise<RollGroup[]>;
  onCollision?: (a: number, b: number, force: number) => void;
};

let instance: DiceBoxInstance | null = null;
let initPromise: Promise<DiceBoxInstance | null> | null = null;

export function isDiceBoxSupported(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function getDiceColor(): string {
  if (typeof window === "undefined") return DEFAULT_COLOR;
  return window.localStorage.getItem(COLOR_KEY) || DEFAULT_COLOR;
}
export function setDiceColor(hex: string): void {
  if (typeof window !== "undefined") window.localStorage.setItem(COLOR_KEY, hex);
}
export function getDiceSound(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SOUND_KEY) === "1";
}
export function setDiceSound(on: boolean): void {
  if (typeof window !== "undefined") window.localStorage.setItem(SOUND_KEY, on ? "1" : "0");
}

// Un "click" corto de colisión con WebAudio (sin assets de audio externos).
function playClack(force: number) {
  if (!getDiceSound() || typeof window === "undefined") return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 180 + Math.min(force, 6) * 40;
  gain.gain.setValueAtTime(Math.min(0.12, 0.03 * force), ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.09);
  osc.onended = () => ctx.close();
}

// Inicializa el tablero sobre `selector`. Idempotente: reusa la misma
// promesa/instancia entre montajes (React remonta 2× en dev).
export function initDiceBox(selector: string): Promise<DiceBoxInstance | null> {
  if (!isDiceBoxSupported()) return Promise.resolve(null);
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const mod = await import("@3d-dice/dice-box");
      const DiceBox = mod.default as new (cfg: Record<string, unknown>) => DiceBoxInstance;
      const box = new DiceBox({
        assetPath: "/dice-box/assets/",
        container: selector,
        scale: 6,
        theme: "default",
        themeColor: getDiceColor(),
        enableShadows: true,
        offscreen: true,
      });
      box.onCollision = (_a, _b, force) => { if (force > 1) playClack(force); };
      await box.init();
      instance = box;
      return box;
    } catch (e) {
      console.warn("[diceBox] init falló; se usará el fallback aleatorio.", e);
      instance = null;
      return null;
    }
  })();
  return initPromise;
}

// Anima una tirada y devuelve el RollResult construido con las caras físicas.
// Devuelve null si el tablero no está listo/soportado (→ el llamador usa el
// roll() aleatorio). `formula` ya debe estar validada por el llamador.
export async function rollVisual(
  formula: string,
  opts?: { mod?: number; adv?: "adv" | "dis"; check?: boolean }
): Promise<RollResult | null> {
  if (!isDiceBoxSupported()) return null;
  const box = instance ?? (initPromise ? await initPromise : null);
  if (!box) return null;

  try {
    if (opts?.check && typeof opts.mod === "number") {
      const qty = opts.adv ? 2 : 1;
      const groups = await box.roll(`${qty}d20`, { themeColor: getDiceColor() });
      const dice = groups[0].rolls.map((r) => r.value);
      return d20FromDice(dice, opts.mod, opts.adv);
    }
    const parsed = parseFormula(formula);
    if (!parsed) return null;
    const groups = await box.roll(`${parsed.n}d${parsed.die}`, { themeColor: getDiceColor() });
    const dice = groups[0].rolls.map((r) => r.value);
    return rollFromDice(formula, dice, parsed.mod);
  } catch (e) {
    console.warn("[diceBox] rollVisual falló; fallback.", e);
    return null;
  }
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores. (dice-box no trae tipos propios; el `import()`
dinámico y el cast a `DiceBoxInstance` evitan el error. Si tsc se queja de
"Could not find a declaration file for module '@3d-dice/dice-box'", crear
`types/dice-box.d.ts` con `declare module "@3d-dice/dice-box";` y confirmar que
`tsconfig.json` incluye la carpeta `types` — normalmente ya cubierta por el
glob por defecto de Next.)

- [ ] **Step 3: Commit**

```bash
git add lib/diceBox.ts
git commit -m "feat(dados): singleton del tablero físico con fallback sin WebGL"
```

---

## Task 3: Componente overlay `DiceBoard` + montaje en el layout

**Files:**
- Create: `components/DiceBoard.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Escribir el componente**

Create `components/DiceBoard.tsx`:
```tsx
"use client";

import { useEffect } from "react";
import { initDiceBox } from "@/lib/diceBox";

// Overlay transparente a pantalla completa donde ruedan los dados físicos.
// pointer-events:none para no bloquear la UI; z alto pero por debajo de
// EpicOverlay. Monta el contenedor e inicializa el singleton una sola vez.
export default function DiceBoard() {
  useEffect(() => {
    void initDiceBox("#dice-board-canvas");
  }, []);

  return (
    <div
      id="dice-board-canvas"
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 60 }}
    />
  );
}
```

- [ ] **Step 2: Montar en el layout dentro de SessionProvider**

Modify `app/layout.tsx`: añadir el import y montar `<DiceBoard />` junto a
`<EpicOverlay />`.

Import (tras la línea de `EpicOverlay`):
```tsx
import DiceBoard from "@/components/DiceBoard";
```
Dentro del `<SessionProvider>`, tras el bloque `<ErrorBoundary>…</ErrorBoundary>`:
```tsx
            <DiceBoard />
```
(Queda dentro de `SessionProvider` para montarse solo con sesión, igual que
`EpicOverlay`.)

- [ ] **Step 3: Verificar build**

Run: `npx tsc --noEmit && npm run build`
Expected: build limpio.

- [ ] **Step 4: Verificar en preview que el canvas monta sin errores**

Arrancar el dev server (preview_start) y en la consola del navegador
comprobar que no hay errores de dice-box y que existe un `<canvas>` dentro de
`#dice-board-canvas`. (No hace falta tirar todavía; solo que inicializa.)

- [ ] **Step 5: Commit**

```bash
git add components/DiceBoard.tsx app/layout.tsx
git commit -m "feat(dados): overlay DiceBoard e inicialización en el layout"
```

---

## Task 4: Cablear `publishRoll` → visual + `publishRollResult`

Refactor de `lib/useDiceFeed.ts`: extraer la inserción en BD a
`publishRollResult`, y que `publishRoll` primero intente animar
(`rollVisual`), cayendo al `roll()`/`d20Check()` actual si el tablero no está.
El comportamiento y la firma pública de `publishRoll` no cambian para los
llamadores existentes.

**Files:**
- Modify: `lib/useDiceFeed.ts`

- [ ] **Step 1: Añadir el import del tablero**

En `lib/useDiceFeed.ts`, junto a los imports de `@/lib/dice`:
```ts
import { roll, d20Check, type RollResult } from "@/lib/dice";
import { rollVisual } from "@/lib/diceBox";
```

- [ ] **Step 2: Extraer `publishRollResult` y reescribir `publishRoll`**

Reemplazar la función `publishRoll` (líneas ~69-98) por estas dos funciones:
```ts
// Inserta en la BD una tirada YA resuelta (por la física o por el fallback).
async function publishRollResult(
  userId: string,
  kind: RollKind,
  label: string,
  result: RollResult,
  opts?: { priv?: boolean; requestId?: number }
): Promise<{ error: string | null; result: RollResult }> {
  const { error } = await createClient().from("dice_rolls").insert({
    user_id: userId,
    kind,
    label,
    formula: result.formula,
    rolls: result.rolls,
    total: result.total,
    private: opts?.priv ?? false,
    request_id: opts?.requestId ?? null,
  });
  return { error: error?.message ?? null, result };
}

// Publica una tirada. Anima con el tablero físico si está disponible y
// construye el resultado con las caras que se vieron; si no, cae al roll()/
// d20Check() aleatorio de siempre. Rechaza fórmulas inválidas sin tocar la BD.
export async function publishRoll(
  userId: string,
  kind: RollKind,
  label: string,
  formula: string,
  opts?: { priv?: boolean; requestId?: number; adv?: "adv" | "dis"; mod?: number }
): Promise<{ error: string | null; result: RollResult | null }> {
  if (!supabaseConfigured) return { error: "Supabase no configurado", result: null };

  const isCheck = D20_KINDS.includes(kind) && typeof opts?.mod === "number";

  // 1) Intento visual (física). null si el tablero no está soportado/listo.
  const visual = isCheck
    ? await rollVisual(formula, { check: true, mod: opts!.mod as number, adv: opts?.adv })
    : await rollVisual(formula);

  // 2) Fallback aleatorio, idéntico al comportamiento previo.
  const result = visual ?? (isCheck ? d20Check(opts!.mod as number, opts?.adv) : roll(formula));
  if (!result) return { error: "Fórmula de dado no válida.", result: null };

  return publishRollResult(userId, kind, label, result, { priv: opts?.priv, requestId: opts?.requestId });
}
```

Nota: el `roll(formula)` del fallback conserva la validación de fórmula (una
fórmula inválida devuelve `null` → error, sin insertar).

- [ ] **Step 3: Verificar que las comprobaciones de dados siguen pasando**

Run: `npx tsx scripts/check-dice.ts`
Expected: todas OK (no se tocó `lib/dice.ts` en esta tarea).

- [ ] **Step 4: Verificar tipos y build**

Run: `npx tsc --noEmit && npm run build`
Expected: build limpio.

- [ ] **Step 5: Commit**

```bash
git add lib/useDiceFeed.ts
git commit -m "feat(dados): publishRoll anima con el tablero físico y cae al fallback"
```

---

## Task 5: Efectos de crítico/pifia y animación de entrada en el feed

**Files:**
- Modify: `components/DicePanel.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Añadir clases de animación en globals.css**

Añadir al final de `app/globals.css`:
```css
/* Feed de dados: entrada + estados de crítico/pifia (Fase A) */
@keyframes dice-entry {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.dice-entry { animation: dice-entry 0.28s ease-out; }

@keyframes crit-flash {
  0%, 100% { box-shadow: 0 0 0 0 rgba(230, 190, 90, 0); }
  40%      { box-shadow: 0 0 14px 3px rgba(230, 190, 90, 0.7); }
}
.dice-crit {
  animation: crit-flash 1.1s ease-out;
  border-color: var(--color-bronze-bright) !important;
}
.dice-fumble {
  border-color: var(--color-ember) !important;
  background: color-mix(in srgb, var(--color-ember) 10%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .dice-entry, .dice-crit { animation: none; }
}
```

- [ ] **Step 2: Importar `critState` en DicePanel**

Modify `components/DicePanel.tsx` línea 8:
```tsx
import { parseFormula, fmtRoll, critState } from "@/lib/dice";
```

- [ ] **Step 3: Aplicar estado y badge en cada entrada del feed**

En el `.map` del feed (dentro del `rolls.map((r) => { … })`, ~línea 140),
tras calcular `breakdown`, añadir:
```tsx
              const crit = critState(r.formula, r.rolls);
```
Y en el `<div key={r.id} …>` de la entrada, añadir las clases de estado y el
badge. Reemplazar la apertura del div de la entrada por:
```tsx
                <div
                  key={r.id}
                  className={`panel-raised px-3 py-2 flex items-center justify-between gap-3 flex-wrap dice-entry ${
                    crit === "crit" ? "dice-crit" : crit === "fumble" ? "dice-fumble" : ""
                  }`}
                >
```
Y dentro de la columna derecha (junto a `breakdown`), antes del `<span>` del
total, añadir el badge:
```tsx
                    {crit === "crit" && (
                      <span className="font-ui text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--color-bronze)", color: "var(--color-night)" }}>¡CRÍTICO!</span>
                    )}
                    {crit === "fumble" && (
                      <span className="font-ui text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--color-ember)", color: "var(--color-night)" }}>PIFIA</span>
                    )}
```

- [ ] **Step 4: Verificar build**

Run: `npx tsc --noEmit && npm run build`
Expected: build limpio.

- [ ] **Step 5: Commit**

```bash
git add components/DicePanel.tsx app/globals.css
git commit -m "feat(dados): efectos de crítico/pifia y animación de entrada en el feed"
```

---

## Task 6: Selector de color de dado + toggle de sonido

**Files:**
- Modify: `components/DicePanel.tsx`

- [ ] **Step 1: Importar getters/setters del tablero**

Modify `components/DicePanel.tsx` (nuevo import):
```tsx
import { getDiceColor, setDiceColor, getDiceSound, setDiceSound } from "@/lib/diceBox";
```

- [ ] **Step 2: Estado local inicializado desde localStorage**

Dentro del componente, junto a los demás `useState`:
```tsx
  const [diceColor, setDiceColorState] = useState<string>("#c8a24a");
  const [sound, setSoundState] = useState<boolean>(false);
  useEffect(() => {
    setDiceColorState(getDiceColor());
    setSoundState(getDiceSound());
  }, []);
```
(Se leen en `useEffect` para no tocar `localStorage` en el render del
servidor. Añadir `useEffect` al import de `react` de la línea 3 si falta:
`import { useEffect, useMemo, useState } from "react";`.)

- [ ] **Step 3: Controles en la sección "Dado rápido"**

En la `<section className="panel p-4">` del tirador rápido, tras el bloque de
la fórmula libre (antes del toggle de tirada privada del DM), añadir:
```tsx
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <label className="flex items-center gap-2 font-ui text-[12px] font-semibold cursor-pointer select-none" style={{ color: "var(--color-muted)" }}>
            <i className="fas fa-palette" style={{ color: "var(--color-dim)" }} />Color del dado
            <input
              type="color"
              value={diceColor}
              onChange={(e) => { setDiceColorState(e.target.value); setDiceColor(e.target.value); }}
              className="w-7 h-7 rounded cursor-pointer bg-transparent border border-[var(--color-line)]"
              aria-label="Color del dado"
            />
          </label>
          <label className="flex items-center gap-2 font-ui text-[12px] font-semibold cursor-pointer select-none" style={{ color: "var(--color-muted)" }}>
            <input type="checkbox" checked={sound} onChange={(e) => { setSoundState(e.target.checked); setDiceSound(e.target.checked); }} />
            <i className="fas fa-volume-high" style={{ color: "var(--color-dim)" }} />Sonido de dados
          </label>
        </div>
```
(El color se aplica en la siguiente tirada: `rollVisual` lee `getDiceColor()`
en cada `roll`. El sonido lo lee `onCollision` en `lib/diceBox.ts`.)

- [ ] **Step 4: Verificar build**

Run: `npx tsc --noEmit && npm run build`
Expected: build limpio.

- [ ] **Step 5: Commit**

```bash
git add components/DicePanel.tsx
git commit -m "feat(dados): selector de color de dado y toggle de sonido (localStorage)"
```

---

## Task 7 (A2, opcional): Toast de tirada ajena

Al llegar una tirada de **otro** por realtime, mostrar un toast breve
"🎲 {nombre} ha sacado {total} en {label}". Sin replay físico (dice-box no
fuerza resultados en esta versión); es un aviso animado.

**Files:**
- Modify: `components/DicePanel.tsx`

- [ ] **Step 1: Detectar la tirada ajena más reciente**

Dentro de `DicePanel`, tras `const { rolls } = useDiceFeed();`:
```tsx
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const lastSeenRef = useRef<number | null>(null);
  useEffect(() => {
    if (rolls.length === 0) return;
    const newest = rolls[0];
    if (lastSeenRef.current === null) { lastSeenRef.current = newest.id; return; } // ignora la carga inicial
    if (newest.id !== lastSeenRef.current && newest.user_id !== myId && !newest.private) {
      setToast({ id: newest.id, text: `🎲 ${nameFor(newest.user_id)} ha sacado ${newest.total} en ${newest.label}` });
      const t = setTimeout(() => setToast(null), 3500);
      lastSeenRef.current = newest.id;
      return () => clearTimeout(t);
    }
    lastSeenRef.current = newest.id;
  }, [rolls, myId]);
```
(Añadir `useRef` al import de react: `import { useEffect, useMemo, useRef, useState } from "react";`.)

- [ ] **Step 2: Render del toast**

Al principio del `return (` del componente, dentro del `<div className="space-y-4">`,
como primer hijo:
```tsx
      {toast && (
        <div key={toast.id} className="fixed bottom-6 right-6 z-[70] panel-raised px-4 py-2.5 dice-entry" style={{ borderColor: "var(--color-bronze)" }}>
          <span className="font-ui text-[13px] font-bold" style={{ color: "var(--color-bronze-bright)" }}>{toast.text}</span>
        </div>
      )}
```

- [ ] **Step 3: Verificar build**

Run: `npx tsc --noEmit && npm run build`
Expected: build limpio.

- [ ] **Step 4: Commit**

```bash
git add components/DicePanel.tsx
git commit -m "feat(dados): toast de tirada ajena en el feed (A2)"
```

---

## Task 8: Verificación integral

**Files:** (ninguno — solo comprobación)

- [ ] **Step 1: Comprobaciones puras**

Run: `npx tsx scripts/check-dice.ts && npx tsx scripts/check-dicebox.ts`
Expected: ambos exit 0, todas OK.

- [ ] **Step 2: Tipos, build y lint**

Run: `npx tsc --noEmit && npm run build && npm run lint`
Expected: limpios.

- [ ] **Step 3: Verificación visual en preview (escritorio)**

Con el dev server arrancado y sesión iniciada:
- Ir a la superficie con `DicePanel` (Panel DM › Dados, y `/personaje`).
- Tirar un **dado rápido d20**, una **fórmula libre** (`2d6+3`), una
  **salvación/pericia** desde la hoja, y una **iniciativa**.
- Confirmar: los dados ruedan en el overlay; al reposar, la entrada del feed
  aparece con animación y **su total = suma de los dados que se vieron**.
- Forzar (repetir hasta ver) un **20 natural** → flash dorado + "¡CRÍTICO!" y
  un **1 natural** → tinte rojo + "PIFIA".
- Cambiar el **color del dado** y confirmar que la siguiente tirada usa el
  color nuevo. Activar **sonido** y confirmar el clac de colisión.

- [ ] **Step 4: Fallback sin animación**

- En DevTools, activar emulación de `prefers-reduced-motion: reduce` (o probar
  en un contexto sin WebGL) y confirmar que **las tiradas siguen funcionando**
  sin animación (usa el `roll()` aleatorio) y el feed se actualiza igual.

- [ ] **Step 5: Móvil**

- `resize_window` a mobile: confirmar que los dados ruedan y el panel es
  usable; la barra de controles (color/sonido) no rompe el layout.

- [ ] **Step 6: Actualizar HANDOFF + vault**

- HANDOFF.md: nueva sección `## RESUELTO (2026-07-13): Fase A — dados 3D`
  (componente `DiceBoard`, `lib/diceBox.ts`, integración por `publishRoll`,
  assets en `public/dice-box/`, fallback, color/sonido, toast A2).
- Vault Obsidian: `00 Meta/Pendientes.md` (marcar Fase A hecha) +
  `00 Meta/Historial de desarrollo.md` (entrada del hito).

- [ ] **Step 7: Commit final de docs**

```bash
git add HANDOFF.md
git commit -m "docs(dados): registra Fase A (dados 3D) en el HANDOFF"
```

---

## Self-review (cobertura del spec Fase A)

- ✅ Librería `@3d-dice/dice-box`, assets locales en `public/dice-box/` → Task 0.
- ✅ Componente `DiceBoard` overlay a pantalla completa, pointer-events none,
  z alto, montado junto al panel → Task 3.
- ✅ `publishRollResult` publica una tirada YA resuelta; `dice.ts` valida la
  fórmula; todos los puntos de tirada pasan por `publishRoll` → Tasks 1, 4.
- ✅ Efectos nat 20 (destello dorado + "¡CRÍTICO!") y nat 1 ("PIFIA"), entrada
  animada → Task 5.
- ✅ Espectadores A2 (toast) → Task 7. (Replay físico descartado: dice-box no
  fuerza resultados en esta versión; el spec lo condiciona a ello.)
- ✅ Color de dado por jugador + sonido opcional → Task 6. (Persistencia en
  localStorage, no en `characters`: evita migración; el spec permite ambas.)
- ✅ Fallback sin WebGL / reduced-motion sin romper nada → `isDiceBoxSupported`
  + fallback en `publishRoll`; verificado en Task 8.
- ✅ Verificación: escritorio + móvil, total del feed = dados vistos,
  iniciativa/peticiones siguen → Task 8.

## Decisiones cerradas (no reabrir sin motivo)
- **Assets commiteados** a `public/dice-box/assets` (no solo postinstall):
  build fiable en Vercel + offline. El postinstall los refresca tras
  `npm install`.
- **Color/sonido en localStorage**, no en Supabase: sin migración, Fase A se
  mantiene como "única dependencia nueva".
- **Sin replay físico** de tiradas ajenas: solo toast, por la limitación de
  dice-box.
