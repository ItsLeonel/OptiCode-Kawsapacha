# Fase 1 · Dirección artística de Mi Jardín

Registro histórico de los recursos previos. Fecha: 2026-11-08. Herramienta: `image_gen.imagegen` integrada, modo de generación, `transparent_background: true`. No se utilizó la API ni el CLI. PNG originales con alfa preservado; copiados al proyecto sin sustituir las imágenes existentes.

Referencias inspeccionadas: `referencias/jardin-v1-referencias`, especialmente las modalidades En tierra, Vertical y Colgante. Se usan como guía artística; ninguna pantalla aprobada se coloca como textura del escenario.

Los cuatro `paisaje-*-v1.png` de Fase 1A se conservan. El encuadre respeta su proporción y cubre la cámara, sin velo de césped que desature el paisaje ni una segunda casa superpuesta.

## terreno-continuo-v3.png

Archivo: [terreno-continuo-v3.png](./terreno-continuo-v3.png). Terreno continuo, sendero y césped; sin distribuciones ni infraestructura agrícola.

Dimensiones: 1536 × 1024. Se escala uniformemente, conservando la relación de aspecto.

Prompt final:

```text
Use case: stylized-concept. Asset type: independent transparent foreground terrain layer for a Phaser 2.5D Ecuadorian garden game. This is ONLY a ground surface asset, not a complete scene, not a screenshot. Create one beautiful wide organic garden clearing viewed from an elevated three-quarter frontal camera, ground horizontal axis rises gently toward the right (slope -0.10), depth axis goes diagonally up-left. Wide landscape 3:2 canvas, isolated on genuine transparent background. Match polished vibrant hand-painted 3D mobile farming game environments: rich small-scale soil clods, lush fine grass, softly rounded natural stones, golden sunlight from upper left, warm soft contact shadows. The ground should occupy almost all the canvas, with an irregular oval/trapezoid footprint, gently feathered grassy edges blending into transparent. Its rear edge is narrower, front edge wider; no raised floating island, no cliff, no outer stone rim. The middle contains a single continuous smooth dark warm brown bare earth clearing with gently irregular edges and enough wide empty bare soil for six planting positions in two rows of three. A narrow winding dirt-and-irregular-flat-flagstone footpath enters from bottom center, curves around the LEFT edge of the bare-earth clearing toward back-left. A second narrow irregular earth footpath, subtle and mostly dirt with a few separated stones, crosses between the two rows of bare soil; do NOT create dividing rectangles. Ground materials merge naturally; detailed medium-scale painted soil and grass, no obvious tiling, no shiny plastic. The flat stepping stones are thin weathered warm grey stones, approximately one tenth the width of the planting area. Low wild fine grasses only outside the cultivable earth. No planting beds, no furrows, no terraces, no mounds, no containers, no plants in the soil, no crops, no flowers, no tools, no buildings, no fences, no water hardware, no text, no labels, no characters, no sky, no distant scenery, no frame. Native transparency must be preserved. Main focus is game-quality ground topology and coherent beautiful natural material rendering.
```

## bastidor-natural-v3.png

Archivo: [bastidor-natural-v3.png](./bastidor-natural-v3.png). Bastidor vertical abierto. Las seis jardineras y sus fotografías se componen aparte.

Dimensiones: 1536 × 1024. Se escala uniformemente, conservando la relación de aspecto.

Prompt final:

```text
Use case: stylized-concept. Independent transparent 2.5D game asset, NOT a complete scene. A beautiful empty wooden garden trellis / vertical garden support, as wide as it is roughly 0.65 high, on genuine transparent background. Front-facing with gentle oblique perspective: long horizontal beams slope up to right by 6 degrees, verticals remain vertical, very little visible right side. Three broad bays, open warm wooden lattice behind them, natural thick timber left and right uprights standing on two small individual rough stone footings. There is a narrow wooden top rail and diagonal corner braces but NO roof, no adobe wall, no backdrop panel, no surrounding scenery. Enough empty space in front to separately attach two rows of three rectangular planters. NO PLANTERS OR POTS in this asset. Look like handcrafted golden timber in vibrant polished hand-painted 3D mobile farming game, strong sculpted volume, fine wood grain, natural irregular edges, beautifully rendered beveled wooden joints, soft golden sunlight from upper left. Small purple red and ochre woven Ecuadorian diamond accent on the upper center rail. Consistent scale, strong clear silhouette, warm amber/orange wood, touch of moss only at footings. Center object and fit fully in a wide 1536x1024 transparent canvas with minimum 5% transparent margins. No text, no labels, no plants, no containers, no buildings, no ground plane, no shadows extending beyond the base, no people, no tools. Preserve true alpha.
```

## pergola-natural-v3.png

Archivo: [pergola-natural-v3.png](./pergola-natural-v3.png). Pérgola abierta. Cestas, cuerdas, fotografías y sombras son piezas independientes.

Dimensiones: 1536 × 1024. Se escala uniformemente, conservando la relación de aspecto.

Prompt final:

```text
Use case: stylized-concept. One independent transparent 2.5D game asset: an EMPTY wide timber garden pergola for hanging baskets. NOT a complete scene. Match vibrant polished sculpted hand-painted 3D Ecuadorian farming game, golden amber timber, fine wood grain, strong modeled volume and natural irregular beveled edges, sunlight upper left, small mossy grey stone footings. Front facing oblique view with long horizontal beams sloping gently upward right by 6 degrees, verticals stay vertical. Three broad empty bays. Two sturdy timber uprights at outer left and outer right on separate small rough stone bases. One thick top horizontal rail with beautifully interlocking open timber roof joists extending backward diagonally up-left; empty sky holes in roof, no thatch or tiles. One thinner mid-height horizontal crossrail across the full width to suspend a second lower row of baskets later. Diagonal corner braces meet the top rail. A small red/purple/gold woven diamond Ecuadorian textile wraps around upper center of top rail. All joints visibly connected. Empty unobstructed space between posts must be genuinely transparent, no wall, no lattice. NO baskets, no ropes, no plants, no pots, no containers, no agricultural tools, no ground plane, no surrounding scenery, no labels, no UI, no text, no people. Fit the entire pergola centered in landscape 1536x1024 canvas with 5% transparent margins. Width approximately 1.5 times height, roof rail across upper 15%, second crossrail around halfway down. Genuine transparent alpha.
```

## materiales-huerto-v3.png

Archivo: [materiales-huerto-v3.png](./materiales-huerto-v3.png). Atlas 3 × 2: hojas, restos vegetales, compost, regadera, manguera y aspersor. Solo se muestran las selecciones registradas.

Dimensiones: 1536 × 1024. Marcos: 512 × 512; índices 0–5 por filas.

Prompt final:

```text
Use case: stylized-concept. A 1536x1024 transparent sprite atlas, exactly 3 equal columns by 2 equal rows, six isolated objects fully inside their own 512x512 cell with generous transparent padding. Match polished vibrant hand-painted 3D farming game in Ecuador, fine natural material texture and sculpted volume, three-quarter elevated view, sunlight upper left, small contact shadows, genuine transparent background. Do NOT write labels. Row 1 left cell: a modest low loose heap of dry brown and golden fallen leaves, on ground, no box or container. Row 1 middle: a modest loose low heap of chopped green-brown plant trimmings and twig fragments, no living rooted plant, no container. Row 1 right: a modest low heap of dark mature compost with small organic particles, no container, no composting shed, no building. Row 2 left: one beautiful sage green metal manual watering can with a handle and long rose spout, standing on ground, no water flowing. Row 2 middle: one naturally coiled green garden hose with a brass nozzle, no tap or tank. Row 2 right: one small simple brass and green metal stationary garden sprinkler head on a short stake with two-prong foot, no water spraying. Empty space between all six objects. No extra objects, no text, no logos, no plants or pots, no scene, no frame. Objects approximately centered per cell. Preserve alpha.
```

## Composición y datos

- Los relieves independientes de `suelos-organicos-v2.png` conservan su proporción y se mezclan con la tierra continua. Cada selección de distribución aparece al menos una vez entre los seis espacios estables.
- El tono del suelo se deriva del registro. Una máscara cromática suave en tiempo de ejecución conserva textura, iluminación, césped, piedras y alfa; nunca deduce el suelo a partir de la región.
- Riego y abono se componen desde los campos existentes. Compost representa material suelto; no crea una compostera ni un cobertizo. Barbecho y las opciones «otra/otro» se consultan en Mi terreno sin inventar instalaciones.
- Lluvia conserva la fuente natural declarada, sin añadir un depósito. El tanque solo se representa para agua almacenada registrada; la prueba visual verifica este caso.
- Los anclajes de macetas corresponden a la boca de cada variante regional. Las dos filas de cestas se suspenden de las vigas; las jardineras se fijan al bastidor con soportes.
- `paint-materials.ts` ofrece materiales y geometría de respaldo cuando falta un recurso. Las texturas derivadas se reutilizan durante la visita y se liberan al cambiar la configuración o destruir la escena.
- No se añaden plantas, crecimiento, acciones agrícolas ni datos de ejemplo a la aplicación. La matriz visual usa únicamente `tests/fixtures/garden-art.html`, excluida de ambos builds.

## Verificación visual

Infraestructura adicional: [infraestructura-natural-v4.png](./infraestructura-natural-v4.png), atlas 1536 × 1024 de 3 × 2 marcos de 512 px. Cercas viva, reciclada, metálica y convencional; pozo y toma de agua. Generación y corrección de alfa con la herramienta integrada. La variante inicial con blanco residual se descartó.

Prompt de generación:

```text
Use case: stylized-concept. Independent transparent 1536x1024 game sprite atlas, 3 columns x 2 rows, exactly six isolated assets each centered entirely within its own 512x512 cell with at least 5% transparent padding. Polished detailed vibrant hand-painted 3D Ecuadorian garden game, same upper-left golden sunlight and warm realistic sculpted natural material textures, elevated frontal three-quarter view, horizontal rails slope very gently up to right by six degrees. Transparent background including holes and spaces. Top row left: a 3-meter-long low living hedge fence, dense small natural leaves, visibly organic branches, uneven bushy top, no planters, NO geometric cylinders or blobs. Top row center: a rustic fence section made from varied salvaged timber boards with lightly faded green/blue paint, two posts, wood grain and hardware. Top row right: a simple galvanized chain-link fence section between two slim metal posts, open diamond mesh with genuine transparent holes. Bottom row left: a conventional close-board wooden garden fence section between two posts, golden brown natural wood, low and wide, no spikes. Bottom row center: a small circular rustic stone well with a dark hollow center and low stacked irregular grey stones, no roof, no bucket, no visible water flow. Bottom row right: a small freestanding grey metal water standpipe with a single brass garden tap and red handle, short stone foot, no hose, no running water. Keep each isolated sprite separate. No names, no captions, no labels, no UI, no people, no surrounding scenery, no extra assets or tools. Preserve true alpha.
```

Prompt final de corrección de transparencia:

```text
Edit the provided 1536x1024 six-cell game sprite atlas ONLY to correct background alpha. Remove the entire milky white and light grey background to REAL FULL transparency alpha 0, including every gap between the chain-link wires, between fence boards, between hedge leaves, and around all sprites. Keep ALL SIX objects exactly the same size, cell positions, appearance, colors, material detail, sunlight and silhouette. Keep layout exactly 3 columns x 2 rows, 512x512 cells. Do not add or remove any object. Remove the white haze fully; no white matte or grey patches. Transparent pixels must have alpha 0 and rendered solid object interiors alpha 255 except antialiased edges. This is a background-extraction edit only.
```

`garden-poc-art.spec.ts` recorre cuatro regiones × cuatro modalidades y guarda las 16 capturas de escritorio. La suite original comprueba además las cuatro modalidades a 390 px, el flujo React, Pasaporte Vivo, fotografía original, teclado, interacción táctil, cámara, recursos ausentes y aislamiento de la entrada normal.


## Actualización integral

El renderizador actual sustituye `terreno-continuo-v3.png` por el prado y los caminos de `courtyard.ts`, usando materiales a escala de mundo. El archivo anterior se conserva como recurso histórico. Los bastidores se distribuyen en tres estructuras y las cestas en grupos de 3, 2 y 1. Las actividades actuales proceden de los registros de `journal/`; las notas anteriores describen el alcance de Fase 1. No hubo nuevas llamadas a generación de imágenes en la implementación integral.
