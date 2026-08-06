// Catálogos semilla por tipo de tienda. Precios en piezas de oro (po), estándar
// del PHB 2024 (hechos de juego). El DM los siembra con un botón y luego edita.
//
// ⚠️ Esto NO es la lista de tipos que pueden existir: el DM escribe el tipo que
// quiera (`shops.kind` es texto libre). Lo que hay aquí son las **sugerencias**
// que además traen plantilla e icono. Un tipo escrito a mano funciona igual,
// solo que sin catálogo que sembrar y con el icono genérico.
//
// Por eso `kindLabel` y `kindIcon` llevan fallback: no es una red de seguridad
// para un dato corrupto, es el camino normal de cualquier tipo que el DM
// invente.

export type ShopTemplateItem = { name: string; price: number };

export type ShopKind = {
  /** Lo que ve el jugador y lo que lee la IA. "Herrería", no "herreria". */
  label: string;
  /** Icono Font Awesome, como `POI_ICON` en data/pois.ts. */
  icon: string;
  items: ShopTemplateItem[];
};

// Los precios son enteros en po porque `shop_items.price` es `int` (schema_v15)
// y no hay piezas de plata ni de cobre. Donde el manual pone menos de 1 po se
// vende **la cantidad que vale un oro entero o más** en vez de mentir con el
// redondeo: nadie va a la taberna a comprar una jarra suelta.
export const SHOP_TEMPLATES: Record<string, ShopKind> = {
  herreria: {
    label: "Herrería",
    icon: "fa-hammer",
    items: [
      { name: "Daga", price: 2 },
      { name: "Espada corta", price: 10 },
      { name: "Espada larga", price: 15 },
      { name: "Hacha de guerra", price: 10 },
      { name: "Maza", price: 5 },
      { name: "Arco corto", price: 25 },
      { name: "Armadura de cuero", price: 10 },
      { name: "Cota de malla", price: 75 },
      { name: "Escudo", price: 10 },
      { name: "Flechas (20)", price: 1 },
    ],
  },
  alquimista: {
    label: "Alquimista",
    icon: "fa-flask",
    items: [
      { name: "Poción de curación", price: 50 },
      { name: "Fuego alquímico (frasco)", price: 50 },
      { name: "Ácido (frasco)", price: 25 },
      { name: "Aceite (frasco)", price: 1 },
      { name: "Antitoxina (frasco)", price: 50 },
      { name: "Bolsa de componentes", price: 25 },
      { name: "Incienso (bloque)", price: 1 },
    ],
  },
  general: {
    label: "Bazar general",
    icon: "fa-store",
    items: [
      { name: "Raciones (1 día)", price: 1 },
      { name: "Cuerda de cáñamo (15 m)", price: 1 },
      { name: "Antorcha", price: 1 },
      { name: "Odre", price: 1 },
      { name: "Saco de dormir", price: 1 },
      { name: "Yesca y pedernal", price: 1 },
      { name: "Kit de sanador", price: 5 },
      { name: "Farol de capota", price: 5 },
      { name: "Pico de escalador", price: 25 },
      { name: "Mochila", price: 2 },
    ],
  },
};

/** Las claves con plantilla, para el desplegable de sugerencias. */
export const SHOP_KINDS = Object.keys(SHOP_TEMPLATES);

/** Icono por defecto de un tipo que el DM se haya inventado. */
export const SHOP_ICON_FALLBACK = "fa-store";

/**
 * El nombre bonito de un tipo. Si el DM escribió el suyo, ese texto **es** la
 * etiqueta: se devuelve tal cual en vez de dejar `undefined` en la pantalla.
 */
export function kindLabel(kind: string): string {
  return SHOP_TEMPLATES[kind]?.label ?? kind;
}

/** Igual que `kindLabel`, pero con el icono. */
export function kindIcon(kind: string): string {
  return SHOP_TEMPLATES[kind]?.icon ?? SHOP_ICON_FALLBACK;
}
