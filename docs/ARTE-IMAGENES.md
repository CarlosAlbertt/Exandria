# Las imágenes: tamaños, calidad y prompts

> **Corregido el 2026-08-07 mirando los retratos de `CarlosAlbertt/Eranol-APP`
> (`public/img/npcs/`), que son los que al usuario le gustan.** La versión
> anterior de este documento pedía 2:3, gouache de cuento y encuadre de cintura
> para arriba. **Los tres estaban mal.** Lo que funciona es otra cosa.

---

## 1 · Retratos de PNJ

### Lo que hacen los de Eranol, medido

| | |
|---|---|
| **Proporción** | **1:1 cuadrada** |
| **Tamaño** | **1024 × 1024** |
| **Estilo** | **Pintura digital semirrealista.** Pincelada empastada, **sin ninguna línea de tinta**, sin cel shading |
| **Encuadre** | **Busto**: cabeza y pecho. La cara ocupa buena parte del cuadro |
| **Fondo** | El sitio donde está, **pintado y desenfocado**: antorchas, arcos de piedra, la barra de la taberna, gente al fondo |
| **Luz** | Dramática y cálida. Antorcha o lumbre a un lado, sombra al otro |
| **Peso** | 620–890 KB en PNG |

Lo que hace que se vean bien **no es el personaje: es que están DENTRO de un
sitio**, con profundidad de campo y luz de fuego. La que te generó la IA estaba
plana, entintada y con margen blanco. De ahí la diferencia.

### Lo que cambio en la app por esto

⚠️ **Adapto el diseño a la imagen, no la imagen al diseño.** La ventana de
diálogo tenía una columna vertical de 360×780, que **destroza una imagen
cuadrada**. Pasa a ser un **retrato cuadrado enmarcado**, como en Eranol. Tú
generas cuadrado y ya.

### Especificación

| | |
|---|---|
| **Proporción** | **1:1** |
| **Tamaño** | **1024 × 1024** |
| **Formato** | **WebP** calidad 82 (los PNG de 800 KB son mucho para el móvil) |
| **Peso** | **≤ 300 KB** |
| **Fondo** | Opaco. **Sin margen blanco, sin marco, sin borde** — el marco lo pone la app |
| **Composición** | Ojos a un tercio de la altura; cara centrada o ligeramente a un lado |

### Prompt

Cambia solo lo de `[corchetes]`.

```
Retrato de busto de [Mirna Halbrook, tabernera humana de unos cincuenta años,
brazos fuertes de cargar barriles, pelo castaño recogido y algo suelto, mirada
cansada pero firme, delantal de cuero sobre camisa de lino remangada],
personaje de una campaña de Dungeons & Dragons.

ESTILO: pintura digital semirrealista de personaje, tipo arte de D&D o de
Magic: The Gathering. Pincelada empastada y visible, textura de óleo digital,
volumen y piel con detalle. SIN línea de tinta, SIN contorno negro, SIN cel
shading, SIN estilo cómic, SIN anime, NO fotografía.

ENCUADRE: composición cuadrada 1:1, plano de busto (cabeza y pecho), la cara
ocupando buena parte del encuadre, ojos aproximadamente a un tercio de la
altura desde arriba. Mirando a cámara o a tres cuartos.

FONDO: el interior de [una taberna de pueblo, con vigas bajas de madera, la
lumbre encendida al fondo, botellas en un estante y parroquianos borrosos],
pintado con profundidad de campo, desenfocado, más oscuro que el personaje.

LUZ: cálida y dramática, de [la lumbre] a un lado de la cara, con la sombra
cayendo al otro lado. Contraste marcado entre el personaje iluminado y el fondo
en penumbra.

Sin texto, sin firma, sin marca de agua, sin marco, sin borde blanco,
sin viñeteado añadido.
```

---

## 2 · Ilustración del lugar (la cabecera a sangre)

| | |
|---|---|
| **Proporción** | **16:9** |
| **Tamaño** | **1920 × 1080** |
| **Formato** | WebP calidad 82 · **≤ 400 KB** |

### Composición

- Se ve **una franja horizontal**: todo el ancho, como mucho 460 px de alto.
- **El tercio inferior se pierde** bajo el degradado y el título.
- **Horizonte a media altura o algo por debajo.**

### Prompt

```
Paisaje de [Byroden, un pueblo de montaña reconstruido: casas de entramado de
madera con tejado de losa, humo de fragua, prados de flores silvestres, un lago
quieto, montañas nevadas cerrando el valle al fondo, ovejas y aldeanos pequeños
entre las flores], en una campaña de Dungeons & Dragons.

ESTILO: pintura digital semirrealista, pincelada empastada y visible, textura de
óleo digital, aire de arte de portada de manual de rol. SIN línea de tinta, SIN
contorno, SIN cel shading, NO fotografía.

ENCUADRE: apaisado 16:9, plano general amplio, horizonte a media altura o un
poco por debajo. El tercio inferior tranquilo y sin detalle importante.

LUZ: [mediodía de primavera, sol alto, nubes altas, verdes vivos].

Sin texto, sin firma, sin marca de agua, sin marco.
```

### Variantes por tema

Cambia la descripción y la luz, **nunca el bloque de ESTILO**: eso es lo que
mantiene todo de una pieza.

| Tema | Sitio | Qué pedirle |
|---|---|---|
| **valle** | Byroden | Prados de flor, lago, montañas nevadas · mediodía de primavera |
| **ciudadela** | Emon | Agujas blancas sobre la bahía, mármol, banderas de gremio · luz alta y fría |
| **bosque** | Expansión Verdante | Dosel cerrado, columnas de luz entre troncos, niebla baja · verde profundo |
| **yermo** | Ruinas | Ceniza, torre partida, sin pájaros · luz plana y gris |

---

## 3 · Una tensión que hay que decidir, y va dicha

El **paisaje alpino** que pasaste primero es **gouache de cuento**: suave, claro,
sin dramatismo. Los **retratos de Eranol** son **pintura digital oscura y
dramática**. Son dos estilos distintos, y **si se mezclan se nota**.

**Recomendación**: manda el de Eranol —pintura digital semirrealista— **también
en los paisajes**, y la diferencia entre Byroden y una cripta la pone **la luz**,
no el estilo. Byroden a mediodía sale luminoso igual, pero pintado como los
retratos. Es lo que hacen los manuales de rol.

Los prompts de arriba ya están escritos así.

---

## 4 · Dónde se suben

`location_npcs.portrait` guarda **una URL**. El proyecto ya tiene Supabase
Storage (`supabase/storage-assets.sql`): subes y pegas la URL en **Panel DM ›
PNJs**, sin desplegar nada.

---

## 5 · Comprobación antes de subir

- [ ] 1024×1024 (retrato) · 1920×1080 (lugar)
- [ ] WebP y por debajo de 300 KB / 400 KB
- [ ] **Sin margen blanco, sin marco, sin firma**
- [ ] Sin contorno de tinta
- [ ] Retrato: busto, ojos a un tercio, fondo del sitio desenfocado
- [ ] Lugar: horizonte a media altura, tercio inferior tranquilo
