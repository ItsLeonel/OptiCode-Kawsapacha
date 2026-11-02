# Recursos visuales de Mi Jardín

## Refinamiento V2 (actual)

Se inspeccionó `docs/diseno/referencia-mi-jardin-v2.png` antes de modificar el módulo. Orienta el ambiente y las superficies de la interfaz; no se importa ni se utiliza como fondo. Se conserva el comportamiento de las seis parcelas y los flujos existentes.

- `frontend/src/assets/jardin-andino-v2.png`: fondo independiente, generado mediante edición del paisaje V1 con `image_gen`. Refuerza la luz cálida, flores, vegetación, casa y volcán andinos. El césped central permanece libre de plantas registradas y controles.
- `frontend/src/assets/cama-cultivo-v2.png`: una cama vacía, con tierra, marco bajo de madera y sombra de contacto. Es un PNG RGBA con transparencia real, verificada antes de usarlo. Se reutiliza como capa decorativa dentro de los seis botones HTML; no contiene plantas, etiquetas ni controles dibujados.
- `my-garden.css` ajusta encuadre, fundido inferior, sombras de contacto, focos y superficies verdes. Las camas permanecen apoyadas durante hover; solo cambian su iluminación y el realce de los controles.
- El encuadre se adapta para mantener las camas sobre el césped. En móvil se prioriza el terreno y se recorta parte del paisaje superior, sin deformar el recurso. La composición se extiende con scroll natural.
- No se instalaron dependencias ni se usó CLI de generación. Los originales V1 y el fondo de bienvenida se conservan.

### Prompt final del paisaje V2

```text
Use case: lighting-weather and stylized-concept refinement. Edit the supplied independent Andean garden background, preserving its Ecuadorian identity, adobe cottage on the left, snow-capped volcano in the right upper distance, valley, rustic fence, stepping stone path and broad open central grassy terrace. This remains a production 2.5D cozy medicinal gardening GAME BACKGROUND, NOT a UI image. Refine toward a lush, colorful late-afternoon golden hour: rich warm golden light, subtle peach and pink clouds in the blue sky, inviting cottage window/lantern glow, flowering purple and magenta bougainvillea hanging from the top-left leafy canopy, beautiful natural green medicinal foliage and small flowers along outer borders, more tactile painterly details and pleasing depth. Retain a wide 16:9 composition. Keep the middle and foreground terrace uncluttered and reasonably level so six separate interactive soil beds can be rendered on it later. Keep the cottage on the left edge and the volcano visible, with no new central buildings. A small metal watering can and basket of herbs can sit at an outer foreground edge, with a discreet Ecuadorian woven textile; no commercial agricultural crops or farms. IMPORTANT INVARIANTS: NO planting beds, NO registered plants or crop rows in the open lawn, NO labels, text, logos, numbers, signs, avatars, progress bars, menus, panels, UI, drawn controls, watermarks, people, or fake account details. Preserve open space for real HTML controls and planting beds. This is only the scenic layer.
```

Entrada: `frontend/src/assets/jardin-andino-v1.png`. Salida: `frontend/src/assets/jardin-andino-v2.png`.

### Prompt final de la cama V2

```text
Use case: stylized-concept. Asset type: one transparent RGBA 2.5D gardening-game sprite, an EMPTY EARTH-FILLED LOW RAISED GARDEN BED. Draw exactly ONE rectangular low planting bed in an elegant painterly cozy game style with believable tactile wood and soil. Camera gently elevated about 40 degrees above the ground, front long edge nearly horizontal and receding edges at three-quarter perspective, matching an Andean garden landscape seen slightly from above. The interior must be unmistakable DARK RICH CRUMBLY EARTH with many tiny irregular clods and scattered pebbles, natural subtle furrows, never wooden slats or parallel boards across the top. Surround the earth with a simple thin weathered warm wooden frame: only one low plank height, natural wood grain, restrained corner posts, slightly irregular edges. Most of the visible upper surface is earth, not timber. It should look built directly on the ground, not like a floating board, pallet, tabletop, platform or stacked crate. Include a soft TIGHT CONTACT SHADOW fading into transparency immediately underneath, with no broad ground rectangle. Absolutely NO plants, sprouts, leaves, flowers, crops, grass clumps, signs, labels, letters, numbers, buttons, plus signs or UI. Empty bed only. Wide 3:2 or 16:10 framing with the bed filling about 90 percent of the canvas, enough transparent margin for contact shadow. Genuinely transparent background, not white, not checkerboard artwork. This sprite will be reused as the decorative layer inside six real HTML buttons; do not draw any controls.
```

Generación nueva con `transparent_background: true`, sin imagen de referencia. Salida: `frontend/src/assets/cama-cultivo-v2.png`.

## Recurso anterior V1

Se inspeccionaron `referencia-mi-jardin.png` y `gamificacion-v1.md` antes de implementar. La referencia orienta la composición; no se importa ni se usa como fondo de la aplicación.

### Fondo independiente

- Archivo final: `frontend/src/assets/jardin-andino-v1.png`.
- Generado con la herramienta integrada `image_gen`, en modo de generación nueva; no se usó CLI ni se instalaron dependencias.
- Paisaje ilustrado andino con casa, volcán, vegetación, camino y detalles textiles. No representa coordenadas ni una ubicación verificada del usuario.
- No contiene textos, menús, parcelas dibujadas, controles, avatares ni datos de una cuenta. Las seis parcelas, sus etiquetas y todas las acciones se implementan en React y CSS.
- El fondo de bienvenida `fondo-kawsapacha.png` permanece intacto.

### Prompt final empleado en V1

```text
Use case: stylized-concept. Asset type: independent background illustration for a production React 2.5D medicinal gardening game, NOT a UI mockup. Create one wide 16:9 landscape image, ideally 1920x1080 or higher. Scene: a beautiful Ecuadorian Andean community medicinal garden overlooking a lush valley and a distant snow-capped Cotopaxi-like volcano under a clear blue sky. A small warm adobe cottage with a terracotta tile roof on the LEFT edge, an understated woven Ecuadorian textile by its doorway, flowers and medicinal foliage along the borders, a rustic low wooden fence in the middle distance, a winding stepping-stone path threading through the scene. Painterly polished 2.5D cozy farming game concept art with believable volume, gently elevated camera, rich tactile illustration, warm sunlight, soft depth and atmospheric perspective. Deep forest green, vivid grass, lime foliage accents, warm earth and terracotta, small purple flowers. Composition: preserve a broad uncluttered flat grassy terrace in the central and lower-middle region, roughly x=25%-80%, y=44%-87%, for six separately implemented interactive HTML planting beds; DO NOT draw planting beds or plot outlines in this open terrace. The house and its decorative plants occupy only the leftmost 20%; do not place a house in the middle. A leafy canopy frames the top corners without covering the volcano. Include a small basket and watering can at a lower outer edge, natural vegetation and a few foreground stones. No people. No plants representing user records in the open lawn. IMPORTANT: absolutely NO text, letters, numbers, logos, labels, signs, panels, badges, buttons, menus, HUD, avatars, interface controls, or watermarks. This must be a clean scenic illustration asset, never a screenshot of an app. All UI and planting beds will be added in real HTML later.
```

## Diferencias deliberadas frente a la maqueta

Se omiten el avatar, nombre de cuenta, notificaciones ficticias, clima, ubicación predeterminada, contadores, grados alcanzados y premios. Se usan **Retos verdes**, **Semillas de vida**, **Mi camino verde** y los grados previstos **Aprendiz → Oficial → Maestro**, sin asignar valores ni estados obtenidos. El jardín inicia con parcelas vacías y solo representa las plantas registradas temporalmente durante la visita. El Pasaporte Vivo muestra la fotografía aportada, sin inventar crecimiento ni floración.
