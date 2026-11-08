# Materiales de suelo independientes

`materiales-v1.png`: atlas opaco de cuatro materiales, generado con la herramienta integrada **imagegen**, sin CLI. Los marcos de césped ambiental, tierra, adoquines y piedra volcánica se calculan a partir del tamaño real del atlas y se aplican a geometría mediante máscaras. Nunca se usa el atlas completo como fondo de escena.

Las texturas no contienen cultivos, semillas, herramientas, actividad agrícola ni interfaz. El color del suelo procede del registro; los tonos ambientales proceden de la región. El material es ilustrativo y no acredita humedad, fertilidad, preparación ni progreso.

## Prompt final

```text
Use case: stylized-concept. Asset: a 1024 by 1024 pixel opaque game MATERIAL TEXTURE ATLAS, exact 2 by 2 grid of four seamless 512 pixel square texture tiles. No borders or gutters, no objects, no horizon, no text, no interface. For a richly hand-painted semiisometric cozy Ecuadorian farming game with warm light, detailed tactile surfaces matching sculpted terracotta/adobe game props, vibrant but natural.
TOP LEFT square: dense rich sunlit meadow grass surface, small natural grass blades, clover-like ground cover, warm lime green and deep olive microshadows, no flowers or big leaves, no planted crops; seamless organic game terrain texture.
TOP RIGHT square: fine loose brown agricultural soil, visible crumbs and tiny earth grains, warm medium brown, subtly lit clumps with natural depth, no furrows, no seeds, no plants, no footprints or signs of completed activity; seamless tiling soil material.
BOTTOM LEFT square: warm natural irregular flat sandstone pavers, rounded weathered edges, sandy grout joints, rustic Ecuadorian patio surface; many small varied stones throughout the tile, no surrounding slab or thick vertical sides; seamless tiling stone.
BOTTOM RIGHT square: dark gray volcanic stones and fine charcoal gravel, subtly warm highlights and muted moss-free grains, no plants, no water; seamless volcanic ground material.
Uniform top down material lighting, subtle directional volume upper left, NO dramatic cast shadows, no independent objects or grass borders. These four tiles will be cropped into separate textures and projected on geometry by code, NOT used as a complete scenery background.
```
