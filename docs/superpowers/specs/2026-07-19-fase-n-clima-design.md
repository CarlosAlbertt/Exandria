# Fase N (parte 1) — Clima por región y estación 🌦️ (diseño)

**Fecha**: 2026-07-19 · **Rama**: `fase-n-clima`

## Contexto
La Fase N de la guía tiene tres piezas: (1) **clima** por región+estación, (2)
**saber del mundo por personaje** (lore estratificada en común/erudito/secreto),
(3) **pistas y rumores** (`app_config.clues`). Esta sesión hace solo (1).

## Alcance de esta sesión: solo el clima
Es lo autocontenido y **sin migración**: derivación **pura** del reloj (patrón de
`lib/gameClock.ts`), determinista por día+región, mostrada en `/lugar` y en el nav
e inyectada al contexto de los NPCs IA.

**Diferido**:
- **Saber del mundo por pericia**: reestructura la lore de `data/cosmology.ts`/
  `taldorei.ts` con `tier`/`unlockSkill` y toca `/reino` + `derive`. Feature
  grande propia (N-saber).
- **Pistas/rumores**: registro en `app_config.clues` + siembra en NPCs. Medio,
  su propia sesión (N-pistas).

## Modelo (`lib/weather.ts`, puro)
- **Zonas climáticas**: `templado | frio | arido | costero | humedo | brumoso`.
  Cada zona tiene una tabla por **estación** (las 4 de `data/cosmology.ts`) con
  varias condiciones `{ condition, icon, temp }`.
- **Región → zona**: mapa explícito para las 8 regiones de Tal'Dorei; si no,
  **heurística por palabras** del slug/nombre (montaña→frío, costa/litoral→
  costero, desierto→árido, bosque/verdante→húmedo, bruma/niebla→brumoso); si no,
  **por continente** (Marquet→árido, Wildemount→frío, Dientes Rotos→húmedo, resto
  templado); por defecto templado. Así las regiones nuevas del atlas también
  reciben un clima sensato.
- **Determinismo**: `weatherFor(continent, regionSlug, regionName, moment)` toma
  la tabla de la zona+estación y elige por **semilla** = hash de
  `regionSlug|year|dayOfYear` (mismo clima todo el día de juego; cambia al día
  siguiente). `regionName` opcional (el nav no lo tiene).
- **`ambientLine(weather, season)`**: una frase corta para inyectar al system
  prompt de los NPCs («solo menciónalo si viene a cuento»).

## Integración
- **`/lugar`**: badge de clima bajo la cabecera del POI (icono + condición +
  temperatura + estación). Calcula `moment` con `useGameClock`.
- **Nav** (`PartyLocationWidget`): icono + temperatura del clima actual del lugar
  del grupo, junto al 📍.
- **NPCs IA**: `/lugar` pasa `ambient` (la frase) a `ShopSection` y `NpcSection`,
  que la añaden al persona del tendero / del PNJ. Con el túnel caído no cambia
  nada (es solo texto en el prompt).

## Verificación
`npx tsc --noEmit` + `npx next build` limpios. Sin sesión en dev no se prueba en
vivo; prueba del usuario: fijar ubicación y ver el clima en `/lugar` y el nav.
