# Matriz de regresión de arquitectura — Kawsapacha

Objetivo: comprobar que la reorganización conserva cada comportamiento y dato.

## Antes de las pruebas

- Respaldar SQLite y backend/uploads. No ejecutar resets sobre datos reales.
- Comparar el mismo escenario en main y en la rama del PR, registrando SHA y capturas.
- Ejecutar typecheck, build, pruebas unitarias, integración, MSP, recompensas, Playwright y Docker.

## Casos de verificación manual (no sustituidos por CI)

| Funcionalidad | Escenario obligatorio | Estado |
| --- | --- | --- |
| Autenticación | Registro, login, cierre de sesión, autorización por rol | Pendiente |
| Comunidades | Creación, miembros, invitaciones y estados MSP | Pendiente |
| Mi Huerto | Región, modalidad, configuración y persistencia | Pendiente |
| Mi Jardín | Phaser: cuatro regiones, cuatro modalidades y seis parcelas | Pendiente |
| Plantas | Registrar con cámara, actualizar foto, pasaporte e historial | Pendiente |
| Bitácora | Riego, siembra, observación y evidencias asociadas | Pendiente |
| Actividades | Cosecha, poscosecha, calendario lunar y seguimiento | Pendiente |
| Camino verde | Puntos, misiones, insignias y ledger | Pendiente |
| MSP | Revisiones, auditoría, informes y moderación | Pendiente |
| Notificaciones | Listado, contador, lectura y limpieza | Pendiente |
| Invitado | IndexedDB local sin mezclar datos autenticados | Pendiente |
| Archivos | Rutas de fotos, recursos regionales, uploads y licencias | Pendiente |
| Despliegue | API, Caddy, volúmenes, healthcheck, Docker | Pendiente |

## Condiciones de aceptación

Los checks automatizados deben estar verdes sobre el último commit y los escenarios relevantes deben ejecutarse con resultados y evidencias. No fusionar con regresiones abiertas. CI exitoso NO demuestra por sí solo equivalencia funcional completa.
