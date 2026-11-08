# Piezas del escenario modular

`entorno-modular-v1.png`: atlas transparente 1536 × 1024 creado con la herramienta integrada **imagegen**, sin CLI. Contiene casa decorativa, depósito cerrado, compostera vacía, cerca, panel de adobe y pérgola vacía. No contiene plantas registradas, actividades ni interfaz.

Las referencias de diseño históricas y las pantallas maestras locales se utilizaron como guía visual. **No son dependencias de ejecución** ni se usan como fondos interactivos; las ilustraciones requeridas por Phaser están incorporadas bajo `frontend/src/`.

Las piezas se recortan en ejecución mediante marcos Phaser definidos en `../assets.ts`; el atlas conserva el canal alfa original. El entorno es ilustrativo: las estructuras funcionales solo se muestran a partir de las características registradas. La casa es escenografía externa al área de cultivo.

## Prompt final

```text
Use case: stylized-concept.
Asset type: one transparent PNG game sprite atlas for the Ecuadorian medicinal garden application Kawsapacha, to be assembled interactively in Phaser, not a screenshot.
Primary request: SIX separate isolated environment props, arranged in an EXACT 3 columns by 2 rows atlas, landscape 1536 x 1024 pixels, equal 512 x 512 cells. Genuine transparent alpha background. Every prop completely inside its own cell with generous empty margins, no object crosses cells, contact base around y=465 in each cell. No grid lines. No text, labels, logos or interface.
Art direction: richly illustrated premium cozy farming videogame, vibrant warm Ecuadorian Andean adobe architecture and carved wood, semiisometric 3/4 camera gently looking down 25 degrees, charming sculpted forms, hand painted detailed textures, warm sunlight from upper left, soft contact shadows, clear silhouettes, polished realistic cartoon depth. Bright terracotta, warm ochre adobe, honey wood, turquoise cobalt blue, natural gray stone. This is a grounded garden, no floating islands.
TOP LEFT cell: one small complete rustic Ecuadorian adobe farmhouse, front and right side visible, orange terracotta tiled roof, warm cream adobe walls, stone foundation, a dark wooden door and two windows, one small colorful woven Andean hanging textile. No people, animals, planted pots or gardening plants. No surrounding scenery or ground plate.
TOP MIDDLE cell: one large CLOSED cobalt blue water storage tank on a short irregular stone plinth, short closed tap/pipe. No water flowing or droplets, no water level gauge, no roof.
TOP RIGHT cell: one empty rustic wooden compost enclosure with small terracotta roof supported by four corner posts; hollow empty interior, no visible compost stock, no bags, no plants. It is an illustrative prop, not a warehouse.
BOTTOM LEFT cell: one rustic wooden garden fence module with two upright round posts and two horizontal rounded timber rails between them, slight perspective, real grounded foot contacts; no plants and no big ground slab.
BOTTOM MIDDLE cell: one plain cream adobe garden wall section with wooden side posts and orange tiled cap. Broad empty front face, no windows, no pots or plants, no signage. It will sit behind separately rendered vertical growing containers.
BOTTOM RIGHT cell: one open wooden pergola FRAME ONLY, with four grounded posts, a top beam, receding rafters and central horizontal beam. Entire frame visible including feet. NO baskets, containers, ropes or plants; these will be separate interactive assets.
Constraints: all six props in the same lighting and camera style; true transparent space between objects; NO background landscape, ground rectangle, sky, interface, planted crops, foliage, rewards, running water, characters or floating platform. Independent empty reusable structures only.
```
