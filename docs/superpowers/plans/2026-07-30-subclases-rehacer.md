# Rehacer las subclases (65 nuevas) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir las 52 subclases actuales (13 clases × 4) por 65 nuevas (13 clases × 5), solo nombre + blurb, y darle dientes al gate para que valide subclases.

**Architecture:** Solo cambia el array `subclasses` de cada clase en `data/classes.ts` (la forma del dato `{name, blurb}` NO cambia, así que ningún consumidor se toca) y se añade un bloque de validación de subclases a `scripts/check-clases.ts`. Sin código de migración: las fichas de prueba se borran a mano en Supabase.

**Tech Stack:** TypeScript, Next.js 16, scripts con `tsx`. No hay framework de test; el gate real son los `scripts/check-*.ts`.

**Fuente de la verdad de los 65 nombres/blurbs:** `docs/superpowers/specs/2026-07-30-subclases-rehacer-design.md`. Verbatim, sin retocar.

---

## File Structure

- **Modify** `data/classes.ts` — reemplazar el array `subclasses` de las 13 clases. `subclassLabel`, pozos, pericias: intactos.
- **Modify** `scripts/check-clases.ts` — importar `CLASSES` y añadir bloque de validación de subclases antes del `console.log` final.

Nada más se toca. Verificado por grep: ningún consumidor hardcodea nombres de subclase.

---

### Task 1: Reemplazar las 65 subclases en `data/classes.ts`

**Files:**
- Modify: `data/classes.ts` (los 13 arrays `subclasses`)

Reemplaza, clase por clase, el array `subclasses: [ ... ]` (4 entradas actuales) por el nuevo (5 entradas). No toques `subclassLabel` ni ningún otro campo. Los bloques nuevos, verbatim:

- [ ] **Step 1: Bárbaro** (`slug: "barbaro"`)

```ts
    subclasses: [
      { name: "Senda de la Furia Bermellón", blurb: "Canalizan el terror alienígena y el daño psíquico de la luna roja de Ruidus." },
      { name: "Senda del Titán Caído", blurb: "Asimilan la roca y la inamovilidad de los Primordiales, provocando seísmos al golpear." },
      { name: "Senda de la Ceniza Helada", blurb: "Guerreros de Eiselcross cuya furia congela el aire y la sangre de sus enemigos." },
      { name: "Senda de la Mutación Salvaje", blurb: "Bárbaros de los páramos que desarrollan garras, espinas o glándulas de ácido al enfurecerse." },
      { name: "Senda del Rompe-Mares", blurb: "Gladiadores piratas del Océano Lucidian, expertos en apresar bestias acuáticas." },
    ],
```

- [ ] **Step 2: Bardo** (`slug: "bardo"`)

```ts
    subclasses: [
      { name: "Colegio del Lamento", blurb: "Roban recuerdos y usan la tristeza del Páramo Sombrío para quebrar la mente del enemigo." },
      { name: "Colegio del Espejismo", blurb: "Ilusionistas del desierto de Marquet que crean laberintos mentales y copias exactas de sí mismos." },
      { name: "Colegio del Himno Marcial", blurb: "Estrategas hobgoblins que otorgan armadura temporal y ordenan reposicionamientos gratuitos." },
      { name: "Colegio de los Ecos", blurb: "Tocan la \"música\" del tiempo (Dunamancia), acelerando aliados o ralentizando enemigos." },
      { name: "Colegio de los Astros", blurb: "Astrólogos que alteran sus bufos mágicos según sintonicen con la luna Catha o Ruidus." },
    ],
```

- [ ] **Step 3: Brujo** (`slug: "brujo"`)

```ts
    subclasses: [
      { name: "Patrón: El Heraldo de Ruidus", blurb: "Roban los bufos, curaciones y escudos enemigos devorando su magia con pura radiación lunar." },
      { name: "Patrón: El Leviatán Sellado (Uk'otoa)", blurb: "Invocan tentáculos, ahogan a los enemigos en tierra firme y se protegen con agua a hiperpresión." },
      { name: "Patrón: La Tejedora (Araña)", blurb: "Todas sus magias se tornan veneno puro, tejiendo telarañas que drenan vida e impiden reaccionar." },
      { name: "Patrón: El Archimago Caído", blurb: "Magia corrupta de la Calamidad que les permite memorizar y robar un hechizo enemigo tras verlo lanzarse." },
      { name: "Patrón: El Espíritu de la Tierra", blurb: "Su piel se vuelve roca basalto y extraen su energía de los restos de los Titanes muertos bajo el suelo." },
    ],
```

- [ ] **Step 4: Clérigo** (`slug: "clerigo"`)

```ts
    subclasses: [
      { name: "Dominio de la Convergencia", blurb: "Sacerdotes estelares que alternan entre la curación radiante y el castigo psíquico." },
      { name: "Dominio de la Sangre", blurb: "Manipulan el flujo vital para reanimar títeres de sangre, curar hemorragias y hervir venas enemigas." },
      { name: "Dominio de la Forja Ancestral", blurb: "Tanques de Kraghammer que graban runas explosivas de fuego en armas y armaduras." },
      { name: "Dominio del Cieno", blurb: "Adoradores de lo abisal; disuelven armas enemigas con ácido y apresan con lodo tóxico." },
      { name: "Dominio de la Puerta Divina", blurb: "Inquisidores de Vasselheim dedicados exclusivamente a silenciar hechiceros y disipar magia." },
    ],
```

- [ ] **Step 5: Druida** (`slug: "druida"`)

```ts
    subclasses: [
      { name: "Círculo de la Ceniza", blurb: "Se transforman en espíritus de ascuas puras; su magia ígnea quema todo a su paso." },
      { name: "Círculo del Enjambre Feérico", blurb: "Se disuelven en letales nubes de luciérnagas y avispas del Paraje Feérico para infiltrarse y curar." },
      { name: "Círculo de la Espora Abisal", blurb: "Reaniman cadáveres con hongos letales del Underdark y resisten la muerte sin órganos vitales." },
      { name: "Círculo de la Tormenta Primigenia", blurb: "Encarnan el clima extremo de los Ashari, volando como avatares de relámpago y huracán." },
      { name: "Círculo de la Escarcha Corrupta", blurb: "Se cubren de armaduras de hielo negro que ralentizan, congelan y necrosan a los atacantes." },
    ],
```

- [ ] **Step 6: Explorador** (`slug: "explorador"`)

```ts
    subclasses: [
      { name: "Cazador de Malicia", blurb: "Sombras del Underdark que se teletransportan por la oscuridad para castigar a quienes huyen." },
      { name: "Vigilante del Telón", blurb: "Francotiradores del océano que ven a través de la niebla e ignoran el clima ambiental." },
      { name: "Rastreador de Yermos", blurb: "Sobrevivientes del hielo que ralentizan a sus presas y hacen estallar trampas glaciares." },
      { name: "Inquisidor de la Asamblea", blurb: "Cazadores de magos del Imperio; sus flechas rompen la concentración e imponen esferas de silencio." },
      { name: "Vigía de Rifenmist", blurb: "Guerrilleros de la jungla maestros en venenos que ignoran inmunidades y asaltos críticos desde las sombras." },
    ],
```

- [ ] **Step 7: Guerrero** (`slug: "guerrero"`)

```ts
    subclasses: [
      { name: "Guerrero Elementalista", blurb: "Combinan los golpes físicos pesados con la destrucción de la magia primaria elemental." },
      { name: "Hoplita de la Puerta Divina", blurb: "Falanges anti-magia que anclan a magos al suelo e irradian auras de protección divina." },
      { name: "Caballero de Grifos", blurb: "La élite aérea de Emon, maestros de las lanzas de caballería, los saltos y el combate en caída libre." },
      { name: "Guardia de los Ecos", blurb: "Combatientes dunamánticos que atacan simultáneamente junto a clones temporales de sí mismos." },
      { name: "Rompeasedios", blurb: "Tropas pesadas imperiales expertas en control de masas físico, derribos y destrucción de escudos." },
    ],
```

- [ ] **Step 8: Hechicero** (`slug: "hechicero"`)

```ts
    subclasses: [
      { name: "Alma del Luxon", blurb: "Curvan la gravedad con cada hechizo e incluso pueden rebobinar su propio turno en el tiempo." },
      { name: "Corazón de Magma", blurb: "Su sangre es lava; sus hechizos de fuego dejan charcos ardientes en el campo de batalla." },
      { name: "Alma Feérica", blurb: "Magos impredecibles que bailan mediante teletransportación y atraviesan las inmunidades mentales del enemigo." },
      { name: "Linaje Radiante", blurb: "Baterías sagradas andantes; ciegan con luz divina e invocan alas de energía purificadora." },
      { name: "Linaje de la Calamidad", blurb: "Radiactivos e inestables, sacrifican su propia vida para maximizar los daños de su magia en ruina." },
    ],
```

- [ ] **Step 9: Mago** (`slug: "mago"`)

```ts
    subclasses: [
      { name: "Tradición del Invocador de Ecos (Nigromante)", blurb: "Levantan los residuos espectrales de las almas en lugar de podrir cadáveres." },
      { name: "Tradición de la Graviturgia", blurb: "Alteran el peso de los objetos, derribando voladores y creando agujeros negros en la arena." },
      { name: "Tradición de la Cronurgia", blurb: "Detienen el tiempo, congelan hechizos en el aire y fuerzan a la realidad a fallar o acertar los dados." },
      { name: "Tradición del Hemomante", blurb: "Usan sus propios Puntos de Golpe como componentes materiales para sobrecargar sus conjuros." },
      { name: "Tradición del Maestro de Sellos", blurb: "Abjuradores tácticos que dibujan glifos explosivos rápidos que detonan al ser pisados." },
    ],
```

- [ ] **Step 10: Monje** (`slug: "monje"`)

```ts
    subclasses: [
      { name: "Camino del Hilo del Destino", blurb: "Artes marciales de la probabilidad; aseguran sus golpes y obligan a los enemigos a fallar en el último segundo." },
      { name: "Camino del Alma de Cobalto", blurb: "Eruditos que golpean puntos de presión para extraer información táctica y secretos del enemigo." },
      { name: "Camino de las Cadenas Rotas", blurb: "Invocan cadenas de ki desde sus muñecas para golpear, derribar y atraer desde lejos." },
      { name: "Camino de los Vientos Cenicientos", blurb: "Monjes Ashari que envuelven sus ráfagas de golpes en fuego y proyectan vientos inbloqueables." },
      { name: "Camino de la Mente Vacía", blurb: "Bloquean su cerebro contra la magia, devolviendo el daño psíquico a quien intente leer su mente." },
    ],
```

- [ ] **Step 11: Paladín** (`slug: "paladin"`)

```ts
    subclasses: [
      { name: "Juramento de la Reclamación", blurb: "Cazatesoros acorazados especializados en desactivar trampas y proteger Vestigios mágicos." },
      { name: "Juramento del Exilio", blurb: "Defensores fronterizos que castigan a las aberraciones e imponen silencio a los viajeros planares." },
      { name: "Juramento de la Luz Primigenia", blurb: "Caballeros drow de la Luz que alteran la gravedad y la inercia con sus ataques castigadores." },
      { name: "Juramento del Alba", blurb: "Templarios del fuego solar, centrados en la erradicación absoluta de muertos vivientes mediante daño radiante masivo." },
      { name: "Juramento de los Grilletes", blurb: "Carceleros arcanos que paralizan a sus enemigos y les impiden teleportarse." },
    ],
```

- [ ] **Step 12: Pícaro** (`slug: "picaro"`)

```ts
    subclasses: [
      { name: "Sombra Dunamántica", blurb: "Cortan la línea temporal para golpear de nuevo a sus enemigos o intercambiar posiciones con sus ecos." },
      { name: "Saqueador Arcano", blurb: "Usan su ataque furtivo para robar espacios de conjuro e interrumpir la magia enemiga en pleno vuelo." },
      { name: "Sindicalista de la Myriad", blurb: "Mafiosos que engañan y obligan a que los enemigos gasten sus reacciones atacándose entre ellos." },
      { name: "Fantasma de las Dunas", blurb: "Asesinos del desierto que se disuelven en arena, ciegan con polvo y encierran a los vivos en sarcófagos." },
      { name: "Asesino de Azuremita", blurb: "Caminan por los techos y convierten todo su daño físico en dolor mental, silenciando los gritos de sus víctimas." },
    ],
```

- [ ] **Step 13: Cazador de Sangre** (`slug: "cazador-de-sangre"`)

```ts
    subclasses: [
      { name: "Orden del Velo Carmesí", blurb: "Gastan su propia salud para crear copias físicas perfectas y hacerse indetectables a la visión verdadera." },
      { name: "Orden del Paraje Marchito", blurb: "Sus espadas inyectan toxinas que ralentizan y sus cuerpos expulsan nubes de esporas necróticas si son atacados." },
      { name: "Orden del Inquisidor", blurb: "Si logran cortar a un mago, el dolor le revienta los canales arcanos causándole daño al intentar lanzar hechizos." },
      { name: "Orden del Mutante", blurb: "Beben inyecciones tóxicas (Mutágenos) para potenciar atributos base a límites sobrehumanos, asumiendo debilidades." },
      { name: "Orden de la Bestia", blurb: "Licántropos controlados mediante magia de sangre; monstruos de combate desarmado cuerpo a cuerpo." },
    ],
```

- [ ] **Step 14: Verificar tipos y build**

Run: `npx tsc --noEmit`
Expected: sin errores.

Run: `npx next build`
Expected: build OK.

- [ ] **Step 15: Verificar que el resto del gate sigue verde**

Run (bash tool): `for f in scripts/check-*.ts; do npx tsx "$f" || echo "FALLO: $f"; done`
Expected: ningún "FALLO". `check-clases.ts` aún NO valida subclases (eso es Task 2), así que pasa igual que antes.

- [ ] **Step 16: Commit**

```bash
git add data/classes.ts
git commit -F - <<'EOF'
feat: rehacer las 65 subclases de las 13 clases

Sustituye las 52 subclases (4/clase) por 65 nuevas (5/clase) de
ambientacion Exandria 2024, solo nombre + blurb. subclassLabel,
pozos y pericias intactos. Sin Artificiero.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

### Task 2: Dientes al gate en `scripts/check-clases.ts`

**Files:**
- Modify: `scripts/check-clases.ts` (import nuevo + bloque de validación)

- [ ] **Step 1: Añadir el import de `CLASSES`**

En la cabecera de imports (junto a los `import` existentes, tras la línea `import { CLASS_MECHANICS } from "../data/classdata";`), añadir:

```ts
import { CLASSES } from "../data/classes";
```

- [ ] **Step 2: Añadir el bloque de validación de subclases**

Insertar este bloque **justo antes** de la línea final `console.log(failures ? ...)`:

```ts
// --- Subclases (data/classes.ts) ---
check("hay 13 clases en CLASSES", CLASSES.length === 13);
for (const c of CLASSES) {
  check(`${c.slug}: exactamente 5 subclases`, c.subclasses.length === 5);
  check(`${c.slug}: subclassLabel no vacío`, c.subclassLabel.trim().length > 0);
  for (const s of c.subclasses) {
    check(`${c.slug} · ${s.name || "(sin nombre)"}: name no vacío`, s.name.trim().length > 0);
    check(`${c.slug} · ${s.name}: blurb no vacío`, s.blurb.trim().length > 0);
  }
}
const totalSubclases = CLASSES.reduce((n, c) => n + c.subclasses.length, 0);
check("65 subclases en total", totalSubclases === 65);
const nombresSub = CLASSES.flatMap((c) => c.subclasses.map((s) => s.name));
check("nombres de subclase únicos globalmente", new Set(nombresSub).size === nombresSub.length);
```

- [ ] **Step 3: Ejecutar el gate — debe pasar sobre el dato nuevo**

Run: `npx tsx scripts/check-clases.ts`
Expected: termina en "Todo en verde", exit 0. Aparecen las líneas `OK` nuevas (`65 subclases en total`, `nombres de subclase únicos globalmente`, etc.).

- [ ] **Step 4: Verificar que los dientes MUERDEN (prueba de mutación, sin commitear)**

Editar temporalmente `data/classes.ts`: borrar una entrada de subclase de cualquier clase (deja 4).

Run: `npx tsx scripts/check-clases.ts`
Expected: FAIL — `FAIL <slug>: exactamente 5 subclases` y `FAIL 65 subclases en total`, exit 1.

Restaurar el archivo:

Run (bash tool): `git checkout -- data/classes.ts`
Luego re-verificar:

Run: `npx tsx scripts/check-clases.ts`
Expected: "Todo en verde" de nuevo.

- [ ] **Step 5: Verificar tipos y el gate completo**

Run: `npx tsc --noEmit`
Expected: sin errores.

Run (bash tool): `for f in scripts/check-*.ts; do npx tsx "$f" || echo "FALLO: $f"; done`
Expected: ningún "FALLO".

- [ ] **Step 6: Commit**

```bash
git add scripts/check-clases.ts
git commit -F - <<'EOF'
test: check-clases valida las subclases

Anade validacion de subclases al gate: 13 clases, exactamente 5
subclases cada una (65 total), nombres unicos globalmente, name y
blurb no vacios, subclassLabel no vacio. Antes el script solo miraba
los pozos mecanicos (CLASS_MECHANICS).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

## Cierre (fuera de las tareas, tras aprobar el merge)

- El usuario ejecuta en Supabase SQL Editor: `delete from public.characters;` (borra las fichas de prueba con subclase vieja).
- Actualizar `HANDOFF.md` y el vault de Obsidian con la tanda.
- Verificación viva en la app (`/crear` → selector de subclase, ficha) — solo la puede hacer el usuario con sesión.
- Merge de `subclases-rehacer` a `master` y push.

---

## Self-Review

- **Cobertura del spec:** los 65 nombres/blurbs (Task 1, steps 1–13) ✓; `subclassLabel` intacto ✓; nombres verbatim incl. `Patrón:`/`Tradición del` y paréntesis ✓; dientes al gate con las 5 comprobaciones del spec (13 clases, 5 c/u, 65 total, únicos, no vacíos + label no vacío) (Task 2) ✓; borrado Supabase (Cierre) ✓; consumidores sin tocar (forma del dato igual) ✓.
- **Placeholders:** ninguno; todo el código va literal.
- **Consistencia de tipos:** se usa `c.subclasses`, `c.subclassLabel`, `s.name`, `s.blurb`, `c.slug` — todos existen en el tipo `CharClass` de `data/classes.ts`. `check(label, cond)` es la firma real del script.
- **Escapes:** el único blurb con comillas dobles (`Colegio de los Ecos`, `"música"`) va con `\"`. Apóstrofos (`Uk'otoa`) van dentro de string con comillas dobles, sin escape.
