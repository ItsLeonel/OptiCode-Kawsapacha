import { test, expect } from '@playwright/test'
import { filterRewardReviews, isAuthoritativeRewardReview, type AuthoritativeRewardReview } from '../src/features/my-garden/rewards/reward-review'

const serverData: AuthoritativeRewardReview = {
  source: 'server', updatedAt: '2026-11-13T22:00:00Z',
  totals: { provisional: 15, confirmed: 20, reverted: 5 },
  entries: [
    { id: 'e1', evidenceId: 'photo-1', activityName: 'Riego', submittedAt: '2026-11-12T11:00:00Z', status: 'PENDING', effect: 'provisional', points: 5 },
    { id: 'e2', evidenceId: 'photo-2', activityName: 'Siembra', submittedAt: '2026-11-11T11:00:00Z', status: 'APPROVED', effect: 'confirmed', points: 20 },
    { id: 'e3', evidenceId: 'photo-3', activityName: 'Abonado', submittedAt: '2026-11-10T11:00:00Z', status: 'REJECTED', effect: 'reverted', points: 5 },
  ],
}

test('revisión oficial valida saldos y los filtros no alteran los datos', () => {
  expect(isAuthoritativeRewardReview(serverData)).toBe(true)
  expect(filterRewardReviews(serverData.entries, 'APPROVED')).toHaveLength(1)
  expect(filterRewardReviews(serverData.entries, 'ALL')).toHaveLength(3)
  expect(serverData.totals).toEqual({ provisional: 15, confirmed: 20, reverted: 5 })
})

test('rechaza saldos inventados y registros de revisión mal formados', () => {
  expect(isAuthoritativeRewardReview(null)).toBe(false)
  expect(isAuthoritativeRewardReview({ ...serverData, source: 'local' })).toBe(false)
  expect(isAuthoritativeRewardReview({ ...serverData, totals: { provisional: -5, confirmed: 20, reverted: 5 } })).toBe(false)
  expect(isAuthoritativeRewardReview({ ...serverData, entries: [{ ...serverData.entries[0], status: 'INVENTED' }] })).toBe(false)
  expect(isAuthoritativeRewardReview({ ...serverData, entries: [serverData.entries[0], serverData.entries[0]] })).toBe(false)
})
