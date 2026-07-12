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
A (dados 3D)  ──────────────────────────┐
B (ubicación) ──► C (tiendas) ──► D (posada)   G (polish, transversal)
              └─► E (NPCs)                      
              └─► F (tablón)
```

- **A primero**: impacto inmediato, sin dependencias, toca solo el sistema de
  dados.
- **B es la base** de C–F (todas viven en `/lugar`).
- C y E comparten el patrón "NPC con prompt + IA" — implementar C primero y
  extraer el chat reutilizable para E.
- Migración `schema_v13` agrupa lo de C+E+F (una sola pasada de SQL Editor).

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
