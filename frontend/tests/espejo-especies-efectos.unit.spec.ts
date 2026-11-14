import { expect, test } from '@playwright/test'
import type Phaser from 'phaser'
import { readFileSync } from 'node:fs'
// Playwright ejecuta estas pruebas en Node: leer JSON sin importaciones ESM sin atributo.
const catalog = JSON.parse(readFileSync('src/features/medicinal-catalog/regional-species.json', 'utf8')) as {name: string; latinName: string}[]
import { SPECIES_ART_COUNT, resolveSpeciesArt } from '../src/features/my-garden/phaser-poc/species-art'
import { paintObservedPlant } from '../src/features/my-garden/phaser-poc/plant-illustration'
import { feedbackMotion, hasIllustratedFeedback, paintActivityFeedback } from '../src/features/my-garden/phaser-poc/activity-feedback-art'
import type { GrowthStage } from '../src/features/my-garden/growth-stages'

function graphicsSpy() {
  const shapes: string[] = []
  const colors: number[] = []
  const g = {
    fillStyle(color: number) { colors.push(color); return g },
    lineStyle() { return g },
    fillEllipse() { shapes.push('ellipse'); return g },
    strokeEllipse() { shapes.push('strokeEllipse'); return g },
    fillCircle() { shapes.push('circle'); return g },
    strokeCircle() { shapes.push('strokeCircle'); return g },
    fillTriangle() { shapes.push('triangle'); return g },
    lineBetween() { shapes.push('line'); return g },
    fillRoundedRect() { shapes.push('roundRect'); return g },
    strokeRoundedRect() { shapes.push('strokeRect'); return g },
  }
  return { g: g as unknown as Phaser.GameObjects.Graphics, shapes, colors }
}

test('se cubren las 30 entradas reales del catálogo, incluso nombres con tildes', () => {
  expect(catalog).toHaveLength(30)
  expect(SPECIES_ART_COUNT).toBe(30)
  for (const plant of catalog) {
    expect(resolveSpeciesArt(plant.name, plant.latinName), plant.name).not.toBeNull()
    expect(resolveSpeciesArt('Nombre editado', plant.latinName), plant.latinName).not.toBeNull()
  }
  expect(resolveSpeciesArt('Uña de gato', 'Uncaria tomentosa')?.habit).toBe('vine')
  expect(resolveSpeciesArt('Diente de león', 'Taraxacum officinale')?.habit).toBe('rosette')
  expect(resolveSpeciesArt('Hierba luisa', 'Cymbopogon citratus')?.habit).toBe('tuft')
  expect(resolveSpeciesArt('Especie no registrada', 'Genus unknownus')).toBeNull()
})

test('todas las especies y etapas se pueden ilustrar sin depender de fotos o servidor', () => {
  const stages: (GrowthStage | null)[] = [null, 'sown', 'sprout', 'seedling', 'vegetative', 'flowering', 'harvested']
  for (const plant of catalog) for (const stage of stages) {
    const art = graphicsSpy()
    paintObservedPlant(art.g, stage, plant.name, plant.latinName)
    expect(art.shapes.length, plant.name + ' / ' + stage).toBeGreaterThan(2)
  }
})

test('no aparecen flores ni frutos documentados antes de floración', () => {
  for (const plant of catalog) {
    const profile = resolveSpeciesArt(plant.name, plant.latinName)!
    for (const stage of ['sprout', 'seedling', 'vegetative'] as const) {
      const { g, colors } = graphicsSpy()
      paintObservedPlant(g, stage, plant.name, plant.latinName)
      // La manzanilla usa un pintor propio y flor blanca.
      if (plant.name !== 'Manzanilla') expect(colors, plant.name + ' / ' + stage).not.toContain(profile.blossom)
    }
  }
})

test('los efectos agrícolas contienen formas distintas y tienen duración limitada', () => {
  const actions = ['watering', 'fertilizing', 'weeding', 'harvest'] as const
  const representations = new Set<string>()
  for (const action of actions) {
    expect(hasIllustratedFeedback(action)).toBe(true)
    const { g, shapes, colors } = graphicsSpy()
    paintActivityFeedback(g, action, 1)
    expect(shapes.length, action).toBeGreaterThan(2)
    representations.add(shapes.join(':') + ' | ' + colors.join(':'))
    const movement = feedbackMotion(action, 0)
    expect(movement.duration).toBeGreaterThan(0)
    expect(movement.duration).toBeLessThanOrEqual(1100)
    expect(movement.count).toBeGreaterThan(0)
    expect(movement.count).toBeLessThanOrEqual(8)
  }
  expect(representations.size).toBe(4)
  expect(hasIllustratedFeedback('observation')).toBe(false)
  expect(hasIllustratedFeedback('sowing')).toBe(false)
})
