# Documentación del proyecto Kawsapacha

**Responsable de consolidación y mantenimiento:** Leonardo Lugmaña.

Los especialistas aportan información comprobable; Leonardo redacta y consolida; Leonel revisa y entrega.

## Por dónde empezar

| Necesito… | Documento |
|---|---|
| Saber qué incluye la V1 | [Alcance V1](analisis/alcance-v1.md) |
| Ver las historias de usuario | [Historias de usuario V1](historias-usuario/historias-usuario-v1.md) |
| Entender la arquitectura | [Arquitectura implementada](architecture/README.md) |
| Consultar los servicios de la API | [Contratos de API](arquitectura/contratos-api.md) |
| Ejecutar la aplicación y entrar con las cuentas de prueba | [README principal](../README.md) y [credenciales y actualización de la base](CREDENCIALES-Y-ACTUALIZACION-BD.md) |
| Probar la aplicación | [Casos de prueba](casos-prueba/README.md) |
| Leer el informe final | [Borrador del informe](informe/informe-v1.md) |

## Carpetas

### Análisis y requisitos
- `analisis/`: [alcance V1](analisis/alcance-v1.md), [dudas y decisiones](analisis/dudas-y-decisiones-pendientes.md), [lineamientos MSP aplicados](analisis/lineamientos-msp-aplicados.md), [preguntas al cliente](analisis/preguntas-al-cliente.md), [trazabilidad con el cliente](analisis/trazabilidad-cliente-2026-11-14.md), [flujo MSP no bloqueante](analisis/flujo-msp-v1-no-bloqueante.md) y [auditoría de limpieza del repositorio](analisis/auditoria-limpieza-repositorio-2026-11-14.md).
- `historias-usuario/`: [historias de usuario V1](historias-usuario/historias-usuario-v1.md) según la plantilla docente.
- `requirements/`: [índice de requisitos](requirements/README.md). Solo enlaza documentos de `analisis/`; no tiene contenido propio.

### Arquitectura
- `architecture/`: **arquitectura vigente**: [visión de módulos](architecture/README.md), [ADR-0001 monolito modular](architecture/ADR-0001-monolito-modular.md), [ADR-0002 límites transaccionales](architecture/ADR-0002-limites-transaccionales.md) y [auditoría de fronteras](architecture/auditoria-fronteras-2026-11-15.md).
- `arquitectura/`: [contratos de API](arquitectura/contratos-api.md), [despliegue con Docker y HTTPS](arquitectura/despliegue-docker-https.md), [acceso móvil](arquitectura/acceso-movil-demo-v1.md), [Espejo Digital V2](arquitectura/contrato-espejo-digital-v2.md) y [espejo fotográfico](arquitectura/espejo-evolutivo-fotografico.md), además de documentos de frontend y backend. Para la estructura actual del código prevalece `architecture/`.

### Diseño
- `diseno/`: prototipos, capturas y guía UI/UX de Dylan.

### Calidad y pruebas
- `casos-prueba/`: plan, casos, resultados y capturas de Santiago; [plan manual del ciclo agrícola](casos-prueba/ciclo-agricola-v2-manual.md).
- `quality/`: [mantenibilidad según ISO/IEC 25010](quality/README.md), [regresión de arquitectura](quality/regresion-arquitectura.md), [línea base de Playwright](quality/regresion-baseline-2026-11-15.md) y [auditoría de activos](quality/auditoria-activos.md).

### Informe y organización
- `informe/`: [esquema](informe/esquema-informe-v1.md), [borrador](informe/informe-v1.md), diagrama entidad-relación y documento Word del informe final (`Proyecto-Version1-OptiCode.pdf`).
- `organizacion/`: reglas de trabajo, roles y convenciones.

### Otros documentos
- [Credenciales en BD y actualización de SQLite](CREDENCIALES-Y-ACTUALIZACION-BD.md): cuentas técnicas `admin1` / `admin2`, creación de usuarios y cuentas MSP desde la app, y migración desde bases anteriores.
- [Implementación de Mi Jardín Vivo](mi-jardin-vivo-implementacion.md) y [correcciones regionales de fotografías](correcciones-regionales-fotografias-v1.md).

> **Carpetas en español y en inglés:** `architecture/`, `quality/` y `requirements/` conviven con `arquitectura/` y `analisis/`. No se fusionan para no romper los enlaces que ya usan el código, el CI y otros documentos.
