# Kawsapacha — Frontend V1

Primer prototipo funcional de interfaces de **Kawsapacha: Mi Huerto Vivo**.

## Ejecutar localmente

Requisitos: Node.js 20.19+ (o 22.12+) y npm.

```bash
cd frontend
npm install
npm run dev
```

Abrir la URL indicada por Vite (habitualmente http://localhost:5173).

Para comprobar tipos y generar artefacto de producción:

```bash
npm run typecheck
npm run build
```

## Estado y limitaciones (26/10/2026)

**Este frontend es un prototipo de interacción, no un sistema operativo de producción**:
- Está preparada la navegación entre Inicio, Usuarios, Comunidades, Huertos, Catálogo y Huerto Virtual.
- Permite crear comunidad y huerto **únicamente en memoria**, seleccionar provincias y visualizar plantas con fotografía durante la sesión.
- No existen todavía autenticación real, permisos de backend, persistencia en base de datos, carga de archivos al servidor ni historias botánicas verificadas.
- No afirmar que el prototipo cumple las historias de usuario hasta conectarlo al backend y ejecutar pruebas.
- La elección del stack frontend (React, TypeScript y Vite) se debe ratificar con Ronny en ARQ-001 antes de integrar backend.

## Comunidad V1

El módulo vive en `src/features/communities/` y se abre desde la navegación Comunidad, tanto en bienvenida como en Mi Jardín. Usa `src/assets/fondo-comunidad-v1.png` y sigue la composición de la referencia «Comunidad — Historias de la Tierra».

La actualización visual sigue `docs/diseno/referencia-comunidad-v2.png`: cuatro tarjetas para publicar experiencias, conversar en el foro, aprender y consultar eventos, junto a «Lo más reciente». La comunidad creada conserva sus datos y acciones en una franja con portada decorativa. La barra inferior mantiene sus medallones SVG. Las cinco ilustraciones independientes, su procedencia y los prompts están en [`src/features/communities/assets/README.md`](src/features/communities/assets/README.md).

- El botón «Crear mi comunidad» abre un diálogo accesible para crear y editar nombre, responsable, localidad y descripción. El nombre es obligatorio; los demás datos son opcionales.
- Los datos permanecen en memoria al navegar y se pierden al recargar. La comunidad se comparte con los flujos existentes de huerto y registro de plantas.
- Tras crearla, se muestran sus datos, el estado vacío de integrantes y el acceso al registro del huerto compartido o al jardín si ya existe.
- Saberes, experiencias, prácticas, conversaciones, novedades y actividades muestran estados de demostración. No incluyen publicaciones, videos, integrantes ni actividades ficticias. Publicar, unirse y sincronizar datos requieren una futura conexión con el backend.
- Publicar experiencias y conversar abren estados pendientes distintos: aún no existen carga de fotografías, publicaciones, temas ni respuestas. Aprendizaje y eventos muestran sus estados vacíos, sin contenido ni fechas inventadas.
- Los diálogos admiten teclado, Escape, gestión nativa del foco y validación del nombre. La distribución se adapta a escritorio, tableta y móvil.

## Mapa interactivo

`src/EcuadorMap.tsx` consume datos GeoJSON provinciales desde:
https://github.com/pabl-o-ce/Ecuador-geoJSON

**Autor:** Pablo Carrera Estrada · **Licencia:** MIT.
Su licencia original: https://github.com/pabl-o-ce/Ecuador-geoJSON/blob/master/LICENSE

En esta primera iteración se cargan en tiempo de ejecución. Para entrega V1 se recomienda incorporar un archivo GeoJSON local optimizado, conservar la atribución correspondiente y comprobar su exactitud. Se incluye selector alternativo de provincias si falla la red.

## Siguientes tareas

- **Leonel:** comprobar instalación, ajustar interfaz con Figma de Dylan, sustituir estados temporales por servicios API.
- **Ronny:** definir con Leonel contratos de API, autenticación, entidades y almacenamiento de fotos.
- **Leonardo:** documentar historias, tecnologías realmente aprobadas y alcance.
- **Santiago:** definir y ejecutar casos verificables a medida que se integren los servicios.
