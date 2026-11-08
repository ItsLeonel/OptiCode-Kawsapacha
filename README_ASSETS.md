# Kawsapacha — Kit visual Comunidad Game V2

Kit visual para la **Fase 1: registro interactivo de comunidades**. Diseñado para integrarlo con el frontend React/Vite/TypeScript existente; no modifica backend ni `main`.

## Inventario

- `referencias/`: cuatro capturas completas del diseño aprobado **solo para consultar** y una lámina de componentes ilustrados. **No** son fondos ni recursos de controles interactivos.
- `frontend/src/assets/kawsapacha-comunidad/personajes/`: cuatro personajes PNG con transparencia alfa (bustos ilustrados), uno por región. Se extrajeron de una lámina generada; puede haber ligeros bordes suaves. No son fotografías ni figuras de cuerpo completo.
- `frontend/src/shared/assets/regional-backgrounds/`: cuatro paisajes WebP 1920×1080 sin personajes-guía, textos ni botones, reutilizados de los fondos regionales existentes de Kawsapacha para mantener coherencia visual. En el kit se emplean para **crear comunidad**.
- `frontend/src/assets/kawsapacha-comunidad/iconos/`: 9 SVG escalables sin texto, con colores `currentColor` para permitir temas.
- `frontend/src/shared/ui/game-ui/game-ui.css`: estilos compartidos del kit integrado — paneles, botones, tarjetas, pasos, indicador regional y personaje.
- `frontend/src/shared/ui/game-ui/GameUI.tsx`: componentes React reutilizables integrados en el asistente de comunidad. Los fondos compartidos también se utilizan en Mi Jardín.
- `PROMPT_UNICO_CODEX.md`: instrucciones completas para Codex en una sola solicitud.

## Regiones y rutas

| Región de interfaz | Región para `regionForProvince` | Personaje | Fondo |
|---|---|---|---|
| Sierra | `sierra` | `personaje_sierra.png` | `fondo_comunidad_sierra.webp` |
| Costa | `costa` | `personaje_costa.png` | `fondo_comunidad_costa.webp` |
| Amazonía | `oriente` | `personaje_oriente.png` | `fondo_comunidad_oriente.webp` |
| Galápagos | `galapagos` | `personaje_galapagos.png` | `fondo_comunidad_galapagos.webp` |

**Nota importante:** Los diseños generados son maquetas artísticas; el **mapa con provincias reales** es el componente `EcuadorMap.tsx`, que debe seguir funcionando como mapa real. Nunca extraigas el mapa de una captura para implementarlo.

## Instalación

El kit ya está integrado y sus piezas reutilizables se consolidaron en `shared/`. Los pasos siguientes documentan la importación original; volver a extraer el ZIP original reintroduciría rutas y copias anteriores.

1. Antes de copiar, protege con `commit` o un respaldo revisado tus cambios locales de `feature/frontend-demo-flow-v1`.
2. Extrae este ZIP en la **raíz del repositorio `OptiCode-Kawsapacha`**, preservando carpetas. Esto agrega los assets, componentes y CSS sin modificar ficheros existentes del proyecto.
3. Abre `PROMPT_UNICO_CODEX.md`, copia el contenido completo y entrégalo a Codex. **Una sola solicitud**; Codex debe implementar solo Fase 1 y detenerse.
4. Después valida `npm run typecheck`, `npm run build`, `npm run test:e2e` (desde `frontend/`) y prueba manualmente las 4 regiones.

## Licencias / documentación

Las ilustraciones incluidas fueron generadas en esta conversación o en el contexto del proyecto. Guarda atribuciones/licencias del GeoJSON y dependencias existentes. No se incluyen fuentes tipográficas. Evita presentar contenido botánico o de salud sin verificación documental.
