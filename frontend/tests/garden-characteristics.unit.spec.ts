import { test, expect } from '@playwright/test'
import { resolve } from 'node:path'
import ts from 'typescript'
import {
  FENCE_OPTIONS, GROUND_DESIGN_OPTIONS, IRRIGATION_METHOD_OPTIONS,
  NATURAL_FERTILIZER_OPTIONS, WATER_SOURCE_OPTIONS,
  toGardenFeatures, toggleGardenFeature, type GardenFeatures,
} from '../src/features/real-gardens/garden-characteristics'

function optionKeys<T extends object>(options: T) {
  return Object.keys(options) as Extract<keyof T, string>[]
}

function testOptions<K extends keyof GardenFeatures>(field: K, options: readonly GardenFeatures[K][number][]) {
  test(`${field}: every existing option can be added and removed without changing saved selections`, () => {
    for (const option of options) {
      const saved = toGardenFeatures({
        groundDesigns: ['beds'], fences: ['metal'], waterSources: ['mains'],
        irrigationMethods: ['drip'], naturalFertilizers: ['compost'],
      })
      const initial: GardenFeatures = { ...saved, [field]: [] }
      const before = structuredClone(initial)
      Object.values(initial).forEach(values => Object.freeze(values))
      Object.freeze(initial)

      const added = toggleGardenFeature(initial, field, option)
      const removed = toggleGardenFeature(added, field, option)
      expect(added[field]).toEqual([option])
      expect(removed[field]).toEqual([])
      expect(initial).toEqual(before)
      expect(added[field]).not.toBe(initial[field])
      for (const other of optionKeys(initial)) {
        if (other !== field) {
          expect(added[other]).toBe(initial[other])
          expect(removed[other]).toBe(initial[other])
        }
      }
    }
  })
}

testOptions('groundDesigns', optionKeys(GROUND_DESIGN_OPTIONS))
testOptions('fences', optionKeys(FENCE_OPTIONS))
testOptions('waterSources', optionKeys(WATER_SOURCE_OPTIONS))
testOptions('irrigationMethods', optionKeys(IRRIGATION_METHOD_OPTIONS))
testOptions('naturalFertilizers', optionKeys(NATURAL_FERTILIZER_OPTIONS))

test('existing values and their order survive adding and removing another selection', () => {
  const saved = toGardenFeatures({ fences: ['living', 'metal'] })
  const added = toggleGardenFeature(saved, 'fences', 'recycled')
  const removed = toggleGardenFeature(added, 'fences', 'living')
  expect(saved.fences).toEqual(['living', 'metal'])
  expect(added.fences).toEqual(['living', 'metal', 'recycled'])
  expect(removed.fences).toEqual(['metal', 'recycled'])
})

/** Compile in memory with the project's checks; no ignored diagnostics or emitted files. */
function typeDiagnostics(body: string) {
  const config = ts.getParsedCommandLineOfConfigFile('tsconfig.json', {}, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: diagnostic => { throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')) },
  })
  if (!config) throw new Error('No se pudo leer tsconfig.json')
  const virtualFile = resolve('tests/garden-characteristics-type-contract.ts')
  const source = `import { toGardenFeatures, toggleGardenFeature, type GardenFeatures } from '../src/features/real-gardens/garden-characteristics';
const features: GardenFeatures = toGardenFeatures();
${body}`
  const host = ts.createCompilerHost(config.options)
  const originalGetSourceFile = host.getSourceFile.bind(host)
  host.getSourceFile = (file, version, onError, fresh) => resolve(file) === virtualFile
    ? ts.createSourceFile(file, source, version, true)
    : originalGetSourceFile(file, version, onError, fresh)
  return ts.getPreEmitDiagnostics(ts.createProgram([virtualFile], config.options, host))
}

test('the type contract accepts generic forwarding and rejects wrong-group, numeric and symbol options', () => {
  const valid = typeDiagnostics(`
toggleGardenFeature(features, 'groundDesigns', 'furrows');
toggleGardenFeature(features, 'fences', 'living');
toggleGardenFeature(features, 'waterSources', 'rain');
toggleGardenFeature(features, 'irrigationMethods', 'manual');
toggleGardenFeature(features, 'naturalFertilizers', 'compost');
function forward<K extends keyof GardenFeatures>(field: K, option: GardenFeatures[K][number]) {
  return toggleGardenFeature(features, field, option);
}
forward('fences', 'metal');
`)
  expect(valid.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))).toEqual([])
  const invalid = typeDiagnostics(`
toggleGardenFeature(features, 'fences', 'drip');
toggleGardenFeature(features, 'waterSources', 42);
toggleGardenFeature(features, 'naturalFertilizers', Symbol('compost'));
`)
  expect(invalid.map(diagnostic => diagnostic.code)).toEqual([2345, 2345, 2345])
  expect(invalid.every(diagnostic => diagnostic.file !== undefined && resolve(diagnostic.file.fileName) === resolve('tests/garden-characteristics-type-contract.ts'))).toBe(true)
})
