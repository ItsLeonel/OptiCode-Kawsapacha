# Implementos agrícolas animados — Kawsapacha

Arte SVG original y transparente. **Solo implementos**, sin plantas, parcelas, escenarios ni fotografías: se superponen a la planta y al suelo REAL que ya dibuja Phaser.

| SVG | Actividad | Efecto en Phaser |
|---|---|---|
| watering-can.svg | Riego | Regadera inclinándose, chorro celeste, ondas y oscurecimiento **temporal** del suelo |
| compost-basket.svg | Abonado | Canasta de fibra con motivo geométrico, caída de partículas y compost **temporal** |
| hand-rake.svg | Deshierbe | Rastrillo manual descendiendo y gesto de retirada de maleza |
| harvest-basket.svg | Cosecha | Canasta de fibra acercándose y retirándose, gesto simbólico de recolección |

- Funciona en huertos en tierra, macetas, verticales y colgantes; se adapta a la geometría del espacio.
- Las actividades restantes (preparación, siembra, aporque, replante, observación, señalética, rituales y poscosecha) tienen un efecto simbólico efímero específico de su tipo.
- **Nunca** generan crecimiento automático, frutos, plantas o medidas ficticias. La humedad visible es feedback temporal de una operación guardada, no una predicción de humedad actual.
- Respeta \`prefers-reduced-motion\`: muestra un único cuadro estático breve, sin tween.
- Si falla la carga de un SVG, permanece la retroalimentación vectorial de partículas; la actividad sigue guardándose normalmente.
- Se ejecuta después del registro exitoso; los usuarios con sesión verán los efectos de las actividades básicas que SQLite admite. La persistencia fotográfica y el replay de actividades aún dependen de #35/#43.
