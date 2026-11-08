# QA de Kawsapacha V1 — Plan de Santiago y entregables para el 10/11/2026

**Responsable:** Santiago Guamán (`TonyTiago`) — QA / Tester  
**Documentación e informe:** Leonardo Lugmaña — consolida resultados; **PM / revisión:** Leonel; **backend:** Ronny.  
**Issues:** [QA-001 #5](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/5) (diseño) · [QA-002 #14](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/14) (ejecución).

> **Regla:** la responsabilidad formal de diseñar, ejecutar, documentar y evidenciar pruebas es de Santiago. Ronny verifica técnicamente su implementación y corrige defectos del backend; Leonel corrige frontend; Leonardo reúne resultados para el informe. No marcar una prueba «aprobada» sin ejecutarla y registrar evidencia. Separa pruebas locales, de integración real y bloqueadas.

## 1. Base académica que debe respetar el equipo

La consigna de entrega del **martes 10 de noviembre de 2026** pide: participación en el taller de definición/preguntas al cliente; revisión del documento de definición; estudio de lineamientos MSP e investigación complementaria apoyada por IA; **V1 con historias de usuario, arquitectura/diseño, herramientas/tecnologías, código fuente, casos de prueba con resultados y producto operativo**; informe de la plantilla Word exportado como `Proyecto-Version1-OptiCode.pdf` con enlaces a documentación, código y README; y demo presencial del producto. **QA no es responsable de escribir todos esos entregables:** Santiago es dueño de los *casos y resultados*; los otros documentos corresponden a Leonardo y sus autores técnicos, con revisión de Leonel.

**Documentos que Santiago debe consultar antes de cerrar los casos:** definición del proyecto, lineamientos MSP realmente proporcionados por el curso, historias de usuario y criterios de aceptación (coordinar con Leonardo), [alcance V1](../analisis/alcance-v1.md), [README frontend](../../frontend/README.md) y [PR backend de Ronny #26](https://github.com/ItsLeonel/OptiCode-Kawsapacha/pull/26). Registrar qué fuentes se consultaron; no dar por revisados los lineamientos MSP si aún no se han entregado o leído. Los casos de prueba deberán **pasarse a la plantilla oficial del profesor**.

## 2. Estado y dependencias (verificado 08/11/2026)

- **En `main` hoy:** interfaz React, flujo local de comunidad → Mi terreno, validaciones, selección territorial, fotos/plantas, Phaser, historial, IndexedDB y pruebas automatizadas. **No hay autenticación real ni base de datos central en `main`**; cada navegador/origen conserva sus propios registros locales. La suite automática no sustituye las evidencias formales de Santiago.
- **Ronny / PR #26:** backend Express/Prisma/SQLite/JWT propuesto, aún **sin fusionar** y con conflictos. Ronny debe adaptar e integrar **hasta registro y edición de huerto real**: cuentas/sesión, comunidades, permisos, huertos, API y persistencia. Santiago podrá probarlo cuando el flujo esté desplegado y accesible.
- **Mi Jardín:** todavía cambia su diseño e integración futura. **No bloquea el trabajo de QA de comunidades y terreno.** Sus casos se pueden *diseñar* y explorar hoy con la versión actual, pero la **aceptación final** del jardín debe repetir pruebas sobre la versión final aprobada. No exigir backend de plantas a Ronny en este corte.

## 3. Paso a paso: qué hacer ahora, sin esperar a Ronny (08/11)

- [ ] **Paso 1 — Preparar QA-001.** Leer alcance V1, definición del proyecto y criterios/HU disponibles; acordar con Leonardo los identificadores HU. Anotar pendientes de aclaración del cliente y requisitos MSP que afecten validaciones o contenido.
- [ ] **Paso 2 — Escribir plan de pruebas.** Objetivo, entorno (SO, navegador, URL/puerto, commit), alcance y exclusiones, datos ficticios, estrategias (funcional, negativo, UI, accesibilidad básica, persistencia), responsabilidades, riesgos y criterios de entrada/salida.
- [ ] **Paso 3 — Diseñar los casos P-001…** Utilizar la [plantilla de caso/resultado](plantilla-caso-resultado.md) y después la plantilla oficial. Cada caso tiene precondiciones, pasos reproducibles, datos, resultado esperado, HU vinculada y prioridad; incluir casos positivos y negativos.
- [ ] **Paso 4 — Ejecutar los casos disponibles en `main` hoy.** Empezar por bienvenida y validaciones de formulario (no autenticación real); crear/editar comunidad local; registrar/editar terreno, mapa/provincia, opciones de cultivo, errores y persistencia **solo de IndexedDB**. Guardar capturas con fecha/entorno y resultado observado real.
- [ ] **Paso 5 — Registrar defectos.** Abrir Issue por defecto reproducible (pasos, esperado/observado, severidad, commit, evidencia), informar a Leonel, repetir al corregirse.
- [ ] **Paso 6 — Compartir avance.** Subir plan y casos a `docs/casos-prueba/`, actualizar #5 con el enlace y entregar versión preliminar a Leonardo. Marcar dependencias **BLOQUEADO** o **NO EJECUTADO**, nunca «aprobado».

### Catálogo inicial sugerido (identificadores propuestos, no pruebas ejecutadas)

| ID | Comportamiento a comprobar | Cuándo | Evidencia necesaria |
| --- | --- | --- | --- |
| P-001 | Bienvenida → explorar demo y navegación | Ahora | Captura del flujo |
| P-002 | Registro/login: campos inválidos y mensajes (solo interfaz, sin sesión real) | Ahora | Captura de errores |
| P-003 | Crear comunidad personal o comunitaria y validar campos | Ahora | Formulario + estado guardado local |
| P-004 | Editar comunidad y comprobar conservación local | Ahora | Antes/después y recarga |
| P-005 | Elegir provincia, cantón/parroquia cuando aplique; coherencia con territorio | Ahora | Selección y validación |
| P-006 | Registrar huerto: tipo, superficie, características, foto y datos obligatorios | Ahora | Registro observado |
| P-007 | Editar huerto, cancelar edición y detectar errores de datos | Ahora | Capturas de ambos caminos |
| P-008 | Recarga del navegador con el **mismo origen**: persistencia local de comunidad y huerto | Ahora | Antes/después; especificar puerto/perfil |
| P-009 | Interfaz usable con teclado y pantalla móvil básica, sin solapamientos importantes | Ahora | Capturas y resolución |
| P-010 | Crear cuenta, iniciar/cerrar sesión realmente; contraseña incorrecta y correo duplicado | Tras Ronny | API, DB, sesión y error reales |
| P-011 | Permisos entre dos cuentas/comunidades: no ver/modificar datos ajenos | Tras Ronny | Respuestas y capturas con cuentas ficticias |
| P-012 | Crear/editar comunidad y huerto en SQLite; cerrar sesión y volver a entrar | Tras Ronny | Registro persistente + API/BD verificados |
| P-013 | Flujo integrado: cuenta → comunidad → huerto → cerrar → ingresar → revisar | Tras Ronny | Video/capturas + tabla de resultados |
| P-014 | Mi Jardín: abrir escenario y parcelas; registrar planta/foto/bitácora/pasaporte **en modo local** | Diseñar y explorar ahora; repetir sobre versión final | Capturas, estado de dependencia y diferencias |
| P-015 | Integración final de Mi Jardín, si se entrega para V1 y está disponible | Solo cuando se apruebe e integre | Registros reales y resultado; si no existe, BLOQUEADO/FUERA DEL CORTE |

*Nota:* P-014/P-015 no prueban que exista un backend de plantas. Si no se integra para la entrega, declararlo explícitamente en el informe; no inventar resultados ni ocultar limitaciones.

## 4. Después de la entrega técnica de Ronny (09/11, si está lista)

- [ ] Solicitar a Ronny el PR actualizado, rama/commit probados, instrucciones de arranque, migraciones, `.env.example` (nunca credenciales reales), URL de la API y datos de prueba ficticios.
- [ ] Confirmar que `main` contiene el backend integrado y el flujo de frontend conectado; si solo está en una rama de revisión, registrar el commit exacto y **no presentar el resultado como `main` operativo**.
- [ ] Ejecutar P-010 a P-013 sobre **dos cuentas distintas** y verificar que los datos sobreviven al cierre de sesión/recarga y se aíslan por usuario.
- [ ] Ejecutar positivos y negativos de roles, edición, validaciones, errores del servidor y conexión no disponible. Anotar defectos y pedir corrección a Ronny/Leonel según el origen.
- [ ] Actualizar matriz de resultados y reejecutar casos afectados por correcciones. Si backend no está listo, mantener «BLOQUEADO — integración no disponible», con fecha y responsable de dependencia.

## 5. Mi Jardín todavía en desarrollo

- [ ] Diseñar hoy los casos de parcelas, cuatro modalidades (tierra/macetas/vertical/colgante), cuatro regiones, fotos, ficha/Pasaporte Vivo, actividades, guardado y errores; usar P-014/P-015 y ampliar si es necesario.
- [ ] Ejecutar **exploración local** de lo que realmente existe; señalar versión/commit y que **no es aceptación final**.
- [ ] Cuando Leonel anuncie diseño estable: repetir pruebas afectadas, comprobar que el registro de huerto sigue enlazando el escenario y generar capturas de la versión final.
- [ ] Si no hay integración backend del jardín el 10/11, reportar ese límite en resultados y demo, no convertirlo en un falso «aprobado».

## 6. Carpeta y entregables que Santiago debe subir

```text
docs/casos-prueba/
├── README.md                       # Este plan y dependencias
├── plan-pruebas-v1.md              # Santiago: alcance, entorno, estrategia y criterios
├── casos-prueba-v1.md              # Santiago: P-001... con plantilla oficial
├── matriz-hu-pruebas.md            # Santiago + Leonardo: HU ↔ casos ↔ resultado
├── resultados-ejecucion-v1.md     # Santiago: ejecuciones reales, fechas y veredictos
├── registro-defectos-v1.md         # Santiago: Issue, severidad, estado y retest
├── plantilla-caso-resultado.md    # Plantilla de apoyo disponible
└── evidencias/                    # Capturas reales, sin datos sensibles
    └── (P-001-..., P-002-..., etc.)
```

Los ficheros futuros mostrados arriba son **entregables por crear**, no documentos ya entregados. No subir capturas con contraseñas, tokens, datos personales reales o direcciones sensibles. El informe debe enlazar los archivos realmente publicados y diferenciar pendientes.

### Campos mínimos por ejecución

ID · HU/requisito · módulo · prioridad · precondiciones · datos ficticios · entorno y **SHA del commit** · fecha/hora · pasos · resultado esperado · **resultado obtenido** · estado (`APROBADO`, `FALLIDO`, `BLOQUEADO`, `NO EJECUTADO`) · evidencia · Issue defecto si aplica · retest.

### Criterio de cierre de QA-002

Casos prioritarios ejecutados donde el producto está disponible, con trazabilidad, capturas y defectos; dependencias no disponibles documentadas; defectos críticos informados al PM; resultados reales entregados a Leonardo. **No equivale a declarar la V1 completa si backend o jardín definitivo faltan.**

## 7. Hitos para la demostración del 10 de noviembre

- **08/11:** QA-001: plan, casos P-001…P-015, matriz preliminar y primeras evidencias del frontend; QA-002 inicia resultados locales.
- **09/11:** repetir pruebas de interfaz sobre el último commit y, si Ronny entrega la integración, cubrir autenticación real, permisos y persistencia SQLite. Retest de defectos corregidos.
- **10/11 (antes de clase):** congelar versión/commit para demo, ejecutar recorrido crítico disponible, consolidar resultados, incidencias y limitaciones; entregar enlaces a Leonardo para el PDF `Proyecto-Version1-OptiCode.pdf` y a Leonel para revisión.

**Fuente del alcance:** consigna académica compartida para V1 (seis especificaciones). Los IDs P-001… son una propuesta operativa que Santiago deberá contrastar con las historias definitivas y la plantilla del docente.
