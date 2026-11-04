# Contratos de API REST — Kawsapacha V1

**Responsable:** Ronny Veloz (`Rodni15`) — Backend  
**Colaborador Frontend:** Leonel Morales (`ItsLeonel`)  
**Responsable Documentación / Informe:** Leonardo Lugmaña (`kened-leonardo`)  
**Responsable QA:** Santiago Guamán (`TonyTiago`)  
**Fecha:** Noviembre 2026 — Milestone M1 / M2  

---

## 1. Convenciones Generales

### 1.1. URL Base
- Desarrollo local: `http://localhost:3000/api`
- Archivos estáticos / multimedia: `http://localhost:3000/uploads/plants/<nombre_archivo>`

### 1.2. Cabeceras
- Contenido JSON: `Content-Type: application/json`
- Rutas protegidas: `Authorization: Bearer <token_jwt>`
- Subida de fotografías: `Content-Type: multipart/form-data`

### 1.3. Formato Estándar de Respuestas

#### Respuesta Exitosa (`200 OK`, `201 Created`):
```json
{
  "ok": true,
  "message": "Descripción de la operación exitosa",
  "data": { ... }
}
```

#### Respuesta de Error (`400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `409 Conflict`, `500 Internal Error`):
```json
{
  "ok": false,
  "error": {
    "code": "CODIGO_DE_ERROR",
    "message": "Mensaje legible para el usuario",
    "details": {
      "campo_especifico": "Motivo del error de validación"
    }
  }
}
```

---

## 2. Endpoints del Sistema

### 2.1. Verificación del Servicio (Healthcheck)
Permite a QA y al frontend validar la disponibilidad del backend y la conexión con la base de datos SQLite.

- **Método:** `GET`
- **Ruta:** `/health`
- **Autenticación:** No requerida
- **Respuesta `200 OK`:**
  ```json
  {
    "status": "ok",
    "service": "kawsapacha-backend",
    "db": "connected",
    "timestamp": "2026-11-04T00:18:06.841Z"
  }
  ```

---

### 2.2. Módulo de Autenticación (`/auth`)

#### `POST /auth/register` — Registrar nuevo usuario
- **Autenticación:** No requerida
- **Body:**
  ```json
  {
    "name": "Ronny Veloz",
    "email": "ronny@kawsapacha.ec",
    "password": "Password123"
  }
  ```
- **Reglas de validación:**
  - `name`: al menos 2 caracteres.
  - `email`: formato válido de correo electrónico.
  - `password`: mínimo 8 caracteres, al menos una letra y un dígito.
- **Respuesta `201 Created`:**
  ```json
  {
    "ok": true,
    "message": "Usuario registrado exitosamente.",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "cm31abcd...",
        "name": "Ronny Veloz",
        "email": "ronny@kawsapacha.ec",
        "role": "PARTICIPANTE"
      }
    }
  }
  ```
- **Errores comunes:**
  - `400 VALIDATION_ERROR`: Datos no cumplen las restricciones mínimas.
  - `409 EMAIL_IN_USE`: Ya existe una cuenta registrada con dicho correo.

#### `POST /auth/login` — Iniciar sesión
- **Autenticación:** No requerida
- **Body:**
  ```json
  {
    "email": "ronny@kawsapacha.ec",
    "password": "Password123"
  }
  ```
- **Respuesta `200 OK`:**
  ```json
  {
    "ok": true,
    "message": "Sesión iniciada correctamente.",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "cm31abcd...",
        "name": "Ronny Veloz",
        "email": "ronny@kawsapacha.ec",
        "role": "PARTICIPANTE"
      }
    }
  }
  ```
- **Errores comunes:**
  - `401 INVALID_CREDENTIALS`: "Correo o contraseña incorrectos."

#### `GET /auth/me` — Consultar perfil en sesión
- **Autenticación:** Requerida (`Bearer <token>`)
- **Respuesta `200 OK`:**
  ```json
  {
    "ok": true,
    "message": "Usuario autenticado.",
    "data": {
      "user": {
        "id": "cm31abcd...",
        "name": "Ronny Veloz",
        "email": "ronny@kawsapacha.ec",
        "role": "PARTICIPANTE"
      }
    }
  }
  ```

---

### 2.3. Módulo de Comunidades (`/communities`)

#### `GET /communities` — Listar comunidades
- **Autenticación:** Requerida
- **Respuesta `200 OK`:**
  ```json
  {
    "ok": true,
    "message": "Listado de comunidades.",
    "data": {
      "communities": [
        {
          "id": "cm31com1...",
          "name": "Comunidad Yavirac",
          "responsible": "Mama Rosa",
          "location": "Pichincha",
          "description": "Espacio comunitario para el rescate de plantas medicinales andinas.",
          "createdAt": "2026-11-04T00:00:00.000Z",
          "_count": {
            "members": 1,
            "gardens": 1
          }
        }
      ]
    }
  }
  ```

#### `POST /communities` — Crear nueva comunidad
- **Autenticación:** Requerida
- **Body:**
  ```json
  {
    "name": "Comunidad Yavirac",
    "responsible": "Mama Rosa",
    "location": "Pichincha",
    "description": "Espacio comunitario para el rescate de plantas medicinales andinas."
  }
  ```
- **Respuesta `201 Created`:**
  ```json
  {
    "ok": true,
    "message": "Comunidad creada exitosamente.",
    "data": {
      "community": {
        "id": "cm31com1...",
        "name": "Comunidad Yavirac",
        "responsible": "Mama Rosa",
        "location": "Pichincha",
        "description": "Espacio comunitario...",
        "creatorId": "cm31user...",
        "createdAt": "2026-11-04T00:00:00.000Z"
      }
    }
  }
  ```

#### `GET /communities/:id` — Detalle de comunidad
- **Autenticación:** Requerida
- **Respuesta `200 OK`:** Retorna la comunidad junto con sus integrantes y sus huertos vinculados.

---

### 2.4. Módulo de Huertos Reales (`/gardens`)

#### `GET /gardens` — Listar huertos reales
- **Autenticación:** Requerida
- **Parámetros Query:** `communityId` (opcional)
- **Respuesta `200 OK`:**
  ```json
  {
    "ok": true,
    "message": "Listado de huertos.",
    "data": {
      "gardens": [
        {
          "id": "cm31gar1...",
          "name": "Huerto Kawsapacha Central",
          "kind": "ground",
          "areaM2": 45.5,
          "province": "Pichincha",
          "provinceCode": "17",
          "canton": "Quito",
          "parish": "Centro Histórico",
          "latitude": -0.2201,
          "longitude": -78.5123,
          "irrigationAvailability": "available",
          "soilType": "loam",
          "community": { "id": "cm31com1...", "name": "Comunidad Yavirac" }
        }
      ]
    }
  }
  ```

#### `POST /gardens` — Registrar huerto real
- **Autenticación:** Requerida
- **Body:**
  ```json
  {
    "name": "Huerto Kawsapacha Central",
    "kind": "ground",
    "areaM2": 45.5,
    "province": "Pichincha",
    "provinceCode": "17",
    "canton": "Quito",
    "cantonCode": "1701",
    "parish": "Centro Histórico",
    "parishCode": "170101",
    "reference": "Junto al convento de San Francisco",
    "coordinates": { "latitude": -0.2201, "longitude": -78.5123 },
    "irrigationAvailability": "available",
    "soilType": "loam",
    "communityId": "cm31com1..."
  }
  ```
- **Respuesta `201 Created`:**
  ```json
  {
    "ok": true,
    "message": "Huerto registrado exitosamente.",
    "data": { "garden": { ... } }
  }
  ```

#### `GET /gardens/:id` — Detalle del huerto
- **Autenticación:** Requerida
- **Respuesta `200 OK`:** Retorna el huerto con sus plantas activas en el huerto virtual ordenadas por parcela (`plotIndex` del 0 al 5).

---

### 2.5. Módulo de Catálogo Medicinal (`/catalog`)

#### `GET /catalog` — Explorar especies medicinales
- **Autenticación:** No requerida (público para explorar)
- **Parámetros Query:** `q` (búsqueda por nombre común o científico)
- **Respuesta `200 OK`:**
  ```json
  {
    "ok": true,
    "message": "Catálogo medicinal.",
    "data": {
      "species": [
        {
          "id": "Romero",
          "name": "Romero",
          "latinName": "Salvia rosmarinus",
          "icon": "🌿",
          "description": "Arbusto aromático mediterráneo...",
          "medicinalProperties": "Tradicionalmente usado para mejorar la circulación...",
          "preparation": "Infusión: 1 cucharadita de hojas secas...",
          "contraindications": "Evitar en dosis altas durante el embarazo..."
        }
      ]
    }
  }
  ```

#### `GET /catalog/:id` — Ficha botánica de especie
- **Autenticación:** No requerida
- **Respuesta `200 OK`:** Ficha completa de la especie seleccionada.

---

### 2.6. Módulo de Huerto Virtual 2D y Pasaporte Vivo (`/gardens/:gardenId/plants` y `/plants/:id/passport`)

#### `GET /gardens/:gardenId/plants` — Consultar las 6 parcelas del huerto
- **Autenticación:** Requerida
- **Respuesta `200 OK`:**
  ```json
  {
    "ok": true,
    "message": "Plantas del huerto virtual.",
    "data": {
      "plants": [
        {
          "id": "cm31pla1...",
          "plotIndex": 0,
          "speciesId": "Romero",
          "customName": "Romero del Abuelo",
          "photoUrl": "/uploads/plants/plant-1730680000-abcd.jpg",
          "plantingDate": "2026-11-04T00:00:00.000Z",
          "species": {
            "name": "Romero",
            "latinName": "Salvia rosmarinus",
            "icon": "🌿"
          }
        }
      ]
    }
  }
  ```

#### `POST /gardens/:gardenId/plants` — Sembrar planta en parcela con fotografía real
- **Autenticación:** Requerida
- **Content-Type:** `multipart/form-data`
- **Campos del Formulario:**
  - `picture`: Archivo binario de la imagen (JPG, PNG o WebP, máximo 3 MB). **Obligatorio**.
  - `speciesId`: Identificador o nombre de la especie del catálogo (ej. `"Romero"`). **Obligatorio**.
  - `plotIndex`: Número entero de parcela del 0 al 5 (`0`, `1`, `2`, `3`, `4`, `5`). **Obligatorio**.
  - `customName`: Nombre personalizado o apodo (opcional).
  - `notes`: Notas de siembra o bitácora inicial (opcional).
- **Respuesta `201 Created`:**
  ```json
  {
    "ok": true,
    "message": "Planta registrada en el huerto virtual.",
    "data": {
      "plant": {
        "id": "cm31pla1...",
        "realGardenId": "cm31gar1...",
        "speciesId": "Romero",
        "plotIndex": 0,
        "customName": "Romero del Abuelo",
        "photoUrl": "/uploads/plants/plant-1730680000-abcd.jpg",
        "photoMime": "image/jpeg",
        "photoSize": 1542000,
        "plantingDate": "2026-11-04T00:00:00.000Z",
        "notes": "Sembrada en luna creciente",
        "species": { "name": "Romero", "latinName": "Salvia rosmarinus", "icon": "🌿" }
      }
    }
  }
  ```
- **Errores específicos:**
  - `400 MISSING_PHOTO`: No se adjuntó el archivo de imagen.
  - `400 INVALID_FILE_TYPE`: Tipo de archivo no permitido (solo JPG, PNG, WebP).
  - `400 FILE_TOO_LARGE`: La imagen excede el límite de 3 MB.
  - `400 INVALID_PLOT`: El índice de parcela no está entre 0 y 5.
  - `409 PLOT_OCCUPIED`: La parcela solicitada ya está ocupada por otra planta.

#### `GET /plants/:id/passport` — Pasaporte Vivo completo
- **Autenticación:** Requerida
- **Respuesta `200 OK`:**
  ```json
  {
    "ok": true,
    "message": "Pasaporte Vivo de la planta.",
    "data": {
      "passport": {
        "id": "cm31pla1...",
        "plotIndex": 0,
        "customName": "Romero del Abuelo",
        "photoUrl": "/uploads/plants/plant-1730680000-abcd.jpg",
        "plantingDate": "2026-11-04T00:00:00.000Z",
        "notes": "Sembrada en luna creciente",
        "species": {
          "name": "Romero",
          "latinName": "Salvia rosmarinus",
          "icon": "🌿",
          "medicinalProperties": "...",
          "preparation": "...",
          "contraindications": "..."
        },
        "realGarden": {
          "id": "cm31gar1...",
          "name": "Huerto Kawsapacha Central",
          "province": "Pichincha",
          "canton": "Quito",
          "parish": "Centro Histórico",
          "latitude": -0.2201,
          "longitude": -78.5123
        },
        "registeredBy": {
          "id": "cm31user...",
          "name": "Ronny Veloz"
        }
      }
    }
  }
  ```

