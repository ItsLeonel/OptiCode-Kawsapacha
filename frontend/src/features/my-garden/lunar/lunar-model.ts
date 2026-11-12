/** Modelo de presentación: la API de Ronny reemplaza las estimaciones locales. */
export type LunarStage = 'dark' | 'waxing' | 'full' | 'waning'

export type LunarRecommendation = {
  activityType?: string
  title: string
  description?: string
  source?: string
  advisory: true
}

export type LunarDay = {
  date: string
  phase: LunarStage
  phaseName: string
  fraction: number
  recommendations: LunarRecommendation[]
}

export type LunarMonth = {
  month: string
  days: LunarDay[]
  source: 'backend' | 'estimated'
}

const LUNAR_CYCLE_DAYS = 29.530588853
// Luna nueva astronómica de referencia; aproximación media, no efemérides oficiales.
const REFERENCE_NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14)

export const LUNAR_STAGES: Record<LunarStage, { label: string; ancestral: string; description: string }> = {
  dark: {
    label: 'Luna oscura',
    ancestral: 'Yana Killa',
    description: 'Tradicionalmente asociada con la preparación y el mantenimiento del terreno.',
  },
  waxing: {
    label: 'Luna creciente',
    ancestral: 'Wiñak Killa',
    description: 'En la tradición agrícola se vincula con la siembra, el trasplante y la resiembra.',
  },
  full: {
    label: 'Luna llena',
    ancestral: 'Pura Killa',
    description: 'En los lineamientos ancestrales se relaciona con cosechas y prácticas comunitarias.',
  },
  waning: {
    label: 'Luna menguante',
    ancestral: 'Wañuk Killa',
    description: 'Incluye orientaciones tradicionales sobre la recolección de semillas y raíces.',
  },
}

const RECOMMENDATIONS: Record<LunarStage, LunarRecommendation[]> = {
  dark: [
    { activityType: 'preparation', title: 'Preparar el terreno', description: 'Organizar y acondicionar el suelo del huerto.', advisory: true },
    { activityType: 'weeding', title: 'Limpieza y deshierbe', description: 'Revisar la presencia de malezas.', advisory: true },
    { activityType: 'fertilizing', title: 'Aplicar abono natural', description: 'Incorporar compost cuando el suelo lo necesite.', advisory: true },
  ],
  waxing: [
    { activityType: 'sowing', title: 'Siembra medicinal', description: 'Orientación tradicional para sembrar plantas medicinales.', advisory: true },
    { activityType: 'replanting', title: 'Trasplante', description: 'Revisar plantas que necesitan cambiar de recipiente o espacio.', advisory: true },
    { activityType: 'replanting', title: 'Resiembra', description: 'Reponer plantas cuando corresponda.', advisory: true },
  ],
  full: [
    { activityType: 'harvest', title: 'Cosecha medicinal', description: 'Consultar la madurez y la parte vegetal a recolectar.', advisory: true },
    { title: 'Diálogo de saberes', description: 'Compartir prácticas agrícolas de la comunidad.', advisory: true },
    { activityType: 'observation', title: 'Registrar observaciones', description: 'Documentar lo ocurrido en el huerto real.', advisory: true },
  ],
  waning: [
    { activityType: 'harvest', title: 'Recolección de semillas', description: 'Orientación tradicional para semillas maduras.', advisory: true },
    { activityType: 'harvest', title: 'Cosecha de raíces', description: 'Solo cuando la especie y su madurez lo permitan.', advisory: true },
    { activityType: 'observation', title: 'Revisar las plantas', description: 'Registrar el estado observado de cada cultivo.', advisory: true },
  ],
}

export const MSP_LUNAR_REFERENCE = 'MSP Ecuador, Lineamientos de huertos medicinales (2017), Anexo 4 y capítulo de cosecha.'

export function lunarTimeZone(region: string): string {
  return region === 'galapagos' ? 'Pacific/Galapagos' : 'America/Guayaquil'
}

export function todayInTimeZone(timeZone: string, current = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(current)
  const get = (part: string) => parts.find(item => item.type === part)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function daysInMonth(month: string): number {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
}

export function shiftMonth(month: string, amount: number): string {
  const [year, monthNumber] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export function formatLunarDate(date: string, options: Intl.DateTimeFormatOptions = {
  day: 'numeric', month: 'long', year: 'numeric',
}): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('es-EC', { timeZone: 'UTC', ...options }).format(new Date(Date.UTC(year, month - 1, day, 12)))
}

export function estimatedMoonFraction(date: string, timeZone: string): number {
  const [year, month, day] = date.split('-').map(Number)
  const hourUtc = timeZone === 'Pacific/Galapagos' ? 18 : 17 // mediodía aproximado local
  const elapsedDays = (Date.UTC(year, month - 1, day, hourUtc) - REFERENCE_NEW_MOON_UTC) / 86_400_000
  const ageDays = ((elapsedDays % LUNAR_CYCLE_DAYS) + LUNAR_CYCLE_DAYS) % LUNAR_CYCLE_DAYS
  return ageDays / LUNAR_CYCLE_DAYS
}

export function stageForFraction(fraction: number): LunarStage {
  if (fraction < 0.125 || fraction >= 0.875) return 'dark'
  if (fraction < 0.375) return 'waxing'
  if (fraction < 0.625) return 'full'
  return 'waning'
}

export function estimateLunarDay(date: string, timeZone: string): LunarDay {
  const fraction = estimatedMoonFraction(date, timeZone)
  const phase = stageForFraction(fraction)
  return {
    date,
    phase,
    phaseName: LUNAR_STAGES[phase].label,
    fraction,
    recommendations: RECOMMENDATIONS[phase].map(item => ({ ...item, source: MSP_LUNAR_REFERENCE })),
  }
}

export function estimateLunarMonth(month: string, timeZone: string): LunarMonth {
  return {
    month,
    source: 'estimated',
    days: Array.from({ length: daysInMonth(month) }, (_, index) =>
      estimateLunarDay(`${month}-${String(index + 1).padStart(2, '0')}`, timeZone)),
  }
}

/** La API puede usar nombres españoles o las claves acordadas en la issue #43. */
export function normalizeStage(raw: string): LunarStage | null {
  const value = raw.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (value === 'dark' || value.includes('oscura') || value.includes('nueva') || value.includes('yana')) return 'dark'
  if (value === 'waxing' || value.includes('creciente') || value.includes('winak')) return 'waxing'
  if (value === 'full' || value.includes('llena') || value.includes('pura')) return 'full'
  if (value === 'waning' || value.includes('menguante') || value.includes('wanuk')) return 'waning'
  return null
}
