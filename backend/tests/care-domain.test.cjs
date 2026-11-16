'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { getRegrowthDaysByName, calculateGrowthData } =
  require('../dist/modules/activities/domain/care-rules')

test('Días de rebrote por especie se conservan tras extracción al dominio', () => {
  assert.equal(getRegrowthDaysByName('Menta'), 16)
  assert.equal(getRegrowthDaysByName('Manzanilla'), 13)
  assert.equal(getRegrowthDaysByName('Romero'), 30)
  assert.equal(getRegrowthDaysByName('Especie desconocida'), 20)
})

test('Cálculo del progreso puede ejecutarse sin Prisma ni Express', () => {
  const species = {
    name: 'Romero',
    wateringFrequencyDays: 4,
    fertilizerFrequencyDays: 12,
    growthCycleDays: 90,
    lunarPhaseTip: '',
    bestPlantingSeason: '',
  }
  const plant = { plantingDate: new Date(Date.now() - 86400000 * 10), lifecycleStatus: 'GROWING' }
  const result = calculateGrowthData(plant, species, [])
  assert.equal(result.needsWatering, true)
  assert.equal(result.needsFertilizer, true)
  assert.equal(result.healthStatus, 'REQUIERE_RIEGO')
  assert.ok(result.percentage >= 0 && result.percentage <= 100)
})
