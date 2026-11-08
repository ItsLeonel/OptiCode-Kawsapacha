import { test, expect } from './e2e'

test('IndexedDB: atomic photos, reload, concurrent commands, duplicate activity and failed write protection', async ({ page }) => {
  await page.goto('/tests/fixtures/journal-store.html')
  const result = await page.evaluate(async () => {
    const repositoryPath = '/src/features/my-garden/journal/repository.ts'
    const { IndexedDbGardenRepository } = await import(/* @vite-ignore */ repositoryPath)
    const repository = new IndexedDbGardenRepository('kawsapacha-isolated-store-test')
    await repository.load()
    await repository.commit({ id: 'community', type: 'community', community: { name: 'Comunidad de prueba', responsible: 'Ana', location: 'Imbabura', description: '' } })
    await repository.commit({ id: 'terrain', type: 'terrain', terrain: { name: 'Terreno de prueba', kind: 'ground', areaM2: 25, location: { province: 'Imbabura', provinceCode: '10', canton: '', cantonCode: null, parish: '', parishCode: null, reference: '', coordinates: null }, soilType: 'loam', irrigationAvailability: 'unknown', communityName: 'Comunidad de prueba' } })
    const blob = await (await fetch('/src/features/real-gardens/assets/en-tierra-v1.jpg')).blob()
    const saved = await repository.commit({ id: 'plant', type: 'plant-add', plant: { id: 'plant-a', plot: 0, name: 'Romero', latin: 'Salvia rosmarinus', photo: '', photoId: 'photo-a', date: '2026-11-01' } }, [{ id: 'photo-a', blob }])
    const activity = { id: 'water-a', gardenId: saved.gardenId, type: 'watering', date: '2026-11-01', responsible: 'Ana', target: { kind: 'plant', plantId: 'plant-a', plot: 0 }, notes: 'Dos litros de agua aplicados manualmente.', photoIds: [], details: { quantity: 2, unit: 'L' }, createdAt: '2026-11-01T15:00:00Z', validation: 'local-v1' }
    const other = new IndexedDbGardenRepository('kawsapacha-isolated-store-test')
    await Promise.all([repository.commit({ id: 'water-a', type: 'activity', activity }), other.commit({ id: 'water-b', type: 'activity', activity: { ...activity, id: 'water-b' } })])
    const before = await repository.load()
    let failed = false
    try { await repository.commit({ id: 'missing-photo', type: 'plant-add', plant: { ...saved.plants[0], id: 'plant-b', plot: 1, photoId: 'missing' } }) } catch { failed = true }
    const after = await repository.load()
    const imageBytes = await (await fetch(after.plants[0].photo)).arrayBuffer()
    repository.close(); other.close()
    return { count: after.activities.length, plants: after.plants.length, failed, revisionUnchanged: before.revision === after.revision, imageBytes: imageBytes.byteLength, originalBytes: blob.size }
  })
  expect(result).toEqual({ count: 1, plants: 1, failed: true, revisionUnchanged: true, imageBytes: result.originalBytes, originalBytes: result.originalBytes })
  await page.reload()
  const restored = await page.evaluate(async () => {
    const path = '/src/features/my-garden/journal/repository.ts'
    const { IndexedDbGardenRepository } = await import(/* @vite-ignore */ path)
    const repository = new IndexedDbGardenRepository('kawsapacha-isolated-store-test')
    const data = await repository.load()
    const bytes = (await (await fetch(data.plants[0].photo)).arrayBuffer()).byteLength
    repository.close()
    return { name: data.plants[0].name, activities: data.activities.length, bytes }
  })
  expect(restored).toEqual({ name: 'Romero', activities: 1, bytes: result.originalBytes })
})
