import { cantonsForProvince, parishesForCanton, provinceForName, territoryLabel } from '../real-gardens/territory'
import { GARDEN_REGIONS, regionForProvince } from '../real-gardens/garden-region'

export type CommunityTerritory = { province: string; cantonCode: string; parishCode: string; sector: string }

export function communityTerritoryLabels(values: CommunityTerritory) {
  const province = provinceForName(values.province)
  const canton = cantonsForProvince(province?.code ?? '').find(item => item.code === values.cantonCode)
  const parish = parishesForCanton(canton?.code ?? '').find(item => item.code === values.parishCode)
  return {
    province: values.province,
    canton: canton ? territoryLabel(canton.name) : '',
    parish: parish ? territoryLabel(parish.name) : '',
    sector: values.sector.trim(),
    region: province ? GARDEN_REGIONS[regionForProvince(values.province)].label : '',
  }
}

export function validateCommunityTerritory(values: CommunityTerritory): Record<string, string> {
  const result: Record<string, string> = {}
  const province = provinceForName(values.province)
  const canton = cantonsForProvince(province?.code ?? '').find(item => item.code === values.cantonCode)
  const parish = parishesForCanton(canton?.code ?? '').find(item => item.code === values.parishCode)
  if (!province) result['cw-province'] = 'Elige una de las 24 provincias para encontrar tu región.'
  if (!canton) result['cw-cantonCode'] = 'Elige un cantón que pertenezca a la provincia seleccionada.'
  if (!parish) result['cw-parishCode'] = 'Elige una parroquia que pertenezca al cantón seleccionado.'
  if (values.sector.trim().length > 120) result['cw-sector'] = 'Usa hasta 120 caracteres para el sector o barrio.'
  return result
}

export function communityLocation(values: CommunityTerritory) {
  const labels = communityTerritoryLabels(values)
  return [labels.province, labels.canton, labels.parish, labels.sector && `Sector: ${labels.sector}`].filter(Boolean).join(' · ')
}
