import { test, expect } from '@playwright/test'
import { createPlantActions } from '../src/features/my-garden/plant-actions'
import { createActivityActions } from '../src/features/my-garden/journal/activity-actions'

function setter() { return () => undefined }

test('registro de planta visitante conserva comando, fotografía y navegación', async () => {
  const saved: Array<{ command: any; photos?: Array<{ id: string; blob: Blob }> }> = []
  const notices: string[] = []
  const details: Array<string | null> = []
  const journal = {
    data: { gardenId: 'garden-guest', activities: [] },
    async commit(command: any, photos?: Array<{ id: string; blob: Blob }>) {
      saved.push({ command, photos })
      return { terrain: null, activities: [] }
    },
  }
  const actions = createPlantActions({
    plantApi: {} as any, resolveMediaUrl: (url: string) => url,
    user: null, activeGardenId: null, activeCommunityId: null, activePlants: [],
    plants: [], communityRecord: {} as any, realGarden: {} as any, journal,
    editingPlant: undefined, detail: null, currentCommunityRole: null,
    setNotice: (msg: string) => notices.push(msg),
    setBackendPlants: setter(), setRegistration: setter(),
    setDetailId: (id: string | null) => details.push(id),
    setSelectedPlot: setter(), setServerActivityRevision: setter(),
    setEditingId: setter(), setPendingRegistration: setter(),
    reloadBackendActivities: async () => undefined,
    loadGardenForCommunity: async () => undefined, goto: setter(),
  } as any)
  const photo = new Blob(['imagen real'], { type: 'image/jpeg' })
  const result = await actions.addPlant({
    photo, species: { name: 'Romero', latin: 'Salvia rosmarinus', icon: '🌿' },
    plot: 2, requestId: 'request-123',
  })
  expect(result).toEqual({ ok: true })
  expect(saved).toHaveLength(1)
  expect(saved[0].command.type).toBe('plant-add')
  expect(saved[0].command.plant.plot).toBe(2)
  expect(saved[0].command.plant.name).toBe('Romero')
  expect(saved[0].command.plant.photoId).toBe(saved[0].photos?.[0].id)
  expect(saved[0].photos?.[0].blob).toBe(photo)
  expect(details).toContain('plant-request-123')
  expect(notices.some(msg => msg.includes('navegador'))).toBe(true)
})

test('actividad visitante conserva evidencia local y anulación', async () => {
  const calls: any[] = []
  const messages: string[] = []
  const activity = {
    id: 'activity-one', type: 'watering' as const, date: '2026-11-01',
    responsible: 'Agricultora', target: { kind: 'garden' as const },
    notes: 'Riego cuidadoso', details: {},
  }
  const journal = {
    data: { gardenId: 'garden-guest', activities: [] },
    async commit(command: any, photos?: any[]) {
      calls.push({ command, photos })
      return { activities: [{ ...activity, details: {}, createdAt: new Date().toISOString() }] }
    },
  }
  const actions = createActivityActions({
    activityApi: {} as any,
    user: null, activeGardenId: null, backendPlants: [],
    realGarden: {} as any, communityRecord: {} as any, plants: [],
    backendCommunity: null, activeCommunityId: null, selectedPlot: null,
    setDetailId: setter(), setActivityForm: setter(), goto: setter(),
    setNotice: (msg: string) => messages.push(msg),
    reloadBackendActivities: async () => undefined, loadGardenForCommunity: async () => undefined,
    reloadServerRewards: async () => undefined, loadPendingInvitations: async () => undefined,
    setServerActivityRevision: setter(), screen: 'Bitácora',
    setFeedback: setter(), journal,
  } as any)
  const photo = new Blob(['evidencia'], { type: 'image/jpeg' })
  await actions.saveActivity({ ...activity, photo })
  expect(calls[0].command.type).toBe('activity')
  expect(calls[0].command.activity.gardenId).toBe('garden-guest')
  expect(calls[0].command.activity.photoIds).toHaveLength(1)
  expect(calls[0].photos[0].blob).toBe(photo)
  await actions.voidActivity(activity.id, 'Registro duplicado')
  expect(calls[1].command.type).toBe('activity-void')
  expect(calls[1].command.activityId).toBe(activity.id)
  expect(messages.some(msg => msg.includes('historial'))).toBe(true)
})
