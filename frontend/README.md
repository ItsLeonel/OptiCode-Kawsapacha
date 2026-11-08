# Kawsapacha — Mi Jardín Vivo

Implementación React + TypeScript + Phaser 3.90.0. La entrada principal (`/`) y el laboratorio (`/garden-lab.html`) comparten el renderizador Phaser y la lógica del jardín. **No comparten registros locales si se abren en puertos distintos**: IndexedDB se separa por origen (protocolo, host y puerto). No se precargan comunidades, plantas ni actividades de ejemplo.

## Ejecutar

Node 20.19+ o 22.12+ y npm. Desde la raíz:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev -- --configLoader runner --host 127.0.0.1
```

Abre la URL indicada por Vite (normalmente `http://127.0.0.1:5173`). Pulsa **Descubrir Kawsapacha**, registra una comunidad, después **Mi terreno** y vuelve a **Mi Jardín**. Una comunidad personal es válida. El laboratorio usa `npm.cmd run dev:garden-poc` y `http://127.0.0.1:5176/garden-lab.html`; añade `?renderer=canvas` para forzar Canvas.

## Comportamiento implementado

- Escenario de piezas independientes: horizonte regional original, prado continuo, senderos texturados, relieves, recipientes, soportes, sombras y profundidad. Las pantallas maestras orientan la composición; ninguna se pega como escenario.
- Sierra, Costa, Amazonía y Galápagos se resuelven desde la provincia registrada. Las modalidades En tierra, Macetas, Vertical y Colgante conservan seis identificadores de espacio. Las combinaciones de surcos, camas, camellones y terrazas muestran las selecciones del terreno.
- Suelo, cercas, fuentes de agua, riego y abono proceden de los tipos y validaciones de Mi terreno. Lluvia no añade un tanque; compost no añade una compostera. Las posiciones son ilustrativas, sin afirmar dimensiones ni capacidad física exactas.
- Arrastre, rueda, controles de zoom y teclado; selección por ratón o toque. Los seis controles HTML equivalentes sirven a lectores de pantalla y teclado. Inicio/Fin y flechas cambian de espacio. Hay una alternativa HTML si el motor no inicia.
- Registro con galería o cámara, especie, fecha opcional, ficha editable, foto real en el jardín, estado documentado, observaciones, altura medida y evidencias en el Pasaporte Vivo. Archivar libera el espacio sin borrar la ficha; restaurar comprueba ocupación.
- Nueve actividades: preparación, limpieza/deshierbe, siembra, riego, abonado, aporque, replante, seguimiento y cosecha. Fecha, responsable, destino, notas, foto y datos específicos. La siembra se registra explícitamente; añadir una ficha no demuestra por sí solo que se haya sembrado.
- Preparación y abonado dejan señales derivadas de registros. El riego anima temporalmente después de guardar. Seguimiento actualiza estado/foto/medida documentados. Replante cambia de espacio; cosecha completa puede liberar el espacio. Anular conserva evento y evidencia y reconstruye sus efectos; se rechazan conflictos de ocupación.
- Mis plantas, Mi historia y Mi camino verde son pantallas funcionales. Las acciones no conducen a demostraciones estáticas. Las recompensas locales se recalculan desde registros válidos, excluyen anulaciones y evitan duplicados.

## Persistencia y límites

`IndexedDbGardenRepository` implementa `GardenRepository`, separada de la lógica agrícola y de Phaser. IndexedDB `kawsapacha-living-garden-v1`, versión 1, guarda metadatos y fotografías Blob en transacciones. Las fotos tienen identificadores inmutables y se reconstruyen sus URL al abrir. No se guardan URL Blob efímeras como fotografías persistentes. Los registros sobreviven a la recarga; varias pestañas del mismo origen comparten revisiones mediante BroadcastChannel y transacciones. Una operación fallida conserva el registro anterior.

El alcance local es **un huerto y una comunidad por origen/perfil de navegador**, sin cuentas ni aislamiento entre usuarios del mismo perfil. Cambiar host/puerto/perfil cambia el almacenamiento. Borrar datos del sitio, modo privado, cuotas o desalojo del navegador pueden eliminarlo. No hay copia remota ni sincronización multiusuario. Los borradores todavía no confirmados se conservan al navegar durante la visita, no al recargar. Las fotos de plantas y actividades aceptan JPG/PNG/WebP de hasta 3 MB.

El repositorio no contiene un backend funcional ni contratos de autenticación configurados. `App` conserva el adaptador opcional `onAuthenticate: AuthSubmitHandler`: solo `authenticated: true` inicia la sesión de interfaz. Un mensaje, una validación de formulario o una respuesta tardía tras salir no autentican. Sin adaptador, los formularios explican que no se inició sesión; no se inventan endpoints, credenciales ni sesiones. La unión remota, el directorio de comunidades y las publicaciones siguen pendientes del servicio correspondiente. Las fixtures de autenticación son exclusivas de pruebas.

## Gamificación local V1

La lógica está en `journal/progress.ts`, independiente de Phaser. Preparación 10; limpieza 8; siembra 20; riego 5; abonado 8; aporque 8; replante 10; seguimiento 12; cosecha 20. Niveles: Aprendiz desde 0, Oficial desde 100, Maestro desde 300.

Un identificador o contenido repetido no cuenta dos veces. Como máximo se recompensa una actividad por tipo, fecha, destino y responsable normalizado; registros adicionales del mismo grupo pueden conservarse con 0 puntos. Las anulaciones dejan de sumar. Insignias por siembra con foto, riego en tres fechas, seguimiento fotográfico en tres fechas y cosecha con foto. El progreso individual usa el responsable registrado; el agregado comunitario muestra únicamente los registros de este navegador. Son declaraciones locales, sin validación de acciones físicas ni protección del servidor contra manipulación.

## Arquitectura y verificación

- `src/App.tsx`: navegación e integración de formularios, repositorio y paneles.
- `src/features/my-garden/journal/`: comandos agrícolas puros, proyección de plantas, actividades, repositorio, medios y recompensas.
- `src/features/my-garden/phaser-poc/`: adaptador visual, geometría, recursos, composición y puente por instancia. `MyGardenPage` lo usa en producción con carga diferida.
- `features/communities/`, `features/real-gardens/`, `features/auth/`: formularios y contratos existentes reutilizados.

```powershell
npm.cmd run typecheck
npm.cmd run build -- --configLoader runner
npm.cmd run build:garden-poc
npm.cmd run test:garden-poc
npm.cmd run test:unit
npm.cmd run test:e2e
npm.cmd run test:production
```

Playwright usa Chrome instalado y abre/cierra Vite mediante su API, sin tocar servidores del usuario. La suite `test:production` ejecuta los recorridos de escritorio y móvil contra `vite preview` del build principal en 5179 (`KAWSAPACHA_PREVIEW_PORT`). La suite principal usa 5174 (`KAWSAPACHA_E2E_PORT`); la del jardín 5177 (`KAWSAPACHA_POC_PORT`). Las pruebas de mapa sustituyen las teselas externas; las de cámara usan un dispositivo de vídeo simulado. El hardware físico y la sincronización remota no se validan con estas pruebas.

Vite avisa del tamaño de Phaser; el motor está en un módulo asíncrono. Las ilustraciones originales de alta resolución requieren una conexión y memoria acordes. La equivalencia visual final con las referencias necesita revisión del propietario del producto; no hay una métrica automática que certifique calidad artística de videojuego.

El [informe de implementación](../docs/mi-jardin-vivo-implementacion.md) registra los estados por fase, resultados y evidencias. Se conservan las referencias y la documentación histórica de los recursos.
