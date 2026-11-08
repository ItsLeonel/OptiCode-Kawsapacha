import costa from '../../assets/comunidad-v3/fondos/fondo_comunidad_costa_v3.png'
import sierra from '../../assets/comunidad-v3/fondos/fondo_comunidad_sierra_v3.png'
import oriente from '../../assets/comunidad-v3/fondos/fondo_comunidad_oriente_v3.png'
import galapagos from '../../assets/comunidad-v3/fondos/fondo_comunidad_galapagos_v3.png'
import guiaCosta from '../../assets/comunidad-v3/personajes/personaje_costa_v3.png'
import guiaSierra from '../../assets/comunidad-v3/personajes/personaje_sierra_v3.png'
import guiaOriente from '../../assets/comunidad-v3/personajes/personaje_oriente_v3.png'
import guiaGalapagos from '../../assets/comunidad-v3/personajes/personaje_galapagos_v3.png'

export type GameRegion = 'costa' | 'sierra' | 'oriente' | 'galapagos'

export const gameRegionAssets = {
  costa: { label: 'Costa', background: costa, guide: guiaCosta },
  sierra: { label: 'Sierra', background: sierra, guide: guiaSierra },
  oriente: { label: 'Amazonía', background: oriente, guide: guiaOriente },
  galapagos: { label: 'Galápagos', background: galapagos, guide: guiaGalapagos },
} as const
