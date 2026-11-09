# Guía visual V1 — referencia del estilo observado

**Estado:** referencia retrospectiva de los estilos observados, pendiente de revisión de Leonel. Se consolidó durante la documentación de UI-002 a partir de la interfaz y los estilos existentes en el repositorio. No se encontró evidencia en el repositorio de que esta guía haya servido como insumo para la implementación original; esto no permite afirmar ni descartar referencias externas previas. Los valores se extrajeron del CSS; no constituyen una propuesta de rediseño ni un sistema visual aprobado oficialmente por el PM.

## Identidad y dirección visual

La interfaz combina ilustración de paisajes/regiones ecuatorianas, escenas de cultivo, paneles con tratamiento de madera y papel, ornamentos vegetales y acentos verdes. Las pantallas de producto y la capa de juego comparten la marca, pero usan escalas tipográficas y tratamientos distintos. La región se asocia a la provincia registrada.

## Colores

| Uso observado | Valor | Fuente |
|---|---|---|
| Texto principal global | `#173e34` | `frontend/src/styles.css` |
| Fondo global | `#f6f5f0` | `frontend/src/styles.css` |
| Verde de acción general | `#1a5541` | `frontend/src/styles.css` |
| Fondo oscuro de bienvenida | `#082c1c` | `frontend/src/features/auth/auth.css` |
| Lima de marca/autenticación | `#c4f225` | `frontend/src/features/auth/auth.css` |
| Texto claro de bienvenida | `#f5f5e9` | `frontend/src/features/auth/auth.css` |
| Foco en estilos globales | `#d3a263` | `frontend/src/styles.css` |
| Tinta de Game UI | `#173b2b` | `frontend/src/shared/ui/game-ui/game-ui.css` |
| Papel de Game UI | `#fff2cf` | `frontend/src/shared/ui/game-ui/game-ui.css` |
| Madera oscura / madera / madera clara | `#48200f` / `#8e4c21` / `#c68037` | `frontend/src/shared/ui/game-ui/game-ui.css` |
| Hoja y resplandor de Game UI | `#90d523` / `#ffe685` | `frontend/src/shared/ui/game-ui/game-ui.css` |
| Acento regional Sierra | `#9c61cb` | `frontend/src/shared/ui/game-ui/game-ui.css` |
| Acento regional Costa | `#f4bb31` | `frontend/src/shared/ui/game-ui/game-ui.css` |
| Acento regional Oriente/Amazonía | `#75c943` | `frontend/src/shared/ui/game-ui/game-ui.css` |
| Acento regional Galápagos | `#3abbe8` | `frontend/src/shared/ui/game-ui/game-ui.css` |

Los acentos regionales complementan el paisaje y no reemplazan el nombre textual de la región. El valor real del tema puede tener transparencias, gradientes y capas adicionales; la tabla recoge colores base, no una paleta completa de producción.

## Tipografía e iconografía

- Los estilos globales definen **DM Sans** para texto e interfaz y **Outfit** para encabezados.
- Los componentes Game UI y algunas pantallas de juego usan **Trebuchet MS**, con `system-ui`/`Arial` como alternativas.
- Mi Jardín usa iconos SVG en línea desde [`GardenIcon.tsx`](../../frontend/src/features/my-garden/GardenIcon.tsx); las variantes incluyen hoja, comunidad, bitácora, mapa, semilla, maceta, vertical y colgante. No se encontró una biblioteca externa de iconos declarada en `frontend/package.json`.
- También existen nueve SVG en [`frontend/src/assets/kawsapacha-comunidad/iconos/`](../../frontend/src/assets/kawsapacha-comunidad/iconos/): `icono_bitacora.svg`, `icono_calendario.svg`, `icono_check.svg`, `icono_comunidad.svg`, `icono_flecha.svg`, `icono_hoja.svg`, `icono_huerto.svg`, `icono_logro.svg` e `icono_mapa.svg`. No se encontraron referencias de uso a esos archivos en el código consultado; se registran como recursos disponibles, no como iconografía confirmada de las pantallas observadas.
- La discrepancia tipográfica entre el shell general y la capa de juego está observada; no se propone unificarla sin revisión del PM.

## Componentes y jerarquía observados

1. **Botones:** autenticación y acciones del jardín usan botones prominentes de alto contraste; sus colores y tratamientos varían entre módulos.
2. **Paneles:** formularios y paneles de juego usan fondos crema o papel, bordes cálidos, sombras y ornamentación.
3. **Formularios:** las pantallas observadas usan etiquetas, grupos de opciones, mensajes de campo y estados textuales. La guía registra los patrones presentes; no define componentes nuevos.
4. **Navegación:** se observan navegación lateral para módulos y una barra flotante inferior para acciones del jardín.
5. **Estados:** la escena capturada muestra seis espacios vacíos y el estado de guardado local. No se capturaron en esta pasada estados funcionales de carga/error ni parcelas ocupadas; su apariencia no se especifica como diseño aprobado.
6. **Identidad regional:** la interfaz conserva el nombre textual y acentos visuales para Costa, Sierra, Amazonía/Oriente y Galápagos. Solo Costa se verificó en ejecución durante esta revisión.

## Responsive, foco y movimiento

- Los estilos globales y de las funcionalidades adaptan el layout mediante media queries; Game UI define cambios en 1100 px y 700 px. Comunidad V3 añade reglas responsive propias.
- En la escena Phaser, los botones genéricos tienen mínimos CSS de 44 × 44 px; las acciones rápidas del jardín tienen mínimo de 54 px de alto en escritorio y 66 px en la regla móvil. Game UI establece 46 px en sus botones y 48 px bajo 700 px. Son valores de implementación, no una escala común.
- La interfaz global, Game UI y autenticación definen indicadores de foco propios.
- Existen alternativas `prefers-reduced-motion` en estilos de autenticación y Game UI.
- En la revisión inicial, a 390 × 844 px no hubo desbordamiento horizontal en bienvenida, inicio visitante, Comunidad ni paso territorial. No se certifica el resto de flujos móviles todavía.

## Estados documentados y límites de observación

- **Vacío:** seis espacios de cultivo vacíos observados en la captura Costa; no se infiere que estén vacíos en otros huertos.
- **Carga/error:** no se capturaron estados funcionales de carga o error. El fallo local inicial por dependencia Phaser ausente fue una condición del entorno de desarrollo y no se toma como pantalla del producto.
- **Foco y movimiento:** hay reglas CSS de foco y movimiento reducido en estilos relevantes; no equivalen a una auditoría de accesibilidad.

Esta guía es referencia de los estilos observados, no evidencia del origen del diseño original. El archivo Figma de UI-002 contiene capturas reales de la aplicación; no contiene mockups ni prototipo. Cualquier propuesta visual posterior debe identificarse como propuesta y quedar sujeta a revisión del PM.

Como pauta pendiente de aprobación para futuros diseños, los estados de carga y error deberían explicitar qué ocurre y qué puede hacer la persona; un estado vacío debería explicar por qué no hay contenido y mostrar la acción pertinente cuando exista. Estos patrones no se implementaron ni verificaron en esta entrega.

## Referencias de implementación

- [Estilos globales](../../frontend/src/styles.css)
- [Estilos de bienvenida](../../frontend/src/features/auth/auth.css)
- [Game UI](../../frontend/src/shared/ui/game-ui/game-ui.css)
- [Comunidad V3](../../frontend/src/features/communities/community-v3.css)
- [Mi Jardín Phaser](../../frontend/src/features/my-garden/phaser-poc/phaser-poc.css)
- [Plan de diseño de Dylan](./PLAN-DYLAN-V1-10NOV.md)
