import { provinceForName } from './territory'

export const GARDEN_REGIONS = {
  sierra: { label: 'Sierra', background: new URL('../../assets/regiones/fondo_sierra_kawsapacha.png', import.meta.url).href },
  costa: { label: 'Costa', background: new URL('../../assets/regiones/fondo_costa_kawsapacha.png', import.meta.url).href },
  oriente: { label: 'Amazonía', background: new URL('../../assets/regiones/fondo_oriente_kawsapacha.png', import.meta.url).href },
  galapagos: { label: 'Galápagos', background: new URL('../../assets/regiones/fondo_galapagos_kawsapacha.png', import.meta.url).href },
} as const

export type GardenRegion = keyof typeof GARDEN_REGIONS

// Natural regions used by INEC: https://www.censoecuador.gob.ec/public/Boletin_Nacional.htm
// Keys are the official two-digit province identifiers from DPA 2026.
const REGION_BY_PROVINCE_CODE: Record<string, GardenRegion> = {
  '01': 'sierra', '02': 'sierra', '03': 'sierra', '04': 'sierra',
  '05': 'sierra', '06': 'sierra', '07': 'costa', '08': 'costa',
  '09': 'costa', '10': 'sierra', '11': 'sierra', '12': 'costa',
  '13': 'costa', '14': 'oriente', '15': 'oriente', '16': 'oriente',
  '17': 'sierra', '18': 'sierra', '19': 'oriente', '20': 'galapagos',
  '21': 'oriente', '22': 'oriente', '23': 'costa', '24': 'costa',
}

export function regionForProvince(province: string): GardenRegion {
  const code = provinceForName(province)?.code
  return code ? REGION_BY_PROVINCE_CODE[code] ?? 'sierra' : 'sierra'
}
