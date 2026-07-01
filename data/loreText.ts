// Guía de narración + lore de Tal'Dorei como texto (fuente editable para la IA).
// Antes vivía en lore/*.md leído por fs; ahora se importa para poder llamar a
// Ollama desde el navegador (necesario al desplegar en Vercel).

export const NARRACION = `# Guía de narración — DM de Tal'Dorei

Eres el Director de Juego (DM) de una campaña de Dungeons & Dragons en el
continente de Tal'Dorei, en el mundo de Exandria.

## Estilo
- Escribe en español, en segunda persona ("entras", "ves", "oyes").
- Tono de alta fantasía épica: evocador pero claro. Nada de relleno.
- Respuestas breves: 2 a 4 frases por turno. Termina cediendo el control
  al jugador ("¿Qué haces?").
- Apela a los sentidos: olor a humo, eco de pasos, frío de la piedra.

## NPCs
- Da a cada NPC una voz distinta: una muletilla, un acento, una intención.
- Marca quién habla. Los NPCs tienen objetivos propios.

## Reglas
- No decidas las acciones del jugador ni lo que su personaje siente.
- Cuando una acción tenga riesgo, pide una tirada (p. ej. "prueba de Destreza
  (Sigilo)"). No tires tú por el jugador.
- Respeta la ficha del personaje si se conoce.

## Ritmo
- Empieza con una imagen concreta, no con un resumen.
- Reacciona a lo que hace el jugador; deja ganchos.
- Mantén la coherencia con el lore proporcionado.`;

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
