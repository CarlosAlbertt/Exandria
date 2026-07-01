// Trasfondos del PHB 2024. Cada uno otorga aptitudes (a repartir), una dote
// de origen, dos pericias y competencia con herramienta. Texto original.

import type { AbilityKey } from "./rules";

export type Background = {
  slug: string;
  name: string;
  abilities: AbilityKey[]; // las 3 aptitudes que el trasfondo permite mejorar
  feat: string;
  skills: string[];
  tool: string;
  blurb: string;
};

export const BACKGROUNDS: Background[] = [
  { slug: "acolito", name: "Acólito", abilities: ["int", "sab", "car"], feat: "Iniciado en la Magia (Clérigo)", skills: ["Perspicacia", "Religión"], tool: "Suministros de caligrafía", blurb: "Serviste en un templo de Exandria, aprendiendo ritos y plegarias antes de salir al mundo." },
  { slug: "artesano", name: "Artesano", abilities: ["fue", "des", "int"], feat: "Hábil", skills: ["Investigación", "Persuasión"], tool: "Herramientas de artesano", blurb: "Dominas un oficio con las manos: tu taller y tu reputación te abren puertas." },
  { slug: "charlatan", name: "Charlatán", abilities: ["des", "con", "car"], feat: "Hábil", skills: ["Engaño", "Juego de Manos"], tool: "Kit de falsificación", blurb: "Vives del timo y el disfraz. Una buena mentira vale más que una espada." },
  { slug: "criminal", name: "Criminal", abilities: ["des", "con", "int"], feat: "Alerta", skills: ["Sigilo", "Juego de Manos"], tool: "Herramientas de ladrón", blurb: "Conociste el bajomundo de Tal'Dorei: contrabando, deudas y favores peligrosos." },
  { slug: "animador", name: "Animador", abilities: ["fue", "des", "car"], feat: "Músico", skills: ["Acrobacias", "Interpretación"], tool: "Instrumento musical", blurb: "El escenario es tu hogar. Sabes leer a una multitud y robarle el corazón." },
  { slug: "campesino", name: "Campesino", abilities: ["fue", "con", "sab"], feat: "Duro", skills: ["Trato con Animales", "Naturaleza"], tool: "Herramientas de carpintero", blurb: "Creciste trabajando la tierra. Conoces el valor del esfuerzo y la paciencia." },
  { slug: "guardia", name: "Guardia", abilities: ["fue", "int", "sab"], feat: "Vigilante", skills: ["Atletismo", "Percepción"], tool: "Juego de juegos", blurb: "Vigilaste murallas y portones. Sabes cuándo algo no encaja en una multitud." },
  { slug: "guia", name: "Guía", abilities: ["des", "con", "sab"], feat: "Iniciado en la Magia (Druida)", skills: ["Sigilo", "Supervivencia"], tool: "Herramientas de cartógrafo", blurb: "Las tierras salvajes de Tal'Dorei son tu mapa. Pocos rastros se te escapan." },
  { slug: "ermitano", name: "Ermitaño", abilities: ["con", "sab", "car"], feat: "Sanador", skills: ["Medicina", "Religión"], tool: "Kit de herborista", blurb: "Te retiraste del mundo en busca de respuestas. Vuelves con un secreto." },
  { slug: "comerciante", name: "Comerciante", abilities: ["con", "int", "car"], feat: "Afortunado", skills: ["Trato con Animales", "Persuasión"], tool: "Herramientas de navegante", blurb: "Caravanas y rutas comerciales; sabes regatear y leer el riesgo de un trato." },
  { slug: "noble", name: "Noble", abilities: ["fue", "int", "car"], feat: "Hábil", skills: ["Historia", "Persuasión"], tool: "Juego de juegos", blurb: "Naciste con privilegio y obligación. Tu apellido todavía pesa en ciertos salones." },
  { slug: "sabio", name: "Sabio", abilities: ["con", "int", "sab"], feat: "Iniciado en la Magia (Mago)", skills: ["Arcanos", "Historia"], tool: "Suministros de caligrafía", blurb: "Pasaste años entre libros. Sabes dónde buscar lo que nadie más recuerda." },
  { slug: "marinero", name: "Marinero", abilities: ["fue", "des", "sab"], feat: "Atacante Salvaje", skills: ["Acrobacias", "Percepción"], tool: "Herramientas de navegante", blurb: "Surcaste el Mar Lúcido. La cubierta de un barco es tu segunda piel." },
  { slug: "escriba", name: "Escriba", abilities: ["des", "int", "sab"], feat: "Hábil", skills: ["Investigación", "Percepción"], tool: "Suministros de caligrafía", blurb: "Documentos, contratos y crónicas pasaron por tu pluma. La letra revela mucho." },
  { slug: "soldado", name: "Soldado", abilities: ["fue", "des", "con"], feat: "Atacante Salvaje", skills: ["Atletismo", "Intimidación"], tool: "Juego de juegos", blurb: "Serviste en un ejército o milicia. La disciplina del campo de batalla no se olvida." },
  { slug: "vagabundo", name: "Vagabundo", abilities: ["des", "sab", "car"], feat: "Afortunado", skills: ["Perspicacia", "Sigilo"], tool: "Herramientas de ladrón", blurb: "Sin hogar fijo, recorriste Tal'Dorei viviendo de tu ingenio y tu suerte." },
];

export function getBackground(slug: string) {
  return BACKGROUNDS.find((b) => b.slug === slug);
}
