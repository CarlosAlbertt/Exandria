// Clima de campaña (Fase N): derivación PURA y determinista del reloj + región.
// Sin React ni Supabase, mismo espíritu que lib/gameClock.ts. El clima es fijo
// durante todo un día de juego y cambia al siguiente; la misma región+día da
// siempre el mismo tiempo (semilla = región|año|día-del-año).

export type Weather = { condition: string; icon: string; temp: string };
export type Zone = "templado" | "frio" | "arido" | "costero" | "humedo" | "brumoso";

type Season = "Primavera" | "Verano" | "Otoño" | "Invierno";

// Tabla de condiciones posibles por zona y estación. La derivación elige una por
// semilla, así que el orden no importa; sí que sean coherentes con zona+estación.
const CLIMATE: Record<Zone, Record<Season, Weather[]>> = {
  templado: {
    Primavera: [
      { condition: "Cielos despejados", icon: "fa-sun", temp: "Templado" },
      { condition: "Nubes y claros", icon: "fa-cloud-sun", temp: "Suave" },
      { condition: "Lluvia ligera", icon: "fa-cloud-rain", temp: "Fresco" },
    ],
    Verano: [
      { condition: "Sol radiante", icon: "fa-sun", temp: "Caluroso" },
      { condition: "Bochorno", icon: "fa-temperature-high", temp: "Sofocante" },
      { condition: "Tormenta de tarde", icon: "fa-cloud-bolt", temp: "Caluroso" },
    ],
    Otoño: [
      { condition: "Cielo encapotado", icon: "fa-cloud", temp: "Fresco" },
      { condition: "Viento y hojas", icon: "fa-wind", temp: "Fresco" },
      { condition: "Llovizna", icon: "fa-cloud-rain", temp: "Frío" },
    ],
    Invierno: [
      { condition: "Escarcha matinal", icon: "fa-snowflake", temp: "Frío" },
      { condition: "Cielo gris y plomizo", icon: "fa-cloud", temp: "Frío" },
      { condition: "Aguanieve", icon: "fa-cloud-showers-heavy", temp: "Gélido" },
    ],
  },
  frio: {
    Primavera: [
      { condition: "Deshielo y barro", icon: "fa-icicles", temp: "Frío" },
      { condition: "Cielo despejado y cortante", icon: "fa-sun", temp: "Frío" },
      { condition: "Ventisca ligera", icon: "fa-snowflake", temp: "Gélido" },
    ],
    Verano: [
      { condition: "Sol pálido de montaña", icon: "fa-cloud-sun", temp: "Fresco" },
      { condition: "Niebla en las cumbres", icon: "fa-smog", temp: "Frío" },
      { condition: "Granizo repentino", icon: "fa-cloud-meatball", temp: "Frío" },
    ],
    Otoño: [
      { condition: "Primeras nieves", icon: "fa-snowflake", temp: "Gélido" },
      { condition: "Viento helador", icon: "fa-wind", temp: "Gélido" },
      { condition: "Cielo encapotado", icon: "fa-cloud", temp: "Frío" },
    ],
    Invierno: [
      { condition: "Nevada intensa", icon: "fa-snowflake", temp: "Glacial" },
      { condition: "Ventisca cegadora", icon: "fa-wind", temp: "Glacial" },
      { condition: "Frío seco y despejado", icon: "fa-sun", temp: "Gélido" },
    ],
  },
  arido: {
    Primavera: [
      { condition: "Sol seco", icon: "fa-sun", temp: "Cálido" },
      { condition: "Viento de arena", icon: "fa-wind", temp: "Cálido" },
      { condition: "Cielo limpio", icon: "fa-sun", temp: "Templado" },
    ],
    Verano: [
      { condition: "Calor abrasador", icon: "fa-temperature-high", temp: "Abrasador" },
      { condition: "Espejismos de bochorno", icon: "fa-sun", temp: "Abrasador" },
      { condition: "Tormenta de arena", icon: "fa-smog", temp: "Abrasador" },
    ],
    Otoño: [
      { condition: "Días templados, noches frías", icon: "fa-cloud-sun", temp: "Templado" },
      { condition: "Viento seco", icon: "fa-wind", temp: "Cálido" },
      { condition: "Cielo despejado", icon: "fa-sun", temp: "Templado" },
    ],
    Invierno: [
      { condition: "Frío nocturno del desierto", icon: "fa-moon", temp: "Frío" },
      { condition: "Sol tenue", icon: "fa-cloud-sun", temp: "Fresco" },
      { condition: "Viento cortante", icon: "fa-wind", temp: "Frío" },
    ],
  },
  costero: {
    Primavera: [
      { condition: "Brisa marina", icon: "fa-wind", temp: "Suave" },
      { condition: "Cielo despejado sobre el mar", icon: "fa-sun", temp: "Templado" },
      { condition: "Chubascos costeros", icon: "fa-cloud-rain", temp: "Fresco" },
    ],
    Verano: [
      { condition: "Sol y brisa", icon: "fa-sun", temp: "Cálido" },
      { condition: "Humedad pegajosa", icon: "fa-temperature-high", temp: "Sofocante" },
      { condition: "Tormenta desde el mar", icon: "fa-cloud-bolt", temp: "Cálido" },
    ],
    Otoño: [
      { condition: "Marejada y viento", icon: "fa-water", temp: "Fresco" },
      { condition: "Temporal costero", icon: "fa-cloud-showers-heavy", temp: "Frío" },
      { condition: "Niebla del amanecer", icon: "fa-smog", temp: "Fresco" },
    ],
    Invierno: [
      { condition: "Vendaval frío", icon: "fa-wind", temp: "Frío" },
      { condition: "Lluvia y salitre", icon: "fa-cloud-rain", temp: "Frío" },
      { condition: "Cielo gris sobre olas grises", icon: "fa-cloud", temp: "Gélido" },
    ],
  },
  humedo: {
    Primavera: [
      { condition: "Lluvia cálida", icon: "fa-cloud-rain", temp: "Suave" },
      { condition: "Verdor goteante", icon: "fa-leaf", temp: "Templado" },
      { condition: "Claros entre nubes", icon: "fa-cloud-sun", temp: "Templado" },
    ],
    Verano: [
      { condition: "Bochorno de selva", icon: "fa-temperature-high", temp: "Sofocante" },
      { condition: "Chaparrón denso", icon: "fa-cloud-showers-heavy", temp: "Cálido" },
      { condition: "Aire pesado y húmedo", icon: "fa-smog", temp: "Sofocante" },
    ],
    Otoño: [
      { condition: "Lluvia constante", icon: "fa-cloud-rain", temp: "Fresco" },
      { condition: "Neblina entre árboles", icon: "fa-smog", temp: "Fresco" },
      { condition: "Suelo empapado", icon: "fa-cloud", temp: "Fresco" },
    ],
    Invierno: [
      { condition: "Lluvia fría e incesante", icon: "fa-cloud-showers-heavy", temp: "Frío" },
      { condition: "Bruma helada", icon: "fa-smog", temp: "Frío" },
      { condition: "Cielo plomizo", icon: "fa-cloud", temp: "Frío" },
    ],
  },
  brumoso: {
    Primavera: [
      { condition: "Niebla persistente", icon: "fa-smog", temp: "Fresco" },
      { condition: "Bruma que no levanta", icon: "fa-smog", temp: "Fresco" },
      { condition: "Claros fantasmales", icon: "fa-cloud-sun", temp: "Suave" },
    ],
    Verano: [
      { condition: "Calina espesa", icon: "fa-smog", temp: "Templado" },
      { condition: "Niebla tibia", icon: "fa-smog", temp: "Cálido" },
      { condition: "Sol velado", icon: "fa-cloud-sun", temp: "Templado" },
    ],
    Otoño: [
      { condition: "Niebla cerrada", icon: "fa-smog", temp: "Frío" },
      { condition: "Aire húmedo y quieto", icon: "fa-cloud", temp: "Frío" },
      { condition: "Llovizna entre la bruma", icon: "fa-cloud-rain", temp: "Frío" },
    ],
    Invierno: [
      { condition: "Bruma helada", icon: "fa-smog", temp: "Gélido" },
      { condition: "Niebla y escarcha", icon: "fa-snowflake", temp: "Gélido" },
      { condition: "Penumbra gris", icon: "fa-cloud", temp: "Frío" },
    ],
  },
};

// Zona explícita de las 8 regiones de Tal'Dorei (el área de juego principal).
const TALDOREI_ZONE: Record<string, Zone> = {
  "costa-lucidiana": "costero",
  "sierras-alabastro": "templado",
  "llanuras-divisorias": "templado",
  "montanas-torrerrisco": "frio",
  "montanas-crestormentas": "frio",
  "peninsula-pleabruma": "brumoso",
  "expansion-verdante": "humedo",
  "litoral-filofulgor": "costero",
};

// Clima por defecto de cada continente (para regiones sin mapa ni palabra clave).
const CONTINENT_ZONE: Record<string, Zone> = {
  Marquet: "arido",
  Wildemount: "frio",
  "Los Dientes Rotos": "humedo",
  Issylra: "templado",
  "Tal'Dorei": "templado",
};

// Heurística por palabras del slug/nombre: sirve para regiones nuevas del atlas.
function zoneByKeyword(text: string): Zone | null {
  const t = text.toLowerCase();
  if (/(monta|torre|risco|crest|pico|cumbre|nieve|hielo|glacial)/.test(t)) return "frio";
  if (/(costa|litoral|mar|puerto|bahia|bahía|playa|isla)/.test(t)) return "costero";
  if (/(desierto|arena|duna|yermo|arid)/.test(t)) return "arido";
  if (/(bosque|selva|verde|verdante|jungla|pantano verde)/.test(t)) return "humedo";
  if (/(bruma|niebla|pantano|cienaga|ciénaga|sombr)/.test(t)) return "brumoso";
  return null;
}

export function zoneFor(continent: string, regionSlug: string, regionName?: string): Zone {
  return (
    TALDOREI_ZONE[regionSlug] ??
    zoneByKeyword(`${regionSlug} ${regionName ?? ""}`) ??
    CONTINENT_ZONE[continent] ??
    "templado"
  );
}

// Hash determinista (djb2) de una cadena a entero sin signo.
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

// `moment` sale de momentFromGameMin(nowGameMin): usamos season, year y dayOfYear.
export function weatherFor(
  continent: string,
  regionSlug: string,
  regionName: string | undefined,
  moment: { season: string; year: number; dayOfYear: number }
): Weather {
  const zone = zoneFor(continent, regionSlug, regionName);
  const season = (["Primavera", "Verano", "Otoño", "Invierno"].includes(moment.season) ? moment.season : "Primavera") as Season;
  const table = CLIMATE[zone][season];
  const idx = hash(`${regionSlug}|${moment.year}|${moment.dayOfYear}`) % table.length;
  return table[idx];
}

// Una frase para inyectar al system prompt de los NPCs IA (contexto ambiental).
export function ambientLine(weather: Weather, season: string): string {
  return `[Contexto ambiental del lugar ahora mismo: ${season.toLowerCase()}, ${weather.condition.toLowerCase()} (${weather.temp.toLowerCase()}). Menciónalo con naturalidad solo si viene a cuento.]`;
}
