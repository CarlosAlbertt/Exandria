// Proporción (ancho/alto) del submapa de cada región. La usa PinDragMap (editor
// DM, `background-size: cover`), que deforma el mapa si no cuadra con el
// archivo real. Vivía en data/taldorei.ts, que dejó de ser cierto al llegar
// Wildemount. Los scripts check-* verifican cada entrada contra la cabecera del
// JPG, que fue lo que cazó que Llanuras Divisorias declaraba 1.320 cuando el
// archivo es 1.294.
export const REGION_RATIO: Record<string, string> = {
  // Tal'Dorei
  "costa-lucidiana": "2550 / 3300",
  "sierras-alabastro": "3300 / 2550",
  "llanuras-divisorias": "3300 / 2550",
  "montanas-torrerrisco": "5100 / 3300",
  "montanas-crestormentas": "3300 / 2550",
  "peninsula-pleabruma": "5100 / 3300",
  "expansion-verdante": "3300 / 2550",
  "litoral-filofulgor": "3300 / 5100",
  // Wildemount (medidos del archivo: apaisadas 2000x1294, verticales 1294x2000)
  "imperio-dwendaliano": "2000 / 1294",
  "valle-del-tuetano": "2000 / 1294",
  "xhorhas": "1294 / 2000",
  "yermos-grisaceos": "2000 / 1294",
  "costa-del-serrallo": "2000 / 1294",
  "costa-del-serrallo-norte": "2000 / 1294",
  "eiselcross": "2000 / 1294",
  "costa-de-la-plaga": "1294 / 2000",
};
