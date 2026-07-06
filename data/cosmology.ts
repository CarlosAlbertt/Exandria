// Cosmología y cronología de Exandria: calendario, estaciones, festividades,
// lunas y planos de existencia. Datos canónicos de Critical Role (nombres y
// mecánicas son hechos; las descripciones son resúmenes propios). Herramienta
// de fans no oficial.

// --- MUNDO ---
// Introducción de nivel mundial (Exandria) para la página /reino.
export const WORLD_INTRO =
  "Exandria es un mundo forjado y roto muchas veces por dioses, primordiales y mortales. Sus continentes —Tal'Dorei, Wildemount, Issylra, Marquet— y sus mares guardan imperios caídos, magia antigua y heridas que aún no cicatrizan. Vuestra campaña comienza en Tal'Dorei, la tierra salvaje del oeste.";

// --- CALENDARIO ---
// Un año exandrino dura 328 días repartidos en 11 meses. Semana de 7 días.
// Los años se cuentan desde la Divergencia: "PD" (Post-Divergencia), año 0 PD.
export const CALENDAR = {
  yearDays: 328,
  era: "PD", // Post-Divergencia
  currentYear: 836, // año aproximado de la campaña
  months: [
    "Horisal", "Misuthar", "Dualahei", "Thunsheer", "Unndilar", "Brussendar",
    "Sydenstar", "Fessuran", "Quen'pillar", "Cuersaar", "Duscar",
  ],
  // 7 días; Yulisen y Da'leysen son el fin de semana para mucha gente.
  weekdays: ["Miresen", "Grissen", "Whelsen", "Conthsen", "Folsen", "Yulisen", "Da'leysen"],
  weekend: ["Yulisen", "Da'leysen"],
};

// --- ESTACIONES ---
export type Season = { name: string; start: string; days: number; blurb: string };
export const SEASONS: Season[] = [
  { name: "Primavera", start: "13 de Dualahei", days: 74, blurb: "Arranca con el Festival de la Renovación. Deshielo, siembra y nuevos comienzos." },
  { name: "Verano", start: "26 de Unndilar (el Cénit)", days: 68, blurb: "La estación más corta. Empieza al mediodía del Cénit, el día más largo del año." },
  { name: "Otoño", start: "3 de Fessuran", days: 84, blurb: "Marcado por el Cierre de la Cosecha. Recogida, comercio y preparación para el frío." },
  { name: "Invierno", start: "2 de Duscar (Víspera Yerma)", days: 102, blurb: "La estación más larga. Noches interminables y días sagrados de la Matriarca de Cuervos." },
];

// --- FESTIVIDADES ---
export type Holiday = { name: string; date: string; blurb: string };
export const HOLIDAYS: Holiday[] = [
  { name: "Festival de la Renovación", date: "13 de Dualahei", blurb: "Inicio oficial de la primavera; se celebra la vida que vuelve tras el invierno." },
  { name: "El Cénit", date: "26 de Unndilar", blurb: "Solsticio de verano al mediodía; el día más luminoso del año." },
  { name: "Cierre de la Cosecha", date: "3 de Fessuran", blurb: "Se cierra la recolección y comienza el otoño." },
  { name: "Víspera Yerma", date: "2 de Duscar", blurb: "Umbral del invierno, la estación más dura y larga." },
  { name: "Cima del Invierno", date: "20 de Duscar", blurb: "La gran fiesta de Tal'Dorei: celebra la victoria sobre Errevon el Señor de la Escarcha y el fin de los Años del Hielo. En Piedrablanca se engalana el Árbol del Sol. Día santo de la Matriarca de Cuervos." },
];

// --- LUNAS ---
export type Moon = { name: string; blurb: string };
export const MOONS: Moon[] = [
  { name: "Catha", blurb: "La luna pálida y cercana, grande en el cielo. Completa su ciclo en 33 días; rige mareas y calendarios lunares." },
  { name: "Ruidus", blurb: "La luna carmesí, lejana y de órbita errática. Su fulgor rojizo se tiene por mal presagio y esconde secretos ligados a la Calamidad." },
];

// --- PLANOS DE EXISTENCIA (dimensiones) ---
export type Plane = { name: string; blurb: string };
export const PLANES: Plane[] = [
  { name: "Plano Material", blurb: "El mundo de Exandria y su cielo: el reino de los mortales." },
  { name: "Agreste Feérico", blurb: "Reflejo salvaje y caótico del Material, hogar de los feéricos. Innumerables portales lo conectan con Exandria." },
  { name: "Páramo Sombrío", blurb: "Plano de energía negativa que canaliza el tránsito de las almas entre la vida y la muerte." },
  { name: "Planos Elementales", blurb: "Reinos de fuego, agua, aire y tierra, y el Caos Elemental que los une. Fueron ordenados durante la Fundación." },
  { name: "Mar Astral", blurb: "Reino fronterizo entre los planos, donde la voluntad y la imaginación moldean el espacio. Camino hacia los dominios divinos." },
  { name: "Los Nueve Infiernos", blurb: "Plano del mal ordenado y jerárquico, dominio de Asmodeo, Señor de los Nueve." },
  { name: "El Abismo", blurb: "Plano infinito de caos y maldad, soñado por Tharizdun, el Olvido Encadenado. Sin ley ni jerarquía." },
  { name: "La Puerta Divina", blurb: "El sello alzado en la Divergencia que aparta a los dioses del Material: solo tocan el mundo a través de sus fieles." },
];
