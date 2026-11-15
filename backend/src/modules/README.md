# Módulos del backend

Cada carpeta representa una capacidad del negocio y agrupa su adaptador HTTP (`presentation`) y la implementación de los casos de uso/servicios (`application`).

## Objetivo y restricciones

- Mantener todas las rutas REST, respuestas, persistencia, reglas y datos de la versión anterior.
- El punto de composición es `../app/router.ts`; `../app.ts` continúa siendo el punto de entrada.
- `../infrastructure` contiene Prisma y configuración; `../shared` contiene middleware, tipos y utilidades.
- Las nuevas reglas puras deben vivir en `domain` sin importar Express, Prisma ni archivos.
- Los nuevos casos de uso deben depender de puertos/interfaces; los adaptadores implementarán esos puertos.

**Estado de migración:** la ubicación de los servicios existentes en `application` es un primer paso de reorganización. Varios todavía usan Prisma y otros servicios directamente. No se debe afirmar que toda la regla de dependencias de Clean Architecture está implementada hasta extraer esos detalles e introducir pruebas de fronteras.
