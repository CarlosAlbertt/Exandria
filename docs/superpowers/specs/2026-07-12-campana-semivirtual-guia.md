# Guía — Campaña semivirtual: tablero visual + autonomía de jugadores

Hoja de ruta aprobada (2026-07-12). Visión: los jugadores pueden actuar por su
cuenta desde casa — comprar, descansar, hablar con NPCs, aceptar encargos — en
la ubicación donde estén, con la IA local del DM (Ollama, ya integrada) dando
vida al mundo; y una capa visual de tablero virtual: dados 3D con física real,
animaciones y efectos.

Cada fase se implementa con su propio plan (`docs/superpowers/plans/`), en el
orden de abajo. Las fases son incrementales: cada una deja la app funcionando.

## Lo que ya existe (no rehacer)

- **IA local**: `/api/ia` → Ollama vía túnel cloudflared; host editable en
  Panel DM (`app_config.ollama_host`). Chat grupal con NPC (Taberna/Garda,
  `useNpcChat`) y chat personal (`/narrador`).
- **Ficha real**: oro, inventario (`items`), equipo, PG máx (`derive`), XP/nivel.
- **Dados compartidos**: `lib/dice.ts` (motor puro), `publishRoll` + feed
  realtime (`useDiceFeed`), peticiones del DM, iniciativa.
- **Reloj de campaña**: 10 min reales = 1 h de juego, `advanceGame`,
  festividades, widget en nav.
- **Atlas**: regiones y POIs por continente (`atlas_defs`), revelado por el DM,
  `RegionExplore`.
- **Crónica**: diario, misiones (`quests`), PNJs conocidos (`npcs_met`).

---

## FASE A — Dados 3D con física (el tablero virtual) 🎲

**Objetivo**: cuando alguien tira, los dados ruedan de verdad por la pantalla;
el resultado sale de la física. Los demás ven la tirada en su feed al instante.

- **Librería**: `@3d-dice/dice-box` (WebGL/BabylonJS + física). Assets locales
  en `public/dice-box/` (funciona offline, compatible Vercel). Única dependencia
  nueva del proyecto — decisión consciente, es el corazón visual.
- **Componente `DiceBoard`**: overlay transparente a pantalla completa (z alto,
  pointer-events none salvo al tirar) montado junto al `DicePanel`. API:
  `rollVisual(formula, { mod, adv })` → lanza dados físicos → al reposar
  devuelve `rolls[]`.
- **Integración con el feed**: nueva variante en `lib/useDiceFeed.ts`:
  `publishRollResult(userId, kind, label, formula, result: RollResult)` —
  publica una tirada YA resuelta (por la física) en vez de generar random.
  El motor `lib/dice.ts` sigue validando la fórmula (whitelist de dados).
  Todos los puntos de tirada (botones 🎲 de la hoja, dados rápidos, fórmula
  libre, iniciativa, peticiones) pasan a: animar con DiceBoard → publicar el
  resultado físico. Fallback sin WebGL / `prefers-reduced-motion`: se salta la
  animación y usa el `roll()` actual (nada se rompe).
- **Efectos**: d20 natural 20 → destello dorado + badge "¡CRÍTICO!" en el feed;
  natural 1 → tinte rojo "PIFIA". Entradas del feed con animación de aparición.
- **Espectadores (A2, opcional)**: los demás ven ya el resultado por realtime.
  Mejora: al insertarse una tirada ajena, mostrar un toast animado "🎲 {nombre}
  ha sacado {total} en {label}" con los dados individuales. (Replay físico de
  la tirada ajena: solo si dice-box permite forzar resultados; si no, toast.)
- **Tema**: color de dados por jugador (elegible en su hoja, persistido en
  `characters` o localStorage), sonido de dados opcional (toggle).

Verificación: tirada visual en escritorio y móvil; fallback sin WebGL; el
total del feed = suma de los dados que se vieron; iniciativa y peticiones
siguen funcionando.

---

## FASE B — Modo ubicación: "Estás en…" 📍

**Objetivo**: el grupo tiene una ubicación actual; al abrirla, el jugador ve
qué puede hacer allí sin el DM.

- **Ubicación del grupo**: `app_config.party_location` (JSON:
  `{ continent, regionSlug, poiName }`). La mueve el DM (desde el editor de
  mapa o un selector en Panel DM). Realtime a todos.
- **Widget en nav**: junto al reloj, "📍 {poiName}" — click → `/lugar`.
- **Página `/lugar`**: cabecera con nombre/tipo/blurb del POI (del atlas),
  imagen del pueblo si existe (`townMaps`), y las **secciones de servicios**
  de las fases C–F según lo que el POI ofrezca.
- **Servicios por POI**: extender el modelo `Poi` del atlas con
  `services?: { tienda?: string[]; posada?: boolean; npcs?: string[]; tablon?: boolean }`
  (ids/flags). El editor DM de POIs (MapaPanel) gana esos campos.
- Si el grupo no está en ningún POI (viajando): `/lugar` muestra "De camino…"
  con la ubicación de región y el reloj.

Sin migración (app_config + atlas_defs).

---

## FASE C — Tiendas con IA 🛒

**Objetivo**: comprar y vender contra la ficha real, con un tendero IA que
atiende, recomienda y regatea.

- **Migración `schema_v13.sql`**: tablas `shops` (id, poi_name, name, kind
  — herrería/alquimista/general/…, npc_prompt text, greeting), `shop_items`
  (shop_id, name, price int, stock int nullable — null = ilimitado, notes),
  `shop_log` (quién compró/vendió qué, cuándo, por cuánto). RLS: lectura
  autenticados, escritura de shops/items DM-only; shop_log insert propio.
  Realtime en shop_items (stock compartido vivo) y shop_log.
- **Transacciones**: autoservicio del jugador (confianza de mesa, como el
  resto de la app): comprar = resta oro de su ficha + añade item + decrementa
  stock + fila en shop_log; vender = mitad del precio (regla configurable).
  Validación en cliente (oro suficiente, stock > 0) y por el DM vía log.
  El feed de la Crónica o de dados recibe una línea "🛒 {jugador} compró
  {item} ({precio} po)" para que todos lo vean.
- **Tendero IA**: chat estilo taberna dentro de la tienda con
  `npc_prompt` + contexto del catálogo (nombre/precio/stock inyectados en el
  system prompt). La IA charla y recomienda; los botones ejecutan.
- **Regateo**: botón "Regatear" → tirada de Persuasión (¡con los dados 3D!)
  → descuento por tramos (p. ej. 15+ → 10%, 20+ → 20%, pifia → +10% y el
  tendero se ofende). Una vez por tienda y descanso largo.
- **Editor DM**: pestaña o sección en Panel DM para crear tiendas, asignarlas
  a POIs y editar catálogo. Plantillas semilla por tipo de tienda (catálogo
  base de equipo del PHB con precios estándar — hechos de juego).

---

## FASE D — Posada: descansos que mueven el reloj 🛏️

**Objetivo**: descansar sin el DM, con coste y efecto real.

- **Problema técnico**: `advanceGame` escribe `app_config` (RLS DM-only).
  El descanso del jugador necesita privilegio → **endpoint**
  `app/api/descanso` (service_role, como `/api/dm/character`): valida que la
  ubicación actual tiene posada, que el jugador tiene oro, cobra, avanza el
  reloj (+1 h corto / +8 h largo) y registra.
- **Efectos**: descanso largo → resetea el flag de regateo, restaura los
  recursos narrativos (nota en crónica automática: "El grupo pasó la noche en
  {posada}"); si en el futuro se trackean PG actuales, aquí se restauran.
  Descanso corto → +1 h y nota breve.
- **Anti-abuso simple**: máximo un descanso largo por día de juego (el reloj
  ya lo mide).
- **UI**: sección "Posada" en `/lugar` con precios (configurables por POI en
  el editor: cama común/habitación), botón de descanso con confirmación.

---

## FASE E — NPCs por ubicación 🗣️

**Objetivo**: cada lugar puede tener personajes con los que hablar por IA,
cada uno con su personalidad.

- **Datos** (en `schema_v13` o `v14`): tabla `location_npcs` (id, poi_name,
  name, role, prompt text — personalidad/secretos para la IA, public boolean,
  portrait text nullable). Escritura DM-only.
- **Chat**: reutilizar el patrón de la Taberna (`useNpcChat` generalizado con
  channel por NPC) para chat **grupal** por NPC, y el patrón `/narrador` para
  charla **privada**. Selector en `/lugar` › "Gente del lugar".
- **Integración crónica**: la primera vez que un jugador habla con un NPC,
  se inserta/actualiza en `npcs_met` automáticamente (name, role, región) —
  el códice de PNJs conocidos se llena solo.
- **Contexto de la IA**: system prompt = prompt del NPC + resumen del lugar +
  (opcional) fecha/festividad del reloj → los NPCs comentan el clima festivo.
- **Editor DM**: CRUD de NPCs por POI, con vista previa del prompt.

---

## FASE F — Tablón de misiones 📜

**Objetivo**: ganchos y encargos publicados por lugar; el jugador acepta y se
convierte en misión del grupo.

- **Datos**: reutilizar `quests` (schema_v12) añadiendo columnas
  (`schema_v13`/`v14`): `poi_name text nullable`, `reward text`, `status`
  gana valor `'oferta'`. RLS ya existente cubre (ofertas visibles si no
  ocultas).
- **UI jugador**: sección "Tablón" en `/lugar`: anuncios con recompensa;
  botón "Aceptar encargo" → status pasa a `activa` (visible en `/cronica`
  para todos, con nota de quién lo aceptó).
- **UI DM**: en el CronicaPanel actual, crear misiones con POI y recompensa
  (el CRUD de quests ya existe — solo se amplía el formulario).

---

## FASE H — Subida de imágenes (Supabase Storage) 🖼️

**Objetivo**: el DM sube imágenes desde la propia app — sin tocar código ni
redeployar. Una sola infraestructura sirve para todo: submapas de región,
mapas de pueblo, battlemaps, retratos de NPCs, arte de monstruos y retratos
de especies/clases (cierra el pendiente del vault).

- **Storage**: bucket `assets` en Supabase Storage (lectura pública, escritura
  solo DM vía policy con `is_dm()`). Carpetas: `maps/`, `battlemaps/`,
  `npcs/`, `monsters/`, `species/`, `tokens/`.
- **Componente `ImageUpload`**: input de archivo + preview + subida con
  `supabase.storage.from("assets").upload(...)` → devuelve URL pública.
  Redimensionado/compresión en cliente antes de subir (canvas, máx ~1600px
  para retratos, ~4000px para battlemaps) para no comer cuota.
- **Integraciones** (cada una es un campo nuevo + el componente):
  1. **Editor de región** (MapaPanel): campo `image` con ImageUpload →
     resuelve el hueco actual (submapas de Issylra/Marquet/Dientes Rotos sin
     tocar código). El atlas acepta URLs de Storage además de `/maps/...`.
  2. **Mapas de pueblo**: `townMaps` pasa a poder venir del atlas/Storage.
  3. **Retratos de NPCs** (fase E): campo `portrait` en el editor de NPCs.
  4. **Retratos de especies/linajes** (pendiente viejo del vault): pantalla
     DM para subirlos a `species/<slug>.jpg`; `PortraitFrame` acepta URL de
     Storage con fallback al `/species/...` local y al icono.
  5. **Battlemaps y tokens** (fase I) y **arte de monstruos** (fase J).
- Fallback: si Storage no está configurado, los campos aceptan URL manual.

Sin migración de tablas (Storage tiene sus propias policies). Nota: crear el
bucket y las policies es un paso manual del DM en el dashboard de Supabase —
documentar el SQL/pasos exactos en el plan de la fase.

---

## FASE I — Tablero de batalla con tokens (VTT ligero) ⚔️

**Objetivo**: el DM sube un battlemap, coloca tokens de jugadores y monstruos,
y todos ven y mueven en vivo — el "tablero virtual" de verdad para combates.

- **Alcance deliberado**: VTT *ligero*. Tokens sobre imagen con movimiento en
  tiempo real, integrado con la iniciativa existente. SIN niebla de guerra por
  celda, SIN medición de distancias, SIN automatización de combate (eso es un
  Roll20 entero — no en la primera versión).
- **Migración (`schema_v14`)**: `battle_boards` (id, name, image_url,
  grid_size int nullable — px por casilla para el snap opcional, active
  boolean) y `battle_tokens` (id, board_id, kind 'pj'|'monstruo'|'npc',
  ref — user_id o monster slug, label, image_url nullable, x, y, size
  1|2|3 — casillas, color, hidden boolean). RLS: lectura autenticados
  (tokens hidden solo DM), escritura: DM todo; el jugador puede UPDATE
  x/y solo del token cuyo `ref` = su user_id (su miniatura). Realtime en
  ambas tablas.
- **Página `/tablero`** (o sección grande en `/lugar` cuando hay board
  activo): imagen del battlemap + tokens arrastrables (reutilizar la física
  de arrastre de `PinDragMap`, generalizada). Snap a rejilla si `grid_size`.
  Tokens con retrato circular (Storage) o inicial + color.
- **DM**: crear tablero (ImageUpload de fase H), añadir tokens de PJs (uno
  por miembro del grupo, retrato de su ficha si existe), de monstruos (desde
  el bestiario de fase J, con su arte), ocultar/revelar tokens, activar y
  cerrar tablero. Al activar → aviso realtime a todos ("¡Combate!") y la
  iniciativa existente se abre al lado.
- **Jugador**: ve el tablero en vivo, arrastra SU token, tira iniciativa
  (dados 3D de fase A) — todo lo demás ya existe.

---

## FASE J — Bestiario D&D 2024 🐉

**Objetivo**: bestiario oficial 2024 consultable en la app, con arte, enlazado
a la calculadora de encuentros y a los tokens del tablero.

- **Fuente de datos**: PDFs que subirá el usuario (p. ej. a
  `Exandria-Obsidian/Exandria/Books/`). Flujo de extracción (como se hizo con
  la EGW): si el PDF es escaneado, render por páginas con `py` + `pypdfium2` y
  lectura visual; si tiene capa de texto, extracción directa. dndbeyond.com/
  monsters como referencia de verificación puntual (WebFetch), no como fuente
  masiva.
- **⚠️ Convención de contenido (igual que todo el repo)**: los **datos
  mecánicos son hechos** — nombre, tamaño, tipo, CA, PG, velocidades,
  características, salvaciones, habilidades, resistencias, inmunidades,
  sentidos, idiomas, CR/XP, y la MECÁNICA de rasgos/acciones (dados de daño,
  alcances, CDs). Las **descripciones y el texto de sabor se redactan
  propios** en español, breves — nunca se copia la prosa del manual. Priorizar
  el subconjunto del SRD 5.2 (licencia CC-BY-4.0) como base limpia; los
  monstruos fuera del SRD entran solo como datos mecánicos + resumen propio.
- **Modelo**: `data/bestiary/types.ts` (`Monster`: slug, name, nameEn, size,
  type, alignment, ac, hp, hpFormula, speeds, abilities, saves?, skills?,
  resistances?, immunities?, senses, languages, cr, xp, traits[], actions[],
  reactions?, legendary?, blurb propio, image? — URL Storage). Datos por
  chunks: `data/bestiary/cr0-1.ts` etc. o tabla `monsters` en DB si el
  volumen lo pide (decidir en el plan: ~500 monstruos → mejor DB con seed
  script, `schema_v14`/`v15`).
- **Página `/bestiario`** (DM completo; jugador solo ve los monstruos que el
  DM marque "descubiertos" — como los POIs): buscador por nombre/CR/tipo,
  ficha de monstruo con statblock estilizado + arte (Storage, fase H).
- **Integraciones**:
  - Calculadora de encuentros (Mesa): añadir monstruos por nombre desde el
    bestiario (autocompletado), no solo por CR — el XP sale de su ficha.
  - Tablero (fase I): "añadir token de monstruo" desde el bestiario con su
    arte y tamaño.
  - Statblock rápido: popover del monstruo en la iniciativa para el DM.
- **Vault Obsidian**: nota `40 Datos del juego/Bestiario.md` con el estado
  (fuente, cuántos extraídos, convención de contenido) al cerrar la fase.

---

## FASE G — Polish visual transversal ✨

En cualquier momento tras la Fase A; ideas ordenadas por impacto:

1. Feed de dados y crónica con animaciones de entrada (CSS, sin librerías).
2. Crítico/pifia con efecto en pantalla completa breve (destello).
3. Transiciones de página suaves (View Transitions API de Next si estable, o
   CSS) — ojo AGENTS.md: verificar API en docs de Next 16.
4. `/lugar` con ambientación: imagen de cabecera con gradiente, iconos de
   servicio animados al hover.
5. Mapa: pulso suave en la ubicación actual del grupo; trazo animado de viaje
   cuando el DM mueve `party_location`.
6. Sonidos opcionales (dados, compra, campana de posada) con toggle global
   persistido — apagados por defecto.

---

## Orden y dependencias

```
A (dados 3D) ─────────────────────────────► I (tablero de batalla)
H (subida de imágenes) ───► I               ▲
                      └───► J (bestiario) ──┘
B (ubicación) ──► C (tiendas) ──► D (posada)
              └─► E (NPCs, retratos de H)
              └─► F (tablón)
G (polish) — transversal, en cualquier momento tras A
```

- **A primero**: impacto inmediato, sin dependencias, toca solo el sistema de
  dados.
- **H pronto**: desbloquea el campo `image` del editor de región (hueco
  conocido), los retratos pendientes del vault, y es prerequisito de I y J.
- **B es la base** de C–F (todas viven en `/lugar`).
- C y E comparten el patrón "NPC con prompt + IA" — implementar C primero y
  extraer el chat reutilizable para E.
- **I necesita A + H** (dados para iniciativa, Storage para battlemaps/tokens);
  **J necesita H** (arte) y los PDFs del usuario; I y J se enriquecen
  mutuamente (tokens de monstruo) pero pueden ir en cualquier orden.
- Migraciones: `schema_v13` agrupa C+E+F; `schema_v14` agrupa I (+ tabla de
  bestiario de J si se opta por DB). Dos pasadas de SQL Editor en total.

## Mantenimiento del vault (Obsidian)

Al cerrar CADA fase: añadir el hito `[!success]` en
`00 Meta/Historial de desarrollo.md`, actualizar `00 Meta/Pendientes.md`
(migraciones nuevas, pasos manuales como el bucket de Storage o los PDFs del
bestiario) y crear/actualizar la nota de funcionalidad correspondiente
(`50 Funcionalidades/…`). El vault es el segundo cerebro del proyecto — se
actualiza en el mismo ciclo que HANDOFF.md, no después.

## Notas de infraestructura

- **Carga de IA**: tiendas + NPCs multiplican peticiones al túnel Ollama.
  `qwen2.5:14b` aguanta conversaciones 1-a-1; si va lento, bajar a un modelo
  menor para NPCs "de ambiente" (campo `model` opcional por NPC).
- **El PC del DM debe estar encendido** para la IA (túnel). Sin túnel, las
  secciones IA muestran "El tendero está ocupado…" y los botones de
  compra/venta siguen funcionando (la IA es color, no bloqueo).
- **Convenciones**: mecánica = hechos; descripciones = redacción propia en
  español. Commits español + coautoría. Verificación por tarea:
  tsc/build/eslint + scripts `check-*`.
