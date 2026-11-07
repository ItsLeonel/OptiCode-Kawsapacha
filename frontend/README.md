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

- El botón «Crear mi comunidad» abre un asistente accesible de cuatro pasos para crear y editar: tipo ilustrado, ubicación oficial, tres tarjetas de información y confirmación. Nombre, responsable, provincia, cantón y parroquia son obligatorios; contacto, sector o barrio, descripción e integrantes adicionales son opcionales. Personal (1 persona), Familiar, Condominio y Barrial son opciones válidas.
- Los datos permanecen en memoria al navegar y se pierden al recargar. La comunidad se comparte con los flujos existentes de huerto y registro de plantas.
- Tras crearla, se muestran sus datos, el número de integrantes adicionales sin exponer sus datos personales y el acceso al registro del huerto compartido o al jardín si ya existe.
- Saberes, experiencias, prácticas, conversaciones, novedades y actividades muestran estados de demostración. No incluyen publicaciones, videos, integrantes ni actividades ficticias. Publicar, unirse y sincronizar datos requieren una futura conexión con el backend.

La Fase 1 usa los paisajes, personajes e iconos del kit `kawsapacha-comunidad`. El mapa mantiene las 24 provincias y añade un acabado decorativo con Costa dorada, Sierra violeta, Amazonía verde y Galápagos turquesa. Provincia, guía, fondo y ficha se sincronizan mediante `regionForProvince`. [Contrato actual, datos provisionales, pruebas y futuras fases](../docs/fase-1-comunidades.md).

La mejora UX V2 conserva el panel aprobado de confirmación y añade cuatro ilustraciones originales de comunidad. La jerarquía provincia → cantón → parroquia usa exclusivamente `territory.ts` y DPA 2026; los códigos se validan contra sus padres antes de avanzar o confirmar. Cambiar provincia borra cantón, parroquia y sector; cambiar cantón borra parroquia. `location` se reconstruye con los nombres oficiales y el sector, sin interpretar un texto libre como cantón o parroquia. El hover azul discontinuo explora; la selección dorada con pin permanece hasta elegir otra provincia.

En el paso 3, Identidad, Responsable e Integrantes abren una sola edición a la vez. El territorio se consulta en una ficha de lectura con «Cambiar territorio». Los avatares usan iniciales de los nombres introducidos. Talentos y niveles son declarados, sin acreditación; fecha de nacimiento, género, teléfono y correo no se publican en la ficha general ni en el resumen de confirmación. El total cuenta a la persona responsable y a los integrantes adicionales. Todo sigue siendo temporal y los campos territoriales estructurados son provisionales hasta validar el contrato remoto. [Ilustraciones y prompts](src/assets/kawsapacha-comunidad/tipos-v2/README.md). Capturas V2 en `artifacts/comunidad-ux-v2/`.
- Publicar experiencias y conversar abren estados pendientes distintos: aún no existen carga de fotografías, publicaciones, temas ni respuestas. Aprendizaje y eventos muestran sus estados vacíos, sin contenido ni fechas inventadas.
- Los diálogos admiten teclado, Escape, gestión nativa del foco y validación del nombre. La distribución se adapta a escritorio, tableta y móvil.

## Mi Huerto V3

El módulo `src/features/real-gardens/` sigue `docs/diseno/referencia-mi-huerto-v3.png` y `docs/diseno/referencia-huerto-registrado-v1.png`, con paneles crema translúcidos, acentos terracota y verde natural. Conserva la barra lateral. Las 24 provincias determinan automáticamente uno de los cuatro fondos originales de `src/assets/regiones/` (Sierra, Costa, Amazonía y Galápagos), con transición suave y alternativa sin movimiento. No hay selector de región. Se abre desde «Mi Huerto», la acción «Mi huerto real» de Mi Jardín o el acceso al huerto de Comunidad.

- Nombre (3–100 caracteres), provincia, tipo, superficie mínima de 0,01 m² y disponibilidad de riego son obligatorios. El suelo se solicita para «En tierra»; en los demás tipos se guarda como `null`. Riego y suelo permiten indicar «Por determinar».
- Cantón y parroquia son selectores opcionales con búsqueda y filtrado jerárquico. Usan el catálogo oficial INEC DPA 2026 empaquetado localmente, con códigos oficiales y sin APIs inventadas. La dirección sigue siendo texto opcional. [Fuente e importación reproducible](src/features/real-gardens/data/README.md).
- «Marcar mi huerto en el mapa» abre React Leaflet con OpenStreetMap y atribución visible. El punto se coloca con clic/toque, se corrige arrastrando o se elige con teclado desde el centro del mapa. Se guarda opcionalmente en `RealGarden.location.coordinates`, con latitud y longitud. No se solicita ubicación del dispositivo ni se presenta como verificada. Cancelar conserva el punto previo; cambiar la localidad limpia el marcador.
- «Más características» agrupa riego y suelo y se abre al detectar errores. El botón del marcador usa verde lima y foco visible. Se retiran instrucciones redundantes del formulario.
- Después de guardar, el formulario y los mapas se ocultan por completo y aparece una ficha amplia con ilustración identificada, nombre, ubicación y tarjetas de características. Solo se muestran los datos opcionales registrados. «Editar mi huerto» vuelve al formulario con los datos guardados; guardar o cancelar regresa a la ficha. «Conectar con Mi Jardín» navega al módulo existente.
- `RealGarden` contiene `location`, `kind`, `areaM2`, `irrigationAvailability`, `soilType` y `communityName`. App mantiene el registro durante la visita y actualiza el vínculo cuando se crea o renombra la comunidad. Mi Jardín recibe este objeto sin cambios en sus seis parcelas, fotografías ni Pasaporte Vivo.
- App conserva en memoria tanto el borrador como el huerto guardado al navegar. No hay API, almacenamiento persistente, subida de datos ni conexión remota simulada. Al recargar se pierden los registros temporales. El mapa detallado sí usa teselas externas y necesita conexión.
- Regla V1: para guardar el huerto debe existir una comunidad, incluida una personal. Sin comunidad se permite explorar y preparar el borrador; el acceso a crearla conserva ese borrador y cualquier fotografía pendiente.
- Los fondos regionales se conservan con sus nombres originales. La ficha reutiliza una de las cuatro ilustraciones de tipos, sin presentarla como fotografía real ni añadir galerías o datos no registrados. Las ilustraciones y sus prompts están en [`src/features/real-gardens/assets/README.md`](src/features/real-gardens/assets/README.md).

Ver decisiones, clasificación de regiones y comprobaciones en [Mi Huerto V3](../docs/diseno/mi-huerto-v3.md) y la procedencia territorial y cartográfica en [Mi Huerto V2](../docs/diseno/mi-huerto-v2.md). `npm run test:e2e` ejecuta Playwright con Chrome instalado; las teselas se interceptan en las pruebas para evitar peticiones automatizadas al proveedor comunitario. `KAWSAPACHA_E2E_PORT` permite cambiar el puerto de pruebas si 5174 está ocupado.

## Mapa interactivo

`src/EcuadorMap.tsx` reutiliza una copia local de los datos GeoJSON provinciales de:
https://github.com/pabl-o-ce/Ecuador-geoJSON

**Autor:** Pablo Carrera Estrada · **Licencia:** MIT.
Su licencia original: https://github.com/pabl-o-ce/Ecuador-geoJSON/blob/master/LICENSE

Los archivos `src/assets/ecuador-provincias.geojson` y `src/assets/ecuador-provincias.LICENSE.txt` se incluyen en el build. Así el mapa no depende de GitHub en tiempo de ejecución. Se conserva la atribución y un selector alternativo por si falla la carga del recurso. Este conjunto de terceros no se presenta como un catálogo oficial actualizado de cantones o parroquias.

## Siguientes tareas

- **Leonel:** comprobar instalación, ajustar interfaz con Figma de Dylan, sustituir estados temporales por servicios API.
- **Ronny:** definir con Leonel contratos de API, autenticación, entidades y almacenamiento de fotos.
- **Leonardo:** documentar historias, tecnologías realmente aprobadas y alcance.
- **Santiago:** definir y ejecutar casos verificables a medida que se integren los servicios.
