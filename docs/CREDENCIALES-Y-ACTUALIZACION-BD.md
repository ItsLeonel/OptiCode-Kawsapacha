# 🔐 Credenciales en Base de Datos y Actualización de SQLite

Esta guía documenta qué credenciales quedan grabadas directamente en la base de datos SQLite (`backend/prisma/kawsapacha.db`), cuáles se crean desde la interfaz del programa y cómo actualizar una base de datos existente al pasar desde una versión anterior de Kawsapacha.

---

## 1. Credenciales predefinidas en la base de datos (`ADMIN_TECNICO`)

Al ejecutar `npm run prisma:seed` en `backend/`, el sistema siembra el catálogo medicinal regional (30 fichas) y asegura de forma **no destructiva** (`upsert` con `update: {}`, sin sobrescribir usuarios existentes) las dos cuentas técnicas iniciales en la tabla `users`:

| Nombre | Correo | Contraseña | Rol global | Uso principal |
|---|---|---|---|---|
| **Administrador Técnico 1** | `admin1@mail.com` | `Password123` | `ADMIN_TECNICO` | Ingresa directo a `#admin-tecnico` para crear/gestionar cuentas `ADMIN_MSP`, administrar reglas de puntos, misiones y consultar auditoría. |
| **Administrador Técnico 2** | `admin2@mail.com` | `Password123` | `ADMIN_TECNICO` | Cuenta técnica de respaldo para cumplir la regla de protección que impide desactivar al último `ADMIN_TECNICO` activo. |

> **Nota de seguridad:** Estas credenciales están pensadas únicamente para desarrollo local, pruebas y demostración académica. Antes de cualquier despliegue real, cambia sus contraseñas y reemplaza `JWT_SECRET` en `backend/.env`.

### Alternativa CLI: crear un administrador técnico personalizado

Si necesitas aprovisionar o promover una cuenta `ADMIN_TECNICO` distinta sin usar las cuentas por defecto, ejecuta desde `backend/`:

```bash
# Con variables de entorno o argumentos posicionales:
npx ts-node src/scripts/bootstrap-admin.ts <email> <password> "<nombre>"

# Valores por defecto de bootstrap-admin.ts si se ejecuta sin argumentos:
# Email: admin.tecnico@kawsapacha.gob.ec | Password: AdminTecnico2026*
npx ts-node src/scripts/bootstrap-admin.ts
```

---

## 2. Cuentas que se crean directamente desde el programa

El resto de perfiles **no necesita insertarse manualmente en la base de datos**:

1. **Personal del Ministerio de Salud Pública (`ADMIN_MSP`):**
   - Inicia sesión en la pantalla de bienvenida con `admin1@mail.com` o `admin2@mail.com` (`Password123`).
   - En el panel **`#admin-tecnico`**, usa el formulario de creación de funcionario MSP para aprovisionar nuevas cuentas `ADMIN_MSP` (por ejemplo, `marialopez@mail.ec` o `carlosperez@mail.ec`).
   - Al iniciar sesión, las cuentas `ADMIN_MSP` ingresan directamente a `#admin-msp` para revisar comunidades, plantas y evidencias de actividades, además de gestionar eventos y guías educativas MSP.
2. **Usuarios comunitarios (`USUARIO`):**
   - Cualquier persona puede registrarse desde la pantalla de bienvenida en la pestaña **"Crear cuenta"**.
   - Por defecto reciben el rol global `USUARIO`; sus roles dentro de cada huerto (`RESPONSABLE` o `PARTICIPANTE`) se asignan al crear una comunidad o aceptar invitaciones.

---

## 3. Cómo actualizar la base de datos desde una versión anterior

Si ya tenías una copia anterior de Kawsapacha con datos en `backend/prisma/kawsapacha.db`, sigue estos pasos según cómo se creó tu base previa.

### Paso previo obligatorio: respaldar la base actual

Desde `OptiCode-Kawsapacha/backend`:

```powershell
# Windows PowerShell
Copy-Item prisma/kawsapacha.db prisma/kawsapacha.db.bak
Copy-Item uploads uploads-backup -Recurse
```

```bash
# Linux / macOS
cp prisma/kawsapacha.db prisma/kawsapacha.db.bak
cp -a uploads uploads-backup
```

### Escenario A: Tu base anterior usaba migraciones estándar de Prisma (V1 o anterior)

Ejecuta desde `backend/`:

```bash
npm install
npx prisma migrate deploy
npx prisma generate
npm run prisma:seed
```

Qué hace este proceso:
- **`npx prisma migrate deploy`** aplica de forma aditiva las migraciones nuevas (incluida `20261114044500_catalogo_medicinal_regional` y `20261114190000_fase4_5_msp_moderacion_auditoria_y_espejo_v2`) sin eliminar usuarios, comunidades, huertos, plantas ni actividades existentes.
- **`npm run prisma:seed`** actualiza las 30 especies del catálogo medicinal regional y verifica/crea `admin1@mail.com` y `admin2@mail.com` si aún no existían en tu BD.

> **Importante sobre datos migrados desde V1:** Las comunidades, plantas y actividades antiguas creadas antes de Fase 4.5 recibirán por defecto `status = 'PENDING'` o `reviewStatus = 'PENDING'`. Puedes revisarlas y aprobarlas ingresando al panel `#admin-msp` con una cuenta `ADMIN_MSP` o `ADMIN_TECNICO`.

### Escenario B: Base modificada anteriormente con `prisma db push`

Si aparece `duplicate column name`, **no marques automáticamente las dos migraciones como aplicadas**. Podrías saltarte tablas, índices y columnas que todavía faltan.

1. Detén el backend y conserva el respaldo de `prisma/kawsapacha.db` y el directorio `uploads/`.
2. Ejecuta `npx prisma migrate status` y comprueba la tabla `_prisma_migrations` y el esquema en **una copia** de la base de datos.
3. Compara cada migración pendiente con los cambios realmente existentes. Solo si **todos** los cambios de una migración concreta están presentes, un responsable técnico podrá marcar **esa migración** con `prisma migrate resolve --applied <nombre-exacto>`.
4. Si detectas diferencias, no ejecutes `migrate reset` ni sigas con `migrate deploy` sobre la BD original. Restaura la copia o prepara una migración correctiva comprobada sobre un respaldo.
5. Una vez reconciliado el historial, aplica `npx prisma migrate deploy`, después `npx prisma generate` y `npm run prisma:seed`.

### Escenario C: Instalación limpia desde cero (sin conservar datos viejos)

Si prefieres reiniciar la base SQLite por completo:

```bash
cd backend
npm install
npx prisma migrate reset --force
npm run prisma:seed
```

*(Nota: si conservas tu archivo `.env` con `DATABASE_URL="file:./kawsapacha.db"`, `migrate reset --force` recreará `backend/prisma/kawsapacha.db` desde las migraciones y ejecutará el seed si corresponde; se recomienda correr `npm run prisma:seed` al final para confirmar el catálogo y las cuentas `admin1` / `admin2`.)*
