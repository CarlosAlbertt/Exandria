# Fase D — Posada: descansos que mueven el reloj 🛏️

**Fecha**: 2026-07-17 · **Estado**: diseño (autónomo) + plan, pasa a implementación.

## Objetivo
El jugador descansa sin el DM, con coste (oro) y efecto (avanza el reloj de
campaña). Vive en `/lugar` (Fase B), en los POIs con posada (`Poi.services.posada`).

## Problema técnico y solución
`advanceGame` escribe `app_config.campaign_clock` (RLS DM-only). El descanso del
jugador necesita privilegio → **endpoint `app/api/descanso/route.ts`** con
`service_role` (patrón de `/api/dm/character`): jugador autenticado; el servidor
cobra el oro de su ficha activa, avanza el reloj, y aplica el anti-abuso. Sin
migración (usa `app_config` + `characters`).

## Alcance
- **Descanso corto**: +1 h de juego, gratis.
- **Descanso largo**: +8 h de juego, coste por tipo de cama. **Anti-abuso**: al
  menos **20 h de juego** entre descansos largos (aprox. «uno por día», sin
  aritmética de calendario) — se guarda el minuto del último largo en
  `app_config.last_long_rest`.
- **Precios FIJOS** por ahora (`lib/descanso.ts`): corto 0, cama común 5 po,
  habitación 20 po. *Configurable por POI → diferido* (evita tocar el tipo
  `services.posada`, hoy booleano).
- **UI**: sección **Posada** en `/lugar` (solo si `poi.services.posada`): botón
  descanso corto; descanso largo con selector común/habitación + confirmación.
  Muestra el oro y lo actualiza tras descansar.

## Diferido (YAGNI / dependencias)
- **Nota automática en la Crónica** ("El grupo pasó la noche en…") → luego (evita
  fijar el shape de `journal_entries` a ciegas sin sesión de prueba).
- **Reset del flag de regateo** (Fase C2, aún no existe) y **restaurar PG
  actuales** (no se trackean aún).
- **Precios por POI** en el editor → cuando se generalice `services.posada`.

## Endpoint `app/api/descanso/route.ts` (nodejs, service_role)
Body: `{ kind: "corto" | "largo", room?: "comun" | "habitacion" }`.
1. `createClient()` → `auth.getUser()`; si no, 401. (Cualquier jugador autenticado.)
2. `createAdminClient()`. Carga la ficha activa (`characters` where `user_id`,
   `archived_at is null`). Coste = tabla fija (corto 0; largo comun/habitacion).
   Si `gold < coste` → 400 "No tienes oro suficiente".
3. Lee `app_config.campaign_clock`; `nowGameMin = running ? floor(epochGameMin +
   (now-epochRealMs)/msPerGameMin) : floor(epochGameMin)`.
4. Si `largo`: lee `app_config.last_long_rest` (int minuto); si
   `nowGameMin - last < 1200` (20 h) → 400 "El grupo ya descansó hace poco".
5. Cobra: `characters.update gold = gold - coste`. Avanza reloj: upsert
   `campaign_clock` con `epochGameMin = nowGameMin + (corto?60:480)`,
   `epochRealMs = now`. Si `largo`: upsert `last_long_rest = nowGameMin + 480`.
6. Devuelve `{ ok, gold }`.

## Cliente
- `lib/descanso.ts`: `PRECIOS` + `descansar(kind, room?)` → `POST /api/descanso`,
  devuelve `{ ok, gold } | { ok:false, error }`.
- `components/lugar/PosadaSection.tsx`: si hay posada, carga oro de la ficha
  activa, botones (corto / largo+room), confirm, llama `descansar`, muestra
  resultado y el nuevo oro. Se monta en `app/lugar/page.tsx` bajo `ShopSection`.
- `components/lugar/ServiceSections.tsx`: quitar la tarjeta placeholder «Posada».

## Verificación
`tsc` + `build`. Sin sesión en dev → prueba del usuario: en un POI con posada,
descanso corto (avanza 1 h), largo (cobra, avanza 8 h, bloquea el segundo
seguido). Sin migración.
