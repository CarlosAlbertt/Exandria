// Singleton imperativo del tablero de dados físico (@3d-dice/dice-box).
// No es un hook: publishRoll (lib/useDiceFeed) lo llama directamente. Guardado
// contra SSR y contra la ausencia de WebGL / prefers-reduced-motion, en cuyo
// caso rollVisual() devuelve null y el llamador usa el fallback aleatorio.
import { parseFormula, rollFromDice, d20FromDice, critState, type RollResult } from "@/lib/dice";

const COLOR_KEY = "exandria:diceColor";
const SOUND_KEY = "exandria:diceSound";
const DEFAULT_COLOR = "#b3202e"; // rojo D&D: números blancos del tema resaltan bien

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
        offscreen: true,
        lightIntensity: 1.1,
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

// Tirada interactiva estilo Baldur's Gate: muestra el dado, ESPERA a que el
// jugador lo lance (triggerThrow), rueda la física y devuelve el RollResult
// construido con las caras reales. Devuelve null si el tablero no está
// soportado/listo (→ el llamador usa el roll() aleatorio) o si ya hay otra
// tirada pendiente. `formula` ya debe estar validada por el llamador.
export async function rollVisual(
  formula: string,
  opts?: { mod?: number; adv?: "adv" | "dis"; check?: boolean; label?: string }
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

  // Fase "ready": dado a la espera de que el jugador lo lance.
  emitBoard({ phase: "ready", label, mod, total: null, crit: null });
  await new Promise<void>((resolve) => { awaitingThrow = resolve; });

  emitBoard({ phase: "rolling", label, mod, total: null, crit: null });
  try {
    let result: RollResult;
    if (isCheck) {
      const qty = opts!.adv ? 2 : 1;
      const groups = await box.roll(`${qty}d20`, { themeColor: getDiceColor() });
      const dice = groups[0].rolls.map((r) => r.value);
      result = d20FromDice(dice, opts!.mod as number, opts!.adv);
    } else {
      const parsed = parseFormula(formula);
      if (!parsed) { emitBoard({ phase: "hidden", label, mod, total: null, crit: null }); return null; }
      const groups = await box.roll(`${parsed.n}d${parsed.die}`, { themeColor: getDiceColor() });
      const dice = groups[0].rolls.map((r) => r.value);
      result = rollFromDice(formula, dice, parsed.mod);
    }
    const crit = critState(result.formula, result.rolls);
    emitBoard({ phase: "result", label, mod, total: result.total, crit });
    return result;
  } catch (e) {
    console.warn("[diceBox] rollVisual falló; fallback.", e);
    emitBoard({ phase: "hidden", label, mod, total: null, crit: null });
    return null;
  }
}
