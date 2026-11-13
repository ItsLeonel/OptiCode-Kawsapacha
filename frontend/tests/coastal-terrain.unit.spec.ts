import { expect, test } from '@playwright/test'
import { COASTAL_REFERENCE_SCALE } from '../src/features/my-garden/phaser-poc/coastal-bed'
import { coastalReliefGeometry, isCoastalRelief, COASTAL_RELIEF_ART, COASTAL_RELIEF_KEY } from '../src/features/my-garden/phaser-poc/coastal-terrain'

test('las cuatro distribuciones de Costa tienen arte propio y reemplazan el diseño anterior', () => {
  expect(isCoastalRelief('furrows')).toBe(true)
  expect(isCoastalRelief('raisedBeds')).toBe(true)
  expect(isCoastalRelief('terraces')).toBe(true)
  expect(isCoastalRelief('beds')).toBe(true)
  expect(isCoastalRelief(null)).toBe(false)
  expect(new Set(Object.values(COASTAL_RELIEF_KEY)).size).toBe(4)
  expect(Object.keys(COASTAL_RELIEF_ART).sort()).toEqual(['beds', 'furrows', 'raisedBeds', 'terraces'])
})

test('cada uno de los seis espacios conserva un relieve independiente y un tamaño acotado', () => {
  for (const design of ['beds', 'furrows', 'raisedBeds', 'terraces'] as const) {
    const plots = Array.from({ length: 6 }, (_, plot) => coastalReliefGeometry(plot, design, COASTAL_REFERENCE_SCALE))
    expect(plots).toHaveLength(6)
    for (const { width, height } of plots) {
      expect(width).toBeGreaterThan(300)
      expect(width).toBeLessThan(420)
      expect(height).toBeGreaterThan(140)
      expect(height).toBeLessThan(200)
    }
  }
})

test('las terrazas son más profundas que los surcos y el área escala sin ocultar el entorno', () => {
  expect(coastalReliefGeometry(0, 'terraces', COASTAL_REFERENCE_SCALE).height)
    .toBeGreaterThan(coastalReliefGeometry(0, 'furrows', COASTAL_REFERENCE_SCALE).height)
  for (const design of ['beds', 'furrows', 'raisedBeds', 'terraces'] as const) {
    const small = coastalReliefGeometry(0, design, .72)
    const large = coastalReliefGeometry(0, design, 1.10)
    expect(small.width).toBeLessThan(large.width)
    expect(small.height).toBeLessThan(large.height)
    expect(large.width).toBeLessThanOrEqual(420)
  }
})
