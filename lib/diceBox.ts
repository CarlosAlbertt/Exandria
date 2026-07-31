// Singleton imperativo del tablero de dados físico (@3d-dice/dice-box).
// No es un hook: publishRoll (lib/useDiceFeed) lo llama directamente. Guardado
// contra SSR y contra la ausencia de WebGL / prefers-reduced-motion, en cuyo
// caso rollVisual() devuelve null y el llamador usa el fallback aleatorio.
import {
  parseFormula, rollFromDice, keepHighestFromDice, droppedIndexes, d20FromDice, critState,
  type RollResult,
} from "@/lib/dice";

const COLOR_KEY = "exandria:diceColor";
const SOUND_KEY = "exandria:diceSound";
const DEFAULT_COLOR = "#b3202e"; // rojo D&D: números blancos del tema resaltan bien

// dice-box no publica tipos; describimos lo mínimo que usamos. `roll()` se
// tipa como `unknown` a propósito: su forma la resuelve facesFrom().
type DiceBoxInstance = {
  init: () => Promise<unknown>;
  roll: (notation: string, opts?: { theme?: string; themeColor?: string }) => Promise<unknown>;
  onCollision?: (a: number, b: number, force: number) => void;
};

// Caras que salieron, a partir de lo que resuelve `box.roll()`.
//
// OJO: dice-box 1.1.4 NO devuelve grupos, devuelve un array PLANO de dados
// ({ value, sides, groupId, rollId }) — la colección nace con `rolls: []` y se
// le empuja un dado por tirada. Leer `res[0].rolls` daba undefined y el .map
// reventaba: el TypeError se comía el `catch`, rollVisual devolvía null y
// TODA tirada de la app caía al fallback aleatorio. Los dados de la mesa eran
// decoración y el número salía de otro sitio.
//
// Aceptamos las dos formas (dados sueltos y grupos con `rolls`) para que un
// cambio de versión no vuelva a dejarlo mudo.
// Se exporta para que el gate pueda mirarla: este fallo pasó desapercibido
// justo porque no había forma de comprobar la lectura del resultado.
export function facesFrom(res: unknown): number[] {
  if (!Array.isArray(res)) return [];
  const out: number[] = [];
  for (const el of res as Array<{ value?: unknown; rolls?: Array<{ value?: unknown }> }>) {
    if (el && Array.isArray(el.rolls)) {
      for (const die of el.rolls) if (typeof die?.value === "number") out.push(die.value);
    } else if (typeof el?.value === "number") {
      out.push(el.value);
    }
  }
  return out;
}

let instance: DiceBoxInstance | null = null;
let initPromise: Promise<DiceBoxInstance | null> | null = null;

// Estado del overlay de tirada (estilo Baldur's Gate): aparece cuando hace
// falta una tirada, el jugador LANZA (clic), salen los dados y el resultado, y
// se cierra. El componente DiceBoard se suscribe a estas fases.
//  - "ready":   dado listo, esperando que el jugador lo lance
//  - "rolling": rodando (física)
//  - "result":  reposaron; total/crit visibles antes de cerrar
//  - "hidden":  cancelado/sin resultado
export type DiceBoardPhase = "ready" | "rolling" | "result" | "hidden";
export type DiceBoardEvent = {
  phase: DiceBoardPhase;
  label: string | null;
  mod: number;
  total: number | null;
  crit: "crit" | "fumble" | null;
  // Caras que salieron, para el desglose bajo el total. `dropped` son los
  // índices que NO cuentan (4d6 descartando el menor); vacío en el resto de
  // tiradas, donde todos los dados suman.
  rolls: number[] | null;
  dropped: number[];
};
let boardListener: ((e: DiceBoardEvent) => void) | null = null;
export function setBoardListener(fn: ((e: DiceBoardEvent) => void) | null): void {
  boardListener = fn;
}
function emitBoard(e: DiceBoardEvent): void {
  boardListener?.(e);
}

// El jugador lanza los dados: resuelve la espera de rollVisual (fase "ready").
let awaitingThrow: (() => void) | null = null;
export function triggerThrow(): void {
  const fn = awaitingThrow;
  awaitingThrow = null;
  fn?.();
}
export function isAwaitingThrow(): boolean {
  return awaitingThrow !== null;
}

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

// AudioContext único y reutilizado (crear uno por colisión petaba el hilo).
let audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

// Un "click" corto de colisión con WebAudio (sin assets de audio externos).
function playClack(force: number) {
  if (!getDiceSound()) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 180 + Math.min(force, 6) * 40;
  gain.gain.setValueAtTime(Math.min(0.12, 0.03 * force), ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.09);
}

// dice-box no dimensiona su canvas al contenedor (queda a 0×0 o al 300×150 por
// defecto y no se ve nada). Forzamos el búfer de dibujo al tamaño real del
// contenedor y avisamos del resize para que Babylon ajuste su viewport. Se
// re-aplica en cada resize de ventana (el escenario usa min(vw…) y cambia).
function fitCanvasToContainer(selector: string): void {
  if (typeof window === "undefined") return;
  const el = document.querySelector(selector) as HTMLElement | null;
  const cv = el?.querySelector("canvas") as HTMLCanvasElement | null;
  if (!el || !cv) return;
  const fit = () => {
    if (el.clientWidth > 0 && el.clientHeight > 0) {
      cv.width = el.clientWidth;
      cv.height = el.clientHeight;
    }
    cv.style.width = "100%";
    cv.style.height = "100%";
  };
  fit();
  window.dispatchEvent(new Event("resize")); // que Babylon reajuste el viewport
  window.addEventListener("resize", fit);
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
        enableShadows: false, // sombras = coste alto de render (evita el "petado")
        offscreen: false, // offscreen rompía el auto-sizing (canvas quedaba 300×150)
        lightIntensity: 1.1,
      });
      box.onCollision = (_a, _b, force) => { if (force > 1) playClack(force); };
      await box.init();
      fitCanvasToContainer(selector); // dice-box deja el canvas a 0×0: lo ajustamos
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

// Tirada interactiva estilo Baldur's Gate: muestra el dado, ESPERA a que el
// jugador lo lance (triggerThrow), rueda la física y devuelve el RollResult
// construido con las caras reales. Devuelve null si el tablero no está
// soportado/listo (→ el llamador usa el roll() aleatorio) o si ya hay otra
// tirada pendiente. `formula` ya debe estar validada por el llamador.
//
// `keep`: quédate solo con las N caras más altas (4d6 descartando el menor).
//   El total que se emite al tablero es YA el de las conservadas — si el
//   llamador descartara por su cuenta, el número visto y el guardado no serían
//   el mismo (pasó justo eso en la tirada de aptitudes).
// `hold`: milisegundos que el resultado se queda antes de resolver. Sin esto,
//   una tirada en bucle emite "ready" de la siguiente en la misma cadena de
//   microtareas y el resultado se borra sin llegar a pintarse.
export async function rollVisual(
  formula: string,
  opts?: { mod?: number; adv?: "adv" | "dis"; check?: boolean; label?: string; keep?: number; hold?: number }
): Promise<RollResult | null> {
  if (!isDiceBoxSupported()) return null;
  // Init perezoso: dice-box (y su bucle de render WebGL) solo arranca en la
  // primera tirada real, no en cada página. El canvas #dice-board-canvas ya
  // está montado (y dimensionado) por DiceBoard desde el inicio.
  const box = instance ?? (await initDiceBox("#dice-board-canvas"));
  if (!box) return null;
  if (awaitingThrow) return null; // ya hay una tirada esperando lanzamiento

  const label = opts?.label ?? null;
  const isCheck = !!opts?.check && typeof opts.mod === "number";
  const mod = isCheck ? (opts!.mod as number) : (parseFormula(formula)?.mod ?? 0);

  const quiet = { label, mod, total: null, crit: null, rolls: null, dropped: [] };

  // Fase "ready": dado a la espera de que el jugador lo lance.
  emitBoard({ phase: "ready", ...quiet });
  await new Promise<void>((resolve) => { awaitingThrow = resolve; });

  emitBoard({ phase: "rolling", ...quiet });
  try {
    let result: RollResult;
    let dropped: number[] = [];
    if (isCheck) {
      const qty = opts!.adv ? 2 : 1;
      const dice = facesFrom(await box.roll(`${qty}d20`, { themeColor: getDiceColor() }));
      // Si no salen tantas caras como dados se pidieron, no inventamos un
      // total con lo que haya: se cae al fallback, que al menos es honesto.
      if (dice.length !== qty) throw new Error(`dice-box devolvió ${dice.length} caras de ${qty}`);
      result = d20FromDice(dice, opts!.mod as number, opts!.adv);
    } else {
      const parsed = parseFormula(formula);
      if (!parsed) { emitBoard({ phase: "hidden", ...quiet }); return null; }
      const dice = facesFrom(await box.roll(`${parsed.n}d${parsed.die}`, { themeColor: getDiceColor() }));
      if (dice.length !== parsed.n) throw new Error(`dice-box devolvió ${dice.length} caras de ${parsed.n}`);
      if (typeof opts?.keep === "number" && opts.keep < dice.length) {
        dropped = droppedIndexes(dice, opts.keep);
        result = keepHighestFromDice(formula, dice, opts.keep, parsed.mod);
      } else {
        result = rollFromDice(formula, dice, parsed.mod);
      }
    }
    const crit = critState(result.formula, result.rolls);
    emitBoard({ phase: "result", label, mod, total: result.total, crit, rolls: result.rolls, dropped });
    // El resultado se queda en pantalla antes de devolver el control: quien
    // tira en bucle no puede tapar su propio número con la tirada siguiente.
    if (opts?.hold) await new Promise<void>((r) => setTimeout(r, opts.hold));
    return result;
  } catch (e) {
    console.warn("[diceBox] rollVisual falló; fallback.", e);
    emitBoard({ phase: "hidden", ...quiet });
    return null;
  }
}
