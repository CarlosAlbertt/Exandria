# Bocetos de los talleres

Maquetas estáticas de cada taller, tal y como se aprobaron con el DM antes de
escribir código. **Se abren con doble clic**: son HTML sueltos, sin dependencias
ni servidor.

## Por qué están en el repo y no en un chat

Porque perderlos ya costó una tanda. El 2026-08-02 se arrancó una sesión con «hay
un boceto interactivo ya aprobado» de alquimia **que no existía en ningún sitio
consultable**: ni en el repo, ni en el vault. Hubo que rehacerlo desde cero para
poder mirarlo.

Las maquetas se dibujan en `.superpowers/brainstorm/`, que está en el
`.gitignore` y **se borra sola**. Lo que se apruebe se copia aquí.

## Qué hay

| Archivo | Taller | Estado |
|---|---|---|
| `alquimia-caldero.html` | El caldero y las tres fases | **Construido**, ver `components/taller/Caldero.tsx` |
| `forja-fragua.html` | Yunque, martillo y temple | **Construido** sin piezas que forjar, ver `components/taller/Fragua.tsx` |
| `destilacion-alambique.html` | Alambique, serpentín y el corte | Aprobado, **sin construir** |
| `cristalografia-banco.html` | La veta, el cincel y el punto de rotura | Aprobado, **sin construir** |
| `tatuaje-camilla.html` | La plantilla, el trazo y el portador | Aprobado, **sin construir** |
| `cocina-fuegos.html` | Dos fuegos a la vez y la cata | Aprobado, **sin construir** |
| `extraccion-despiece.html` | Estudiar, cortar y guardar el cadáver | Aprobado, **sin construir** |

## Lo que NO son

No son la interfaz final ni una fuente de verdad: los colores y los textos que
valen están en el código. Un boceto sirve para decidir **qué se manipula y cómo
se reparte la pantalla**, y a partir de ahí se queda como registro de lo que se
acordó.

Las decisiones que salieron de cada uno viven en `docs/superpowers/specs/`.
