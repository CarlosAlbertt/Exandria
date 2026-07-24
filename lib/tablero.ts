// Geometría del tablero de batalla, PURO. Convierte posiciones en % a casillas y
// mide distancia. Regla 2024 simplificada: cada casilla (incl. diagonal) es 1,5 m.

export type Pos = { x: number; y: number };  // en % [0,100]

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** La casilla (columna, fila) en la que cae una posición. */
export function celda(p: Pos, cols: number, rows: number): { cx: number; cy: number } {
  const cx = clamp(Math.floor((p.x / 100) * cols), 0, cols - 1);
  const cy = clamp(Math.floor((p.y / 100) * rows), 0, rows - 1);
  return { cx, cy };
}

/** Distancia entre dos posiciones, en metros (Chebyshev de casillas × 1,5). */
export function distanciaMetros(a: Pos, b: Pos, cols: number, rows: number): number {
  const ca = celda(a, cols, rows);
  const cb = celda(b, cols, rows);
  const casillas = Math.max(Math.abs(ca.cx - cb.cx), Math.abs(ca.cy - cb.cy));
  return casillas * 1.5;
}
