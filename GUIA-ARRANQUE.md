# Guía de arranque — Exandria (tras apagar el PC)

Cada vez que **reinicias el ordenador**, la IA (Ollama) y el túnel se apagan, y
el túnel gratis **cambia de URL**. La app web (Vercel) y la base de datos
(Supabase) siguen funcionando solas; lo único que hay que relevantar es la IA.

> Si no vas a usar la IA (narración/taberna), NO hace falta hacer nada: login,
> mapa, fichas y exploración funcionan igual.

---

## Arranque rápido (para usar la IA) — flujo NUEVO, sin Vercel

### 1. Arranca Ollama + el túnel
Doble clic en **`iniciar-tunel-ia.bat`** (en el Escritorio).
- Comprueba/abre Ollama y arranca el túnel.
- **Deja esa ventana abierta** mientras juegues.
- Copia la línea que aparece:
  `https://algo-algo-algo.trycloudflare.com`

*(Alternativa manual, en PowerShell:)*
```powershell
& "$env:USERPROFILE\cloudflared.exe" tunnel --url http://127.0.0.1:11434 --http-host-header localhost
```

### 2. Pega la URL en el Panel DM
1. Entra en la app como **admin (DM)** → **Panel DM → Narración**
2. Arriba, en **"Servidor de IA (túnel)"**, pega la URL → **Guardar** → **Probar**
3. Listo — lo usan todos al instante. **No hay que tocar Vercel ni redeploy.**

> Solo la primera vez: ejecuta `supabase/schema_v5.sql` en Supabase y haz un
> último Redeploy en Vercel para tener el código de esta función.

*(Modo antiguo, por si acaso: editar `OLLAMA_HOST` en Vercel + Redeploy también
funciona; el valor del Panel DM tiene prioridad sobre la variable de entorno.)*

---

## Comprobaciones si la IA falla

**"No se pudo contactar con la IA"** → casi siempre es uno de estos:

| Causa | Solución |
|-------|----------|
| Túnel cerrado (cerraste la ventana / reiniciaste) | Vuelve a ejecutar `iniciar-tunel-ia.bat` y repite pasos 2-3 |
| No actualizaste `OLLAMA_HOST` con la URL nueva | La URL cambia cada arranque; edítala en Vercel + Redeploy |
| No hiciste Redeploy tras cambiar la variable | Las env solo entran en un deploy nuevo |
| Ollama apagado | Abre Ollama (icono bandeja). Comprueba: `curl http://127.0.0.1:11434` → "Ollama is running" |
| Error 502 en el túnel | Ollama no está arriba; ábrelo y reintenta |

**Probar el túnel directamente** (sustituye la URL):
```powershell
curl https://TU-TUNEL.trycloudflare.com/api/tags
```
Debe devolver la lista de modelos (JSON), no una página de error.

---

## Datos que NO cambian (no tocar)
- **Supabase** (login, fichas, mapa, exploración): siempre activo, sin acción.
- **Vercel**: la web sigue online; solo cambia `OLLAMA_HOST` cuando reinicias.
- **Modelo por defecto**: `qwen2.5:14b`. Cámbialo en `/narrador` o con la
  variable `OLLAMA_MODEL` en Vercel.

## Saber qué versión está desplegada
```powershell
curl https://exandria.vercel.app/api/version
```
Si el `commit` coincide con tu último cambio, el deploy está al día.

---

## ¿Cansado de repetir esto cada arranque?
La URL del túnel cambia porque es un túnel **gratis sin cuenta**. Dos formas de
no volver a tocar Vercel nunca:
1. **Túnel con nombre fijo** (cuenta Cloudflare + un dominio): URL estable → no
   cambias `OLLAMA_HOST` nunca más.
2. **Configurar la URL desde el propio Panel DM** (mejora pendiente): pegar el
   túnel en la app y que se guarde en la base de datos, sin redeploy.

Pídelo cuando quieras y lo monto.
