# Catálogo territorial local · INEC DPA 2026

Fuente primaria: [SIN del INEC](https://aplicaciones2.ecuadorencifras.gob.ec/SIN/), enlace «CÓDIGOS DPA 2026 EXCEL»: [cdpa2026.xlsx](https://aplicaciones2.ecuadorencifras.gob.ec/SIN/descargas/cdpa2026.xlsx). Descargado y contrastado el 3 de noviembre de 2026.

SHA-256 del Excel descargado: `0d0ae33a0a0023ed44abcaa6b38a1c173fbda423e368a8f12bedda59d65d8f3a`.

`dpa-2026.json` conserva los nombres del archivo oficial, recortando espacios exteriores, y los identificadores como texto para preservar ceros iniciales. La interfaz adapta únicamente las mayúsculas de las etiquetas. No contiene divisiones inferidas ni datos de terceros.

- `PROVINCIAS`: 24 provincias con códigos de dos dígitos.
- `CANTONES`: 222 cantones de esas provincias, códigos de cuatro dígitos y relación `provinceCode`.
- `CODIGOS`: cabeceras cantonales y parroquias rurales, mediante `DPA_PARROQ` / `DPA_DESPAR`.
- `PARROQUIAS`: añade parroquias urbanas mediante `DPA_PARURB` / `DPA_DESPARURB`, sin reemplazar los códigos de las cabeceras cantonales.
- Resultado conjunto: 1.315 entradas parroquiales únicas con códigos de seis dígitos y relación `cantonCode`. Incluye cabeceras cantonales y parroquias urbanas; **no es un conteo exclusivo de parroquias rurales**.

El código 90 corresponde a zonas en estudio y no se presenta como una provincia adicional. Los registros cantonales 9006 (Juval) y 9009 (Morona, asociado a Sinaí-Cuchaentza en este archivo) quedan documentados en `excludedStudyZones`. No se reasignan códigos a una provincia por deducción. El catálogo representa esta edición del INEC; no se mezcló con otras ediciones o con el catálogo CONALI.

Para regenerar desde el Excel oficial, con Python y `openpyxl` instalados:

```powershell
cd frontend
python scripts/import-dpa.py ruta/al/cdpa2026.xlsx
```

El importador verifica unicidad, relación de prefijos, pertenencia de cada nivel y que cada cantón tenga entradas parroquiales. No necesita red si el Excel ya está descargado. El navegador usa el JSON empaquetado y no consulta una API territorial.

El GeoJSON provincial existente es una fuente independiente, conservada con su licencia MIT. Sus límites ilustran la selección de provincia; el marcador no se presenta como validación de pertenencia territorial ni como prueba de ubicación.
