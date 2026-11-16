# Recursos de Comunidad V3

Recursos de producción extraídos del paquete de diseño entregado para Comunidad V3.
Los PNG conservan los bytes, transparencia y metadatos originales. Durante la
limpieza del 14/11/2026 se retiró la carpeta histórica `referencias/comunidad-v3/`
porque duplicaba los recursos de producción. Las seis capturas de pantallas aprobadas
eran solo guías visuales y no se importaban desde React ni CSS.

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

La procedencia y las condiciones de uso son las de los recursos entregados; este
directorio no añade una licencia distinta. Se conservan los PNG de producción y
las licencias existentes del repositorio, incluidos los datos del mapa. Las
referencias eliminadas siguen recuperables desde el historial Git anterior a la limpieza.
