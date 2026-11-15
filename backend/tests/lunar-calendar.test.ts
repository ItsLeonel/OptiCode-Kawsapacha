// backend/tests/lunar-calendar.test.ts
import assert from 'assert'
import {
  calculateDayLunarInfo,
  calculateMonthLunarInfo,
  normalizeTimezone,
  getRecommendationsForPhase,
} from '../src/modules/lunar-calendar/application/lunar-calendar.service'

export async function runLunarTests() {
  console.log('🧪 Iniciando pruebas astronómicas y de calendario lunar MSP...')

  // 1. Zonas horarias de Ecuador
  const guayaquil = normalizeTimezone('America/Guayaquil')
  assert.equal(guayaquil.name, 'America/Guayaquil')
  assert.equal(guayaquil.offsetHours, -5)

  const galapagos = normalizeTimezone('Pacific/Galapagos')
  assert.equal(galapagos.name, 'Pacific/Galapagos')
  assert.equal(galapagos.offsetHours, -6)

  // Fallback seguro
  const fallback = normalizeTimezone('Invalid/Zone')
  assert.equal(fallback.name, 'America/Guayaquil')
  assert.equal(fallback.offsetHours, -5)

  // 2. Comprobar fecha de Luna Nueva conocida (11 de enero de 2024)
  const newMoonDay = calculateDayLunarInfo('2024-01-11', 'America/Guayaquil')
  assert.equal(newMoonDay.phase, 'dark')
  assert.equal(newMoonDay.kichwaName, 'Yana Killa')
  assert.equal(newMoonDay.advisory, true)
  assert.ok(newMoonDay.recommendations.length >= 2)
  assert.ok(newMoonDay.recommendations.some(r => r.activityType === 'preparation'))
  assert.ok(newMoonDay.recommendations.some(r => r.activityType === 'weeding'))

  // 3. Comprobar fecha de Luna Llena conocida (25 de enero de 2024, ~14 días después)
  const fullMoonDay = calculateDayLunarInfo('2024-01-25', 'America/Guayaquil')
  assert.equal(fullMoonDay.phase, 'full')
  assert.equal(fullMoonDay.kichwaName, 'Pura Killa')
  assert.ok(fullMoonDay.illuminationPercent >= 90)
  assert.ok(fullMoonDay.recommendations.some(r => r.activityType === 'harvest'))

  // 4. Comprobar fecha de Creciente (18 de enero de 2024)
  const waxingDay = calculateDayLunarInfo('2024-01-18', 'America/Guayaquil')
  assert.equal(waxingDay.phase, 'waxing')
  assert.equal(waxingDay.kichwaName, 'Wiñak Killa')
  assert.ok(waxingDay.recommendations.some(r => r.activityType === 'sowing'))

  // 5. Comprobar fecha de Menguante (2 de febrero de 2024)
  const waningDay = calculateDayLunarInfo('2024-02-02', 'America/Guayaquil')
  assert.equal(waningDay.phase, 'waning')
  assert.equal(waningDay.kichwaName, 'Wañuk Killa')
  assert.ok(waningDay.recommendations.some(r => r.activityType === 'harvest'))

  // 6. Todas las recomendaciones citan el MSP 2017 y son consultivas (advisory: true)
  for (const phase of ['dark', 'waxing', 'full', 'waning'] as const) {
    const recs = getRecommendationsForPhase(phase)
    assert.ok(recs.length > 0)
    for (const r of recs) {
      assert.ok(r.source.includes('MSP, 2017'))
      assert.equal(r.advisory, true)
    }
  }

  // 7. Calendario mensual completo para noviembre 2026 (30 días)
  const monthData = calculateMonthLunarInfo('2026-11', 'America/Guayaquil')
  assert.equal(monthData.month, '2026-11')
  assert.equal(monthData.days.length, 30)
  assert.equal(monthData.days[0].date, '2026-11-01')
  assert.equal(monthData.days[29].date, '2026-11-30')

  // Verificar que el mes contiene transiciones de fases lunares válidas
  const distinctPhasesInMonth = new Set(monthData.days.map(d => d.phase))
  assert.ok(distinctPhasesInMonth.size >= 3, 'Un mes entero debe exhibir al menos 3 o 4 etapas lunares')

  console.log('✅ Pruebas astronómicas y de calendario lunar superadas con éxito.')
}

