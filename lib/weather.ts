// Clima de campaña (Fase N): derivación PURA y determinista del reloj + región.
// Sin React ni Supabase, mismo espíritu que lib/gameClock.ts. El clima es fijo
// durante todo un día de juego y cambia al siguiente; la misma región+día da
// siempre el mismo tiempo (semilla = región|año|día-del-año).
//
// El clima DURO tiene consecuencias en mesa (ver EFECTOS): desventajas y
// salvaciones. Ciertos personajes están curtidos y se libran (ver EXENCIONES).

export type EfectoClima = "frio_extremo" | "calor_extremo" | "viento_fuerte" | "lluvia_intensa" | "niebla_densa";

export type Weather = {
  condition: string;
  icon: string;
  temp: string;
  /** Efectos de mesa que impone este tiempo. Vacío/ausente = tiempo llevadero. */
  efectos?: EfectoClima[];
};

export type Zone = "templado" | "frio" | "arido" | "costero" | "humedo" | "brumoso";

type Season = "Primavera" | "Verano" | "Otoño" | "Invierno";

// Qué implica cada efecto en la mesa. Las reglas de entorno (frío/calor
// extremos, viento fuerte, precipitación intensa, niebla) son estándar de D&D;
// la redacción es propia y resumida.
export const EFECTOS: Record<EfectoClima, { label: string; icon: string; color: string; regla: string }> = {
  frio_extremo: {
    label: "Frío extremo", icon: "fa-icicles", color: "var(--color-arcane)",
    regla: "Cada hora de exposición, salvación de Constitución CD 10 o un nivel de agotamiento. Quien tenga resistencia al frío o ropa de abrigo adecuada no tira.",
  },
  calor_extremo: {
    label: "Calor extremo", icon: "fa-temperature-high", color: "var(--color-ember)",
    regla: "Cada hora de exposición, salvación de Constitución (CD 5, +1 por hora acumulada) o un nivel de agotamiento. Con agua abundante y ropa ligera, no se tira.",
  },
  viento_fuerte: {
    label: "Viento fuerte", icon: "fa-wind", color: "var(--color-muted)",
    regla: "Desventaja en ataques a distancia con arma y en pruebas de Percepción basadas en el oído. Apaga llamas descubiertas y dispersa la niebla.",
  },
  lluvia_intensa: {
    label: "Precipitación intensa", icon: "fa-cloud-showers-heavy", color: "var(--color-arcane-deep)",
    regla: "Desventaja en pruebas de Percepción basadas en la vista. Apaga llamas descubiertas.",
  },
  niebla_densa: {
    label: "Niebla densa", icon: "fa-smog", color: "var(--color-dim)",
    regla: "Zona muy oscurecida: dentro de ella se está efectivamente cegado para la vista.",
  },
};

// Quién se libra de qué, y por qué. Convención de mesa de esta campaña (no es
// texto de reglas): premia al personaje construido para la intemperie.
type Exencion = { efectos: EfectoClima[] | "todos"; motivo: string };

const POR_CLASE: Record<string, Exencion> = {
  explorador: { efectos: "todos", motivo: "Explorador: las tierras salvajes son tu oficio" },
  barbaro: { efectos: ["frio_extremo"], motivo: "Bárbaro: aguante curtido a la intemperie" },
};

const POR_TRASFONDO: Record<string, Exencion> = {
  guia: { efectos: "todos", motivo: "Guía: te ganas la vida cruzando estas tierras" },
  marinero: { efectos: ["viento_fuerte", "lluvia_intensa"], motivo: "Marinero: cubierta, viento y agua de toda la vida" },
};

const POR_ESPECIE: Record<string, Exencion> = {
  goliat: { efectos: ["frio_extremo"], motivo: "Goliat: nacido en las cumbres" },
};

const POR_PERICIA: Record<string, Exencion> = {
  Supervivencia: { efectos: ["frio_extremo", "calor_extremo"], motivo: "Supervivencia: sabes abrigarte y buscar sombra" },
};

export type PersonajeClima = {
  cls?: string | null;
  background?: string | null;
  species?: string | null;
  skills?: string[] | null;
};

function cubre(ex: Exencion, efecto: EfectoClima): boolean {
  return ex.efectos === "todos" || ex.efectos.includes(efecto);
}

// ¿Por qué se libra este personaje de este efecto? null si le afecta.
export function exencionPara(efecto: EfectoClima, pj: PersonajeClima | null | undefined): string | null {
  if (!pj) return null;
  const candidatas: (Exencion | undefined)[] = [
    pj.cls ? POR_CLASE[pj.cls] : undefined,
    pj.background ? POR_TRASFONDO[pj.background] : undefined,
    pj.species ? POR_ESPECIE[pj.species] : undefined,
    ...(pj.skills ?? []).map((s) => POR_PERICIA[s]),
  ];
  for (const ex of candidatas) {
    if (ex && cubre(ex, efecto)) return ex.motivo;
  }
  return null;
}

// Efectos del tiempo separados en los que te pegan y los que te saltas.
export function efectosPara(weather: Weather, pj: PersonajeClima | null | undefined): {
  afectan: EfectoClima[];
  exentos: { efecto: EfectoClima; motivo: string }[];
} {
  const afectan: EfectoClima[] = [];
  const exentos: { efecto: EfectoClima; motivo: string }[] = [];
  for (const e of weather.efectos ?? []) {
    const motivo = exencionPara(e, pj);
    if (motivo) exentos.push({ efecto: e, motivo });
    else afectan.push(e);
  }
  return { afectan, exentos };
}

export const esDuro = (w: Weather) => (w.efectos?.length ?? 0) > 0;

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
      { condition: "Bochorno", icon: "fa-temperature-high", temp: "Sofocante", efectos: ["calor_extremo"] },
      { condition: "Tormenta de tarde", icon: "fa-cloud-bolt", temp: "Caluroso", efectos: ["lluvia_intensa"] },
    ],
    Otoño: [
      { condition: "Cielo encapotado", icon: "fa-cloud", temp: "Fresco" },
      { condition: "Viento y hojas", icon: "fa-wind", temp: "Fresco" },
      { condition: "Llovizna", icon: "fa-cloud-rain", temp: "Frío" },
    ],
    Invierno: [
      { condition: "Escarcha matinal", icon: "fa-snowflake", temp: "Frío" },
      { condition: "Cielo gris y plomizo", icon: "fa-cloud", temp: "Frío" },
      { condition: "Aguanieve", icon: "fa-cloud-showers-heavy", temp: "Gélido", efectos: ["frio_extremo", "lluvia_intensa"] },
    ],
  },
  frio: {
    Primavera: [
      { condition: "Deshielo y barro", icon: "fa-icicles", temp: "Frío" },
      { condition: "Cielo despejado y cortante", icon: "fa-sun", temp: "Frío" },
      { condition: "Ventisca ligera", icon: "fa-snowflake", temp: "Gélido", efectos: ["frio_extremo", "viento_fuerte"] },
    ],
    Verano: [
      { condition: "Sol pálido de montaña", icon: "fa-cloud-sun", temp: "Fresco" },
      { condition: "Niebla en las cumbres", icon: "fa-smog", temp: "Frío", efectos: ["niebla_densa"] },
      { condition: "Granizo repentino", icon: "fa-cloud-meatball", temp: "Frío", efectos: ["lluvia_intensa"] },
    ],
    Otoño: [
      { condition: "Primeras nieves", icon: "fa-snowflake", temp: "Gélido", efectos: ["frio_extremo"] },
      { condition: "Viento helador", icon: "fa-wind", temp: "Gélido", efectos: ["frio_extremo", "viento_fuerte"] },
      { condition: "Cielo encapotado", icon: "fa-cloud", temp: "Frío" },
    ],
    Invierno: [
      { condition: "Nevada intensa", icon: "fa-snowflake", temp: "Glacial", efectos: ["frio_extremo", "lluvia_intensa"] },
      { condition: "Ventisca cegadora", icon: "fa-wind", temp: "Glacial", efectos: ["frio_extremo", "viento_fuerte", "niebla_densa"] },
      { condition: "Frío seco y despejado", icon: "fa-sun", temp: "Gélido", efectos: ["frio_extremo"] },
    ],
  },
  arido: {
    Primavera: [
      { condition: "Sol seco", icon: "fa-sun", temp: "Cálido" },
      { condition: "Viento de arena", icon: "fa-wind", temp: "Cálido", efectos: ["viento_fuerte"] },
      { condition: "Cielo limpio", icon: "fa-sun", temp: "Templado" },
    ],
    Verano: [
      { condition: "Calor abrasador", icon: "fa-temperature-high", temp: "Abrasador", efectos: ["calor_extremo"] },
      { condition: "Espejismos de bochorno", icon: "fa-sun", temp: "Abrasador", efectos: ["calor_extremo"] },
      { condition: "Tormenta de arena", icon: "fa-smog", temp: "Abrasador", efectos: ["calor_extremo", "viento_fuerte", "niebla_densa"] },
    ],
    Otoño: [
      { condition: "Días templados, noches frías", icon: "fa-cloud-sun", temp: "Templado" },
      { condition: "Viento seco", icon: "fa-wind", temp: "Cálido" },
      { condition: "Cielo despejado", icon: "fa-sun", temp: "Templado" },
    ],
    Invierno: [
      { condition: "Frío nocturno del desierto", icon: "fa-moon", temp: "Frío" },
      { condition: "Sol tenue", icon: "fa-cloud-sun", temp: "Fresco" },
      { condition: "Viento cortante", icon: "fa-wind", temp: "Frío", efectos: ["viento_fuerte"] },
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
      { condition: "Humedad pegajosa", icon: "fa-temperature-high", temp: "Sofocante", efectos: ["calor_extremo"] },
      { condition: "Tormenta desde el mar", icon: "fa-cloud-bolt", temp: "Cálido", efectos: ["viento_fuerte", "lluvia_intensa"] },
    ],
    Otoño: [
      { condition: "Marejada y viento", icon: "fa-water", temp: "Fresco", efectos: ["viento_fuerte"] },
      { condition: "Temporal costero", icon: "fa-cloud-showers-heavy", temp: "Frío", efectos: ["viento_fuerte", "lluvia_intensa"] },
      { condition: "Niebla del amanecer", icon: "fa-smog", temp: "Fresco", efectos: ["niebla_densa"] },
    ],
    Invierno: [
      { condition: "Vendaval frío", icon: "fa-wind", temp: "Frío", efectos: ["viento_fuerte"] },
      { condition: "Lluvia y salitre", icon: "fa-cloud-rain", temp: "Frío", efectos: ["lluvia_intensa"] },
      { condition: "Cielo gris sobre olas grises", icon: "fa-cloud", temp: "Gélido", efectos: ["frio_extremo"] },
    ],
  },
  humedo: {
    Primavera: [
      { condition: "Lluvia cálida", icon: "fa-cloud-rain", temp: "Suave" },
      { condition: "Verdor goteante", icon: "fa-leaf", temp: "Templado" },
      { condition: "Claros entre nubes", icon: "fa-cloud-sun", temp: "Templado" },
    ],
    Verano: [
      { condition: "Bochorno de selva", icon: "fa-temperature-high", temp: "Sofocante", efectos: ["calor_extremo"] },
      { condition: "Chaparrón denso", icon: "fa-cloud-showers-heavy", temp: "Cálido", efectos: ["lluvia_intensa"] },
      { condition: "Aire pesado y húmedo", icon: "fa-smog", temp: "Sofocante", efectos: ["calor_extremo"] },
    ],
    Otoño: [
      { condition: "Lluvia constante", icon: "fa-cloud-rain", temp: "Fresco", efectos: ["lluvia_intensa"] },
      { condition: "Neblina entre árboles", icon: "fa-smog", temp: "Fresco", efectos: ["niebla_densa"] },
      { condition: "Suelo empapado", icon: "fa-cloud", temp: "Fresco" },
    ],
    Invierno: [
      { condition: "Lluvia fría e incesante", icon: "fa-cloud-showers-heavy", temp: "Frío", efectos: ["lluvia_intensa"] },
      { condition: "Bruma helada", icon: "fa-smog", temp: "Frío", efectos: ["niebla_densa"] },
      { condition: "Cielo plomizo", icon: "fa-cloud", temp: "Frío" },
    ],
  },
  brumoso: {
    Primavera: [
      { condition: "Niebla persistente", icon: "fa-smog", temp: "Fresco", efectos: ["niebla_densa"] },
      { condition: "Bruma que no levanta", icon: "fa-smog", temp: "Fresco", efectos: ["niebla_densa"] },
      { condition: "Claros fantasmales", icon: "fa-cloud-sun", temp: "Suave" },
    ],
    Verano: [
      { condition: "Calina espesa", icon: "fa-smog", temp: "Templado", efectos: ["niebla_densa"] },
      { condition: "Niebla tibia", icon: "fa-smog", temp: "Cálido", efectos: ["niebla_densa"] },
      { condition: "Sol velado", icon: "fa-cloud-sun", temp: "Templado" },
    ],
    Otoño: [
      { condition: "Niebla cerrada", icon: "fa-smog", temp: "Frío", efectos: ["niebla_densa"] },
      { condition: "Aire húmedo y quieto", icon: "fa-cloud", temp: "Frío" },
      { condition: "Llovizna entre la bruma", icon: "fa-cloud-rain", temp: "Frío", efectos: ["niebla_densa"] },
    ],
    Invierno: [
      { condition: "Bruma helada", icon: "fa-smog", temp: "Gélido", efectos: ["niebla_densa", "frio_extremo"] },
      { condition: "Niebla y escarcha", icon: "fa-snowflake", temp: "Gélido", efectos: ["niebla_densa", "frio_extremo"] },
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
  const duro = esDuro(weather) ? " El tiempo aprieta de verdad." : "";
  return `[Contexto ambiental del lugar ahora mismo: ${season.toLowerCase()}, ${weather.condition.toLowerCase()} (${weather.temp.toLowerCase()}).${duro} Menciónalo con naturalidad solo si viene a cuento.]`;
}
