// Singleton imperativo del tablero de dados físico (@3d-dice/dice-box).
// No es un hook: publishRoll (lib/useDiceFeed) lo llama directamente. Guardado
// contra SSR y contra la ausencia de WebGL / prefers-reduced-motion, en cuyo
// caso rollVisual() devuelve null y el llamador usa el fallback aleatorio.
import { parseFormula, rollFromDice, d20FromDice, type RollResult } from "@/lib/dice";

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

// Estado del tablero de mesa (overlay). El componente DiceBoard se suscribe y
// muestra/oculta la mesa de fieltro: `rolling` mientras ruedan los dados,
// `total`/`label` cuando reposan. rollVisual() emite estos eventos.
export type DiceBoardEvent = { rolling: boolean; total: number | null; label: string | null };
let boardListener: ((e: DiceBoardEvent) => void) | null = null;
export function setBoardListener(fn: ((e: DiceBoardEvent) => void) | null): void {
  boardListener = fn;
}
function emitBoard(e: DiceBoardEvent): void {
  boardListener?.(e);
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
        scale: 5,
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

// Anima una tirada y devuelve el RollResult construido con las caras físicas.
// Devuelve null si el tablero no está listo/soportado (→ el llamador usa el
// roll() aleatorio). `formula` ya debe estar validada por el llamador.
export async function rollVisual(
  formula: string,
  opts?: { mod?: number; adv?: "adv" | "dis"; check?: boolean; label?: string }
): Promise<RollResult | null> {
  if (!isDiceBoxSupported()) return null;
  const box = instance ?? (initPromise ? await initPromise : null);
  if (!box) return null;

  const label = opts?.label ?? null;
  emitBoard({ rolling: true, total: null, label }); // muestra la mesa vacía
  try {
    let result: RollResult;
    if (opts?.check && typeof opts.mod === "number") {
      const qty = opts.adv ? 2 : 1;
      const groups = await box.roll(`${qty}d20`, { themeColor: getDiceColor() });
      const dice = groups[0].rolls.map((r) => r.value);
      result = d20FromDice(dice, opts.mod, opts.adv);
    } else {
      const parsed = parseFormula(formula);
      if (!parsed) { emitBoard({ rolling: false, total: null, label }); return null; }
      const groups = await box.roll(`${parsed.n}d${parsed.die}`, { themeColor: getDiceColor() });
      const dice = groups[0].rolls.map((r) => r.value);
      result = rollFromDice(formula, dice, parsed.mod);
    }
    emitBoard({ rolling: false, total: result.total, label }); // reposan: muestra total
    return result;
  } catch (e) {
    console.warn("[diceBox] rollVisual falló; fallback.", e);
    emitBoard({ rolling: false, total: null, label });
    return null;
  }
}
