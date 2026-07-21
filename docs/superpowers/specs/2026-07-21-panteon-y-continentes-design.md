# Diseño — Panteón propio y una página por continente

Fecha: 2026-07-21 · Rama prevista: `panteon-continentes` · **Sin migración.**

## Problema

Dos huecos que el usuario señala tras el rediseño de `/reino`:

1. **El panteón no tiene sitio propio.** Los 32 dioses de `data/pantheon.ts`
   llevan ficha completa (alineamiento, esfera, dominios, símbolo, día santo,
   tres preceptos, blurb) pero hoy solo asoman como tarjetas sueltas dentro del
   saber, gateadas por clase, y sin distinguir de un vistazo quién defendió el
   mundo y quién lo vendió.
2. **El lore de cada continente solo existe dentro de desplegables.** No hay
   ninguna página donde leer «Marquet» de corrido: sus regiones, sus ciudades,
   su gente y su historia juntas.

## Decisiones del usuario

Preguntadas antes de diseñar:

1. **Panteón: abierto del todo.** Los 32 dioses visibles para cualquiera, ficha
   completa. Que los dioses existen y cómo se llaman no es secreto en Exandria.
2. **Continentes: una página por continente bajo `/reino`.** El navbar solo
   crece con «Panteón».
3. **Continentes: geografía abierta, lo demás gateado.** Mapa, regiones,
   ciudades, clima y cultura a la vista; historia profunda, potencias, fe y
   secretos siguen el saber por origen.

**Consecuencia aceptada**: los Dioses Traidores y sus preceptos pasan a ser de
consulta pública. Hoy en `/reino` solo los ven clérigos y paladines. El usuario
lo sabe y lo quiere así.

## Arquitectura

### 1. `/panteon`

**Ruta**: `app/panteon/page.tsx` (servidor, metadata) + `components/panteon/`.

**Navbar**: `BASE_LINKS` de `components/SiteNav.tsx` gana
`{ href: "/panteon", label: "Panteón" }` tras «Reino». Queda en 8 entradas
base; el menú móvil ya itera la misma lista, así que no hace falta tocarlo.

**Datos**: `data/pantheon.ts` tal cual, sin modificar. `PRIME_DEITIES` (12),
`BETRAYER_GODS` (9), `LESSER_IDOLS` (11) — 32 en total.

**Color por bando**, exportado desde el componente que lo usa:

| Bando | Bloque | Color |
|---|---|---|
| `prime` | Deidades Primarias | `var(--color-divino)` |
| `betrayer` | Dioses Traidores | `var(--color-ember)` |
| `idol` | Ídolos Menores | `var(--color-violet)` |

**Componentes**:

- `components/panteon/DeityCard.tsx` — una tarjeta por dios, **plegada** por
  defecto: nombre, epíteto, chapa de alineamiento y esfera. Al desplegarla, la
  ficha entera: dominios, símbolo sagrado, día santo con su fecha, los tres
  preceptos como lista, el blurb, y `patron` cuando es un ídolo.
- `components/panteon/PanteonBrowser.tsx` — cliente y **único con estado**:
  buscador (nombre, epíteto o esfera) y filtro de bando (Todos · Primarias ·
  Traidores · Ídolos). Pinta los tres bloques con su color y su contador.

**Sin ruta por dios.** 32 rutas para un contenido que cabe en una tarjeta
desplegable es coste sin beneficio (YAGNI).

### 2. `/reino/[continente]`

**Ruta**: `app/reino/[continente]/page.tsx`. El slug sale de `slugify` de
`lib/slug.ts` sobre el nombre del continente: `tal-dorei`, `marquet`,
`issylra`, `wildemount`, `dientes-rotos`. Cinco continentes habitados; «Mares»
y «Exandria» no tienen página (el primero no es un continente, el segundo ya
tiene la sección de la Calamidad en `/reino`).

`generateStaticParams` devuelve los cinco slugs. Un slug desconocido llama a
`notFound()`.

**Resolución slug → continente**: helper `continentBySlug(slug)` en
`data/saber.ts`, junto a `PLACES` — es donde vive ya la lista de lugares.
Devuelve `SaberPlace | null`.

**Entrada**: `components/ReinoRegions.tsx` ya lista los continentes filtrados
por la niebla (`useWorldPois`, `revealed`). Cada tarjeta pasa a ser un enlace a
su página. Se respeta la niebla: un jugador solo ve enlazados los continentes
descubiertos. En `/mapa`, el panel lateral de un continente gana el mismo
enlace.

> **Limitación conocida**: la página no bloquea por niebla, solo deja de
> enlazarse. Quien teclee la URL a mano puede abrirla. Se acepta: el contenido
> abierto de esas páginas es geografía, y lo sensible sigue gateado por el saber.

**Contenido**, de arriba abajo:

1. **Cabecera** — icono y color del continente (`PLACE_ICON`/`PLACE_ACCENT`), su
   nombre y el blurb del `WORLD_POI` de tipo `continente`.
2. **Geografía (abierta)** — las regiones del atlas (`useAtlas` → refleja las
   ediciones del DM) con su blurb, y bajo cada una sus POIs **agrupados por
   tipo**: capitales, ciudades, pueblos, fortalezas, ruinas, parajes y peligros.
   Cada POI con su nombre y su blurb.
3. **La tierra y su gente (abierta)** — las entradas de `SABER` de ese `place`
   con `category` ∈ {Geografía, Vida y lenguas}, pintadas **sin candado**.
4. **Lo que hay que ganarse (gateado)** — el resto de categorías (Historia, Fe,
   Potencias, Cosmos, Secretos) con `SaberCategory`, que ya trae candado, motivo,
   contador y los botones de revelar del DM.

**Componentes**:

- `components/reino/ContinentePage.tsx` — cliente, orquesta las cuatro partes,
  carga el `SaberCtx` como hacen `SaberBrowser` y `CalamidadSection`.
- `components/reino/ContinenteGeografia.tsx` — regiones + POIs por tipo desde
  `useAtlas`. Aislado porque es la única parte que depende del atlas.

Las partes 3 y 4 reutilizan `SaberCategory`/`SaberCard` sin tocarlos. La parte 3
les pasa un `ctx` con `isDm: true`… **no**: eso enseñaría los botones de DM a
los jugadores. En su lugar, `SaberCard` recibe ya `open` como prop
independiente de `knows`, así que la parte 3 pinta `SaberCard` directamente con
`open` fijo a `true`, sin pasar por `SaberCategory`.

## Verificación

`scripts/check-lore.ts` se amplía (hoy 55 comprobaciones en verde):

- `continentBySlug` resuelve los cinco slugs esperados y devuelve `null` para uno
  inventado;
- todo continente habitado tiene al menos una entrada de categoría abierta
  (Geografía o Vida y lenguas), para que la sección 3 nunca salga vacía;
- los tres bandos del panteón suman 32 dioses y ningún `slug` repetido;
- todo dios tiene `name`, `epithet`, `province`, `symbol`, al menos un dominio y
  exactamente tres preceptos;
- todo ídolo declara `patron`, salvo el Luxon, que no es un patrón de brujo sino una divinidad sin voluntad.

Gate del proyecto: `tsc --noEmit` + `next build`. Prueba en navegador de
`/panteon` y de una página de continente.

## Fuera de alcance

- Sin migración.
- Sin ruta por dios (`/panteon/[slug]`).
- No se toca `data/pantheon.ts` ni el gateado del panteón dentro de `/reino`:
  ahí las deidades siguen como estaban, por clase de fe. La página nueva es una
  superficie **añadida**, no un reemplazo.
- No se añade un menú de continentes al navbar.
- No se escribe lore nueva: estas páginas presentan la que ya existe.

## Riesgos

- **`useAtlas` en la página de continente**: es un hook de cliente que lee
  Supabase y siembra si falta. Ya se usa en `/mapa` y en el panel del DM, así que
  el patrón está probado; la página será cliente entera bajo un `page.tsx` de
  servidor que solo aporta metadata.
- **Duplicación percibida**: lo que se lee en `/reino/marquet` también aparece en
  el desplegable «Marquet» de `/reino`. Es deliberado — el usuario pidió las
  páginas *aparte de* los desplegables.
