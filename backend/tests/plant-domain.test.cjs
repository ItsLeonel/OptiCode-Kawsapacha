'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { MAX_PLOTS, extractGrowthStage } = require('../dist/modules/plants/domain/plant-rules')

test('Se conservan las seis parcelas de siembra', () => {
  assert.equal(MAX_PLOTS, 6)
})
test('Última etapa válida entre evidencias conserva el comportamiento del espejo', () => {
  const evidences = [
    { type: 'observation', reviewStatus: 'REJECTED', details: '{"growthStage":"adult"}' },
    { type: 'observation', reviewStatus: 'PENDING', details: '{"growthStage":"sprout"}' },
    { type: 'sowing', reviewStatus: 'APPROVED', details: '{"growthStage":"seed"}' },
  ]
  assert.equal(extractGrowthStage(evidences), 'sprout')
  assert.equal(extractGrowthStage([{type:'observation',reviewStatus:'PENDING',details:'texto inválido'}]), undefined)
})
