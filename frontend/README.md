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
