# HANDOFF — Exandria, compañero de campaña D&D

Estado del proyecto para retomar en una sesión nueva sin todo el historial.

## Qué es
App web multijugador en tiempo real para una campaña de **D&D 2024** en el mundo
de **Exandria**, ambientada en el continente de **Tal'Dorei**. Roles **DM**
(admin) y **jugador**.

- Repo: https://github.com/CarlosAlbertt/Exandria (privado, rama `master`)
- Carpeta local: `C:\Users\carlo\Downloads\dnd-campaign-app`
- Desplegado en Vercel: **https://exandria.vercel.app**
- Cuenta DM: usuario `admin` (email `admin@taldorei.local` en Supabase Auth)

## Stack
Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · TypeScript ·
Supabase (Auth + Postgres + Realtime) · IA local con **Ollama** vía túnel
**cloudflared**.

> `AGENTS.md`: este Next 16 tiene cambios rompedores (p. ej. `middleware`→
> `proxy.ts`). Leer `node_modules/next/dist/docs/` ante dudas de API.

## Estructura
- `app/` — páginas: `/` (home), `/reino` (lore), `/crear` (creador de
  personaje), `/inventario`, `/mapa`, `/taberna` (NPC IA), `/narrador`
  (chat IA personal), `/cronica` (diario/misiones/PNJ del grupo), `/login`,
  `/dm` (panel DM).
- `app/dm/` — `DmDashboard.tsx` con pestañas: Narración (`NarracionPanel` +
  `AiConfigPanel`), Grupo (`GrupoPanel`), Baúl (`BaulPanel`), Dados
  (`DadosPanel`: pedir tiradas, iniciativa), Crónica (`CronicaPanel`: diario,
  misiones, PNJ), **Mesa** (`EncuentrosPanel`: calculadora de encuentros +
  notas privadas del DM), **Tiempo** (`RelojPanel`: play/pausa, avance rápido
  de descansos/días, fijar fecha y hora del reloj de campaña), Regiones
  (`RegionesPanel`), Mapa (`MapaPanel`), Usuarios (`UsuariosPanel`).
- `app/api/` — `ia` (proxy a Ollama), `admin/users` (crear usuarios,
  service_role), `dm/character` (el DM edita/entrega en la hoja de cualquier
  jugador: `setLevel`, `addXp`, `addItems`, `addGold`, service_role), `version`
  (commit desplegado).
- `data/` — `species.ts` (10 especies + linajes), `classes.ts` (13 clases ×4
  subclases, incl. Cazador de Sangre), `classdata/` (datos mecánicos 2024 por
  clase: rasgos, tabla de progresión, espacios de conjuro — un archivo por
  clase + `spellSlots.ts`/`types.ts`), `backgrounds.ts` (16), `rules.ts`
  (aptitudes/pericias/point-buy), `leveling.ts` (competencia, PG, ASI, tabla
  XP 2024), `encounters.ts` (presupuesto de XP por dificultad + XP por CR,
  DMG 2024), `taldorei.ts` (regiones+MAPS+REGION_RATIO+lore de Tal'Dorei),
  `pois.ts` (tipo `Poi`/`PoiType` + iconos/colores), `atlas.ts` (semilla del
  **atlas por continente**, ver «Atlas» abajo), `npcs.ts`, `equipment.ts`,
  `equipmentSlots.ts`, `loreText.ts` (guía de narración + lore para la IA).
- `lib/` — `supabase/{client,server,env,proxy-session}.ts`, `auth.ts`,
  `character.ts` (+`useParty`), `derive.ts` (motor de ficha derivada: PG, CA,
  modificadores, salvaciones, pericias — misma fuente de verdad para hoja y
  panel DM), `dice.ts` (tiradas), `gameDate.ts` (festividades por fecha de
  campaña, formato "D de Mes, AAAA PD"), `gameClock.ts` (derivación pura del
  reloj: minuto de juego absoluto ↔ fecha/hora/estación/luna/festividad;
  `momentFromGameMin`/`gameMinFromMoment`), `useGameClock.ts` (hook +
  mutaciones del reloj de campaña, ver «Reloj de campaña» abajo), `slug.ts`
  (`slugify`, módulo neutral sin "use client" para poder importarse desde
  `data/*`), hooks realtime: `useLiveSession`, `useRegions`, `usePois`,
  `useGroupAction`, `useNpcChat`, `useDiceFeed`, `useRollRequests`,
  `useInitiative`, `useChronicle`, `useDmStash`, `useAtlas` (ver «Atlas»
  abajo), `useWorldPois`, `narrador.ts` (cliente `/api/ia`).
- `components/` — SiteNav/Footer, EpicOverlay, GroupConsensus, RegionExplore,
  PinDragMap, RegionCard, Emblem, SessionProvider, ErrorBoundary,
  `ClockWidget` (reloj de campaña: variante compacta en la barra de
  navegación y variante grande en paneles).
- `public/maps/` — `taldorei.jpg` es ahora el **mapa del mundo de Exandria**
  (2560×1707, horizontal; sustituyó al mapa vertical solo-continente).
  `public/maps/pueblos/` — mapas de pueblo (emon, oestruun, piedrablanca,
  riscomartillo, stilben, syngorn), enlazados desde `data/townMaps.ts`.
- `data/world.ts` — pines del **mundo** (continentes, regiones, ciudades) con
  jerarquía continente→región→lugar; `data/cosmology.ts` — calendario,
  estaciones, lunas, planos.
- `lib/useAtlas.ts` — regiones+POIs editables de los **5 continentes
  habitados** (Tal'Dorei, Issylra, Wildemount, Marquet, Dientes Rotos),
  persistidas como **JSON en `app_config`** (sin migración; ver «Atlas»
  abajo). `lib/useWorldPois.ts` sigue vivo pero **acotado**: ya no es
  superficie de edición de POIs (eso vive en el atlas, por región); se
  mantiene solo para los **pines de navegación de continente** en `/mapa`
  (clic para hacer zoom), la **niebla** de continentes no revelados y las
  etiquetas de **Mares** (que no tiene regiones). Ver «Atlas» abajo para el
  detalle de la migración y la limitación conocida del editor DM.
- `supabase/schema*.sql` — migraciones (ver abajo). `schema_v7.sql` (tabla
  `world_poi`) quedó **sin uso**: se optó por `app_config` en su lugar.

## Funcionalidades
- **Auth** por usuario+contraseña (mapeo a email sintético `u@taldorei.local`,
  o email completo si lleva `@`). Sin registro público; el DM crea usuarios.
- **Creador de personaje** (localStorage + Supabase si hay sesión): nombre
  obligatorio, especie+linaje obligatorio, clase+subclase, trasfondo, aptitudes
  (compra de puntos 27 + bonus de trasfondo), pericias, historia/lore (12000
  car.). Pasos bloqueados hasta completar. Subrazas: Elfo3, Dracónido10,
  Goliat6, Tiefling3, Aasimar3, Gnomo2, Enano2·, Humano2·, Mediano2· (·=variante
  clásica 2014 añadida a petición; Orco sin subraza — correcto).
- **Inventario** por huecos = 20 + 2×(mod Fuerza). En Supabase con sesión.
- **Mapa** (`/mapa`) jerárquico: **Exandria → continente → regiones
  explorables**. El mapa mundial solo muestra pines de continentes +
  mares/océanos (`useWorldPois`); clic en un continente hace zoom (CSS) y
  revela **sus regiones** (los 5 continentes habitados tienen regiones desde
  el atlas, no solo Tal'Dorei). Pines de continente **con etiqueta**; el
  resto: clic para ver el detalle en el panel lateral. **Niebla** sobre
  continentes no revelados (opaca para jugadores, translúcida/clic-a-través
  para el DM). Botón **pantalla completa**. Cada región abre su visor de zona
  (`RegionExplore`) con submapa (o marco «Región sin mapa propio» si aún no
  tiene imagen) + POIs revelados uno a uno; algunos POIs (Emon, Syngorn…)
  abren además su **mapa de pueblo** a pantalla completa.
- **Atlas por continente** (`data/atlas.ts` + `lib/useAtlas.ts`, key
  `atlas_defs` en `app_config`): generaliza el modelo antiguo de Tal'Dorei
  (`Region`+`Poi`, ex `useTaldorei` — retirado en la limpieza del
  2026-07-12, sin consumidores) a los 5 continentes habitados. `seedAtlas()`
  arma la semilla la primera vez que falta `atlas_defs`: Tal'Dorei reutiliza
  `data/taldorei.ts`/`data/pois.ts` tal cual; Issylra/Wildemount/Marquet/
  Dientes Rotos se generan a partir de `REGIONS_BY_CONTINENT` +
  `WORLD_POIS` (`data/world.ts`), con slugs de región **únicos
  globalmente** (`uniqueRegionSlug`, prefijo de inicial de continente si
  choca) porque `poi_state`/`region_state` indexan por slug sin distinguir
  continente. Si existían `taldorei_defs` (ediciones viejas) y no
  `atlas_defs`, se preservan al sembrar (no se pierden ediciones previas).
  **Cómo subir un submapa de región**: soltar el `.jpg` en
  `public/maps/<continente>/<slug>.jpg` (p. ej. `public/maps/marquet/
  ank-harel.jpg`) y fijar `image` en la región del atlas. Ahora mismo eso es
  **solo de código/seed**: el editor DM (`app/dm/MapaPanel.tsx`) todavía no
  tiene un campo `image` en el formulario de región, así que para
  Issylra/Marquet/Dientes Rotos hay que añadir la ruta a mano (una tabla
  como `WILDEMOUNT_IMAGES` en `data/atlas.ts`, o parchear el JSON de
  `atlas_defs` directamente en Supabase). **Wildemount ya tiene sus 4
  regiones mapeadas** (`WILDEMOUNT_IMAGES` en `data/atlas.ts`: Imperio
  Dwendaliano→zemni_fields, Xhorhas→xhorhas, Costa del Serrallo→
  menagerie_coast_south, Yermos Grisáceos→greying_wildlands); Issylra,
  Marquet y Los Dientes Rotos van con `image: ""` (fallback «Región sin mapa
  propio», POIs igualmente posicionados por % sobre el marco) hasta que se
  suban y enlacen submapas propios. **Limitación conocida** (detectada en la
  revisión de la Tarea 3): en el editor DM, la superficie de arrastre de
  **regiones** siempre es el mapa del mundo (`taldorei.jpg` recortado por
  continente) y sus pines son % del mapa mundial — correcto. Pero para
  **POIs** de una región sin `image` propia, el fondo de arrastre cae al
  mismo mapa del mundo (sin recortar a esa región), así que no representa
  la región real aunque las coordenadas x/y del POI se guardan bien; solo
  se arregla visualmente subiendo un submapa para esa región. **Pines
  planos (`world_pois`) deprecados como superficie de edición**: los POIs
  ahora se crean y editan por región dentro del atlas; `world_pois` se
  conserva solo para los pines de navegación de continente + niebla +
  etiquetas de Mares en `/mapa` (ver bullet de `useWorldPois` arriba). Los
  pines planos que el DM hubiera creado a mano en `world_pois` **no se
  migran automáticamente** a regiones (fuera de alcance del plan del
  2026-07-11) — hay que recrearlos por región si se quieren conservar.
- **Editor de mapa (Panel DM › Mapa)**: selector de **continente** (Tal'Dorei
  · Issylra · Wildemount · Marquet · Los Dientes Rotos — Mares no tiene
  regiones) + sub-pestañas **Regiones** y **POIs por región**, con CRUD
  completo (añadir/editar/borrar/mover el pin de región sobre el mapa del
  mundo/mover y revelar POIs sobre el submapa de la región) para el
  continente elegido. El modo antiguo de pines planos del mundo (`Todos` /
  `Mares` con CRUD manual) se retiró del editor en la Tarea 3 — esos pines
  ahora solo se leen desde `/mapa` (navegación de continente + niebla +
  Mares), ver «Atlas por continente» arriba. Botón **«Ampliar»** en los
  mapas de arrastre con zoom manual (+/-, rueda, arrastrar) solo para el DM.
  Guardado **optimista** (el cambio se ve al instante, luego persiste).
- **Lore del reino** (`/reino`): historia de Exandria por eras (Fundación →
  Arcanos → Calamidad → Divergencia 0 PD → Reclamación → ~836 PD), continentes
  descubiertos, panteón, facciones, **calendario** (328 días/11 meses/semana
  de 7), **estaciones**, **festividades**, **lunas** (Catha/Ruidus) y
  **planos de existencia**.
- **Narración en vivo (Realtime)**: el DM narra (IA o manual) a **todo el grupo**
  o **visión individual** a un jugador → `EpicOverlay` cinemático.
- **Consenso de grupo (portavoz)**: en narración grupal, un jugador "toma la
  palabra", redacta y envía; el resto ve el borrador y marca "de acuerdo". Envío
  habilitado cuando todos los demás están de acuerdo.
- **Taberna** (`/taberna`): chat de grupo en vivo con la NPC **Garda** por IA.
- **Panel DM › Grupo**: ve las fichas de los jugadores (aptitudes, PG, pericias,
  inventario, historia) en tiempo real.
- **IA** vía `/api/ia` → Ollama. Host resoluble desde `app_config.ollama_host`
  (editable por el DM, sin redeploy) o `OLLAMA_HOST` (env). Modelo por defecto
  `qwen2.5:14b`.
- **Reloj de campaña en tiempo real**: corre solo a razón de **10 min reales =
  1 h de juego**, sincronizado en vivo por Realtime (`app_config.campaign_clock`,
  JSON, sin migración). Widget compacto en `SiteNav` y grande en Panel DM ›
  **Tiempo** (`RelojPanel`: play/pausa, +1 h/descanso corto/largo/+1 día, fijar
  fecha y hora exactas). La Crónica (`/cronica` y Panel DM › Crónica) muestra
  la fecha derivada del reloj en vez de texto libre; `app_config.campaign_date`
  queda **deprecado** (ya no se lee ni se escribe).

## Migraciones Supabase (ejecutar en orden si faltan)
`schema.sql` (profiles, region_state, live_session, is_dm(), RLS, Realtime,
trigger de perfil) · `schema_v2.sql` (target de narración, group_action,
action_ready, npc_chat) · `schema_v3.sql` (pin_x/pin_y, poi_state) ·
`schema_v4.sql` (characters + lore) · `schema_v5.sql` (app_config) ·
`schema_v6.sql` (group_action.speaker) · `schema_v7.sql` (world_poi, sin uso) ·
`schema_v8.sql` (characters: level/gold/asi/equipment/items) · `schema_v9.sql`
(characters.hp_rolls) · `schema_v10.sql` (characters.xp) · `schema_v11.sql`
(dice_rolls, roll_requests, initiative — **PENDIENTE de ejecutar por el
usuario**) · `schema_v12.sql` (journal_entries, quests, npcs_met,
app_config.campaign_date — **PENDIENTE de ejecutar por el usuario**) ·
`schema_v13.sql` (**stat_rolls** — Fase K: tirada única de aptitudes,
inmutable por PK + sin policy de update; solo el DM borra = resetear — **ya
ejecutada** el 2026-07-15) · `schema_v14.sql` (**archivar personaje** — ya ejecutada) ·
`schema_v15.sql` (**tiendas**: shops/shop_items/shop_log — ya ejecutada) ·
`schema_v16.sql` (**PNJs**: location_npcs — ya ejecutada) · `schema_v17.sql`
(**tablón**, Fase F: quests gana el estado `'oferta'` + columnas `poi_name`/
`reward` — **PENDIENTE de ejecutar**) · `schema_v18.sql` (**memoria de NPC**,
Fase M: tabla `npc_memories` — **PENDIENTE de ejecutar**). El bucket de Storage
`assets` (`storage-assets.sql`, Fase H) también ejecutado. **Todo al día a
2026-07-17 salvo `schema_v17.sql` y `schema_v18.sql` (2026-07-19).**

> ⚠️ **`schema_v14` no es como las anteriores.** Todas las demás creaban tablas o
> columnas nuevas y vacías. **Esta reestructura `characters` y `stat_rolls` con
> datos dentro**: mueve la PK de `characters` de `user_id` a `id`, y la de
> `stat_rolls` de `user_id` a `character_id`. Si sale a medias no es «la feature
> nueva no va», es «se han movido las fichas». Va entera en una transacción y es
> idempotente. **El código y la migración tienen que aterrizar juntos**:
> ejecutarla con el código viejo desplegado rompe el guardado de fichas, y
> desplegar el código nuevo sin ejecutarla rompe `/crear` y `/personaje` (piden
> columnas que no existen). Ver el milestone de abajo.

## IA / túnel (ritual tras apagar el PC)
Ver **`GUIA-ARRANQUE.md`**. Resumen: doble clic en
`C:\Users\carlo\Desktop\iniciar-tunel-ia.bat` → copia la URL
`https://….trycloudflare.com` → **Panel DM › Narración › Servidor de IA** →
pegar + Guardar + Probar. (`cloudflared.exe` en `C:\Users\carlo\`.)
Comprobar despliegue: `curl https://exandria.vercel.app/api/version`.

## Env (.env.local / Vercel)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o `_ANON_KEY`),
`SUPABASE_SERVICE_ROLE_KEY` (solo servidor, para crear usuarios), opcional
`OLLAMA_HOST` / `OLLAMA_MODEL`.

## Convenciones
- Commits acaban con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Autor git del repo: `CarlosAlbertt <CarlosAlbertt@users.noreply.github.com>`
  (Vercel bloquea commits con otro email).
- Hooks Realtime usan nombre de canal único por montaje (React remonta 2×).
- Descripciones de reglas/lore son **resúmenes propios**; los datos mecánicos
  y nombres son hechos. Herramienta de fans no oficial.

## RESUELTO (2026-07-19): Fase N (partes 2 y 3) — saber + pistas 🌍
Rama `fase-n-completa`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-19-fase-n-completar*`. **Completa la
Fase N** (con la parte 1 de más abajo). **Sin migración** (todo `app_config` +
la ficha).

- **Saber del mundo por personaje**: sección nueva «Saber del mundo» en `/reino`
  (`components/SaberSection.tsx`, client) sobre un dataset curado por niveles
  (`data/loreTiers.ts`: `tier ∈ comun|erudito|secreto` + `unlockSkill`). **Común**
  para todos; **erudito** si el PJ tiene la pericia (`loadActiveCharacter().skills`
  → Historia/Arcanos/Religión/Naturaleza; si no, tarjeta bloqueada);
  **secreto** revelado por el DM (`app_config.lore_revealed`,
  `lib/useLoreRevealed.ts`, optimista) — los no revelados **no se listan** a los
  jugadores, y el DM revela/oculta **inline**. **No se tocó** la lore estática
  existente de `/reino`. **Diferido**: la **tirada de saber in situ** (dados +
  persistencia por-POI estilo Fase K) — N-tirada.
- **Pistas y rumores**: `app_config.clues` (`lib/useClues.ts`, optimista) —
  `Clue {texto, mision?, lugar?, discovered, rumor}`. El DM las gestiona en la
  sección «Pistas y rumores» de `CronicaPanel` (crear con datalists de
  quests/POIs, revelar/ocultar, borrar). Las **descubiertas** salen en `/cronica`
  (bloque «Pistas»). Las marcadas **rumor** y sin descubrir se **siembran en los
  NPCs IA** de `/lugar` (se añaden al `ambient` de tendero/PNJ, filtradas al POI
  actual o sin lugar); el DM las marca descubiertas a mano.
- Verificado: `tsc --noEmit` + `next build` limpios. **Sin sesión en dev**: no
  probado en vivo. **Prueba del usuario**: en `/reino`, un PJ con Historia ve la
  lore de Historia y el resto bloqueado; el DM revela un secreto y el jugador lo
  ve. Crear una pista, revelarla → sale en `/cronica`; una pista-rumor → un NPC
  IA la deja caer.

## RESUELTO (2026-07-19): Fase N (parte 1) — clima por región y estación 🌦️
Rama `fase-n-clima`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-19-fase-n-clima*`. **Sin migración.**
Alcance acotado a la pieza autocontenida; «saber del mundo por pericia» y
«pistas/rumores» **diferidos**.

- **`lib/weather.ts`** (puro, patrón de `lib/gameClock.ts`): `weatherFor(
  continent, regionSlug, regionName?, moment)` devuelve `{ condition, icon,
  temp }` **determinista** — semilla = hash `regionSlug|year|dayOfYear` (mismo
  clima todo el día de juego, cambia al siguiente). `zoneFor` elige zona
  (`templado|frio|arido|costero|humedo|brumoso`): **mapa explícito** de las 8
  regiones de Tal'Dorei → **heurística por palabras** del slug/nombre
  (montaña→frío, costa→costero, desierto→árido, bosque→húmedo, bruma→brumoso) →
  **por continente** (Marquet árido, Wildemount frío, Dientes Rotos húmedo) →
  templado. Tabla de condiciones por zona×estación (las 4 de `cosmology.ts`).
  `ambientLine` arma una frase de contexto para los NPCs.
- **`/lugar`**: badge de clima bajo la cabecera (icono + condición + temp +
  estación), con `useGameClock`+`momentFromGameMin`.
- **Nav** (`PartyLocationWidget`): icono del clima del lugar del grupo junto al
  📍 (+ tooltip con condición/temp).
- **NPCs IA**: `/lugar` pasa `ambient` (la frase) a `ShopSection` (tendero) y
  `NpcSection` (PNJ), que la añaden al system prompt → los NPCs pueden comentar
  el tiempo. Con el túnel caído no cambia nada (solo es texto en el prompt).
- **Diferido**: **saber del mundo por pericia** (`tier`/`unlockSkill` en la lore
  de `cosmology.ts`/`taldorei.ts` + derivación con `derive` + `/reino` +
  tirada de saber in situ — feature grande, N-saber), **pistas/rumores**
  (`app_config.clues` + siembra en NPCs — N-pistas).
- Verificado: `tsc --noEmit` + `next build` limpios. **Sin sesión en dev**: no
  probado en vivo. **Prueba del usuario**: fijar ubicación del grupo y ver el
  clima en `/lugar` y el icono en el nav; que sea el mismo dentro del día de
  juego y cambie al avanzar el reloj a otro día; que difiera por región (una de
  montaña vs. la costa).

## RESUELTO (2026-07-19): Fase M (partes 2 y 3) — documentos + memoria 🤖
Rama `fase-m-completa`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-19-fase-m-completar*`. **Completa la
Fase M** (con la parte 1 de más abajo). Migración `schema_v18` (memoria).

- **Documentos in-game** (sin migración): `Item.doc?: {titulo,texto,imagen?}` en
  el jsonb de `items` (`lib/character.ts`). El DM adjunta un documento a una
  entrada del **Baúl** (`BaulPanel`, sección plegable + botón «✨ IA» →
  `generarDocumento`) y lo entrega; `/api/dm/character` acepta `doc` en
  `addItems` y **no fusiona** documentos por nombre (cada carta es única). El
  jugador lo abre con **«Leer»** → `DocViewer` (modal pergamino) en
  `CharacterSheet`, también en la hoja de solo-lectura.
- **Memoria de NPC** (`schema_v18`): tabla `npc_memories (npc_ref, user_id,
  summary, updated_at)`, PK compuesta, RLS (jugador la suya, DM todas), realtime.
  `lib/useNpcMemory.ts`. `NpcChat` gana `memoryRef` (`npc:<id>`): carga el
  resumen del jugador y lo **inyecta al system prompt**; al cerrar el chat con
  conversación, la IA lo **resume** (integrando el previo) y lo persiste
  (fire-and-forget en el cleanup del desmontaje). `NpcSection` lo pasa. El DM
  lee/edita/olvida las memorias en el bloque «Memorias» de `NpcsPanel`. El
  tendero (`ShopSection`) aún no lleva memoria (diferido si hace falta).
- Verificado: `tsc --noEmit` + `next build` limpios. **Sin sesión ni túnel en
  dev**: no probado en vivo. **Prueba del usuario** (tras `schema_v18.sql`, con
  Ollama): adjuntar un documento en el Baúl y entregarlo → el jugador lo lee;
  hablar con un PNJ, cerrar, volver → debe recordar; el DM ve la memoria.

## RESUELTO (2026-07-19): Fase M (parte 1) — generadores IA del DM 🤖
Rama `fase-m-generadores-ia`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-19-fase-m-generadores-ia*`. **Sin
migración.** Alcance acotado a la pieza con superficie hoy (los tres formularios
DM + `/api/ia` ya existen); documentos in-game y memoria de NPC **diferidos**.

- **`lib/generar.ts`**: `generarJSON<T>(persona, prompt)` llama a `narrar()`
  (`/api/ia` → Ollama) con un persona que **exige JSON puro en español
  ambientado en Exandria** y **parsea con tolerancia** (quita vallas ```json,
  recorta del primer `{` al último `}`). Propaga `offline` (túnel caído) para
  desactivar los botones. Envoltorios: `generarNpc`→`{name,role,prompt}`,
  `generarTienda`→`{name,greeting,npc_prompt}`, `generarEncargo`→
  `{title,body,reward}`. La `pista` es el texto que el DM ya tenga escrito
  (nombre a medias, «tabernero elfo gruñón»); vacía = la IA inventa de cero.
- **Botón «✨ IA»** en tres formularios: `NpcsPanel` (crea el PNJ ya formado:
  `createNpc`+`updateNpc` con el prompt), `TiendasPanel` (crea la tienda +
  `greeting`/`npc_prompt`; el catálogo sigue en «Semilla»), `CronicaPanel`
  (**rellena** el form de misiones sin escribir en BD y pone estado `oferta` si
  estaba en `activa` → encaja con el tablón de la Fase F). Todos con
  busy/spinner + aviso de error; se desactivan si `offline`.
- **Diferido**: **documentos in-game** (campo `doc` en items + entrega por Baúl
  + visor de pergamino — feature propia, M-docs), **memoria de NPC** (tabla
  `npc_memories`, resumen al cerrar chat + inyección al prompt — **necesita
  migración**, M-memory), y **catálogo de tienda por IA** (ya hay «Semilla»).
- Verificado: `tsc --noEmit` + `next build` limpios. **Sin sesión DM ni túnel en
  dev**: no probado en vivo. **Prueba del usuario** (con Ollama arriba y el túnel
  fijado): pulsar «✨ IA» en cada formulario y ver que rellena/crea con JSON
  coherente; con el túnel caído, el botón se desactiva.

## RESUELTO (2026-07-19): Fase F — tablón de misiones 📜
Rama `fase-f-tablon`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-19-fase-f-tablon*`. Vive en `/lugar`.

- **Migración `schema_v17.sql`**: `quests` (schema_v12) gana el estado
  `'oferta'` (recrea el CHECK de `status`) + columnas `poi_name text` (POI donde
  se publica, casa con `Poi.name`) y `reward text` (recompensa en texto). RLS y
  Realtime sin cambios (la policy de lectura ya dejaba ver todo lo que no es
  `'oculta'`; `quests` ya estaba en la publicación). **PENDIENTE de ejecutar.**
- **UI DM** (`app/dm/CronicaPanel.tsx`): el CRUD de misiones ya existía; se
  amplía con `'oferta'` en `QUEST_LABEL`/`QUEST_COLOR` (el select de estado lo
  recoge solo) + inputs **POI** (con `<datalist>` de todos los POIs del atlas
  vía `useAtlas` → autocompleta exacto, evita typos) y **recompensa**. La lista
  muestra POI + recompensa. Publicar una oferta = misión con estado `'oferta'`.
- **UI jugador** (`components/lugar/TablonSection.tsx`, solo si
  `poi.services.tablon`): lista las quests con `poi_name === poi.name` y
  `status === 'oferta'` (vienen de `useChronicle`, ya realtime) → botón
  **«Aceptar encargo»**. Se retiró la última tarjeta placeholder de
  `ServiceSections.tsx`, que se queda sin cards y **se borra** (ya no se importa
  en `/lugar`).
- **Endpoint `app/api/aceptar-encargo/route.ts`** (`service_role`, patrón de
  `/api/descanso`): la escritura en `quests` es DM-only por RLS, así que el
  jugador acepta por servidor. Valida que sigue en `'oferta'` (anti-abuso: no
  re-aceptar), pasa a `'activa'` y **appendea al body una nota de quién la
  aceptó** (nombre del personaje activo) — cumple «con nota de quién lo aceptó»
  sin columna nueva. Cliente en `lib/encargo.ts` (espejo de `lib/descanso.ts`).
- **`/cronica` no se ensucia**: `CronicaView` ya filtra `status === 'activa'` /
  `completada|fallida`, así que `'oferta'` cae fuera de ambas listas (solo se le
  añadió el badge por completitud del `Record`). Aceptar → aparece como activa.
- **Diferido**: recompensa **mecánica** (oro/XP automáticos al completar; hoy
  `reward` es descriptivo, el DM la entrega a mano), caducidad/límite de ofertas,
  nota automática en el diario más allá del append al body.
- Verificado: `tsc --noEmit` + `next build` limpios (ruta `/api/aceptar-encargo`
  y `/lugar` presentes). **Sin sesión en dev**: no probado en vivo. **Prueba del
  usuario** (tras `schema_v17.sql`): en el POI donde esté el grupo, marcar
  `tablón` en el POI, publicar una oferta con ese POI desde Panel DM › Crónica,
  verla en `/lugar`, Aceptar, y que pase a activa en `/cronica` con la nota.

## RESUELTO (2026-07-17): Fase E — NPCs por ubicación 🗣️
Rama `fase-e-npcs`. Spec en
`docs/superpowers/specs/2026-07-17-fase-e-npcs-design.md`. Vive en `/lugar`.

- **Migración `schema_v16.sql`**: tabla `location_npcs` (poi_name, name, role,
  prompt, public, portrait). RLS: jugadores ven los `public`, el DM todos;
  escritura DM. Realtime. **PENDIENTE de ejecutar por el usuario.**
- **Chat IA reutilizable** `components/lugar/NpcChat.tsx` (`narrar` con persona).
  `lib/useNpcs.ts` (por POI, realtime, CRUD). `/lugar` › «Gente del lugar»
  (`NpcSection`): lista NPCs visibles → chat en personaje. Editor DM: pestaña
  **«PNJs»** (`NpcsPanel`).
- **Diferido**: auto-insert en `npcs_met` (códice), chat grupal en vivo,
  contexto de reloj en el prompt.
- Verificado: `tsc` + `build` limpios. **Prueba del usuario** (tras
  `schema_v16.sql`): crear un NPC en un POI y hablarle desde `/lugar`.

## RESUELTO (2026-07-17): Fase D — posada, descansos que mueven el reloj 🛏️
Rama `fase-d-posada`. Spec en
`docs/superpowers/specs/2026-07-17-fase-d-posada-design.md`. Vive en `/lugar`.
**Sin migración** (usa `app_config` + `characters`).

- **Endpoint `app/api/descanso/route.ts`** (`service_role`, como
  `/api/dm/character`): el descanso del jugador necesita escribir el reloj
  (`app_config.campaign_clock`, RLS DM-only), así que va por servidor. Jugador
  autenticado → cobra el oro de su ficha activa + avanza el reloj (**+1 h corto**
  / **+8 h largo**). **Anti-abuso**: ≥20 h de juego entre descansos largos
  (`app_config.last_long_rest`).
- **Precios FIJOS** (`lib/descanso.ts`): corto 0, cama común 5 po, habitación
  20 po. *Configurable por POI → diferido* (no se tocó el tipo `services.posada`,
  hoy booleano).
- **UI** `components/lugar/PosadaSection.tsx` (solo si `poi.services.posada`):
  botón corto; largo con selector común/habitación + confirmación; muestra y
  actualiza el oro. Se retiró la tarjeta placeholder «Posada» de `ServiceSections`.
- **Diferido**: nota automática en la Crónica ("pasó la noche en…"), reset del
  flag de regateo (Fase C2), restaurar PG actuales (no se trackean aún).
- Verificado: `tsc --noEmit` + `next build` limpios. **Sin sesión en dev**: no
  probado en vivo. **Prueba del usuario**: en un POI con posada, descanso corto
  (avanza 1 h), largo (cobra, avanza 8 h, bloquea el segundo seguido). Necesita
  `SUPABASE_SERVICE_ROLE_KEY` en Vercel (ya está).

## RESUELTO (2026-07-17): Fase C — tiendas con IA 🛒
Rama `fase-c-tiendas`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-17-fase-c-tiendas*`. Vive en `/lugar`
(Fase B). Ejecutado inline.

- **Migración `schema_v15.sql`** (la guía la llamaba v13, ya usada): tablas
  `shops` (poi_name, name, kind, npc_prompt, greeting), `shop_items` (shop_id,
  name, price, stock nullable=∞, notes), `shop_log` (compra/venta, user_id
  `default auth.uid()`). RLS: lectura autenticados; shops/items **crea/borra**
  DM; **update de shop_items autenticados** (el jugador decrementa stock al
  comprar — confianza de mesa); shop_log insert propio. Realtime en shop_items y
  shop_log. **PENDIENTE de ejecutar por el usuario.**
- **Compra/venta contra la ficha real** (`lib/shopTx.ts`): comprar = resta oro +
  añade item (`mergeItem`) + decrementa stock + fila en `shop_log`; vender =
  **mitad** del precio de catálogo (solo objetos que la tienda tiene por nombre).
  Persiste con `saveCharacter` (sesión del jugador, RLS de propietario).
  Validación en cliente (oro/stock), errores en español.
- **Hook** `lib/useShops.ts` (carga por POI + realtime + CRUD del DM +
  `seedCatalog`). Plantillas `data/shopTemplates.ts` (herrería/alquimista/general,
  precios PHB).
- **Editor DM** (`app/dm/TiendasPanel.tsx`, pestaña **«Tiendas»**): selector de
  POI, crear/editar/borrar tienda, catálogo CRUD, botón **«Semilla {kind}»**.
- **`/lugar`** (`components/lugar/ShopSection.tsx`): lista tiendas del POI →
  catálogo (Comprar), Vender, y **chat del tendero IA** (`narrar` con persona =
  prompt + catálogo). Muestra el oro del jugador. La tarjeta placeholder «Tienda»
  de `ServiceSections` se retiró (ahora es real); posada/NPCs/tablón siguen
  placeholder.
- **Diferido (C2/Fase D)**: **regateo** (tirada de Persuasión con dados 3D +
  descuento por tramos + una vez por descanso) — depende del control de descansos.
- Verificado: `tsc --noEmit` + `next build` limpios en cada commit. **Sin sesión
  en dev**: no probado en vivo. **Prueba del usuario** (tras `schema_v15.sql`):
  crear tienda + semilla (DM), comprar/vender desde `/lugar` con un jugador y ver
  oro/inventario/stock cambiar, y el chat del tendero.

## RESUELTO (2026-07-17): Fase B — modo ubicación "Estás en…" 📍
Rama `fase-b-modo-ubicacion`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-17-fase-b-modo-ubicacion*`. Ejecutado con
subagentes (Task 6 docs inline). Base de las fases C–F.

- **Ubicación del grupo**: `app_config.party_location` (JSON
  `{ continent, regionSlug, poiName } | null`, **sin migración**) vía
  `lib/usePartyLocation.ts` (**mutación optimista** — `app_config` no dispara
  realtime, ver memoria del proyecto).
- **El DM la fija** desde el editor de mapa (Panel DM › Mapa › POIs por región):
  botón **"El grupo está aquí"** por POI (resalta el actual) + botón global
  **"El grupo viaja"** (limpia). Guardado optimista.
- **Widget en nav** (`PartyLocationWidget`, junto al reloj): "📍 {poiName}" →
  `/lugar`; invisible si no hay ubicación.
- **Página `/lugar`** (player+DM, sin gate): cabecera del POI (nombre/tipo/blurb
  del atlas) + imagen del pueblo si `townMap(poiName)` + **secciones de
  servicio**. Sin ubicación o POI no hallado → **"De camino…"** con la región y
  el reloj.
- **`Poi.services?`** (`{ tienda?: string[]; posada?: boolean; npcs?: string[];
  tablon?: boolean }`, opcional, sin migración) editable en el form de POI del
  DM (checkboxes posada/tablón, ids coma-separados tienda/npcs). Las **secciones
  de servicio** en `/lugar` (`components/lugar/ServiceSections.tsx`) son
  **placeholders "Próximamente (Fase C/D/E/F)"** — cada fase C–F sustituye el
  cuerpo de su tarjeta sin tocar el resto.
- **Fuera de alcance**: la funcionalidad real de tienda/posada/NPC/tablón (fases
  C–F). B deja el hueco montado.
- Verificado: `tsc --noEmit` + `next build` limpios en cada commit (5 tareas de
  código); `/lugar` en la tabla de rutas. **Sin sesión en dev**: no se probó en
  vivo (superficies DM y `/lugar` redirigen a `/login` sin sesión). **Prueba del
  usuario**: fijar ubicación en un POI, ver el widget y `/lugar` con cabecera +
  mapa de pueblo, marcar servicios y ver las tarjetas placeholder, "El grupo
  viaja" → "De camino…". Sin migración.

## RESUELTO (2026-07-17): Fase H — subida de imágenes (Storage) 🖼️
Rama `fase-h-subida-imagenes`. Spec en
`docs/superpowers/specs/2026-07-17-fase-h-subida-imagenes-design.md`; plan en
`docs/superpowers/plans/2026-07-17-fase-h-subida-imagenes.md`. Alcance: "Fase H
entera" acotada a lo que tiene superficie hoy (NPC/battlemaps/tokens diferidos a
sus fases E/I).

- **Infra**: `lib/storage.ts` (`uploadImage(folder, filename, file, maxWidth)`:
  resize/compresión canvas → JPEG 0.85 → sube a bucket `assets` con `upsert` →
  URL pública con cache-bust) + `components/ImageUpload.tsx` genérico (preview,
  subida, **fallback a URL manual** si Storage no configurado).
- **Integraciones (4)**: (1) campo de **submapa** en el editor de región
  (`MapaPanel`, folder `maps/`) → cierra el hueco Issylra/Marquet/Dientes Rotos;
  (2) pestaña DM **«Arte»** (`ArtePanel`) para **retratos de especie/linaje/
  clase** → override en `app_config.art_overrides` (`useArt`+`artSrc`), leído por
  el creador (`SpeciesScene`/`ClassScene`); (3) **mapas de pueblo data-driven**
  (`useTownMaps`, `app_config.town_maps`, sección en «Arte») — `TOWN_MAPS` queda
  como defaults; (4) **arte de monstruo** en el formulario del bestiario
  (reutiliza `Monster.image`, ya reservado; se guarda en `custom_monsters` y se
  pinta en el statblock).
- **Sin migración de tablas**; los overrides van en `app_config` (realtime,
  patrón `useDmStash`). **Paso manual pendiente del usuario**: ejecutar
  `supabase/storage-assets.sql` (crea bucket público `assets` + policies de
  escritura solo DM vía `is_dm()`). Sin él, la subida cae al **fallback de URL
  manual** (no rompe nada).
- Verificado: `tsc --noEmit` + `next build` + `check-bestiary` limpios en cada
  commit (7 tareas). **NADA probado contra Storage/BD** (sin bucket ni sesión DM
  en dev; las superficies DM/`/crear` redirigen a `/login` sin sesión). **Prueba
  en vivo del usuario**: tras crear el bucket, subir un submapa a una región de
  Marquet y verlo en `/mapa`; subir un retrato de especie y verlo en `/crear`;
  subir arte a un monstruo custom; añadir un mapa de pueblo.

## RESUELTO (2026-07-17): Fase L — control de acceso por rol 🔒
Rama `fase-l-acceso-por-rol`. Spec en
`docs/superpowers/specs/2026-07-17-fase-l-acceso-por-rol-design.md`; plan en
`docs/superpowers/plans/2026-07-17-fase-l-acceso-por-rol.md`. Ejecutado con
subagentes (implementador + revisor spec + revisor calidad por tarea).

- **`/narrador` pasa a DM-only** con gate de **servidor** (no ocultar botones):
  `app/narrador/page.tsx` se parte en server component (`getSessionProfile()` →
  sin perfil `redirect("/login")`, `role !== "dm"` `redirect("/")`) +
  `app/narrador/NarradorClient.tsx` (el chat cliente, lógica intacta). Mismo
  patrón que `/dm` → `DmDashboard`. Era un narrador IA personal del jugador; se
  cierra por decisión del usuario — su chat IA sigue en la **Taberna**.
- **`SiteNav`**: `/narrador` sale de `BASE_LINKS` y entra en `DM_LINKS` junto a
  `/dm`; el jugador no ve ninguno de los dos (desktop y móvil derivan del mismo
  array `links`). Ocultar es cosmético; la garantía es el redirect de servidor.
- **Auditoría de superficies** (tabla en la spec, regla nueva: toda ruta declara
  su rol): el resto ya estaba gateado (`/dm`, `/api/dm/character`,
  `/api/admin/users`) — sin cambio de código. **`/api/ia` se queda autenticado**
  (Taberna/NPCs lo usan; cerrarlo los rompería). RLS sin tocar; `dm_notes`
  legible por consola sigue aceptado.
- Verificado: `tsc --noEmit` + `next build` limpios (`/narrador` es ruta
  dinámica `ƒ`); dos revisiones por tarea; y en navegador **anon en `/narrador`
  redirige a `/login`** (dev server). Sin migración.

> **PENDIENTE de prueba del usuario** (necesita sesión, sin credenciales en dev):
> **jugador logueado** que navegue a `/narrador` debe redirigir a `/`, y su nav
> no debe mostrar "Narrador"; el **DM** sí lo ve y entra.

## RESUELTO ESTA SESIÓN (2026-07-02 → 2026-07-03)
1. **Botón "Terminar" del DM**: el bug real era que `EpicOverlay` se monta a
   pantalla completa y tapaba el botón "Terminar" del panel (inalcanzable). El
   botón que sí se podía pulsar ("Cerrar para todos") no limpiaba nada. Fix:
   ese botón (renombrado **"Terminar escena"**) ahora hace
   `epic_mode:false + narrator_typing:false + resetGroup()`.
2. **Recuadro de votación lento**: era el efecto de máquina de escribir de
   `EpicOverlay`, no el textarea (el fix de `localDraft` con debounce ya
   estaba bien). Acelerado el intervalo.
3. **Mapa "MAPA"**: se sustituyó el mapa vertical (solo Tal'Dorei) por el
   **mapa del mundo de Exandria** horizontal, con navegación jerárquica,
   niebla, zoom y pantalla completa.
4. **Lore ampliada**: calendario, estaciones, festividades, lunas, planos y
   una historia de Exandria datada por eras (ver `data/cosmology.ts`).
5. **Editor de mapa completo**: todos los pines del mundo y las regiones/POIs
   de Tal'Dorei son ahora editables por el DM (CRUD), sin necesidad de
   migraciones (se guardan como JSON en `app_config`). Se corrigió un bug por
   el que un pin arrastrado "volvía" a su sitio (faltaba actualización
   optimista, ya que `app_config` no tiene Realtime).
6. Añadidos lugares que faltaban en la lore: Hupperdook, Shadycreek Run
   (Wildemount), Jrusar (Marquet), Deastok, Terrah, Zephrah, Vesrah
   (los 4 enclaves Ashari: Pyrah=fuego, Terrah=tierra, Zephrah=aire,
   Vesrah=agua).

## PENDIENTE / A VIGILAR
- **Posiciones de pines del mundo se reiniciaron**: al mover el almacén de
  pines del mundo de la tabla `world_poi` (schema_v7, sin uso ahora) a
  `app_config`, las posiciones/revelados que ya hubieras ajustado en `world_poi`
  no se migraron. Los pines del mundo parten de los valores por defecto del
  código; hay que **recolocarlos y revelarlos de nuevo** desde Panel DM ›
  Mapa (ya persiste bien tras el fix del bug #5).
- **Sin probar en vivo con 2 jugadores reales** ninguno de los cambios de esta
  sesión (no había credenciales Supabase en el entorno de desarrollo; todo se
  verificó con `tsc --noEmit` + `next build` limpios, y análisis de código).
  Falta la prueba real: Terminar escena, consenso de grupo, mapa jerárquico,
  editor de pines, niebla.
- **`data/pois.ts` / `data/taldorei.ts`** siguen existiendo como *valores por
  defecto* pero la fuente de verdad en producción, una vez editado algo, es
  `app_config` (`taldorei_defs`). Si se quiere "resetear" Tal'Dorei a los
  defaults del código, borrar esa key en `app_config`.

## RESUELTO (2026-07-17): Archivar personaje 📦
Trabajo directo en `master`. Diseño en
`docs/superpowers/specs/2026-07-17-archivar-personaje-design.md`; plan en
`docs/superpowers/plans/2026-07-17-archivar-personaje.md`. Ejecutado con
subagentes (implementador + revisor por tarea).

> ⚠️ **PENDIENTE del usuario: ejecutar `supabase/schema_v14.sql`.** Sin ella,
> `/crear` y `/personaje` **no funcionan** (piden columnas que no existen).

**Qué es**: el jugador **retira** su personaje (deja de jugarlo; lo ve en gris en
`/personaje`). No se borra. El **DM lo conserva**, puede **devolverlo a juego** o
**borrarlo de verdad** para hacer sitio.

**Modelo nuevo**: `characters` pasa de una fila por jugador (`user_id` era PK) a
**varias** — `id` PK, `user_id` FK, `archived_at IS NULL` = en juego. **Uno
activo, máximo 3 por jugador** (1 activo + 2 archivados).

**Las tres garantías están en la BD, no en el cliente**:
- **Uno activo** → índice único **parcial**: `characters (user_id) where archived_at is null`.
- **Máximo 3** → trigger `guard_limite_personajes` (`before insert`).
- **Solo el DM desarchiva** → trigger `guard_desarchivar`, **no RLS**: `with
  check` **no ve el valor viejo**, así que la RLS no puede distinguir archivar de
  desarchivar. El jugador hace el viaje de ida; la vuelta, solo el DM. Además el
  `delete` pasa a `using (public.is_dm())` (la policy `for all` de v4 se parte).

**⚠️ La trampa que casi nos come, anotada para que no se repita**: restaurar y
borrar **NO van por `/api/dm/character`** con `service_role`. `service_role` salta
la RLS **pero no los triggers** (disparan con cualquier rol), y sin JWT
`auth.uid()` es `null` → `is_dm()` da `false` → `guard_desarchivar` **rechazaría
al propio DM**. Van con la **sesión del DM** desde `GrupoPanel`, como
«Resetear aptitudes», que ya funciona así porque la RLS lo cubre.

**El flujo**: `/crear` **edita tu activo**. Para hacerte otro, primero lo
**archivas** desde `/personaje`; entonces `/crear` no encuentra activo y **crea
uno** al primer guardado (antes lo creaba solo el `upsert`). Con 3 y ninguno
activo, `/crear` **bloquea al entrar** y el DM tiene que borrar uno.

**`stat_rolls` pasa a `character_id` como PK**: **nuevo personaje, nueva tirada**.
Esto **relaja la Fase K a propósito** — decisión explícita del usuario. La Fase K
(2026-07-15) impedía repetir tirada con bloqueo de servidor; ahora el camino para
repetir es *archivar → crear otro → tirar*. Está **acotado**: son **3 tiradas por
jugador** y luego hace falta que el DM borre un archivado. Pero **el freno deja de
ser el servidor y pasa a ser el DM**. Mesa de amigos; no es un descuido.

**Archivos**: `lib/archive.ts` (reglas puras + `scripts/check-archive.ts`),
`lib/character.ts` (`loadActiveCharacter`/`listCharacters`/`createCharacter`/
`saveCharacter(id)`/`archiveCharacter`; **`saveCharacter` ya no es un upsert por
`user_id`** porque el índice único nuevo es **parcial** y no sirve como target de
conflicto), `app/crear/page.tsx`, `components/CharacterSheet.tsx`,
`app/dm/GrupoPanel.tsx`, `app/api/dm/character/route.ts`.

**Tres bugs que cazaron las revisiones y que compilaban sin rechistar** (ninguno
lo habrían visto `tsc` ni `build`):
1. **La API del DM le daba el XP a los 3 personajes**: `update .eq("user_id")`
   sin filtrar; y su `maybeSingle()` habría reventado en cuanto alguien
   archivara. Acotado al activo.
2. **El botón de retirar, invisible**: se iba a condicionar a `!readOnly`, pero
   **la ficha propia de un jugador ES `readOnly`** (bloqueo del DM de
   2026-07-07). Va bajo `saveMode === "self"`, como `canRollHp`.
3. **Bloqueo mutuo DM/jugador**: `useParty` solo trae activos, así que un jugador
   que archivara su único personaje **desaparecía del Panel DM** — y el DM no
   podía devolvérselo ni borrárselo; si además tenía 3, `/crear` le mandaba pedir
   sitio al DM y el DM no lo veía. Arreglado con el bloque **«Jugadores sin
   personaje en juego»**, y también el early-return de «Aún no hay fichas», que
   tapaba el panel entero en campañas de un solo jugador.

**Limitación conocida**: el trigger del límite tiene una **race** teórica (dos
inserts simultáneos podrían colar un 4º personaje). Se arreglaría con
`pg_advisory_xact_lock`; se dejó fuera por sobre-ingeniería — exige dos pestañas
creando personaje en el mismo milisegundo, y el daño es una fila de más.

- Verificado: `tsc`, `build` y los 4 `check-*` limpios en cada commit; dos
  revisiones por tarea; y las 12 consultas a `characters` repasadas una por una
  (cada una filtra `archived_at`, va por `id`, o es la lista de archivados del
  DM). **NADA se ha probado contra la BD**: no hay credenciales en desarrollo y
  la migración no está ejecutada. Esta feature es casi toda base de datos, así
  que es más ciego de lo habitual. **Solo el usuario puede probar**: archivar, el
  límite de 3, devolver a juego, borrar, y que el XP del DM solo le llegue al
  activo.

## RESUELTO (2026-07-16): Creador — una escena por paso 🎬
Trabajo directo en `master`. Diseño en
`docs/superpowers/specs/2026-07-16-crear-escenas-por-paso-design.md`;
plan en `docs/superpowers/plans/2026-07-16-crear-escenas-por-paso.md`.
Ejecutado con subagentes (implementador + revisor de spec + revisor de calidad
por tarea).

> **El círculo de invocación se RETIRÓ.** El milestone de abajo (2026-07-15)
> describe una UI que ya no existe: se conserva por historia, no como
> referencia. `InvocationCircle.tsx`, `Medallion.tsx` y `DetailPanel.tsx`
> están borrados.

**El problema** (medido en el navegador a 1280px): la página topaba en 1152px;
el círculo medía 300px perdido en una columna de 824px mientras el carril se
ahogaba a 280px; y los **pasos 3–5 se renderizaban dentro de ese carril**, así
que las tres tarjetas de método del paso Aptitudes medían **75px de ancho por
425 de alto**, con los títulos partidos en 2–3 líneas. `min(74vw, 300px)` topa
en 300px desde vw≥405: el círculo no crecía por mucha pantalla que hubiera.

**Falso positivo descartado**: las runas **no** estaban mal colocadas ni
recortadas. Medido a 375, 900 y 1280px, `--r: min(37vw,150px)` era exactamente
la mitad de `min(74vw,300px)`, así que caían siempre sobre el aro. Lo que se
percibía como «cortada» era que cada runa estaba centrada en la línea del aro y
la mitad sobresalía del disco.

**Qué hay ahora**: cada paso es su propia escena a pantalla completa
(`max-w-[1600px]`), y la navegación es una **barra de runas** (`RuneBar`) con el
**mismo gate** de siempre.
- `components/crear/RuneBar.tsx` — las 6 runas: encendida = completo, resaltada
  = actual, apagada + `disabled` = no alcanzable (`maxStep`). Ahora el nombre
  del paso es **texto visible**, no un `title` oculto; por eso el último paso
  pasó de «Resumen» a **«Ficha»** (su nombre en el resto del proyecto).
- `components/crear/ArtPanel.tsx` — retrato vertical de **260px**
  (`aspect-ratio: 659/1025`, el tamaño real del arte de clase) o **silueta**
  rúnica. Sustituye al medallón de 168px recortado en círculo.
- `steps/SpeciesScene.tsx` — acordeón por región (más grande: filas de 38px,
  nombre a 14px) | retrato | detalle con origen, tamaño, velocidad, rasgos y el
  **linaje** como sub-elección.
- `steps/ClassScene.tsx` — **flechas** ◀ ▶ (una clase cada vez, arte grande) +
  **tira de las 13** miniaturas para saltar y ver cuánto queda. Sin acordeón ni
  buscador aquí. Recorre por grupo (Marcial · Arcano · Divino · Primigenio).
  **Ojo**: hojear con las flechas **compromete la elección** (`onPick` =
  `pickClass`, que limpia subclase y pericias) — es el comportamiento deseado.
- `steps/BackgroundScene.tsx` — lista + detalle en dos bloques. **Sin arte**:
  `backgrounds.ts` no tiene campo `image` ni está previsto.
- `steps/SkillsScene.tsx` y `steps/SummaryScene.tsx` — salieron de `page.tsx` a
  archivos propios. Pericias en dos bloques; la Ficha enseña héroe e historia en
  paralelo. `page.tsx` baja de ~575 a ~350 líneas: solo estado, validación, gate
  y guardado.
- El tipo **`Build` vive ahora en `lib/character.ts`** (es el borrador en curso;
  `CharacterData` es la ficha guardada). No en `page.tsx`: importar tipos desde
  `app/` invertía la dirección de dependencia y no tenía precedente en el repo.
- Limpieza: `abbrOf()` sube a `data/rules.ts` (estaba duplicada); se borra
  `RailOption.children` + `.rail-nest` (la sub-elección anidada en el carril,
  sin productor desde que linaje y subclase viven en el detalle de su escena).

**Bug arreglado — «error al crear otro personaje»**: `reset()` («Empezar de
nuevo») ponía `statMethod: null` **solo en cliente**; la fila de `stat_rolls`
seguía en la BD, el selector reaparecía y el `insert` chocaba con la PK,
soltando el texto crudo de Postgres (`duplicate key value violates unique
constraint "stat_rolls_pkey"`). Con 4d6 era peor: se lanzaban los **seis dados
antes** del insert.
- **El bloqueo del servidor es correcto y no se tocó** (PK + sin policy de
  UPDATE). Lo que fallaba era el cliente.
- Ahora `reset()` **conserva** `statMethod` y `rolled`: rehaces el personaje,
  no la tirada — *la tirada es del jugador, no del personaje*. `pickDados`
  **comprueba** `loadStatRoll` antes de tirar (cortesía; la garantía sigue
  siendo la PK), y cualquier error de la BD se **traduce** al español.
- **`assign` no se persiste**: se **deriva de `base`** con `deriveAssign`
  (`lib/statRolls.ts`, verificada por `check-statrolls.ts`). Antes, al volver a
  `/crear` con una tirada hecha, `assign` vacío hacía `stepDone[3]` falso y el
  gate te obligaba a reasignar los 6 valores **siempre**. Sin migración.

**Arte**: `public/classes/` sigue con **11 de 13** (faltan `bardo.jpg` y
`paladin.jpg`) y `public/species/` sigue **vacío** → silueta. A 260px canta
mucho más que en la miniatura de 30px de antes. Formato: vertical ~659×1025,
<32 KB, en `public/species/<slug>.jpg` y `public/species/lineages/<slug>.jpg`.

- Verificado: `tsc`, `build` y los 3 `check-*` limpios en **cada** commit; dos
  revisiones (spec + calidad) por tarea; **y prueba real en el navegador**
  (excluyendo `crear` del matcher del proxy temporalmente, ya revertido).
  Medido a 1280px, antes → después:

  | | Antes | Ahora |
  |---|---|---|
  | Tarjeta de método (ancho) | 75px | **328px** |
  | Tarjeta de método (alto) | 425px | **175px** |
  | Líneas del título | 2 y 3 | **1** |
  | Alto de la descripción | 180–200px | **40px** |

  Comprobado además: 6 runas con los labels correctos (**«Ficha»**, no
  «Resumen»), el **gate intacto** (entrando de cero solo la 1ª activa), **cero
  rastro** de `.crear-grid`/`.inv-circle`/`.medallion`, sin scroll horizontal, y
  en el paso Clase el **arte real de Clérigo carga** (`659×1025` en panel de
  260×452), 2 flechas, **tira de 13 sin ninguna rota**, siluetas exactamente en
  **Bardo y Paladín**, 4 dominios y el `aria-live` anunciando la clase. Pulsar ▶
  pasa de Clérigo (9/13) a Paladín (10/13) actualizando arte, anuncio y
  miniatura activa. **Confirmado funcionando por el usuario** (2026-07-17).
  Sin migración.

  > **Ojo al verificar `/crear` en el futuro**: el dev server debe arrancarse
  > **después** de excluir `crear` del matcher de `proxy.ts`. Si se edita el
  > proxy con el servidor ya en marcha, no lo recoge y `/crear` sigue
  > redirigiendo a `/login`.

## RESUELTO (2026-07-15): Creador — Círculo de invocación + Fase K 🔮
> ⚠️ **Histórico**: el círculo se retiró el 2026-07-16 (ver arriba). Esta
> sección describe la UI anterior.

Trabajo directo en `master`. Diseño en
`docs/superpowers/specs/2026-07-15-creador-circulo-invocacion-design.md`;
plan en `docs/superpowers/plans/2026-07-15-creador-circulo-invocacion.md`.
Ejecutado con subagentes (implementador + revisor por tarea).

- **El tomo (`CharacterBook.tsx`) se retiró**: `/crear` es ahora un **círculo
  de invocación**. `components/crear/`:
  - `InvocationCircle.tsx` — dos aros + **6 runas = los pasos**: encendida =
    completo, resaltada = actual, apagada/deshabilitada = aún no alcanzable
    (respeta el gate de `stepDone`/`maxStep`). No hay barra de progreso.
  - `Medallion.tsx` — **arte real si existe, silueta rúnica generativa si no**
    (nunca un hueco vacío). Resetea el fallo de carga al cambiar `src`.
  - `OptionRail.tsx` — carril de opciones con miniatura + nombre + subtítulo,
    en **acordeón**: las 36 especies se pliegan por **región** (7 grupos con
    recuento, **una abierta a la vez**, y se **auto-abre** la de la especie
    elegida) y las 13 clases por **grupo** (Marcial/Arcano/Divino/Primigenio;
    `CLASSES` se ordena por grupo porque el carril agrupa runs consecutivos).
    **Buscador** arriba que filtra por nombre entre TODAS (sin acentos) y
    muestra resultados planos. La **sub-elección va anidada bajo la opción
    seleccionada** (`RailOption.children`): el **linaje** bajo su especie y la
    **subclase** bajo su clase — antes se renderizaban al final de la lista y
    había que pasar las 36 especies para verlos.
  - `DetailPanel.tsx` — **detalle bajo el círculo** (blurb, origen, rasgos,
    dado de golpe, etc.). Se añadió tras detectar que el rediseño se había
    dejado fuera el texto necesario para poder elegir con criterio.
  - `steps/AbilitiesStep.tsx` — el paso de Aptitudes (Fase K).
- **Fase K — aptitudes de tirada única** (`supabase/schema_v13.sql`, **ya
  ejecutada** por el usuario): el jugador elige **una vez** entre **4d6**
  (con los dados 3D de la Fase A; el jugador lanza, estilo BG3), **array
  estándar** (15/14/13/12/10/8) o **point-buy 27**. `lib/statRolls.ts`
  (`dropLowest`, `STANDARD_ARRAY`, `Assign`/`ASSIGN_EMPTY`,
  `isAssignComplete`, `loadStatRoll`, `saveStatRoll`), verificado por
  `scripts/check-statrolls.ts`.
  - **Bloqueo real**: `stat_rolls` tiene `user_id` como **PK** (una fila = una
    tirada) y **sin policy de UPDATE** (con RLS, sin policy = denegado) → no se
    puede repetir la tirada. **Solo el DM borra** (`is_dm()`) = **resetear**:
    botón «Resetear aptitudes» por jugador en **Panel DM › Grupo** (sin
    endpoint: la RLS ya lo cubre).
  - **Sin sesión** (modo localStorage): solo array/point-buy — los dados
    exigen sesión para poder bloquearse.
  - *Modelo de confianza*: los dados ruedan en cliente y el cliente inserta,
    así que alguien con consola podría falsear UNA inserción (como las tiendas
    autoservicio); lo que el sistema garantiza es que **no hay repetición**.
- **Decisión clave**: `base` (`Record<AbilityKey, number>`) **sigue siendo la
  fuente de verdad** de las puntuaciones; dados/array solo cambian **cómo** se
  rellena (asignando por índice, porque los valores pueden repetirse). Por eso
  `finalScores`, `saveCharacter` y la hoja **no se tocaron**.
- **Arte**: `public/classes/` tiene **11 de 13** (faltan `bardo.jpg` y
  `paladin.jpg` → caen a la silueta, es lo esperado); `public/species/` sigue
  **vacío** (las 36 especies van con silueta). En cuanto se suelte un `.jpg`
  aparece solo; con la **Fase H** admitirá URLs de Storage.
- Verificado: `tsc`, `build` y los 3 `check-*` limpios **+ prueba real en el
  navegador** (excluyendo `crear` del matcher del proxy temporalmente, ya
  revertido): rejilla 2 columnas, 6 runas con el gate correcto (solo la 1ª
  activa al entrar), 36 especies en 7 grupos regionales, medallón con silueta,
  y en el paso Clase **`/classes/mago.jpg` carga de verdad** (698px) junto con
  las 11 miniaturas existentes. **Pendiente de prueba en vivo del usuario**: el
  paso de dados (4d6 ×6 con el overlay BG3) y el reset del DM.

## RESUELTO (2026-07-15): Fase A — Dados 3D con física 🎲
Trabajo directo en `master`. Plan en
`docs/superpowers/plans/2026-07-13-fase-a-dados-3d.md`; spec en la guía
`docs/superpowers/specs/2026-07-12-campana-semivirtual-guia.md` (§Fase A).
Ejecutado con subagentes (implementador + revisor por tarea).

- **Dependencia nueva**: `@3d-dice/dice-box` (WebGL/BabylonJS + física). Assets
  **commiteados** en `public/dice-box/assets/` (copiados por
  `scripts/copy-dice-assets.mjs`, que corre en `postinstall` — para builds
  fiables en Vercel y offline). El postinstall propio del paquete deja un
  duplicado en `public/assets/` → **ignorado** en `.gitignore`.
- **`lib/diceBox.ts`** (singleton imperativo, no-hook): `initDiceBox(selector)`,
  `rollVisual(formula, opts)`, `isDiceBoxSupported()` (SSR/WebGL/
  `prefers-reduced-motion`), color de dado y sonido en localStorage
  (`getDiceColor`/`setDiceColor`, `getDiceSound`/`setDiceSound`; clac de
  colisión con WebAudio). Sin tipos propios del paquete →
  `types/dice-box.d.ts`.
- **`components/DiceBoard.tsx`**: **overlay de tirada estilo Baldur's Gate**,
  on-demand (montado en `app/layout.tsx` dentro de `SessionProvider`, z 80 <
  EpicOverlay z-100). Aparece SOLO cuando hace falta una tirada: un **d20
  grande centrado** + "Pulsa para tirar" (con la etiqueta y el modificador);
  el jugador **pulsa para lanzar**, ruedan los dados físicos, sale el **total
  grande** (con destello de crítico/pifia) y se cierra solo (~2 s) o al hacer
  clic. Fases del overlay: `ready → rolling → result → hidden`.
  - **`rollVisual` es interactivo**: emite fase `ready`, **espera
    `triggerThrow()`** (el clic del jugador) y solo entonces lanza la física;
    devuelve las caras a `publishRoll`, que publica al feed. Los 6 llamadores
    no cambian. `setBoardListener`/`triggerThrow`/`isAwaitingThrow` en
    `lib/diceBox.ts`.
  - **Init perezoso**: dice-box (y su bucle de render WebGL) arranca en la
    **primera tirada**, no en cada página. El `#dice-board-canvas` sí se monta
    siempre (y con tamaño fijo, nunca `display:none`) para que dice-box mida
    bien el lienzo.
  - **Perf** (arregla el "petado" reportado): `enableShadows:false`, un
    **único `AudioContext` reutilizado** (antes uno nuevo por colisión) e init
    perezoso. `scale:6`, color por defecto rojo `#b3202e` (números blancos del
    tema legibles); ajustables en `lib/diceBox.ts`.
  - **Historia**: overlay transparente a pantalla completa (dados diminutos) →
    mesa de fieltro centrada auto-roll → bandeja plegable → **overlay BG3
    interactivo** (el jugador lanza). El bug de "solo se veía el total" venía
    del canvas en un contenedor de tamaño 0 al iniciar + saturación de render;
    el "petado", de sombras + AudioContext por colisión + render global
    permanente.
  - **Sizing del canvas** (bug que impedía ver los dados): dice-box dejaba su
    canvas a 0×0 (offscreen) / 300×150 y no lo ajustaba → no se renderizaba
    nada, solo se veía el total. Fix: `offscreen:false` +
    `fitCanvasToContainer()` (fija el búfer al tamaño del contenedor + `resize`
    para Babylon; se re-aplica en cada resize de ventana). Confirmado en vivo:
    canvas 0×0 → 560×518 y dados visibles con números.
  - ✅ **Confirmado funcionando por el usuario** (2026-07-15): dados grandes,
    números legibles, rinde bien. `scale:6` y color rojo por defecto,
    ajustables en `lib/diceBox.ts`.
- **Integración por `publishRoll`** (`lib/useDiceFeed.ts`): se extrajo
  `publishRollResult` (insert en BD de una tirada YA resuelta); `publishRoll`
  intenta `rollVisual` (construye el `RollResult` con las **caras físicas**,
  helpers puros `rollFromDice`/`d20FromDice` en `lib/dice.ts`) y **cae al
  `roll()`/`d20Check()` aleatorio** si el tablero no está soportado/listo.
  Firma pública intacta → los 6 llamadores (DicePanel, InitiativeTracker,
  CharacterSheet) siguen igual.
- **Efectos en el feed** (`DicePanel` + `globals.css`): nat 20 → destello
  dorado + "¡CRÍTICO!"; nat 1 → tinte rojo + "PIFIA" (`critState`), animación
  de entrada; todo respeta `prefers-reduced-motion`. Controles de color y
  sonido en el panel. **Toast** de tirada ajena por realtime (A2).
- **Fix de proxy** (`proxy.ts`): los assets `.json`/`.wasm` de dice-box caían
  en el matcher del auth-proxy (307 a `/login` sin sesión / round-trip inútil
  con sesión) → **`dice-box` añadido a las exclusiones del matcher**.
- Verificado: `npx tsc --noEmit`, `next build` y `scripts/check-dicebox.ts`
  (19 checks) + `check-dice.ts` limpios; dev server arranca sin errores de
  consola y **los assets de dice-box se sirven 200 por HTTP** (`theme.config.json`,
  `ammo.wasm.wasm`, texturas) tras el fix de proxy. **PENDIENTE de prueba en
  vivo por el usuario**: iniciar sesión y tirar (hoja, dado rápido, fórmula,
  iniciativa, petición) para ver rodar los dados y el crítico/pifia — requiere
  login (no disponible en esta sesión). Sin migración.
- **Nota lint**: `npm run lint` está roto **repo-wide** por
  `react-hooks/set-state-in-effect` (React 19 más estricto) en ~7 archivos
  preexistentes; el `useEffect` de carga de color/sonido en `DicePanel` añade
  un caso más del **mismo patrón hydration-safe** ya usado en todos los hooks
  realtime del repo. `tsc`/`build` limpios (gates reales del proyecto).

## RESUELTO (2026-07-13): Bestiario 2024 + formulario de monstruos del DM

Plan en `docs/superpowers/plans/2026-07-13-bestiario-2024.md`. Página
**/bestiario** (buscador nombre ES/EN, filtros CR/tipo, statblocks 2024) con
**124 monstruos extraídos** del MM 2024 (todo CR 0, 1/8, 1/4, 1/2 —
`data/bestiary/cr-*.ts`, validados por `scripts/check-bestiary.ts` y muestreo
visual contra el PDF). **Formulario del DM** («Añadir monstruo», solo DM):
statblock completo con CR propio → XP/BC autocalculados; se guardan en
`app_config.custom_monsters` (sin migración) y PISAN al estático si el slug
coincide (aviso en el formulario). **Descubrimiento**: jugadores solo ven
`app_config.bestiary_discovered`; toggle por ficha + vista previa DM.
Hook: `lib/useBestiary.ts` (merge estáticos+custom, realtime).

**PENDIENTE de esta fase**: lotes de extracción J4 (CR 1–2), J5 (CR 3–5),
J6 (CR 6–30) — ~370 monstruos; J8 integración con la calculadora de
encuentros (añadir por nombre desde el bestiario). Pipeline: la capa OCR del
PDF entrelaza columnas — SOLO sirve para localizar; la verdad terrena es la
página renderizada (`py` + pypdfium2 → PNG → lectura visual). Convención:
datos mecánicos = hechos; blurbs/textos = redacción propia ≤300 chars.
Fuente: `C:\Users\carlo\Desktop\Exandria-Obsidian\Exandria\Books\DnD 5e 2024
Monster Manual Alternate Cover.pdf` (390 págs; pageNNN.txt del dump = índice
pypdfium2 NNN-1).

## RESUELTO (2026-07-12): Atlas — regiones explorables en todos los continentes
Trabajo directo en `master` (sin rama aparte). Plan en
`docs/superpowers/plans/2026-07-11-atlas-continentes.md` (4 tareas); diseño en
`docs/superpowers/specs/2026-07-11-atlas-y-calendario-design.md`.

1. **Modelo y semilla del atlas** (`data/atlas.ts` + `lib/useAtlas.ts`, key
   `atlas_defs` en `app_config`, sin migración): generaliza el modelo de
   Tal'Dorei (`Region`+`Poi`) a los 5 continentes habitados. `seedAtlas()`
   reutiliza Tal'Dorei tal cual y genera Issylra/Wildemount/Marquet/Dientes
   Rotos desde `WORLD_POIS`, con slugs de región únicos globalmente
   (`uniqueRegionSlug`). `scripts/check-atlas.ts` verifica slugs únicos,
   reparto completo de POIs y las 4 imágenes de Wildemount.
2. **`/mapa` con regiones por continente**: cualquier continente (no solo
   Tal'Dorei) muestra sus regiones como pines y abre `RegionExplore` al
   pulsar una; se retiraron los pines planos por continente (`useWorldPois`
   se queda solo para navegación de continente + niebla + Mares).
3. **Editor DM por continente** (`app/dm/MapaPanel.tsx`): selector de
   continente + pestañas Regiones/POIs por región con CRUD completo sobre
   el atlas de cada continente; se retiró el modo antiguo de pines planos
   del mundo del editor.
4. **Limpieza y documentación** (esta tarea): borrado `lib/useTaldorei.ts`
   (sin consumidores tras las tareas 2-3, confirmado por grep; su
   re-export de `slugify` tampoco se usaba, ya todo importa de
   `lib/slug.ts`); `lib/useWorldPois.ts` confirmado con consumidores
   (`app/mapa/page.tsx`, `components/ReinoRegions.tsx`) — se mantiene.
   `components/RegionExplore.tsx` revisado: el fallback «Región sin mapa
   propio» ya se leía claro para regiones nuevas sin imagen; no se tocó.
   Ver «Atlas por continente» arriba para el detalle de cómo subir
   submapas y la limitación conocida del editor DM (fondo de arrastre de
   POIs sin recortar a la región cuando no hay `image`).
- Verificado: `tsc --noEmit`, `next build` y `npx tsx scripts/check-atlas.ts`
  limpios en las 4 tareas. Sin credenciales Supabase en este entorno: no se
  probó en vivo (crear región/POI desde el editor DM en un continente nuevo,
  revelar y explorar como jugador); solo build + análisis de código, igual
  que sesiones anteriores.

## RESUELTO (2026-07-11): Calendario exandriano en tiempo real
Trabajo directo en `master` (sin rama aparte). Plan en
`docs/superpowers/plans/2026-07-11-calendario-tiempo-real.md` (5 tareas);
diseño en `docs/superpowers/specs/2026-07-11-atlas-y-calendario-design.md`.

1. **Longitudes de mes + derivación pura** (`data/cosmology.ts`: `monthDays`;
   `lib/gameClock.ts`): convierte un minuto de juego absoluto (desde año 0 PD)
   en `GameMoment` (año/mes/día/hora/minuto/día de la semana/estación/fase
   lunar de Catha/festividad/`dateStr`) y viceversa
   (`momentFromGameMin`/`gameMinFromMoment`), sin React ni Supabase.
2. **Fuente y hook del reloj** (`lib/useGameClock.ts`): `campaign_clock` (JSON
   en `app_config`, **sin migración**) con `epochRealMs`/`epochGameMin`/
   `running`/`msPerGameMin` (10000 ms = 10 s reales por minuto de juego → 10
   min reales = 1 h de juego). Arranca corriendo por defecto (836 PD, 1 de
   Horisal, 08:00 la primera vez). Realtime + tick de 1 s en cliente
   (`useGameClock()` → `{ clock, nowGameMin, ready }`); mutaciones
   `setClockRunning`, `advanceGame`, `setGameDateTime`.
3. **Widget de reloj** (`components/ClockWidget.tsx`): variante compacta en
   `SiteNav` (icono de luna + fecha/hora) y variante grande (día de semana,
   fecha completa, hora, estación, fase lunar, chip de festividad).
4. **Panel DM "Tiempo"** (`app/dm/RelojPanel.tsx`, pestaña en
   `DmDashboard.tsx`): reloj grande + controles play/pausa, avance rápido
   (+1 h, descanso corto/largo, +1 día) y formulario para fijar fecha/hora
   exactas (selects de mes/día + año/hora/minuto).
5. **La Crónica lee el reloj**: `CronicaView` y Panel DM › `CronicaPanel` ya
   no leen `campaign_date` (texto libre); derivan la fecha de
   `useGameClock()` + `momentFromGameMin`. Se retiró el input manual de fecha
   del panel DM (sustituido por una nota que remite a la pestaña Tiempo) y
   `campaignDate`/`setCampaignDate` se eliminaron de `lib/useChronicle.ts`
   (sin más consumidores, confirmado por grep). `app_config.campaign_date`
   queda deprecado: la columna/fila puede seguir existiendo pero nada la lee.
- Verificado: `tsc --noEmit`, `next build` y `eslint` limpios. Sin
  credenciales Supabase en este entorno: no se probó en vivo con el reloj
  corriendo de verdad (Realtime, tick, controles DM); solo build + análisis
  de código, igual que sesiones anteriores.

## RESUELTO (2026-07-10): Kit D&D completo — clases, ficha, dados, crónica, encuentros
Trabajo directo en `master` (sin rama aparte). Plan en
`docs/superpowers/plans/2026-07-09-dnd-toolkit.md` (12 tareas).

1. **Datos mecánicos de clase 2024** (`data/classdata/`): las 13 clases (12
   PHB + Cazador de Sangre) con rasgos por nivel, tabla de progresión y
   espacios de conjuro (`spellSlots.ts`: full/half/pact casters).
2. **Ficha derivada** (`lib/derive.ts`): motor puro que calcula PG, CA,
   modificadores, salvaciones y pericias a partir de la ficha guardada; es la
   misma fuente de verdad que usan `/personaje` y Panel DM › Grupo, para que
   DM y jugador vean siempre los mismos números.
3. **Dados e iniciativa en vivo** (`schema_v11`): tiradas compartidas
   (`lib/dice.ts` + `useDiceFeed`), peticiones de tirada del DM al grupo o a
   un jugador (`useRollRequests`), e iniciativa en vivo con control de turno
   del DM (`useInitiative`). UI en Panel DM › Dados (`DadosPanel`) y también
   visible para el jugador en `/personaje`.
4. **Crónica de campaña** (`schema_v12`): diario de sesión, misiones (activa/
   completada/fallida/oculta) y PNJ conocidos, más fecha narrativa con
   festividades (`lib/gameDate.ts`). Página `/cronica` para el grupo (solo ve
   lo publicado/visible) y Panel DM › Crónica (`CronicaPanel`) con control
   total, incl. borradores y ocultos.
5. **Calculadora de encuentros + notas del DM** (Panel DM › Mesa,
   `EncuentrosPanel`): presupuesto de XP del grupo por dificultad
   (`data/encounters.ts`, tabla DMG 2024) vs. XP de los monstruos puestos en
   la mesa, veredicto Baja/Moderada/Alta/Mortal, y botón **Repartir XP**
   (reparte el XP de los monstruos entre el grupo vía la misma API
   `/api/dm/character` que usa Grupo). **Notas privadas del DM** por región o
   personaje, guardadas en `app_config` (`dm_notes`, un JSON por ámbito).
   *Nota de seguridad*: la política RLS de `app_config` (`schema_v5`) permite
   `select` a **cualquier usuario autenticado**, no solo al DM — un jugador
   con acceso a la consola podría leer `dm_notes` llamando directo a la API de
   Supabase. Aceptable por ahora (juego de confianza entre amigos), pero si se
   quiere blindar de verdad habría que mover las notas a su propia tabla con
   política de `select` restringida a `is_dm()`.
- Verificado: `tsc --noEmit`, `next build` y `eslint` limpios en los archivos
  tocados; sanity check de `data/encounters.ts` con `tsx` (presupuesto de
  grupo y XP por CR contra los valores esperados).

> **PENDIENTE del usuario: ejecutar `supabase/schema_v11.sql` y
> `supabase/schema_v12.sql`** (dados/iniciativa y crónica). Sin ellas la nube
> ignora esas tablas/columnas.

## RESUELTO (2026-07-07): Nivel / XP por el DM
Rama `dm-nivel-xp`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-07-dm-nivel-xp*`.

- **Progresión (ambas)**: `characters.xp` (jsonb→int, **schema_v10**) + `level`.
  El DM **da XP** (el nivel sube al cruzar umbral de la tabla 2024) o **fuerza
  nivel** (hito). `data/leveling.ts`: `XP_THRESHOLDS`, `levelFromXp`, `xpForNext`.
- **Panel DM › Grupo**: por jugador **nivel ±** y **Dar XP**, más acciones de
  grupo **"Subir nivel a todos"** y **"Dar XP a todos"**. Vía la API
  `/api/dm/character` (ampliada con `setLevel` y `addXp`, cálculo en servidor).
- **Excepción al bloqueo**: el jugador puede **tirar su propia vida (PG)** de los
  niveles alcanzados sin tirada (único control activo en su hoja); una vez tirado
  **queda fijo** (el DM puede re-tirar para corregir). Persiste solo `hp_rolls`
  saltando el gate de solo-lectura. Las ASI las sigue repartiendo el DM.
- **Hoja**: barra de **XP** (`xp / xpForNext`) en el panel de nivel.
- Verificado: `tsc`/`build`/`lint` limpios + preview del jugador (barra XP, solo
  botón Tirar, sin steppers; tirar fija el PG). Control DM validado por build.

> **PENDIENTE del usuario: ejecutar `supabase/schema_v10.sql`** (columna `xp`).

## RESUELTO (2026-07-07): Control del DM — hoja bloqueada, dados de PG, Baúl
Rama `dm-control-baul`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-07-dm-control-baul*`.

- **Hoja `/personaje` solo lectura para jugadores**: el jugador ve su ficha sin
  poder editar (nivel, ASI, oro, objetos, equipo). El **DM edita** la hoja de un
  jugador vía **`/personaje?user=<id>`** (botón "Editar hoja" en Panel DM › Grupo).
  La hoja se extrajo a `components/CharacterSheet.tsx` (`readOnly`/`saveMode`).
- **Escritura del DM sobre hojas ajenas** = API `app/api/dm/character/route.ts`
  con `service_role` (verifica rol DM; hace patch directo o *append* de
  objetos/oro). Requiere `SUPABASE_SERVICE_ROLE_KEY` (ya usado por crear usuarios).
- **Dados de PG**: nivel 1 = dado de clase al máx + CON; cada nivel nuevo, botón
  "Tirar" (`d<dado> + CON`), tiradas guardadas en `characters.hp_rolls` (jsonb,
  **schema_v9**). `data/leveling.ts`: `rollHitDie`, `maxHpFromRolls`.
- **Retrato de identidad más pequeño** (`PortraitFrame size="md"`, 84px).
- **El Baúl del Dungeon Master** (Panel DM › pestaña "Baúl"): el DM guarda
  entradas `{ nombre, tipo: mágico|normal|oro, cantidad, notas }` en `app_config`
  (`dm_stash`), y las **entrega** a uno o varios jugadores (oro→`gold`,
  objeto→`items`) vía la API; opción de quitar del baúl al entregar. Realtime lo
  refleja en la hoja del jugador. `lib/useDmStash.ts`, `app/dm/BaulPanel.tsx`.
- Verificado: `tsc`/`build` limpios + preview del jugador en solo lectura e
  imagen pequeña. La parte DM (editar por `?user=`, API, entrega, Baúl) no se
  probó en vivo por falta de sesión DM/credenciales; validada por build + análisis.

> **PENDIENTE del usuario: ejecutar `supabase/schema_v9.sql`** (columna
> `hp_rolls`). El Baúl y la edición DM necesitan `SUPABASE_SERVICE_ROLE_KEY` en el
> servidor. Falta **mergear la rama a `master`** y desplegar.

## RESUELTO (2026-07-07): Hoja de personaje interactiva (`/personaje`)
Rama `personaje-hoja-interactiva`. Spec/plan en
`docs/superpowers/{specs,plans}/2026-07-07-hoja-personaje-interactiva*`.

- **Página `/personaje`**: hub interactivo de la ficha. Paneles: identidad,
  **nivel 1-20 + mejoras (ASI 2024 por clase)** con reparto +2 por hito y PG/
  competencia derivados, aptitudes (base+trasfondo+ASI), estadísticas derivadas
  (PG, competencia, iniciativa, velocidad, **CA editable** —solo sesión),
  **oro**, **inventario** de objetos enriquecidos `{nombre, cantidad, notas}`
  (capacidad 20+2×FUE), y **muñeco de equipo (paperdoll)**.
- **Muñeco**: armadura (cabeza, torso, antebrazos, manos, piernas, pies, 1 c/u),
  armas (principal, secundaria) y **accesorios dinámicos**: collar 1 fijo,
  **anillos = 2×mód INT**, colgantes = mód SAB, amuletos = mód CAR (recalculan al
  variar atributos). Equipar/retirar mueve objetos entre inventario y huecos.
- **Botón "Crear personaje"** en el capítulo Ficha de `/crear` → guarda y navega
  a `/personaje`. **`/inventario` redirige** a `/personaje`.
- Componentes: `components/LevelPanel.tsx`, `components/Paperdoll.tsx`;
  reglas en `data/leveling.ts` + `data/equipmentSlots.ts`; tipos ampliados en
  `lib/character.ts` (`Item`, `Asi`, campos `level/gold/asi/equipment/items`,
  retrocompat `inventory`→`items`).
- Verificado: `tsc`/`build`/`lint`(nuevos archivos) limpios + preview en :3100
  (nivel→ASI→PG, escalado de accesorios con INT, equipar/retirar).

> **PENDIENTE del usuario: ejecutar `supabase/schema_v8.sql`** en Supabase
> (añade `level, gold, asi, equipment, items`). Sin ella, la nube ignora estos
> campos; en local funciona con `localStorage`. Falta también **mergear la rama
> a `master`** y desplegar.

## RESUELTO (2026-07-06): Rebrand a Exandria + roster + tomo de creación
Trabajado en la rama `exandria-rebrand-roster` (fuera de `master`).
Spec y plan en `docs/superpowers/{specs,plans}/2026-07-06-exandria-rebrand-roster*`.

1. **Rebrand a Exandria (solo texto visible)**: metadatos (`app/layout.tsx`),
   marca en Nav/Footer/Emblem/Home/Login, prompts de IA (`data/loreText.ts`,
   `app/api/ia/route.ts`). **No** se renombró `data/taldorei.ts` ni `CONTINENT`.
   El encuadre general habla de Exandria (mundo); la campaña sigue en Tal'Dorei.
2. **`/reino` → mundo**: "El Mundo de Exandria" con `WORLD_INTRO` nuevo en
   `data/cosmology.ts`; las regiones de Tal'Dorei siguen como sección.
3. **Roster ampliado a ~36 especies** (`data/species.ts`) agrupadas por región
   (`REGIONS` + `regionSpecies()`, campos nuevos `region`/`origin`/`image`/
   `homebrew`). Añadidas 26: Tal'Dorei (centauro, hombre lagarto, hada, sátiro,
   hobgoblin), Wildemount (goblin, osgo, minotauro, firbolg, kenku), Marquet
   (aarakocra, replicante, liebrén, tabaxi, yuan-ti), Issylra/Ashari (genasí),
   Infraoscuridad/planar (duergar, svirfneblin, kobold, **sangre bestial**
   [homebrew, "a criterio del DM"], eladrin, shadar-kai, gith) y océanos (elfo
   marino, tritón, tortoga).
4. **Clases**: añadido **Cazador de Sangre** (Blood Hunter) + campo `image`.
5. **`/crear` rediseñado como TOMO** (libro doble página, giro 3D, índices de
   capítulo): `components/CharacterBook.tsx` (carcasa) + `components/PortraitFrame.tsx`
   (hueco de imagen con placeholder). Capítulos: Razas · Clases · Trasfondos ·
   Aptitudes · Pericias · Ficha. Índice a la izquierda (Razas por región),
   detalle con retrato + descripción a la derecha. Cae a página única en móvil.
   La lógica de estado/validación del creador se conservó intacta.
   Verificado: `tsc --noEmit` + `next build` limpios, y preview visual
   (escritorio, giro, detalle, móvil). Sin credenciales Supabase, no probado en
   vivo multijugador (igual que sesiones previas).

### PENDIENTE de este milestone
- **Iconos de clase subidos** (`public/classes/<slug>.jpg`, 11 archivos,
  todos < 32 KB) — solo faltan **bardo.jpg** y **paladin.jpg** (no hay icono
  de origen en el vault); `PortraitFrame` muestra su fallback normal.
- **Subir los retratos reales restantes** (`.jpg`) a `public/species/<slug>.jpg`
  y `public/species/lineages/<slug-linaje>.jpg`. Sin ellos se ve un marco con
  icono (por diseño). Ver README «Imágenes de personaje». Slugs = campo `slug`
  en `data/species.ts` / `data/classes.ts`; el slug de linaje se deriva con
  `slugify(nombre)` en `app/crear/page.tsx`.
- **Mecánica de especies homebrew** (Sangre Bestial): rasgos resumidos, a
  afinar con el DM si se juegan.
- **Mergear la rama** `exandria-rebrand-roster` a `master` y desplegar (Vercel).

## Backlog
- **Retratos de personaje**: iconos de clase ya subidos (`public/classes/`,
  ver «PENDIENTE de este milestone» arriba); siguen sin subir
  `public/species/` y `public/species/lineages/`.
- **Spec de lore de Wildemount** (`docs/wildemount-lore-spec.md`): escrita,
  pendiente de ejecutar (ampliar la lore del segundo continente jugable).
- Notas del DM: si algún día importa que sean *de verdad* privadas, moverlas
  de `app_config` a una tabla propia con RLS `is_dm()`-only (ver nota de
  seguridad en el milestone 2026-07-10).
- ~~Archivar personaje~~ → **hecho el 2026-07-17**, ver su milestone arriba.
