# Las imágenes: tamaños, calidad y prompts

Qué tiene que cumplir cada imagen para que **encaje sin recortes feos** en los
sitios donde la app la usa. Los números salen de la maqueta, no de un estándar
genérico.

---

## 1 · Retratos de PNJ

### Dónde se usa la MISMA imagen (y esto es lo que manda todo)

| Sitio | Tamaño real | Proporción |
|---|---|---|
| Medallón de la lista | 106 × 136 px | 0,78 (casi cuadrado) |
| Ventana de diálogo, **escritorio** | 360 × hasta 780 px | **0,46** (muy alta y estrecha) |
| Ventana de diálogo, **móvil** | hasta 1020 × 190 px | **5,4** (muy ancha y baja) |

⚠️ **El mismo archivo tiene que sobrevivir a una columna altísima y a una banda
apaisada.** Es el requisito difícil, y es lo que fija la composición.

### Especificación

| | |
|---|---|
| **Proporción** | **2:3 vertical** |
| **Tamaño** | **1024 × 1536 px** |
| **Formato** | **WebP** calidad 82 (o JPG 85 si tu herramienta no saca WebP) |
| **Peso** | **≤ 250 KB**. Se cargan varias a la vez en la lista de PNJ |
| **Fondo** | Opaco, sin transparencia — encima va un velo oscuro degradado |
| **Color** | sRGB |

### La composición, que es lo que de verdad importa

- **Cara centrada horizontalmente.** En la columna de escritorio se recorta
  **un 15 % por cada lado**: lo que pongas ahí no se ve.
- **Ojos al 28 % desde arriba.** En móvil solo se ve **una banda del 12 % de la
  altura** alrededor de esa línea. Si la cara está en el centro, en móvil sale
  el pecho.
- **De cintura para arriba**, no plano entero. Un cuerpo completo se convierte
  en una cabeza diminuta en el medallón.
- **Del 45 % hacia abajo se puede perder entero.** Ahí van el nombre y la barra
  de confianza. No pongas nada que importe.
- **Mirando a cámara o a tres cuartos.** De perfil se lee mal en el medallón.

```
┌──────────────┐  0 %
│   ░ aire ░   │
│  ◉  ojos  ◉  │  ← 28 %
│   la cara    │
├──────────────┤  45 %
│ se tapa con  │
│  el nombre   │
└──────────────┘  100 %
   ↑15%    15%↑
   se recorta en escritorio
```

### Prompt para generar el retrato

Cambia solo lo que va en `[corchetes]`. Lo demás mantiene el estilo entre todos
los PNJ, que es lo que hace que la galería se vea de una pieza.

```
Retrato de medio cuerpo de [Mirna Halbrook, tabernera de unos cincuenta años,
brazos fuertes de cargar barriles, pelo recogido, mirada cansada pero firme,
delantal de cuero sobre camisa de lino],
en el mundo de una campaña de D&D de fantasía medieval europea.

ESTILO: pintura ilustrada tipo libro de cuentos, gouache y acuarela, pincelada
visible, luz cálida de tarde, colores saturados pero naturales, aire de
Estudio Ghibli y de acuarela de viaje. NO fotorrealista, NO 3D, NO anime
moderno, NO línea de cómic marcada.

ENCUADRE: retrato vertical 2:3, de la cintura para arriba, sujeto centrado
horizontalmente, ojos situados aproximadamente al 28 % de altura desde el borde
superior, con aire libre por encima de la cabeza. Mirando a cámara o a tres
cuartos.

FONDO: sencillo y desenfocado, del sitio donde está ([el interior de una
taberna de vigas bajas]), sin detalles que compitan con la cara, sin texto,
sin marco ni borde, sin viñeteado.

Sin firma, sin marca de agua, sin bordes decorativos.
```

⚠️ **No le pidas marco ni orla al generador.** El marco lo pone la app —dorado
en el valle, plata en la ciudadela— y si la imagen ya trae uno, se ven dos.

---

## 2 · Ilustración del lugar (la cabecera a sangre)

Es **la imagen que hace que la pantalla sea bonita**. El resto es marco.

| | |
|---|---|
| **Proporción** | **16:9** |
| **Tamaño** | **1920 × 1080 px** |
| **Formato** | WebP calidad 82 |
| **Peso** | **≤ 400 KB** |

### Composición

- La banda ocupa **todo el ancho** y como mucho **460 px de alto**, así que del
  original **solo se ve una franja horizontal del centro-arriba**.
- **El tercio inferior se pierde**: encima va el degradado que funde con el
  pergamino, y sobre él el nombre del sitio.
- **El horizonte, a media altura o algo por debajo.** Si lo pones arriba, en
  pantalla ancha solo se ve cielo.
- **Nada importante en el centro-abajo**: ahí cae el título en letra gótica.

### Prompt para la ilustración del lugar

```
Paisaje ilustrado de [Byroden, un pueblo de montaña reconstruido: casas de
entramado de madera con tejado de losa, humo de fragua, prados de flores
silvestres, un lago quieto, montañas nevadas cerrando el valle al fondo,
ovejas y aldeanos pequeños entre las flores],
en el mundo de una campaña de D&D de fantasía medieval europea.

ESTILO: pintura ilustrada tipo libro de cuentos, gouache y acuarela, pincelada
visible, verdes ricos, luz de mediodía de primavera, nubes altas, aire de
Estudio Ghibli. NO fotorrealista, NO 3D.

ENCUADRE: apaisado 16:9, plano general amplio, horizonte a media altura o un
poco por debajo. El tercio inferior debe ser tranquilo y sin detalle importante
(se cubre con un degradado y un título). Sin personajes en primer plano grandes.

Sin texto, sin marco, sin firma, sin marca de agua.
```

### Variantes por tema, que es lo que pediste

El sitio declara su `tema` y de ahí sale la piel entera de la pantalla. Cambia
la parte descriptiva del prompt, no el estilo:

| Tema | Sitio | Qué pedirle a la imagen |
|---|---|---|
| **valle** | Byroden | Prados de flor, agua quieta, montañas, sol de primavera, verdes |
| **ciudadela** | Emon | Agujas blancas sobre la bahía, mármol, banderas de gremio, cielo alto y frío, plata y carmesí |
| **bosque** | Expansión Verdante | Dosel cerrado, luz en columnas entre los troncos, niebla baja, verdes profundos |
| **yermo** | Ruinas | Ceniza, sin pájaros, luz plana, ocres y grises |

---

## 3 · Dónde se suben

`location_npcs.portrait` y la imagen del sitio guardan **una URL**, así que la
imagen tiene que estar colgada en algún sitio público. El proyecto ya tiene
Supabase Storage montado (`supabase/storage-assets.sql`), que es el sitio
natural: la subes y pegas la URL en **Panel DM › PNJs** o en **Panel DM ›
Lugares**, sin desplegar nada.

---

## 4 · Comprobación rápida antes de subir

- [ ] 2:3 y 1024×1536 (retrato) · 16:9 y 1920×1080 (lugar)
- [ ] Menos de 250 KB / 400 KB
- [ ] Ojos al 28 % de altura (retrato) · horizonte a media altura (lugar)
- [ ] Nada importante en el 15 % de cada lado (retrato)
- [ ] Nada importante en el tercio inferior (lugar)
- [ ] Sin marco, sin texto, sin firma
