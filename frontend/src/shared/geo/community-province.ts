import { provinceForName, territoryLabel } from './territory'
import { provinces } from '../components/EcuadorMap'

/** Normaliza provincia para DTOs de comunidad, incluida ubicación heredada. */
export function communityProvince(community: { province?: string; location: string } | null | undefined) {
  const recorded = provinceForName(community?.province ?? '')
  const legacy = provinceForName((community?.location ?? '').split(/\s*[·,|]\s*/)[0])
  const province = recorded ?? legacy
  return province ? provinces.find(name => provinceForName(name)?.code === province.code) ?? territoryLabel(province.name) : ''
}
