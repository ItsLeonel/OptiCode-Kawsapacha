# Auditoría de activos y código muerto — Kawsapacha

**Fecha:** 14/11/2026 · **Base:** main @ d097d3db571093fac4695a96e0377e71ee83b36f (PR #60 fusionado).  
**Rama:** chore/auditoria-limpieza-recursos-obsoletos. **PR #61:** Espejo Digital Evolutivo en otra rama; esta limpieza no lo fusiona ni modifica sus archivos.

## Resumen verificable de archivos versionados

| Métrica | Antes | Después |
| --- | ---: | ---: |
| Archivos versionados (blobs Git) | 561 | 515 |
| Tamaño lógico de los blobs del árbol vigente | 264.271.935 bytes | 154.703.249 bytes |
| Tamaño en MiB | 252,03 MiB | 147,54 MiB |
| Archivos retirados | — | **46** |
| Ahorro lógico del árbol vigente | — | **109.568.686 bytes (104,49 MiB; ~41,46 %)** |

> Las imágenes retiradas siguen recuperables en commits anteriores. Esta limpieza NO reescribe el historial Git, por lo que **no garantiza reducir de inmediato el tamaño de todos los clones ni del historial alojado por GitHub**. No usar herramientas de reescritura de historia sin una decisión y respaldo específicos.

### Archivos retirados y evidencia

| Grupo | Archivos | Bytes | Justificación |
| --- | ---: | ---: | --- |
| referencias/comunidad-v3/ | 16 | 40.715.733 | Fondos, personajes y decoraciones idénticos por SHA a las copias de ejecución; seis capturas de diseño sin dependencias de ejecución. Se conserva frontend/src/shared/assets/comunidad-v3. |
| docs/diseno/ sin referencias de texto/código | 16 | 35.091.722 | Copia documental de fondo ya presente en src y 15 maquetas sin consumidores localizados mediante búsqueda del nombre en archivos indexados. Se conservan las imágenes citadas por documentos. |
| Arte antiguo o duplicado de jardines | 6 | 18.367.003 | Tres paisajes reemplazados por region-scenes, paisaje Costa reemplazado por el recurso canónico idéntico, pared vertical v3 reemplazada por arte v4 y paisaje andino v1 reemplazado por v2. |
| Guías duplicadas de bienvenida | 4 | 7.697.198 | Son bytes idénticos a la copia central compartida de comunidad-v3; AuthPage ahora usa URLs estáticas a los archivos compartidos, compatibles con Vite y Playwright. |
| Guías duplicadas de Phaser | 4 | 7.697.198 | Son bytes idénticos a la copia central compartida de comunidad-v3; garden-guides.ts ahora usa URLs estáticas a los archivos compartidos, compatibles con Vite y Playwright. |

**Verificación de equivalencia visual:** se contrastaron los SHA de blobs Git para los archivos duplicados. Los nombres de importación fueron redirigidos hacia las imágenes canónicas, sin alterar el contenido binario.

### Refactorización de código

- frontend/src/features/auth/AuthPage.tsx: reutiliza las guías de Sierra y Amazonía mediante rutas `new URL(..., import.meta.url)` a la carpeta canónica, sin importación binaria en módulos de Node.
- frontend/src/features/my-garden/garden-guides.ts: reutiliza los cuatro personajes desde el directorio compartido mediante URLs estáticas, sin copias en Phaser.
- frontend/src/features/my-garden/phaser-poc/assets.ts: Costa utiliza el fondo regional compartido mediante `new URL` en lugar de importar un módulo que a su vez importa un PNG (Playwright ejecuta parte de estas rutas en Node). Se eliminó photoTextureKey porque no tenía llamadas en el código (era la clave de una textura fotográfica de la V1).
- Se actualizaron los README y documentos de referencia que apuntaban a assets retirados. El documento docs/arquitectura/ciclo-planta-espejo-v1.md ya está identificado como histórico/obsoleto; no debe confundirse con el diseño V2.

## Lo que se verificó y NO se eliminó

- **frontend/src/shared/assets/comunidad-v3/**: fuente canónica usada por las páginas de comunidades, bienvenida y jardín; borrar aquí rompería la interfaz.
- **frontend/public/regional-backgrounds/**: las URL se resuelven en tiempo de ejecución; no todo asset se importa con \`import\`. Cubiertos además por pruebas regionales.
- **frontend/src/features/my-garden/phaser-poc/art/costa-v1/*reference-v1.png**: pese al nombre \`reference\`, coastal-terrain.ts los importa realmente.
- **frontend/src/features/real-gardens/assets/*-v1.jpg**: imágenes reutilizadas como fixtures en varias suites Playwright.
- **docs/diseno/**: se retuvieron referencias citadas por documentos (bienvenida, comunidad v2, huerto, Mi Jardín y otras); no se eliminó la documentación académica, trazabilidad ni informes.
- **backend/prisma/migrations/**, \`backend/prisma/regional-species.json\`, \`frontend/src/features/medicinal-catalog/regional-species.json\`: conservar migraciones y datos por contexto de backend/frontend; un nombre repetido no implica eliminación segura.
- **frontend/src/assets/ecuador-provincias.geojson** y su LICENSE: mantener los datos geográficos y atribución.
- **Docker, Caddy, GitHub Actions, tests y backend/uploads/plants/.gitkeep**: conservar para ejecución, QA y despliegue; archivos temporales, bases reales, secretos y dist ya están excluidos por gitignore/dockerignore.
- No hay una carpeta actualmente versionada llamada **LM** en el árbol inspeccionado. No se eliminó ninguna por suposición.

## Validación y límites

- GitHub Actions de frontend debe comprobar \`typecheck\`, build, pruebas unitarias y suite Playwright, incluidos jardines de Costa/Sierra/Amazonía/Galápagos y sus modalidades. Los resultados de CI deben revisarse sobre el commit final del PR, no sobre commits previos.
- No se hicieron pruebas manuales de navegador o dispositivo físico en este proceso. No atribuir éxito funcional real únicamente a CI.
- No se realizó análisis exhaustivo de control de flujo de cada función ni detección de dependencias con acceso a runtime local; la eliminación de código se limitó a una función sin referencias y activos con evidencia de no uso.
- La sincronización del Espejo Digital Evolutivo con usuarios autenticados depende todavía de #35/#43; la moderación, seguridad de fotos y despliegue quedan en #45/#49. **La exposición pública de /uploads debe resolverse antes de abrir la plataforma con evidencias personales.**
