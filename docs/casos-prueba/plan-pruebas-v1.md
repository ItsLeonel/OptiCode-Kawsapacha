# Plan de pruebas — Kawsapacha V1

> **Actualización de alcance — 15/11/2026 (revisión PM):** este plan conserva **las ejecuciones históricas del 08/11**. La aplicación de escritorio disponible en `main` es la referencia para nuevas revisiones, pero el hecho de que haya evolucionado **no convierte esas ejecuciones en pruebas del código actual**. Corte de referencia: `main` `3f3547b` (consultado 15/11); responsive en [PR #74](https://github.com/ItsLeonel/OptiCode-Kawsapacha/pull/74) (`6d7750a9`, **sin fusionar**). El PR de diseño [#41](https://github.com/ItsLeonel/OptiCode-Kawsapacha/pull/41) es documentación y capturas. Esta actualización no afirma que Santiago haya reejecutado los casos.

### Complemento de QA pendiente para el cierre documental
- [ ] **Reejecutar sobre un único SHA del `main` vigente** los P-001–P-017 prioritarios, registrar entorno, fecha, esperado/obtenido, captura y resultado nuevo; conservar los resultados del 08/11 sin sobreescribirlos.
- [ ] Crear y ejecutar casos nuevos vinculados con HU-020–HU-023 (invitaciones, almacén, cosecha, calendario) y con las funcionalidades posteriores que el PM incluya en el alcance de entrega; coordinar identificadores y trazabilidad con Leonardo (#2/#15).
- [ ] Separar pruebas manuales del **escritorio actual** de pruebas de los **cambios responsive del PR #74**. Para este último validar 320/360/390/430/768 px, 4 regiones × 4 modalidades y seis parcelas, gestos táctiles y ausencia de desbordamiento. [CI verde](https://github.com/ItsLeonel/OptiCode-Kawsapacha/actions) es evidencia automatizada, no prueba en teléfono real.
- [ ] Validar fotografía/cámara y persistencia entre dispositivos en HTTPS real solo cuando Santiago confirme su publicación en #49/#75; identificar test no ejecutado/bloqueado cuando no haya entorno seguro.
- [ ] Revisar el recorrido comunidad→huerto→registro de planta/foto→Pasaporte→Bitácora y los permisos con dos cuentas de prueba; **foro, eventos y ranking** corresponden al desarrollo pendiente #48 y no pueden figurar como aprobados.
- [ ] Exportar a `docs/casos-prueba/evidencias/` las capturas realmente existentes en el DOCX y vincularlas con resultados nuevos. El contenido actual de la carpeta no incluye los PNG mencionados en el índice; no declarar evidencia GitHub verificable hasta subirla.
- [ ] Entregar a Leonardo (#15) una matriz que separe **corte histórico del 08/11**, ejecución nueva validada y huecos de cobertura. Santiago mantiene responsabilidad y autoría de las ejecuciones.

**Regla:** no editar los veredictos históricos de otra persona ni inventar una ejecución reciente. El reporte original de 17/17 aprobados sigue siendo **el reporte de Santiago para 08/11**, no una garantía sobre `main` del 15/11.



**Proyecto:** Huertos Medicinales Comunitarios (ISWD652 Calidad de Software, 2026B — EPN) · **Equipo:** OptiCode
**Responsable de QA:** Santiago Guamán (`TonyTiago`) · **Issues:** #5 QA-001 y #14 QA-002 · **Actualizado:** 08/11/2026

## 1. Objetivo
Comprobar, con evidencia reproducible, que el incremento V1 funciona según el alcance acordado, y documentar con honestidad qué se probó, qué falló y qué no se cubrió.

## 2. Documentos consultados
Definición del proyecto (ISWD652, 2026B); presentación del taller de alcance; `docs/analisis/alcance-v1.md`; `docs/historias-usuario/historias-usuario-v1.md` (HU-001 a HU-023); `docs/organizacion/REGLAS-DE-TRABAJO.md` y `REPARTO-DE-TAREAS-V1.md`; README del repositorio, del frontend y del backend; plantilla oficial de casos de prueba. Los lineamientos del MSP se consideran solo a través del documento del equipo `docs/analisis/lineamientos-msp-aplicados.md`.

## 3. Alcance
**Incluido (V1):** usuarios (registro, login, logout, visitante), comunidades, huertos reales, catálogo de plantas medicinales y huerto virtual. Durante la integración (PR #30) se añadieron roles e invitaciones, almacén comunitario, cosecha y calendario de siembra, sujetos a confirmación del PM (D-12).

**Fuera del corte V1:** rituales, secado y etiquetado, foro y moderación, retos validados por el servidor, certificación de talentos, ranking entre comunidades, video e historia visual extendida.

**Cobertura de esta versión:** 17 casos (P-001 a P-017) que cubren HU-001 a HU-019. **No hay casos diseñados para HU-020 a HU-023** (ver `matriz-hu-pruebas.md`).

## 4. Entorno de pruebas
- **SO:** Windows · **Navegador:** Mozilla Firefox · **Resolución:** la nativa de la pantalla de escritorio; vista móvil simulada a 375 px (herramientas de desarrollo)
- **Frontend:** `http://localhost:5173` · **API:** `http://localhost:3000` (comprobar `/api/health`) · **Rama:** `main`
- **SHA probado:** `8066d69` (P-001 a P-009, modo visitante, antes de actualizar el repositorio) y `de1c6c9` (P-010 a P-017, con backend, tras actualizar `main`)
- **Arranque:** backend (`cd backend`, `npm install`, copiar `.env.example` a `.env`, `npx prisma migrate dev`, `npm run prisma:seed`, `npm run dev`) y frontend (`cd frontend`, `npm install`, `npm run dev`). Requiere Node 20.19+ o 22.
- **Datos:** modo visitante usa IndexedDB (por origen); con sesión, los datos están en SQLite y las fotos en `backend/uploads/`.

## 5. Estrategia
Pruebas funcionales, validaciones, persistencia, accesibilidad básica (teclado y 375 px) e integración con backend (cuentas, aislamiento de datos y flujo extremo a extremo). Ejecución manual con capturas; la suite de Playwright del equipo no sustituye estas evidencias.

## 6. Datos de prueba
Solo datos ficticios: correos `@example.com`, contraseñas de prueba, nombres como «Tester QA». Sin datos personales reales ni ubicaciones exactas.

## 7. Estados y criterios de resultado
`APROBADO` si lo obtenido coincide con lo esperado, con evidencia; `REPROBADO` si difiere (se registra la incidencia y se reejecuta tras la corrección). Cada caso del docx tiene espacio para la primera ejecución y, si hubo falla, para la reejecución.

## 8. Criterios de entrada y salida
- **Entrada:** frontend y backend arrancan en local, migraciones y seed aplicados, datos ficticios preparados.
- **Salida:** casos prioritarios ejecutados con trazabilidad y capturas; incidencias registradas; resultados entregados a Leonardo. No equivale a declarar la V1 completa mientras HU-020 a HU-023 no tengan casos.

## 9. Roles
Santiago: diseña, ejecuta, documenta y evidencia · Ronny: backend · Leonel: frontend y demo · Leonardo: informe `Proyecto-Version1-OptiCode.pdf` · Dylan: recursos de diseño.

## 10. Riesgos
1. HU-020 a HU-023 sin cobertura de pruebas.
2. Hallazgos M-01 (suelos) y M-02 (fichas sin fotos ni fuentes) documentados por el equipo.
3. Entorno local: las tablas de la base de datos no existen hasta aplicar las migraciones (causó las primeras fallas de P-010 a P-013).
4. Los casos de modo visitante se ejecutaron en una versión anterior del frontend; conviene repetirlos sobre el commit definitivo de la demo.

## 11. Calendario
- **08/11:** diseño y ejecución de los 17 casos; reejecución de los que fallaron.
- **09/11:** repetir casos críticos sobre el último commit; completar registro de defectos y evidencias; decidir casos para HU-020 a HU-023.
- **10/11 (antes de clase):** congelar commit de la demo, recorrido crítico, consolidar resultados y entregar enlaces a Leonardo (PDF) y Leonel (revisión).
