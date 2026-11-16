# Plan de Pruebas de Software — Kawsapacha V1
**Código:** QA-001  
**Issue:** [#5 QA-001](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/5)  
**Responsable:** Santiago Guamán (`TonyTiago`) — QA / Tester  
**Revisores:** Leonel Morales (PM), Ronny Veloz (Backend), Leonardo Lugmaña (Documentación)  
**Fecha:** 15/11/2026  
**Versión:** 1.0 (Integrada con Fase 4.5, Espejo Digital V2 y Despliegue Cloudflare)  

---

## 1. Introducción y Objetivos
El presente plan define la estrategia, alcance, entorno y procedimientos para el aseguramiento de la calidad de la versión V1 del sistema **Kawsapacha: Mi Huerto Vivo**. 

### Objetivos Generales
1. Validar el funcionamiento de los flujos críticos de la aplicación en un entorno público real HTTPS.
2. Asegurar que las validaciones territoriales (INEC DPA), botánicas y el ciclo agrícola respeten las normas y lineamientos interculturales del Ministerio de Salud Pública (MSP 2017).
3. Evaluar la persistencia y aislamiento de datos tanto en modo visitante (IndexedDB) como con cuentas centralizadas (SQLite / Prisma).
4. Proveer a la dirección del proyecto y al equipo de desarrollo evidencias verificables de pruebas y defectos encontrados.

---

## 2. Alcance de las Pruebas

### Módulos Incluidos en V1
* **Autenticación y Cuentas:** Registro, inicio de sesión, cierre de sesión y control de roles (`USUARIO`, `RESPONSABLE`, `ADMIN_TECNICO`, `ADMIN_MSP`).
* **Comunidades:** Registro, edición y gestión de miembros.
* **Huerto Real y Territorio:** Selección de provincia mediante mapa interactivo del Ecuador, registro de características del terreno y fotografías.
* **Huerto Virtual 2D:** Renderizado del canvas interactivo en Phaser 3, gestión de 6 parcelas, visualización botánica.
* **Catálogo y Pasaporte Vivo:** Consulta de 30 especies medicinales regionales, fichas botánicas, señalética para impresión.
* **Ciclo Agrícola y Poscosecha:** Siembra, preparación de suelo, cosecha parcial, bloqueo lógico de poscosecha, secado y empaquetado.

### Módulos Fuera de Alcance (Aplazados formalmente para Versión 2 — Issue #48)
Por orden prioritaria del PM (13/11/2026), el **Issue #48** (`COM-001: Comunidades completas, foro, eventos, ranking, talentos y niveles`) queda fuera del alcance de la versión actual V1. Las responsabilidades asignadas a Santiago para la V2 incluyen:
* Perfil de integrante con talentos certificados, nivel persistente en servidor y consentimiento de edad/género.
* Foro comunitario persistente con hilos, categorización, reportes y panel de moderación.
* Apoyo en eventos, mingas presenciales, biblioteca colaborativa y experiencias institucionales con el MSP.
* Soporte en backend de gamificación (puntos, niveles, insignias y misiones auditables).
Estos módulos no son evaluados ni exigidos como criterio de aceptación en esta entrega V1.

---

## 3. Entorno de Prueba y Tecnologías
* **URL Pública Verificada:** `https://head-lakes-efforts-vehicle.trycloudflare.com` (Túnel Cloudflare HTTPS).
* **Navegadores:** Google Chrome v131+, Mozilla Firefox v132+, Apple Safari iOS 18+.
* **Dispositivos Móviles:** Android 14 (pantalla 390x844 px) con conexión de datos móviles 4G/5G; iPhone 15 Pro con iOS Safari.
* **Estación de Trabajo:** Windows 11 Pro, Docker Desktop con Docker Compose v2.
* **Base de Datos:** SQLite local en volumen Docker `sqlite_data`.
* **Almacenamiento de Medios:** Directorio persistente `/uploads` en volumen `uploads_data`.

---

## 4. Estrategia y Tipos de Pruebas
1. **Pruebas Funcionales (Caja Negra):** Validación de entradas, salidas y reglas de negocio sobre la interfaz web.
2. **Pruebas Negativas y de Frontera:** Envío de campos vacíos, fechas ilógicas en poscosecha, contraseñas no válidas y accesos cruzados.
3. **Pruebas de Integración y API:** Comunicación frontend-backend a través de Caddy hacia Express y SQLite.
4. **Pruebas de Persistencia:** Comprobación de integridad de datos tras recargas, cierres de sesión y reinicio de contenedores Docker.
5. **Pruebas de Usabilidad y Responsive:** Adaptabilidad visual en pantallas de 320px a 768px y navegación por teclado.

---

## 5. Criterios de Aceptación y Suspensión
* **Aprobación de Caso:** El resultado observado coincide exactamente con el resultado esperado y se documenta la evidencia en la URL pública.
* **Bloqueo de Caso:** El caso no puede ejecutarse debido a una dependencia de infraestructura o arquitectura pendiente (#35, #43, #45). Se registra con estado `BLOQUEADO` y no se inventan resultados.
* **Criterio de Suspensión:** Falla crítica del contenedor backend, error 500 irrecuperable en la API de autenticación o pérdida de datos en SQLite tras reinicio.
