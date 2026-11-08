# Dudas y decisiones pendientes — Kawsapacha V1

**Responsable:** Leonardo Lugmaña (Analista) · **Revisor:** Leonel Morales (PM) · **Issue:** #2 ANA-001
**Fecha:** 08/11/2026 (actualizado tras la integración del backend, PR #30 y #31) · Relacionado con: [historias de usuario V1](../historias-usuario/historias-usuario-v1.md), [alcance V1](alcance-v1.md), [lineamientos MSP aplicados](lineamientos-msp-aplicados.md), [preguntas al cliente](preguntas-al-cliente.md)

## 1. Decisiones que necesitan respuesta antes de la entrega (10/11)

| # | Tema | Situación | Pregunta / decisión | A quién | Afecta a | Estado |
|---|---|---|---|---|---|---|
| D-01 | **Ficha botánica incompleta** | El catálogo del backend tiene descripción, usos, preparación y contraindicaciones de 8 especies, pero **no** fotos, familia, altitud, provincias, cualidad caliente/fría ni fuentes. | ¿Se completa para la V1 (cualidad y ciclo pueden tomarse del MSP) o se documenta como limitación? | Leonel, Ronny | HU-013 | Abierta |
| D-02 | **Autenticación real** | Integrada en `main` (PR #30): JWT, bcrypt, SQLite. | — | — | HU-001 a HU-003 | ✅ Resuelta |
| D-03 | **Base de datos** | El backend usa **SQLite + Prisma 5.22**. El README raíz aún menciona PostgreSQL. | Actualizar el README raíz a SQLite. | Leonardo | Informe, README | Resuelta; falta corregir README |
| D-04 | **Roles básicos** | Implementados Responsable y Participante, con permisos en el servidor. | — | — | HU-006, HU-007 | ✅ Resuelta |
| D-05 | **Datos personales del integrante** | Fecha de nacimiento, género, talentos y nivel existen en la interfaz, pero el modelo `CommunityMember` no los guarda. | ¿Se agregan al backend o se declara como limitación V1? | Ronny | HU-007 | Abierta |
| D-06 | **Validaciones de comunidad** | No están documentadas las reglas exactas de contacto (teléfono, correo). | Confirmar las reglas implementadas. | Leonel | HU-005 | Abierta |
| D-07 | **Gamificación local vs. servidor** | Puntos, niveles e insignias se calculan en el navegador; `gamificacion-v1.md` dice que debería decidirlo el backend. | Aceptar como regla local de V1 y documentarlo. | Leonel | HU-018 | Abierta |
| D-08 | **Estimaciones** | Las horas de las HU las estimó el analista. | Validar o corregir las horas. | Leonel, Ronny | Todas las HU | Abierta |
| D-09 | **Estados de prueba** | La plantilla oficial solo tiene Aprobado / Reprobado; el plan de QA usa también BLOQUEADO y NO EJECUTADO. | Usar solo Aprobado/Reprobado en las fichas y reportar los demás estados en la matriz. | Santiago | Casos de prueba | Abierta |
| D-10 | **Plantilla del informe** | No hay plantilla Word oficial del informe. | Usar la estructura propuesta por el analista, basada en la consigna. | Leonel | Informe final | Abierta |
| D-11 | **Rol Cuidador** | La documentación dice «2 roles», pero el modelo de datos y los permisos del almacén incluyen **CUIDADOR**. | ¿Cuidador es un rol oficial de V1? | Ronny | HU-007, HU-021 | Abierta |
| D-12 | **Alcance ampliado** | El backend integrado añade bodega, cosecha, calendario lunar e invitaciones (HU-020 a HU-023), que no estaban en los cinco módulos iniciales. | Confirmar que forman parte de la entrega V1 y actualizar `alcance-v1.md`. | Leonel | Alcance, informe | Abierta |
| D-13 | **Secreto JWT de ejemplo** | `backend/README.md` muestra un `JWT_SECRET` de desarrollo. | Aclarar que es solo para desarrollo local y no debe usarse en un despliegue. | Ronny | Seguridad | Abierta |
| D-14 | **Tipos de suelo** | El backend no admite gredoso ni pantanoso, que pide la definición y el MSP (Tabla 1). | Añadirlos o documentar la limitación. | Ronny, Leonel | HU-010 | Abierta (M-01) |

## 2. Requisitos ambiguos de la definición del proyecto

Las preguntas formales para el cliente están en [preguntas-al-cliente.md](preguntas-al-cliente.md).

| Requisito | Ambigüedad |
|---|---|
| Ranking de comunidades | No se define el criterio: ¿puntos totales, actividades, plantas? (C-01) |
| Certificación de talentos | No se indica quién certifica ni con qué evidencia. (C-03) |
| Ascenso de nivel | No se define cuántos puntos o hitos requiere cada nivel. El equipo propuso Aprendiz 0, Oficial 100 y Maestro 300. (C-02) |
| Huertos por comunidad | La definición habla de «el huerto real de cada comunidad»; el modelo permite varios huertos por comunidad. (C-05) |
| «Planta caliente o fría» | **Resuelta con fuente:** el MSP 2017 (Anexo 5) clasifica 7 de las 8 especies del catálogo. |
| Moderador del foro | No se define quién lo designa ni las reglas de participación. (C-11) |

## 3. Requisitos de la definición fuera del alcance V1

Se planifican para incrementos posteriores; **no se eliminan** del producto completo (ver [alcance V1](alcance-v1.md)):

- Rituales de siembra y cosecha como actividades.
- Señalética, secado, empaquetado, etiquetado y almacenaje de plantas secas.
- Historia visual con videos.
- Ranking entre comunidades, retos validados por el servidor y certificación de talentos.
- Foro con moderador y reglas de participación.

**Ya no están fuera de alcance** (implementados con el backend, pendiente de confirmar en D-12): bodega o almacén comunitario y calendario de siembra con consejo lunar.

## 4. Documentos de referencia

| Documento | Estado |
|---|---|
| Definición del proyecto «Huertos Medicinales Comunitarios» | ✅ Disponible (aula virtual). |
| Lineamientos MSP 2017 (*Implementación de huertos medicinales…*) | ✅ Disponible. Resumen aplicado en [lineamientos-msp-aplicados.md](lineamientos-msp-aplicados.md). |
| Plantillas de historias de usuario y casos de prueba | ✅ Disponibles (aula virtual). |
| Presentación del taller de definición / preguntas al cliente | ❌ **No disponible.** Se sustituye por [preguntas-al-cliente.md](preguntas-al-cliente.md), sin atribuir respuestas al cliente. |
| Plantilla Word oficial del informe | ❌ **No disponible** (D-10). |
