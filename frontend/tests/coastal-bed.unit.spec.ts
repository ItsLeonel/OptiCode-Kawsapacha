import { test, expect } from '@playwright/test'
import { COASTAL_REFERENCE_SCALE, coastalFootprintScale } from '../src/features/my-garden/phaser-poc/coastal-bed'

test('Costa keeps the approved 54 m² layout and shows monotonic area differences', () => {
  expect(coastalFootprintScale(54)).toBeCloseTo(COASTAL_REFERENCE_SCALE, 10)
  expect(coastalFootprintScale(10)).toBeLessThan(coastalFootprintScale(50))
  expect(coastalFootprintScale(50)).toBeLessThan(coastalFootprintScale(100))
  expect(coastalFootprintScale(10)).toBeGreaterThanOrEqual(.72)
  expect(coastalFootprintScale(10000)).toBeLessThanOrEqual(1.1)
})

test('area input outside the visual range cannot create non-finite scene dimensions', () => {
  for (const area of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    expect(Number.isFinite(coastalFootprintScale(area))).toBe(true)
  }
})
