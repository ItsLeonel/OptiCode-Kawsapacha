// Reglas de planta sin dependencias del motor HTTP ni de la base de datos.
export const MAX_PLOTS = 6

export function extractGrowthStage(activities: Array<{ details: string; type: string; reviewStatus: string }>): string | undefined {
  for (const act of activities) {
    // La etapa registrada se refleja de inmediato; una evidencia rechazada no gobierna el espejo.
    if (act.reviewStatus === 'REJECTED') continue
    try {
      const parsed = JSON.parse(act.details || '{}') as { growthStage?: string }
      if (parsed.growthStage && typeof parsed.growthStage === 'string') {
        return parsed.growthStage
      }
    } catch {
      // ignorar JSON malformado
    }
  }
  return undefined
}
