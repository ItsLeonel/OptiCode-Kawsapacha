import { expect, test } from '@playwright/test'
import type Phaser from 'phaser'
import { paintObservedPlant } from '../src/features/my-garden/phaser-poc/plant-illustration'

function captureDrawing() {
  const colors: number[] = []
  const shapes: string[] = []
  const mock = {
    fillStyle(color: number) { colors.push(color); return mock },
    lineStyle() { return mock },
    fillEllipse() { shapes.push('ellipse'); return mock },
    strokeEllipse() { shapes.push('outline'); return mock },
    fillCircle() { shapes.push('circle'); return mock },
    strokeCircle() { shapes.push('ring'); return mock },
    fillTriangle() { shapes.push('petal'); return mock },
    lineBetween() { shapes.push('line'); return mock },
    fillRoundedRect() { shapes.push('rectangle'); return mock },
    strokeRoundedRect() { shapes.push('rectangle-border'); return mock },
  }
  return { graphics: mock as unknown as Phaser.GameObjects.Graphics, colors, shapes }
}

test('la manzanilla sembrada no se muestra como una planta adulta', () => {
  const { graphics, shapes, colors } = captureDrawing()
  paintObservedPlant(graphics, 'sown', 'Manzanilla', 'Matricaria chamomilla')
  expect(shapes.filter(shape => shape === 'petal')).toHaveLength(0)
  expect(colors).not.toContain(0xeac445)
  expect(shapes.filter(shape => shape === 'ellipse').length).toBeGreaterThan(3)
})

test('la brotación de manzanilla se dibuja sin flores ficticias', () => {
  const { graphics, shapes, colors } = captureDrawing()
  paintObservedPlant(graphics, 'sprout', 'Manzanilla', 'Matricaria chamomilla')
  expect(shapes.filter(shape => shape === 'petal')).toHaveLength(0)
  expect(colors).toContain(0x92c96a)
  expect(colors).not.toContain(0xeac445)
})

test('la etapa vegetativa de manzanilla representa hojas finamente divididas', () => {
  const { graphics, shapes, colors } = captureDrawing()
  paintObservedPlant(graphics, 'vegetative', 'Manzanilla', 'Matricaria chamomilla')
  expect(shapes.filter(shape => shape === 'line').length).toBeGreaterThan(80)
  expect(shapes).not.toContain('petal')
  expect(colors).toContain(0x9ccf68)
})

test('floración de manzanilla representa pétalos blancos, discos dorados y follaje', () => {
  const { graphics, shapes, colors } = captureDrawing()
  paintObservedPlant(graphics, 'flowering', 'Manzanilla', 'Matricaria chamomilla')
  expect(shapes.filter(shape => shape === 'petal').length).toBeGreaterThanOrEqual(48)
  expect(colors).toContain(0xeac445)
  expect(colors).toContain(0xfffcf0)
  expect(colors).toContain(0x9ccf68)
})

test('otras especies no reciben flores de manzanilla', () => {
  const { graphics, colors } = captureDrawing()
  paintObservedPlant(graphics, 'flowering', 'Romero', 'Salvia rosmarinus')
  expect(colors).not.toContain(0xeac445)
})
