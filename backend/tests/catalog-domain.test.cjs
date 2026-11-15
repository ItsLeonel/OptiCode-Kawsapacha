'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { CATALOG_REGIONS, decodeCatalogArray, serializeCatalogSpecies } =
  require('../dist/modules/catalog/domain/catalog-species')
const { createCatalogService } = require('../dist/modules/catalog/application/catalog.service')

test('El dominio del catálogo conserva las regiones y normaliza JSON de forma segura', () => {
  assert.deepEqual(CATALOG_REGIONS, ['costa', 'sierra', 'oriente', 'galapagos'])
  assert.deepEqual(decodeCatalogArray('["costa", 4, "sierra"]'), ['costa', 'sierra'])
  assert.deepEqual(decodeCatalogArray('dato inválido'), [])
  const plant = { id: '1', name: 'Romero', regions: '["sierra"]', otherNames: '[]', usageTags: '["aromática"]' }
  assert.deepEqual(serializeCatalogSpecies(plant), {
    ...plant, regions: ['sierra'], otherNames: [], usageTags: ['aromática'],
  })
})

test('Casos de uso del catálogo funcionan con un repositorio falso sin Prisma', async () => {
  const data = [
    { id: 'a', name: 'Romero', regions: '["sierra"]', otherNames: '[]', usageTags: '[]' },
    { id: 'b', name: 'Menta', regions: '["costa"]', otherNames: '[]', usageTags: '[]' },
  ]
  const repo = {
    async findMany(query) { return query ? data.filter(p => p.name.includes(query)) : data },
    async findById(id) { return data.find(p => p.id === id) ?? null },
  }
  const service = createCatalogService(repo)
  assert.deepEqual((await service.listCatalog(undefined, 'sierra')).map(p => p.id), ['a'])
  assert.deepEqual((await service.listCatalog('Menta')).map(p => p.id), ['b'])
  assert.equal((await service.getCatalogById('a'))?.name, 'Romero')
  assert.equal(await service.getCatalogById('inexistente'), null)
})
