// Guía de narración + lore de Exandria (mundo) con la campaña en Tal'Dorei,
// como texto (fuente editable para la IA).
// Antes vivía en lore/*.md leído por fs; ahora se importa para poder llamar a
// Ollama desde el navegador (necesario al desplegar en Vercel).

export const NARRACION = `Eres el Director de Juego (DM) de una partida de Dungeons & Dragons 5e (reglas
2024) ambientada en el continente de Tal'Dorei, en el mundo de Exandria. Tu
única voz es la del narrador y los NPCs; nunca hablas como IA ni rompes la
inmersión.

REGLAS DE ESCRITURA (obligatorias):
- Español siempre. Segunda persona del grupo ("veis", "entráis", "oís").
- 2 a 4 frases. Máximo ~80 palabras. Prosa densa, sin relleno ni resúmenes.
- Alta fantasía épica y sensorial: un detalle de imagen, uno de sonido u olor.
- Termina SIEMPRE devolviendo la iniciativa: "¿Qué hacéis?" o una pregunta
  concreta sobre su próxima acción.
- No uses listas, ni markdown, ni encabezados. Solo prosa narrada.
- No metas texto entre paréntesis ni notas de reglas dentro de la narración.

QUÉ NO HACER:
- No decidas las acciones, decisiones ni emociones de los personajes jugadores.
- No tires dados por ellos. Si una acción es arriesgada, pide la tirada:
  "Haced una prueba de Destreza (Sigilo)" y espera su resultado.
- No inventes que el grupo tiene objetos, aliados o información que no consta.

NPCs:
- Cada NPC tiene voz propia (una muletilla, un tono, una intención) y objetivos
  que no coinciden necesariamente con los del grupo. Marca quién habla.

COHERENCIA:
- Ajústate al lore de Exandria y de Tal'Dorei (la región donde transcurre la
  campaña) que se te proporciona más abajo. Si falta un dato menor, invéntalo de
  forma plausible y mantenlo constante.

EJEMPLO de tono (no lo copies literal):
"La puerta cede con un gemido de madera húmeda. Dentro, el aire huele a cera
quemada y a algo metálico bajo ella. Una figura encapuchada no se vuelve, pero
su mano se detiene sobre la daga. ¿Qué hacéis?"`;

export const MUNDO_SECTIONS: { title: string; body: string }[] = [
  { title: "Resumen", body: "Tal'Dorei es un continente joven de Exandria: una república de fronteras salvajes forjada sobre las cenizas de un imperio caído. Gobierna el Consejo de Tal'Dorei desde la capital, Emon. Magia antigua, ruinas de la Calamidad y monstruos pueblan sus tierras." },
  { title: "Historia", body: "Tras la Era de los Arcanos, los Dioses Traidores desataron la Calamidad, una guerra que casi destruyó el mundo. En la Divergencia, las deidades sellaron los planos divinos: desde entonces los dioses solo actúan a través de sus fieles. Sobre las ruinas se levantó Tal'Dorei y su capital, Emon." },
  { title: "Costa Lucidiana", body: "El litoral más poblado del continente. Aquí se alza Emon, sede del Consejo de Tal'Dorei, junto a puertos prósperos y campos fértiles. Corazón político." },
  { title: "Sierras de Alabastro", body: "Colinas pálidas y pasos de montaña que conectan el oeste con el interior. Tierra de caravanas, minas y la ciudad de Westruun." },
  { title: "Llanuras Divisorias", body: "Vastas praderas que parten el continente en dos. Hogar de la ciudad del vicio de Kymal y de tribus nómadas." },
  { title: "Montañas Torrerrisco", body: "Picos escarpados donde las casas enanas de Riscomartillo dominan la forja, la runa y el comercio de metales." },
  { title: "Montañas Crestormentas", body: "Una cordillera azotada por tormentas perpetuas, refugio de gigantes, dragones y peligros que pocos osan cruzar." },
  { title: "Península de Pleabruma", body: "Una península envuelta en niebla y leyenda, con puertos sombríos donde florece todo lo que prefiere no ser visto." },
  { title: "Expansión Verdante", body: "Un inmenso bosque primigenio que alberga Syngorn, la ciudad élfica que se desliza entre planos para protegerse." },
  { title: "Litoral de Filofulgor", body: "La costa más lejana y agreste, de acantilados cortantes y asentamientos fronterizos que miran al mar abierto." },
  { title: "Panteón", body: "Las Deidades Primarias (el Padre Tormenta, la Luz del Alba, la Madre Salvaje, el Forjador, la Matriarca de Cuervos, el Custodio del Conocimiento, el Caminante de los Páramos, la Dama de los Lazos) protegen a los mortales. Los Dioses Traidores (la Reina Carmesí, el Caos Errante, el Engañador, la Tejedora de Plagas) provocaron la Calamidad." },
  { title: "Facciones", body: "El Consejo de Tal'Dorei gobierna desde Emon. El Arcano Omnisciente custodia el saber arcano. Los Asharis sellan portales elementales. La Cámara de Piedrablanca mueve el comercio. Las Órdenes Claret cazan monstruos. La Garra Carmesí es un culto dracónico. Las Casas de Riscomartillo rigen las forjas enanas." },
  { title: "Calendario", body: "El año exandrino dura 328 días en 11 meses: Horisal, Misuthar, Dualahei, Thunsheer, Unndilar, Brussendar, Sydenstar, Fessuran, Quen'pillar, Cuersaar y Duscar. La semana tiene 7 días (Miresen, Grissen, Whelsen, Conthsen, Folsen, Yulisen y Da'leysen; los dos últimos son fin de semana). Los años se cuentan desde la Divergencia como 'PD' (Post-Divergencia); la campaña transcurre hacia el 836 PD." },
  { title: "Estaciones", body: "Primavera: empieza el 13 de Dualahei con el Festival de la Renovación (74 días). Verano: empieza en el Cénit, el 26 de Unndilar (68 días, la más corta). Otoño: empieza el 3 de Fessuran con el Cierre de la Cosecha (84 días). Invierno: empieza el 2 de Duscar, la Víspera Yerma (102 días, la más larga). La gran fiesta de Tal'Dorei es la Cima del Invierno, el 20 de Duscar." },
  { title: "Lunas", body: "Dos lunas surcan el cielo de Exandria. Catha, pálida y cercana, grande en el firmamento, completa su ciclo en 33 días. Ruidus, la luna carmesí lejana y de órbita errática, se tiene por mal presagio y guarda secretos ligados a la Calamidad." },
  { title: "Planos y cosmología", body: "Sobre el Plano Material se pliegan el Agreste Feérico (reflejo salvaje) y el Páramo Sombrío (tránsito de las almas). Existen los Planos Elementales, el Mar Astral (frontera hacia lo divino), los Nueve Infiernos de Asmodeo y el Abismo soñado por Tharizdun. Desde la Divergencia, la Puerta Divina aparta a los dioses del mundo: solo actúan a través de sus fieles." },
  { title: "Continentes", body: "Exandria tiene cinco masas de tierra principales: Tal'Dorei (centro, donde transcurre la campaña), Issylra (noroeste, cuna de la fe y de Vasselheim), Wildemount (este; Imperio Dwendaliano, Dinastía Kryn de Xhorhas y la Costa del Serrallo), Marquet (sur; desiertos y la metrópoli de Ank'Harel) y los Dientes Rotos (archipiélago del sur, resto del continente de Domunas destruido en la Calamidad)." },
];

// Selecciona secciones de lore relevantes a la conversación (siempre "Resumen").
export function pickLore(query: string, max = 4): string {
  const q = query.toLowerCase();
  const always = MUNDO_SECTIONS.filter((s) => /resumen/i.test(s.title));
  const scored = MUNDO_SECTIONS.filter((s) => !/resumen/i.test(s.title))
    .map((s) => {
      const words = s.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      let score = words.reduce((n, w) => n + (q.includes(w) ? 2 : 0), 0);
      for (const name of s.body.match(/[A-ZÁÉÍÓÚ][\wáéíóúñ']{4,}/g) ?? []) {
        if (q.includes(name.toLowerCase())) score += 1;
      }
      return { s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => x.s);
  const chosen = [...always, ...scored];
  return chosen.map((s) => `## ${s.title}\n${s.body}`).join("\n\n");
}
