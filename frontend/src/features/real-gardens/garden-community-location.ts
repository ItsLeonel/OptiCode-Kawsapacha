import type { Community } from '../communities/communities'
import type { RealGardenDraft } from './real-garden'

export function withCommunityLocation(draft: RealGardenDraft, community: Community): RealGardenDraft {
  return {
    ...draft,
    province: community.province ?? '',
    cantonCode: community.cantonCode ?? '',
    parishCode: community.parishCode ?? '',
    reference: community.sector ?? '',
    coordinates: null,
  }
}

export function matchesCommunityLocation(draft: RealGardenDraft, community: Community | null) {
  return Boolean(community?.province) && draft.province === community?.province &&
    draft.cantonCode === (community?.cantonCode ?? '') && draft.parishCode === (community?.parishCode ?? '')
}
