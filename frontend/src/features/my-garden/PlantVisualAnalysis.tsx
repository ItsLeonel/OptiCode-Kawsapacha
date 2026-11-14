import type { PlantAnalysisState } from './usePlantVisualAnalysis'
import { compareVisualProfiles, type PlantVisualProfile } from './plant-visual-profile'

export default function PlantVisualAnalysis({ analysis, previous }: { analysis: PlantAnalysisState; previous?: PlantVisualProfile }) {
  const { status, profile } = analysis
  if (status === 'idle') return null
  const changes = profile && previous ? compareVisualProfiles(previous, profile) : []
  return <section aria-live="polite" aria-label="Análisis visual automático" style={{ margin: '9px 0', padding: '10px', border: '1px solid #c9ddc9', borderRadius: '9px', background: '#f5fbf4', color: '#28513c', fontSize: '0.8rem' }}>
    <strong>🌱 Gemelo digital · análisis automático</strong>
    {status === 'analyzing' && <p>Analizando colores, silueta y cobertura vegetal…</p>}
    {status === 'unavailable' && <p>No se pudo distinguir con suficiente claridad la planta. Prueba con un fondo sencillo y la planta centrada. La fotografía puede guardarse como evidencia, pero no se inventará un perfil.</p>}
    {status === 'uncertain' && <p>Confianza baja: se detectó vegetación, posiblemente también del fondo. Repite la foto para personalizar el gemelo con mayor fiabilidad.</p>}
    {profile && <p>Perfil estimado: silueta {profile.heightLevel}/5 de altura relativa, cobertura {profile.densityLevel}/5, anchura {profile.spreadLevel}/5, verde {profile.leafTone === 'light' ? 'claro' : profile.leafTone === 'dark' ? 'oscuro' : 'medio'}. {profile.floweringHint === 'possible' ? 'Posibles flores: revisar fotografía.' : ''}</p>}
    {changes.length > 0 && <p>Cambios aparentes: {changes.join(' · ')}.</p>}
    <small>Las proporciones dependen del encuadre, distancia e iluminación. No son centímetros ni prueban crecimiento biológico. La especie y etapa deben documentarse por separado.</small>
  </section>
}
