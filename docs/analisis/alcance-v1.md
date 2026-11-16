# Kawsapacha — Alcance V1

> **Estado:** Alcance de trabajo definido por el Project Manager para la V1. La evaluación de esta V1 corresponde a los entregables. El equipo debe conocer esta delimitación y estimarla; no se espera una aprobación previa del profesor.

## Visión general
Kawsapacha es una aplicación web educativa y gamificada de huertos medicinales comunitarios en Ecuador. El producto completo incluye comunidades, huertos, catálogo, bodega, actividades y saberes tradicionales, calendario lunar, huerto virtual, recompensas, ranking y foro.

## Entregables académicos obligatorios V1
1. Historias de usuario siguiendo la plantilla del docente.
2. Arquitectura y diseño del producto.
3. Herramientas y tecnologías utilizadas.
4. Código fuente V1.
5. Casos de prueba ejecutados, resultados y evidencias.
6. Producto operativo.
7. README, repositorio e informe final `Proyecto-Version1-OptiCode.pdf` según plantilla Word oficial.

## Módulos funcionales de la V1

La aplicación presenta a la persona usuaria cuatro entradas: **Mi Huerto**, **Comunidad**, **Mi Camino Verde** y **Notificaciones**. Las cuentas institucionales disponen además de los paneles MSP y técnico. Por función, la V1 se organiza en ocho módulos:

| Módulo | Qué incluye | Historias |
|---|---|---|
| **Usuarios** | Registro, inicio y cierre de sesión, modo visitante. | HU-001 a HU-004 |
| **Comunidades** | Crear y editar la comunidad; invitar integrantes con roles Responsable, Cuidador o Participante; responder invitaciones; almacén comunitario (bodega). | HU-005 a HU-007, HU-020, HU-021 |
| **Huertos reales** | Registro y edición con provincia en **mapa interactivo de Ecuador** y alternativa accesible; cantón, parroquia, modalidad, superficie, suelo, agua, riego, cerca y abono. | HU-008 a HU-011 |
| **Catálogo y calendario** | 30 especies medicinales por región con ficha botánica y fuente; calendario de siembra y fase lunar como orientación. | HU-012, HU-013, HU-023 |
| **Mi Huerto (huerto virtual)** | Huerto 2D por región y modalidad con seis parcelas; registro de planta con foto real; Pasaporte Vivo; Espejo Digital que muestra la etapa observada. | HU-014 a HU-016, HU-027 |
| **Ciclo agrícola y Bitácora** | Preparación, siembra, riego, abonado, deshierbe, aporque, replante, seguimiento, cosecha, poscosecha, rituales y señalética botánica. | HU-017, HU-022, HU-024 a HU-026 |
| **Mi Camino Verde y notificaciones** | Puntos (Semillas de vida), niveles, misiones e insignias validados en el servidor; avisos de revisión. | HU-018, HU-028 |
| **Administración institucional** | Revisión MSP de comunidades y actividades sin bloquear a las comunidades; eventos y recursos educativos; cuentas MSP, activación de usuarios y auditoría. | HU-029 a HU-031 |

El modo visitante y la conservación de registros (HU-019) atraviesan todos los módulos: con sesión los datos se guardan en el servidor y como visitante en el navegador.

## Demostración propuesta
Crear cuenta → iniciar sesión → crear comunidad → registrar huerto con provincia en mapa → explorar catálogo → registrar planta con foto → verla en parcela del huerto 2D → registrar riego y seguimiento en la Bitácora → consultar Pasaporte Vivo y Mi Camino Verde → revisar la actividad desde el panel MSP → cerrar/iniciar sesión y verificar persistencia.

## Requisitos del producto completo planificados para la versión 2
Ranking nacional o provincial entre comunidades y entrega de premios, foro con moderación, certificación de talentos, retos definidos con el cliente, historia visual con videos y exportación de reportes. **Estos requisitos no se eliminan ni se declaran opcionales para el producto completo.** Si la rúbrica de evaluación especifica una cobertura distinta, se documentará como cambio de alcance.

## Ejecución sin bloqueos de aprobación
- [x] Leonel y la planificación de OptiCode definieron los módulos de la entrega funcional.
- [ ] Comunicar la delimitación y estimaciones a los demás integrantes.
- [x] Leonardo transcribe la delimitación en historias de usuario y documenta los compromisos concretos ([HU V1](../historias-usuario/historias-usuario-v1.md)).
- [ ] Verificar los entregables contra la consigna y cualquier rúbrica facilitada por el docente.

**No existe un requisito conocido de aprobación previa del profesor para comenzar la V1.**

## Responsables
- Leonel Morales — PM, frontend, revisión y entrega oficial.
- Leonardo Lugmaña — **toda la documentación, incluidas historias, consolidación README e informe PDF final**.
- Dylan Maldonado — UI/UX, diseño Figma y recursos gráficos.
- Ronny Veloz — backend, arquitectura, base de datos y servicios.
- Santiago Guamán — QA, casos de prueba, ejecución y evidencias.

## Calendario
- M1 (30/10/2026): análisis, diseño y preparación.
- M2 (06/11/2026): desarrollo e integración.
- M3 (08/11/2026): pruebas, documentación y entrega.
- 10/11/2026: demostración.

**Referencia de decisión:** Issue #1 (PM-001). Leonardo mantiene y actualiza este documento durante la ejecución.
