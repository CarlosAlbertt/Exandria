# Plan — Calendario exandriano en tiempo real

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Reloj de juego que corre solo (10 min reales = 1 h de juego), sincronizado en vivo por Supabase, con controles del DM y widget en la barra. Corre por defecto.

**Architecture:** Fuente única `campaign_clock` (JSON en `app_config`, sin migración). Derivación pura en `lib/gameClock.ts`. Hook `lib/useGameClock.ts` (Realtime + tick de 1 s en cliente). Panel DM `RelojPanel` + widget `ClockWidget` en `SiteNav`. Crónica lee la fecha del reloj.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase. Español.

Ver diseño: `docs/superpowers/specs/2026-07-11-atlas-y-calendario-design.md`.

---

## Contexto (verificar leyendo)

- `data/cosmology.ts`: `CALENDAR` (`months: string[]` 11 nombres, `weekdays: string[]` 7, `yearDays: 328`, `era: "PD"`, `currentYear: 836`), `SEASONS` (name/start/days/blurb), `HOLIDAYS`, `MOONS`.
- `lib/gameDate.ts`: `parseGameDate(text)`, `isHolidayDate`, `holidayFor(text)` → Holiday|null. Formato fecha "D de Mes, AAAA PD".
- `app_config` (schema_v5): columnas `key`/`value` (text), upsert on conflict key. Patrón lectura/escritura: `app/dm/AiConfigPanel.tsx` (ollama_host) y `lib/useChronicle.ts` (campaign_date, con Realtime filtrado por key).
- Hooks Realtime house pattern: `lib/useDiceFeed.ts` (supabaseConfigured guard, canal con sufijo aleatorio, cleanup, mutaciones module-level `{ error }`).
- `components/SiteNav.tsx`: barra de navegación (BASE_LINKS, label-only). `useRole()`/`useSession()` en `components/SessionProvider.tsx`.
- `app/dm/DmDashboard.tsx`: patrón de pestañas (`Tab` union + botones + render condicional). `app/cronica/CronicaView.tsx` y `app/dm/CronicaPanel.tsx`: usan `campaign_date` (via `useChronicle`).

Verificación por tarea: `npx tsc --noEmit` + (si UI) `npm run build`. Commits español, autor `CarlosAlbertt <CarlosAlbertt@users.noreply.github.com>`, coautoría `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Longitudes de mes + derivación pura `lib/gameClock.ts`

**Files:** Modify `data/cosmology.ts`; Create `lib/gameClock.ts`; Test `scripts/check-clock.ts`.

- [ ] **Step 1**: en `CALENDAR` (data/cosmology.ts) añadir `monthDays: number[]` con las longitudes reales exandrianas, en el mismo orden que `months`:
  `[29, 30, 30, 31, 28, 31, 32, 29, 27, 29, 32]` (Horisal…Duscar, Σ=328). Comentario: suma 328 = `yearDays`.
- [ ] **Step 2**: `lib/gameClock.ts` (puro, sin React/Supabase):

```ts
import { CALENDAR, SEASONS, MOONS } from "@/data/cosmology";
import { holidayFor } from "@/lib/gameDate";

export type GameMoment = {
  year: number; monthIndex: number; monthName: string; day: number; // día del mes (1..)
  hour: number; minute: number; weekdayName: string;
  dayOfYear: number;                 // 1..328
  season: string;                    // nombre de SEASONS
  moonPhase: string; moonIcon: string; // fase de Catha
  holiday: string | null;            // nombre de festividad activa o null
  dateStr: string;                   // "D de Mes, AAAA PD"
};

const MINUTES_PER_DAY = 24 * 60;
const YEAR_DAYS = CALENDAR.yearDays;           // 328
const YEAR_MINUTES = YEAR_DAYS * MINUTES_PER_DAY;

// gameMinAbs = minutos absolutos desde el año 0 PD, día 1, 00:00.
export function momentFromGameMin(gameMinAbs: number): GameMoment { /* ver reglas */ }
export function gameMinFromMoment(year: number, monthIndex: number, day: number, hour: number, minute: number): number { /* inversa */ }
```

Reglas:
- `year = floor(gameMinAbs / YEAR_MINUTES)`; resto → `minInYear`. `dayOfYear = floor(minInYear/MINUTES_PER_DAY)` (0-based) `+1`.
- Mes/día: recorrer `CALENDAR.monthDays` restando hasta ubicar `day` (1-based) y `monthIndex`.
- `hour/minute` del resto intradía.
- `weekdayName`: `CALENDAR.weekdays[ floor(gameMinAbs/MINUTES_PER_DAY) % 7 ]` (ciclo continuo).
- `season`: parsear `SEASONS[].start` ("13 de Dualahei"…) a día-del-año con `monthDays` y elegir la estación cuyo rango [start, start+days) contiene `dayOfYear` (envolver por fin de año).
- `moonPhase`: Catha ciclo 33 días. `phaseIdx = floor(((floor(gameMinAbs/MINUTES_PER_DAY) % 33) / 33) * 8) % 8`. 8 nombres: `["Luna nueva","Creciente","Cuarto creciente","Gibosa creciente","Luna llena","Gibosa menguante","Cuarto menguante","Menguante"]`; iconos FA: `["fa-circle","fa-moon","fa-circle-half-stroke","fa-moon","fa-circle","fa-moon","fa-circle-half-stroke","fa-moon"]` (aprox; el llena/nueva con `fa-circle`).
- `dateStr = \`${day} de ${monthName}, ${year} PD\``.
- `holiday = holidayFor(dateStr)?.name ?? null`.
- `gameMinFromMoment`: inversa exacta (año×YEAR_MINUTES + días previos del mes + (day-1)×MINUTES_PER_DAY + hour×60 + minute).

- [ ] **Step 3**: `scripts/check-clock.ts` (mantener). Asserts:
  - `momentFromGameMin(gameMinFromMoment(836,0,1,8,0))` → year 836, monthIndex 0, monthName "Horisal", day 1, hour 8, minute 0.
  - Ida y vuelta para varias fechas (round-trip = identidad).
  - Día del año de "1 de Misuthar" = 30 (Horisal tiene 29) → monthIndex 1 day 1 dayOfYear 30.
  - `momentFromGameMin` de una fecha en 20 de Dualahei devuelve holiday "Esplendor Salvaje" (existe en HOLIDAYS) — usar `gameMinFromMoment(836, 2, 20, 12, 0)` (Dualahei = index 2).
  - Estación de 1 de Horisal = "Invierno" (Víspera Yerma…); comprobar que devuelve una estación de SEASONS válida.
  - moonPhase ∈ los 8 nombres.
- [ ] **Step 4**: `npx tsc --noEmit` + `npx tsx scripts/check-clock.ts` pasa.
- [ ] **Step 5**: commit `feat: reloj de juego — longitudes de mes y derivación del calendario`.

### Task 2: Fuente del reloj + hook `lib/useGameClock.ts`

**Files:** Create `lib/useGameClock.ts`.

- [ ] **Step 1**: tipos y default:

```ts
export type CampaignClock = { epochRealMs: number; epochGameMin: number; running: boolean; msPerGameMin: number };
export const CLOCK_KEY = "campaign_clock";
export const MS_PER_GAME_MIN = 10000; // 10 s reales = 1 min juego → 10 min = 1 h
// default: 836 PD, 1 de Horisal, 08:00, corriendo.
```

- [ ] **Step 2**: `useGameClock()`:
  - Estado `clock: CampaignClock | null`, `ready`. Carga inicial de `app_config` key `campaign_clock`; si no existe, usa default **y lo persiste** (upsert) para fijar epoch la primera vez (arranca corriendo). Suscripción Realtime filtrada por `key=eq.campaign_clock` (patrón `useChronicle` campaign_date).
  - `nowGameMin`: estado numérico; `useEffect` con `setInterval(1000)` que, si `clock.running`, recalcula `clock.epochGameMin + (Date.now() - clock.epochRealMs)/clock.msPerGameMin`; si pausado, `clock.epochGameMin`. Limpia intervalo en cleanup y cuando cambia `clock`.
  - Devuelve `{ clock, nowGameMin, ready }`.
- [ ] **Step 3**: mutaciones module-level (DM; RLS de app_config ya es escritura DM-only), todas `{ error }`:
  - `async function writeClock(c: CampaignClock)`: upsert app_config.
  - `setClockRunning(running)`: si pausa → congelar (`epochGameMin = nowGameMin actual`, `epochRealMs = now`); si reanuda → `epochRealMs = now`, mantener `epochGameMin`. (Recibe el `nowGameMin` actual como argumento o recalcula leyendo primero.)
  - `advanceGame(minutes)`: leer clock actual, `epochGameMin += minutes`, `epochRealMs = now` (mantiene running).
  - `setGameDateTime(gameMinAbs)`: `epochGameMin = gameMinAbs`, `epochRealMs = now`.
  Implementación: leer fila actual (o recibir clock como parámetro) para no perder `running`/`msPerGameMin`.
- [ ] **Step 4**: `npx tsc --noEmit` limpio.
- [ ] **Step 5**: commit `feat: fuente y hook del reloj de campaña (Realtime + tick 1s)`.

### Task 3: Widget en la barra + bloque grande

**Files:** Create `components/ClockWidget.tsx`; Modify `components/SiteNav.tsx`.

- [ ] **Step 1**: `ClockWidget.tsx` (`"use client"`): usa `useGameClock()` + `momentFromGameMin(nowGameMin)`. Variante compacta (prop `compact`): icono de luna + "D Mes · HH:MM" (hora con `String(h).padStart(2,'0')`). Variante grande: día de semana, fecha completa, hora, estación, fase de luna (nombre+icono), y si hay festividad un chip acento. Si `!ready` no romper (placeholder discreto).
- [ ] **Step 2**: montar el widget compacto en `SiteNav.tsx` (junto al logo o al final de los links, según encaje; reportar dónde). No romper el layout móvil.
- [ ] **Step 3**: `npm run build` + eslint limpios. Preview: `/login` sin errores de consola.
- [ ] **Step 4**: commit `feat: widget de reloj exandriano en la barra`.

### Task 4: Panel DM "Tiempo" (`RelojPanel`)

**Files:** Create `app/dm/RelojPanel.tsx`; Modify `app/dm/DmDashboard.tsx`.

- [ ] **Step 1**: `RelojPanel.tsx`: muestra el `ClockWidget` grande + controles:
  - Botón play/pausa (`setClockRunning`).
  - Botones: +1 h (`advanceGame(60)`), +Descanso corto (`advanceGame(60)`, etiqueta distinta), +Descanso largo (`advanceGame(480)`), +1 día (`advanceGame(1440)`).
  - Fijar fecha/hora: selects de mes (CALENDAR.months), día (1..monthDays[mes]), inputs año y hora:minuto → `setGameDateTime(gameMinFromMoment(...))`.
  - Línea de error compartida (los `{ error }`).
- [ ] **Step 2**: registrar pestaña "Tiempo" (icono `fa-clock`) en `DmDashboard.tsx` siguiendo el patrón (añadir al `Tab` union, botón, render).
- [ ] **Step 3**: `npm run build` + eslint limpios.
- [ ] **Step 4**: commit `feat: panel DM de tiempo (play/pausa, descansos, fijar fecha)`.

### Task 5: La Crónica usa la fecha del reloj

**Files:** Modify `app/cronica/CronicaView.tsx`, `app/dm/CronicaPanel.tsx`, `lib/useChronicle.ts`.

- [ ] **Step 1**: `CronicaView` deja de mostrar `campaignDate` de texto libre; usa `useGameClock()` + `momentFromGameMin(nowGameMin).dateStr` para la cabecera y `holidayFor(dateStr)` para el banner (o el `moment.holiday`). 
- [ ] **Step 2**: en `CronicaPanel`, retirar el input manual "Fecha de campaña" (o sustituir por una nota "Ajusta el tiempo en la pestaña Tiempo"). No romper el resto del panel (misiones/diario/PNJs intactos).
- [ ] **Step 3**: en `useChronicle`, retirar `campaignDate`/`setCampaignDate` si quedan sin uso (o dejar deprecado con comentario). No romper otros consumidores — grep antes.
- [ ] **Step 4**: `npm run build` + eslint + `npx tsc --noEmit` limpios.
- [ ] **Step 5**: commit `feat: la crónica muestra la fecha del reloj de campaña`.

## Cierre

- [ ] Actualizar `HANDOFF.md`: nueva pestaña DM "Tiempo", widget de reloj, ritmo 10 min reales = 1 h juego, `campaign_clock` en app_config, `campaign_date` deprecado.
- [ ] `npm run build` final limpio.

## Fuera de alcance
- Sincronización de la fase de Ruidus (solo Catha).
- Persistir historial de saltos de tiempo.
- Ritmo configurable en UI (fijo 10s/min; el campo `msPerGameMin` existe por si acaso).
