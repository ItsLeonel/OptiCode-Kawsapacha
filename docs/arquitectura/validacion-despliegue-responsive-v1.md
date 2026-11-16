# Validación de Despliegue Público y Responsive Móvil — Kawsapacha V1
**Issues:** [#49 DEP-001](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/49), [#14 QA-002](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/14)  
**PRs Relacionados:** PR [#74](https://github.com/ItsLeonel/OptiCode-Kawsapacha/pull/74) (Responsive Jardín Móvil), PR [#49](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/49)  
**Evaluador / QA:** Santiago Guamán (`TonyTiago`)  
**Fecha de Evaluación:** 15/11/2026  
**URL Evaluada:** `https://head-lakes-efforts-vehicle.trycloudflare.com`  

---

## 1. Objetivo de la Validación

Comprobar que la versión desplegada en el túnel HTTPS público opera correctamente desde dispositivos móviles y de escritorio, evaluando:
1. Acceso multiplataforma desde redes externas (datos móviles 4G/5G sin Wi-Fi).
2. Adaptabilidad de la interfaz en pantallas estrechas (320px, 360px, 390px, 430px y 768px).
3. Visualización y selección de parcelas en el huerto interactivo Phaser (incluyendo parcela P6).
4. Cobertura de las 16 combinaciones regionales y modalidades de cultivo.

---

## 2. Matriz de Combinaciones Regionales y Terrenos Evaluados

Se verificó que los fondos regionales y los modos de cultivo rendericen apropiadamente en la URL pública sin desbordamientos horizontales ni errores de carga de texturas:

| ID Combinación | Región | Modalidad de Huerto | Parcelas Visibles | Estado en Móvil | Veredicto |
|---|---|---|---|---|---|
| COMB-01 | Costa | Tierra | 6 parcelas (P1 a P6) | Sin solapamiento | **APROBADO** |
| COMB-02 | Costa | Macetas | 6 parcelas (P1 a P6) | Macetas centradas | **APROBADO** |
| COMB-03 | Costa | Huerto Vertical | 6 parcelas (P1 a P6) | Muro alineado | **APROBADO** |
| COMB-04 | Costa | Macetas Colgantes | 6 parcelas (P1 a P6) | Sin recorte superior | **APROBADO** |
| COMB-05 | Sierra | Tierra | 6 parcelas (P1 a P6) | Terreno andino OK | **APROBADO** |
| COMB-06 | Sierra | Macetas | 6 parcelas (P1 a P6) | Sin solapamiento | **APROBADO** |
| COMB-07 | Sierra | Huerto Vertical | 6 parcelas (P1 a P6) | Controles accesibles | **APROBADO** |
| COMB-08 | Sierra | Macetas Colgantes | 6 parcelas (P1 a P6) | Sin desborde | **APROBADO** |
| COMB-09 | Amazonía | Tierra | 6 parcelas (P1 a P6) | Fondos cargados OK | **APROBADO** |
| COMB-10 | Amazonía | Macetas | 6 parcelas (P1 a P6) | Sin solapamiento | **APROBADO** |
| COMB-11 | Amazonía | Huerto Vertical | 6 parcelas (P1 a P6) | Área segura respetada | **APROBADO** |
| COMB-12 | Amazonía | Macetas Colgantes | 6 parcelas (P1 a P6) | Visibilidad completa | **APROBADO** |
| COMB-13 | Galápagos | Tierra | 6 parcelas (P1 a P6) | Suelo volcánico OK | **APROBADO** |
| COMB-14 | Galápagos | Macetas | 6 parcelas (P1 a P6) | Controles inferiores OK | **APROBADO** |
| COMB-15 | Galápagos | Huerto Vertical | 6 parcelas (P1 a P6) | P6 seleccionable | **APROBADO** |
| COMB-16 | Galápagos | Macetas Colgantes | 6 parcelas (P1 a P6) | Gestos táctiles fluidos | **APROBADO** |

---

## 3. Pruebas de Usabilidad Táctil en Móvil (PR #74)

* **Desplazamiento con un dedo y arrastre (Pan):** El canvas de Phaser se desplaza suavemente sin trabar el scroll de la página web.
* **Gesto de Zoom (Pinch) y Controles + / -:** Se ampliaron y redujeron los niveles de visualización; el botón de "Recentrar" devuelve la cámara a la posición predeterminada correctamente.
* **Selección de la Parcela 6 (P6):** Se comprobó que en pantallas pequeñas (360px - 390px) la sexta parcela no quede oculta debajo del menú flotante ni detrás de la barra de acciones inferiores.

---

## 4. Persistencia Cross-Device y Respaldo

* **Prueba de aislamiento:** Se creó la cuenta de prueba `usuario.qa@kawsapacha.ec` desde un celular Android conectado a datos móviles 4G.
* **Comprobación remota:** Al iniciar sesión con las mismas credenciales desde una computadora portátil en una red Wi-Fi distinta, la comunidad registrada, las características del huerto y las plantas se cargaron íntegramente desde SQLite.
* **Reinicio de Contenedores:** Se reinició el contenedor `api` y se constató que la base de datos conservó todas las operaciones gracias al volumen persistente `sqlite_data`.
