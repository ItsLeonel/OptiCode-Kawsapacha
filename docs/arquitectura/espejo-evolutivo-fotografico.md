# Espejo Digital Evolutivo — perfil fotográfico semiautomático (PR #61)

## Alcance y principio de verdad
Kawsapacha registra la **fotografía original como evidencia** y genera un perfil estilizado de los **rasgos visibles relativos**. Phaser **nunca** coloca la fotografía como textura ni debe suponer crecimiento por fecha, riego, abonado o fase lunar. El usuario sigue declarando la especie y etapa de crecimiento; las inferencias visuales no son verificación MSP.

## Arquitectura implementada (modo visitante)
1. Registro: PlantRegistrationModal recibe foto (cámara/galería, JPG/PNG/WebP <=3 MB). usePlantVisualAnalysis -> analyzePlantPhoto usa Canvas 2D local.
2. Análisis: sampleo <=160 px, umbral aproximado de vegetación verde, selección de componente conectada cercana al centro, silueta, cobertura relativa, color, inclinación, pistas de posibles flores y confianza.
3. Si la confianza es media/alta: visualProfile v1 se adjunta a la misma foto y a GardenPlant.evidences en IndexedDB. Con baja confianza: solo la foto, ningún perfil inventado.
4. Seguimiento: ActivityModal de observation o PlantEditor aceptan nueva fotografía, calculan nuevo perfil sin formulario manual, dejan etapa bajo confirmación humana y guardan el evento. Las actividades de cuidado no modifican perfiles.
5. Proyección: journal.projectPlants reconstruye planta/etapa/perfil según actividad no anulada y última edición documentada.
6. Render: paintObservedPlant -> paintChamomile / paintSpeciesIllustration usa siluetas por especie, densidad, proporciones y tono estimados de la foto. En stage null, sown, harvested se mantienen representaciones documentales propias.
7. Pasaporte Vivo: historial de evidencias con fotos y perfiles; comparación de proporciones aparentes entre dos observaciones, nunca centímetros ni un diagnóstico.

## Esquema de perfil (versionado)
En frontend/src/features/my-garden/plant-visual-profile.ts:
- version: 1, analyzer: canvas-foliage-v1.
- confidence: low | medium | high.
- coverage, heightRatio, widthRatio, centerX en [0,1].
- heightLevel, densityLevel, spreadLevel enteros de 1 a 5.
- foliageColor #RRGGBB, leafTone light | medium | dark.
- orientation left | upright | right.
- floweringHint unknown | possible | not-detected.

Una foto diferente NO prueba necesariamente crecimiento real: distancia, iluminación, fondo y encuadre cambian los resultados. No se hacen afirmaciones de altura real, número de hojas, salud de la planta, identificación automática de especie o floración confirmada. Follaje no verde o fondos vegetales pueden resultar no detectables. No se requiere conexión externa para analizar.

## No completado aún — backend autenticado
PR #61 agrega SOLO el cliente local y los tipos, **no** una API de servidor inexistente. Ronny debe completar #35 y #43 usando una actividad observation unificada, con persistencia SQLite por foto/observación, validación, roles, autenticación, idempotencia, anulaciones, foto privada y sincronización cross-device. El cliente debe hidratar el mismo perfil sin usar IndexedDB como autoridad para cuentas con sesión. MSP #45 revisa evidencia pero la confianza del algoritmo jamás equivale a aprobación.

## QA requerido
- Foto A con planta pequeña centrada, fondo claro: perfil inicial, render específico y Pasaporte con evidencia.
- Foto B nueva de la misma planta y etapa: perfil B diferente y render actualizado, sin cambiar especie.
- Dos plantas de misma especie y etapa con perfiles diferentes deben mostrar arte individualizado.
- Foto con fondo verde total: confianza baja, no guardar perfil; foto conservada.
- Foto sin verde: sin perfil; nunca inventar datos.
- Nueva foto con flowers: solo sugerencia, usuario declara etapa.
- Regar, abonar, cambiar fecha o ver luna no altera el perfil ni etapa.
- Anular observación B -> proyección restaura A y conserva historial.
- Recargar navegador visitante -> perfil y fotografía se mantienen en IndexedDB.
- Con sesión: no anunciar perfil sincronizado hasta integrar #35/#43; tras integración probar móvil→PC, idempotencia, 401/403 y evidencias privadas.
- Visual en cuatro regiones y cuatro modalidades; zoom, móvil y prefers-reduced-motion.
