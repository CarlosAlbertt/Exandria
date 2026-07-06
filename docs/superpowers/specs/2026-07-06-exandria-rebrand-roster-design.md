# Diseño — Exandria: rebrand + roster de especies + huecos de imagen

Fecha: 2026-07-06
Estado: aprobado para plan de implementación

## Objetivo

Ejecutar el "siguiente pendiente pactado" del `HANDOFF.md`:

1. **Rebranding** del encuadre de la app: de *Tal'Dorei* (un continente) a
   **Exandria** (el mundo). La campaña **sigue ambientada en Tal'Dorei** como
   región de inicio; solo cambia el marco general.
2. **Reencuadrar el lore** de `/reino` al mundo entero.
3. **Remodelar y ampliar** especies (razas), subrazas (linajes) y clases.
4. **Huecos de imagen** para cada especie, linaje y clase en `/crear`
   (placeholders; las imágenes reales se añaden después, como los mapas de
   pueblo).

## Decisiones tomadas (brainstorming)

- **Rebrand = solo texto visible.** No se renombra el archivo `data/taldorei.ts`
  ni la variable `CONTINENT`; solo cambian strings de cara al usuario, `/reino`,
  metadatos y prompts de IA.
- **Especies = alcance máximo:** enriquecer las actuales + completar contenido
  oficial + **añadir el roster regional completo** (~36 especies top-level
  agrupadas por región/continente).
- **Clases:** enriquecer las 12 actuales **y añadir Cazador de Sangre**
  (Blood Hunter, clase de Matt Mercer, propia de Exandria/Critical Role).
- **Huecos de imagen:** en la **tarjeta del grid** (miniatura) **y** en el
  **panel de detalle** (retrato grande), tanto para especies/linajes como para
  clases.
- **UI del roster:** secciones **plegables por región** con cabecera.
- **Origen como dato, campaña abierta:** cada especie lleva su región de origen
  (tag + blurb), pero la app no fuerza un único origen para el grupo; el DM
  decide en mesa.
- **Nombres solo en español** (sin el término inglés entre paréntesis en la UI).
- **Homebrew incluido y marcado:** el roster no oficial (linajes licantrópicos,
  etc.) se incluye con etiqueta **"A criterio del DM"**.

## No-objetivos (YAGNI)

- No renombrar archivos/variables internas (`taldorei.ts`, `CONTINENT`, `pois`…).
- No generar imágenes reales; solo el hueco/placeholder.
- No tocar mecánica de inventario, mapa, narración ni Supabase.
- No añadir clases más allá de Cazador de Sangre.

---

## 1. Rebranding (solo texto visible)

Cambios de string, sin renombrar archivos ni variables:

| Archivo | Cambio |
|---|---|
| `app/layout.tsx` | `title.default`/`template`/`description` → Exandria (mundo), campaña en Tal'Dorei. |
| `components/SiteNav.tsx` | marca / título del sitio → Exandria. |
| `components/SiteFooter.tsx` | textos → Exandria. |
| `components/Emblem.tsx` | rótulo si lo lleva. |
| `app/page.tsx` (home) | titular y copy de portada → mundo de Exandria. |
| `app/login/page.tsx` | copy de bienvenida. |
| `app/reino/page.tsx` | ver §2. |
| `data/loreText.ts` | guía de narración: el mundo es Exandria; campaña en Tal'Dorei. |
| `app/api/ia/route.ts` | prompt de sistema del narrador → Exandria. |
| `README.md`, `HANDOFF.md`, `GUIA-ARRANQUE.md` | título/estado. |

Nota: `admin@taldorei.local` y demás identificadores técnicos **no** cambian.

## 2. `/reino` — de continente a mundo

- Titular `El Reino de Tal'Dorei` → **`El Mundo de Exandria`**.
- Intro a nivel mundo (fuente: nuevo texto de mundo + `data/cosmology.ts` +
  `data/world.ts`, que ya son a nivel mundo). Tal'Dorei pasa a ser **una
  sección/continente** dentro del compendio, no el marco principal.
- Cabeceras `Una historia de Tal'Dorei` → historia de Exandria por eras (ya
  existe `HISTORY`; revisar encuadre). Panteón/calendario/estaciones/lunas/
  planos ya son de Exandria: se mantienen.
- Las regiones de Tal'Dorei (`ReinoRegions`) siguen mostrándose como el
  continente de la campaña.

## 3. Modelo de datos de especies (`data/species.ts`)

Extensión del type `Species`:

```ts
export type RegionKey =
  | "universal" | "taldorei" | "wildemount"
  | "marquet" | "issylra" | "underdark" | "oceans";

export type Species = {
  slug: string;
  name: string;
  region: RegionKey;      // nuevo — para agrupar
  origin: string;         // nuevo — blurb regional (de dónde vienen)
  size: string;
  speed: number;
  traits: string[];
  lineages?: { name: string; perk: string; image?: string; homebrew?: boolean }[];
  tagline: string;
  blurb: string;
  image?: string;         // nuevo — /species/<slug>.jpg
  homebrew?: boolean;     // nuevo — marca "A criterio del DM"
};

export const REGIONS: { key: RegionKey; label: string; blurb: string }[] = [ ... ];
```

- `REGIONS` define etiqueta y orden de las secciones plegables.
- Velocidades/rasgos según **PHB 2024** donde exista versión 2024; si no,
  fuente oficial más reciente (MPMM, MOoT, EGtW, WBtW, Tal'Dorei Reborn).
  Corregir de paso velocidades desactualizadas (p. ej. Mediano/Gnomo a 9 m en
  2024) y anotarlo.
- Descripciones (`blurb`, `origin`, `perk`) = **resúmenes propios**; nombres y
  datos mecánicos = hechos. Herramienta de fans no oficial (ya en convenciones).

### Roster (~36 especies top-level)

Región → especies (linajes entre paréntesis). Notas = rasgos mecánicos clave a
redactar en implementación desde fuente oficial.

**Universales**
| Especie | Tam | Vel | Linajes | Notas |
|---|---|---|---|---|
| Humano | Mediano | 9 | Estándar, Variante | Hábil, Versátil (dote origen), Ingenioso |
| Mediano | Pequeño | 9 | Piesligeros, Fornido | Suerte, Valiente, Agilidad, Sigilo Natural |
| Tiefling | Mediano | 9 | Infernal, Abisal, Ctónico | Visión osc., legado planar |

**Tal'Dorei**
| Especie | Tam | Vel | Linajes | Notas |
|---|---|---|---|---|
| Elfo | Mediano | 9 | Alto, Silvano, Drow | Visión osc., Linaje Feérico, Sentidos, Trance |
| Enano | Mediano | 9 | Colinas, Montañas | Visión osc., Resistencia, Conoc. Piedra, Tenacidad |
| Centauro | Mediano | 12 | — | Carga, Cascos, Complexión Equina, Superviviente |
| Hombre Lagarto | Mediano | 9 (nado 9) | — | Mordisco, Artesano Astuto, Aguantar Aliento, Armadura Natural |
| Hada | Pequeño | 9 (vuelo 9) | — | Magia Feérica, Vuelo |
| Sátiro | Mediano | 10,5 | — | Cornada, Resistencia Mágica, Saltos, Juerguista |
| Hobgoblin | Mediano | 9 | — | Visión osc., Don Feérico, Fortuna de los Muchos |

**Wildemount**
| Especie | Tam | Vel | Linajes | Notas |
|---|---|---|---|---|
| Dracónido | Mediano | 9 | 10 ancestrías (crom./metál.) | Aliento, Resistencia, Vuelo lvl5; castas Draconblood/Ravenite en lore |
| Orco | Mediano | 9 | — | Visión osc. sup., Empuje Adrenalínico, Resistencia Implacable, Complexión Poderosa; Semiorco en lore |
| Gnomo | Pequeño | 9 | Rocas, Bosque | Visión osc., Astucia Gnoma |
| Goblin | Pequeño | 9 | — | Visión osc., Furia de los Pequeños, Linaje Feérico, Escape Ágil |
| Osgo | Mediano | 9 | — | Visión osc., Miembros Largos, Complexión Poderosa, Sigiloso, Ataque Sorpresa |
| Minotauro | Mediano | 9 | — | Cuernos, Embestida, Cornada Aplastante, Presencia Imponente |
| Firbolg | Mediano | 9 | — | Magia Firbolg, Paso Oculto, Complexión Poderosa, Habla con Bestias/Plantas |
| Kenku | Mediano | 9 | — | Falsificación Experta, Mímica/Recuerdo, Adiestramiento |

**Marquet**
| Especie | Tam | Vel | Linajes | Notas |
|---|---|---|---|---|
| Aarakocra | Mediano | 9 (vuelo 15) | — | Garras, Llamada del Viento (racha lvl3) |
| Replicante | Mediano | 9 | — | Cambiaformas, Instintos (pericias) |
| Liebrén | Mediano | 9 | — | Gatillo Rápido (iniciativa), Sentidos, Pies Afortunados, Salto |
| Tabaxi | Mediano | 9 | — | Visión osc., Garras Felinas, Talento, Agilidad Felina |
| Yuan-ti | Mediano | 9 | — | Visión osc., Conjuros Innatos, Resistencia Mágica, Resiliencia al Veneno |

**Issylra / Ashari**
| Especie | Tam | Vel | Linajes | Notas |
|---|---|---|---|---|
| Aasimar | Mediano | 9 | Alas, Resplandor, Sudario | Visión osc., Resist. celestial, Manos Sanadoras, Revelación lvl3 |
| Goliat | Mediano | 10,5 | 6 linajes gigantes | Ancestría Gigante, Forma Grande, Poderoso |
| Genasí | Mediano | 9 | Agua, Fuego, Aire, Tierra | Magia primordial según elemento |

**Underdark / Fronteras Planares**
| Especie | Tam | Vel | Linajes | Notas |
|---|---|---|---|---|
| Duergar | Mediano | 9 | — | Visión osc. sup., Magia Duergar (agrandar/invisibilidad), Fortaleza Psiónica |
| Svirfneblin | Pequeño | 9 | — | Visión osc. sup., Camuflaje, Magia Gnoma |
| Kobold | Pequeño | 9 | — | Visión osc., Grito Dracónico, Legado (astucia/desafío/hechicería), Tácticas de Manada |
| **Sangre Bestial** (homebrew) | Mediano | 9 | Oso, Jabalí, Rata, Tigre, Lobo lunar, Lobo canino | Instinto bestial por linaje; ligado a Cazador de Sangre. **A criterio del DM** |
| Eladrin | Mediano | 9 | Primavera, Verano, Otoño, Invierno | Visión osc., Linaje Feérico, Paso Feérico estacional, Trance |
| Shadar-kai | Mediano | 9 | — | Visión osc., Linaje Feérico, Resist. necrótica, Bendición de la Reina Cuervo |
| Gith | Mediano | 9 | Githyanki, Githzerai | Psiónica según linaje (Mano Mágica + conjuros) |

**Océanos (Lucidian, Ozmit, Los Dientes Destrozados)**
| Especie | Tam | Vel | Linajes | Notas |
|---|---|---|---|---|
| Elfo Marino | Mediano | 9 (nado 9) | — | Visión osc., Linaje Feérico, Hijo del Mar (respira agua), Amigo del Mar, Trance |
| Tritón | Mediano | 9 (nado 9) | — | Anfibio, Control Aire/Agua, Visión osc., Emisario, Guardián (resist. frío) |
| Tortoga | Mediano | 9 | — | Armadura Natural 17, Garras, Aguantar Aliento, Defensa de Caparazón, Instinto |

`getSpecies(slug)` se mantiene.

## 4. Clases (`data/classes.ts`)

- Añadir `image?: string` al type `CharClass`.
- Enriquecer `blurb`/subclases de las 12 actuales (retoque de texto, sin cambiar
  mecánica base ni número de subclases).
- Añadir **Cazador de Sangre** (`slug: "cazador-de-sangre"`):
  - `group`: `"marcial"` (reutiliza acento existente; evita añadir color nuevo).
  - `hitDie`: 10, `primary`: fue o des + int, `saves`: revisar (fuente Blood
    Hunter); `skillCount`: 3.
  - `subclassLabel`: "Orden sanguínea".
  - Subclases (Órdenes): **Orden del Cuervo**, **Orden del Sabueso**,
    **Orden del Jinete Carmesí**, **Orden del Alma Mutante**.
  - Marcar en `blurb` que es clase de Matt Mercer (Exandria).
- `GROUP_ACCENT`/`GROUP_LABEL` sin cambios (reutiliza `marcial`).

## 5. UI `/crear` (`app/crear/page.tsx`)

### Componente nuevo: `components/PortraitFrame.tsx`
- Props: `src?`, `alt`, `size` (`sm` tarjeta / `lg` detalle), `icon?`.
- Si `src` existe y carga → `<img>` enmarcada (estilo pergamino/bronce del tema).
- Si no → placeholder estilizado: marco + icono/inicial + `alt`. Sin romper layout.
- Fallback en `onError` para archivos que aún no existen.

### `StepSpecies`
- Grid actual → **secciones plegables por región** (`REGIONS` da orden/label);
  cabecera con label + blurb de región; contador de especies.
- Cada tarjeta: `PortraitFrame` `sm` + nombre + tag de región + tagline + blurb;
  badge de nº de linajes; badge **"A criterio del DM"** si `homebrew`.
- Panel de detalle (al seleccionar): `PortraitFrame` `lg` + `origin` + rasgos +
  linajes (cada linaje con su `PortraitFrame` `sm` + `perk`; badge homebrew).
- El estado guardado (`species`, `lineage`) y la validación no cambian.

### `StepClass`
- Tarjeta: `PortraitFrame` `sm` + datos actuales.
- Detalle: `PortraitFrame` `lg` + facts + subclases.
- Cazador de Sangre aparece como una clase más.

## 6. Convención de imágenes

- `public/species/<slug>.jpg` — retrato de especie.
- `public/species/lineages/<slug>.jpg` — retrato de linaje (slug del linaje).
- `public/classes/<slug>.jpg` — retrato de clase.
- Ausentes → `PortraitFrame` muestra placeholder. El usuario suelta los `.jpg`
  después (flujo idéntico a `public/maps/pueblos/`). Documentar en README.

## 7. Verificación

- `npx tsc --noEmit` limpio.
- `npm run build` (Next 16 / Turbopack) limpio.
- Verificación visual con preview: `/crear` (secciones plegables, placeholders,
  selección de especie/linaje/clase, validación de pasos intacta), `/reino`
  (encuadre Exandria), navegación y footer.
- Nota: sin credenciales Supabase no se prueba multijugador en vivo (igual que
  la sesión anterior); se verifica con build + preview + análisis.

## 8. Fases sugeridas (para el plan)

1. Rebrand de texto (§1) + `/reino` (§2).
2. `PortraitFrame` + convención de imágenes (§5 componente, §6).
3. Modelo de datos de especies + roster completo (§3).
4. Clases: enriquecer + Cazador de Sangre + `image` (§4).
5. `/crear` UI: secciones plegables + retratos en especies y clases (§5).
6. Verificación (§7) + actualizar `HANDOFF.md`/`README.md`.
</content>
</invoke>
