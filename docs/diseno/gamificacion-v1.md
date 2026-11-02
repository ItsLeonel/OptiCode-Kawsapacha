# Kawsapacha — Guía de identidad y gamificación (V1)

**Estado:** Decisiones de diseño acordadas para orientar la implementación; las reglas cuantitativas aún requieren aprobación del equipo.

## 1. Propósito

Construir una experiencia interactiva y educativa vinculada a huertos medicinales comunitarios del Ecuador. La experiencia digital representa y acompaña el registro de actividades realizadas en el huerto real; no sustituye el cultivo ni demuestra por sí sola que una planta haya crecido.

## 2. Vocabulario oficial de interfaz

| Concepto | Denominación en Kawsapacha | Uso previsto |
|---|---|---|
| Puntos de experiencia (XP) | **Semillas de vida** | Unidad digital de reconocimiento por actividades verificables, sin valor monetario ni equivalencia con semillas físicas |
| Misiones / quests | **Retos verdes** | Acciones concretas y comprobables relacionadas con huertos y aprendizaje |
| Achievements | **Insignias** | Reconocimientos por hitos definidos |
| Progreso | **Mi camino verde** | Vista de avances y reconocimientos |
| Jardín privado | **Mi jardín** | Nombre accesible y principal de la pantalla de inicio |
| Referencia cultural al huerto | **Chakra** | Término contextual que puede explicarse como espacio de cultivo familiar; no reemplazar automáticamente todos los usos de «huerto» |
| Jardín medicinal (referencia cultural) | **Hampi chakra** | Puede aparecer en contenidos educativos con contextualización |
| Parcelas/surcos | **Parcelas** / **wachu (surco)** | «Parcela» para acciones generales; «wachu» en contexto educativo con explicación |
| Historial | **Bitácora de cultivo** | Registro de actividades con fechas y fotografías |
| Ficha de planta | **Pasaporte Vivo** | Identidad de la planta, fotos e historial |
| Grados de experiencia | **Aprendiz → Oficial → Maestro** | Niveles especificados por la definición académica del proyecto |

**Precisión cultural:** «Semillas de vida», «Retos verdes» y «Mi camino verde» son nombres creativos del equipo; no se atribuyen al MSP. Las expresiones kichwas deben contextualizarse y emplearse de forma respetuosa.

## 3. Experiencia principal

La aplicación muestra **Mi jardín**, una escena interactiva 2D/2.5D. Las parcelas visibles representan plantas reales registradas. Cada parcela permite consultar su **Pasaporte Vivo**, abrir la **Bitácora de cultivo** o iniciar una acción autorizada. La barra de navegación ofrece accesos sencillos a **Mi jardín**, **Comunidad**, **Descubrir plantas** y **Mi historia**.

La experiencia pública de demostración debe ser claramente distinta de un jardín privado autenticado. Sin backend, ningún dato de ejemplo debe presentarse como dato real de una cuenta.

## 4. Retos verdes propuestos para V1

| Reto | Criterio de cumplimiento propuesto | Requiere servidor |
|---|---|---|
| Nuestra primera comunidad | Crear o integrarse realmente a una comunidad | Sí |
| La primera semilla | Registrar una planta real vinculada a un huerto | Sí |
| Raíces que crecen | Guardar una actividad con evidencia fotográfica | Sí |
| Frutos del esfuerzo | Completar un hito de cultivo definido por el equipo | Sí |

No se establecen todavía cantidades de Semillas de vida, umbrales de niveles, ranking ni fórmulas de recompensas. Estos valores se definirán en reglas de negocio compartidas con backend y QA, y se probarán antes de aprobar la V1.

## 5. Reglas de integridad

1. **El backend decide y almacena las recompensas**, no el frontend.
2. Una actividad registrada debe estar vinculada a un usuario autorizado, una comunidad/huerto cuando proceda, una fecha y un tipo de actividad.
3. Los retos deben tener criterios de aceptación comprobables, y evitar recompensas duplicadas por la misma acción.
4. El progreso **visual** de la planta debe corresponder a actividades y evidencias registradas; no se inventará crecimiento por acumulación de puntos.
5. Los elementos de demostración se señalarán como **datos de ejemplo**.
6. El contenido educativo sobre plantas no constituye una recomendación médica.

## 6. Responsabilidades

- **Frontend (Leonel):** interfaz de Mi jardín, etiquetas, estados visuales, interacciones y conexión a contratos de API confirmados.
- **Backend (Ronny):** modelo de progreso y actividades, autorización, persistencia, validación de retos y asignación de Semillas de vida.
- **Documentación (Leonardo):** historias de usuario, reglas de negocio, criterios de aceptación y trazabilidad.
- **QA (Santiago):** pruebas de progresión, duplicados, permisos y correspondencia entre huerto real y virtual.
- **Diseño (Dylan):** consistencia visual, iconografía y recursos gráficos originales.

## 7. Fuentes del proyecto consultadas

- **Definición del proyecto «Huertos Medicinales Comunitarios»**, ISWD652 Calidad de Software, periodo 2026B: establece huerto real/virtual, actividades, gamificación y grados «Aprendiz, Oficial, Maestro».
- **MSP Ecuador, *Implementación de huertos medicinales en los establecimientos de salud del primer nivel de atención. Lineamientos* (2017)**: contexto cultural de «Kawsapacha», «chakra», «hampi chakra», «wachu» y prácticas de cultivo. Los nombres de gamificación propuestos por el equipo no son terminología oficial del MSP.

**Próximo paso técnico:** después de revisar e integrar la rama de autenticación, iniciar una rama separada para la interfaz «Mi jardín», documentar las pantallas y construir una demo interactiva sin fingir operaciones reales de servidor.
