import catalogue from './data/dpa-2026.json'

export const normalizeTerritory = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-EC')
export const territoryLabel = (value: string) => value.toLocaleLowerCase('es-EC').replace(/(^|[\s(\-/])\p{L}/gu, letter => letter.toLocaleUpperCase('es-EC'))
export const officialProvinces = catalogue.provinces
export const officialCantons = catalogue.cantons
export const officialParishes = catalogue.parishes
export const provinceForName = (name: string) => officialProvinces.find(item => normalizeTerritory(item.name) === normalizeTerritory(name))
export const cantonsForProvince = (provinceCode: string) => officialCantons.filter(item => item.provinceCode === provinceCode)
export const parishesForCanton = (cantonCode: string) => officialParishes.filter(item => item.cantonCode === cantonCode)
