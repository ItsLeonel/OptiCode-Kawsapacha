import { createRewardService } from './application/rewards.service'
import { prismaRewardRepository } from './infrastructure/prisma-reward.repository'
export const {getUserRewardsSummary,evaluateActivityReward}=createRewardService(prismaRewardRepository)
export {revertActivityReward} from './infrastructure/prisma-reward-reversal'
