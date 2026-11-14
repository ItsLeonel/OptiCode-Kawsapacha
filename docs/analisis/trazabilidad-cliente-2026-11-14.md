# Matriz de trazabilidad al 14/11/2026 — requisitos reales vs código

**Fuentes documentales:** `Definición del proyecto «Huertos Medicinales Comunitarios»`, pp. 1–2; presentación `Huertos_Medicinales_Comunitarios`, diapositivas 2–11; lineamientos MSP 2017. No se atribuyen respuestas al cliente donde solo existen preguntas (ver `preguntas-al-cliente.md`).

| Requisito / evidencia | Entregado en código | Pendiente de cierre | Responsable |
|---|---|---|---|
| Comunidad con responsable, miembros y ubicación (def. p.1) | CRUD, miembros, invitaciones y fotos | Perfil con talentos certificados, género/fecha nacimiento con consentimiento y nivel persistente | #48 Santiago, API coordinada |
| Huerto real: ubicación, suelo, agua, abono, cercas y modalidades (def. p.1) | Configurador regional de cuatro modalidades y seis parcelas | QA con móvil y geodatos; consistencia edición/persistencia | #14, #34 |
| Catálogo botánico y fotos (def. p.1) | 30 entradas regionales | Verificación botánica de distribución, altitud, fotografía/fuente y restricciones de Galápagos; evitar indicar dosis médicas | #11, MSP |
| Bodega (def. p.1, presentación p.7) | Inventario de recursos y cosechas con API | Movimientos, stock por lote, validación real de almacenamiento de plantas secas | Ronny / #48 |
| Preparación: suelo, surcos/terrazas, reposo 15 días (def. p.2) | Bitácora preparación + selector método en PR #57 | Validación móvil/API y calendario/guía no restrictiva | Ronny #43 |
| Siembra: semilla, estaca, esqueje, plántula (def. p.2) | Registro y método documentable en PR #57 | Capturar método desde alta de planta autenticada, API | Ronny #35/#43 |
| Rituales siembra y gratitud (def. p.2) | Tipos en Bitácora PR #57 | Sincronización con comunidad y avisos no invasivos | Ronny #43 |
| Señalética nombre, familia y cualidad caliente/fría (def. p.2) | Etiqueta imprimible PR #57; MSP verificado para siete especies | Clasificación fundamentada para restantes; evidencia de instalación | QA/curaduría MSP |
| Cuidados: riego, deshierbe, aporque y replante (def. p.2) | Bitácora y visual por evidencias, PR #55/#56 | API única con fotos y permisos entre dispositivos | Ronny #35/#43 |
| Cosecha parcial/completa (def. p.2) | Registro básico/cosecha y distinción en Bitácora | Ciclo y lote en servidor, conciliación de inventario | Ronny #35/#43 |
| Limpieza, secado 10–15 días, empaquetado/etiqueta y almacenamiento (def. p.2) | Secuencia local trazable en PR #57 | Persistencia/validación backend, cálculo de lotes y bodega, criterios de caducidad aprobados | Ronny #43, QA |
| Reportes: calendario, fotos y **videos** (def. p.2) | Calendario UI y álbum fotográfico local | API lunar, exportación/reportes, videos autorizados | Ronny #43 |
| Espejo virtual que refleja realidad (def. p.2, presentación p.9) | Etapas visuales sin crecimiento ficticio PR #55; ilustraciones/efectos #56 | Persistencia remota, fotos por etapa, QA móvil→PC | Ronny #35 |
| Puntos, insignias, niveles, misiones y ranking (def. p.2, presentación p.10) | Vista gamificada local | Motor validado servidor, reglas MSP, reversión, ranking nacional | Ronny #43/#45; Santiago #48 |
| Foro con moderador y reglas (def. p.2, presentación p.11) | UI comunitaria inicial | Persistencia de hilos, reportes, moderación y permisos | Santiago #48 |
| Eventos, experiencias, saberes, paneles MSP/técnico | Alcance ampliado #45–#48; previews UI existentes | Backend y flujo completo con datos reales | Ronny y Santiago |
| Despliegue público con HTTPS | Infraestructura en PR #58 | Dominio/servidor reales, privacidad de fotos, backups, QA física | Santiago #49 |
| QA e informe | Playwright CI y documentación parcial | Evidencias manuales, matriz de aceptación, informe final validado | Santiago #14; Leonardo #15 |

**Estados:** «código entregado» no significa «integración/QA aprobada». Los nuevos registros del PR #57 son **locales en IndexedDB**, incluso si el usuario inicia sesión; la futura API hará persistencia remota.

**Criterio de producto completo:** comunidad → huerto real → planta y método → evidencia de siembra → riegos/cuidados → fotos de etapas → cosecha → 5 pasos de poscosecha → bodega → recompensas/misiones validadas → foro/ranking, todo recuperable con sesión autorizada desde otro dispositivo.
