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
  DMG 2024), `taldorei.ts` (regiones+MAPS+REGION_RATIO+lore), `pois.ts`,
  `npcs.ts`, `equipment.ts`, `equipmentSlots.ts`, `loreText.ts` (guía de
  narración + lore para la IA).
- `lib/` — `supabase/{client,server,env,proxy-session}.ts`, `auth.ts`,
  `character.ts` (+`useParty`), `derive.ts` (motor de ficha derivada: PG, CA,
  modificadores, salvaciones, pericias — misma fuente de verdad para hoja y
  panel DM), `dice.ts` (tiradas), `gameDate.ts` (festividades por fecha de
  campaña, formato "D de Mes, AAAA PD"), `gameClock.ts` (derivación pura del
  reloj: minuto de juego absoluto ↔ fecha/hora/estación/luna/festividad;
  `momentFromGameMin`/`gameMinFromMoment`), `useGameClock.ts` (hook +
  mutaciones del reloj de campaña, ver «Reloj de campaña» abajo), hooks
  realtime: `useLiveSession`, `useRegions`, `usePois`, `useGroupAction`,
  `useNpcChat`, `useDiceFeed`, `useRollRequests`, `useInitiative`,
  `useChronicle`, `useDmStash`, `useTaldorei`, `useWorldPois`, `narrador.ts`
  (cliente `/api/ia`).
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
- `lib/useWorldPois.ts` / `lib/useTaldorei.ts` — pines del mundo y
  regiones/POIs de Tal'Dorei, editables por el DM y persistidos como **JSON en
  `app_config`** (sin migración; ver «Editor de mapa» abajo).
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
- **Mapa** (`/mapa`) jerárquico: **Exandria → continente → regiones/ciudades**.
  El mapa mundial solo muestra pines de continentes + mares/océanos; clic en
  un continente hace zoom (CSS) y revela sus regiones/ciudades. Pines **sin
  etiqueta** (salvo continentes): clic para ver el detalle en el panel
  lateral. **Niebla** sobre continentes no revelados (opaca para jugadores,
  translúcida/clic-a-través para el DM). Botón **pantalla completa**.
  Tal'Dorei conserva sus 8 regiones + visor de zona (`RegionExplore`) con
  POIs; algunos POIs (Emon, Syngorn…) abren su **mapa de pueblo** a pantalla
  completa.
- **Editor de mapa (Panel DM › Mapa)**: pestañas **Todos · Tal'Dorei ·
  Issylra · Wildemount · Marquet · Los Dientes Rotos · Mares** con CRUD
  completo (añadir/editar/borrar/mover/revelar/icono/región) sobre los pines
  del mundo, más **Regiones Tal'Dorei** y **POIs por región** con CRUD propio
  sobre las regiones y sus POIs. Botón **«Ampliar»** en los mapas de arrastre
  con zoom manual (+/-, rueda, arrastrar) solo para el DM. Guardado
  **optimista** (el cambio se ve al instante, luego persiste).
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
app_config.campaign_date — **PENDIENTE de ejecutar por el usuario**).

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
