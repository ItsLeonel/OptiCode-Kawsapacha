# Matriz de regresión arquitectónica — Kawsapacha

## Criterio de ejecución

Proteger datos reales antes de cualquier prueba: respaldar SQLite y `/uploads`; **no** ejecutar `prisma migrate reset` sobre instalaciones de usuarios. Comparar misma cuenta, jardín, ruta y evidencia entre `main` y la rama sobre un entorno controlado.

## Resultado automatizado comprobado (`5e024893`)

| Comprobación | Evidencia | Resultado |
| --- | --- | --- |
| Backend: dominio, servicios, permisos, API, roles MSP | [Backend CI](https://github.com/ItsLeonel/OptiCode-Kawsapacha/actions/runs/43733059733) | 82 tests Node + integración, aprobado |
| Contratos API y arquitectura | Backend CI | 20 puntos de montaje, 47 rutas/métodos y controles de dependencias, aprobado |
| Migración SQLite heredada y puntos/reconciliación | Backend CI | Aprobado; sin duplicar puntos en segundo pase |
| Frontend: TypeScript, build y pruebas unitarias | [Frontend CI](https://github.com/ItsLeonel/OptiCode-Kawsapacha/actions/runs/43733059738) | 82 unitarias, aprobado |
| Navegación, Pasaporte, edición y render regional | Frontend CI | Aprobado |
| Suite completa jardín Phaser | Frontend CI | 32 Playwright, aprobado |
| Espejo digital, fotos, cosecha y persistencia | [Regresión crítica](https://github.com/ItsLeonel/OptiCode-Kawsapacha/actions/runs/43733059887) | 4 Playwright, aprobado |
| Docker, Caddy, API y `/uploads` tras reinicio | [Docker CI](https://github.com/ItsLeonel/OptiCode-Kawsapacha/actions/runs/43733059756) | Aprobado |
| Consumidores de cuatro fachadas históricas | Frontend CI, job `compatibilidad` | Aprobado; 3, 3, 2 y 16 usos |

Los tres fallos Playwright documentados en la [línea base histórica](regresion-baseline-2026-11-15.md) **no aparecen** en esta ejecución, que terminó con 32/32. La prueba automatizada actual no sustituye una inspección manual de fotografías reales.

## Matriz de aceptación manual (no ejecutada sobre datos privados)

| Área | Verificación pendiente en entorno real | Estado |
| --- | --- | --- |
| Autenticación | Registro, login, logout y permisos por rol | Pendiente de aceptación manual |
| Comunidades | Crear, editar, invitar, roles de miembros, revisión MSP | Pendiente de aceptación manual |
| Mi Huerto | Cuatro regiones, cuatro modalidades, configuración y guardado | Pendiente de aceptación manual |
| Mi Jardín | Phaser: seis parcelas, selección, cámara, persistencia del modelo | Pendiente de aceptación manual |
| Plantas | Cámara y galería, evidencias antiguas, cambio de foto, pasaporte | Pendiente de aceptación manual |
| Bitácora y actividades | Registro, lectura, anulación, fotos, cosecha, poscosecha | Pendiente de aceptación manual |
| Calendario y recompensas | Calendario lunar, puntos, misiones, insignias, ledger | Pendiente de aceptación manual |
| Administración MSP/técnica | Autorización, revisión, auditoría, contenido y notificaciones | Pendiente de aceptación manual |
| Modo visitante | IndexedDB aislado de usuarios autenticados | Pendiente de aceptación manual |
| Despliegue | Copia del SQLite real, `/uploads` histórico y HTTPS | Pendiente de aceptación manual |

**Separación de afirmaciones:** las pruebas automatizadas del commit indicado están aprobadas. Ninguna fila manual se marca aprobada sin observación de la instalación que conserva datos reales. La rama de PR no ha sido fusionada.
