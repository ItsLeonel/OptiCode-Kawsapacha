import { createRewardService } from './application/rewards.service'
import { prismaRewardRepository } from './infrastructure/prisma-reward.repository'
export const {getUserRewardsSummary,evaluateActivityReward}=createRewardService(prismaRewardRepository)
export {revertActivityReward} from './infrastructure/prisma-reward-reversal'
export { BASE_POINTS, USER_LEVELS } from './domain/reward-rules'
export type { ActivityType } from './domain/reward-rules'
