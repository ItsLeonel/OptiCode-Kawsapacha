const { test } = require('node:test')
const assert = require('node:assert/strict')
const entries = require('../prisma/regional-species.json')

test('catálogo regional documental conserva identificadores y fuentes verificables', () => {
  assert.equal(entries.length, 30)
  assert.equal(new Set(entries.map(plant => plant.id)).size, entries.length)
  for (const plant of entries) {
    assert.ok(plant.family && plant.sourceUrl && plant.description)
    assert.match(plant.sourceUrl, /^https:\/\//)
    assert.ok(JSON.parse(plant.regions).length >= 1)
    assert.ok(['INFORMATIVA', 'DOCUMENTADA'].includes(plant.registerStatus))
    assert.equal(plant.name, plant.id)
  }
  assert.ok(entries.find(p => p.id === 'Guayusa'))
  assert.ok(entries.find(p => p.id === 'Hierba luisa'))
})
