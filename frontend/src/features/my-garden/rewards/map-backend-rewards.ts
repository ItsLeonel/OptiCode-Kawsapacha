import type { RewardsSummary } from '../../../shared/api/client'
import type { AuthoritativeRewards, RewardBadgeId, RewardMissionId, RewardLevel } from './rewards-types'

/** Adaptación del estado de recompensas del servidor para la interfaz. */
export function toAuthoritativeRewards(summary: RewardsSummary): AuthoritativeRewards {
    const badgeMap: Record<string, RewardBadgeId> = {
      FIRST_SOWING: 'first-sowing',
      'first-sowing': 'first-sowing',
      CARE_EXCELLENCE: 'care',
      care: 'care',
      MINDFUL_OBSERVER: 'observer',
      observer: 'observer',
      BOUNTIFUL_HARVEST: 'harvest',
      harvest: 'harvest',
    }
    const missionMap: Record<string, RewardMissionId> = {
      ROOT_CARE: 'care',
      care: 'care',
      OBSERVATION_JOURNAL: 'observer',
      observer: 'observer',
      LUNAR_RHYTHM: 'lunar',
      'lunar-cycle': 'lunar',
      lunar: 'lunar',
    }
    return {
      source: 'server',
      seeds: summary.points,
      level: (['Aprendiz', 'Oficial', 'Maestro'].includes(summary.level) ? summary.level : 'Aprendiz') as RewardLevel,
      nextLevel: (summary.nextLevel && ['Aprendiz', 'Oficial', 'Maestro'].includes(summary.nextLevel) ? summary.nextLevel : undefined) as RewardLevel | undefined,
      progressPercent: summary.progressPercent,
      remaining: summary.remaining,
      badges: (['first-sowing', 'care', 'observer', 'harvest'] as RewardBadgeId[]).map(id => {
        const match = summary.badges.find(b => {
          const rawCode = (b as any).badgeId || (b as any).code
          return badgeMap[rawCode] === id
        })
        return { id, earned: Boolean(match), earnedAt: match?.earnedAt }
      }),
      missions: (['care', 'observer', 'lunar'] as RewardMissionId[]).map(id => {
        const match = summary.missions.find(m => {
          const rawCode = (m as any).missionId || (m as any).code
          return missionMap[rawCode] === id
        })
        return {
          id,
          current: match ? (match as any).currentValue ?? (match as any).progress ?? 0 : 0,
          target: match ? (match as any).targetValue ?? (match as any).targetCount ?? 3 : 3,
          completed: match ? Boolean((match as any).completed || (match as any).status === 'COMPLETED') : false,
          rewardSeeds: (match as any)?.rewardPoints ?? 20,
        }
      }),
    }
  }
