// Comprobación manual de lib/weather.ts. Uso: npx tsx scripts/check-clima.ts
import {
  weatherFor, zoneFor, efectosPara, exencionPara, esDuro, EFECTOS,
  type EfectoClima, type PersonajeClima,
} from "../lib/weather";

let failures = 0;
function check(label: string, cond: boolean) {
  if (cond) console.log(`OK   ${label}`);
  else { console.log(`FAIL ${label}`); failures++; }
}

const MOMENTO = { season: "Invierno", year: 836, dayOfYear: 1 };

// --- Determinismo: el clima es fijo por región+día ---
const a = weatherFor("Tal'Dorei", "montanas-torrerrisco", "Montañas Torrerrisco", MOMENTO);
const b = weatherFor("Tal'Dorei", "montanas-torrerrisco", "Montañas Torrerrisco", MOMENTO);
check("mismo región+día = mismo clima", a.condition === b.condition && a.temp === b.temp);

const otroDia = weatherFor("Tal'Dorei", "montanas-torrerrisco", undefined, { ...MOMENTO, dayOfYear: 2 });
check("el clima existe también otro día", !!otroDia.condition);

const otraRegion = weatherFor("Tal'Dorei", "costa-lucidiana", undefined, MOMENTO);
check("regiones distintas pueden dar climas distintos", !!otraRegion.condition);

// --- Zonas ---
check("Torrerrisco es zona fría", zoneFor("Tal'Dorei", "montanas-torrerrisco") === "frio");
check("Costa Lucidiana es costera", zoneFor("Tal'Dorei", "costa-lucidiana") === "costero");
check("Marquet por defecto es árido", zoneFor("Marquet", "region-inventada") === "arido");
check("heurística: un slug con 'desierto' es árido", zoneFor("Issylra", "gran-desierto") === "arido");
check("heurística: un slug con 'montana' es frío", zoneFor("Issylra", "montanas-utesspire") === "frio");
check("desconocido cae en templado", zoneFor("Continente Raro", "sitio-raro") === "templado");

// --- Coherencia de la tabla: todo efecto declarado existe ---
const CLAVES = Object.keys(EFECTOS) as EfectoClima[];
let efectosValidos = true;
let hayAlgunDuro = false;
for (const cont of ["Tal'Dorei", "Marquet", "Wildemount", "Los Dientes Rotos", "Issylra"]) {
  for (const est of ["Primavera", "Verano", "Otoño", "Invierno"]) {
    for (let d = 1; d <= 40; d++) {
      const w = weatherFor(cont, `r${d}`, undefined, { season: est, year: 836, dayOfYear: d });
      if (esDuro(w)) hayAlgunDuro = true;
      for (const e of w.efectos ?? []) if (!CLAVES.includes(e)) efectosValidos = false;
    }
  }
}
check("todos los efectos de la tabla están en EFECTOS", efectosValidos);
check("existe clima duro en alguna combinación", hayAlgunDuro);

// --- Exenciones ---
const pelado: PersonajeClima = { cls: "mago", background: "sabio", species: "humano", skills: [] };
const explorador: PersonajeClima = { cls: "explorador", background: "sabio", species: "humano", skills: [] };
const goliat: PersonajeClima = { cls: "mago", background: "sabio", species: "goliat", skills: [] };
const superviviente: PersonajeClima = { cls: "mago", background: "sabio", species: "humano", skills: ["Supervivencia"] };
const marinero: PersonajeClima = { cls: "mago", background: "marinero", species: "humano", skills: [] };
const guia: PersonajeClima = { cls: "mago", background: "guia", species: "humano", skills: [] };
const barbaro: PersonajeClima = { cls: "barbaro", background: "sabio", species: "humano", skills: [] };

check("al mago pelado le afecta el frío", exencionPara("frio_extremo", pelado) === null);
check("al Explorador no le afecta NADA (frío)", exencionPara("frio_extremo", explorador) !== null);
check("al Explorador no le afecta NADA (niebla)", exencionPara("niebla_densa", explorador) !== null);
check("la Guía también se libra de todo", exencionPara("calor_extremo", guia) !== null);
check("el Goliat se libra del frío", exencionPara("frio_extremo", goliat) !== null);
check("pero el Goliat NO del calor", exencionPara("calor_extremo", goliat) === null);
check("Supervivencia cubre frío y calor", exencionPara("frio_extremo", superviviente) !== null && exencionPara("calor_extremo", superviviente) !== null);
check("Supervivencia NO cubre la niebla", exencionPara("niebla_densa", superviviente) === null);
check("el Marinero se libra del viento", exencionPara("viento_fuerte", marinero) !== null);
check("pero el Marinero NO del frío", exencionPara("frio_extremo", marinero) === null);
check("el Bárbaro se libra del frío", exencionPara("frio_extremo", barbaro) !== null);
check("pero el Bárbaro NO del calor", exencionPara("calor_extremo", barbaro) === null);
check("sin ficha, nadie está exento", exencionPara("frio_extremo", null) === null);

// --- Reparto afectan/exentos ---
const ventisca = { condition: "Ventisca cegadora", icon: "fa-wind", temp: "Glacial", efectos: ["frio_extremo", "viento_fuerte", "niebla_densa"] as EfectoClima[] };
const rPelado = efectosPara(ventisca, pelado);
check("al pelado le pegan los 3 efectos", rPelado.afectan.length === 3 && rPelado.exentos.length === 0);

const rExplorador = efectosPara(ventisca, explorador);
check("al Explorador no le pega ninguno", rExplorador.afectan.length === 0 && rExplorador.exentos.length === 3);

const rGoliat = efectosPara(ventisca, goliat);
check("al Goliat le pegan 2 y se libra de 1", rGoliat.afectan.length === 2 && rGoliat.exentos.length === 1);
check("el que se salta el Goliat es el frío", rGoliat.exentos[0].efecto === "frio_extremo");
check("la exención trae motivo escrito", rGoliat.exentos[0].motivo.length > 0);

const templado = { condition: "Nubes y claros", icon: "fa-cloud-sun", temp: "Suave" };
check("el tiempo llevadero no es duro", !esDuro(templado));
check("y no reparte efectos", efectosPara(templado, pelado).afectan.length === 0);

// --- Cada efecto tiene su ficha de reglas ---
check("todos los efectos tienen etiqueta y regla",
  CLAVES.every((k) => EFECTOS[k].label.length > 0 && EFECTOS[k].regla.length > 0 && EFECTOS[k].icon.length > 0));

console.log(failures === 0 ? "\nTodo OK" : `\n${failures} fallo(s)`);
process.exit(failures === 0 ? 0 : 1);
