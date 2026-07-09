# SPEC — Lore de Wildemount (deidades, historia, regiones) + iconos de clase

Instrucciones autocontenidas para implementar en este repositorio el lore de la
*Explorer's Guide to Wildemount* (EGW, 2020). Todo el material fuente necesario
está transcrito aquí: **no hace falta abrir el PDF** (288 MB, escaneado sin capa
de texto, en `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria\Books\`).

> ⚠️ **Copyright**: los NOMBRES, dominios, símbolos, fechas y hechos mecánicos
> son datos; las DESCRIPCIONES largas del libro no se copian. Escribe resúmenes
> propios en español, como ya hace el repo (ver cabecera de `data/cosmology.ts`
> y la convención en `HANDOFF.md`). Los "mandamientos" se parafrasean.

## Estado actual del repo (verificado a 2026-07-09, commit `ace8b38`)

- `data/taldorei.ts` — `PANTHEON: Deity[]` con 12 entradas genéricas (solo
  epíteto + dominio + bando). **Se sustituye** por el panteón canónico completo.
- `app/reino/page.tsx` — renderiza el panteón en dos columnas (Primarias /
  Traidores) alrededor de la línea 42-60. Se adapta al nuevo modelo.
- `data/cosmology.ts` — ya tiene `CALENDAR` (11 meses, 328 días, año 836 PD),
  `SEASONS`, `HOLIDAYS` (5 fiestas), `MOONS` (Catha/Ruidus), `PLANES`. Se
  **amplían** las festividades con los días santos de cada deidad.
- `data/world.ts` — `CONTINENTS` incluye Wildemount; `REGIONS_BY_CONTINENT` y
  `WORLD_POIS` existen. Mapas en `public/maps/wildemount/` ya optimizados.
- `data/classes.ts` — 13 clases con slugs en español (incl. `cazador-de-sangre`).
- `app/crear/page.tsx:347,363` — retratos de clase esperados en
  `/classes/<slug>.jpg` vía `PortraitFrame` (fallback a icono si falta el jpg).
  **`public/classes/` no existe aún.**
- Iconos disponibles en `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria\img\`
  (11 jpgs con nombre inglés; faltan bardo y paladín).

Orden recomendado de tareas: A → B → C → D → E. Cada tarea compila por sí sola
(`npx tsc --noEmit` + `npm run build` al final). Commit por tarea.

---

## TAREA A — Panteón canónico completo

Crear `data/pantheon.ts` (nuevo archivo; `taldorei.ts` re-exporta o se limpia
su `PANTHEON` viejo y se actualizan los imports de `app/reino/page.tsx`).

### Modelo sugerido

```ts
export type DeitySide = "prime" | "betrayer" | "idol";
export type Deity = {
  slug: string;
  name: string;        // nombre propio (Avandra, Bahamut…) o del ídolo
  epithet: string;     // epíteto en español
  side: DeitySide;
  alignment: string;   // "CB", "LB", "N"… (abreviaturas en español)
  province: string;    // esfera de influencia
  domains: string[];   // dominios de clérigo sugeridos (2024)
  symbol: string;      // descripción del símbolo sagrado
  holyDay?: { name: string; date: string };  // si tiene
  commandments: string[]; // 3 preceptos, parafraseados
  blurb: string;       // 2-4 frases propias: quién es, dónde mora, enemistades
  patron?: string;     // solo ídolos: tipo de patrón de brujo sugerido
};
export const PRIME_DEITIES: Deity[]; export const BETRAYER_GODS: Deity[];
export const LESSER_IDOLS: Deity[];
export const PANTHEON = [...PRIME_DEITIES, ...BETRAYER_GODS]; // compat
```

### Datos fuente — Deidades Primarias (EGW p. 20-26)

| Deidad | Epíteto (ES) | Alin. | Esfera | Dominios | Símbolo | Día santo |
|---|---|---|---|---|---|---|
| Avandra | La Portadora del Cambio | CB | Cambio, libertad, suerte | Naturaleza, Superchería | Perfil de mujer en moneda/colgante de oro | Nuevo Amanecer — 1 de Horisal |
| Bahamut | El Dragón de Platino | LB | Honor, justicia | Vida, Orden, Guerra | Cabeza de dragón plateada de perfil | Embertide — 5 de Duscar |
| Corellon | El Corazón Arcano | CB | Arte, belleza, elfos | Arcano, Luz | Dos lunas crecientes enfrentadas sobre estrella de 4 puntas | Alba Élfica (Elvendawn) — 20 de Brussendar |
| Erathis | La Portadora de la Ley | LN | Civilización, ley, paz | Conocimiento, Orden | Hacha bicéfala con motivo de balanza | Alba de la Civilización — 22 de Quen'pillar |
| Ioun | La Mentora Sapiente | N | Conocimiento, enseñanza | Arcano, Conocimiento | Par de ojos abiertos coronados por un tercero | (culto en privado; sin día público) |
| Kord | El Señor de la Tormenta | CN | Batalla, competición, tormentas | Tempestad, Guerra | Cuatro rayos radiando del centro de un escudo | Día del Desafío — 7 de Misuthar |
| Melora | La Madre Salvaje | N | Mares, naturaleza salvaje | Vida, Naturaleza, Tempestad | Corona de hierba y grano atada a un cayado | Esplendor Salvaje — 20 de Dualahei |
| Moradin | El Gran Martillo | LB | Artesanía, creación | Forja, Conocimiento, Guerra | Martillo con extremos tallados como cabezas enanas | Solaz Profundo — 18 de Unndilar |
| Pelor | El Padre del Alba | NB | Sanación, sol | Vida, Luz, Naturaleza | Estrella brillante de ocho puntas | Pleno Verano (Highsummer) — 7 de Sydenstar |
| Raei | La Luz Eterna | NB | Expiación, compasión | Vida, Luz | Fénix femenino humanoide de marfil | (olvidado; sus fieles aún debaten la fecha) |
| La Reina de los Cuervos | Matrona de la Muerte | LN | Muerte, destino, invierno | Muerte, Tumba | Máscara blanca enmarcada en plumas negras | Noche de la Ascensión — 13 de Cuersaar |
| Sehanine | La Tejedora de Lunas | CB | Ilusión, luz de luna, noche | Arcano, Naturaleza, Superchería | Luna creciente hacia arriba, tensada como un arco | (luna llena mayor de la década) |

Notas de color para los `blurb` (hechos del libro, redactar en propio):
- Avandra: sin morada fija, vaga por los Planos Exteriores; archienemiga de Asmodeo.
- Bahamut: palacio en los Siete Cielos de Celestia; sus paladines cazan los cultos de Tiamat.
- Corellon: mora en Bosquecillo Creciente (Arborea); padre/madre de los elfos; odia a Lolth. En el Imperio Dwendaliano su culto no se promueve; Bysaes Tyl lo celebra en secreto.
- Erathis: la Ciudad Brillante de Hestavar (Plano Astral); romance tempestuoso con Melora.
- Ioun: herida por el Olvido Encadenado en la Calamidad; culto en privado (Alma de Cobalto).
- Kord: reino de Ysgard; el Godsbrawl anual en el Templo de Kord de Port Damali.
- Melora: culto ilegal en el Imperio Dwendaliano; venerada por los Ki'Nau.
- Moradin: mansión de Erackinor bajo Solania (Celestia); centro de Grimgolir.
- Pelor: Fortaleza del Sol (Elysium); derrotó a Torog en la Calamidad; el Imperio usa su fiesta para reclutar.
- Raei: traicionada por Asmodeo en la Calamidad (masacre de sus fieles) → vínculo eterno entre fieles de Raei y Avandra; templo en la Isla de la Renovación (Elysium).
- Reina de los Cuervos: mortal ascendida (su nombre se borró de la historia); fortaleza de Letherna (Páramo Sombrío); su fiesta se usa ahora para quemar efigies de los Kryn.
- Sehanine: Arborea/Agreste Feérico; protectora de amantes; culto prohibido por el Imperio.

### Datos fuente — Dioses Traidores (EGW p. 26-30)

| Deidad | Epíteto (ES) | Alin. | Esfera | Dominios | Símbolo |
|---|---|---|---|---|---|
| Asmodeo | El Señor de los Nueve Infiernos | LM | Dominación, tiranía | Superchería, Guerra | Corona de ónice puntiaguda con cuernos curvos |
| Bane | El Emperador de la Discordia | LM | Conquista, tiranía | Forja, Orden, Guerra | Mangual de cadenas acabadas en grilletes |
| Gruumsh | El Arruinador | CM | Matanza, guerra | Muerte, Tempestad, Guerra | Ojo único que sangra, siempre abierto |
| Lolth | La Reina Araña | CM | Engaño, arañas | Conocimiento, Superchería | Araña enjoyada |
| Tharizdun | El Olvido Encadenado | CM | Oscuridad, destrucción | Muerte, Tumba, Superchería | Estrella torcida de siete puntas hecha de cadenas |
| Tiamat | La Tirana Escamada | LM | Dragones malignos, codicia | Orden, Superchería, Guerra | Garra de dragón con talones |
| Torog | El Rey Reptante | NM | Esclavitud, tortura | Muerte, Superchería | Tres brazos pálidos arañando desde un vacío oscuro |
| Vecna | El Susurrado | NM | Nigromancia, secretos | Arcano, Muerte, Tumba, Conocimiento | Mano disecada con un ojo en la palma |
| Zehir | La Serpiente Encapotada | CM | Asesinos, veneno, serpientes | Naturaleza, Superchería | Serpiente enroscada |

Color: Asmodeo traicionó a la Luz Eterna en la Calamidad; Avandra lo venció con
engaños. Bane fue derrotado por Melora en Rifenmist. Corellon arrancó el ojo a
Gruumsh. Lolth perdió a los drow de Xhorhas (se volvieron al Luxon) y ansía
venganza. Tharizdun está encadenado en el Abismo; Ioun lideró su encierro.
Tiamat presa en Avernus. Torog excavó bajo Exandria; Pelor y Raei lo
desterraron. Vecna, archilich ascendido, sellado tras la Puerta Divina por Vox
Machina (¡hace ~20 años!); odia a Ioun. Zehir creó a Uk'otoa; sus serpentkin
duermen en estasis.

### Datos fuente — Ídolos Menores (EGW p. 30-34)

| Ídolo | Alin. | Patrón de brujo | Dominios | Símbolo |
|---|---|---|---|---|
| Brazos de los Traidores | NM | El Fiend, la Hexblade | Muerte, Guerra | Hoja clavada hacia abajo a través de cráneo de ocho ojos |
| Ceratos | CN | El Great Old One | Conocimiento, Tempestad | Tres ojos dispares rodeados de dientes |
| Desirat, el Fénix Crepuscular | LM | El Fiend, el Undying | Luz, Superchería | Pluma púrpura ardiente |
| Naviask | NB | El Archfey | Vida, Naturaleza | Corona de flores con forma de cuernos de demonio |
| Quajath, el Submandíbula | CN | Fiend / Great Old One | Naturaleza, Guerra | Anillo de dientes |
| La Madre Bruja | NM | El Fiend | Conocimiento, Superchería | Cuerno rojo único |
| El Luxon, la Primera Luz | N | — | Arcano, Luz | Dodecaedro hueco |
| El Viajero | CN | El Archfey | Naturaleza, Superchería | Puerta arqueada sobre un camino que se desvanece |
| Uk'otoa | NM | Great Old One / Hexblade | Conocimiento, Tempestad | Ojo amarillo de pupila rasgada |
| Vesh, la Sirena Sangrienta | NM | Archfey / Undying | Muerte, Vida | Anillo carmesí colgando de una cadena |
| Xalicas | LB | Archfey / Celestial | Vida, Luz | Ala única ennegrecida |

Color: los ocho **Brazos de los Traidores** son armas conscientes forjadas con
fuerza vital de fiends (Hoja de Espejos Rotos —Tharizdun—, Grovelthrash —Torog—,
Látigo de Sombras —Zehir—, Maza de la Corona Negra —Asmodeo—, Estela de la Ruina
—Gruumsh—, Rencor de Seda —Lolth—, El Final Sangriento —Bane—, Voluntad del
Talón —Tiamat—; detalladas en EGW cap. 6). El **Luxon** es la deidad central de
la Dinastía Kryn: luz primigenia sin consciencia activa; sus **balizas**
(beacons) permiten la *consecución* (renacimiento del alma) y el *anamnesis*
(recordar vidas pasadas); un alma completa es un **Umavi**. La guerra actual
estalló porque el Imperio robó dos balizas. **Uk'otoa** fue creación de Zehir,
guardián de los Ki'Nau, sellado bajo el océano Lucidiano por sus propios
fieles corrompidos. **El Viajero** es Artagan, un archfey vinculado a Vox
Machina. **Xalicas** es un solar herido, mano derecha del Corazón Arcano.

### Integración UI (`app/reino/page.tsx`)

- Sección Panteón pasa a tres bloques: Primarias / Traidores / Ídolos Menores
  (el tercero colapsable o con estilo distinto — decide según el diseño actual).
- Cada deidad: tarjeta con epíteto, nombre, alineamiento, esfera, símbolo
  (texto), día santo si tiene, y los 3 preceptos como lista pequeña.
- Mantener estética actual (paneles, `eyebrow`, colores `--color-divino` /
  `--color-ember`; usa un tercer acento para ídolos, p. ej. `--color-violet`).

---

## TAREA B — Historia ampliada (línea temporal)

`data/taldorei.ts` tiene `HISTORY: Era[]` (6 eras genéricas). Crear
`data/history.ts` con línea temporal canónica ampliada y usarla en `/reino`
(la actual se puede conservar como intro corta). Fechas en años PD
(Post-Divergencia); la campaña va por ~836 PD.

Cronología fuente (EGW p. 11-19):

1. **La Fundación** (mito): los dioses llegan al mundo primordial, crean elfos,
   enanos y humanos. Los Primordiales despiertan; guerra divina; los dioses se
   dividen (Primarias vs. futuros Traidores). Los Primordiales son dispersados;
   nace Vasselheim (Ciudad del Alba, en Othanzia/Issylra), la civilización más
   antigua que sobrevive.
2. **Era de los Arcanos**: apogeo de la magia mortal; ciudades flotantes;
   archimagos como Vecna y Halas Lutagran. Una maga mortal derrota al dios de
   la muerte y asciende (la futura Reina de los Cuervos). El archimago Vespin
   Chloras libera a los Dioses Traidores.
3. **La Calamidad**: los Traidores crean Ghor Dranas en Xhorhas y asaltan
   Vasselheim; los Primarias descienden. Wynandir sufre lo peor. Muere ~2/3 de
   la población de Exandria. Ghor Dranas queda en cenizas.
4. **La Divergencia** (año 0 PD): los dioses se exilian tras la Puerta Divina.
5. **Post-Divergencia en Wildemount**:
   - Clan **Grimgolir**: enanos que resistieron bajo tierra; fundan Uthodurn
     bajo las Flotket Alps (junto a refugiados elfos de Molaesmyr).
   - **Dominio Julous** en el Valle Marrow (unificación en torno a Zadash).
   - Los zemnianos fundan Icehaven e Yrrosa y luego **Rexxentrum**; **539 PD**
     Manfried Dwendal, primer emperador. **544 PD** la Amonestación (purga
     religiosa; se limita el culto a dioses "aprobados").
   - **Guerra Marrow** (~16 meses): el Imperio absorbe el Dominio Julous; el
     emperador pasa a titularse **rey** → Imperio Dwendaliano.
   - **Víspera de la Medianoche Carmesí**: duelo mágico entre casas nobles en
     Rexxentrum → nace la **Asamblea Cerberus** (magos al servicio de la Corona).
   - **~400 PD** llegan los marquesianos a las Islas Swavain; alianza con los
     **Ki'Nau** (con la bendición de Uk'otoa); Zehir corrompe una secta que
     sella a Uk'otoa; nace **Damali** y después el **Concordato Clovis**
     (Costa de la Casa de Fieras / Menagerie Coast).
   - **585 PD** la **Corrupción de Molaesmyr**: el bosque Savalirwood se
     pudre; los elfos huyen a Bysaes Tyl y Uthodurn (Tierras Salvajes Grises).
   - **790 PD** corona el rey **Bertrand Dwendal** (68 años en 835 PD).
   - **815 PD** el **Cónclave Cromático** destruye **Draconia** (Xhorhas);
     los ravenitas se liberan de los dracónidos.
   - Los drow de Xhorhas abandonan a Lolth por el **Luxon**; fundan Rosohna
     sobre las ruinas de Ghor Dranas → **Dinastía Kryn** (Reina Brillante
     Leylas Kryn).
   - **Guerra de la Ceniza y la Luz (835 PD, en curso)**: espías dwendalianos
     roban dos balizas del Luxon; los Kryn atacan las Salas de la Erudición de
     Zadash; guerra abierta a ambos lados de las Ashkeeper Peaks. Una quinta
     baliza en manos de la Asamblea Cerberus.
6. **Actualidad (836 PD)**: guerra viva; el rey mantiene el aislacionismo;
   la Myriad (crimen organizado) medra en la sombra.

Modelo: reutiliza `Era` (`year/title/text`) o añade `continent?: string` para
filtrar por continente en la UI. Texto propio, 2-4 frases por hito.

---

## TAREA C — Wildemount en `/reino`: regiones, facciones, idiomas

### C.1 Regiones (gazetteer EGW cap. 3)

`data/world.ts` ya lista Wildemount en `CONTINENTS`. Añadir datos de región
(mismo modelo `Region` de `taldorei.ts`, con `continent: "Wildemount"`), y
mapas ya presentes en `public/maps/wildemount/`:

| Región | Capital/ciudad clave | Rasgo |
|---|---|---|
| Costa de la Casa de Fieras (Menagerie Coast) | Port Damali | Concordato Clovis; comercio y piratería (la Revelry) |
| Valle Marrow (Wynandir occidental) | Zadash / Rexxentrum | Corazón del Imperio Dwendaliano |
| Campos Zemnianos | Rexxentrum | Capital imperial; cuna zemniana |
| Tierras Salvajes Grises | Uthodurn / Shadycreek Run | Savalirwood corrupto; Tribus de Shadycreek |
| Eiselcross | Palebank | Hielo; ruinas de Aeor; fiebre exploradora |
| Páramos de Xhorhas (Wynandir oriental) | Rosohna | Dinastía Kryn; el Luxon |
| Blightshore | — | Costa maldita; horrores post-Calamidad |

(Coordenadas de pin sobre el mapa de Wildemount: colocarlas a ojo y dejar que
el DM las ajuste arrastrando, como ya funciona con Tal'Dorei.)

### C.2 Facciones (EGW cap. 2, p. 35-58)

Añadir a `FACTIONS` (o nuevo array por continente): Imperio Dwendaliano (rey
Bertrand Dwendal; ~35.300 soldados de la Marca Justa + 5.200 Guardia de la
Corona; sistema de starostas; culto regulado), Dinastía Kryn (Leylas Kryn;
Umavi; armadura quitinosa "cricks"), Asamblea Cerberus, Concordato Clovis,
la Myriad (crimen), Hijos de la Malicia (cultistas de los Dioses Traidores
en Xhorhas), Diarquía de Uthodurn, Tribus de Shadycreek Run, Biblioteca del Alma de
Cobalto, Cicatrices de Escama y Diente, Órdenes Claret, Sonrisa Dorada,
la Revelry. Una frase por facción basta (modelo `Faction` actual).

### C.3 Idiomas y vida diaria (EGW p. 9-10)

Nuevo bloque pequeño en `/reino` o en `data/cosmology.ts`:
- **Zemniano** (imperio rural), **Marquesiano** (alta sociedad del Concordato
  y piratas), **Naush** (Ki'Nau, jerga marinera).
- Tecnología: pólvora negra incipiente (Hupperdook / Port Zoon), armas de
  fuego solo militares.
- Moneda: cada nación acuña la suya; el oro vale en todas partes.

---

## TAREA D — Festividades completas en el calendario

Ampliar `HOLIDAYS` de `data/cosmology.ts` con el calendario exandrino completo
(EGW p. 8). Formato actual `{ name, date, blurb }`. Añadir (las 5 existentes se
conservan; evita duplicar Renovación/Cénit/Cierre/Víspera):

| Fiesta | Fecha | Deidad/motivo |
|---|---|---|
| Nuevo Amanecer | 1 de Horisal | Avandra; año nuevo, hogueras al atardecer en la costa |
| Hillsgold | 27 de Horisal | laica |
| Día del Desafío | 7 de Misuthar | Kord; el Godsbrawl de Port Damali |
| Esplendor Salvaje | 20 de Dualahei | Melora; equinoccio de primavera |
| Alza de la Cosecha | 11 de Thunsheer | laica |
| Día de Merryfrond | 31 de Thunsheer | laica |
| Solaz Profundo | 8 de Unndilar | Moradin; meditación en familia |
| Feria del Artesano | 15 de Brussendar | laica |
| Alba Élfica | 20 de Brussendar | Corellon; puertas al Feérico en Bysaes Tyl |
| Pleno Verano | 7 de Sydenstar | Pelor; el Imperio la usa para reclutar |
| Mañana de la Largueza | 14 de Sydenstar | laica |
| Festival del Avellano | 10 de Quen'pillar | laica |
| Alba de la Civilización | 22 de Quen'pillar | Erathis; equinoccio de otoño |
| Noche de la Ascensión | 13 de Cuersaar | Reina de los Cuervos |
| Embertide | 5 de Duscar | Bahamut; recuerdo de los caídos |

Opcional: en `Holiday` añade `deity?: string` (slug de `pantheon.ts`) para
enlazar fiesta ↔ deidad en la UI.

---

## TAREA E — Iconos de clase

Copiar de `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria\img\` a
`public/classes/` renombrando al slug español que espera
`app/crear/page.tsx` (`/classes/<slug>.jpg`):

| Origen (vault img) | Destino (public/classes) |
|---|---|
| barbarian-icon.jpg | barbaro.jpg |
| bloodhunter-icon.jpg | cazador-de-sangre.jpg |
| cleric-icon.jpg | clerigo.jpg |
| druida-icon.jpg | druida.jpg |
| fighter-icon.jpg | guerrero.jpg |
| monk-icon.jpg | monje.jpg |
| ranger-icon.jpg | explorador.jpg |
| rogue-icon.jpg | picaro.jpg |
| sorcerer-icon.jpg | hechicero.jpg |
| warlock-icon.jpg | brujo.jpg |
| wizard-icon.jpg | mago.jpg |

Faltan **bardo.jpg** y **paladin.jpg** → `PortraitFrame` ya muestra su
fallback de icono; anotar en HANDOFF/Pendientes que faltan esos dos retratos.
Optimiza si alguno pesa mucho (objetivo < ~100 KB, como los mapas).

---

## Propuestas adicionales (backlog, NO implementar sin confirmación)

1. **Deidad en el creador de personaje**: paso opcional (obligatorio para
   clérigo/paladín) que elige deidad de `pantheon.ts`; se guarda en
   `characters` (columna `deity` → nueva migración `schema_v11.sql`) y se
   muestra en la hoja `/personaje`.
2. **Fecha del mundo + fiesta activa**: el DM fija la fecha de campaña en
   `app_config`; la home o `/reino` muestran "hoy" en calendario exandrino y
   resaltan la festividad si coincide (usa `CALENDAR` + `HOLIDAYS`).
3. **Brazos de los Traidores como objetos legendarios** en el Baúl del DM
   (data + entrega vía baúl ya existente).
4. **Pestaña Wildemount en `/mapa`**: los mapas `public/maps/wildemount/*` ya
   están; replicar el patrón regiones+POIs+niebla que funciona en Tal'Dorei.
5. **Idioma(s) del personaje** en el creador (zemniano/marquesiano/naush como
   opciones de trasfondo).
6. **Widget de lunas**: fase de Catha (ciclo 33 días) calculada desde la fecha
   de campaña; Ruidus como evento raro que el DM puede activar (presagio).
7. **Panteón para la IA**: añadir el panteón resumido a `data/loreText.ts`
   para que el narrador IA conozca las deidades canónicas.

## Verificación

1. `npx tsc --noEmit` limpio.
2. `npm run build` limpio.
3. `npm run dev` → `/reino`: panteón con 12+9+11 entradas y estilo intacto;
   historia ampliada visible; `/crear`: iconos de clase visibles (menos bardo
   y paladín, con fallback).
4. Commit por tarea, mensajes en español, coautoría según `HANDOFF.md`
   (autor `CarlosAlbertt <CarlosAlbertt@users.noreply.github.com>`).
