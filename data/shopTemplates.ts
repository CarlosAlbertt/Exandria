// Catálogos semilla por tipo de tienda. Precios en piezas de oro (po), estándar
// del PHB 2024 (hechos de juego). El DM los siembra con un botón y luego edita.

export type ShopTemplateItem = { name: string; price: number };

export const SHOP_TEMPLATES: Record<string, ShopTemplateItem[]> = {
  herreria: [
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
  alquimista: [
    { name: "Poción de curación", price: 50 },
    { name: "Fuego alquímico (frasco)", price: 50 },
    { name: "Ácido (frasco)", price: 25 },
    { name: "Aceite (frasco)", price: 1 },
    { name: "Antitoxina (frasco)", price: 50 },
    { name: "Bolsa de componentes", price: 25 },
    { name: "Incienso (bloque)", price: 1 },
  ],
  general: [
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
};

export const SHOP_KINDS = Object.keys(SHOP_TEMPLATES);
