# Dudas y decisiones pendientes — Kawsapacha V1

**Responsable:** Leonardo Lugmaña (Analista) · **Revisor:** Leonel Morales (PM) · **Issue:** #2 ANA-001
**Fecha:** 15/11/2026 · Relacionado con: [historias de usuario V1](../historias-usuario/historias-usuario-v1.md), [alcance V1](alcance-v1.md), [lineamientos MSP aplicados](lineamientos-msp-aplicados.md), [preguntas al cliente](preguntas-al-cliente.md), [flujo MSP no bloqueante](flujo-msp-v1-no-bloqueante.md)

## 1. Decisiones del equipo

| # | Tema | Situación | Pregunta / decisión | A quién | Afecta a | Estado |
|---|---|---|---|---|---|---|
| D-01 | **Cualidad caliente/fría en el catálogo** | Las 30 fichas tienen familia, altitud, provincias, ciclo, usos, cuidados y fuente, pero la cualidad figura como «Por documentar con los saberes locales». La señalética sí usa el Anexo 5 del MSP para siete especies. Solo 13 de las 30 especies tienen fotografía. | ¿Se copia la clasificación del Anexo 5 a las fichas de esas siete especies? ¿Se completan las fotos o se declara como limitación? | Leonel, Ronny | HU-013, HU-026 | Abierta |
| D-02 | **Autenticación** | Registro e inicio de sesión con JWT y contraseñas cifradas con bcrypt, sobre SQLite. | — | — | HU-001 a HU-003 | ✅ Resuelta |
| D-03 | **Base de datos** | SQLite con Prisma 5.22, documentado en el README raíz. | — | — | Informe, README | ✅ Resuelta |
| D-04 | **Roles** | Roles globales `USUARIO`, `ADMIN_MSP` y `ADMIN_TECNICO`; roles por comunidad Responsable, Cuidador y Participante, con permisos en el servidor. | — | — | HU-006, HU-007, HU-029 a HU-031 | ✅ Resuelta |
| D-05 | **Datos personales del integrante** | Fecha de nacimiento, género, talentos y nivel no se guardan en el modelo `CommunityMember`. | ¿Se agregan con consentimiento informado o se declara como limitación V1? | Ronny | HU-007 | Abierta |
| D-06 | **Validaciones de comunidad** | No están documentadas las reglas exactas de contacto (teléfono, correo). | Confirmar las reglas implementadas. | Leonel | HU-005 | Abierta |
| D-07 | **Gamificación** | Los puntos se acreditan en el servidor con un libro de movimientos, límites diarios y reversión por invalidación; misiones e insignias también se guardan en el servidor. | — | — | HU-018 | ✅ Resuelta |
| D-08 | **Estimaciones** | Las horas de las HU las estimó el analista (345 h en total). | Validar o corregir las horas. | Leonel, Ronny | Todas las HU | Abierta |
| D-09 | **Estados de prueba** | La plantilla oficial solo tiene Aprobado / Reprobado; los planes de QA usan también BLOQUEADO y NO EJECUTADO. | Usar solo Aprobado/Reprobado en las fichas y reportar los demás estados en la matriz. | Santiago | Casos de prueba | ✅ Resuelta: los 17 casos usan Aprobado/Reprobado |
| D-10 | **Plantilla del informe** | No hay plantilla Word oficial del informe. | Usar la estructura propuesta por el analista, basada en la consigna. | Leonel | Informe final | Abierta |
| D-11 | **Alcance del rol Cuidador** | El Cuidador registra y modifica recursos de la bodega y registra cosechas; no está definido si tiene otros permisos. | Confirmar los permisos del Cuidador. | Ronny | HU-007, HU-021, HU-022 | Abierta |
| D-12 | **Alcance de la V1** | La V1 comprende todo lo integrado en `main`: usuarios, comunidades, huertos, catálogo, Mi Huerto, ciclo agrícola, Mi Camino Verde, notificaciones y administración MSP. | — | — | Alcance, informe | ✅ Resuelta |
| D-13 | **Secreto JWT de ejemplo** | `.env.example` trae un `JWT_SECRET` de desarrollo; el README raíz aclara que es solo para uso local. Las contraseñas de `admin1`/`admin2` también son de ejemplo. | Cambiar ambos antes de cualquier despliegue público. | Ronny | Seguridad | Abierta |
| D-14 | **Tipos de suelo** | El selector ofrece los seis tipos del MSP (Tabla 1): arcilloso, limoso, arenoso, margoso, gredoso y pantanoso. | — | — | HU-010 | ✅ Resuelta |
| D-15 | **Revisión MSP sin bloqueos** | Las comunidades pendientes funcionan desde su creación; las actividades quedan válidas al registrarse y el MSP las revisa después, con reversión de puntos si las invalida ([flujo MSP](flujo-msp-v1-no-bloqueante.md)). | — | — | HU-005, HU-017, HU-029 | ✅ Resuelta |
| D-16 | **Ranking** | El ranking entre comunidades y la entrega de premios no forman parte de la V1. | Definir criterios con el cliente para la V2 (C-01). | Leonel | HU-018, alcance | ✅ Resuelta para V1 |

## 2. Requisitos ambiguos de la definición del proyecto

Las preguntas formales para el cliente están en [preguntas-al-cliente.md](preguntas-al-cliente.md).

| Requisito | Ambigüedad |
|---|---|
| Ranking de comunidades | No se define el criterio: ¿puntos totales, actividades, plantas? (C-01) |
| Certificación de talentos | No se indica quién certifica ni con qué evidencia. (C-03) |
| Ascenso de nivel | No se define cuántos puntos o hitos requiere cada nivel. El equipo usa Aprendiz 0, Oficial 100 y Maestro 300. (C-02) |
| Huertos por comunidad | La definición habla de «el huerto real de cada comunidad»; el modelo permite varios huertos por comunidad. (C-05) |
| «Planta caliente o fría» | **Con fuente para siete especies:** el MSP 2017 (Anexo 5). Las demás especies del catálogo quedan por documentar con saberes locales (D-01). |
| Moderador del foro | No se define quién lo designa ni las reglas de participación. (C-11) |

## 3. Requisitos de la definición fuera del alcance V1

Se planifican para la versión 2; **no se eliminan** del producto completo (ver [alcance V1](alcance-v1.md)):

- Ranking nacional o provincial entre comunidades y entrega de premios.
- Foro con moderador y reglas de participación.
- Certificación de talentos.
- Retos y misiones definidos con el cliente (la V1 trae tres misiones y cinco insignias del equipo).
- Historia visual con videos y exportación de reportes.

## 4. Documentos de referencia

| Documento | Estado |
|---|---|
| Definición del proyecto «Huertos Medicinales Comunitarios» | ✅ Disponible (aula virtual). |
| Lineamientos MSP 2017 (*Implementación de huertos medicinales…*) | ✅ Disponible. Resumen aplicado en [lineamientos-msp-aplicados.md](lineamientos-msp-aplicados.md). |
| Plantillas de historias de usuario y casos de prueba | ✅ Disponibles (aula virtual). |
| Presentación del taller de definición / preguntas al cliente | ❌ **No disponible.** Se sustituye por [preguntas-al-cliente.md](preguntas-al-cliente.md), sin atribuir respuestas al cliente. |
| Plantilla Word oficial del informe | ❌ **No disponible** (D-10). |
