# Recursos de Comunidad V3

Copias de los recursos independientes entregados en `referencias/comunidad-v3/`.
Los PNG conservan sus bytes, transparencia y metadatos originales. Las referencias
de `pantallas-aprobadas/` se usan solo para revisión visual; ninguna captura forma
parte de la interfaz ni se importa desde React o CSS.

| Región | Fondo original | Personaje original |
| --- | --- | --- |
| Costa | `Paraíso costero de Ecuador-1.png` | `Joven isleño con sombrero de Panamá-1.png` |
| Sierra | `Paisaje andino ecuatoriano vibrante-2.png` | `Personaje andino ecuatoriano colorido-2.png` |
| Amazonía (`oriente`) | `Río Amazónico entre Flores y Selva-3.png` | `Joven amazona con atuendo tribal colorido-3.png` |
| Galápagos | `Paisaje costero de las Galápagos-4.png` | `Explorador de Galápagos sonriente-4.png` |

Los archivos de ejecución usan los nombres `fondos/fondo_comunidad_{region}_v3.png`
y `personajes/personaje_{region}_v3.png`. La selección reutiliza `regionForProvince`;
`shared/ui/game-ui/game-region-assets.ts` centraliza sus URL y etiquetas.

`decoraciones/adornos-andinos.png` procede de `Colección de adornos andinos tropicales-1.png`;
`decoraciones/naturaleza-ecuador.png`, de `Elementos Naturales y Decorativos de Ecuador-2.png`.
`GameDecoration.tsx` encuadra partes de esas láminas mediante ventanas SVG: títulos,
tablones, flores y cosecha. Textos, controles, tarjetas, emblemas y formularios son
elementos independientes de React, CSS y SVG.

La procedencia y las condiciones de uso son las de los archivos entregados; este
directorio no añade una licencia distinta. Se conservan los originales y las
licencias existentes del repositorio, incluidos los datos del mapa.
