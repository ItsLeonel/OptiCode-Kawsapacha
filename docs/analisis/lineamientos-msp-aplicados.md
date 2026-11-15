# Lineamientos MSP 2017 aplicados a Kawsapacha

**Responsable:** Leonardo Lugmaña (Analista) · **Fecha:** 15/11/2026 · **Issue:** #2 ANA-001

**Fuente:** Ministerio de Salud Pública. *Implementación de huertos medicinales en los establecimientos de salud del primer nivel de atención. Lineamientos.* Primera edición. Quito: Dirección Nacional de Salud Intercultural – MSP; 2017. Licencia Creative Commons Reconocimiento-NoComercial-CompartirIgual 3.0 Ecuador.

> Este documento resume **solo** lo que el MSP establece y que afecta a requisitos, validaciones o contenidos de la aplicación. Las páginas citadas corresponden a la numeración impresa del documento. Los nombres de gamificación del equipo («Semillas de vida», «Retos verdes», «Mi camino verde») **no** provienen del MSP.

## 1. Conceptos para la aplicación y el informe

| Término | Definición MSP | Página | Uso en Kawsapacha |
|---|---|---|---|
| **Kawsapacha** | Término kichwa: «mundo vivo, naturaleza viva, cosmos vivo, existencia viva». | 7, 15 | Nombre del producto. |
| **Chakra** | Espacio de terreno cultivado de uso familiar con productos alimenticios y medicinales. | 14 | Vocabulario educativo. |
| **Hampi chakra** | Huerto medicinal en kichwa. | 18 | Vocabulario educativo. |
| **Wachu / inka wachu / anti** | Surco / camellón / terraza o andén. | 37–39 | Técnicas de siembra del huerto en tierra. |
| **Diálogo de saberes** | Aprendizaje mutuo entre saber ancestral y conocimiento científico. | 14 | Justificación del enfoque educativo. |

## 2. Requisitos del huerto real

| Tema | Lo que dice el MSP | Página | Estado en la aplicación | Observación del análisis |
|---|---|---|---|---|
| **Superficie** | De 4 × 4 m (16 m²) hasta 400 m² (20 × 20 m), según el espacio disponible. | 23 | Se registra `areaM2` sin rango recomendado. | Posible aviso orientativo (no bloqueante) si la superficie está fuera de 16–400 m². |
| **Tipos de suelo** | Arcilloso, limoso, arenoso, margoso, gredoso, pantanoso (Tabla 1). | 24 | El selector ofrece los seis tipos, además de franco, otro y «por determinar». | Coherente. |
| **Huertos urbanos y sin terreno** | Verticales, colgantes, macetas, botellas, neumáticos, caña guadua. | 19, 41 | Modalidades En tierra, Macetas, Vertical y Colgante. | Coherente. |
| **Región Insular (Galápagos)** | Por fragilidad ecológica, solo huertos alternativos: colgantes, neumáticos, macetas. | 20 | Galápagos existe como región visual. | Regla candidata: en Galápagos sugerir solo modalidades sin suelo directo. |
| **Cercas de seguridad** | Vivas, material reciclado, convencionales, material natural, metálicas. | 30–31 | Registro de cercas en Mi terreno. | Comparar las opciones de la interfaz con estas cinco categorías. |
| **Abono natural** | Barbecho, restos vegetales, hojas, compost; reposo de 15 días. | 31–32 | Registro de abono en Mi terreno. | Coherente con la definición del proyecto. |
| **Bodega** | Espacio seguro, seco, con luz natural, para herramientas, semillas, abonos y plantas secas. | 24 | Almacén comunitario (herramientas, insumos, semillas y cosechas). | Coherente; el registro de plantas secas se apoya en la poscosecha (HU-024). |

## 3. Actividades de cultivo y calendario lunar

| Fase lunar | Actividades propicias según MSP | Página |
|---|---|---|
| **Luna oscura (Yana killa)** | Preparación del suelo, deshierbe, abono, poda, control de plagas. | 33, 69 |
| **Cuarto creciente (Wiñak killa)** | Siembra de plantas medicinales, trasplante, resiembra. | 45, 69 |
| **Luna llena (Pura killa)** | Cosecha de plantas medicinales (hojas, flores, frutos). | 49, 69 |
| **Cuarto menguante (Wañuk killa)** | Cosecha cuando se aprovechan semillas o raíces. | 49, 69 |

Otras reglas aplicables:

- **Tipos de siembra:** semillas, estacas, esquejes y plántulas (p. 44–45).
- **Cuidados de crecimiento:** deshierbe, replante y aporque (p. 47). Coinciden con actividades ya implementadas.
- **Riego:** sin aspersión a chorro; manguera al suelo o regadera (p. 47).
- **No fumigación** de plantas medicinales con productos naturales ni industriales (p. 47).
- **Cosecha:** después de que se seque el rocío; manual, tomando solo las partes necesarias (p. 49).
- **Ciclo corto:** listas en 6–8 semanas (lavanda, salvia, menta, ortiga, manzanilla). **Ciclo largo:** cedrón, romero, laurel, marco (p. 48).
- **Secado:** a la sombra, de 10 a 15 días (p. 51).
- **Caducidad de plantas secas:** 6 meses en Costa y Amazonía, 12 meses en Sierra (p. 52).

> El calendario lunar de la aplicación calcula la fase de cada día y muestra las labores de esta tabla citando el MSP 2017 (Anexo 4). Los consejos por especie del catálogo se presentan como «referencias ancestrales por documentar con la comunidad», sin presumir eficacia agronómica.

## 4. Especies del catálogo con información en el MSP

El catálogo tiene 30 especies por región. Esta tabla recoge las ocho de la Sierra que el MSP menciona; las demás no figuran en el documento.

| Especie | Sugerida para la Sierra (p. 20) | Cualidad caliente / fresca (Anexo 5, p. 73–74) | Ciclo (p. 48) | Suelo sugerido (Tabla 1, p. 24) |
|---|---|---|---|---|
| Romero | Sí | Caliente | Largo | Arenoso |
| Manzanilla | Sí | Caliente | Corto | — |
| Menta | Sí | Caliente («hierba buena y menta») | Corto | Arcilloso |
| Toronjil | Sí | Caliente | — | Arcilloso |
| Hierbabuena | Sí | Caliente («hierba buena y menta») | — | — |
| Lavanda | No listada | No consta | Corto | Arenoso |
| Orégano | Sí | Caliente | — | Gredoso |
| Llantén | Sí | Fresca | — | — |

«—» significa que el documento no lo indica. **No se completa con otras fuentes sin citarlas.**

La ficha botánica del catálogo (HU-013) ya incluye familia, otros nombres, altitud, provincias, ciclo y fuente. La señalética (HU-026) usa la cualidad del Anexo 5 para las siete especies clasificadas; la ficha del catálogo aún la muestra como «Por documentar» (D-01).

## 5. Señalética y etiquetado (contenido de la ficha)

**Señalética del huerto (p. 46):** nombre en idioma indígena local, nombre común, nombre científico, familia, uso general y color según cualidad (rojo = caliente; verde o blanco = fresca).

**Etiqueta de plantas secas (p. 51):** nombre en idioma de las nacionalidades, nombre popular, nombre científico, familia, peso, indicaciones de uso, dosificación, contraindicaciones, fecha de empaquetado, fecha de caducidad y cualidad caliente o fría.

La señalética imprimible (HU-026) cubre nombre común, nombre científico, familia y cualidad. La etiqueta de plantas secas se apoya en la poscosecha (HU-024), que registra lote y caducidad; el nombre en idioma indígena, la dosificación y el peso no se incluyen, porque la prescripción corresponde al personal de salud (sección 6).

## 6. Salud y responsabilidad

- La prescripción de plantas medicinales corresponde al **personal de salud**, con el conocimiento de los hombres y mujeres de sabiduría locales (p. 18, 56–57).
- Por eso la aplicación debe presentar los usos medicinales como **información educativa, no como recomendación médica** (criterio 2 de HU-013).
- Los saberes ancestrales se presentan con respeto y contexto; se evita la apropiación de conocimientos (Constitución, art. 57 num. 12, citada en p. 10).

## 7. Hallazgos para el equipo

| # | Hallazgo | Afecta a | Responsable sugerido | Estado |
|---|---|---|---|---|
| M-01 | Tipos de suelo **gredoso** y **pantanoso** de la Tabla 1. | Huerto real (HU-010) | Ronny, Leonel | ✅ Incluidos en el selector de suelo |
| M-02 | La cualidad caliente/fresca de siete especies tiene fuente MSP. | Catálogo y señalética (HU-013, HU-026) | Ronny | ⚠️ Usada en la señalética; falta en la ficha del catálogo (D-01) |
| M-03 | Las labores por fase lunar deben citar la tabla de la sección 3. | Calendario (HU-023) | Ronny | ✅ El calendario lunar cita el Anexo 4 |
| M-04 | En Galápagos el MSP solo recomienda huertos alternativos (colgante, macetas). | Huerto real (HU-010) | Leonel | Abierto: no se encontró una sugerencia de modalidad para Galápagos |
| M-05 | Rango orientativo de superficie: 16–400 m². | Huerto real (HU-010) | Leonel | Abierto: la superficie se valida solo como número positivo |

Estos hallazgos se registran también en [dudas y decisiones pendientes](dudas-y-decisiones-pendientes.md). Son **mejoras sugeridas**, no defectos bloqueantes de la V1.
