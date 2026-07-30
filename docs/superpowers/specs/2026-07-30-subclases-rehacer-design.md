# Rehacer las subclases: 65 nuevas (2026-07-30)

## Objetivo

Sustituir todas las subclases actuales (13 clases × 4 = 52) por **65 nuevas**
(13 clases × 5), de ambientación Exandria 2024. Solo **nombre + blurb**: no
traen mecánica por nivel, así que aterrizan únicamente en `data/classes.ts`, no
en `data/classdata/*`.

No se añade el **Artificiero** — decisión del usuario. Siguen siendo las mismas
13 clases del repo.

## Alcance

- **Toca**: `data/classes.ts` (arrays `subclasses` de las 13 clases),
  `scripts/check-clases.ts` (dientes nuevos), `HANDOFF.md`, vault.
- **No toca**: `data/classdata/*`, `data/classdata/types.ts`, los pozos/pericias
  de las clases, ni ningún componente consumidor.

## Decisiones de diseño

1. **Forma del dato sin cambios**: sigue siendo `subclasses: { name, blurb }[]`.
   Los seis consumidores (`ClassScene.tsx`, `SummaryScene.tsx`,
   `app/crear/page.tsx`, `CharacterSheet.tsx`, `GrupoPanel.tsx`,
   `lib/character.ts`) leen la lista dinámicamente; verificado por grep que
   **ninguno hardcodea nombres de subclase**. Cero cambios en consumidores.
2. **`subclassLabel` intacto**: los 13 labels genéricos actuales encajan con los
   nombres nuevos. Se mantienen tal cual.
3. **Nombres verbatim**: se usan los nombres tal como los pasó el usuario,
   incluidos los prefijos `Patrón: ` (Brujo) y `Tradición del/de la ` (Mago) y
   los paréntesis `(Nigromante)`, `(Uk'otoa)`, `(Araña)`, `(Mutágenos)`.
4. **Blurbs verbatim**: redacción original del usuario en español, una frase por
   subclase. Cumple la convención del repo (nombres/datos = hechos; blurbs =
   redacción original, nunca prosa de libro).
5. **Orden**: el de la lista del usuario, 1→5 por clase.

## Dientes al gate (`scripts/check-clases.ts`)

Hoy el script solo valida `CLASS_MECHANICS` (pozos por nivel) y **no mira
`CLASSES` ni los nombres de subclase**. Se añade un bloque que importa `CLASSES`
de `data/classes.ts` y comprueba:

- Hay **13 clases** en `CLASSES`.
- Cada clase tiene **exactamente 5** subclases → **65 en total**.
- Todos los `name` de subclase son **únicos globalmente** (se guardan como texto
  suelto en `characters.subclass` y se muestran en varios sitios).
- Ningún `name` ni `blurb` está vacío (tras `trim()`).
- Ningún `subclassLabel` está vacío.

Estas comprobaciones fallan hoy (52 ≠ 65) y pasan tras el cambio de datos: el
gate ve la tanda.

## Supabase

Las fichas ya guardadas en `public.characters` tienen la subclase por nombre en
la columna `subclass text`. Al renombrar las 52, toda ficha vieja queda con un
nombre inexistente. Son **fichas de prueba, de ningún jugador** → borrado limpio,
lo ejecuta el usuario en el SQL Editor:

```sql
-- inspeccionar antes
select user_id, name, cls, subclass, updated_at from public.characters order by updated_at;
-- borrar (on delete cascade no toca auth.users)
delete from public.characters;
```

No hay código de migración.

## Gate de cierre

`npx tsc --noEmit` + `npx next build` + los 23 `scripts/check-*.ts` en verde
(check-clases.ts ahora con los dientes de subclase). Rama feature, commit por
tarea, `HANDOFF.md` + vault actualizados, merge a `master`.

---

## Las 65 subclases (fuente de la verdad para implementar)

### Bárbaro — label «Senda primigenia»
1. **Senda de la Furia Bermellón** — Canalizan el terror alienígena y el daño psíquico de la luna roja de Ruidus.
2. **Senda del Titán Caído** — Asimilan la roca y la inamovilidad de los Primordiales, provocando seísmos al golpear.
3. **Senda de la Ceniza Helada** — Guerreros de Eiselcross cuya furia congela el aire y la sangre de sus enemigos.
4. **Senda de la Mutación Salvaje** — Bárbaros de los páramos que desarrollan garras, espinas o glándulas de ácido al enfurecerse.
5. **Senda del Rompe-Mares** — Gladiadores piratas del Océano Lucidian, expertos en apresar bestias acuáticas.

### Bardo — label «Colegio bárdico»
1. **Colegio del Lamento** — Roban recuerdos y usan la tristeza del Páramo Sombrío para quebrar la mente del enemigo.
2. **Colegio del Espejismo** — Ilusionistas del desierto de Marquet que crean laberintos mentales y copias exactas de sí mismos.
3. **Colegio del Himno Marcial** — Estrategas hobgoblins que otorgan armadura temporal y ordenan reposicionamientos gratuitos.
4. **Colegio de los Ecos** — Tocan la "música" del tiempo (Dunamancia), acelerando aliados o ralentizando enemigos.
5. **Colegio de los Astros** — Astrólogos que alteran sus bufos mágicos según sintonicen con la luna Catha o Ruidus.

### Clérigo — label «Dominio divino»
1. **Dominio de la Convergencia** — Sacerdotes estelares que alternan entre la curación radiante y el castigo psíquico.
2. **Dominio de la Sangre** — Manipulan el flujo vital para reanimar títeres de sangre, curar hemorragias y hervir venas enemigas.
3. **Dominio de la Forja Ancestral** — Tanques de Kraghammer que graban runas explosivas de fuego en armas y armaduras.
4. **Dominio del Cieno** — Adoradores de lo abisal; disuelven armas enemigas con ácido y apresan con lodo tóxico.
5. **Dominio de la Puerta Divina** — Inquisidores de Vasselheim dedicados exclusivamente a silenciar hechiceros y disipar magia.

### Druida — label «Círculo druídico»
1. **Círculo de la Ceniza** — Se transforman en espíritus de ascuas puras; su magia ígnea quema todo a su paso.
2. **Círculo del Enjambre Feérico** — Se disuelven en letales nubes de luciérnagas y avispas del Paraje Feérico para infiltrarse y curar.
3. **Círculo de la Espora Abisal** — Reaniman cadáveres con hongos letales del Underdark y resisten la muerte sin órganos vitales.
4. **Círculo de la Tormenta Primigenia** — Encarnan el clima extremo de los Ashari, volando como avatares de relámpago y huracán.
5. **Círculo de la Escarcha Corrupta** — Se cubren de armaduras de hielo negro que ralentizan, congelan y necrosan a los atacantes.

### Explorador — label «Arquetipo del explorador»
1. **Cazador de Malicia** — Sombras del Underdark que se teletransportan por la oscuridad para castigar a quienes huyen.
2. **Vigilante del Telón** — Francotiradores del océano que ven a través de la niebla e ignoran el clima ambiental.
3. **Rastreador de Yermos** — Sobrevivientes del hielo que ralentizan a sus presas y hacen estallar trampas glaciares.
4. **Inquisidor de la Asamblea** — Cazadores de magos del Imperio; sus flechas rompen la concentración e imponen esferas de silencio.
5. **Vigía de Rifenmist** — Guerrilleros de la jungla maestros en venenos que ignoran inmunidades y asaltos críticos desde las sombras.

### Guerrero — label «Arquetipo marcial»
1. **Guerrero Elementalista** — Combinan los golpes físicos pesados con la destrucción de la magia primaria elemental.
2. **Hoplita de la Puerta Divina** — Falanges anti-magia que anclan a magos al suelo e irradian auras de protección divina.
3. **Caballero de Grifos** — La élite aérea de Emon, maestros de las lanzas de caballería, los saltos y el combate en caída libre.
4. **Guardia de los Ecos** — Combatientes dunamánticos que atacan simultáneamente junto a clones temporales de sí mismos.
5. **Rompeasedios** — Tropas pesadas imperiales expertas en control de masas físico, derribos y destrucción de escudos.

### Hechicero — label «Origen de hechicería»
1. **Alma del Luxon** — Curvan la gravedad con cada hechizo e incluso pueden rebobinar su propio turno en el tiempo.
2. **Corazón de Magma** — Su sangre es lava; sus hechizos de fuego dejan charcos ardientes en el campo de batalla.
3. **Alma Feérica** — Magos impredecibles que bailan mediante teletransportación y atraviesan las inmunidades mentales del enemigo.
4. **Linaje Radiante** — Baterías sagradas andantes; ciegan con luz divina e invocan alas de energía purificadora.
5. **Linaje de la Calamidad** — Radiactivos e inestables, sacrifican su propia vida para maximizar los daños de su magia en ruina.

### Mago — label «Tradición arcana»
1. **Tradición del Invocador de Ecos (Nigromante)** — Levantan los residuos espectrales de las almas en lugar de podrir cadáveres.
2. **Tradición de la Graviturgia** — Alteran el peso de los objetos, derribando voladores y creando agujeros negros en la arena.
3. **Tradición de la Cronurgia** — Detienen el tiempo, congelan hechizos en el aire y fuerzan a la realidad a fallar o acertar los dados.
4. **Tradición del Hemomante** — Usan sus propios Puntos de Golpe como componentes materiales para sobrecargar sus conjuros.
5. **Tradición del Maestro de Sellos** — Abjuradores tácticos que dibujan glifos explosivos rápidos que detonan al ser pisados.

### Monje — label «Tradición marcial»
1. **Camino del Hilo del Destino** — Artes marciales de la probabilidad; aseguran sus golpes y obligan a los enemigos a fallar en el último segundo.
2. **Camino del Alma de Cobalto** — Eruditos que golpean puntos de presión para extraer información táctica y secretos del enemigo.
3. **Camino de las Cadenas Rotas** — Invocan cadenas de ki desde sus muñecas para golpear, derribar y atraer desde lejos.
4. **Camino de los Vientos Cenicientos** — Monjes Ashari que envuelven sus ráfagas de golpes en fuego y proyectan vientos inbloqueables.
5. **Camino de la Mente Vacía** — Bloquean su cerebro contra la magia, devolviendo el daño psíquico a quien intente leer su mente.

### Paladín — label «Juramento sagrado»
1. **Juramento de la Reclamación** — Cazatesoros acorazados especializados en desactivar trampas y proteger Vestigios mágicos.
2. **Juramento del Exilio** — Defensores fronterizos que castigan a las aberraciones e imponen silencio a los viajeros planares.
3. **Juramento de la Luz Primigenia** — Caballeros drow de la Luz que alteran la gravedad y la inercia con sus ataques castigadores.
4. **Juramento del Alba** — Templarios del fuego solar, centrados en la erradicación absoluta de muertos vivientes mediante daño radiante masivo.
5. **Juramento de los Grilletes** — Carceleros arcanos que paralizan a sus enemigos y les impiden teleportarse.

### Pícaro — label «Arquetipo de pícaro»
1. **Sombra Dunamántica** — Cortan la línea temporal para golpear de nuevo a sus enemigos o intercambiar posiciones con sus ecos.
2. **Saqueador Arcano** — Usan su ataque furtivo para robar espacios de conjuro e interrumpir la magia enemiga en pleno vuelo.
3. **Sindicalista de la Myriad** — Mafiosos que engañan y obligan a que los enemigos gasten sus reacciones atacándose entre ellos.
4. **Fantasma de las Dunas** — Asesinos del desierto que se disuelven en arena, ciegan con polvo y encierran a los vivos en sarcófagos.
5. **Asesino de Azuremita** — Caminan por los techos y convierten todo su daño físico en dolor mental, silenciando los gritos de sus víctimas.

### Brujo — label «Patrón sobrenatural»
1. **Patrón: El Heraldo de Ruidus** — Roban los bufos, curaciones y escudos enemigos devorando su magia con pura radiación lunar.
2. **Patrón: El Leviatán Sellado (Uk'otoa)** — Invocan tentáculos, ahogan a los enemigos en tierra firme y se protegen con agua a hiperpresión.
3. **Patrón: La Tejedora (Araña)** — Todas sus magias se tornan veneno puro, tejiendo telarañas que drenan vida e impiden reaccionar.
4. **Patrón: El Archimago Caído** — Magia corrupta de la Calamidad que les permite memorizar y robar un hechizo enemigo tras verlo lanzarse.
5. **Patrón: El Espíritu de la Tierra** — Su piel se vuelve roca basalto y extraen su energía de los restos de los Titanes muertos bajo el suelo.

### Cazador de Sangre — label «Orden sanguínea»
1. **Orden del Velo Carmesí** — Gastan su propia salud para crear copias físicas perfectas y hacerse indetectables a la visión verdadera.
2. **Orden del Paraje Marchito** — Sus espadas inyectan toxinas que ralentizan y sus cuerpos expulsan nubes de esporas necróticas si son atacados.
3. **Orden del Inquisidor** — Si logran cortar a un mago, el dolor le revienta los canales arcanos causándole daño al intentar lanzar hechizos.
4. **Orden del Mutante** — Beben inyecciones tóxicas (Mutágenos) para potenciar atributos base a límites sobrehumanos, asumiendo debilidades.
5. **Orden de la Bestia** — Licántropos controlados mediante magia de sangre; monstruos de combate desarmado cuerpo a cuerpo.
