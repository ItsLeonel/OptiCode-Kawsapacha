/**
 * Espejo Digital Evolutivo v1. Un perfil describe rasgos visibles relativos
 * al encuadre, NO altura física, salud diagnosticada, hojas contadas o edad.
 * No sustituye una etapa botánica declarada ni una aprobación MSP.
 */
export type VisualLevel = 1 | 2 | 3 | 4 | 5
export type PlantVisualProfile = {
  version: 1
  analyzer: 'canvas-foliage-v1'
  confidence: 'low' | 'medium' | 'high'
  coverage: number
  heightRatio: number
  widthRatio: number
  centerX: number
  heightLevel: VisualLevel
  densityLevel: VisualLevel
  spreadLevel: VisualLevel
  foliageColor: string
  leafTone: 'light' | 'medium' | 'dark'
  orientation: 'left' | 'upright' | 'right'
  floweringHint: 'unknown' | 'possible' | 'not-detected'
}

export const visualLevel = (fraction: number): VisualLevel =>
  Math.max(1, Math.min(5, Math.ceil(Math.max(0, Math.min(1, fraction)) * 5))) as VisualLevel

export function isPlantVisualProfile(value: unknown): value is PlantVisualProfile {
  if (!value || typeof value !== 'object') return false
  const p = value as Partial<PlantVisualProfile>
  return p.version === 1 && p.analyzer === 'canvas-foliage-v1' &&
    ['low', 'medium', 'high'].includes(p.confidence ?? '') &&
    [p.coverage, p.heightRatio, p.widthRatio, p.centerX].every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1) &&
    [p.heightLevel, p.densityLevel, p.spreadLevel].every(v => Number.isInteger(v) && v! >= 1 && v! <= 5) &&
    typeof p.foliageColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(p.foliageColor) &&
    ['light', 'medium', 'dark'].includes(p.leafTone ?? '') &&
    ['left', 'upright', 'right'].includes(p.orientation ?? '') &&
    ['unknown', 'possible', 'not-detected'].includes(p.floweringHint ?? '')
}

export function compareVisualProfiles(previous: PlantVisualProfile | undefined, current: PlantVisualProfile | undefined): string[] {
  if (!previous || !current || !isPlantVisualProfile(previous) || !isPlantVisualProfile(current)) return []
  const changes: string[] = []
  const density = current.densityLevel - previous.densityLevel
  if (density) changes.push(density > 0 ? 'Más cobertura foliar aparente' : 'Menos cobertura foliar aparente')
  const width = current.widthRatio - previous.widthRatio
  if (Math.abs(width) >= .12) changes.push(width > 0 ? 'Silueta más ancha en la foto' : 'Silueta más estrecha en la foto')
  const height = current.heightRatio - previous.heightRatio
  if (Math.abs(height) >= .12) changes.push(height > 0 ? 'Silueta ocupa más alto del encuadre' : 'Silueta ocupa menos alto del encuadre')
  if (current.floweringHint === 'possible' && previous.floweringHint !== 'possible') changes.push('Posibles flores visibles; verificar en la foto')
  if (current.orientation !== previous.orientation) changes.push('Orientación visual diferente')
  if (current.leafTone !== previous.leafTone) changes.push('Tono verde aparente diferente')
  return changes
}
