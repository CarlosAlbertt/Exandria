# Tal'Dorei — Compañero de Campaña

App web para la próxima campaña de **Dungeons & Dragons** ambientada en el
continente de **Tal'Dorei** (Exandria), con reglas de la edición **2024**.

## Qué incluye

- **Creador de personaje** (`/crear`): especies y linajes, clases y subclases,
  trasfondos, aptitudes por compra de puntos (27) con bonus de trasfondo,
  pericias de clase y trasfondo, y hoja en vivo. Se guarda en `localStorage`.
- **El Reino** (`/reino`): historia, las ocho regiones, panteón de Exandria y facciones.
- **Mapa interactivo** (`/mapa`): enclaves clicables sobre el continente.
- **Inicio** (`/`): portada.

## Añadir la imagen del mapa

Coloca tu imagen del mapa de Tal'Dorei en `public/mapa.jpg`. Aparecerá de fondo
en `/mapa`. Las posiciones de los pines se ajustan en `data/taldorei.ts`
(campo `map: { x, y }`, en % sobre la imagen).

## Multijugador (Supabase) — puesta en marcha

La app es ahora una herramienta multiusuario en tiempo real con roles **DM**
(admin) y **jugador**.

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor** → pega y ejecuta `supabase/schema.sql` (tablas, RLS, Realtime).
3. Copia `.env.example` a `.env.local` y rellena:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings > API)
   - `SUPABASE_SERVICE_ROLE_KEY` (solo servidor; para crear usuarios)
4. Crea el primer DM: **Authentication > Users > Add user** con email
   `admin@taldorei.local` y una contraseña. Luego en SQL:
   `update public.profiles set role='dm' where username='admin';`
5. `npm run dev`, entra como `admin`, y crea al resto desde **Panel DM > Usuarios**.

### Qué hace en tiempo real (Supabase Realtime = WebSocket)
- **Roles:** el DM ve el Panel DM y todas las regiones; el jugador solo lo
  conocido/explorado.
- **Exploración:** el DM marca regiones como conocidas/exploradas y el mapa y el
  lore se actualizan al instante para todos.
- **Narración épica:** el DM genera/escribe una narración y se proyecta a la vez
  en la pantalla de todos los jugadores (`live_session` + Realtime).

## Narrador IA (Ollama)

`/narrador` habla con una IA **local** vía [Ollama](https://ollama.com) — sin
claves ni servicios externos. Elige el modelo en la propia página (por defecto
`llama3.1:8b`; modelos pequeños como `llama3.2:3b` son rápidos pero menos
coherentes) y descárgalo con `ollama pull <modelo>`.

El DM recibe como contexto la guía de narración y el lore de Tal'Dorei desde
`lore/*.md`, seleccionando las secciones relevantes a cada escena. Edita esos
`.md` para ajustar el estilo o ampliar el mundo. Variables: `OLLAMA_MODEL`,
`OLLAMA_HOST`.

## Datos del juego

Las mecánicas (dados de golpe, aptitudes, pericias, listas de subclases, etc.)
viven en `data/`. Las descripciones son resúmenes originales: esta es una
herramienta de fans no oficial y **no reproduce el texto de los libros**.
Consulta el Manual del Jugador 2024 y *Tal'Dorei: Escenario de Campaña Renacido*
para las reglas y el lore completos.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

Stack: Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · TypeScript.
