# Kawsapacha V1: fondos regionales y fotografías

## Cambios de comportamiento

1. Comunidades guarda provincia, cantón, parroquia y sector en SQLite. Al seleccionar otra comunidad, el fondo se calcula con su provincia. Los registros anteriores pueden recuperar la provincia del texto de ubicación existente. Sierra, Amazonía y Galápagos usan copias exactas de los tres PNG de `referencias/Entorno regiones/fondos/`. Costa conserva su recurso actual.
2. La portada de la comunidad admite creación, reemplazo y eliminación desde el asistente. La fotografía seleccionada se sube al backend en la misma solicitud que los datos y su URL se guarda en `Community.photoUrl`.
3. Mi Terreno permite elegir o cambiar una fotografía en creación y edición, y muestra la URL persistida en «Características de mi terreno». El fondo usa la provincia válida del huerto; si falta o es inválida, usa la comunidad asociada. Cambiar de provincia limpia las localidades y coordenadas anteriores. Editar una foto de comunidad no traslada un huerto con ubicación independiente.

Los formularios conservan el borrador y muestran el error si falla el guardado. Los archivos `File` y las URL `blob:` solo sirven para la vista previa; las sesiones autenticadas recuperan los datos del backend. Se conserva el modo de demostración local existente.

## Almacenamiento y permisos

- Una fotografía JPG, PNG o WebP de hasta 3 MiB por solicitud. Se comprueban MIME, tamaño y firma del contenido.
- Nombres aleatorios y extensiones canónicas. No se aceptan rutas locales ni URL suministradas por el cliente como referencia de fotografía.
- Archivos en `backend/uploads/communities/` y `backend/uploads/gardens/`, o bajo `UPLOADS_DIR` cuando se configure. Se sirven mediante `/uploads/...`.
- La referencia anterior se retira después de guardar la nueva. Si falla SQLite, se elimina la subida nueva y se mantiene la foto anterior.
- Solo un responsable aceptado puede editar una comunidad; solo el creador del huerto o responsable de su comunidad puede editar el huerto. La creación con actualización de un huerto existente también verifica permisos.
- Los fondos se sirven desde `frontend/public/regional-backgrounds/`. No se incorporan sus bytes al JavaScript.
- No se modifica el código Phaser, las seis parcelas, plantas, actividades, cosechas ni gamificación en esta corrección. Los cambios de Phaser que ya estaban en la copia local se conservan.

## Migración

Archivo nuevo: `backend/prisma/migrations/20261109160000_regional_locations_and_photos/migration.sql`.

Solo contiene seis `ALTER TABLE ... ADD COLUMN`: cinco columnas opcionales en `communities` (`province`, `cantonCode`, `parishCode`, `sector`, `photoUrl`) y `photoUrl` en `real_gardens`. No reconstruye tablas ni elimina filas. Los registros anteriores siguen sin fotografía y utilizan la referencia predeterminada.

La migración se prueba en bases aisladas bajo `backend/test-results/`; no se aplica automáticamente sobre `backend/prisma/kawsapacha.db`.

## Aplicación local sin pérdida de datos

Detener primero el proceso del backend para liberar el motor Prisma de Windows. Conservar `.env`, SQLite y la carpeta de subidas. Desde la raíz, en PowerShell:

```powershell
Set-Location backend
Copy-Item -LiteralPath .\prisma\kawsapacha.db -Destination ".\prisma\kawsapacha.$(Get-Date -Format 'yyyyMMdd-HHmmss').backup.db"
npx.cmd prisma migrate status
npx.cmd prisma migrate deploy
npx.cmd prisma generate
npm.cmd run typecheck
npm.cmd run build
npm.cmd start
```

En otra terminal, desde la raíz:

```powershell
Set-Location frontend
npm.cmd run typecheck
npm.cmd run build
npm.cmd run dev
```

Si `DATABASE_URL` apunta a otro archivo, respaldar ese archivo en lugar del ejemplo. En un despliegue, respaldar también las fotografías y montar `UPLOADS_DIR` en un volumen persistente. El mismo origen debe enrutar `/api` y `/uploads` al backend; Vite ya incluye ese proxy para desarrollo. Las fotografías se recuperan en otro dispositivo accediendo al mismo servidor.

No ejecutar `prisma migrate reset`, borrar SQLite ni editar migraciones aplicadas.

## Comprobaciones

| Verificación | Resultado |
| --- | --- |
| Backend: `npm test` | 9/9 correctas, con SQLite y HTTP reales |
| Frontend: `test:unit` | 24/24 correctas |
| Frontend: pruebas integradas de fondos y fotos | 3/3 correctas (dos flujos principales y un caso de ubicación antigua) |
| `typecheck` frontend y backend | Correctos |
| `build` frontend y backend | Correctos |
| `prisma validate` | Esquema válido |
| Comparación SHA-256 de los tres PNG | Copias idénticas a las referencias |
| Recursos estáticos en `frontend/dist/regional-backgrounds/` | Los tres PNG presentes |
| Batería existente de los módulos: 47 casos | 22 correctos, 25 fallidos |
| Misma batería sobre el código original | 22 correctos, los mismos 25 fallidos |

Los fallos antiguos buscan controles eliminados del diseño actual (por ejemplo, «Mi terreno» dentro del menú principal, fecha de nacimiento o nivel declarado), usan un selector ambiguo de «Editar comunidad» o esperan mensajes antiguos de acceso. Se conservaron esas pruebas sin cambiar sus expectativas ajenas a esta tarea. Solo se actualizó la expectativa de URL del fondo en `community-wizard.spec.ts`, que ahora debe comprobar los PNG solicitados.

La comparación original se realizó sirviendo los componentes anteriores desde `git show HEAD` en un servidor temporal, sin reemplazar archivos de trabajo. Se compararon los títulos de los casos fallidos; no aparecieron fallos nuevos. En la comparación se acotó a diez segundos la espera de acciones sobre controles ausentes. Los informes y trazas están bajo `frontend/test-results/regional-existing/` y `frontend/test-results/baseline-existing-results/`.

Comandos reproducibles:

```powershell
# backend (requiere su cliente Prisma generado)
npm.cmd test
npm.cmd run typecheck
npm.cmd run build

# frontend; la prueba integrada requiere backend/dist actualizado
npm.cmd run test:regional-photos
npm.cmd run test:unit
npm.cmd run test:e2e -- community-wizard.spec.ts community-v3.spec.ts community-experience-v2.spec.ts real-gardens.spec.ts onboarding.spec.ts
npm.cmd run typecheck
npm.cmd run build
```

Las pruebas integradas usan una base nueva, cuentas ficticias y una carpeta propia de subidas. La prueba de navegador verifica los cuatro fondos, cambio de comunidad, creación y reemplazo de ambas fotos, edición de provincia, cierre de sesión y recuperación desde un contexto de navegador nuevo. La prueba del backend verifica permisos, archivos inválidos, reemplazo, eliminación, limpieza tras error y conservación de registros durante la migración.

## Observaciones previas del entorno

- Windows impidió que `prisma generate` reemplazara `query_engine-windows.dll.node` porque el motor actual permanece en uso. Las pruebas aisladas y la compilación utilizan correctamente el cliente actualizado; repetir `prisma generate` con el backend detenido antes de reiniciarlo sobre la base real.
- El historial anterior de migraciones no reproduce completamente la base V1 existente: faltan cambios históricos como `Community.type`, `RealGarden.characteristics` y `CultivatedPlant.archivedAt`, que sí están en la base local. No se alteran esas migraciones. El preparador de pruebas reproduce expresamente esa situación previa en su base aislada; una instalación desde cero necesita reconciliar ese historial por separado.
- Las pruebas antiguas se ejecutan y se comparan con la versión original para distinguir sus expectativas obsoletas de posibles regresiones de esta corrección.

## Archivos de esta corrección

Backend:

```text
.gitignore
backend/.env.example
backend/package.json
backend/prisma/schema.prisma
backend/prisma/migrations/20261109160000_regional_locations_and_photos/migration.sql
backend/src/app.ts
backend/src/controllers/community.controller.ts
backend/src/controllers/garden.controller.ts
backend/src/middlewares/entity-photo.middleware.ts
backend/src/middlewares/error.middleware.ts
backend/src/middlewares/upload.middleware.ts
backend/src/routes/community.routes.ts
backend/src/routes/garden.routes.ts
backend/src/services/community.service.ts
backend/src/services/garden.service.ts
backend/src/services/entity-photo.service.ts
backend/tests/setup-db.cjs
backend/tests/entity-photos.test.cjs
```

Frontend y documentación:

```text
frontend/package.json
frontend/vite.config.ts
frontend/playwright.regional-photos.config.ts
frontend/src/App.tsx
frontend/src/services/api.ts
frontend/src/shared/photo-validation.ts
frontend/src/shared/regional-landscapes.ts
frontend/src/shared/ui/game-ui/GameUI.tsx
frontend/src/features/communities/CommunitiesPage.tsx
frontend/src/features/communities/CommunityBuilderStep.tsx
frontend/src/features/communities/CommunityCoverPhoto.tsx
frontend/src/features/communities/CommunityForm.tsx
frontend/src/features/communities/CommunityOverview.tsx
frontend/src/features/communities/communities.ts
frontend/src/features/communities/community-territory.ts
frontend/src/features/my-garden/GardenRegionalScenery.tsx
frontend/src/features/my-garden/MyGardenPage.tsx
frontend/src/features/real-gardens/GardenCharacteristics.tsx
frontend/src/features/real-gardens/GardenPhoto.tsx
frontend/src/features/real-gardens/RealGardenPage.tsx
frontend/src/features/real-gardens/RealGardenSummary.tsx
frontend/src/features/real-gardens/real-garden.ts
frontend/tests/community-wizard.spec.ts
frontend/tests/regional-photos-server.ts
frontend/tests/regional-photos.spec.ts
frontend/public/regional-backgrounds/README.md
frontend/public/regional-backgrounds/Paisaje Andino con Volcán Nevado-2.png
frontend/public/regional-backgrounds/Paraíso Amazónico con Cabaña y Cascada-3.png
frontend/public/regional-backgrounds/Paisaje volcánico de las Galápagos-1.png
docs/correcciones-regionales-fotografias-v1.md
```

El cambio previo en `backend/prisma/seed.ts` no pertenece a esta corrección y se conserva. La autorización posterior permite un único commit local de esta corrección; no se hace push ni merge.
