# Exandria — Compañero de Campaña

App web para la próxima campaña de **Dungeons & Dragons** en el mundo de
**Exandria**, ambientada en el continente de **Tal'Dorei**, con reglas de la
edición **2024**.

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

El narrador habla con una IA **local** vía [Ollama](https://ollama.com) — sin
claves ni servicios externos. La llamada se hace **desde el navegador** de quien
narra, así que funciona también con la app desplegada en Vercel (la IA corre en
tu propia máquina, no en el servidor). Elige el modelo en la página (por defecto
`llama3.1:8b`) y descárgalo con `ollama pull <modelo>`.

La guía de narración y el lore viven en `data/loreText.ts`; el cliente
selecciona las secciones relevantes a cada escena y las inyecta en el prompt.

Para que el navegador pueda llamar a Ollama, permite el origen al arrancarlo:

```bash
# macOS/Linux
OLLAMA_ORIGINS=* ollama serve
# Windows (PowerShell)
$env:OLLAMA_ORIGINS="*"; ollama serve
```

(En producción, restringe `OLLAMA_ORIGINS` a tu dominio de Vercel.)

## Desplegar en Vercel

1. Sube el repo a GitHub (ya está) e impórtalo en [vercel.com](https://vercel.com).
2. En **Settings > Environment Variables** añade:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y
   `SUPABASE_SERVICE_ROLE_KEY` (esta última solo en Vercel, nunca en el cliente).
3. Deploy. Login, roles, exploración y narración (manual y por IA local) funcionan.
4. Para la IA: arranca Ollama en tu equipo con `OLLAMA_ORIGINS` apuntando a tu
   dominio de Vercel (o `*` para pruebas).

## Imágenes de personaje

Los retratos son opcionales; sin ellos se ve un marco con icono. Para añadirlos,
suelta los `.jpg` (o `.png`/`.webp`) en:

- `public/species/<slug>.jpg` — retrato de especie (slug = campo `slug` en `data/species.ts`).
- `public/species/lineages/<slug-linaje>.jpg` — retrato de linaje.
- `public/classes/<slug>.jpg` — retrato de clase (slug en `data/classes.ts`).

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
