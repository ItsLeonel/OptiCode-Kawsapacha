import { getToken } from '../../../services/api'
import {
  estimateLunarDay, estimateLunarMonth, normalizeStage,
  type LunarDay, type LunarMonth, type LunarRecommendation,
} from './lunar-model'

type ApiDay = {
  date?: unknown
  phase?: unknown
  phaseName?: unknown
  fraction?: unknown
  recommendations?: unknown
}

function decodeDay(value: unknown, timeZone: string): LunarDay | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as ApiDay
  if (typeof raw.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date)) return null
  const stage = normalizeStage(String(raw.phase ?? raw.phaseName ?? ''))
  if (!stage) return null
  const estimated = estimateLunarDay(raw.date, timeZone)
  const backendFraction = typeof raw.fraction === 'number' && Number.isFinite(raw.fraction)
    && raw.fraction >= 0 && raw.fraction < 1 ? raw.fraction : estimated.fraction
  const recommendations: LunarRecommendation[] = Array.isArray(raw.recommendations)
    ? raw.recommendations.flatMap(item => {
      if (!item || typeof item !== 'object') return []
      const entry = item as Record<string, unknown>
      if (typeof entry.title !== 'string' || !entry.title.trim()) return []
      return [{
        title: entry.title,
        activityType: typeof entry.activityType === 'string' ? entry.activityType : undefined,
        description: typeof entry.description === 'string' ? entry.description : undefined,
        source: typeof entry.source === 'string' ? entry.source : undefined,
        advisory: true as const,
      }]
    })
    : []
  return {
    date: raw.date,
    phase: stage,
    phaseName: typeof raw.phaseName === 'string' && raw.phaseName ? raw.phaseName : estimated.phaseName,
    fraction: backendFraction,
    recommendations,
  }
}

/** API prevista en la issue #43. Caída controlada a previsualización estimada cuando aún no existe. */
export async function loadLunarMonth(month: string, timeZone: string, signal?: AbortSignal): Promise<LunarMonth> {
  const fallback = estimateLunarMonth(month, timeZone)
  try {
    const query = new URLSearchParams({ month, timezone: timeZone })
    const token = getToken()
    const response = await fetch(`/api/lunar-calendar?${query.toString()}`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal,
    })
    if (!response.ok) return fallback
    const payload: unknown = await response.json()
    if (!payload || typeof payload !== 'object') return fallback
    const envelope = payload as Record<string, unknown>
    const inner = envelope.data && typeof envelope.data === 'object' ? envelope.data as Record<string, unknown> : envelope
    if (envelope.ok === false || !Array.isArray(inner.days)) return fallback
    const entries = inner.days.map(day => decodeDay(day, timeZone)).filter((day): day is LunarDay => Boolean(day))
    const byDate = new Map(entries.map(day => [day.date, day]))
    // Una respuesta incompleta no se presenta como datos astronómicos oficiales.
    if (fallback.days.some(day => !byDate.has(day.date))) return fallback
    return { month, source: 'backend', days: fallback.days.map(day => byDate.get(day.date)!) }
  } catch (error) {
    if (signal?.aborted) throw error
    return fallback
  }
}
