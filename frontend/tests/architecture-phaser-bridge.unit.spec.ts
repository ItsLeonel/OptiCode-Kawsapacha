import { test, expect } from '@playwright/test'
import { GardenSceneBridge, type SceneSnapshot } from '../src/features/my-garden/phaser-poc/bridge'
import type { GardenVisualModel, SlotId } from '../src/features/my-garden/phaser-poc/model'

const model = {} as GardenVisualModel
const plot = 'garden-slot-0' as SlotId

test('puente Phaser mantiene instancias aisladas y cancela eventos bloqueados', () => {
  const a = new GardenSceneBridge({ model, selected: null, blocked: false })
  const b = new GardenSceneBridge({ model, selected: null, blocked: false })
  const received: string[] = []
  const unrelated: string[] = []
  const unbindA = a.onEvent(event => received.push(event.type))
  b.onEvent(event => unrelated.push(event.type))
  a.emit({ type: 'activate-slot', slot: plot })
  expect(received).toEqual(['activate-slot'])
  expect(unrelated).toEqual([])

  const blocked: SceneSnapshot = { model, selected: plot, blocked: true }
  a.command({ type: 'snapshot', snapshot: blocked })
  a.emit({ type: 'activate-slot', slot: plot })
  a.emit({ type: 'hover-slot', slot: plot })
  expect(received).toEqual(['activate-slot', 'hover-slot'])
  expect(a.snapshot).toEqual(blocked)
  expect(b.snapshot.blocked).toBe(false)

  unbindA()
  a.emit({ type: 'hover-slot', slot: null })
  expect(received).toHaveLength(2)
})

test('puente Phaser transporta comandos visuales sin conocer API ni sesión', () => {
  const bridge = new GardenSceneBridge({ model, selected: null, blocked: false })
  const commands: string[] = []
  const unbind = bridge.onCommand(cmd => commands.push(cmd.type))
  bridge.command({ type: 'zoom', factor: 1.2 })
  bridge.command({ type: 'focus-slot', slot: plot })
  bridge.command({ type: 'reset-camera' })
  expect(commands).toEqual(['zoom', 'focus-slot', 'reset-camera'])
  unbind()
  bridge.command({ type: 'clear-focus' })
  expect(commands).toHaveLength(3)
})
