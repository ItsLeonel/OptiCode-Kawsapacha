// backend/src/services/lunar-calendar.service.ts
// Responsable: Ronny Veloz (Rodni15)
// Cálculo astronómico dinámico de fases lunares y recomendaciones MSP 2017

export type LunarPhaseCode = 'dark' | 'waxing' | 'full' | 'waning'

export interface LunarRecommendation {
  activityType: 'preparation' | 'weeding' | 'sowing' | 'watering' | 'fertilizing' | 'hilling' | 'replanting' | 'observation' | 'harvest'
  title: string
  description: string
  source: string
  advisory: boolean
}

export interface DayLunarInfo {
  date: string // YYYY-MM-DD
  timezone: string
  phase: LunarPhaseCode
  phaseName: string
  kichwaName: string
  fraction: number // 0.00 a 1.00
  illuminationPercent: number // 0 a 100%
  recommendations: LunarRecommendation[]
  advisory: boolean
}

export interface MonthLunarResponse {
  month: string // YYYY-MM
  timezone: string
  days: DayLunarInfo[]
}

// Período sinódico medio lunar en milisegundos: 29.53058867 días
const SYNODIC_MONTH_MS = 29.53058867 * 24 * 60 * 60 * 1000
// Referencia astronómica de Luna Nueva conocida: 11 de enero de 2024, 11:57:00 UTC
const KNOWN_NEW_MOON_UTC = 1704974220000

// Zonas horarias de Ecuador (sin horario de verano):
// Continental: America/Guayaquil (UTC-5)
// Galápagos: Pacific/Galapagos (UTC-6)
export const VALID_TIMEZONES: Record<string, number> = {
  'America/Guayaquil': -5,
  'Pacific/Galapagos': -6,
  'UTC': 0,
}

export function normalizeTimezone(tz?: string): { name: string; offsetHours: number } {
  if (!tz) return { name: 'America/Guayaquil', offsetHours: -5 }
  const match = VALID_TIMEZONES[tz]
  if (match !== undefined) return { name: tz, offsetHours: match }
  // Fallback por defecto a Ecuador Continental
  return { name: 'America/Guayaquil', offsetHours: -5 }
}

/**
 * Retorna las recomendaciones tradicionales según MSP 2017 (Anexo 4, pp. 33, 45, 49, 69-70).
 */
export function getRecommendationsForPhase(phase: LunarPhaseCode): LunarRecommendation[] {
  switch (phase) {
    case 'dark':
      return [
        {
          activityType: 'preparation',
          title: 'Preparación del suelo y acondicionamiento',
          description: 'Momento propicio para descompactar tierra, laboreo y trazado de camellones o surcos (wachus).',
          source: 'MSP, 2017, Anexo 4 (p. 33, 69)',
          advisory: true,
        },
        {
          activityType: 'weeding',
          title: 'Limpieza y deshierbe',
          description: 'Control de plantas competidoras; menor fuerza vegetativa sobre la maleza cortada.',
          source: 'MSP, 2017, Anexo 4 (p. 33, 69)',
          advisory: true,
        },
        {
          activityType: 'fertilizing',
          title: 'Abonado orgánico de fondo',
          description: 'Incorporación de compost y restos vegetales al suelo con reposo previo de 15 días.',
          source: 'MSP, 2017, Anexo 4 (p. 31-33)',
          advisory: true,
        },
      ]
    case 'waxing':
      return [
        {
          activityType: 'sowing',
          title: 'Siembra de plantas medicinales',
          description: 'Aconsejable para siembra de semillas, estacas y esquejes; favorece desarrollo foliar y vigor.',
          source: 'MSP, 2017, Anexo 4 (p. 45, 69)',
          advisory: true,
        },
        {
          activityType: 'watering',
          title: 'Riego de acompañamiento foliar',
          description: 'Humedad equilibrada al pie del cultivo para acompañar la brotación en luna creciente.',
          source: 'MSP, 2017, Anexo 4 (p. 45, 69)',
          advisory: true,
        },
        {
          activityType: 'hilling',
          title: 'Aporque de protección',
          description: 'Acumulación de tierra al pie del tallo para dar estabilidad mecánica y protección radicular.',
          source: 'MSP, 2017, Anexo 4 (p. 47)',
          advisory: true,
        },
      ]
    case 'full':
      return [
        {
          activityType: 'harvest',
          title: 'Cosecha de hojas, flores y partes aéreas',
          description: 'Mayor concentración de savia y principios activos aromáticos. Realizar tras secar el rocío.',
          source: 'MSP, 2017, Anexo 4 (p. 49, 69)',
          advisory: true,
        },
        {
          activityType: 'observation',
          title: 'Observación del vigor y salud botánica',
          description: 'Monitoreo de la respuesta foliar y floración para documentar en la Bitácora Viva.',
          source: 'MSP, 2017, Anexo 4 (p. 49)',
          advisory: true,
        },
      ]
    case 'waning':
      return [
        {
          activityType: 'harvest',
          title: 'Cosecha de raíces, tubérculos y semillas',
          description: 'La energía desciende a las raíces; propicio para extraer semillas secas y órganos subterráneos.',
          source: 'MSP, 2017, Anexo 4 (p. 49, 69)',
          advisory: true,
        },
        {
          activityType: 'weeding',
          title: 'Limpieza y mantenimiento sanitario',
          description: 'Revisión y mantenimiento de canteros sin perturbar brotes jóvenes.',
          source: 'MSP, 2017, Anexo 4 (p. 49)',
          advisory: true,
        },
      ]
  }
}

/**
 * Calcula la fase lunar para una fecha local dada (YYYY-MM-DD) y zona horaria.
 */
export function calculateDayLunarInfo(dateStr: string, timezoneStr?: string): DayLunarInfo {
  const { name: timezone, offsetHours } = normalizeTimezone(timezoneStr)

  // Desglosar año, mes, día (validando formato ISO YYYY-MM-DD)
  const parts = dateStr.split('-').map(Number)
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    throw new Error(`Formato de fecha inválido: "${dateStr}". Debe ser YYYY-MM-DD.`)
  }
  const [year, month, day] = parts

  // Evaluar al mediodía local (12:00:00) para tener una muestra representativa del día
  // UTC = LocalHour - offsetHours = 12 - (-5) = 17h UTC para Guayaquil
  const utcNoonMs = Date.UTC(year, month - 1, day, 12 - offsetHours, 0, 0, 0)

  // Cálculo astronómico de fase
  let diff = (utcNoonMs - KNOWN_NEW_MOON_UTC) % SYNODIC_MONTH_MS
  if (diff < 0) diff += SYNODIC_MONTH_MS
  const fraction = diff / SYNODIC_MONTH_MS

  // Porcentaje de iluminación (0% nueva, 100% llena)
  const illuminationPercent = Math.round(0.5 * (1 - Math.cos(2 * Math.PI * fraction)) * 100)

  let phase: LunarPhaseCode
  let phaseName: string
  let kichwaName: string

  // División simétrica en 4 etapas tradicionales MSP:
  // dark (Yana Killa): ventana de luna nueva (fraction < 0.0625 o >= 0.9375) (~3.7 días)
  // waxing (Wiñak Killa): creciente (0.0625 a 0.4375)
  // full (Pura Killa): ventana de luna llena (0.4375 a 0.5625) (~3.7 días)
  // waning (Wañuk Killa): menguante (0.5625 a 0.9375)
  if (fraction < 0.0625 || fraction >= 0.9375) {
    phase = 'dark'
    phaseName = 'Yana Killa / Luna oscura'
    kichwaName = 'Yana Killa'
  } else if (fraction >= 0.0625 && fraction < 0.4375) {
    phase = 'waxing'
    phaseName = 'Wiñak Killa / Luna creciente'
    kichwaName = 'Wiñak Killa'
  } else if (fraction >= 0.4375 && fraction < 0.5625) {
    phase = 'full'
    phaseName = 'Pura Killa / Luna llena'
    kichwaName = 'Pura Killa'
  } else {
    phase = 'waning'
    phaseName = 'Wañuk Killa / Luna menguante'
    kichwaName = 'Wañuk Killa'
  }

  const recommendations = getRecommendationsForPhase(phase)

  return {
    date: dateStr,
    timezone,
    phase,
    phaseName,
    kichwaName,
    fraction: Math.round(fraction * 1000) / 1000,
    illuminationPercent,
    recommendations,
    advisory: true,
  }
}

/**
 * Genera el calendario mensual completo para un mes dado (YYYY-MM).
 */
export function calculateMonthLunarInfo(monthStr: string, timezoneStr?: string): MonthLunarResponse {
  const { name: timezone } = normalizeTimezone(timezoneStr)
  const parts = monthStr.split('-').map(Number)
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
    throw new Error(`Formato de mes inválido: "${monthStr}". Debe ser YYYY-MM.`)
  }
  const [year, month] = parts
  if (month < 1 || month > 12) {
    throw new Error(`Mes fuera de rango: ${month}. Debe ser entre 01 y 12.`)
  }

  // Días en el mes (usando Date.UTC para evitar saltos horarios)
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const days: DayLunarInfo[] = []

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push(calculateDayLunarInfo(dayStr, timezone))
  }

  return {
    month: monthStr,
    timezone,
    days,
  }
}

