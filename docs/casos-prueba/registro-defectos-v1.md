# Registro de Defectos y Desviaciones — Kawsapacha V1
**Módulo:** QA / Aseguramiento de Calidad  
**Responsable:** Santiago Guamán (`TonyTiago`)  
**Fecha de Registro:** 15/11/2026  
**Entorno:** `https://head-lakes-efforts-vehicle.trycloudflare.com`  

---

## 1. Bitácora de Defectos Encontrados y Resueltos

| ID Defecto | Caso Asociado | Severidad | Descripción del Defecto | Causa Raíz | Responsable de Corrección | Estado | Evidencia de Re-test |
|---|---|---|---|---|---|---|---|
| **BUG-001** | P-010 (Registro de Cuentas) | **Crítica (P0)** | Bloqueo por política de CORS al intentar registrar nuevos usuarios desde la URL pública de Cloudflare. La API retornaba error de red y no persistía la cuenta. | `PUBLIC_ORIGIN` en el backend no incluía el dominio dinámico asignado por el túnel Cloudflare, provocando que el middleware CORS rechazara el preflight `OPTIONS`. | Santiago Guamán (DevOps) / Ronny Veloz (Backend) | **RESUELTO** | Se fijó `PUBLIC_ORIGIN=https://head-lakes-efforts-vehicle.trycloudflare.com` en variables de entorno y se recreó el contenedor `api`. Registro verificado exitosamente el 15/11/2026. |
| **BUG-002** | P-009 (Mobile UI) | **Media (P1)** | Solapamiento de la sexta parcela (P6) en resoluciones móviles de 360px a 390px con el panel inferior flotante. | Márgenes inferiores insuficientes en el contenedor del canvas de Phaser en dispositivos pequeños. | Leonel Morales (Frontend) | **RESUELTO** | Se aplicaron las correcciones del PR #74 aumentando el padding seguro inferior y habilitando zoom/paneo táctil fluido. Verificado en Android/iOS. |
| **BUG-003** | CP-AG-08 (Validación Fechas) | **Baja (P2)** | Se permitía seleccionar fechas futuras irreales en la bitácora de preparación de suelo. | Falta de restricción `max` en el input HTML de fecha de actividad. | Leonel Morales (Frontend) | **RESUELTO** | Se restringió el calendario al día actual (`new Date()`). Verificado el 15/11/2026. |

---

## 2. Limitaciones Técnicas y Bloqueos Documentados

1. **Bloqueo CP-AG-12 (Sincronización multi-dispositivo en tiempo real):**
   * *Estado:* BLOQUEADO.
   * *Justificación:* Depende de la implementación de suscripciones push o WebSockets en el backend (#35/#43). Actualmente las actividades de poscosecha se persisten de forma local o al guardar la sesión manualmente.
2. **Bloqueo CP-AG-13 (WebRTC Cámara en vivo):**
   * *Estado:* BLOQUEADO.
   * *Justificación:* Si bien el túnel provee HTTPS, la invocación de la cámara WebRTC en vivo en móviles de diversas marcas requiere despliegue en servidor permanente con dominio estático (#49). La subida de fotos opera actualmente mediante galería o selector de archivos.
3. **Bloqueo CP-AG-15 (Revisión institucional MSP):**
   * *Estado:* BLOQUEADO.
   * *Justificación:* Depende de la finalización de los roles de moderación sanitaria (#45).
