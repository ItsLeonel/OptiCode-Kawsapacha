import type { GardenRegion } from '../../real-gardens/garden-region'
import type { SoilType } from '../../real-gardens/real-garden'

export type SoilStyle = Readonly<{ earth: number; shade: number; light: number; grain: number }>

/** Stylized material colors, never moisture, fertility or plant-health estimates. */
export const SOIL_STYLES: Record<SoilType, SoilStyle> = {
  loam: { earth: 0x81512f, shade: 0x4b2e1b, light: 0xb37a43, grain: 0xd09a62 },
  clay: { earth: 0xa75f37, shade: 0x6b3929, light: 0xd09265, grain: 0xe2b086 },
  sand: { earth: 0xbe9861, shade: 0x8b6b43, light: 0xe0c188, grain: 0xf3dfa7 },
  silt: { earth: 0x97816a, shade: 0x62513f, light: 0xc4a98b, grain: 0xddc4a5 },
  marl: { earth: 0xb1a18a, shade: 0x7c6b55, light: 0xd6c8ae, grain: 0xeee0c6 },
  heavyClay: { earth: 0x91664d, shade: 0x593f32, light: 0xc2936e, grain: 0xdcb08b },
  marsh: { earth: 0x655d46, shade: 0x3d392b, light: 0x928366, grain: 0xb5a17c },
  other: { earth: 0x8b6140, shade: 0x563c29, light: 0xbd9164, grain: 0xd7ad7e },
  unknown: { earth: 0x8b6140, shade: 0x563c29, light: 0xbd9164, grain: 0xd7ad7e },
}

export const REGION_STYLES: Record<GardenRegion, { sky: number; grass: number; grassLight: number; grassDark: number; path: number; stone: number }> = {
  sierra: { sky: 0x83c8ee, grass: 0x87a742, grassLight: 0xc9d46e, grassDark: 0x526c32, path: 0xbca576, stone: 0x9f987b },
  costa: { sky: 0x8bd5e8, grass: 0x88ab48, grassLight: 0xd7dc7c, grassDark: 0x52783c, path: 0xd5bd87, stone: 0xb1a68c },
  oriente: { sky: 0x9fc9c8, grass: 0x52813d, grassLight: 0xa8c95a, grassDark: 0x294f38, path: 0x9e9066, stone: 0x77816a },
  galapagos: { sky: 0x8bcacb, grass: 0x899669, grassLight: 0xc0c68f, grassDark: 0x566450, path: 0xb0a78b, stone: 0x61645c },
}
