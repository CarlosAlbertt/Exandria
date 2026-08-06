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

  // --- Los nueve que se sumaron el 2026-08-06 -------------------------------

  // La taberna es el caso que obligó a vender por lotes: una jarra son 4 pc y
  // aquí no hay cobre. Se vende la ronda, el barril y la semana.
  // ⚠️ NO vende noches: dormir es la posada del POI (`Poi.services.posada`),
  // que avanza el reloj de campaña por /api/descanso y aplica el anti-abuso de
  // 20 h. Una cama vendida desde aquí no haría nada de eso.
  taberna: {
    label: "Taberna",
    icon: "fa-beer-mug-empty",
    items: [
      { name: "Ronda para la mesa (10 jarras)", price: 1 },
      { name: "Jarra de vino común (5 raciones)", price: 1 },
      { name: "Comida caliente para el grupo (5 platos)", price: 2 },
      { name: "Estofado y pan para una semana", price: 2 },
      { name: "Barril de cerveza (30 raciones)", price: 6 },
      { name: "Aguardiente enano (frasco)", price: 5 },
      { name: "Botella de vino fino", price: 10 },
      { name: "Banquete (por comensal)", price: 10 },
      { name: "Los rumores del local (una charla con el tabernero)", price: 5 },
    ],
  },

  templo: {
    label: "Templo",
    icon: "fa-place-of-worship",
    items: [
      { name: "Hábito de acólito", price: 1 },
      { name: "Velas bendecidas (docena)", price: 1 },
      { name: "Incienso (bloque)", price: 1 },
      { name: "Símbolo sagrado: amuleto", price: 5 },
      { name: "Símbolo sagrado: relicario", price: 5 },
      { name: "Aceite de unción (vial)", price: 5 },
      { name: "Ofrenda al altar", price: 10 },
      { name: "Agua bendita (frasco)", price: 25 },
      { name: "Libro de preceptos", price: 25 },
    ],
  },

  // Provisiones de viaje. Se llama así y no «campamento» porque `campamento` ya
  // es un `PoiType` (data/pois.ts) y el POI puede ser un campamento con una
  // tienda dentro: dos cosas distintas con el mismo nombre confunden.
  avituallamiento: {
    label: "Puesto de avituallamiento",
    icon: "fa-campground",
    items: [
      { name: "Odre", price: 1 },
      { name: "Manta", price: 1 },
      { name: "Saco de dormir", price: 1 },
      { name: "Antorchas (docena)", price: 1 },
      { name: "Yesca y pedernal", price: 1 },
      { name: "Cuerda de cáñamo (15 m)", price: 1 },
      { name: "Tienda de campaña (dos personas)", price: 2 },
      { name: "Alforjas", price: 4 },
      { name: "Raciones (10 días)", price: 5 },
      { name: "Mula", price: 8 },
    ],
  },

  establo: {
    label: "Establo",
    icon: "fa-horse",
    items: [
      { name: "Bocado y brida", price: 2 },
      { name: "Pienso y cuadra (10 días)", price: 6 },
      { name: "Mula", price: 8 },
      { name: "Silla de montar", price: 10 },
      { name: "Carro", price: 15 },
      { name: "Silla militar", price: 20 },
      { name: "Poni", price: 30 },
      { name: "Carreta", price: 35 },
      { name: "Caballo de tiro", price: 50 },
      { name: "Caballo de monta", price: 75 },
    ],
  },

  sastre: {
    label: "Sastrería y mercería",
    icon: "fa-shirt",
    items: [
      { name: "Túnica", price: 1 },
      { name: "Capa con capucha", price: 1 },
      { name: "Botas de cuero", price: 1 },
      { name: "Guantes de piel", price: 1 },
      { name: "Aguja e hilo (surtido)", price: 1 },
      { name: "Ropa de viaje", price: 2 },
      { name: "Disfraz", price: 5 },
      { name: "Rollo de tela fina", price: 10 },
      { name: "Ropa fina", price: 15 },
      { name: "Kit de disfraz", price: 25 },
    ],
  },

  arcano: {
    label: "Emporio arcano",
    icon: "fa-wand-sparkles",
    items: [
      { name: "Pluma de escribir", price: 1 },
      { name: "Pergamino en blanco (10 hojas)", price: 1 },
      { name: "Foco arcano: bastón", price: 5 },
      { name: "Foco arcano: varita", price: 10 },
      { name: "Foco arcano: cristal", price: 10 },
      { name: "Tinta (frasco)", price: 10 },
      { name: "Foco arcano: orbe", price: 20 },
      { name: "Bolsa de componentes", price: 25 },
      { name: "Libro de conjuros", price: 50 },
      { name: "Polvo de diamante (componente de 100 po)", price: 100 },
    ],
  },

  curandero: {
    label: "Botica del curandero",
    icon: "fa-mortar-pestle",
    items: [
      { name: "Vendas y ungüento (surtido)", price: 1 },
      { name: "Muletas y tablillas", price: 1 },
      { name: "Atención de un curandero (por día)", price: 2 },
      { name: "Kit de sanador (10 usos)", price: 5 },
      { name: "Kit de herboristería", price: 5 },
      { name: "Hierbas medicinales (manojo)", price: 5 },
      { name: "Cataplasma para quemaduras", price: 5 },
      { name: "Poción de curación", price: 50 },
      { name: "Antitoxina (frasco)", price: 50 },
    ],
  },

  mercado_negro: {
    label: "Trapicheo",
    icon: "fa-mask",
    items: [
      { name: "Abrojos (bolsa)", price: 1 },
      { name: "Capa negra sin marcas", price: 5 },
      { name: "Cuerda de seda (15 m)", price: 10 },
      { name: "Kit de falsificación", price: 15 },
      { name: "Ganzúas", price: 25 },
      { name: "El nombre de alguien que sabe", price: 25 },
      { name: "Documentos falsos (por encargo)", price: 50 },
      { name: "Veneno básico (vial)", price: 100 },
      { name: "Mercancía sin preguntas (lote)", price: 100 },
    ],
  },

  libreria: {
    label: "Escribanía",
    icon: "fa-book",
    items: [
      { name: "Pluma de escribir", price: 1 },
      { name: "Pergamino en blanco (10 hojas)", price: 1 },
      { name: "Estuche para pergaminos", price: 1 },
      { name: "Papel (10 hojas)", price: 2 },
      { name: "Tinta (frasco)", price: 10 },
      { name: "Copia de un texto (encargo al escriba)", price: 15 },
      { name: "Libro", price: 25 },
      { name: "Mapa de la región", price: 25 },
      { name: "Diccionario de una lengua muerta", price: 50 },
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

/** Sin tildes, sin mayúsculas y sin espacios de sobra, para comparar. */
function plano(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
}

/**
 * Convierte lo que el DM escribió en la clave que se guarda.
 *
 * Hace falta porque el desplegable de sugerencias es un `<datalist>`, y al
 * elegir «Herrería» el navegador escribe en el input **la etiqueta**, no la
 * clave. Guardado tal cual, esa tienda sería un tipo distinto de las que ya
 * existen —mismo negocio, dos claves— y se quedaría sin plantilla ni icono.
 *
 * Compara contra la etiqueta y contra la clave **ignorando mayúsculas y
 * tildes**: si acierta devuelve la clave, y si no, el texto recortado, que es
 * el caso del tipo que el DM se inventa y que debe pasar intacto.
 */
export function normalizaKind(texto: string): string {
  const t = plano(texto);
  if (!t) return "general"; // nunca una tienda sin tipo
  for (const [clave, def] of Object.entries(SHOP_TEMPLATES)) {
    if (plano(def.label) === t || plano(clave) === t) return clave;
  }
  return texto.trim();
}
