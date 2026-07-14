# Guía — Campaña semivirtual: tablero visual + autonomía de jugadores

Hoja de ruta aprobada (2026-07-12; ampliada 2026-07-14 con las fases K —
stats con dados de tirada única —, L — control de acceso por rol — y la
Fase G convertida en capa gráfica completa; ampliada 2026-07-15 con M —
caja de herramientas IA del DM —, N — mundo vivo: clima, saber por
personaje y rumores —, O — libro de conjuros —, P — downtime y minijuegos —
y Q — misiones personales con IA y visiones). Visión: los jugadores pueden
actuar por su cuenta desde casa — comprar, descansar, hablar con NPCs,
aceptar encargos — en la ubicación donde estén, con la IA local del DM
(Ollama, ya integrada) dando vida al mundo; una capa visual de tablero
virtual: dados 3D con física real, animaciones y efectos; y el DM con
control total sobre todo, con base de reglas D&D 2024 (5.5E) en toda la app.

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

## FASE K — Stats en el creador: dados, array o point-buy (tirada única) 🎲

**Objetivo**: al crear personaje, el jugador elige UNA vía para sus
aptitudes; si tira dados, la tirada es única e **imposible de repetir** (si
no, todo el mundo repetiría hasta sacar lo que quiere).

- **Tres vías** en `/crear` › capítulo Aptitudes (selector de método,
  bloqueado una vez usado):
  1. **Dados**: 4d6-descarta-el-menor ×6, tirados con los dados 3D de la
     Fase A (fallback aleatorio sin WebGL). Los **6 valores quedan fijos
     para siempre**; la *asignación* a FUE/DES/CON/INT/SAB/CAR sí es libre y
     editable hasta guardar la ficha.
  2. **Array estándar 2024**: 15/14/13/12/10/8, asignación libre.
  3. **Point-buy 27**: el sistema actual, intacto.
- **Bloqueo en servidor, no en localStorage** (por consola se saltaría):
  tabla nueva **`stat_rolls`** (migración `schema_v13`):
  `user_id uuid PK → profiles`, `method text` (dados/array/pointbuy),
  `values int[]`, `rolled_at timestamptz`. RLS: **INSERT propio, sin UPDATE
  ni DELETE** para jugadores → la fila es inmutable y la PK impide una
  segunda tirada. El DM tiene DELETE (`is_dm()`) = **resetear la tirada** de
  un jugador (botón nuevo en Panel DM › Grupo). Elegir array/point-buy
  también inserta su fila (bloquea cambiar de método para "probar suerte").
- **Modelo de confianza**: los dados físicos ruedan en el cliente y el
  cliente inserta el resultado — un tramposo con consola podría falsear UNA
  inserción, igual que en las tiendas autoservicio (Fase C). Lo que el
  sistema garantiza es que **no hay repetición**: mismo modelo de confianza
  que el resto de la app, sin perder el espectáculo de los dados 3D
  (dice-box no permite forzar resultados, así que tirar en servidor mataría
  la animación).
- **Sin sesión Supabase** (modo localStorage): solo array/point-buy, con
  aviso — los dados exigen sesión para poder bloquearse.
- Los **bonus de trasfondo** (+2/+1 o +1/+1/+1) se aplican después del
  método elegido, exactamente igual que hoy.

---

## FASE L — Control de acceso por rol 🔒

**Objetivo**: una sola app "separada pero conjunta": el jugador solo ve lo
suyo; el DM lo ve y lo controla TODO. Gating **en servidor**, no solo
ocultar botones.

- **`/narrador` pasa a ser DM-only** (hoy cualquier logueado entra): el
  server component comprueba `getSessionProfile()` y si `role !== "dm"` hace
  `redirect("/")`; además desaparece del nav de jugadores (`SiteNav` ya
  recibe `role`).
- **Auditoría de superficies** (regla nueva: toda ruta que se cree declara
  su rol en esta tabla):

  | Superficie | Jugador | DM |
  |---|---|---|
  | `/`, `/reino`, `/crear`, `/personaje`, `/mapa`, `/taberna`, `/cronica`, `/bestiario`, `/lugar` (B) | ✅ | ✅ |
  | `/narrador` | ❌ (se cierra en esta fase) | ✅ |
  | `/dm` | ❌ (ya gated) | ✅ |
  | `/api/dm/character`, `/api/admin/users` | ❌ (ya verifican DM/service) | ✅ |
  | `/api/ia` | ✅ autenticado (taberna/NPCs lo usan) | ✅ |

- **Acciones directas del DM sobre jugadores** (las existentes + las que
  añaden otras fases, listadas para no perder el norte): nivel ±, dar XP,
  oro, objetos, editar hoja completa, entregar desde el Baúl, re-tirar PG,
  **resetear tirada de stats (K)**, **mover la ubicación del grupo (B)**,
  revelar mapa/POIs/bestiario, pedir tiradas, controlar iniciativa, reloj.
- Contenido sensible ya cubierto por RLS (tiradas privadas, crónica oculta);
  la nota conocida de `dm_notes` legible por consola sigue aceptada (ver
  HANDOFF, milestone 2026-07-10).

---

## FASE M — Caja de herramientas IA del DM 🤖

**Objetivo**: la IA trabaja PARA el DM — genera contenido que el DM retoca y
aprueba. Multiplica todas las demás fases: se implementa **primero** entre
las M–Q.

- **Generadores en formularios DM existentes**: botón "✨ Generar con IA" en
  los formularios de NPC (nombre, personalidad, prompt, secretos), tienda
  (tendero + catálogo con precios PHB), encargo de tablón (gancho +
  recompensa) y **documento in-game**. La IA (vía `/api/ia`) devuelve JSON
  que rellena el formulario; el DM edita y guarda como siempre. Con el túnel
  caído, el botón se desactiva — los formularios manuales no dependen de él.
- **Documentos in-game**: objeto legible `{ titulo, texto, imagen? }` dentro
  del item (campo `doc` en el jsonb de `items` — sin migración). El DM lo
  crea/genera y lo **entrega vía Baúl**; el jugador lo abre desde su
  inventario en un visor estilo pergamino (cartas, contratos, mapas del
  tesoro, páginas de diario). Pistas tangibles.
- **Memoria de NPC**: al cerrar una conversación con un NPC IA, la propia IA
  resume lo hablado en 2-3 frases; el resumen se persiste **por NPC +
  jugador** (tabla `npc_memories`: npc_ref, user_id, summary, updated_at —
  entra en la migración agrupada) y se inyecta al system prompt la próxima
  vez → el NPC recuerda. El DM ve y edita todas las memorias desde el editor
  de NPCs.

---

## FASE N — Mundo vivo: clima, saber y rumores 🌍

**Objetivo**: el mundo reacciona al reloj y **no todos los personajes saben
lo mismo** — la historia del mundo se gana con estudio, tiradas o juego.

- **Clima por región + estación**: derivación **pura** del reloj de campaña
  (mismo patrón que `lib/gameClock.ts`, sin migración): cada día de juego y
  región tiene clima coherente y determinista (semilla = día+región; los
  Yermos nievan, Marquet abrasa, costa con tormentas en otoño). Visible en
  `/lugar` y como icono junto al reloj del nav; se inyecta al contexto de
  los NPCs IA para que lo comenten.
- **Saber del mundo por personaje** — la lore de `/reino` se estratifica en
  tres niveles:
  1. **Común**: lo que cualquier habitante sabe. Visible para todos.
  2. **Erudito**: desbloqueo **automático por pericias del PJ** —
     **Historia** → eras antiguas y Calamidad; **Arcanos** → planos y
     magia; **Religión** → panteón profundo; **Naturaleza** → tierras
     salvajes y Ashari. El mago estudioso lee lo que el bárbaro ni sospecha.
     (Datos: campo `tier` + `unlockSkill` en las entradas de lore de
     `data/cosmology.ts`/`taldorei.ts`; derivación desde la ficha con
     `derive` — sin migración.)
  3. **Secreto**: solo lo revela el DM (como los POIs, flag en
     `app_config.lore_revealed`) **o una tirada de saber in situ**: al
     visitar un lugar, botón "¿Qué sé de esto?" → tirada de
     Historia/Arcanos/Religión con los dados 3D → por tramos de total se
     revela lore extra de ese lugar (se persiste lo desbloqueado — cada
     tirada de saber es única por lugar+PJ, misma filosofía que la Fase K).
- **Pistas y rumores**: registro de pistas `{ texto, misión?, lugar?,
  descubierta_por }` en `app_config.clues` (JSON, volumen bajo). Las revela
  el DM a mano **o las siembra como rumores con peso** en NPCs IA (Garda las
  deja caer en la taberna). Pista descubierta → aparece en la Crónica ligada
  a su misión.

---

## FASE O — Libro de conjuros 📖

**Objetivo**: los lanzadores juegan completos — preparar conjuros, gastar
huecos, recuperarlos al descansar. El hueco mecánico más grande de la app.

- **Datos**: conjuros del **SRD 5.2 (CC-BY-4.0)** en `data/spells/` (por
  nivel: `cantrips.ts`, `level1.ts`, …): nombre ES/EN, nivel, escuela,
  tiempo, alcance, componentes, duración, mecánica de daño/efecto (dados,
  salvaciones, CD) — hechos de juego; **descripción = redacción propia**
  breve en español (misma convención que el bestiario). Listas por clase.
- **Reglas por clase**: conocidos/preparados según 2024 —
  `data/classdata/` ya tiene progresión y `spellSlots.ts` los huecos
  (full/half/pact): la mitad del trabajo está hecho.
- **Hoja › pestaña "Conjuros"**: trucos + preparados del día, **gastar un
  hueco con un tap** (contador por nivel), lanzar → tirada de ataque de
  conjuro o CD de salvación calculadas por `derive`. Estado en
  `characters.spell_state` (jsonb: preparados + huecos gastados —
  migración agrupada). El **descanso largo (Fase D) restaura los huecos**
  de verdad; el corto restaura pacto (brujo).
- **DM**: ve conjuros y huecos de todos en Grupo; concede pergaminos vía
  Baúl. Verificación con `scripts/check-spells.ts` (conteos por clase/nivel,
  CDs coherentes).

---

## FASE P — Downtime y minijuegos 🎲🍺

**Objetivo**: tiempo muerto con sustancia — el jugador hace cosas útiles o
se juega el oro en la taberna, solo desde casa.

- **Actividades de descanso 2024** (sección en `/lugar`): **trabajar** (oro
  por día según pericia), **investigar** (revela una pista de la Fase N si
  hay disponibles en el lugar), **socializar** (crea/refuerza memoria de NPC
  de la Fase M + puede soltar rumor), **entrenar** (progreso hacia una
  herramienta/idioma, días acumulados). Cada actividad cuesta horas/días del
  reloj vía el endpoint de la Fase D y deja nota automática en la Crónica.
- **Minijuegos de taberna** (apuestas con el oro real de la ficha, movido
  por el mismo endpoint):
  1. **Dados del mentiroso / apuestas**: contra un NPC IA (que farolea por
     prompt) o entre jugadores, con los dados 3D de la Fase A.
  2. **Pulso**: tiradas de FUE enfrentadas al mejor de 3, con apuesta.
  3. **Acertijo del tablón**: enigma semanal del DM (o generado por la Fase
     M); la primera respuesta correcta se lleva el premio.
- Anti-ruina simple: límite de apuesta configurable por el DM
  (`app_config`), y todo movimiento de oro queda logueado (como shop_log).

---

## FASE Q — Misiones personales con IA + visiones 🔮

**Objetivo**: el pasado de cada personaje vuelve a buscarle — aventuras en
solitario jugadas por chat IA, con recompensas acotadas por el DM.

- **Creación**: el DM crea (o **genera con la Fase M**) una misión personal
  ligada al **trasfondo e historia del PJ** — el system prompt recibe la
  historia personal (campo `lore` de 12000 chars que ya existe en
  `characters`), su trasfondo, clase y nivel. Campos: título, gancho,
  objetivo oculto, **presupuesto cerrado** `{ xpMax, oroMax, objetos? }`.
- **Juego**: chat IA privado (patrón `/narrador`, pero por misión y con su
  propio hilo persistido). La IA narra dentro del presupuesto; las tiradas
  se hacen con los dados 3D y quedan en el feed como privadas.
- **Cierre**: al terminar, resumen automático al DM (cola de aprobación en
  Panel DM): aprueba/ajusta recompensas → se aplican vía `/api/dm/character`
  y la misión pasa a la Crónica (visible u oculta, a elección).
- **Visiones**: momentos clave de la misión disparan el **EpicOverlay
  individual que ya existe** (visión cinemática solo para ese jugador). El
  DM puede además programar visiones sueltas (sin misión) — sueños,
  presagios, llamadas del patrón del brujo.
- Datos: columnas en `quests` (`assignee`, `solo boolean`, `budget jsonb`,
  `thread jsonb`) o tabla propia `solo_quests` — decidir en el plan de la
  fase (migración agrupada).

---

## FASE G — Capa gráfica transversal ✨🎨

En cualquier momento tras la Fase A. La app es muy de texto; esta fase la
hace **gráfica**: más imagen, más animación, menos párrafo.

**Inventario de arte por página** (origen mixto: las piezas clave las sube
el usuario — vía Fase H/Storage o `public/` —, el relleno se genera con IA;
**cero arte oficial con copyright**):

| Página | Arte |
|---|---|
| `/` (home) | fondo/héroe ilustrado con parallax ligero |
| `/reino` | cabecera por era + viñeta por continente/facción |
| `/crear` | retratos de especie/clase pendientes (backlog viejo) + fondos de capítulo del tomo |
| `/personaje` | marco ornamental de hoja, iconos de hueco del paperdoll |
| `/mapa` | ya gráfico — pulir niebla animada y marcadores |
| `/lugar` (B) | cabecera del POI + iconos de servicio (tienda/posada/NPC/tablón) |
| `/taberna` y NPCs (E) | retrato por NPC (campo `portrait` ya previsto) |
| `/cronica` | viñetas por entrada de diario, sellos por estado de misión |
| `/bestiario` | silueta/ilustración por tipo de criatura |

**Animaciones** (ordenadas por impacto):

1. Feed de dados y crónica con animaciones de entrada (CSS, sin librerías).
2. Crítico/pifia con efecto en pantalla completa breve (destello).
3. Transiciones de página suaves (View Transitions API de Next si estable, o
   CSS) — ojo AGENTS.md: verificar API en docs de Next 16.
4. `/lugar` con ambientación: imagen de cabecera con gradiente, iconos de
   servicio animados al hover.
5. Mapa: pulso suave en la ubicación actual del grupo; trazo animado de viaje
   cuando el DM mueve `party_location`; niebla que se disipa al revelar.
6. Sonidos opcionales (dados, compra, campana de posada) con toggle global
   persistido — apagados por defecto.
7. Apertura/cierre del tomo de `/crear` con más teatro (ya gira; añadir
   polvo/brillo sutil).

**Directrices**: `next/image` con tamaños explícitos (sin CLS), lazy por
defecto, presupuesto ~200 KB por imagen de cabecera, y **todo** respeta
`prefers-reduced-motion` (igual que el fallback de la Fase A).

---

## Backlog recomendado (sin fase asignada)

- **PG actuales y condiciones en vivo**: la hoja solo tiene PG máximos.
  Tracker de PG actuales/temporales + condiciones 2024 (envenenado, agarrado,
  derribado…), editable por el DM y el propio jugador, visible en el tablero
  de batalla (I); la posada (D) restauraría PG de verdad. Encaja como parte
  de I o mini-fase previa.
- **Modo espectador/TV**: ruta de solo lectura (mapa + reloj + feed de dados
  + iniciativa, sin controles) para compartir pantalla en la tele durante la
  sesión semivirtual.

---

## Orden y dependencias

```
A (dados 3D) ──► K (stats con dados) ─────► I (tablero de batalla)
A ─────────────────────────────────────────► I ▲
H (subida de imágenes) ───► I                   │
                      └───► J (bestiario) ──────┘
                      └───► G (arte de la capa gráfica)
B (ubicación) ──► C (tiendas) ──► D (posada) ──► P (downtime/minijuegos)
              └─► E (NPCs) ──► M (IA del DM) ──► Q (misiones personales)
              └─► F (tablón)                └──► N (mundo vivo)
O (conjuros) — independiente y grande; en paralelo cuando se quiera
L (acceso por rol) — pequeña e independiente, cuanto antes
G (capa gráfica) — transversal, en cualquier momento tras A
```

- **A primero**: impacto inmediato, sin dependencias, toca solo el sistema de
  dados.
- **K tras A**: la tirada de stats usa los dados 3D (sin A funcionaría con el
  fallback aleatorio, pero pierde el espectáculo que la justifica).
- **L cuanto antes**: cierra `/narrador` a jugadores; media tarde, sin
  dependencias.
- **H pronto**: desbloquea el campo `image` del editor de región (hueco
  conocido), los retratos pendientes del vault, el arte de G y es
  prerequisito de I y J.
- **B es la base** de C–F (todas viven en `/lugar`); el acceso de jugadores a
  los NPCs con IA (E) queda **acotado por la ubicación del grupo** que fija
  el DM en B — coherencia narrativa por diseño.
- C y E comparten el patrón "NPC con prompt + IA" — implementar C primero y
  extraer el chat reutilizable para E.
- **I necesita A + H** (dados para iniciativa, Storage para battlemaps/tokens);
  **J necesita H** (arte) y los PDFs del usuario; I y J se enriquecen
  mutuamente (tokens de monstruo) pero pueden ir en cualquier orden.
- **M antes que N/P/Q**: sus generadores y la memoria de NPC multiplican las
  otras tres (P socializa contra memorias, Q se genera con M, N siembra
  rumores en NPCs). Necesita E (los NPCs tienen que existir).
- **N/P/Q**: P depende de D (endpoint de descanso/oro) y B (`/lugar`);
  Q depende de M + trasfondos (ya existen); N solo de B para el botón de
  saber in situ (el clima y los niveles de lore van solos).
- **O (conjuros)** no depende de nada: datos + hoja + `derive`. Grande —
  puede avanzar en paralelo por lotes (como el bestiario).
- Migraciones: `schema_v13` agrupa C+E+F **+ `stat_rolls` (K)**; `schema_v14`
  agrupa I + `npc_memories` (M) + `spell_state` (O) + misiones personales
  (Q) (+ tabla de bestiario de J si se opta por DB). Dos pasadas de SQL
  Editor en total.
- **Base de reglas**: todo el proyecto ya implementa D&D 2024 (5.5E) — tablas
  de nivel/XP, point-buy, ASI, encuentros DMG 2024, bestiario MM 2024. Las
  fases nuevas siguen esa misma base; no hay trabajo de "migrar reglas".

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
