import { strict as assert } from 'node:assert'
import { createCatalogService } from '../src/modules/catalog/application/catalog.service'
import { decodeCatalogArray, serializeCatalogSpecies } from '../src/modules/catalog/domain/catalog-species'

export async function runCatalogArchitectureTests() {
  assert.deepEqual(decodeCatalogArray('["sierra",17,"costa",null]'), ['sierra', 'costa'])
  assert.deepEqual(decodeCatalogArray('json inválido'), [])
  const stored = { id: 'p1', name: 'Hierba', regions: '["sierra"]', otherNames: '[]', usageTags: '["ritual"]' }
  assert.deepEqual(serializeCatalogSpecies(stored).regions, ['sierra'])
  let receivedQuery: string | undefined
  const catalog = createCatalogService({
    async findMany(query) {
      receivedQuery = query
      return [stored, { ...stored, id: 'p2', regions: '["costa"]' }]
    },
    async findById(id) { return id === 'p1' ? stored : null },
  })
  const sierra = await catalog.listCatalog('hier', 'sierra')
  assert.equal(receivedQuery, 'hier')
  assert.equal(sierra.length, 1)
  assert.equal(sierra[0]?.id, 'p1')
  assert.deepEqual((await catalog.getCatalogById('p1'))?.usageTags, ['ritual'])
  assert.equal(await catalog.getCatalogById('missing'), null)
  console.log('✅ Catálogo: dominio, filtros y casos de uso independientes de Prisma')
}
