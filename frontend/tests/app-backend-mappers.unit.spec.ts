import { test, expect } from '@playwright/test'
import { mapBackendActivity } from '../src/features/my-garden/journal/map-backend-activity'
import { toAuthoritativeRewards } from '../src/features/my-garden/rewards/map-backend-rewards'
import type { BackendActivity, RewardsSummary } from '../src/shared/api/client'

test('el adaptador de Bitácora conserva datos y evidencia al cambiar de capa', () => {
  const raw: BackendActivity = {
    id: 'act-1', gardenId: 'garden-1', actorUserId: 'user-1', type: 'watering',
    performedDate: '2026-11-15', targetKind: 'plant', plantId: 'plant-1', plotIndex: 2,
    notes: 'Riego moderado', details: '{"waterMl":500}', createdAt: '2026-11-15T12:00:00Z',
    evidences: [{ id: 'img-1', activityId: 'act-1', filePath: 'plants/1.png', fileUrl: '/uploads/plants/1.png', mimeType: 'image/png', fileSize: 5, createdAt: '2026-11-15T12:00:00Z' }],
    actorUser: { id: 'user-1', name: 'Agricultora', email: 'test@example.org' },
  }
  const result = mapBackendActivity(raw)
  expect(result.gardenId).toBe('garden-1')
  expect(result.responsible).toBe('Agricultora')
  expect(result.target).toEqual({ kind: 'plant', plantId: 'plant-1', plot: 2 })
  expect(result.photos).toEqual(['/uploads/plants/1.png'])
  expect(result.photoIds).toEqual(['act-1-photo-0'])
  expect(result.details).toEqual({ waterMl: 500 })
})

test('el adaptador de recompensas conserva puntos, insignias y misiones', () => {
  const raw: RewardsSummary = {
    userId:'user', points:80, level:'Aprendiz', nextLevel:'Oficial', remaining:20,
    progressPercent:80, ledger:[],
    badges:[{badgeId:'FIRST_SOWING',earnedAt:'2026-11-15T12:00:00Z'}],
    missions:[{missionId:'ROOT_CARE', currentValue:2,targetValue:3,completed:false,rewardPoints:20}],
  }
  const value=toAuthoritativeRewards(raw)
  expect(value.seeds).toBe(80)
  expect(value.badges.find(b=>b.id==='first-sowing')?.earned).toBe(true)
  expect(value.missions.find(m=>m.id==='care')?.current).toBe(2)
  expect(value.level).toBe('Aprendiz')
})
